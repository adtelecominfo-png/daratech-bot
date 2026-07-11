const axios = require('axios');
const yts = require('yt-search');
const settings = require('../settings');

const RUNFLIX_BASE = 'https://api.runflix.name.ng';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function runflixGet(endpoint, params = {}) {
    const url = `${RUNFLIX_BASE}${endpoint}`;
    const queryParams = new URLSearchParams({ apikey: settings.runflixApiKey || 'daratech', ...params });
    const response = await axios.get(`${url}?${queryParams.toString()}`, {
        timeout: 60000,
        headers: { 'User-Agent': UA }
    });
    if (response.data?.success === true) return response.data.result;
    if (response.data?.success === false) throw new Error(response.data.message || 'API error');
    return response.data;
}

async function playCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();
        
        if (!searchQuery) {
            await sock.sendMessage(chatId, { text: "What song do you want to download?" });
            return;
        }

        let video;
        if (searchQuery.includes('youtube.com') || searchQuery.includes('youtu.be')) {
            video = { url: searchQuery };
        } else {
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                return await sock.sendMessage(chatId, { text: "No songs found!" });
            }
            video = videos[0];
        }

        await sock.sendMessage(chatId, {
            text: "_Please wait your download is in progress_"
        });

        const audioData = await runflixGet('/download/ytmp3', { url: video.url });

        if (!audioData?.download_url) throw new Error('No download URL');

        const title = audioData.title || video.title || 'song';
        
        await sock.sendMessage(chatId, {
            audio: { url: audioData.download_url },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in play command:', error);
        await sock.sendMessage(chatId, { text: "Download failed. Please try again later." });
    }
}

module.exports = playCommand;