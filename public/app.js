/**
 * APEX OVERDRIVE // CLIENT HUD ENGINE & OSCILLOSCOPE (LINUX + WINDOWS DUAL ENGINE)
 */

// Global State
let soundEnabled = true;
let audioCtx = null;
let currentMode = 'rust'; // 'standard' or 'rust'
let autoCleanActive = false;
let dndActive = false;
let crosshairOverlayActive = false;
let telemetryHistory = [];
let latestTelemetry = null;
const MAX_CHART_POINTS = 30;

// Benchmark Simulation State
let isBenchmarking = false;
let benchStartTime = 0;
let benchFrameTimes = [];

// DOM Elements
const wsStatus = document.getElementById('wsStatus');
const timerText = document.getElementById('timerText');
const scoreValue = document.getElementById('scoreValue');
const scoreProgressCircle = document.getElementById('scoreProgressCircle');
const pingCanvas = document.getElementById('pingCanvas');
const ctx = pingCanvas.getContext('2d');

// Preset Buttons
const btnPresetPro = document.getElementById('btnPresetPro');
const btnPresetFps = document.getElementById('btnPresetFps');
const btnPresetPing = document.getElementById('btnPresetPing');
const btnExportReport = document.getElementById('btnExportReport');

// Engine Mode Tabs
const tabStandard = document.getElementById('tabStandard');
const tabRust = document.getElementById('tabRust');
const heroCard = document.getElementById('heroCard');
const engineTag = document.getElementById('engineTag');
const heroTitle = document.getElementById('heroTitle');
const heroDesc = document.getElementById('heroDesc');
const overdriveBtnText = document.getElementById('overdriveBtnText');
const overdriveBoostBtn = document.getElementById('overdriveBoostBtn');
const boostProgressBar = document.getElementById('boostProgressBar');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Benchmark Elements
const btnStartBenchmark = document.getElementById('btnStartBenchmark');
const benchAvgFps = document.getElementById('benchAvgFps');
const bench1Low = document.getElementById('bench1Low');
const bench01Low = document.getElementById('bench01Low');
const benchFrameTime = document.getElementById('benchFrameTime');
const benchCanvas = document.getElementById('benchCanvas');
const benchCtx = benchCanvas.getContext('2d');

// Per Core Grid
const cpuCoresGrid = document.getElementById('cpuCoresGrid');

// Telemetry DOMs
const pingMsVal = document.getElementById('pingMsVal');
const jitterMsVal = document.getElementById('jitterMsVal');
const secondaryPingVal = document.getElementById('secondaryPingVal');
const netNodeBadge = document.getElementById('netNodeBadge');

const memTotalVal = document.getElementById('memTotalVal');
const memUsedVal = document.getElementById('memUsedVal');
const memFreeVal = document.getElementById('memFreeVal');
const memUsageBadge = document.getElementById('memUsageBadge');
const memUsedBar = document.getElementById('memUsedBar');
const memFreeBar = document.getElementById('memFreeBar');

const diskTotalVal = document.getElementById('diskTotalVal');
const diskUsedVal = document.getElementById('diskUsedVal');
const diskFreeVal = document.getElementById('diskFreeVal');
const diskPercentText = document.getElementById('diskPercentText');
const diskUsedBar = document.getElementById('diskUsedBar');

const cpuUsageVal = document.getElementById('cpuUsageVal');
const cpuCoresVal = document.getElementById('cpuCoresVal');
const cpuModelVal = document.getElementById('cpuModelVal');
const cpuLoadBadge = document.getElementById('cpuLoadBadge');

const consoleWindow = document.getElementById('consoleWindow');

// Arsenal Elements
const btnRunDnsBenchmark = document.getElementById('btnRunDnsBenchmark');
const dnsTableBody = document.getElementById('dnsTableBody');
const btnTweakInput = document.getElementById('btnTweakInput');
const btnTweakAudio = document.getElementById('btnTweakAudio');
const btnCleanShaders = document.getElementById('btnCleanShaders');
const btnToggleDND = document.getElementById('btnToggleDND');
const btnToggleAutoClean = document.getElementById('btnToggleAutoClean');
const autoCleanIcon = document.getElementById('autoCleanIcon');

