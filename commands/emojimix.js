const fetch = require('node-fetch');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const API_KEY = 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq';

async function emojimixCommand(sock, chatId, msg) {
    try {
        const text = msg.message?.conversation?.trim() || 
                    msg.message?.extendedTextMessage?.text?.trim() || '';
        const args = text.split(' ').slice(1);

        if (!args[0]) {
            await sock.sendMessage(chatId, { text: '🎴 Example: .emojimix 😎+🥰' });
            return;
        }

        if (!text.includes('+')) {
            await sock.sendMessage(chatId, {
                text: '✳️ Separate the emoji with a *+* sign\n\n📌 Example: \n*.emojimix* 😎+🥰'
            });
            return;
        }

        let [emoji1, emoji2] = args[0].split('+').map(e => e.trim());

        // Try Tenor API first
        let imageUrl = null;
        try {
            const tenorUrl = `https://tenor.googleapis.com/v2/featured?key=${API_KEY}&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`;
            const response = await fetch(tenorUrl);
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                imageUrl = data.results[0].url;
            }
        } catch (tenorError) {
            console.error('Tenor API error:', tenorError.message);
        }

        // Fallback: construct Google Emoji Kitchen URL directly
        if (!imageUrl) {
            const code1 = emoji1.codePointAt(0).toString(16);
            const code2 = emoji2.codePointAt(0).toString(16);
            imageUrl = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${code1}/u${code1}_u${code2}.png`;
        }

        // Download the image
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const tempFile = path.join(tmpDir, `temp_${Date.now()}.png`).replace(/\\/g, '/');
        const outputFile = path.join(tmpDir, `sticker_${Date.now()}.webp`).replace(/\\/g, '/');

        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error('Failed to fetch emoji mix image');
        const buffer = await imageResponse.buffer();
        fs.writeFileSync(tempFile, buffer);

        const ffmpegCommand = `ffmpeg -i "${tempFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" "${outputFile}"`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error) => {
                if (error) { reject(error); } else { resolve(); }
            });
        });

        if (!fs.existsSync(outputFile)) throw new Error('Failed to create sticker file');

        const stickerBuffer = fs.readFileSync(outputFile);

        await sock.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: msg });

        try { fs.unlinkSync(tempFile); fs.unlinkSync(outputFile); } catch {}

    } catch (error) {
        console.error('Error in emojimix command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to mix emojis! Make sure you\'re using valid emojis.\n\nExample: .emojimix 😎+🥰'
        });
    }
}

module.exports = emojimixCommand;
