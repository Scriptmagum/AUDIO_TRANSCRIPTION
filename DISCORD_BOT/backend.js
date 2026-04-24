'use strict';

const axios = require('axios');
const fs = require('fs');
const { AttachmentBuilder } = require('discord.js');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const MEETING_LANG = process.env.MEETING_LANG || 'fr';

const SUMMARY_MAX_LENGTH = 1500;

function authHeaders(extra = {}) {
    return {
        'x-api-key': process.env.BOT_API_KEY,
        ...extra,
    };
}

async function fetchPdf(pdfPath) {
    try {
        const response = await axios.get(
            `${BACKEND_URL}${pdfPath}`,
            {
                headers: authHeaders(),
                responseType: 'arraybuffer',
            }
        );

        return new AttachmentBuilder(
            Buffer.from(response.data),
            { name: 'meeting_summary.pdf' }
        );

    } catch (err) {
        console.error(err.message);
        return null;
    }
}

async function sendToBackend(filePath, message) {
    const processingMsg =
        await message.reply('Generating summary...');

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
            }
        );

        const { summary, pdf_url } = response.data;

        const files = [];

        if (fs.existsSync(filePath)) {
            files.push(
                new AttachmentBuilder(filePath, {
                    name: 'meeting_audio.mp3'
                })
            );
        }

        if (pdf_url) {
            const pdf = await fetchPdf(pdf_url);
            if (pdf) files.push(pdf);
        }

        const text = summary
            ? summary.slice(0, SUMMARY_MAX_LENGTH)
            : 'No summary returned';

        await processingMsg.edit({
            content: `**Summary**\n\n>>> ${text}`,
            files
        });

    } catch (err) {
        await processingMsg.edit(
            `Upload failed: ${err.message}`
        );
    }
}

module.exports = { sendToBackend };