const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');

const IS_LINUX = process.platform === 'linux';
const IS_WIN = process.platform === 'win32';

let lastCoreSamples = getCpuCoreUsageSample();
let cachedDiskInfo = { totalGB: 0, freeGB: 0, usedGB: 0, usedPercent: 0, name: IS_LINUX ? '/ (Root)' : 'C:' };
let cachedPingHistory = [];
const MAX_PING_HISTORY = 40;

let cachedBatteryHistory = [];
const MAX_BATTERY_HISTORY = 30;
let cachedBatteryInfo = {
    hasBattery: false,
    percent: 100,
    charging: false,
    statusText: 'AC Connected',
    powerLine: 'AC',
    voltageMV: null,
    history: []
};

let cachedGpuInfo = {
    name: 'Standard Graphics Accelerator',
    driverVersion: 'Unknown',
    vramMB: 1024,
    status: 'Active'
};

function getCpuCoreUsageSample() {
    return os.cpus().map(cpu => {
        const { user, nice, sys, idle, irq } = cpu.times;
        const total = user + nice + sys + idle + (irq || 0);
        return { idle, total, speed: cpu.speed, model: cpu.model };
    });
}

function calculatePerCorePercentages() {
    const current = getCpuCoreUsageSample();
    const corePercentages = [];

    for (let i = 0; i < current.length; i++) {
        const prev = lastCoreSamples[i] || current[i];
        const idleDiff = current[i].idle - prev.idle;
        const totalDiff = current[i].total - prev.total;
        let usage = 0;
        if (totalDiff > 0) {
            usage = 100 - Math.floor((idleDiff / totalDiff) * 100);
        }
        corePercentages.push({
            coreId: i,
            usage: Math.max(0, Math.min(100, usage)),
            speedMHz: current[i].speed,
            unparked: true
        });
    }
    lastCoreSamples = current;
    return corePercentages;
}

/**
 * Cross-Platform ICMP Ping Prober
 */
function probePing(host = '1.1.1.1') {
    return new Promise((resolve) => {
        const start = Date.now();
        const pingCmd = IS_WIN ? `ping -n 1 -w 800 ${host}` : `ping -c 1 -W 1 ${host}`;

        exec(pingCmd, (err, stdout) => {
            if (err) {
                resolve({ host, latency: 999, success: false });
                return;
            }
            const match = stdout.match(/time[=<](\d+(?:\.\d+)?)\s*ms/i);
            if (match) {
                resolve({ host, latency: Math.round(parseFloat(match[1])), success: true });
            } else {
                const fallbackTime = Date.now() - start;
                resolve({ host, latency: fallbackTime, success: true });
            }
        });
    });
}

/**
 * Benchmark popular DNS and Gaming endpoints
 */
const DNS_BENCHMARK_TARGETS = [
    { name: 'Cloudflare 1.1.1.1 (Ultra-Low Jitter)', ip: '1.1.1.1', provider: 'Cloudflare' },
    { name: 'Google Public 8.8.8.8 (High Bandwidth)', ip: '8.8.8.8', provider: 'Google' },
    { name: 'Quad9 9.9.9.9 (Malware Block + Speed)', ip: '9.9.9.9', provider: 'Quad9' },
    { name: 'OpenDNS 208.67.222.222 (Anycast)', ip: '208.67.222.222', provider: 'Cisco OpenDNS' },
    { name: 'Riot Games EU/NA Cluster (Valorant/LoL)', ip: '162.249.72.1', provider: 'Riot Direct' },
    { name: 'Valve Steam Cluster (CS2/Dota)', ip: '162.254.192.1', provider: 'Valve SDR' }
];

async function benchmarkDNS() {
    const results = await Promise.all(
        DNS_BENCHMARK_TARGETS.map(async (target) => {
            const probe = await probePing(target.ip);
            return {
                name: target.name,
                ip: target.ip,
                provider: target.provider,
                pingMs: probe.latency,
                online: probe.success && probe.latency < 500
            };
        })
    );
    // Sort fastest first
    results.sort((a, b) => a.pingMs - b.pingMs);
    return results;
}

/**
 * Cross-Platform Disk Metrics
 */
