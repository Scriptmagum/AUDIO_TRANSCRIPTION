// Charge les variables d'environnement depuis un fichier .env
require('dotenv').config();

// Prépare libsodium (utilisé par le receiver audio de discord.js)
const sodium = require('libsodium-wrappers');

const axios = require('axios');
const FormData = require('form-data');

// Configuration Backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
let backendToken = null; // On stockera le token ici
// Import des éléments principaux de discord.js
const { Client, GatewayIntentBits, Events } = require('discord.js');

// Fonctions pour rejoindre et gérer les connexions vocales
const { joinVoiceChannel, EndBehaviorType, getVoiceConnection } = require("@discordjs/voice");

// Décodage Opus et manipulation des flux audio
const prism = require('prism-media');
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');
const cp = require('child_process');

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
            console.log("Token backend récupéré:", backendToken);
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
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        const response = await axios.post(`${BACKEND_URL}/meeting/process`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${backendToken}` 
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        const data = response.data;
        console.log("Réponse du backend:", data);
        let replyText = "**Analyse terminée**\n";
        if(data.files && data.files.pdf){
            const pdfLink = `${BACKEND_URL}/meeting/result/pdf`;
            replyText += `PDF disponible ici: ${pdfLink}\n`;
        } else {
            replyText += "Le traitement est fini, mais je n'ai pas reçu de lien PDF.";
        }
        message.reply(replyText);
    } catch(error){
        console.error("Erreur upload:", error.response ? error.response.data : error.message);
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
            
            // CORRECTION: On utilise un fichier temporaire .pcm (audio brut) pour éviter la surcharge CPU
            const rawFileName = `temp_${message.guild.id}.pcm`;

            // On rejoint le salon vocal
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false,
            });
            console.log("Rejoint le salon vocal:", channel.name);

            // Lancement d'un processus FFmpeg pour écrire dans un fichier mp3
            // CORRECTION: On écrit en RAW (s16le) d'abord. C'est instantané, donc pas de voix de robot.
            const ffmpegProcess = cp.spawn(ffmpeg, [
                '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', 'pipe:0',
                '-f', 's16le', '-ar', '48000', '-ac', '2', // Sortie au même format (Copie parfaite)
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
                    channels: 2,
                    frameSize: 960
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
            activeRecordings.set(message.guild.id, { connection, ffmpegProcess, rawFileName });
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

        recording.connection.destroy();
        subscribedUsers.clear();
        
        setTimeout(() => {
            recording.ffmpegProcess.stdin.end();

            const mp3FileName = 'enregistrement.mp3';
            
            const convertProcess = cp.spawn(ffmpeg, [
                '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', recording.rawFileName,
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
            connection.destroy();
            const recording = activeRecordings.get(message.guild.id);
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