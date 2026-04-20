'use strict';

/**
 * voice-patches.js
 *
 * Monkey-patches applied to @discordjs/voice to work around two known bugs:
 *
 * 1. configureNetworking() race condition
 *    Discord sometimes fires two consecutive VOICE_SERVER_UPDATE packets. Each
 *    call to configureNetworking() tears down the current WebSocket and opens a
 *    new one, so a second call while the first WS is still in the Identifying
 *    phase (between Hello and Ready) destroys it before it becomes usable. The
 *    fix debounces calls by 500 ms and suppresses the second call when the
 *    session key is unchanged and we are already in the Connecting state.
 *
 * 2. Missing close-code logging
 *    onNetworkingClose() is called when the voice WebSocket closes, but the
 *    library does not log the numeric close code. Without it, diagnosing a
 *    "Hello -> close, never Ready" failure is guesswork. The patch logs the
 *    code (and a human-readable hint) when VOICE_DEBUG=1.
 *
 * Set VOICE_DISABLE_NET_PATCHES=1 to skip patch 1 (useful when bisecting).
 * Set VOICE_DEBUG=1 to enable verbose voice WebSocket logging.
 */

const {
    VoiceConnection,
    VoiceConnectionStatus,
} = require('@discordjs/voice');

// --- Close-code hint table ---

const DISCORD_CLOSE_CODES = {
    4001: 'unknown opcode',
    4002: 'invalid payload',
    4003: 'not authenticated',
    4004: 'authentication failed',
    4005: 'already authenticated',
    4006: 'invalid session',
    4009: 'session expired',
    4011: 'server not found',
    4012: 'unknown protocol (SelectProtocol)',
    4014: 'disconnected',
    4015: 'voice server crash',
    4016: 'unknown encryption mode',
    // Requires @discordjs/voice >= 0.19 and Node >= 22.12
    4017: 'E2EE / DAVE protocol required',
};

const WS_CLOSE_CODES = {
    1000: 'normal closure',
    1001: 'going away',
    1006: 'abnormal closure (network reset or TCP RST)',
    1011: 'internal server error',
};

function closeCodeHint(code) {
    if (typeof code !== 'number') return '';
    if (DISCORD_CLOSE_CODES[code]) return ` [Discord ${code}: ${DISCORD_CLOSE_CODES[code]}]`;
    if (WS_CLOSE_CODES[code])      return ` [WS ${code}: ${WS_CLOSE_CODES[code]}]`;
    return ` [code ${code}]`;
}

// --- Patch 1: log close code ---

function patchCloseLogging() {
    const orig = VoiceConnection.prototype.onNetworkingClose;
    VoiceConnection.prototype.onNetworkingClose = function (code) {
        if (process.env.VOICE_DEBUG === '1') {
            console.warn('[voice] networking close', code, closeCodeHint(code));
        }
        return orig.call(this, code);
    };
}

// --- Patch 2: debounce configureNetworking ---

const DEBOUNCE_MS = 500;

/*
 * Returns a string that uniquely identifies the current voice session.
 * Used to detect duplicate VOICE_SERVER_UPDATE events.
 */
function sessionKey(vc) {
    const { server, state } = vc.packets;
    if (!server?.endpoint || !state?.session_id) return null;
    return `${server.endpoint}|${server.token}|${state.session_id}|${state.user_id}`;
}

function patchNetworkingDebounce() {
    if (process.env.VOICE_DISABLE_NET_PATCHES === '1') {
        console.log('[voice] networking patches disabled (VOICE_DISABLE_NET_PATCHES=1)');
        return;
    }

    const originalConfigure  = VoiceConnection.prototype.configureNetworking;
    const originalAddState   = VoiceConnection.prototype.addStatePacket;

    function schedule(vc) {
        clearTimeout(vc._configureTimer);
        vc._configureTimer = setTimeout(() => {
            vc._configureTimer = undefined;
            if (vc.state.status === VoiceConnectionStatus.Destroyed) return;

            const key = sessionKey(vc);
            if (!key) return;

            // Suppress a second identical session while the first WS has not yet
            // received its Ready packet. Firing again would destroy the live WS.
            if (
                vc.state.status === VoiceConnectionStatus.Connecting &&
                vc._lastSessionKey === key
            ) return;

            originalConfigure.call(vc);

            if (vc.state.status === VoiceConnectionStatus.Connecting) {
                vc._lastSessionKey = key;
            }
        }, DEBOUNCE_MS);
    }

    VoiceConnection.prototype.configureNetworking = function () {
        schedule(this);
    };

    /*
     * addStatePacket handles VOICE_STATE_UPDATE. After the patch we also
     * kick off a configure attempt, but only from the Signalling state —
     * triggering it from Connecting would recreate the same race we are
     * trying to prevent.
     */
    VoiceConnection.prototype.addStatePacket = function (packet) {
        originalAddState.call(this, packet);
        if (this.state.status === VoiceConnectionStatus.Ready)      return;
        if (this.state.status !== VoiceConnectionStatus.Signalling) return;
        if (this.packets.server?.endpoint && this.packets.state) {
            schedule(this);
        }
    };
}

// --- Apply ---

function applyAll() {
    patchCloseLogging();
    patchNetworkingDebounce();
}

module.exports = { applyAll };