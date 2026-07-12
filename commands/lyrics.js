const fetch = require('node-fetch');

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        await sock.sendMessage(chatId, {
            text: '🔍 Please enter the song name to get the lyrics! Usage: *lyrics <song name>*'
        },{ quoted: message });
        return;
    }

    try {
        const apiUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(songTitle)}`;
        const res = await fetch(apiUrl);

        if (!res.ok) {
            // Try artist - title format
            const parts = songTitle.split(' - ');
            if (parts.length === 2) {
                const artistUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`;
                const artistRes = await fetch(artistUrl);
                if (!artistRes.ok) throw new Error('Not found');
                const artistData = await artistRes.json();
                const artistLyrics = artistData.lyrics || null;
                if (!artistLyrics) throw new Error('No lyrics');
                const truncated = artistLyrics.length > 4096 ? artistLyrics.slice(0, 4093) + '...' : artistLyrics;
                await sock.sendMessage(chatId, { text: truncated }, { quoted: message });
                return;
            }
            throw new Error('Not found');
        }

        const data = await res.json();
        const lyrics = data.lyrics || null;

        if (!lyrics) {
            await sock.sendMessage(chatId, {
                text: `❌ Sorry, I couldn't find any lyrics for "${songTitle}".`
            },{ quoted: message });
            return;
        }

        const maxChars = 4096;
        const output = lyrics.length > maxChars ? lyrics.slice(0, maxChars - 3) + '...' : lyrics;

        await sock.sendMessage(chatId, { text: output }, { quoted: message });
    } catch (error) {
        console.error('Error in lyrics command:', error);
        await sock.sendMessage(chatId, {
            text: `❌ An error occurred while fetching the lyrics for "${songTitle}".`
        },{ quoted: message });
    }
}

module.exports = { lyricsCommand };
