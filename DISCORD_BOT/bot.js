// Charge les variables d'environnement depuis un fichier .env
require('dotenv').config();

// Node 17+ : par défaut le DNS peut privilégier l’IPv6 ; la voix Discord (UDP + WS) est souvent
// plus stable en IPv4. Sans cela, la poignée de main peut rester bloquée puis repasser en « signalling ».
const dns = require('node:dns');
try {
    dns.setDefaultResultOrder('ipv4first');
} catch (_) {}

// Prépare libsodium (utilisé par le receiver audio de discord.js)
const sodium = require('libsodium-wrappers');

const axios = require('axios');
const FormData = require('form-data');

// Configuration Backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
/** Doit correspondre à POST /meeting/process/:lang côté serveur (fr, en, de, es). */
const MEETING_LANG = process.env.MEETING_LANG || "fr";
let backendToken = null; // On stockera le token ici
// Import des éléments principaux de discord.js
const { Client, GatewayIntentBits, Events, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');

// Fonctions pour rejoindre et gérer les connexions vocales
const {
    joinVoiceChannel,
    EndBehaviorType,
    getVoiceConnection,
    createAudioPlayer,
    createAudioResource,
    StreamType,
    entersState,
    VoiceConnectionStatus,
    VoiceConnectionDisconnectReason,
    VoiceConnection,
} = require("@discordjs/voice");

/** Aide interprétation : codes Discord voice (doc) vs codes WebSocket RFC. */
function voiceCloseHint(code) {
    if (typeof code !== "number") return "";
    const discord = {
        4001: "opcode inconnu",
        4002: "payload invalide",
        4003: "non authentifié",
        4004: "auth échouée",
        4005: "déjà authentifié",
        4006: "session invalide",
        4009: "session expirée",
        4011: "serveur introuvable",
        4012: "protocole inconnu (SelectProtocol)",
        4014: "déconnecté",
        4015: "crash serveur vocal",
        4016: "mode de chiffrement inconnu",
        4017: "E2EE / protocole DAVE requis (mets à jour @discordjs/voice ≥0.19 + Node ≥22.12)",
    };
    if (discord[code]) return ` — Discord: ${discord[code]}`;
    const ws = {
        1000: "fermeture normale",
        1001: "going away",
        1006: "fermeture anormale (souvent réseau / reset TCP)",
        1011: "erreur serveur",
    };
    if (ws[code]) return ` — WebSocket: ${ws[code]}`;
    return "";
}

/**
 * Log le code réel de fermeture du WS vocal (indispensable pour comprendre Hello → close sans Ready).
 */
function patchVoiceNetworkingCloseLog() {
    const orig = VoiceConnection.prototype.onNetworkingClose;
    VoiceConnection.prototype.onNetworkingClose = function (code) {
        if (process.env.VOICE_DEBUG === "1") {
            console.warn("[Voice networking close]", "code =", code, voiceCloseHint(code));
        }
        return orig.call(this, code);
    };
}
patchVoiceNetworkingCloseLog();

/**
 * Mitigation @discordjs/voice : plusieurs VOICE_SERVER_UPDATE / ordre des paquets peuvent appeler
 * configureNetworking() deux fois de suite ; la 2ᵉ destruction tue le WebSocket en phase Identifying
 * (après Hello, avant Ready). On fusionne les appels, ignore les doublons (même endpoint/token/session
 * pendant « connecting »), et on relance la config quand l’état arrive (signalling seulement).
 *
 * Désactiver pour test : VOICE_DISABLE_NET_PATCHES=1
 */
function patchVoiceConnectionNetworkingDebounce() {
    if (process.env.VOICE_DISABLE_NET_PATCHES === "1") {
        console.log("[Voice] patches réseau désactivés (VOICE_DISABLE_NET_PATCHES=1)");
        return;
    }
    const DEBOUNCE_MS = 500;
    const originalConfigure = VoiceConnection.prototype.configureNetworking;
    const originalAddState = VoiceConnection.prototype.addStatePacket;

    function sessionKey(vc) {
        const { server, state } = vc.packets;
        if (!server?.endpoint || !state?.session_id) return null;
        return `${server.endpoint}|${server.token}|${state.session_id}|${state.user_id}`;
    }

    function scheduleConfigure(vc) {
        clearTimeout(vc._voiceConfigureTimer);
        vc._voiceConfigureTimer = setTimeout(() => {
            vc._voiceConfigureTimer = undefined;
            if (vc.state.status === VoiceConnectionStatus.Destroyed) return;

            const key = sessionKey(vc);
            if (!key) return;

            // 2ᵉ VOICE_SERVER_UPDATE identique pendant que le 1er WS n’a pas encore reçu « Ready »
            if (
                vc.state.status === VoiceConnectionStatus.Connecting &&
                vc._voiceSessionKey === key
            ) {
                return;
            }

            originalConfigure.call(vc);

            if (vc.state.status === VoiceConnectionStatus.Connecting) {
                vc._voiceSessionKey = key;
            }
        }, DEBOUNCE_MS);
    }

    VoiceConnection.prototype.configureNetworking = function () {
        scheduleConfigure(this);
    };

    VoiceConnection.prototype.addStatePacket = function (packet) {
        originalAddState.call(this, packet);
        // Ne jamais relancer la config une fois « ready ».
        if (this.state.status === VoiceConnectionStatus.Ready) return;
        // Important : si on replanifie pendant « connecting », un 2ᵉ configureNetworking()
        // détruit le WebSocket encore en Identifying (Hello → fermeture avant Ready). On ne
        // complète la config depuis l’état que tant qu’on est encore en « signalling ».
        if (this.state.status !== VoiceConnectionStatus.Signalling) return;
        if (this.packets.server?.endpoint && this.packets.state) {
            scheduleConfigure(this);
        }
    };
}
patchVoiceConnectionNetworkingDebounce();

// Décodage Opus et manipulation des flux audio
const prism = require('prism-media');
const fs = require('fs');
const { Readable } = require('stream');
const ffmpeg = require('ffmpeg-static');
const cp = require('child_process');

/** PCM stéréo 48 kHz, 20 ms (format attendu par createAudioResource + StreamType.Raw). */
const SILENCE_FRAME_STEREO = Buffer.alloc(48000 * 0.02 * 2 * 2);

/**
 * Contournement du bug « Speak to Start » : Discord n’envoie souvent aucun paquet entrant
 * tant que le bot n’a pas émis au moins un flux audio sur le canal.
 * On joue du silence en stéréo 48 kHz (Raw) en continu jusqu’à nettoyage.
 */
function startVoiceKeepAlive(connection) {
    const player = createAudioPlayer();
    const stream = new Readable({ read() {} });
    const silenceInterval = setInterval(() => {
        stream.push(SILENCE_FRAME_STEREO);
    }, 20);
    const resource = createAudioResource(stream, { inputType: StreamType.Raw });
    connection.subscribe(player);
    player.play(resource);
    return {
        player,
        stream,
        silenceInterval,
        stop() {
            clearInterval(this.silenceInterval);
            try {
                this.player.stop(true);
            } catch (_) {}
            this.stream.destroy();
        },
    };
}

// Création du client Discord avec les intentions nécessaires
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates, // pour suivre qui est dans les salons vocaux
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Map pour stocker les enregistrements actifs par guildId
const activeRecordings = new Map();

// AJOUT CORRECTIF : Liste pour éviter d'enregistrer 2 fois la même personne en même temps
const subscribedUsers = new Set();

async function authenticateBot() {
    try{
        const response = await axios.get(`${BACKEND_URL}/auth/token`);
        if(response.data && response.data.token){
            backendToken = response.data.token;
            console.log("Token backend récupéré (ne pas logger la valeur en production).");
        }
        else{
            console.error("Erreur: Token backend non reçu");
        }
    } catch (error){
        console.error("Erreur lors de l'authentification du bot:", error);
        console.log(`Tentative sur : ${BACKEND_URL}/auth/token`);
    }
}

async function sendToBackend(filePath, message) {
    if(!backendToken){
        await authenticateBot();
        if(!backendToken){
            return message.reply("Impossible d'authentifier le bot avec le backend.");
        }
    }
    try{
        // On prévient l'utilisateur que l'IA travaille
        const processingMsg = await message.reply("⏳ Envoi au serveur et génération du résumé en cours...");

        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        const response = await axios.post(
            `${BACKEND_URL}/meeting/process/${MEETING_LANG}`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${backendToken}`,
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );
        
        const data = response.data;
        console.log("Réponse du backend:", data);
        
        const filesToSend = [];

        // 1. Préparation du MP3 local pour l'envoi
        if (fs.existsSync(filePath)) {
            filesToSend.push(new AttachmentBuilder(filePath, { name: 'audio_reunion.mp3' }));
        }

        // 2. Téléchargement du PDF depuis le backend en mémoire vive
        if(data.files && data.files.pdf){
            console.log("📄 Téléchargement du PDF depuis le backend...");
            const pdfResponse = await axios.get(`${BACKEND_URL}/meeting/result/pdf`, {
                headers: { 'Authorization': `Bearer ${backendToken}` },
                responseType: 'arraybuffer' // Essentiel pour les fichiers
            });
            
            const pdfBuffer = Buffer.from(pdfResponse.data, 'binary');
            filesToSend.push(new AttachmentBuilder(pdfBuffer, { name: 'resume_reunion.pdf' }));
        }

        // 3. Mise à jour du message Discord avec les fichiers attachés
        let replyText = "**✅ Analyse terminée ! Voici le résumé et l'enregistrement :**";
        if (filesToSend.length === 0) replyText = "Le traitement est fini, mais je n'ai pas pu générer les fichiers.";

        await processingMsg.edit({
            content: replyText,
            files: filesToSend
        });

    } catch(error){
        console.error("Erreur upload:", error.response ? error.response.data : error.message);
        message.reply(`❌ Erreur lors du traitement: ${error.message}`);
    }
}

client.once(Events.ClientReady, async () => {
    await sodium.ready;
    console.log(`Bot connecté et Sodium chargé ! (Tag: ${client.user.tag})`);

    await authenticateBot();
});
// Écoute des messages pour traiter les commandes simples
client.on('messageCreate', async (message) => {
    // On ne traite que les messages commençant par '!'
    if (!message.content.startsWith('!')) return;

    // --- COMMANDE JOIN ---
    if (message.content === '!join') {
        // Vérifie que l'utilisateur est bien dans un salon vocal
        if (message.member.voice.channel) {
            const channel = message.member.voice.channel;
            const me = channel.guild.members.me;
            if (!me) {
                return message.reply("Je ne vois pas mes permissions sur ce serveur (cache membre).");
            }
            const perms = channel.permissionsFor(me);
            if (!perms.has(PermissionFlagsBits.Connect) || !perms.has(PermissionFlagsBits.Speak)) {
                return message.reply(
                    "Il me faut les permissions **Connexion** et **Parler** sur ce salon vocal pour négocier l’audio."
                );
            }

            // CORRECTION: On utilise un fichier temporaire .pcm (audio brut) pour éviter la surcharge CPU
            const rawFileName = `temp_${message.guild.id}.pcm`;

            // Éviter une connexion zombie (rejoin partiel / état bloqué) : tout détruire avant un nouveau join.
            const previous = getVoiceConnection(message.guild.id);
            if (previous) {
                try {
                    previous.destroy();
                } catch (_) {}
                await new Promise((r) => setTimeout(r, 750));
            }

            const voiceDebug = process.env.VOICE_DEBUG === "1";

            // On rejoint le salon vocal
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
                debug: voiceDebug,
            });
            console.log("Rejoint le salon vocal:", channel.name);

            // Avec debug: true, @discordjs/voice émet sur connection "debug" (WS / NW / UDP) — rien n’apparaît sans ce listener.
            const onVoiceDebug = voiceDebug
                ? (msg) => {
                      console.log("[Voice debug]", msg);
                  }
                : null;
            if (onVoiceDebug) connection.on("debug", onVoiceDebug);

            const logVoiceState = (oldState, newState) => {
                const line = `[Voice] ${oldState.status} → ${newState.status}`;
                if (oldState.status === "connecting" && newState.status === "signalling") {
                    console.warn(
                        line +
                            " — le WebSocket vocal s’est fermé avant le paquet « Ready » (souvent pas encore l’UDP applicatif). Causes possibles : pare-feu / proxy sur le **WSS** (443/8443), règles UFW trop fines, VPN, IPv6. Test : `sudo ufw disable` puis relancer le bot ; si ça ne change rien, ce n’est probablement pas « seulement » l’UDP."
                    );
                } else {
                    console.log(line);
                }
            };
            connection.on("stateChange", logVoiceState);
            const onVoiceError = (err) => console.error("[Voice error]", err);
            connection.on("error", onVoiceError);

            try {
                // 90 s : boucles signalling↔connecting (WS qui se ferme ou reconfiguration).
                await entersState(connection, VoiceConnectionStatus.Ready, 90_000);
            } catch (e) {
                console.error("Connexion vocale pas prête:", e);
                const st = connection.state;
                if (st.status === VoiceConnectionStatus.Disconnected) {
                    console.error("Raison déconnexion:", st.reason, VoiceConnectionDisconnectReason[st.reason]);
                } else {
                    console.error("État final:", st.status);
                }
                connection.off("stateChange", logVoiceState);
                connection.off("error", onVoiceError);
                if (onVoiceDebug) connection.off("debug", onVoiceDebug);
                connection.destroy();
                return message.reply(
                    "Connexion vocale impossible (timeout). Essaie sans VPN, teste avec le pare-feu désactivé un instant (`sudo ufw disable`), ou un autre réseau (4G). `VOICE_DEBUG=1` pour les logs. Le correctif DNS IPv4 est déjà actif dans ce fichier."
                );
            }
            connection.off("stateChange", logVoiceState);

            // Speak to Start : émettre du silence pour que Discord envoie l’audio entrant.
            const keepAlive = startVoiceKeepAlive(connection);

            // Voix Discord = Opus mono 48 kHz → PCM s16le mono pour FFmpeg.
            const ffmpegProcess = cp.spawn(ffmpeg, [
                '-f', 's16le', '-ar', '48000', '-ac', '1', '-i', 'pipe:0',
                '-f', 's16le', '-ar', '48000', '-ac', '1',
                '-y', rawFileName
            ], { stdio: ['pipe', 'pipe', 'pipe'] });

            // AJOUT CORRECTIF : Augmente la limite pour éviter le warning "MaxListenersExceededWarning"
            ffmpegProcess.stdin.setMaxListeners(100);

            ffmpegProcess.stdin.on('error', (e) => { 
                if (e.code !== 'EPIPE') console.log("Erreur FFmpeg Stdin:", e); 
            });

            ffmpegProcess.stderr.on('data', (data) => {
                // FFmpeg peut envoyer des infos utiles sur stderr
                // console.log(`FFmpeg: ${data}`); 
            });

            const receiver = connection.receiver;

            // Quand un utilisateur commence à parler
            receiver.speaking.on('start', (userId) => {
                // AJOUT CORRECTIF : Si on écoute déjà cet utilisateur, on arrête tout de suite (Anti-Echo)
                if (subscribedUsers.has(userId)) return;
                
                // On l'ajoute à la liste des gens écoutés
                subscribedUsers.add(userId);
                
                console.log(`${userId} parle...`);

                // On s'abonne au flux Opus de l'utilisateur
                const opusStream = receiver.subscribe(userId, {
                    end: {
                        behavior: EndBehaviorType.AfterSilence,
                        duration: 1000, 
                    },
                });

                // Décodeur Opus vers PCM
                const decoder = new prism.opus.Decoder({
                    rate: 48000,
                    channels: 1,
                    frameSize: 960,
                });

                decoder.on('error', (e) => {
                    // Ignorer certaines erreurs de flux corrompu
                    if (e.message && e.message.includes('corrupted')) {
                        return;
                    }
                    console.log(`Erreur Décodeur: ${e.message}`);
                });

                opusStream.on('end', () => {
                    subscribedUsers.delete(userId);
                });

                opusStream.on('error', (e) => {
                    console.log(`Erreur Stream Opus: ${e.message}`);
                    subscribedUsers.delete(userId);
                });

                try {
                    // On relie le flux Opus -> décodeur -> stdin de FFmpeg
                    opusStream.pipe(decoder);
                    // AJOUT CORRECTIF : { end: false } est vital pour ne pas fermer le fichier global
                    decoder.pipe(ffmpegProcess.stdin, { end: false });
                } catch (e) {
                    console.log("Erreur tuyauterie:", e);
                    subscribedUsers.delete(userId);
                }
            });

            // On garde la trace de la connexion et du processus FFmpeg
            // CORRECTION: On stocke aussi le nom du fichier RAW pour le retrouver au stop
            activeRecordings.set(message.guild.id, { connection, ffmpegProcess, rawFileName, keepAlive });
            message.reply("Je suis la !!");
        
        } else {
            message.reply("Tu dois être dans un salon vocal.");
        }
    }

    // --- COMMANDE STOP ---
    if (message.content === '!stop') {
        const recording = activeRecordings.get(message.guild.id);
        if (!recording) return message.reply("Je n'enregistre rien.");

        message.reply("Enregistrement fini. Conversion et envoi au serveur...");

        if (recording.keepAlive) recording.keepAlive.stop();
        recording.connection.destroy();
        subscribedUsers.clear();
        
        setTimeout(() => {
            recording.ffmpegProcess.stdin.end();

            const mp3FileName = 'enregistrement.mp3';
            
            const convertProcess = cp.spawn(ffmpeg, [
                '-f', 's16le', '-ar', '48000', '-ac', '1', '-i', recording.rawFileName,
                '-b:a', '128k',
                '-y', mp3FileName
            ]);

            convertProcess.on('close', async () => {
                console.log("Conversion terminée.");
                
                // Nettoyage fichier RAW
                try { fs.unlinkSync(recording.rawFileName); } catch(e){}
                activeRecordings.delete(message.guild.id);

                // --- ENVOI AU BACKEND ---
                await sendToBackend(mp3FileName, message);
                try { fs.unlinkSync(mp3FileName); } catch(e){}
            });

        }, 500);
    }

    // --- COMMANDE LEAVE ---
    if (message.content === '!leave') {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            const recording = activeRecordings.get(message.guild.id);
            if (recording?.keepAlive) recording.keepAlive.stop();
            connection.destroy();
            if (recording) {
                // Si on a un enregistrement actif, on ferme aussi FFmpeg
                recording.ffmpegProcess.stdin.end();
                try { fs.unlinkSync(recording.rawFileName); } catch(e){} // Nettoyage si on part sauvagement
                activeRecordings.delete(message.guild.id);
                subscribedUsers.clear();
            }
            message.reply("Salam");
        } else {
            message.reply("Pas connecté.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);