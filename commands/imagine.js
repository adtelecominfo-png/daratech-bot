const axios = require('axios');
const settings = require('../settings');

const RUNFLIX_BASE = 'https://api.runflix.name.ng';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function runflixGet(endpoint, params = {}) {
    const url = `${RUNFLIX_BASE}${endpoint}`;
    const queryParams = new URLSearchParams({ apikey: settings.runflixApiKey || 'daratech', ...params });
    const response = await axios.get(`${url}?${queryParams.toString()}`, {
        timeout: 60000,
        headers: { 'User-Agent': UA },
        responseType: 'arraybuffer'
    });
    
    const contentType = response.headers['content-type'] || '';
    if (!contentType.startsWith('image/')) {
        const text = Buffer.from(response.data).toString('utf8');
        throw new Error('API returned non-image: ' + text.slice(0, 200));
    }
    return response.data;
}

async function imagineCommand(sock, chatId, message) {
    try {
        const prompt = message.message?.conversation?.trim() || 
                      message.message?.extendedTextMessage?.text?.trim() || '';
        
        const imagePrompt = prompt.slice(8).trim();
        
        if (!imagePrompt) {
            await sock.sendMessage(chatId, {
                text: 'Please provide a prompt for the image generation.\nExample: .imagine a beautiful sunset over mountains'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            text: '🎨 Generating your image... Please wait.'
        }, { quoted: message });

        const enhancedPrompt = enhancePrompt(imagePrompt);

        const imageBuffer = await runflixGet('/ai/fluximg', { 
            prompt: enhancedPrompt,
            ratio: '1:1'
        });

        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `🎨 Generated image for prompt: "${imagePrompt}"`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in imagine command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to generate image. Please try again later.'
        }, { quoted: message });
    }
}

function enhancePrompt(prompt) {
    const qualityEnhancers = [
        'high quality', 'detailed', 'masterpiece', 'best quality',
        'ultra realistic', '4k', 'highly detailed', 'professional photography',
        'cinematic lighting', 'sharp focus'
    ];
    const numEnhancers = Math.floor(Math.random() * 2) + 3;
    const selectedEnhancers = qualityEnhancers.sort(() => Math.random() - 0.5).slice(0, numEnhancers);
    return `${prompt}, ${selectedEnhancers.join(', ')}`;
}

module.exports = imagineCommand;