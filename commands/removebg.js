const axios = require('axios');
const FormData = require('form-data');
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

module.exports = {
    name: 'removebg',
    alias: ['rmbg', 'nobg'],
    category: 'general',
    desc: 'Remove background from images',
    async exec(sock, message, args) {
        try {
            const chatId = message.key.remoteJid;
            let imageUrl = null;

            if (args.length > 0) {
                const url = args.join(' ');
                if (isValidUrl(url)) {
                    imageUrl = url;
                } else {
                    return sock.sendMessage(chatId, {
                        text: '❌ Invalid URL provided.\n\nUsage: `.removebg https://example.com/image.jpg`'
                    }, { quoted: message });
                }
            } else {
                imageUrl = await getQuotedOrOwnImageUrl(sock, message);
                if (!imageUrl) {
                    return sock.sendMessage(chatId, {
                        text: '📸 *Remove Background Command*\n\nUsage:\n• `.removebg <image_url>`\n• Reply to an image with `.removebg`\n• Send image with `.removebg`\n\nExample: `.removebg https://example.com/image.jpg`'
                    }, { quoted: message });
                }
            }

            await sock.sendMessage(chatId, {
                text: '🔄 Removing background... This may take a moment.'
            }, { quoted: message });

            // Try remove.bg API (free tier)
            try {
                const form = new FormData();
                form.append('image_url', imageUrl);
                form.append('size', 'auto');

                const response = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
                    headers: {
                        'X-Api-Key': 'TQqYgubMfJq9HG3WMfQxt9dM',
                        ...form.getHeaders()
                    },
                    responseType: 'arraybuffer',
                    timeout: 30000
                });

                if (response.status === 200 && response.data) {
                    await sock.sendMessage(chatId, {
                        image: response.data,
                        caption: '✨ *Background removed successfully!*'
                    }, { quoted: message });
                    return;
                }
            } catch (apiError) {
                console.error('remove.bg API error:', apiError.message);
            }

            // Fallback: use a free alternative
            try {
                const resp = await axios.get(`https://zx-api-rest.vercel.app/api/tools/removebg?url=${encodeURIComponent(imageUrl)}`, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                const contentType = resp.headers['content-type'] || '';
                if (contentType.startsWith('image/')) {
                    await sock.sendMessage(chatId, {
                        image: resp.data,
                        caption: '✨ *Background removed successfully!*'
                    }, { quoted: message });
                    return;
                }
            } catch (fallbackError) {
                console.error('Fallback API error:', fallbackError.message);
            }

            throw new Error('All APIs failed');

        } catch (error) {
            console.error('RemoveBG Error:', error.message);
            await sock.sendMessage(chatId, {
                text: `❌ Failed to remove background.\n\n💡 *Alternatives:*\n• Use https://remove.bg (free tier: 50 images/month)\n• Use https://www.adobe.com/express/feature/image/remove-background`
            }, { quoted: message });
        }
    }
};

function isValidUrl(string) {
    try { new URL(string); return true; } catch (_) { return false; }
}
