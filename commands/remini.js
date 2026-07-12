const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');

async function getQuotedOrOwnImageUrl(sock, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.imageMessage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }
    if (message.message?.imageMessage) {
        const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }
    return null;
}

async function reminiCommand(sock, chatId, message, args) {
    try {
        let imageUrl = null;

        if (args.length > 0) {
            const url = args.join(' ');
            if (isValidUrl(url)) {
                imageUrl = url;
            } else {
                return sock.sendMessage(chatId, {
                    text: '❌ Invalid URL provided.\n\nUsage: `.remini https://example.com/image.jpg`'
                }, { quoted: message });
            }
        } else {
            imageUrl = await getQuotedOrOwnImageUrl(sock, message);
            if (!imageUrl) {
                return sock.sendMessage(chatId, {
                    text: '📸 *Remini AI Enhancement Command*\n\nUsage:\n• `.remini <image_url>`\n• Reply to an image with `.remini`\n• Send image with `.remini`\n\nExample: `.remini https://example.com/image.jpg`'
                }, { quoted: message });
            }
        }

        await sock.sendMessage(chatId, {
            text: '🔄 Enhancing image with AI... This may take a minute.'
        }, { quoted: message });

        // Try various free enhancement APIs
        const apis = [
            async () => {
                const resp = await axios.get(`https://zx-api-rest.vercel.app/api/tools/remini?url=${encodeURIComponent(imageUrl)}`, {
                    responseType: 'arraybuffer',
                    timeout: 60000
                });
                return resp.data;
            },
            async () => {
                const resp = await axios.post('https://ai-image-enhancer-api.vercel.app/api/enhance', {
                    image: imageUrl
                }, { timeout: 60000 });
                if (resp.data?.image) return Buffer.from(resp.data.image, 'base64');
                throw new Error('No image data');
            }
        ];

        for (const apiFn of apis) {
            try {
                const enhanced = await apiFn();
                if (enhanced && enhanced.length > 100) {
                    await sock.sendMessage(chatId, {
                        image: enhanced,
                        caption: '✨ *Image enhanced successfully!*'
                    }, { quoted: message });
                    return;
                }
            } catch (e) {
                console.error('API attempt failed:', e.message);
            }
        }

        throw new Error('All enhancement APIs failed');

    } catch (error) {
        console.error('Remini Error:', error.message);
        await sock.sendMessage(chatId, {
            text: `❌ Failed to enhance image.\n\n💡 *Alternatives:*\n• Use https://www.remini.ai (official app)\n• Use https://www.letsenhance.io (free tier)`
        }, { quoted: message });
    }
}

function isValidUrl(string) {
    try { new URL(string); return true; } catch (_) { return false; }
}

module.exports = { reminiCommand };
