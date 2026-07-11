// AFK command -- feature ported from Levanter's plugins/afk.js concept
// (mark yourself away, auto-reply when mentioned/replied-to), rewritten
// from Levanter's `bot()` plugin/Sequelize model into Daratech Bot's plain
// function + JSON-file storage style (see lib/index.js for the pattern).
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/afk.json');

function loadAfk() {
    try {
        if (!fs.existsSync(dataPath)) {
            fs.writeFileSync(dataPath, JSON.stringify({}, null, 2));
            return {};
        }
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (error) {
        console.error('Error loading afk data:', error);
        return {};
    }
}

function saveAfk(data) {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving afk data:', error);
    }
}

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours) return `${hours}h ${minutes}m ago`;
    if (minutes) return `${minutes}m ${seconds}s ago`;
    return `${seconds}s ago`;
}

// .afk [reason] -- mark the sender as AFK
async function afkCommand(sock, chatId, message, senderId, reasonText) {
    const data = loadAfk();
    data[senderId] = {
        reason: (reasonText || '').trim() || 'AFK',
        since: Date.now()
    };
    saveAfk(data);
    return sock.sendMessage(chatId, {
        text: `💤 You're now AFK: *${data[senderId].reason}*\nI'll let people know if they mention or reply to you.`
    }, { quoted: message });
}

// Called on every non-command message: clears AFK for the sender if they
// were AFK, and warns anyone who mentions/replies to a currently-AFK user.
async function handleAfk(sock, chatId, message, senderId) {
    try {
        const data = loadAfk();
        let changed = false;

        // Sender is back -- clear their AFK status.
        if (data[senderId]) {
            const since = data[senderId].since;
            delete data[senderId];
            changed = true;
            await sock.sendMessage(chatId, {
                text: `👋 Welcome back! You were AFK for ${formatDuration(Date.now() - since)}.`
            }, { quoted: message });
        }

        // Check if this message mentions or replies to an AFK user.
        const ctx = message.message?.extendedTextMessage?.contextInfo;
        const mentioned = ctx?.mentionedJid || [];
        const repliedTo = ctx?.participant;
        const targets = [...mentioned, repliedTo].filter(Boolean);

        for (const target of targets) {
            if (data[target] && target !== senderId) {
                const info = data[target];
                await sock.sendMessage(chatId, {
                    text: `💤 @${target.split('@')[0]} is AFK: *${info.reason}* (since ${formatDuration(Date.now() - info.since)})`,
                    mentions: [target]
                }, { quoted: message });
                break; // one notice is enough per message
            }
        }

        if (changed) saveAfk(data);
    } catch (error) {
        console.error('Error in handleAfk:', error);
    }
}

module.exports = { afkCommand, handleAfk };
