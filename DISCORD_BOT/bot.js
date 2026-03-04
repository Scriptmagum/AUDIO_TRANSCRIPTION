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
// Si tu lances le backend en local sur ta machine, garde localhost
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// VARIABLE GLOBALE POUR LE TOKEN
// On le stocke ici une bonne fois pour toutes
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
    // Si on a déjà un token, on ne fait rien (sauf si on veut forcer le refresh)
    if (globalBotToken) return globalBotToken;

    try {
        console.log(`Authentification auprès du backend (${BACKEND_URL})...`);
        const response = await axios.get(`${BACKEND_URL}/auth/token`);
        
        if (response.data && response.data.token) {
            globalBotToken = response.data.token;
            console.log(`Token récupéré et stocké ! (UUID: ${response.data.uuid})`);
        }
    } catch (error) {
        console.error("❌ Échec de l'authentification au démarrage.");
        if (error.code === 'ECONNREFUSED') {
            console.error(`   Impossible de contacter le serveur sur ${BACKEND_URL}. Vérifie qu'il est bien lancé !`);
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
    try {
        // Vérification de sécurité : a-t-on le token ?
        if (!globalBotToken) {
            console.log("Pas de token en mémoire, tentative de récupération...");
            await authenticateBot();
            if (!globalBotToken) {
                return message.reply("Erreur critique : Impossible de s'authentifier auprès du serveur d'analyse.");
            }
        }

        message.channel.send("Envoi de l'audio au serveur...");

        // 1. Préparer le formulaire
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        // 2. Envoyer l'audio (/meeting/process) avec le token global
        await axios.post(`${BACKEND_URL}/meeting/process`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${globalBotToken}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        message.channel.send("Traitement terminé. Récupération du compte rendu...");

        // 3. Télécharger le PDF (/meeting/result/pdf)
        const pdfResponse = await axios.get(`${BACKEND_URL}/meeting/result/pdf`, {
            headers: { 'Authorization': `Bearer ${globalBotToken}` },
            responseType: 'stream'
        });

        // 4. Envoyer le PDF dans Discord
        await message.reply({
            content: `**Compte rendu disponible !**`,
            files: [{
                attachment: pdfResponse.data,
                name: 'Compte_Rendu_Reunion.pdf'
            }]
        });

    } catch (error) {
        console.error("Erreur Backend:", error.response ? error.response.data : error.message);
        let errorMsg = "Une erreur est survenue lors du traitement.";
        
        if (error.code === 'ECONNREFUSED') errorMsg = "Le serveur backend ne répond pas.";
        else if (error.response?.status === 401) errorMsg = "Token invalide ou expiré.";
        else if (error.response?.status === 404) errorMsg = "Le fichier PDF n'a pas été trouvé.";

        message.reply(`❌ ${errorMsg}`);
    }
}

// --- ÉVÉNEMENTS DISCORD ---

client.once(Events.ClientReady, async () => {
    await sodium.ready;
    console.log(`🤖 Bot connecté ! (Tag: ${client.user.tag})`);
    
    // Authentification immédiate au lancement
    await authenticateBot();
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!')) return;

    // --- !join ---
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

    // --- !stop ---
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