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

async function rosedayCommand(sock, chatId, message) {
    try {
        // rose-day is 404 on Runflix, fallback to valentines or goodnight
        let result;
        try {
            result = await runflixGet('/fun/valentines');
        } catch {
            result = await runflixGet('/fun/goodnight');
        }
        
        await sock.sendMessage(chatId, { text: `🌹 *Rose Day*\n\n${result}` }, { quoted: message });
    } catch (error) {
        console.error('Roseday error:', error.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to get rose day quote. Please try again later!' }, { quoted: message });
    }
}

module.exports = { rosedayCommand };