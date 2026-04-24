'use strict';

function ensureApiKey() {
    if (!process.env.BOT_API_KEY) {
        throw new Error('BOT_API_KEY missing in .env');
    }

    console.log('[auth] API key loaded');
}

module.exports = { ensureApiKey };