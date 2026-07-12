const fetch = require('node-fetch');

async function handleSsCommand(sock, chatId, message, match) {
    if (!match) {
        await sock.sendMessage(chatId, {
            text: `*SCREENSHOT TOOL*\n\n*.ss <url>*\n*.ssweb <url>*\n*.screenshot <url>*\n\nTake a screenshot of any website\n\nExample:\n.ss https://google.com\n.ssweb https://google.com\n.screenshot https://google.com`,
            quoted: message
        });
        return;
    }

    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        const url = match.trim();

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return sock.sendMessage(chatId, {
                text: '❌ Please provide a valid URL starting with http:// or https://',
                quoted: message
            });
        }

        // Try multiple screenshot APIs
        const apis = [
            `https://image.thum.io/get/width/1920/crop/675/noanimate/${encodeURIComponent(url)}`,
            `https://api.screenshotmachine.com/?key=3e75e8&url=${encodeURIComponent(url)}&dimension=1024x768`,
            `https://mini.s-shot.ru/ipad/1920/1080/?${encodeURIComponent(url)}`
        ];

        let imageBuffer = null;
        for (const apiUrl of apis) {
            try {
                const response = await fetch(apiUrl, { timeout: 30000 });
                if (response.ok) {
                    imageBuffer = await response.buffer();
                    if (imageBuffer.length > 1000) break;
                }
            } catch {}
        }

        if (!imageBuffer) throw new Error('All screenshot APIs failed');

        await sock.sendMessage(chatId, { image: imageBuffer }, { quoted: message });

    } catch (error) {
        console.error('❌ Error in ss command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to take screenshot. Please try again in a few minutes.',
            quoted: message
        });
    }
}

module.exports = { handleSsCommand };
