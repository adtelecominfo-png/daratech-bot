const settings = require("../settings");
// Uptime/RAM/platform header using helpers in lib/myfunc.js.
const { getUptime, getRam, getPlatform, getDate } = require("../lib/myfunc");

async function aliveCommand(sock, chatId, message) {
    try {
        const { date, time, weekday } = getDate();
        const message1 = `*🤖 Daratech Bot is Active!*\n\n` +
                       `*Version:* ${settings.version}\n` +
                       `*Status:* Online\n` +
                       `*Mode:* Public\n` +
                       `*Uptime:* ${getUptime()}\n` +
                       `*RAM:* ${getRam()}\n` +
                       `*Platform:* ${getPlatform()}\n` +
                       `*Date:* ${weekday}, ${date} ${time}\n\n` +
                       `*🌟 Features:*\n` +
                       `• Group Management\n` +
                       `• Antilink Protection\n` +
                       `• Fun Commands\n` +
                       `• And more!\n\n` +
                       `Type *.menu* for full command list`;

        await sock.sendMessage(chatId, {
            text: message1
        }, { quoted: message });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: 'Bot is alive and running!' }, { quoted: message });
    }
}

module.exports = aliveCommand;