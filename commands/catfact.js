const axios = require('axios');

async function catfactCommand(sock, chatId, message) {
    try {
        const { data } = await axios.get('https://apis.davidcyril.name.ng/random/catfact', { timeout: 15000 });

        if (!data || !data.fact) {
            throw new Error('Invalid response from API');
        }

        await sock.sendMessage(chatId, {
            text: `🐱 *Cat Fact*\n\n${data.fact}`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in catfact command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to fetch a cat fact. Please try again later.'
        }, { quoted: message });
    }
}

module.exports = catfactCommand;
