const axios = require('axios');
const settings = require('../settings');

const RUNFLIX_BASE = 'https://api.runflix.name.ng';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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

async function spotifyCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const query = text.split(' ').slice(1).join(' ').trim();
        
        if (!query) {
            await sock.sendMessage(chatId, { text: 'Please provide a Spotify link or track name.' }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: '🎵 Searching Spotify...' }, { quoted: message });

        let spotifyUrl = query;
        if (!query.includes('spotify.com')) {
            const searchResult = await runflixGet('/download/spotifydl', { url: query });
            if (spotifyUrl) spotifyUrl = searchResult?.spotify_url || query;
        }

        const result = await runflixGet('/download/spotifydlv4', { url: spotifyUrl });

        if (!result?.download_url) throw new Error('No download URL');

        await sock.sendMessage(chatId, {
            audio: { url: result.download_url },
            mimetype: 'audio/mpeg',
            fileName: `${result.title || 'spotify_track'}.mp3`
        }, { quoted: message });

    } catch (error) {
        console.error('Spotify error:', error.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to download from Spotify. Please try a direct link.' }, { quoted: message });
    }
}

module.exports = spotifyCommand;