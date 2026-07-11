const { addWelcome, delWelcome, isWelcomeOn, getWelcome, addGoodbye, delGoodBye, isGoodByeOn, getGoodbye } = require('../lib/index');
const { delay } = require('@whiskeysockets/baileys');

async function handleWelcome(sock, chatId, message, match) {
    // No-arg preview: show current status + stored message, ported from
    // Levanter's plugins/greetings.js (getMessage + status preview), rewritten
    // against Daratech Bot's isWelcomeOn/getWelcome storage helpers.
    if (!match) {
        const enabled = await isWelcomeOn(chatId);
        const current = await getWelcome(chatId);
        return sock.sendMessage(chatId, {
            text: `📥 *Welcome Message Setup*\n\n` +
                `Status: *${enabled ? 'ON' : 'OFF'}*\n` +
                `${current ? `Current message:\n${current}\n\n` : ''}` +
                `✅ *.welcome on* — Enable welcome messages\n🛠️ *.welcome set Your custom message* — Set a custom welcome message\n🗑️ *.welcome delete* — Remove the custom message and go back to default\n🚫 *.welcome off* — Disable welcome messages\n\n*Available Variables:*\n• {user} - Mentions the new member\n• {group} - Shows group name\n• {description} - Shows group description`,
            quoted: message
        });
    }

    const [command, ...args] = match.split(' ');
    const lowerCommand = command.toLowerCase();
    const customMessage = args.join(' ');

    // Ported from Levanter's "delete" subcommand -- clears the custom
    // message and disables welcome, distinct from just toggling off.
    if (lowerCommand === 'delete') {
        await delWelcome(chatId);
        return sock.sendMessage(chatId, { text: '🗑️ Custom welcome message *deleted* and welcome messages disabled.', quoted: message });
    }

    if (lowerCommand === 'on') {
        if (await isWelcomeOn(chatId)) {
            return sock.sendMessage(chatId, { text: '⚠️ Welcome messages are *already enabled*.', quoted: message });
        }
        await addWelcome(chatId, true, 'Welcome {user} to {group}! 🎉');
        return sock.sendMessage(chatId, { text: '✅ Welcome messages *enabled* with simple message. Use *.welcome set [your message]* to customize.', quoted: message });
    }

    if (lowerCommand === 'off') {
        if (!(await isWelcomeOn(chatId))) {
            return sock.sendMessage(chatId, { text: '⚠️ Welcome messages are *already disabled*.', quoted: message });
        }
        await delWelcome(chatId);
        return sock.sendMessage(chatId, { text: '✅ Welcome messages *disabled* for this group.', quoted: message });
    }

    if (lowerCommand === 'set') {
        if (!customMessage) {
            return sock.sendMessage(chatId, { text: '⚠️ Please provide a custom welcome message. Example: *.welcome set Welcome to the group!*', quoted: message });
        }
        await addWelcome(chatId, true, customMessage);
        return sock.sendMessage(chatId, { text: '✅ Custom welcome message *set successfully*.', quoted: message });
    }

    // If no valid command is provided
    return sock.sendMessage(chatId, {
        text: `❌ Invalid command. Use:\n*.welcome on* - Enable\n*.welcome set [message]* - Set custom message\n*.welcome off* - Disable`,
        quoted: message
    });
}

async function handleGoodbye(sock, chatId, message, match) {
    const lower = match?.toLowerCase();

    if (!match) {
        const enabled = await isGoodByeOn(chatId);
        const current = await getGoodbye(chatId);
        return sock.sendMessage(chatId, {
            text: `📤 *Goodbye Message Setup*\n\n` +
                `Status: *${enabled ? 'ON' : 'OFF'}*\n` +
                `${current ? `Current message:\n${current}\n\n` : ''}` +
                `✅ *.goodbye on* — Enable goodbye messages\n🛠️ *.goodbye set Your custom message* — Set a custom goodbye message\n🗑️ *.goodbye delete* — Remove the custom message and go back to default\n🚫 *.goodbye off* — Disable goodbye messages\n\n*Available Variables:*\n• {user} - Mentions the leaving member\n• {group} - Shows group name`,
            quoted: message
        });
    }

    if (lower === 'delete') {
        await delGoodBye(chatId);
        return sock.sendMessage(chatId, { text: '🗑️ Custom goodbye message *deleted* and goodbye messages disabled.', quoted: message });
    }

    if (lower === 'on') {
        if (await isGoodByeOn(chatId)) {
            return sock.sendMessage(chatId, { text: '⚠️ Goodbye messages are *already enabled*.', quoted: message });
        }
        await addGoodbye(chatId, true, 'Goodbye {user} 👋');
        return sock.sendMessage(chatId, { text: '✅ Goodbye messages *enabled* with simple message. Use *.goodbye set [your message]* to customize.', quoted: message });
    }

    if (lower === 'off') {
        if (!(await isGoodByeOn(chatId))) {
            return sock.sendMessage(chatId, { text: '⚠️ Goodbye messages are *already disabled*.', quoted: message });
        }
        await delGoodBye(chatId);
        return sock.sendMessage(chatId, { text: '✅ Goodbye messages *disabled* for this group.', quoted: message });
    }

    if (lower.startsWith('set ')) {
        const customMessage = match.substring(4);
        if (!customMessage) {
            return sock.sendMessage(chatId, { text: '⚠️ Please provide a custom goodbye message. Example: *.goodbye set Goodbye!*', quoted: message });
        }
        await addGoodbye(chatId, true, customMessage);
        return sock.sendMessage(chatId, { text: '✅ Custom goodbye message *set successfully*.', quoted: message });
    }

    // If no valid command is provided
    return sock.sendMessage(chatId, {
        text: `❌ Invalid command. Use:\n*.goodbye on* - Enable\n*.goodbye set [message]* - Set custom message\n*.goodbye off* - Disable`,
        quoted: message
    });
}

module.exports = { handleWelcome, handleGoodbye };
// This code handles welcome and goodbye messages in a WhatsApp group using the Baileys library.