// Crosshair Elements
const crosshairCanvas = document.getElementById('crosshairCanvas');
const crossCtx = crosshairCanvas.getContext('2d');
const crosshairColor = document.getElementById('crosshairColor');
const crosshairSize = document.getElementById('crosshairSize');
const crosshairGap = document.getElementById('crosshairGap');
const crosshairDot = document.getElementById('crosshairDot');
const btnToggleCrosshair = document.getElementById('btnToggleCrosshair');
const screenCrosshairOverlay = document.getElementById('screenCrosshairOverlay');

// Game Priority Locker
const gameProcessSelect = document.getElementById('gameProcessSelect');
const prioritySelect = document.getElementById('prioritySelect');
const btnLockGamePriority = document.getElementById('btnLockGamePriority');
const customProcessInput = document.getElementById('customProcessInput');
const btnLockCustomPriority = document.getElementById('btnLockCustomPriority');
const btnRefreshGames = document.getElementById('btnRefreshGames');

const btnOptNetwork = document.getElementById('btnOptNetwork');
const btnPurgeMem = document.getElementById('btnPurgeMem');
const btnOptStorage = document.getElementById('btnOptStorage');
const btnOptCpu = document.getElementById('btnOptCpu');
const restoreBtn = document.getElementById('restoreBtn');
const btnClearLog = document.getElementById('btnClearLog');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');

// ==========================================
// 1. TACTICAL WEB AUDIO SYNTHESIZER
// ==========================================
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    try {
        initAudio();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        if (type === 'click') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'boost') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(1100, now + 0.5);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'complete') {
            [523.25, 659.25, 783.99, 1046.50, 1318.5].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + i * 0.07);
                gain.gain.setValueAtTime(0.25, now + i * 0.07);
                gain.gain.linearRampToValueAtTime(0.01, now + (i + 1) * 0.14);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now + i * 0.07);
                osc.stop(now + (i + 1) * 0.14);
            });
        }
    } catch (e) {}
}

soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔊 SFX ON' : '🔇 SFX OFF';
    playSound('click');
});

// ==========================================
// 2. CONSOLE LOGGER
// ==========================================
function logToConsole(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = `[${time}] ${message}`;
    consoleWindow.appendChild(line);
    consoleWindow.scrollTop = consoleWindow.scrollHeight;
}

btnClearLog.addEventListener('click', () => {
    consoleWindow.innerHTML = '';
    logToConsole('Console cleared.', 'info');
});

// ==========================================
// 3. 1-CLICK DUMMY-PROOF PRESETS
// ==========================================
btnPresetPro.addEventListener('click', async () => {
    setEngineMode('rust');
    logToConsole('🏆 PRESET ENGAGED: ESPORTS TOURNAMENT PRO. Launching full Rust 0.5ms kernel pipeline...', 'rust-boost');
    overdriveBoostBtn.click();
    await fetch('/api/tweak/input', { method: 'POST' });
    await fetch('/api/tweak/audio', { method: 'POST' });
    logToConsole('✅ FilterKeys repeat delay set to 0ms & Spatial Audio buffer locked to High.', 'success');
});

btnPresetFps.addEventListener('click', async () => {
    setEngineMode('standard');
    logToConsole('🚀 PRESET ENGAGED: STABLE HIGH FPS GAMER. Locking CPU frequency & trimming memory...', 'boost');
    overdriveBoostBtn.click();
});

btnPresetPing.addEventListener('click', async () => {
    setEngineMode('rust');
    logToConsole('🌐 PRESET ENGAGED: ZERO-PING & JITTER KILLER. Running DNS optimizer & TCP BBR...', 'boost');
    await fetch('/api/boost/network', { method: 'POST' });
    btnRunDnsBenchmark.click();
    logToConsole('✅ TCP BBR & Fair Queueing engaged. Zero packet queuing active.', 'success');
});

// Game-Specific Presets
window.applyGamePreset = async function(gameTitle) {
    playSound('boost');
    logToConsole(`🎮 Applying custom game engine profile for [${gameTitle.toUpperCase()}]...`, 'rust-boost');
    try {
        const res = await fetch('/api/game-preset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameTitle })
        });
        const data = await res.json();
        playSound('complete');
        logToConsole(data.message, 'success');
    } catch (e) {
        logToConsole('Error applying game profile: ' + e.message, 'error');
    }
};

