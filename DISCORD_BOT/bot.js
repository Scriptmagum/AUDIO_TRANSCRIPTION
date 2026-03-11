// Charge les variables d'environnement
require('dotenv').config();

// Prépare libsodium
const sodium = require('libsodium-wrappers');

// Import discord.js
const { Client, GatewayIntentBits, Events } = require('discord.js');

// Gestion vocale
const { joinVoiceChannel, EndBehaviorType, getVoiceConnection } = require("@discordjs/voice");

// Outils fichiers et audio
const prism = require('prism-media');
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');
const cp = require('child_process');

// Requêtes HTTP
const axios = require('axios');
const FormData = require('form-data');

// Configuration Backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// VARIABLE GLOBALE POUR LE TOKEN
let globalBotToken = null;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const activeRecordings = new Map();
const subscribedUsers = new Set();

/**
 * Fonction pour s'authentifier (appelée au démarrage)
 */
async function authenticateBot() {
    if (globalBotToken) return globalBotToken;

    try {
        const authUrl = `${BACKEND_URL}/auth/token`;
        console.log(`🔑 Authentification en cours sur : ${authUrl}`);
        
        const response = await axios.get(authUrl);
        
        if (response.data && response.data.token) {
            globalBotToken = response.data.token;
            console.log(`✅ Token récupéré avec succès ! (UUID: ${response.data.uuid})`);
        } else {
            console.error("❌ Le serveur a répondu (Code 200), mais impossible de trouver le '.token' !");
            console.log("👉 Réponse exacte :", response.data);
        }
    } catch (error) {
        console.error("❌ Échec de l'authentification au démarrage.");
        if (error.response && error.response.status === 429) {
            console.error(`   Trop de requêtes ! Tu as atteint la limite de l'API.`);
        } else {
            console.error(`   Erreur: ${error.message}`);
        }
    }
    return globalBotToken;
}

/**
 * Fonction pour envoyer l'audio et récupérer le PDF
 */