function updateDiskInfo() {
    return new Promise((resolve) => {
        if (IS_LINUX) {
            exec('df -B1 / | tail -n 1', (err, stdout) => {
                if (!err && stdout) {
                    try {
                        const parts = stdout.trim().split(/\s+/);
                        if (parts.length >= 4) {
                            const totalBytes = parseInt(parts[1], 10);
                            const usedBytes = parseInt(parts[2], 10);
                            const freeBytes = parseInt(parts[3], 10);
                            const totalGB = (totalBytes / (1024 ** 3)).toFixed(1);
                            const usedGB = (usedBytes / (1024 ** 3)).toFixed(1);
                            const freeGB = (freeBytes / (1024 ** 3)).toFixed(1);
                            const usedPercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;
                            cachedDiskInfo = { totalGB, freeGB, usedGB, usedPercent, name: '/ (Root NVMe/SSD)' };
                        }
                    } catch (e) {}
                }
                resolve(cachedDiskInfo);
            });
            return;
        }

        // Windows
        exec('powershell.exe -NoProfile -Command "Get-PSDrive C | Select-Object Used,Free | ConvertTo-Json"', (err, stdout) => {
            if (!err && stdout) {
                try {
                    const data = JSON.parse(stdout);
                    const freeBytes = data.Free || 0;
                    const usedBytes = data.Used || 0;
                    const totalBytes = freeBytes + usedBytes;
                    const totalGB = (totalBytes / (1024 ** 3)).toFixed(1);
                    const freeGB = (freeBytes / (1024 ** 3)).toFixed(1);
                    const usedGB = (usedBytes / (1024 ** 3)).toFixed(1);
                    const usedPercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;
                    cachedDiskInfo = { totalGB, freeGB, usedGB, usedPercent, name: 'C: (System OS)' };
                } catch (e) {}
            }
            resolve(cachedDiskInfo);
        });
    });
}

/**
 * Cross-Platform Battery & Power Telemetry
 */
function updateBatteryInfo() {
    return new Promise((resolve) => {
        if (IS_LINUX) {
            // Check Linux sysfs power supply or Termux
            if (fs.existsSync('/sys/class/power_supply/BAT0') || fs.existsSync('/sys/class/power_supply/BAT1')) {
                const batDir = fs.existsSync('/sys/class/power_supply/BAT0') ? '/sys/class/power_supply/BAT0' : '/sys/class/power_supply/BAT1';
                try {
                    const capacity = parseInt(fs.readFileSync(`${batDir}/capacity`, 'utf8').trim(), 10) || 100;
                    const status = (fs.readFileSync(`${batDir}/status`, 'utf8') || 'Discharging').trim();
                    const isCharging = status.toLowerCase().includes('charging');
                    cachedBatteryHistory.push(capacity);
                    if (cachedBatteryHistory.length > MAX_BATTERY_HISTORY) cachedBatteryHistory.shift();

                    cachedBatteryInfo = {
                        hasBattery: true,
                        percent: capacity,
                        charging: isCharging,
                        statusText: isCharging ? 'Charging (AC)' : 'On Battery (Discharging)',
                        powerLine: isCharging ? 'AC Connected' : 'Battery (DC)',
                        voltageMV: null,
                        history: cachedBatteryHistory
                    };
                } catch (e) {}
                resolve(cachedBatteryInfo);
                return;
            }

            // Android Termux fallback
            exec('termux-battery-status', (err, stdout) => {
                if (!err && stdout) {
                    try {
                        const data = JSON.parse(stdout);
                        const pct = data.percentage || 100;
                        const isCharging = data.status === 'CHARGING';
                        cachedBatteryHistory.push(pct);
                        if (cachedBatteryHistory.length > MAX_BATTERY_HISTORY) cachedBatteryHistory.shift();
                        cachedBatteryInfo = {
                            hasBattery: true,
                            percent: pct,
                            charging: isCharging,
                            statusText: isCharging ? 'Charging (AC)' : 'Discharging',
                            powerLine: data.plugged || 'BATTERY',
                            voltageMV: data.temperature ? Math.round(data.temperature * 100) : null,
                            history: cachedBatteryHistory
                        };
                    } catch (e) {}
                }
                resolve(cachedBatteryInfo);
            });
            return;
        }

        // Windows
        exec('powershell.exe -NoProfile -Command "Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object EstimatedChargeRemaining, BatteryStatus, DesignVoltage | ConvertTo-Json"', (err, stdout) => {
            if (!err && stdout) {
                try {
                    const data = JSON.parse(stdout.trim());
                    if (data && typeof data.EstimatedChargeRemaining === 'number') {
                        const pct = data.EstimatedChargeRemaining;
                        // BatteryStatus: 1=Discharging, 2=AC/Unknown, 3=Fully Charged, 6-9=Charging
                        const isCharging = data.BatteryStatus >= 6 && data.BatteryStatus <= 9;
                        const onBattery = data.BatteryStatus === 1;

                        cachedBatteryHistory.push(pct);
                        if (cachedBatteryHistory.length > MAX_BATTERY_HISTORY) cachedBatteryHistory.shift();

                        cachedBatteryInfo = {
                            hasBattery: true,
                            percent: pct,
                            charging: isCharging,
                            statusText: isCharging ? 'Charging (AC Power)' : (onBattery ? 'On Battery (Discharging)' : 'AC Plugged In'),
                            powerLine: onBattery ? 'Battery (DC)' : 'AC Connected',
                            voltageMV: data.DesignVoltage || null,
                            history: cachedBatteryHistory
                        };
                        resolve(cachedBatteryInfo);
                        return;
                    }
                } catch (e) {}
            }
            resolve(cachedBatteryInfo);
        });
    });
}