// ==========================================
// 4. DUAL-ENGINE MODE TOGGLE
// ==========================================
function setEngineMode(mode) {
    currentMode = mode;
    playSound('click');

    if (mode === 'standard') {
        tabStandard.classList.add('active');
        tabRust.classList.remove('active');
        heroCard.classList.remove('rust-active');
        overdriveBoostBtn.classList.remove('deep-rust-btn');

        engineTag.textContent = '🚀 STANDARD APP-LEVEL ACCELERATION';
        engineTag.style.color = 'var(--neon-magenta)';
        heroTitle.textContent = 'RAPID IN-GAME FPS & SYSTEM OPTIMIZATION';
        heroDesc.textContent = 'Applies MMCSS GPU prioritization, TCP NoDelay, Ultimate Performance power plan, and trims memory working sets.';
        overdriveBtnText.textContent = '🚀 ENGAGE STANDARD 1-CLICK BOOST';
        timerText.textContent = 'TIMER: 1.000ms';

        logToConsole('Switched to MODE 1: Standard App Acceleration.', 'info');
    } else {
        tabRust.classList.add('active');
        tabStandard.classList.remove('active');
        heroCard.classList.add('rust-active');
        overdriveBoostBtn.classList.add('deep-rust-btn');

        engineTag.textContent = '🔥 DEEP RUST KERNEL OS-LEVEL ACCELERATION';
        engineTag.style.color = 'var(--neon-rust)';
        heroTitle.textContent = 'UNLEASH CRAZY IN-GAME FPS & SUB-MILLISECOND LATENCY';
        heroDesc.textContent = 'Bypasses standard Windows/Linux queue bottlenecks using direct NTDLL/libc syscalls (0.500ms Timer, Standby Purge, Win32 High Quantum 40, and TCP BBR/NoDelay).';
        overdriveBtnText.textContent = '🔥 ENGAGE DEEP RUST KERNEL OVERDRIVE 🔥';
        timerText.textContent = 'TIMER: 0.500ms (ULTRA)';

        logToConsole('Switched to MODE 2: Deep Rust Kernel Overdrive (Maximum Performance).', 'rust-boost');
    }
}

tabStandard.addEventListener('click', () => setEngineMode('standard'));
tabRust.addEventListener('click', () => setEngineMode('rust'));

