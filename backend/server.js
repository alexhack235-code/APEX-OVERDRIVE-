const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const telemetry = require('./telemetry');
const optimizer = require('./optimizer');
const backup = require('./backup');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 4888;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.get('/api/telemetry', async (req, res) => {
    try {
        const snapshot = await telemetry.getTelemetrySnapshot();
        res.json(snapshot);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/games', async (req, res) => {
    try {
        const games = await telemetry.scanActiveGames();
        res.json(games);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/state', (req, res) => {
    res.json(backup.getBackup());
});

app.get('/api/dns/benchmark', async (req, res) => {
    try {
        const results = await telemetry.benchmarkDNS();
        res.json(results);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/dns/set', async (req, res) => {
    const { dnsIp } = req.body;
    const result = await optimizer.setFastestDNS(dnsIp);
    res.json(result);
});

// Master Overdrive Modes
app.post('/api/boost/overdrive', async (req, res) => {
    console.log('[API] Triggering STANDARD OVERDRIVE Boost...');
    const result = await optimizer.crazyOverdriveBoost();
    res.json(result);
});

app.post('/api/boost/deep-rust', async (req, res) => {
    console.log('[API] 🔥 Triggering DEEP RUST KERNEL OVERDRIVE (0.5ms Timer, NTDLL Memory Purge, Quantum 40)...');
    const result = await optimizer.deepRustKernelOverdrive();
    res.json(result);
});

app.get('/api/timer-resolution', async (req, res) => {
    try {
        const result = await optimizer.getTimerResolution();
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/engine-status', (req, res) => {
    const engine = optimizer.getNativeKernelExecutable();
    res.json({
        available: !!engine,
        type: engine ? engine.type : 'fallback',
        path: engine ? engine.path : null,
        os: process.platform === 'linux' ? 'Linux' : (process.platform === 'win32' ? 'Windows' : process.platform)
    });
});

// Game Specific Presets
app.post('/api/game-preset', async (req, res) => {
    const { gameTitle } = req.body;
    const result = await optimizer.applyGameSpecificPreset(gameTitle);
    res.json(result);
});

// Subsystem Tweaks
app.post('/api/boost/network', async (req, res) => {
    const result = await optimizer.optimizeNetwork();
    res.json(result);
});

app.post('/api/boost/cpu', async (req, res) => {
    const result = await optimizer.optimizeCPU();
    res.json(result);
});

app.post('/api/boost/memory', async (req, res) => {
    const result = await optimizer.purgeMemory();
    res.json(result);
});

app.post('/api/boost/storage', async (req, res) => {
    const result = await optimizer.optimizeStorage();
    res.json(result);
});

app.post('/api/boost/gpu', async (req, res) => {
    const result = await optimizer.optimizeGPUandDVR();
    res.json(result);
});

app.post('/api/tweak/input', async (req, res) => {
    const result = await optimizer.tuneInputLatency();
    res.json(result);
});

app.post('/api/tweak/audio', async (req, res) => {
    const result = await optimizer.tuneLowLatencyAudio();
    res.json(result);
});

app.post('/api/clean-shaders', async (req, res) => {
    const result = await optimizer.cleanShaderAndJunkCaches();
    res.json(result);
});

app.post('/api/gamer-dnd', async (req, res) => {
    const { enable } = req.body;
    const result = await optimizer.toggleGamerDoNotDisturb(enable);
    res.json(result);
});

app.post('/api/auto-clean/toggle', (req, res) => {
    const { enable } = req.body;
    const result = optimizer.toggleSmartAutoRamCleaner(enable);
    res.json(result);
});

app.post('/api/boost/process', async (req, res) => {
    const { processName, priority } = req.body;
    if (!processName) {
        return res.status(400).json({ error: 'Process name is required' });
    }
    const result = await optimizer.boostProcess(processName, priority || 'High');
    res.json(result);
});

app.post('/api/restore', async (req, res) => {
    console.log('[API] Restoring default stock configuration...');
    const result = await optimizer.restoreDefaults();
    res.json(result);
});

// WebSocket Live Telemetry Stream
wss.on('connection', (ws) => {
    console.log('[WS] Client connected to live telemetry stream');
    let isAlive = true;

    const interval = setInterval(async () => {
        if (!isAlive || ws.readyState !== ws.OPEN) return;
        try {
            const data = await telemetry.getTelemetrySnapshot();
            ws.send(JSON.stringify({ type: 'telemetry', data }));
        } catch (err) {
            console.error('[WS Error]', err.message);
        }
    }, 1000);

    ws.on('close', () => {
        isAlive = false;
        clearInterval(interval);
        console.log('[WS] Client disconnected');
    });

    ws.on('error', () => {
        isAlive = false;
        clearInterval(interval);
    });
});

server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  APEX OVERDRIVE // ULTRA LOW-LATENCY FPS BOOSTER  `);
    console.log(`  Dual-Engine: Standard App + Deep Rust Kernel      `);
    console.log(`  Access HUD Dashboard at: http://localhost:${PORT} `);
    console.log(`====================================================`);
});