/**
 * Cross-Platform GPU Hardware Prober
 */
function updateGpuInfo() {
    return new Promise((resolve) => {
        if (IS_LINUX) {
            exec('lspci | grep -iE "vga|3d|display" | head -n 1', (err, stdout) => {
                if (!err && stdout) {
                    const line = stdout.trim();
                    const cleanName = line.replace(/^[0-9a-f:.]+\s+[^:]+:\s+/i, '');
                    cachedGpuInfo = {
                        name: cleanName || 'Linux Graphics Device',
                        driverVersion: 'DRI / Kernel Direct Mode',
                        vramMB: 2048,
                        status: 'Active'
                    };
                }
                resolve(cachedGpuInfo);
            });
            return;
        }

        // Windows
        exec('powershell.exe -NoProfile -Command "Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | Select-Object Name, DriverVersion, AdapterRAM | ConvertTo-Json"', (err, stdout) => {
            if (!err && stdout) {
                try {
                    let data = JSON.parse(stdout.trim());
                    if (Array.isArray(data)) data = data[0];
                    if (data && data.Name) {
                        const vramBytes = data.AdapterRAM || 0;
                        cachedGpuInfo = {
                            name: data.Name,
                            driverVersion: data.DriverVersion || 'WDDM Universal',
                            vramMB: vramBytes > 0 ? Math.round(vramBytes / (1024 * 1024)) : 1024,
                            status: 'Hardware Accelerated'
                        };
                    }
                } catch (e) {}
            }
            resolve(cachedGpuInfo);
        });
    });
}

/**
 * Scan running processes for popular games (Linux + Windows)
 */
const KNOWN_GAME_EXES = [
    'valorant', 'riotclientservices', 'cs2', 'csgo', 'fortniteclient-win64-shipping',
    'cod', 'modernwarfare', 'r5apex', 'overwatch', 'gta5', 'leagueclient',
    'robloxplayerbeta', 'minecraft', 'javaw', 'dota2', 'destiny2', 'pubg',
    'rocketleague', 'rainbowsix', 'cyberpunk2077', 'helldivers2',
    'bloodstrike', 'bloodstrikepc', 'gameloop', 'appmarket', 'androidprocess',
    'hd-player', 'dnplayer', 'nox', 'mumuplayer', 'bluestacks', 'qemu-system',
    'steam', 'steamwebhelper', 'wine64-preloader', 'gamescope', 'heroic',
    'lutris', 'mangohud', 'proton',
    // Android / Termux Mobile Packages
    'com.activision.callofduty.shooter', 'com.netease.bloodstrike', 'com.tencent.ig',
    'com.pubg.imobile', 'com.dts.freefireth', 'com.dts.freefiremax', 'com.roblox.client',
    'com.mojang.minecraftpe', 'com.riotgames.league.wildrift', 'com.supercell.brawlstars'
];

function scanActiveGames() {
    return new Promise((resolve) => {
        if (IS_LINUX) {
            exec('ps -eo pid,comm,rss,%cpu --no-headers', (err, stdout) => {
                if (err || !stdout) {
                    resolve([]);
                    return;
                }
                const activeGames = [];
                const lines = stdout.trim().split('\n');
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 4) {
                        const pid = parseInt(parts[0], 10);
                        const comm = parts[1];
                        const rssKB = parseInt(parts[2], 10);
                        const cpu = parseFloat(parts[3]);
                        const lower = comm.toLowerCase();
                        if (KNOWN_GAME_EXES.some(g => lower.includes(g))) {
                            activeGames.push({
                                name: comm,
                                id: pid,
                                memoryMB: Math.round(rssKB / 1024),
                                cpuTime: Math.round(cpu)
                            });
                        }
                    }
                }
                resolve(activeGames);
            });
            return;
        }

        // Windows
        exec('powershell.exe -NoProfile -Command "Get-Process | Select-Object ProcessName, Id, WS, CPU | ConvertTo-Json"', (err, stdout) => {
            if (err || !stdout) {
                resolve([]);
                return;
            }
            try {
                let procs = JSON.parse(stdout);
                if (!Array.isArray(procs)) procs = [procs];
                const activeGames = [];
                for (const p of procs) {
                    if (!p.ProcessName) continue;
                    const lower = p.ProcessName.toLowerCase();
                    if (KNOWN_GAME_EXES.some(g => lower.includes(g))) {
                        activeGames.push({
                            name: p.ProcessName,
                            id: p.Id,
                            memoryMB: Math.round((p.WS || 0) / (1024 * 1024)),
                            cpuTime: Math.round(p.CPU || 0)
                        });
                    }
                }
                resolve(activeGames);
            } catch (e) {
                resolve([]);
            }
        });
    });
}