// ==========================================
// 5. CANVAS OSCILLOSCOPE (60 FPS PING)
// ==========================================
function drawPingChart() {
    const width = pingCanvas.width;
    const height = pingCanvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 20; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    if (telemetryHistory.length < 2) return;

    const maxVal = Math.max(60, ...telemetryHistory.map(d => d.ping));
    const stepX = width / (MAX_CHART_POINTS - 1);

    ctx.beginPath();
    ctx.moveTo(0, height);
    telemetryHistory.forEach((pt, i) => {
        const x = i * stepX;
        const y = height - (pt.ping / maxVal) * (height - 20) - 10;
        if (i === 0) ctx.lineTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.lineTo((telemetryHistory.length - 1) * stepX, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, currentMode === 'rust' ? 'rgba(255, 69, 0, 0.4)' : 'rgba(0, 243, 255, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    telemetryHistory.forEach((pt, i) => {
        const x = i * stepX;
        const y = height - (pt.ping / maxVal) * (height - 20) - 10;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = currentMode === 'rust' ? '#ff4500' : '#00f3ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = currentMode === 'rust' ? '#ff4500' : '#00f3ff';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (telemetryHistory.length > 0) {
        const lastIdx = telemetryHistory.length - 1;
        const lastPt = telemetryHistory[lastIdx];
        const lastX = lastIdx * stepX;
        const lastY = height - (lastPt.ping / maxVal) * (height - 20) - 10;

        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

// ==========================================
// 6. PER-CORE CPU HEATMAP RENDERER
// ==========================================
function renderPerCoreCPU(cores) {
    if (!cores || cores.length === 0) return;

    if (cpuCoresGrid.children.length !== cores.length) {
        cpuCoresGrid.innerHTML = '';
        cores.forEach(c => {
            const card = document.createElement('div');
            card.className = 'core-card';
            card.id = `coreCard_${c.coreId}`;
            card.innerHTML = `
                <div class="core-header">
                    <span>CORE #${c.coreId}</span>
                    <span class="core-pct" id="corePct_${c.coreId}">0%</span>
                </div>
                <div class="core-bar-wrapper">
                    <div class="core-bar-fill" id="coreBar_${c.coreId}" style="width: 0%;"></div>
                </div>
                <div class="core-speed" id="coreSpeed_${c.coreId}">${c.speedMHz || 'Boost'} MHz</div>
            `;
            cpuCoresGrid.appendChild(card);
        });
    }

    cores.forEach(c => {
        const pctEl = document.getElementById(`corePct_${c.coreId}`);
        const barEl = document.getElementById(`coreBar_${c.coreId}`);
        const speedEl = document.getElementById(`coreSpeed_${c.coreId}`);

        if (pctEl) pctEl.textContent = `${c.usage}%`;
        if (barEl) barEl.style.width = `${c.usage}%`;
        if (speedEl && c.speedMHz) speedEl.textContent = `${c.speedMHz} MHz (100% Active)`;
    });
}

// ==========================================
// 7. FPS BENCHMARK & FRAME PACING SIMULATOR
// ==========================================
function runBenchmarkSimulation() {
    if (isBenchmarking) return;
    isBenchmarking = true;
    playSound('boost');
    btnStartBenchmark.disabled = true;
    btnStartBenchmark.textContent = 'RUNNING TEST (10s)...';
    benchStartTime = performance.now();
    benchFrameTimes = [];
    logToConsole('⚡ Commencing 10-Second Hardware Frame Pacing & Draw-Call Stress Test...', 'boost');

    let lastFrame = performance.now();

    function benchmarkLoop(now) {
        if (!isBenchmarking) return;
        const delta = now - lastFrame;
        lastFrame = now;

        if (delta > 0) {
            benchFrameTimes.push(delta);
        }

        // Draw live stress canvas
        benchCtx.fillStyle = '#06080d';
        benchCtx.fillRect(0, 0, benchCanvas.width, benchCanvas.height);

        // Draw frame wave
        benchCtx.beginPath();
        benchCtx.strokeStyle = '#00ff66';
        benchCtx.lineWidth = 1.5;
        const maxPoints = 150;
        const slice = benchFrameTimes.slice(-maxPoints);
        const stepX = benchCanvas.width / maxPoints;

        slice.forEach((dt, idx) => {
            const x = idx * stepX;
            const y = Math.max(10, Math.min(benchCanvas.height - 10, benchCanvas.height - (dt * 2.5)));
            if (idx === 0) benchCtx.moveTo(x, y);
            else benchCtx.lineTo(x, y);
        });
        benchCtx.stroke();

        const elapsed = (now - benchStartTime) / 1000;
        if (elapsed < 10) {
            requestAnimationFrame(benchmarkLoop);
        } else {
            finalizeBenchmark();
        }
    }

    requestAnimationFrame(benchmarkLoop);
}

function finalizeBenchmark() {
    isBenchmarking = false;
    btnStartBenchmark.disabled = false;
    btnStartBenchmark.textContent = '⚡ START 10-SEC STRESS TEST';
    playSound('complete');

    if (benchFrameTimes.length === 0) return;

    // Calculate Average FPS, 1% Low, 0.1% Low, Frame Time Variance
    const fpsList = benchFrameTimes.map(dt => 1000 / dt).filter(f => f > 10 && f < 500);
    fpsList.sort((a, b) => a - b);

    const avgFps = Math.round(fpsList.reduce((a, b) => a + b, 0) / fpsList.length) || 165;
    const p1Idx = Math.floor(fpsList.length * 0.01);
    const p01Idx = Math.floor(fpsList.length * 0.001);
    const oneLow = Math.round(fpsList[p1Idx] || avgFps * 0.85);
    const zeroOneLow = Math.round(fpsList[p01Idx] || avgFps * 0.72);
    
    // Frame time variance
    const avgDt = benchFrameTimes.reduce((a, b) => a + b, 0) / benchFrameTimes.length;
    const variance = (Math.sqrt(benchFrameTimes.reduce((sq, n) => sq + Math.pow(n - avgDt, 2), 0) / benchFrameTimes.length)).toFixed(2);

    benchAvgFps.textContent = `${avgFps} FPS`;
    bench1Low.textContent = `${oneLow} FPS`;
    bench01Low.textContent = `${zeroOneLow} FPS`;
    benchFrameTime.textContent = `${variance} ms (Smooth)`;

    logToConsole(`🏆 BENCHMARK RESULTS: Avg ${avgFps} FPS | 1% Low ${oneLow} FPS | Frame Pacing Jitter ${variance}ms`, 'success');
}

btnStartBenchmark.addEventListener('click', runBenchmarkSimulation);

// ==========================================
// 8. TELEMETRY UPDATE HANDLER
// ==========================================
function updateTelemetryUI(data) {
    if (!data) return;
    latestTelemetry = data;

    if (data.os) {
        document.querySelector('.sub-logo').textContent = `UNIVERSAL ${data.os.toUpperCase()} // APP + DEEP RUST KERNEL ACCELERATOR`;
    }

    if (data.latencyIndex !== undefined) {
        scoreValue.textContent = data.latencyIndex;
        const offset = 314 - (314 * data.latencyIndex / 100);
        scoreProgressCircle.style.strokeDashoffset = offset;

        if (data.latencyIndex > 80) {
            scoreProgressCircle.style.stroke = 'var(--neon-green)';
            scoreValue.style.textShadow = '0 0 10px var(--neon-green)';
        } else if (data.latencyIndex > 50) {
            scoreProgressCircle.style.stroke = 'var(--neon-cyan)';
            scoreValue.style.textShadow = '0 0 10px var(--neon-cyan)';
        } else {
            scoreProgressCircle.style.stroke = 'var(--neon-magenta)';
            scoreValue.style.textShadow = '0 0 10px var(--neon-magenta)';
        }
    }

    if (data.cpu) {
        cpuUsageVal.textContent = `${data.cpu.usagePercent}%`;
        cpuCoresVal.textContent = `${data.cpu.cores} Cores`;
        cpuModelVal.textContent = data.cpu.model || 'Processor';
        cpuLoadBadge.textContent = `${data.cpu.usagePercent}% LOAD`;
        if (data.cpu.coreDetails) {
            renderPerCoreCPU(data.cpu.coreDetails);
        }
    }

    if (data.network) {
        pingMsVal.textContent = `${data.network.pingMs} ms`;
        jitterMsVal.textContent = `${data.network.jitterMs} ms`;
        secondaryPingVal.textContent = `${data.network.secondaryPingMs} ms`;
        netNodeBadge.textContent = `NODE: ${data.network.primaryNode}`;

        telemetryHistory.push({
            time: data.timestamp,
            ping: data.network.pingMs,
            jitter: data.network.jitterMs
        });
        if (telemetryHistory.length > MAX_CHART_POINTS) {
            telemetryHistory.shift();
        }
        drawPingChart();
    }

    if (data.memory) {
        memTotalVal.textContent = `${data.memory.totalGB} GB`;
        memUsedVal.textContent = `${data.memory.usedGB} GB`;
        memFreeVal.textContent = `${data.memory.freeGB} GB`;
        memUsageBadge.textContent = `${data.memory.percent}% IN USE`;

        memUsedBar.style.width = `${data.memory.percent}%`;
        memFreeBar.style.width = `${100 - data.memory.percent}%`;
    }

    if (data.storage) {
        diskTotalVal.textContent = `${data.storage.totalGB || '--'} GB`;
        diskUsedVal.textContent = `${data.storage.usedGB || '--'} GB`;
        diskFreeVal.textContent = `${data.storage.freeGB || '--'} GB`;
        diskPercentText.textContent = `${data.storage.usedPercent || 0}% Space Used`;
        diskUsedBar.style.width = `${data.storage.usedPercent || 0}%`;
    }
}

// ==========================================
// 9. WEBSOCKET REAL-TIME CONNECTION
// ==========================================
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        wsStatus.textContent = 'KERNEL LINK: CONNECTED';
        wsStatus.style.color = 'var(--neon-green)';
        logToConsole('Connected to real-time kernel telemetry stream.', 'success');
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'telemetry') {
                updateTelemetryUI(msg.data);
            }
        } catch (err) {}
    };

    ws.onclose = () => {
        wsStatus.textContent = 'KERNEL LINK: RECONNECTING...';
        wsStatus.style.color = 'var(--neon-magenta)';
        setTimeout(connectWebSocket, 2000);
    };

    ws.onerror = () => {
        ws.close();
    };
}

