const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const BACKUP_FILE = path.join(__dirname, '..', 'backup_state.json');

/**
 * Default safe baseline settings if no previous backup exists
 */
const DEFAULT_BASELINE = {
    networkThrottling: 10,
    systemResponsiveness: 20,
    gameDVR: 1,
    tcpAckFrequency: 0,
    tcpDelAckTicks: 0,
    activePowerScheme: '381b4222-f694-41f0-9685-ff5bb260df2e', // Balanced
    appliedTweaks: [],
    timestamp: new Date().toISOString()
};

function getBackup() {
    try {
        if (fs.existsSync(BACKUP_FILE)) {
            const data = fs.readFileSync(BACKUP_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('[Backup] Error reading backup:', err.message);
    }
    return { ...DEFAULT_BASELINE };
}

function saveBackup(state) {
    try {
        fs.writeFileSync(BACKUP_FILE, JSON.stringify(state, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('[Backup] Error writing backup:', err.message);
        return false;
    }
}

function recordTweakApplied(tweakName) {
    const backup = getBackup();
    if (!backup.appliedTweaks) backup.appliedTweaks = [];
    if (!backup.appliedTweaks.includes(tweakName)) {
        backup.appliedTweaks.push(tweakName);
        backup.lastUpdated = new Date().toISOString();
        saveBackup(backup);
    }
}

function removeTweakRecord(tweakName) {
    const backup = getBackup();
    if (backup.appliedTweaks) {
        backup.appliedTweaks = backup.appliedTweaks.filter(t => t !== tweakName);
        backup.lastUpdated = new Date().toISOString();
        saveBackup(backup);
    }
}

module.exports = {
    getBackup,
    saveBackup,
    recordTweakApplied,
    removeTweakRecord,
    DEFAULT_BASELINE
};