/**
 * Aggregate complete real-time telemetry snapshot
 */
async function getTelemetrySnapshot() {
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    const totalMemGB = (totalMemBytes / (1024 ** 3)).toFixed(2);
    const usedMemGB = (usedMemBytes / (1024 ** 3)).toFixed(2);
    const freeMemGB = (freeMemBytes / (1024 ** 3)).toFixed(2);
    const memPercent = Math.round((usedMemBytes / totalMemBytes) * 100);

    const cores = calculatePerCorePercentages();
    const totalCpuUsage = Math.round(cores.reduce((acc, c) => acc + c.usage, 0) / (cores.length || 1));
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : (IS_LINUX ? 'Linux Processor' : 'Generic CPU');

    const [pingPrimary, pingSecondary] = await Promise.all([
        probePing('1.1.1.1'),
        probePing('8.8.8.8')
    ]);

    const activeLatency = pingPrimary.success ? pingPrimary.latency : pingSecondary.latency;
    
    cachedPingHistory.push(activeLatency);
    if (cachedPingHistory.length > MAX_PING_HISTORY) cachedPingHistory.shift();

    let jitter = 0;
    if (cachedPingHistory.length > 1) {
        let diffSum = 0;
        for (let i = 1; i < cachedPingHistory.length; i++) {
            diffSum += Math.abs(cachedPingHistory[i] - cachedPingHistory[i - 1]);
        }
        jitter = +(diffSum / (cachedPingHistory.length - 1)).toFixed(1);
    }

    const pingScore = Math.max(0, 100 - (activeLatency * 1.2));
    const jitterScore = Math.max(0, 100 - (jitter * 4));
    const memScore = Math.max(0, 100 - (memPercent * 0.7));
    const cpuScore = Math.max(0, 100 - (totalCpuUsage * 0.5));
    const latencyIndex = Math.min(99, Math.max(15, Math.round(
        (pingScore * 0.4) + (jitterScore * 0.25) + (memScore * 0.2) + (cpuScore * 0.15)
    )));

    return {
        timestamp: Date.now(),
        os: IS_LINUX ? 'Linux' : (IS_WIN ? 'Windows' : 'macOS'),
        cpu: {
            usagePercent: totalCpuUsage,
            model: cpuModel,
            cores: cores.length,
            coreDetails: cores
        },
        memory: {
            totalGB: totalMemGB,
            usedGB: usedMemGB,
            freeGB: freeMemGB,
            percent: memPercent,
            totalMB: Math.round(totalMemBytes / (1024 * 1024)),
            usedMB: Math.round(usedMemBytes / (1024 * 1024)),
            freeMB: Math.round(freeMemBytes / (1024 * 1024))
        },
        storage: cachedDiskInfo,
        network: {
            pingMs: activeLatency,
            jitterMs: jitter,
            primaryNode: pingPrimary.host,
            secondaryPingMs: pingSecondary.latency,
            history: cachedPingHistory
        },
        battery: cachedBatteryInfo,
        gpu: cachedGpuInfo,
        latencyIndex
    };
}

updateDiskInfo();
setInterval(updateDiskInfo, 10000);

updateBatteryInfo();
setInterval(updateBatteryInfo, 4000);

updateGpuInfo();
setInterval(updateGpuInfo, 30000);

module.exports = {
    getTelemetrySnapshot,
    scanActiveGames,
    benchmarkDNS,
    updateDiskInfo,
    updateBatteryInfo,
    updateGpuInfo,
    getBatteryTelemetry: () => cachedBatteryInfo,
    getGpuTelemetry: () => cachedGpuInfo,
    IS_LINUX,
    IS_WIN
};
