'use strict';

/**
 * recording.js
 *
 * Manages joining a voice channel, capturing audio from all speakers, and
 * stopping the recording.
 *
 * Audio pipeline per speaker:
 *   Discord RTP (Opus) -> opusStream (receiver.subscribe)
 *                      -> prism.opus.Decoder (PCM s16le, mono, 48 kHz)
 *                      -> ffmpegProcess.stdin (merged into a single PCM file)
 *
 * The per-guild "subscribed users" tracking prevents subscribing to the same
 * user twice when they trigger multiple speaking events before the first
 * opusStream ends. It is scoped to the guild object itself (see activeRecordings)
 * rather than a module-level Set, so it does not bleed across guilds.
 *
 * Keep-alive silence stream:
 *   Discord suppresses incoming RTP packets until the receiving client is
 *   itself transmitting ("speak to start"). We play a continuous silence
 *   stream on the connection to satisfy this requirement without producing
 *   audible output.
 */

const cp     = require('child_process');
const fs     = require('fs');
const { Readable } = require('stream');

const prism  = require('prism-media');
const ffmpeg = require('ffmpeg-static');

const {
    joinVoiceChannel,
    getVoiceConnection,
    createAudioPlayer,
    createAudioResource,
    StreamType,
    EndBehaviorType,
    entersState,
    VoiceConnectionStatus,
} = require('@discordjs/voice');
const { PermissionFlagsBits } = require('discord.js');

const { sendToBackend } = require('./backend');

// Keyed by guild ID. Each entry: { connection, ffmpegProcess, rawFileName, keepAlive, subscribedUsers }.
const activeRecordings = new Map();

// One stereo 48 kHz PCM frame (20 ms). Matches the format expected by StreamType.Raw.
const SILENCE_FRAME = Buffer.alloc(48000 * 0.02 * 2 * 2);

/*
 * Starts a continuous silence stream on the voice connection.
 * Returns a handle with a stop() method that cleans up the player and timer.
 */
function startKeepAlive(connection) {
    const player  = createAudioPlayer();
    const stream  = new Readable({ read() {} });
    const timer   = setInterval(() => stream.push(SILENCE_FRAME), 20);
    const resource = createAudioResource(stream, { inputType: StreamType.Raw });

    connection.subscribe(player);
    player.play(resource);

    return {
        stop() {
            clearInterval(timer);
            try { player.stop(true); } catch (_) {}
            stream.destroy();
        },
    };
}

/*
 * Subscribes to a single user's audio stream and pipes it into the shared
 * ffmpeg stdin. The Opus decoder is configured for mono 48 kHz, matching the
 * ffmpeg input format.
 *
 * The `subscribedUsers` set is passed in (guild-scoped) so we can guard against
 * duplicate subscriptions within the same guild.
 */
function subscribeUser(userId, receiver, ffmpegStdin, subscribedUsers) {
    if (subscribedUsers.has(userId)) return;
    subscribedUsers.add(userId);

    const opusStream = receiver.subscribe(userId, {
        end: { behavior: EndBehaviorType.AfterSilence, duration: 1000 },
    });

    const decoder = new prism.opus.Decoder({ rate: 48000, channels: 1, frameSize: 960 });

    decoder.on('error', (err) => {
        // Corrupted Opus frames are common during network hiccups; suppress them.
        if (!err.message?.includes('corrupted')) {
            console.error(`[recording] decoder error for ${userId}:`, err.message);
        }
    });

    opusStream.on('end',   () => subscribedUsers.delete(userId));
    opusStream.on('error', (err) => {
        console.error(`[recording] opus stream error for ${userId}:`, err.message);
        subscribedUsers.delete(userId);
    });

    try {
        opusStream.pipe(decoder);
        decoder.pipe(ffmpegStdin, { end: false });
    } catch (err) {
        console.error(`[recording] pipe error for ${userId}:`, err.message);
        subscribedUsers.delete(userId);
    }
}

/*
 * Joins `channel`, begins recording all speakers into a temporary PCM file,
 * and registers the session in activeRecordings.
 *
 * `message` is the Discord message that triggered the join, or null for
 * auto-join (triggered by VoiceStateUpdate). When null, status is logged to
 * stdout only.
 */