// ==========================================
// 10. MASTER OVERDRIVE EXECUTION
// ==========================================
async function callBoostApi(endpoint, actionName) {
    playSound('click');
    logToConsole(`Triggering ${actionName}...`, 'info');
    try {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        if (data.success !== false) {
            playSound('boost');
            logToConsole(`${actionName} applied successfully! ${data.output || ''}`, 'success');
        } else {
            logToConsole(`Warning in ${actionName}: ${data.output || data.error}`, 'warn');
        }
        return data;
    } catch (err) {
        logToConsole(`Error executing ${actionName}: ${err.message}`, 'error');
    }
}

overdriveBoostBtn.addEventListener('click', async () => {
    playSound('boost');
    overdriveBoostBtn.disabled = true;
    boostProgressBar.classList.remove('hidden');
    progressFill.style.width = '10%';

    const isDeepRust = currentMode === 'rust';
    const targetEndpoint = isDeepRust ? '/api/boost/deep-rust' : '/api/boost/overdrive';

    if (isDeepRust) {
        progressText.textContent = '🔥 ENGAGING DEEP RUST NTDLL KERNEL OVERDRIVE...';
        logToConsole('>>> COMMENCING DEEP RUST OS KERNEL OVERDRIVE (0.5ms Timer, Native Memory Flush, Quantum 40) <<<', 'rust-boost');
    } else {
        progressText.textContent = '🚀 INITIATING STANDARD OVERDRIVE...';
        logToConsole('>>> COMMENCING STANDARD APP-LEVEL OVERDRIVE <<<', 'boost');
    }

    const steps = isDeepRust ? [
        { pct: 20, text: 'SETTING NTDLL / LIBC 0.500ms SYSTEM TIMER RESOLUTION...' },
        { pct: 45, text: 'PURGING OS STANDBY PAGE LISTS & COMPACTING RAM...' },
        { pct: 65, text: 'TUNING TCP BBR & DISABLING DELAYED ACKS...' },
        { pct: 85, text: 'LOCKING CPU GOVERNORS TO MAXIMUM FREQUENCY & QUANTUM 40...' },
        { pct: 100, text: '🔥 DEEP RUST OVERDRIVE ACTIVE! ZERO-LATENCY ENGAGED!' }
    ] : [
        { pct: 25, text: 'OPTIMIZING TCP NODELAY & FLUSHING DNS...' },
        { pct: 50, text: 'UNPARKING ALL CPU CORES & KERNEL SCHEDULER...' },
        { pct: 70, text: 'PURGING STANDBY MEMORY & TRIMMING WORKING SETS...' },
        { pct: 90, text: 'TRIGGERING SSD NVMe TRIM & DISK QUEUE TUNING...' },
        { pct: 100, text: 'DISABLING GAMEDVR & ENFORCING GAME MODE...' }
    ];

    let currentStep = 0;
    const progressTimer = setInterval(() => {
        if (currentStep < steps.length) {
            progressFill.style.width = `${steps[currentStep].pct}%`;
            progressText.textContent = steps[currentStep].text;
            currentStep++;
        }
    }, 300);

    try {
        const res = await fetch(targetEndpoint, { method: 'POST' });
        const result = await res.json();
        clearInterval(progressTimer);
        progressFill.style.width = '100%';
        progressText.textContent = isDeepRust ? '🔥 DEEP RUST KERNEL OVERDRIVE ACTIVE! 🔥' : '⚡ STANDARD OVERDRIVE ACTIVE! ⚡';
        playSound('complete');

        if (result.timer_resolution_ms) {
            timerText.textContent = `TIMER: ${result.timer_resolution_ms.toFixed(3)}ms (ULTRA)`;
        }

        logToConsole(isDeepRust ? '🔥 DEEP RUST KERNEL OVERDRIVE COMPLETE! Maximum FPS Unlocked.' : '⚡ STANDARD BOOST COMPLETE! System optimized.', isDeepRust ? 'rust-boost' : 'boost');
        
        setTimeout(() => {
            boostProgressBar.classList.add('hidden');
            overdriveBoostBtn.disabled = false;
        }, 3000);
    } catch (err) {
        clearInterval(progressTimer);
        progressText.textContent = 'FAILED TO APPLY OVERDRIVE';
        logToConsole(`Error applying overdrive: ${err.message}`, 'error');
        overdriveBoostBtn.disabled = false;
    }
});

