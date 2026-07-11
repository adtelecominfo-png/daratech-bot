// Reminder command -- lightweight in-memory setTimeout scheduler.
// Reminders don't persist across restarts.

// Usage: .remind 10m Take the food out of the oven
const UNIT_MS = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

function parseDuration(input) {
    const match = /^(\d+)(s|m|h|d)$/i.exec(input.trim());
    if (!match) return null;
    const [, amount, unit] = match;
    return Number(amount) * UNIT_MS[unit.toLowerCase()];
}

async function reminderCommand(sock, chatId, message, senderId, rawText) {
    const text = (rawText || '').trim();
    const firstSpace = text.indexOf(' ');
    if (!text || firstSpace === -1) {
        return sock.sendMessage(chatId, {
            text: '⏰ *Reminder Command*\n\nUsage: *.remind <time> <message>*\nTime units: s (seconds), m (minutes), h (hours), d (days)\n\nExample:\n.remind 10m Take the food out of the oven'
        }, { quoted: message });
    }

    const durationInput = text.slice(0, firstSpace);
    const reminderText = text.slice(firstSpace + 1).trim();
    const ms = parseDuration(durationInput);

    if (!ms || !reminderText) {
        return sock.sendMessage(chatId, {
            text: '⚠️ Invalid format. Example: *.remind 30m Call mom*'
        }, { quoted: message });
    }

    if (ms > UNIT_MS.d * 7) {
        return sock.sendMessage(chatId, { text: '⚠️ Reminders can be at most 7 days out.' }, { quoted: message });
    }

    setTimeout(async () => {
        try {
            await sock.sendMessage(chatId, {
                text: `⏰ *Reminder:* ${reminderText}`,
                mentions: [senderId]
            });
        } catch (error) {
            console.error('Error sending reminder:', error);
        }
    }, ms);

    return sock.sendMessage(chatId, {
        text: `✅ Reminder set for *${durationInput}* from now:\n"${reminderText}"`
    }, { quoted: message });
}

module.exports = { reminderCommand };