async function startRecordingInChannel(channel, message = null) {
    const me = channel.guild.members.me;
    if (!me) {
        const note = 'Cannot resolve own member in guild (member cache empty).';
        return message ? message.reply(note) : console.error('[recording]', note);
    }

    const perms = channel.permissionsFor(me);
    if (!perms.has(PermissionFlagsBits.Connect) || !perms.has(PermissionFlagsBits.Speak)) {
        const note = 'Missing Connect or Speak permission on this channel.';
        return message ? message.reply(note) : console.error('[recording]', note);
    }

    if (activeRecordings.has(channel.guild.id)) return;

    // Destroy any stale connection left from a previous session.
    const previous = getVoiceConnection(channel.guild.id);
    if (previous) {
        try { previous.destroy(); } catch (_) {}
        await new Promise(r => setTimeout(r, 750));
    }

    const rawFileName = `temp_${channel.guild.id}.pcm`;
    const voiceDebug  = process.env.VOICE_DEBUG === '1';

    const connection = joinVoiceChannel({
        channelId:       channel.id,
        guildId:         channel.guild.id,
        adapterCreator:  channel.guild.voiceAdapterCreator,
        selfDeaf:        false,
        selfMute:        false,
        debug:           voiceDebug,
    });

    if (voiceDebug) {
        connection.on('debug', msg => console.log('[voice debug]', msg));
    }

    connection.on('stateChange', (prev, next) => {
        const line = `[voice] ${prev.status} -> ${next.status}`;
        if (prev.status === 'connecting' && next.status === 'signalling') {
            // The WebSocket closed before the Ready packet arrived — usually a
            // networking issue or a race triggered by duplicate VOICE_SERVER_UPDATE.
            console.warn(line, '(WS closed before Ready)');
        } else {
            console.log(line);
        }
    });

    connection.on('error', err => console.error('[voice] connection error:', err));

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 90_000);
    } catch (err) {
        console.error('[recording] voice connection timed out:', err.message);
        connection.destroy();
        return message?.reply('Voice connection failed (timeout). Check bot permissions and network.');
    }

    const keepAlive = startKeepAlive(connection);

    // Single ffmpeg process that receives raw PCM from all speakers on stdin
    // and writes a mono 48 kHz PCM file. We keep it as raw PCM here and
    // convert to MP3 only when the recording stops (saves repeated encoding).
    const ffmpegProcess = cp.spawn(ffmpeg, [
        '-f', 's16le', '-ar', '48000', '-ac', '1', '-i', 'pipe:0',
        '-f', 's16le', '-ar', '48000', '-ac', '1',
        '-y', rawFileName,
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    ffmpegProcess.stdin.setMaxListeners(100);
    ffmpegProcess.stdin.on('error', err => {
        // EPIPE happens when ffmpeg exits while there is still data in the
        // pipe buffer (e.g. the user disconnected mid-frame). It is harmless.
        if (err.code !== 'EPIPE') console.error('[recording] ffmpeg stdin error:', err);
    });

    const subscribedUsers = new Set();
    connection.receiver.speaking.on('start', userId => {
        subscribeUser(userId, connection.receiver, ffmpegProcess.stdin, subscribedUsers);
    });

    activeRecordings.set(channel.guild.id, {
        connection,
        ffmpegProcess,
        rawFileName,
        keepAlive,
        subscribedUsers,
    });

    const note = `Recording started in: ${channel.name}`;
    message ? message.reply('Ready.') : console.log('[recording]', note);
}

/*
 * Stops the active recording for a guild, converts the PCM file to MP3,
 * sends it to the backend, and cleans up temporary files.
 *
 * The 500 ms delay before closing ffmpeg's stdin gives any in-flight pipe
 * writes a chance to complete after the connection is destroyed.
 */
async function stopRecording(guildId, message) {
    const recording = activeRecordings.get(guildId);
    if (!recording) return message.reply('Nothing is being recorded.');

    await message.reply('Recording stopped. Converting and sending to server...');

    recording.keepAlive.stop();
    recording.connection.destroy();
    recording.subscribedUsers.clear();

    await new Promise(r => setTimeout(r, 500));
    recording.ffmpegProcess.stdin.end();

    const mp3FileName = `recording_${guildId}.mp3`;

    const convertProcess = cp.spawn(ffmpeg, [
        '-f', 's16le', '-ar', '48000', '-ac', '1', '-i', recording.rawFileName,
        '-b:a', '128k',
        '-y', mp3FileName,
    ]);

    convertProcess.on('close', async () => {
        console.log('[recording] MP3 conversion complete');
        try { fs.unlinkSync(recording.rawFileName); } catch (_) {}
        activeRecordings.delete(guildId);

        await sendToBackend(mp3FileName, message);
        try { fs.unlinkSync(mp3FileName); } catch (_) {}
    });
}

/*
 * Leaves the voice channel immediately without saving or sending the audio.
 * Used when you want to abort a recording without processing it.
 */
function leaveChannel(guildId, message) {
    const connection = getVoiceConnection(guildId);
    if (!connection) return message.reply('Not connected.');

    const recording = activeRecordings.get(guildId);
    if (recording) {
        recording.keepAlive.stop();
        recording.ffmpegProcess.stdin.end();
        try { fs.unlinkSync(recording.rawFileName); } catch (_) {}
        recording.subscribedUsers.clear();
        activeRecordings.delete(guildId);
    }

    connection.destroy();
    message.reply('Left the channel.');
}

module.exports = { startRecordingInChannel, stopRecording, leaveChannel, activeRecordings };