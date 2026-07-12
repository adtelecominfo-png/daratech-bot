const { handleAntiBadwordCommand, badWords } = require('../lib/antibadword');
const isAdminHelper = require('../lib/isAdmin');

async function antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin) {
    try {
        const text = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || '';
        const args = text.split(' ').slice(1);
        const match = args.join(' ');
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'list' || sub === 'badwordlist' || sub === 'words') {
            if (!isSenderAdmin) {
                await sock.sendMessage(chatId, { text: '```For Group Admins Only!```' }, { quoted: message });
                return;
            }
            const wordList = badWords.map((w, i) => `${i+1}. ${w}`).join('\n');
            const total = badWords.length;
            await sock.sendMessage(chatId, { 
                text: `📋 *Bad Words List (${total} words)*\n\n${wordList}` 
            }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '```For Group Admins Only!```' }, { quoted: message });
            return;
        }

        await handleAntiBadwordCommand(sock, chatId, message, match);
    } catch (error) {
        console.error('Error in antibadword command:', error);
        await sock.sendMessage(chatId, { text: '*Error processing antibadword command*' }, { quoted: message });
    }
}

module.exports = antibadwordCommand; 