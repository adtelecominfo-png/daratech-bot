const axios = require('axios');
const yts = require('yt-search');
const settings = require('../settings');

const RUNFLIX_BASE = 'https://api.runflix.name.ng';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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

async function songCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        if (!text) {
            await sock.sendMessage(chatId, { text: 'Usage: .song <song name or YouTube link>' }, { quoted: message });
            return;
        }

        let video;
        if (text.includes('youtube.com') || text.includes('youtu.be')) {
            video = { url: text, title: '', thumbnail: '' };
        } else {
            const search = await yts(text);
            if (!search?.videos?.length) {
                await sock.sendMessage(chatId, { text: 'No results found.' }, { quoted: message });
                return;
            }
            video = search.videos[0];
        }

        if (video.thumbnail) {
            await sock.sendMessage(chatId, {
                image: { url: video.thumbnail },
                caption: `🎵 Downloading: *${video.title}*\n⏱ Duration: ${video.timestamp}`
            }, { quoted: message });
        }

        const audioData = await runflixGet('/download/ytmp3', { url: video.url });

        if (!audioData?.download_url) throw new Error('No download URL');

        await sock.sendMessage(chatId, {
            audio: { url: audioData.download_url },
            mimetype: 'audio/mpeg',
            fileName: `${(audioData.title || video.title || 'song').replace(/[^\w\s-]/g, '')}.mp3`
        }, { quoted: message });

    } catch (error) {
        console.error('Song command error:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to download song. Please try again later.' }, { quoted: message });
    }
}

module.exports = { songCommand };