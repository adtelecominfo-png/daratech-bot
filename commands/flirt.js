const axios = require('axios');
const settings = require('../settings');

const RUNFLIX_BASE = 'https://api.runflix.name.ng';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function runflixGet(endpoint, params = {}) {
    const url = `${RUNFLIX_BASE}${endpoint}`;
    const queryParams = new URLSearchParams({ apikey: settings.runflixApiKey || 'daratech', ...params });
    const response = await axios.get(`${url}?${queryParams.toString()}`, {
        timeout: 30000,
        headers: { 'User-Agent': UA }
    });
    if (response.data?.success === true) return response.data.result;
    if (response.data?.success === false) throw new Error(response.data.message || 'API error');
    return response.data;
}

async function flirtCommand(sock, chatId, message) {
    try {
        const flirt = await runflixGet('/fun/flirt');
        await sock.sendMessage(chatId, { text: `💕 *FLIRT LINE*\n\n${flirt}` }, { quoted: message });
    } catch (error) {
        console.error('Flirt error:', error.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to get flirt line. Please try again later.' }, { quoted: message });
    }
}

module.exports = { flirtCommand };