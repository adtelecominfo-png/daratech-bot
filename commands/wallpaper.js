const axios = require('axios');

async function wallpaperCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const query = text.split(' ').slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: 'Please provide a search term.\n\nExample: .wallpaper nature'
            }, { quoted: message });
        }

        const { data } = await axios.get('https://apis.davidcyril.name.ng/search/wallpaper', {
            params: { text: query },
            timeout: 15000
        });

        const results = data?.result;
        if (!data?.success || !Array.isArray(results) || results.length === 0) {
            throw new Error('No wallpapers found');
        }

        const pick = results[Math.floor(Math.random() * Math.min(results.length, 10))];

        await sock.sendMessage(chatId, {
            image: { url: pick.image },
            caption: `🖼️ *${pick.title || query}*`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in wallpaper command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to fetch a wallpaper. Please try a different search term.'
        }, { quoted: message });
    }
}

module.exports = wallpaperCommand;
