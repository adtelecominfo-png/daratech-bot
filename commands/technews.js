const axios = require('axios');

async function technewsCommand(sock, chatId, message) {
    try {
        const { data } = await axios.get('https://apis.davidcyril.name.ng/random/technews', { timeout: 15000 });
        const result = data?.result;

        if (!result || !result.title) {
            throw new Error('Invalid response from API');
        }

        const caption = `📰 *${result.title}*\n\n${result.description || ''}\n\n${result.link ? `🔗 ${result.link}` : ''}`.trim();

        if (result.image) {
            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: caption }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in technews command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to fetch tech news. Please try again later.'
        }, { quoted: message });
    }
}

module.exports = technewsCommand;
