const axios = require('axios');

async function soraCommand(sock, chatId, message) {
    try {
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        // Extract prompt after command keyword or use quoted text
        const used = (rawText || '').split(/\s+/)[0] || '.sora';
        const args = rawText.slice(used.length).trim();
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        const input = args || quotedText;

        if (!input) {
            await sock.sendMessage(chatId, { text: 'Provide a prompt. Example: .sora anime girl with short blue hair' }, { quoted: message });
            return;
        }

        // Try Pollinations for video (experimental, may not work for all prompts)
        const apiUrl = `https://pollinations.ai/v/animation/${encodeURIComponent(input)}?width=512&height=512&nologo=true&seed=42`;
        await sock.sendMessage(chatId, {
            text: `🎬 *Text-to-Video* (experimental)\n\nGenerating: "${input}"\n\nNote: Video generation is slow and may not work for all prompts.`
        }, { quoted: message });

        const response = await axios.get(apiUrl, { 
            timeout: 120000, 
            responseType: 'arraybuffer', 
            validateStatus: () => true, 
            headers: { 'user-agent': 'Mozilla/5.0' } 
        });

        const contentType = response.headers['content-type'] || '';
        if (!contentType.startsWith('video/')) {
            // Fallback: generate an image instead
            const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(input + ', cinematic, high quality, 4k')}?width=1024&height=1024&nologo=true`;
            await sock.sendMessage(chatId, {
                text: '⚠️ Video generation unavailable. Sending image instead:'
            }, { quoted: message });
            await sock.sendMessage(chatId, {
                image: { url: imgUrl },
                caption: `Generated image for: ${input}`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            video: response.data,
            mimetype: 'video/mp4',
            caption: `Prompt: ${input}`
        }, { quoted: message });

    } catch (error) {
        console.error('[SORA] error:', error?.message || error);
        await sock.sendMessage(chatId, { text: '❌ Video generation failed. Try .imagine for images instead.' }, { quoted: message });
    }
}

module.exports = soraCommand;


