const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const isOwnerOrSudo = require('../lib/isOwner');

const STATE_FILE = path.join(process.cwd(), 'data', 'autoupdate.json');
const DEFAULT_INTERVAL = 60000; // 60 seconds

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

function readState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        }
    } catch {}
    return { enabled: false, interval: DEFAULT_INTERVAL };
}

function writeState(state) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (e) {
        console.error('[autoupdate] Failed to write state:', e);
    }
}

async function checkForUpdates() {
    try {
        await run('git fetch --all --prune');
        const local = (await run('git rev-parse HEAD').catch(() => '')).trim();
        const remote = (await run('git rev-parse origin/main').catch(() => '')).trim();
        return { hasUpdate: local !== remote && local && remote, local, remote };
    } catch (e) {
        return { hasUpdate: false, error: e.message };
    }
}

async function applyUpdate() {
    try {
        await run('git reset --hard origin/main');
        await run('git clean -fd');
        await run('npm install --no-audit --no-fund');
        return true;
    } catch (e) {
        console.error('[autoupdate] Failed to apply update:', e);
        return false;
    }
}

let checkInterval = null;
let isChecking = false;

function startAutoUpdate(sock) {
    if (checkInterval) return;
    
    const state = readState();
    if (!state.enabled) return;
    
    checkInterval = setInterval(async () => {
        if (isChecking) return;
        isChecking = true;
        
        try {
            const result = await checkForUpdates();
            if (result.hasUpdate) {
                console.log(`[autoupdate] Update found: ${result.local} -> ${result.remote}`);
                const success = await applyUpdate();
                if (success) {
                    console.log('[autoupdate] Update applied, restarting...');
                    setTimeout(() => process.exit(0), 1000);
                }
            }
        } catch (e) {
            console.error('[autoupdate] Check failed:', e);
        } finally {
            isChecking = false;
        }
    }, state.interval || DEFAULT_INTERVAL);
    
    console.log(`[autoupdate] Started (interval: ${state.interval}ms)`);
}

function stopAutoUpdate() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
        console.log('[autoupdate] Stopped');
    }
}

async function autoupdateCommand(sock, chatId, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    
    if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(chatId, { text: '❌ Only bot owner or sudo can use .autoupdate' }, { quoted: message });
        return;
    }
    
    const text = message.message?.conversation?.trim() ||
                 message.message?.extendedTextMessage?.text?.trim() || '';
    const args = text.split(/\s+/).slice(1);
    const action = (args[0] || '').toLowerCase();
    
    const state = readState();
    
    if (action === 'on' || action === 'enable' || action === 'start') {
        if (state.enabled) {
            await sock.sendMessage(chatId, { text: '✅ Auto-update is already enabled.' }, { quoted: message });
            return;
        }
        state.enabled = true;
        writeState(state);
        startAutoUpdate(sock);
        await sock.sendMessage(chatId, { text: `✅ Auto-update enabled. Checking every ${state.interval}ms.` }, { quoted: message });
    } else if (action === 'off' || action === 'disable' || action === 'stop') {
        if (!state.enabled) {
            await sock.sendMessage(chatId, { text: '✅ Auto-update is already disabled.' }, { quoted: message });
            return;
        }
        state.enabled = false;
        writeState(state);
        stopAutoUpdate();
        await sock.sendMessage(chatId, { text: '✅ Auto-update disabled.' }, { quoted: message });
    } else if (action === 'status' || action === 'info') {
        const status = state.enabled ? '🟢 ON' : '🔴 OFF';
        await sock.sendMessage(chatId, { 
            text: `📋 *Auto-Update Status*\n\nStatus: ${status}\nInterval: ${state.interval}ms (${Math.round(state.interval/1000)}s)\n\nUsage:\n.autoupdate on - Enable\n.autoupdate off - Disable\n.autoupdate status - Show this` 
        }, { quoted: message });
    } else if (action === 'interval' && args[1]) {
        const ms = parseInt(args[1]);
        if (isNaN(ms) || ms < 10000) {
            await sock.sendMessage(chatId, { text: '❌ Interval must be at least 10000ms (10 seconds).' }, { quoted: message });
            return;
        }
        state.interval = ms;
        writeState(state);
        if (state.enabled) {
            stopAutoUpdate();
            startAutoUpdate(sock);
        }
        await sock.sendMessage(chatId, { text: `✅ Check interval set to ${ms}ms (${Math.round(ms/1000)}s).` }, { quoted: message });
    } else if (action === 'check') {
        await sock.sendMessage(chatId, { text: '🔍 Checking for updates...' }, { quoted: message });
        const result = await checkForUpdates();
        if (result.error) {
            await sock.sendMessage(chatId, { text: `❌ Check failed: ${result.error}` }, { quoted: message });
        } else if (result.hasUpdate) {
            await sock.sendMessage(chatId, { text: `📥 Update available!\nLocal: ${result.local}\nRemote: ${result.remote}\n\nRun .autoupdate apply to update.` }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: '✅ Already up to date.' }, { quoted: message });
        }
    } else if (action === 'apply') {
        await sock.sendMessage(chatId, { text: '🔄 Applying update...' }, { quoted: message });
        const success = await applyUpdate();
        if (success) {
            await sock.sendMessage(chatId, { text: '✅ Update applied! Restarting...' }, { quoted: message });
            setTimeout(() => process.exit(0), 1000);
        } else {
            await sock.sendMessage(chatId, { text: '❌ Failed to apply update.' }, { quoted: message });
        }
    } else {
        const status = state.enabled ? '🟢 ON' : '🔴 OFF';
        await sock.sendMessage(chatId, { 
            text: `📋 *Auto-Update Command*\n\nCurrent: ${status}\nInterval: ${state.interval}ms\n\nUsage:\n.autoupdate on - Enable auto-check\n.autoupdate off - Disable auto-check\n.autoupdate status - Show status\n.autoupdate interval <ms> - Set check interval (min 10000)\n.autoupdate check - Manual check now\n.autoupdate apply - Apply update if available` 
        }, { quoted: message });
    }
}

module.exports = { autoupdateCommand, startAutoUpdate, stopAutoUpdate, readState };