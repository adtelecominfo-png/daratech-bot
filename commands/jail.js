const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const sharp = require('sharp');

async function jailCommand(sock, chatId, message, quotedMessage) {
    try {
        let imageBuffer;

        if (quotedMessage?.imageMessage) {
            imageBuffer = await downloadMediaMessage(
                { message: { imageMessage: quotedMessage.imageMessage } },
                'buffer',
                {},
                {}
            );
        } else if (message.message?.imageMessage) {
            imageBuffer = await downloadMediaMessage(message, 'buffer', {}, {});
        } else {
            // Fall back to the sender's profile picture
            const senderId = message.key.participant || message.key.remoteJid;
            try {
                const url = await sock.profilePictureUrl(senderId, 'image');
                const res = await axios.get(url, { responseType: 'arraybuffer' });
                imageBuffer = Buffer.from(res.data);
            } catch {
                return await sock.sendMessage(chatId, {
                    text: '❌ Please reply to an image, send an image with caption .jail, or set a profile picture.'
                }, { quoted: message });
            }
        }

        // Process image locally with sharp: add vertical jail bars
        const metadata = await sharp(imageBuffer).metadata();
        const width = metadata.width || 512;
        const height = metadata.height || 512;
        
        // Resize to max 512px (WhatsApp sticker/image limits)
        const scale = Math.min(512 / width, 512 / height, 1);
        const newWidth = Math.round(width * scale);
        const newHeight = Math.round(height * scale);

        // Create jail bars overlay SVG
        const barCount = 8;
        const barWidth = Math.max(2, Math.round(newWidth * 0.015));
        const gap = Math.round(newWidth / (barCount + 1));
        
        let barsSvg = '';
        for (let i = 1; i <= barCount; i++) {
            const x = i * gap;
            barsSvg += `<rect x="${x}" y="0" width="${barWidth}" height="${newHeight}" fill="#222" opacity="0.85"/>`;
        }
        
        const overlaySvg = `
            <svg width="${newWidth}" height="${newHeight}" xmlns="http://www.w3.org/2000/svg">
                ${barsSvg}
                <!-- Horizontal bars at top and bottom -->
                <rect x="0" y="0" width="${newWidth}" height="${Math.max(3, Math.round(newHeight * 0.02))}" fill="#222" opacity="0.9"/>
                <rect x="0" y="${newHeight - Math.max(3, Math.round(newHeight * 0.02))}" width="${newWidth}" height="${Math.max(3, Math.round(newHeight * 0.02))}" fill="#222" opacity="0.9"/>
            </svg>
        `;

        // Composite: resize image + overlay bars
        const processed = await sharp(imageBuffer)
            .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
            .composite([{
                input: Buffer.from(overlaySvg),
                gravity: 'center'
            }])
            .jpeg({ quality: 85 })
            .toBuffer();

        await sock.sendMessage(chatId, {
            image: processed,
            caption: '🔒 *Locked up!*'
        }, { quoted: message });

    } catch (error) {
        console.error('Error in jail command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to create jail image. Please try again later.'
        }, { quoted: message });
    }
}

module.exports = jailCommand;
