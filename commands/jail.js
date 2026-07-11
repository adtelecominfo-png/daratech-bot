const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');

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

        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
        const response = await axios.get('https://apis.davidcyril.name.ng/canvas/jail', {
            params: { image: base64Image },
            responseType: 'arraybuffer',
            timeout: 20000
        });

        await sock.sendMessage(chatId, {
            image: Buffer.from(response.data),
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