async function processAudioAndReply(filePath, message) {
    console.log(`\n--- [DEBUG] DÉBUT DU TRAITEMENT AUDIO ---`);
    console.log(`[DEBUG] Fichier MP3 généré: ${filePath}`);
    console.log(`[DEBUG] Fichier existe sur le disque ? ${fs.existsSync(filePath)}`);
    
    try {
        if (!globalBotToken) {
            console.log("Pas de token en mémoire, tentative de récupération...");
            await authenticateBot();
            if (!globalBotToken) {
                return message.reply("Erreur critique : Impossible de s'authentifier auprès du serveur d'analyse.");
            }
        }

        const postUrl = `${BACKEND_URL}/meeting/process`;
        console.log(`[DEBUG] URL cible pour l'upload (POST): ${postUrl}`);
        console.log(`[DEBUG] Token utilisé (début): ${globalBotToken.substring(0, 15)}...`);

        message.channel.send("Envoi de l'audio au serveur...");

        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        console.log(`[DEBUG] Envoi de la requête Axios en cours...`);
        await axios.post(postUrl, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${globalBotToken}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log(`[DEBUG] Requête POST réussie !`);
        message.channel.send("Traitement terminé. Récupération du compte rendu...");

        const getUrl = `${BACKEND_URL}/meeting/result/pdf`;
        console.log(`[DEBUG] URL cible pour le PDF (GET): ${getUrl}`);

        const pdfResponse = await axios.get(getUrl, {
            headers: { 'Authorization': `Bearer ${globalBotToken}` },
            responseType: 'stream'
        });

        console.log(`[DEBUG] PDF récupéré avec succès !`);

        await message.reply({
            content: `**Compte rendu disponible !**`,
            files: [{
                attachment: pdfResponse.data,
                name: 'Compte_Rendu_Reunion.pdf'
            }]
        });

    } catch (error) {
        console.log(`\n--- [DEBUG] ERREUR AXIOS DÉTECTÉE ---`);
        
        // Affichage de l'URL exacte que Axios a essayé de joindre
        if (error.config) {
            console.log(`[DEBUG] Requête qui a échoué: ${error.config.method.toUpperCase()} ${error.config.url}`);
        }

        // Si le serveur a répondu quelque chose (erreur 404, 500, etc.)
        if (error.response) {
            console.error(`[DEBUG] Statut HTTP renvoyé par le serveur: ${error.response.status}`);
            console.error(`[DEBUG] Corps de la réponse:`, error.response.data);
            console.error(`[DEBUG] Headers de la réponse:`, error.response.headers);
        } 
        // Si le serveur n'a jamais répondu (timeout, serveur éteint)
        else if (error.request) {
            console.error(`[DEBUG] Aucune réponse du serveur. La requête est partie mais rien n'est revenu.`);
        } 
        // Erreur de code interne Axios
        else {
            console.error(`[DEBUG] Erreur interne Axios:`, error.message);
        }
        console.log(`--- [DEBUG] FIN DE L'ERREUR ---\n`);

        let errorMsg = "Une erreur est survenue lors du traitement.";
        
        if (error.code === 'ECONNREFUSED') errorMsg = "Le serveur backend ne répond pas.";
        else if (error.response?.status === 401) errorMsg = "Token invalide ou expiré.";
        else if (error.response?.status === 404) errorMsg = "La route n'a pas été trouvée (404) ou le PDF est absent.";

        message.reply(`❌ ${errorMsg}`);
    }
}

// --- ÉVÉNEMENTS DISCORD ---

client.once(Events.ClientReady, async () => {
    await sodium.ready;
    console.log(`🤖 Bot connecté ! (Tag: ${client.user.tag})`);
    
    await authenticateBot();
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!')) return;

    if (message.content === '!join') {
        if (message.member.voice.channel) {
            const channel = message.member.voice.channel;
            const rawFileName = `temp_${message.guild.id}_${Date.now()}.pcm`;

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false,
            });
            console.log("Rejoint le salon:", channel.name);

            const ffmpegProcess = cp.spawn(ffmpeg, [
                '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', 'pipe:0',
                '-f', 's16le', '-ar', '48000', '-ac', '2',
                '-y', rawFileName
            ], { stdio: ['pipe', 'pipe', 'pipe'] });

            ffmpegProcess.stdin.setMaxListeners(100);

            const receiver = connection.receiver;
            receiver.speaking.on('start', (userId) => {
                if (subscribedUsers.has(userId)) return;
                subscribedUsers.add(userId);
                
                const opusStream = receiver.subscribe(userId, {
                    end: { behavior: EndBehaviorType.AfterSilence, duration: 1000 },
                });
                const decoder = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });

                opusStream.on('end', () => subscribedUsers.delete(userId));
                opusStream.on('error', () => subscribedUsers.delete(userId));

                try {
                    opusStream.pipe(decoder);
                    decoder.pipe(ffmpegProcess.stdin, { end: false });
                } catch (e) { subscribedUsers.delete(userId); }
            });

            activeRecordings.set(message.guild.id, { connection, ffmpegProcess, rawFileName });
            message.reply("J'écoute. Tapez `!stop` pour finir.");
        } else {
            message.reply("Il faut être en vocal !");
        }
    }

    if (message.content === '!stop') {
        const recording = activeRecordings.get(message.guild.id);
        if (!recording) return message.reply("Rien à arrêter.");

        message.reply("⏹Fin de l'enregistrement...");

        recording.connection.destroy();
        subscribedUsers.clear();
        
        setTimeout(() => {
            recording.ffmpegProcess.stdin.end();
            const mp3FileName = `meeting_${message.guild.id}_${Date.now()}.mp3`;
            
            const convertProcess = cp.spawn(ffmpeg, [
                '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', recording.rawFileName,
                '-b:a', '128k',
                '-y', mp3FileName
            ]);

            convertProcess.on('close', async () => {
                try { fs.unlinkSync(recording.rawFileName); } catch(e){}
                activeRecordings.delete(message.guild.id);

                // Envoi avec le token global
                await processAudioAndReply(mp3FileName, message);
                
                try { fs.unlinkSync(mp3FileName); } catch(e){}
            });

        }, 1000);
    }
    
    // --- !leave ---
    if (message.content === '!leave') {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) connection.destroy();
        activeRecordings.delete(message.guild.id);
        message.reply("Au revoir !");
    }
});

client.login(process.env.DISCORD_TOKEN);