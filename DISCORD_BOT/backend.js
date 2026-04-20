'use strict';

/**
 * backend.js
 *
 * Sends a recorded MP3 to the backend for transcription and summarisation,
 * then posts the result back to the originating Discord channel.
 *
 * Request flow:
 *   POST /meeting/process/:lang  (multipart, the MP3 file)
 *     -> { summary, pdf_url }
 *   GET  <pdf_url>               (authenticated, returns binary PDF)
 *
 * Both requests carry the session cookie and the API key header. The API key
 * is a secondary auth layer used by the backend to attribute usage to the bot
 * account rather than to a human user session.
 *
 * Discord message strategy:
 *   We send a "processing" reply immediately so the user gets feedback, then
 *   edit it once the backend responds. This avoids a silent gap that could
 *   last tens of seconds for long recordings.
 */

const axios  = require('axios');
const fs     = require('fs');
const { AttachmentBuilder } = require('discord.js');
const { getToken } = require('./auth');

const BACKEND_URL  = process.env.BACKEND_URL  || 'http://localhost:3001';
// Must match a language code accepted by POST /meeting/process/:lang (fr, en, de, es).
const MEETING_LANG = process.env.MEETING_LANG || 'fr';

// Discord limits message content to 2000 characters; we leave headroom for
// the header line and blockquote formatting.
const SUMMARY_MAX_LENGTH = 1500;

function authHeaders(extra = {}) {
    return {
        Cookie: `Authorization=Bearer ${getToken()}`,
        'x-api-key': process.env.BOT_API_KEY,
        ...extra,
    };
}

/*
 * Downloads the PDF referenced by `pdfPath` from the backend and returns it
 * as a Discord AttachmentBuilder, or null if the download fails.
 */
async function fetchPdf(pdfPath) {
    try {
        const response = await axios.get(`${BACKEND_URL}${pdfPath}`, {
            headers: authHeaders(),
            responseType: 'arraybuffer',
        });
        return new AttachmentBuilder(Buffer.from(response.data), { name: 'meeting_summary.pdf' });
    } catch (err) {
        console.error('[backend] PDF download failed:', err.message);
        return null;
    }
}

/*
 * Uploads the MP3 at `filePath` to the backend, waits for the summary, and
 * posts the result to Discord. The audio file is also attached to the reply
 * so the channel retains a copy.
 *
 * Errors during upload are caught and reported as a Discord message rather
 * than crashing the process, since recording cleanup has already happened by
 * the time this runs.
 */
async function sendToBackend(filePath, message) {
    if (!getToken() || !process.env.BOT_API_KEY) {
        await message.reply('Missing authentication credentials — check BOT_EMAIL and BOT_API_KEY.');
        return;
    }

    const processingMsg = await message.reply('Sending to server, generating summary...');

    try {
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        const response = await axios.post(
            `${BACKEND_URL}/meeting/process/${MEETING_LANG}`,
            form,
            {
                headers: authHeaders(form.getHeaders()),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            },
        );

        const { summary, pdf_url } = response.data;
        console.log('[backend] response received');

        // Collect attachments: the local MP3 first, then the backend PDF.
        const attachments = [];
        if (fs.existsSync(filePath)) {
            attachments.push(new AttachmentBuilder(filePath, { name: 'meeting_audio.mp3' }));
        }
        if (pdf_url) {
            const pdf = await fetchPdf(pdf_url);
            if (pdf) attachments.push(pdf);
        }

        const summaryText = summary
            ? (summary.length > SUMMARY_MAX_LENGTH
                ? summary.slice(0, SUMMARY_MAX_LENGTH) + '...'
                : summary)
            : 'No summary returned by the server.';

        await processingMsg.edit({
            content: `**Summary**\n\n>>> ${summaryText}`,
            files: attachments,
        });

    } catch (err) {
        console.error('[backend] upload error:', err.response?.data ?? err.message);
        await processingMsg.edit(`Upload failed: ${err.message}`);
    }
}

module.exports = { sendToBackend };