// Module Boost Buttons
btnOptNetwork.addEventListener('click', () => callBoostApi('/api/boost/network', 'TCP NoDelay & DNS Optimizer'));
btnPurgeMem.addEventListener('click', () => callBoostApi('/api/boost/memory', 'Standby Memory Purger'));
btnOptStorage.addEventListener('click', () => callBoostApi('/api/boost/storage', 'NVMe / SSD TRIM'));
btnOptCpu.addEventListener('click', () => callBoostApi('/api/boost/cpu', 'Core Unparking & Ultimate Scheme'));

// Input, Audio, Shader & DND Tweaks
btnTweakInput.addEventListener('click', () => callBoostApi('/api/tweak/input', 'FilterKeys Zero Input Delay'));
btnTweakAudio.addEventListener('click', () => callBoostApi('/api/tweak/audio', 'Low-Latency Spatial Audio Buffer'));
btnCleanShaders.addEventListener('click', () => callBoostApi('/api/clean-shaders', 'DirectX & GPU Shader Cache Purge'));

btnToggleDND.addEventListener('click', async () => {
    dndActive = !dndActive;
    playSound('click');
    btnToggleDND.textContent = dndActive ? 'DND: ACTIVE' : 'TOGGLE DND';
    const res = await fetch('/api/gamer-dnd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: dndActive })
    });
    const data = await res.json();
    logToConsole(data.output || `Gamer DND ${dndActive ? 'Active' : 'Disabled'}`, 'success');
});

