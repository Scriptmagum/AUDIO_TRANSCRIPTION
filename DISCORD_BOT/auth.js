'use strict';

/**
 * auth.js
 *
 * Handles bot authentication against the backend REST API.
 *
 * The backend uses cookie-based JWTs. On a successful POST /auth/signin the
 * server sets an "Authorization" cookie whose value is a raw Bearer token
 * (without the "Bearer " prefix). We store that token in memory and attach it
 * to every subsequent request.
 *
 * Boot sequence:
 *   1. Try signin with BOT_EMAIL / BOT_PASSWORD.
 *   2. If the credentials are wrong or the account does not exist, create it
 *      via POST /auth/signup and retry signin once.
 *   3. Once authenticated, ensure an API key exists (BOT_API_KEY in .env, or
 *      generate one via POST /user/apikey and print it for the operator).
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Holds the raw JWT value extracted from the Authorization cookie.
let backendToken = null;

function getToken() {
    return backendToken;
}

/*
 * Extracts the raw token from the Set-Cookie header returned by the backend.
 * The cookie value may be URL-encoded ("Bearer%20<token>") or plain
 * ("Bearer <token>"); we strip the prefix in both cases.
 */
function extractTokenFromCookies(cookies) {
    if (!cookies) return null;
    const authCookie = cookies.find(c => c.startsWith('Authorization='));
    if (!authCookie) return null;
    const raw = authCookie.split(';')[0].split('=')[1];
    return raw.replace(/Bearer(%20|\s)/, '') || null;
}

async function signin(email, password) {
    const response = await axios.post(`${BACKEND_URL}/auth/signin`, { email, password });
    const token = extractTokenFromCookies(response.headers['set-cookie']);
    if (!token) throw new Error('signin succeeded but no Authorization cookie was returned');
    backendToken = token;
    console.log('[auth] signed in');
}

async function signup(email, password) {
    await axios.post(`${BACKEND_URL}/auth/signup`, { email, password });
    console.log('[auth] account created');
}

/*
 * Tries to sign in; if that fails (wrong credentials or account missing) it
 * creates the account and tries once more. Throws if the second attempt fails.
 */
async function authenticate() {
    const email    = process.env.BOT_EMAIL    || 'bot@discord.local';
    const password = process.env.BOT_PASSWORD || 'BotSecret123!';

    try {
        await signin(email, password);
    } catch (firstErr) {
        console.warn('[auth] signin failed, attempting account creation:', firstErr.message);
        try {
            await signup(email, password);
            await signin(email, password);
        } catch (secondErr) {
            throw new Error(`[auth] could not authenticate: ${secondErr.message}`);
        }
    }
}

/*
 * Ensures BOT_API_KEY is available. If it is already set in the environment we
 * use it as-is. Otherwise we ask the backend to generate one, print it to
 * stdout for the operator to copy into .env, and store it for this session.
 *
 * Must be called after authenticate().
 */
async function ensureApiKey() {
    if (process.env.BOT_API_KEY) {
        console.log('[auth] API key loaded from environment');
        return;
    }

    console.log('[auth] no API key found, generating one...');

    const response = await axios.post(
        `${BACKEND_URL}/user/apikey`,
        {},
        { headers: { Cookie: `Authorization=Bearer ${backendToken}` } },
    );

    const key = response.data?.apiKey;
    if (!key) throw new Error('backend returned no apiKey field');

    console.log('[auth] new API key generated — add this to your .env:');
    console.log(`  BOT_API_KEY=${key}`);

    process.env.BOT_API_KEY = key;
}

module.exports = { authenticate, ensureApiKey, getToken };