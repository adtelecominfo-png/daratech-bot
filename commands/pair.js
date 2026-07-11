const settings = require('../settings');

/**
 * .pair <phone> — generate a WhatsApp pairing code for the given number.
 *
 * The person with that number then goes to:
 *   WhatsApp → Settings → Linked Devices → Link a Device → Enter code
 * and types the code the bot replies with.
 *
 * Owner-only. Works in DM or any group the owner is in.
 */
async function pairCommand(sock, chatId, message) {
    try {
        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        // Extract the phone number argument
        const rawArg = text.split(/\s+/).slice(1).join('').trim();
        const phoneNumber = rawArg.replace(/[^0-9]/g, '');

        if (!phoneNumber) {
            return await sock.sendMessage(chatId, {
                text: `❌ Please provide a phone number.\n\n*Usage:* .pair 2348100785677\n_(country code + number, no + or spaces)_`
            }, { quoted: message });
        }

        // Basic length check (7–15 digits is the ITU range)
        if (phoneNumber.length < 7 || phoneNumber.length > 15) {
            return await sock.sendMessage(chatId, {
                text: `❌ *${rawArg}* doesn't look like a valid international number.\n\nExample: .pair 2348100785677`
            }, { quoted: message });
        }

        // React to show the bot is working on it
        await sock.sendMessage(chatId, {
            react: { text: '⏳', key: message.key }
        });

        let code;
        try {
            code = await sock.requestPairingCode(phoneNumber);
        } catch (err) {
            // Common failure: session already fully registered with a different number.
            // The user needs to clear the session first if they want to re-pair.
            const errMsg = err?.message || String(err);
            if (/already registered|registered/i.test(errMsg)) {
                return await sock.sendMessage(chatId, {
                    text: `⚠️ This bot session is already linked to a number.\n\nTo re-pair with a different number, clear the session first with *.clearsession*, then try *.pair* again once the bot restarts.`
                }, { quoted: message });
            }
            throw err;
        }

        // Format as XXXX-XXXX
        const formatted = code?.match(/.{1,4}/g)?.join('-') || code;

        const reply =
            `🔗 *Pairing Code for* +${phoneNumber}\n\n` +
            `┌──────────────────┐\n` +
            `│  *${formatted.padEnd(9)}*       │\n` +
            `└──────────────────┘\n\n` +
            `*How to use this code:*\n` +
            `1️⃣ Open WhatsApp on that phone\n` +
            `2️⃣ Go to *Settings → Linked Devices*\n` +
            `3️⃣ Tap *Link a Device*\n` +
            `4️⃣ Tap *Link with phone number* instead of scanning\n` +
            `5️⃣ Enter the code above\n\n` +
            `⏱ Code expires in ~60 seconds. Use it quickly!`;

        await sock.sendMessage(chatId, {
            text: reply
        }, { quoted: message });

        // Swap the reaction to ✅
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

    } catch (error) {
        console.error('Error in pair command:', error);
        await sock.sendMessage(chatId, {
            text: `❌ Failed to generate pairing code.\n\n_Reason: ${error?.message || 'Unknown error'}_\n\nMake sure the number is correct and try again.`
        }, { quoted: message });
    }
}

module.exports = pairCommand;
