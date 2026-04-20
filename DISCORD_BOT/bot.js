'use strict';

/**
 * bot.js
 *
 * Entry point. Responsibilities:
 *   - Apply voice connection patches before any voice activity.
 *   - Authenticate against the backend on startup.
 *   - Auto-join TARGET_VOICE_CHANNEL_ID when a human member is present.
 *   - Handle text commands: !join, !stop, !leave.
 *
 * Environment variables (see .env.example):
 *   DISCORD_TOKEN           — bot token
 *   BACKEND_URL             — base URL of the transcription server
 *   MEETING_LANG            — language code sent to /meeting/process/:lang
 *   BOT_EMAIL               — bot account email on the backend
 *   BOT_PASSWORD            — bot account password on the backend
 *   BOT_API_KEY             — pre-existing API key (generated on first run if absent)
 *   TARGET_VOICE_CHANNEL_ID — channel ID for auto-join behaviour (optional)
 *   VOICE_DEBUG             — set to "1" for verbose voice WebSocket logs
 *   VOICE_DISABLE_NET_PATCHES — set to "1" to skip the configureNetworking debounce
 */

// Node 17+ prefers IPv6 by default. Discord voice (UDP + WebSocket) is more
// reliable on IPv4; without this the handshake can stall then fall back to
// signalling state.
const dns = require('node:dns');
try { dns.setDefaultResultOrder('ipv4first'); } catch (_) {}

require('dotenv').config();

// libsodium is used internally by the @discordjs/voice receiver. It must be
// ready before any audio subscriptions are created. We await sodium.ready in
// the ClientReady handler.
const sodium = require('libsodium-wrappers');

// Apply patches before importing anything else from @discordjs/voice.
require('./voice-patches').applyAll();

const { Client, GatewayIntentBits, Events } = require('discord.js');
const { authenticate, ensureApiKey } = require('./auth');
const { startRecordingInChannel, stopRecording, leaveChannel, activeRecordings } = require('./recording');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// --- Startup ---

client.once(Events.ClientReady, async () => {
    await sodium.ready;
    console.log(`[bot] logged in as ${client.user.tag}`);

    try {
        await authenticate();
        await ensureApiKey();
    } catch (err) {
        console.error('[bot] startup authentication failed:', err.message);
        // The bot can still operate for manual !join commands; auto-join and
        // backend uploads will fail until credentials are fixed.
    }

    // If TARGET_VOICE_CHANNEL_ID is configured and there are already humans in
    // the channel when the bot starts, join immediately.
    const targetId = process.env.TARGET_VOICE_CHANNEL_ID;
    if (!targetId) return;

    const channel = client.channels.cache.get(targetId);
    if (!channel?.isVoiceBased()) return;

    const hasHumans = channel.members.some(m => !m.user.bot);
    if (hasHumans) {
        console.log('[bot] humans detected on startup, auto-joining', channel.name);
        await startRecordingInChannel(channel);
    }
});

// --- Auto-join on VoiceStateUpdate ---

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const targetId = process.env.TARGET_VOICE_CHANNEL_ID;
    if (!targetId) return;

    // A member joined a channel (either fresh join or channel switch).
    const joined = newState.channelId && newState.channelId !== oldState.channelId;
    if (!joined) return;
    if (newState.channelId !== targetId) return;
    if (newState.id === client.user.id) return;
    if (activeRecordings.has(newState.guild.id)) return;

    console.log(`[bot] ${newState.member.user.tag} joined target channel, auto-joining`);
    await startRecordingInChannel(newState.channel);
});

// --- Text commands ---

client.on(Events.MessageCreate, async (message) => {
    if (!message.content.startsWith('!')) return;
    if (message.author.bot) return;

    const command = message.content.trim().toLowerCase();

    if (command === '!join') {
        if (!message.member.voice.channel) {
            return message.reply('You must be in a voice channel.');
        }
        await startRecordingInChannel(message.member.voice.channel, message);
    }

    if (command === '!stop') {
        await stopRecording(message.guild.id, message);
    }

    if (command === '!leave') {
        leaveChannel(message.guild.id, message);
    }
});

client.login(process.env.DISCORD_TOKEN);