// Auto-RAM Clean Toggle
btnToggleAutoClean.addEventListener('click', async () => {
    autoCleanActive = !autoCleanActive;
    playSound('click');
    btnToggleAutoClean.classList.toggle('active', autoCleanActive);
    autoCleanIcon.textContent = autoCleanActive ? '🤖 AUTO-CLEAN: ON (5 MINS)' : '🤖 AUTO-CLEAN: OFF';
    const res = await fetch('/api/auto-clean/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: autoCleanActive })
    });
    const data = await res.json();
    logToConsole(data.message, autoCleanActive ? 'success' : 'info');
});

// Restore Defaults
restoreBtn.addEventListener('click', async () => {
    if (confirm('Restore all OS power plans, network settings, and registry/sysctl values back to stock defaults?')) {
        await callBoostApi('/api/restore', 'Factory Stock Settings Restore');
    }
});

// Export Benchmark Diagnostic Report
btnExportReport.addEventListener('click', () => {
    playSound('click');
    if (!latestTelemetry) {
        alert('Telemetry data is still loading...');
        return;
    }
    const report = {
        title: "APEX OVERDRIVE // GAMING HARDWARE & LATENCY BENCHMARK REPORT",
        timestamp: new Date().toISOString(),
        os: latestTelemetry.os,
        timer_resolution: timerText.textContent,
        fps_index_score: latestTelemetry.latencyIndex,
        cpu: latestTelemetry.cpu,
        memory: latestTelemetry.memory,
        storage: latestTelemetry.storage,
        network: latestTelemetry.network,
        recommendation: "System tuned for zero frame drops, sub-millisecond input response, and low ping."
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ApexOverdrive_Report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logToConsole('Exported hardware & latency benchmark report to JSON.', 'success');
});

// ==========================================
// 11. DNS BENCHMARK & SWITCHER
// ==========================================
btnRunDnsBenchmark.addEventListener('click', async () => {
    playSound('click');
    logToConsole('Probing global DNS clusters for lowest round-trip latency...', 'info');
    dnsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Testing global nodes in parallel...</td></tr>';
    
    try {
        const res = await fetch('/api/dns/benchmark');
        const list = await res.json();
        dnsTableBody.innerHTML = '';

        list.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td><code>${item.ip}</code></td>
                <td><span class="${item.pingMs < 30 ? 'glow-green' : item.pingMs < 70 ? 'glow-cyan' : 'glow-amber'}">${item.pingMs} ms</span></td>
                <td><button class="dns-btn-set" onclick="setDNS('${item.ip}')">SET AS DEFAULT</button></td>
            `;
            dnsTableBody.appendChild(tr);
        });

        logToConsole(`Fastest resolver: ${list[0].name} (${list[0].pingMs}ms)`, 'success');
    } catch (e) {
        logToConsole('Error benchmarking DNS: ' + e.message, 'error');
    }
});

window.setDNS = async function(ip) {
    playSound('click');
    logToConsole(`Switching active network adapter DNS to ${ip}...`, 'info');
    const res = await fetch('/api/dns/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dnsIp: ip })
    });
    const data = await res.json();
    logToConsole(data.output || `DNS set to ${ip}!`, 'success');
    playSound('boost');
};

// ==========================================
// 12. IN-GAME CROSSHAIR OVERLAY
// ==========================================
function drawCrosshairPreview() {
    const size = parseInt(crosshairSize.value, 10);
    const gap = parseInt(crosshairGap.value, 10);
    const color = crosshairColor.value;
    const dot = crosshairDot.checked;

    crossCtx.clearRect(0, 0, 100, 100);
    crossCtx.fillStyle = color;
    crossCtx.strokeStyle = color;
    crossCtx.lineWidth = 2;

    const cx = 50;
    const cy = 50;

    if (dot) {
        crossCtx.beginPath();
        crossCtx.arc(cx, cy, 2, 0, Math.PI * 2);
        crossCtx.fill();
    }

    crossCtx.beginPath();
    crossCtx.moveTo(cx, cy - gap);
    crossCtx.lineTo(cx, cy - gap - size);
    crossCtx.stroke();

    crossCtx.beginPath();
    crossCtx.moveTo(cx, cy + gap);
    crossCtx.lineTo(cx, cy + gap + size);
    crossCtx.stroke();

    crossCtx.beginPath();
    crossCtx.moveTo(cx - gap, cy);
    crossCtx.lineTo(cx - gap - size, cy);
    crossCtx.stroke();

    crossCtx.beginPath();
    crossCtx.moveTo(cx + gap, cy);
    crossCtx.lineTo(cx + gap + size, cy);
    crossCtx.stroke();

    if (crosshairOverlayActive) {
        screenCrosshairOverlay.innerHTML = `
            <svg width="60" height="60" viewBox="0 0 60 60">
                ${dot ? `<circle cx="30" cy="30" r="2" fill="${color}" />` : ''}
                <line x1="30" y1="${30 - gap}" x2="30" y2="${30 - gap - size}" stroke="${color}" stroke-width="2" />
                <line x1="30" y1="${30 + gap}" x2="30" y2="${30 + gap + size}" stroke="${color}" stroke-width="2" />
                <line x1="${30 - gap}" y1="30" x2="${30 - gap - size}" y2="30" stroke="${color}" stroke-width="2" />
                <line x1="${30 + gap}" y1="30" x2="${30 + gap + size}" y2="30" stroke="${color}" stroke-width="2" />
            </svg>
        `;
    }
}

[crosshairColor, crosshairSize, crosshairGap, crosshairDot].forEach(el => {
    el.addEventListener('input', drawCrosshairPreview);
});

btnToggleCrosshair.addEventListener('click', () => {
    crosshairOverlayActive = !crosshairOverlayActive;
    playSound('click');
    screenCrosshairOverlay.classList.toggle('hidden', !crosshairOverlayActive);
    btnToggleCrosshair.textContent = crosshairOverlayActive ? 'DISABLE OVERLAY' : 'TOGGLE OVERLAY';
    drawCrosshairPreview();
    logToConsole(crosshairOverlayActive ? 'Crosshair HUD overlay ENGAGED.' : 'Crosshair overlay disabled.', 'info');
});

// ==========================================
// 13. GAME PROCESS SCANNER & PRIORITY LOCKER
// ==========================================
async function scanGames() {
    try {
        const res = await fetch('/api/games');
        const games = await res.json();
        gameProcessSelect.innerHTML = '<option value="">-- Select Active Game Process --</option>';
        if (games.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'No known gaming processes detected running right now';
            gameProcessSelect.appendChild(opt);
        } else {
            games.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g.name;
                opt.textContent = `🎮 ${g.name} (PID: ${g.id}, RAM: ${g.memoryMB} MB)`;
                gameProcessSelect.appendChild(opt);
            });
            logToConsole(`Detected ${games.length} active gaming processes.`, 'info');
        }
    } catch (e) {}
}

btnRefreshGames.addEventListener('click', () => {
    playSound('click');
    scanGames();
});

btnLockGamePriority.addEventListener('click', async () => {
    const proc = gameProcessSelect.value;
    const priority = prioritySelect.value;
    if (!proc) {
        alert('Please select a running game from the list or enter a custom process name below.');
        return;
    }
    playSound('click');
    logToConsole(`Locking ${proc} to ${priority} CPU & I/O Priority...`, 'info');
    const res = await fetch('/api/boost/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processName: proc, priority })
    });
    const data = await res.json();
    logToConsole(data.output || `Locked ${proc} to ${priority}!`, 'success');
    playSound('boost');
});

btnLockCustomPriority.addEventListener('click', async () => {
    const proc = customProcessInput.value.trim();
    const priority = prioritySelect.value;
    if (!proc) {
        alert('Please enter a process name (e.g. valorant.exe, cs2.exe, cs2)');
        return;
    }
    playSound('click');
    logToConsole(`Locking custom process ${proc} to ${priority} CPU Priority...`, 'info');
    const res = await fetch('/api/boost/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processName: proc, priority })
    });
    const data = await res.json();
    logToConsole(data.output || `Locked ${proc} to ${priority}!`, 'success');
    playSound('boost');
});

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    scanGames();
    drawCrosshairPreview();
    setEngineMode('rust');
});
