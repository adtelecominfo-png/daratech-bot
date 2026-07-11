const axios = require('axios');
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

async function aiCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        
        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: "Please provide a question after .gpt or .gemini\n\nExample: .gpt write a basic html code"
            }, { quoted: message });
        }

        const parts = text.split(' ');
        const command = parts[0].toLowerCase();
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, { 
                text: "Please provide a question after .gpt or .gemini"
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            react: { text: '🤖', key: message.key }
        });

        let model = 'deepseek';
        if (command === '.gpt') model = 'gpt4o';
        else if (command === '.gemini') model = 'claude'; // Runflix uses claude for gemini

        try {
            const result = await runflixGet('/ai/overchat', { model, q: query });
            const answer = typeof result === 'string' ? result : result?.result || JSON.stringify(result);

            await sock.sendMessage(chatId, {
                text: answer
            }, { quoted: message });

        } catch (error) {
            console.error('API Error:', error);
            await sock.sendMessage(chatId, {
                text: "❌ Failed to get response. Please try again later.",
            }, { quoted: message });
        }
    } catch (error) {
        console.error('AI Command Error:', error);
        await sock.sendMessage(chatId, {
            text: "❌ An error occurred. Please try again later.",
        }, { quoted: message });
    }
}

module.exports = aiCommand;