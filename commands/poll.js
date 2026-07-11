// Poll command -- sends a native WhatsApp poll message using Baileys' built-in
// `poll` message type directly.

// Usage: .poll Question? | Option1 | Option2 | Option3
async function pollCommand(sock, chatId, message, rawText) {
    const text = (rawText || '').trim();
    if (!text || !text.includes('|')) {
        return sock.sendMessage(chatId, {
            text: '📊 *Poll Command*\n\nUsage: *.poll Question? | Option 1 | Option 2 | Option 3*\n\nExample:\n.poll What should we eat? | Pizza | Burger | Sushi'
        }, { quoted: message });
    }

    const parts = text.split('|').map(p => p.trim()).filter(Boolean);
    const question = parts.shift();
    const options = parts.slice(0, 12); // WhatsApp caps poll options at 12

    if (!question || options.length < 2) {
        return sock.sendMessage(chatId, {
            text: '⚠️ Please provide a question and at least 2 options, separated by "|".'
        }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1
            }
        }, { quoted: message });
    } catch (error) {
        console.error('Error sending poll:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to create the poll.' }, { quoted: message });
    }
}

module.exports = { pollCommand };
