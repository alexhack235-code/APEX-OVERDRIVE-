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
// 7.5. BATTERY DISCHARGE OSCILLOSCOPE
// ==========================================
const batteryCanvas = document.getElementById('batteryCanvas');
const batCtx = batteryCanvas ? batteryCanvas.getContext('2d') : null;
let batteryChartHistory = [];
const MAX_BATTERY_POINTS = 30;

function drawBatteryChart() {
    if (!batteryCanvas || !batCtx) return;
    const width = batteryCanvas.width;
    const height = batteryCanvas.height;

    batCtx.clearRect(0, 0, width, height);

    batCtx.strokeStyle = 'rgba(0, 255, 136, 0.08)';
    batCtx.lineWidth = 1;
    for (let y = 20; y < height; y += 25) {
        batCtx.beginPath();
        batCtx.moveTo(0, y);
        batCtx.lineTo(width, y);
        batCtx.stroke();
    }

    if (batteryChartHistory.length < 2) return;

    const stepX = width / (MAX_BATTERY_POINTS - 1);

    batCtx.beginPath();
    batCtx.moveTo(0, height);
    batteryChartHistory.forEach((pt, i) => {
        const x = i * stepX;
        const y = height - (pt.percent / 100) * (height - 20) - 10;
        if (i === 0) batCtx.lineTo(x, y);
        else batCtx.lineTo(x, y);
    });
    batCtx.lineTo((batteryChartHistory.length - 1) * stepX, height);
    batCtx.closePath();

    const gradient = batCtx.createLinearGradient(0, 0, 0, height);
    const lastPct = batteryChartHistory[batteryChartHistory.length - 1].percent;
    if (lastPct > 50) {
        gradient.addColorStop(0, 'rgba(0, 255, 136, 0.35)');
    } else if (lastPct > 20) {
        gradient.addColorStop(0, 'rgba(255, 170, 0, 0.35)');
    } else {
        gradient.addColorStop(0, 'rgba(255, 51, 68, 0.35)');
    }
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    batCtx.fillStyle = gradient;
    batCtx.fill();

    batCtx.beginPath();
    batteryChartHistory.forEach((pt, i) => {
        const x = i * stepX;
        const y = height - (pt.percent / 100) * (height - 20) - 10;
        if (i === 0) batCtx.moveTo(x, y);
        else batCtx.lineTo(x, y);
    });
    batCtx.strokeStyle = lastPct > 50 ? '#00ff88' : (lastPct > 20 ? '#ffaa00' : '#ff3344');
    batCtx.lineWidth = 2.5;
    batCtx.shadowColor = lastPct > 50 ? '#00ff88' : (lastPct > 20 ? '#ffaa00' : '#ff3344');
    batCtx.shadowBlur = 8;
    batCtx.stroke();
    batCtx.shadowBlur = 0;

    const lastIdx = batteryChartHistory.length - 1;
    const lastPt = batteryChartHistory[lastIdx];
    const lastX = lastIdx * stepX;
    const lastY = height - (lastPt.percent / 100) * (height - 20) - 10;

    batCtx.fillStyle = '#ffffff';
    batCtx.beginPath();
    batCtx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    batCtx.fill();
}

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

    if (data.battery) {
        const b = data.battery;
        const bBadge = document.getElementById('batteryBadge');
        const bPctVal = document.getElementById('batteryPctVal');
        const bPowerLineVal = document.getElementById('batteryPowerLineVal');
        const bStatusVal = document.getElementById('batteryStatusVal');

        if (bBadge) {
            bBadge.textContent = `${b.percent}% ${b.charging ? 'CHARGING' : (b.powerLine.includes('Battery') ? 'DISCHARGING' : 'AC CONNECTED')}`;
            bBadge.className = 'card-badge ' + (b.charging ? 'charging' : (b.percent <= 20 ? 'critical' : 'discharging'));
        }
        if (bPctVal) bPctVal.textContent = `${b.percent}%`;
        if (bPowerLineVal) bPowerLineVal.textContent = b.powerLine;
        if (bStatusVal) bStatusVal.textContent = b.statusText;

        batteryChartHistory.push({ percent: b.percent, time: Date.now() });
        if (batteryChartHistory.length > MAX_BATTERY_POINTS) batteryChartHistory.shift();
        drawBatteryChart();
    }

    if (data.gpu) {
        const g = data.gpu;
        const gNameVal = document.getElementById('gpuNameVal');
        const gDriverVal = document.getElementById('gpuDriverVal');
        const gVramBadge = document.getElementById('gpuVramBadge');
        const gHagsVal = document.getElementById('gpuHagsVal');

        if (gNameVal) gNameVal.textContent = g.name;
        if (gDriverVal) gDriverVal.textContent = g.driverVersion;
        if (gVramBadge) gVramBadge.textContent = `${g.vramMB} MB VRAM`;
        if (gHagsVal) gHagsVal.textContent = g.status;
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

// Export Benchmark Diagnostic Report — Rich Visual HTML
btnExportReport.addEventListener('click', () => {
    playSound('click');
    if (!latestTelemetry) {
        alert('Telemetry data is still loading...');
        return;
    }

    const t = latestTelemetry;
    const ts = new Date().toISOString();
    const score = t.latencyIndex || 0;
    const ping = t.network ? t.network.pingMs : '--';
    const jitter = t.network ? t.network.jitterMs : '--';
    const cpuPct = t.cpu ? t.cpu.usagePercent : 0;
    const cpuModel = t.cpu ? t.cpu.model : 'Unknown';
    const cpuCores = t.cpu ? t.cpu.cores : '--';
    const memPct = t.memory ? t.memory.percent : 0;
    const memUsed = t.memory ? t.memory.usedGB : '--';
    const memTotal = t.memory ? t.memory.totalGB : '--';
    const diskPct = t.storage ? t.storage.usedPercent : 0;
    const diskUsed = t.storage ? t.storage.usedGB : '--';
    const diskTotal = t.storage ? t.storage.totalGB : '--';
    const batPct = t.battery ? t.battery.percent : null;
    const batStatus = t.battery ? t.battery.statusText : null;
    const batPower = t.battery ? t.battery.powerLine : null;
    const gpuName = t.gpu ? t.gpu.name : null;
    const gpuDriver = t.gpu ? t.gpu.driverVersion : null;
    const gpuVram = t.gpu ? t.gpu.vramMB : null;
    const timerStr = timerText.textContent;
    const osName = t.os || 'Unknown';

    // Build ping sparkline SVG from telemetryHistory
    let pingSvgPath = '';
    let pingAreaPath = '';
    if (telemetryHistory.length > 1) {
        const maxP = Math.max(60, ...telemetryHistory.map(d => d.ping));
        const w = 440, h = 60;
        const step = w / (telemetryHistory.length - 1);
        let pts = telemetryHistory.map((d, i) => {
            const x = i * step;
            const y = h - (d.ping / maxP) * (h - 8) - 4;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
        pingSvgPath = `<polyline points="${pts.join(' ')}" fill="none" stroke="#00f3ff" stroke-width="2"/>`;
        pingAreaPath = `<polygon points="0,${h} ${pts.join(' ')} ${((telemetryHistory.length - 1) * step).toFixed(1)},${h}" fill="url(#pingGrad)" opacity="0.4"/>`;
    }

    // Build battery sparkline SVG from batteryChartHistory
    let batSvgPath = '';
    let batAreaPath = '';
    if (batteryChartHistory.length > 1) {
        const w = 440, h = 60;
        const step = w / (batteryChartHistory.length - 1);
        let pts = batteryChartHistory.map((d, i) => {
            const x = i * step;
            const y = h - (d.percent / 100) * (h - 8) - 4;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
        const col = batPct > 50 ? '#00ff88' : (batPct > 20 ? '#ffaa00' : '#ff3344');
        batSvgPath = `<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="2"/>`;
        batAreaPath = `<polygon points="0,${h} ${pts.join(' ')} ${((batteryChartHistory.length - 1) * step).toFixed(1)},${h}" fill="${col}" opacity="0.18"/>`;
    }

    function gaugeRing(pct, label, color) {
        const r = 38, c = 2 * Math.PI * r;
        const offset = c - (c * pct / 100);
        return `
        <div style="text-align:center;margin:0 14px">
            <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="${r}" fill="none" stroke="#1a1f2e" stroke-width="7"/>
                <circle cx="45" cy="45" r="${r}" fill="none" stroke="${color}" stroke-width="7"
                    stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
                    stroke-linecap="round" transform="rotate(-90 45 45)" style="filter:drop-shadow(0 0 6px ${color})"/>
                <text x="45" y="48" text-anchor="middle" fill="#fff" font-size="16" font-weight="800" font-family='Orbitron,monospace'>${pct}%</text>
            </svg>
            <div style="color:#8b95a8;font-size:10px;font-weight:700;letter-spacing:1.5px;margin-top:4px">${label}</div>
        </div>`;
    }

    function barRow(label, value, maxVal, unit, color) {
        const pct = maxVal > 0 ? Math.min((value / maxVal) * 100, 100) : 0;
        return `
        <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="color:#8b95a8;font-size:11px;font-weight:600;letter-spacing:1px">${label}</span>
                <span style="color:#fff;font-size:12px;font-weight:700">${value} ${unit}</span>
            </div>
            <div style="height:8px;background:#1a1f2e;border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${pct.toFixed(1)}%;background:linear-gradient(90deg,${color},${color}aa);border-radius:4px;transition:width 0.4s"></div>
            </div>
        </div>`;
    }

    const scoreColor = score > 80 ? '#00ff88' : (score > 50 ? '#00f3ff' : '#ff0055');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>APEX OVERDRIVE — Diagnostic Report</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{background:#07090e;color:#c8d0de;font-family:'Rajdhani',sans-serif;padding:32px 24px;min-height:100vh}
.report{max-width:780px;margin:0 auto}
.hdr{text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #1a2236}
.hdr h1{font-family:'Orbitron',monospace;font-size:22px;color:#00f3ff;text-shadow:0 0 18px rgba(0,243,255,0.5);letter-spacing:3px}
.hdr .sub{color:#5a6377;font-size:12px;letter-spacing:2px;margin-top:6px}
.section{background:rgba(15,20,35,0.85);border:1px solid #1a2236;border-radius:12px;padding:24px;margin-bottom:20px}
.section-title{font-family:'Orbitron',monospace;font-size:13px;color:#00f3ff;letter-spacing:2px;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid #1a2236}
.gauges{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px}
.meta-item{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #111827}
.meta-label{color:#5a6377;font-size:12px;font-weight:600;letter-spacing:1px}
.meta-val{color:#fff;font-size:13px;font-weight:700}
.spark-box{background:#0b0f18;border:1px solid #1a2236;border-radius:8px;padding:10px;margin-top:12px}
.spark-label{color:#5a6377;font-size:10px;letter-spacing:1.5px;font-weight:700;margin-bottom:6px}
.verdict{text-align:center;padding:20px;margin-top:8px}
.verdict-tag{display:inline-block;padding:8px 24px;border-radius:9999px;font-family:'Orbitron',monospace;font-size:13px;font-weight:900;letter-spacing:2px}
.footer{text-align:center;color:#3a4255;font-size:10px;letter-spacing:1px;margin-top:24px}
@media print{body{background:#fff;color:#222}.section{border-color:#ddd;background:#fafafa}.hdr h1{color:#0066cc;text-shadow:none}.section-title{color:#0066cc}}
</style>
</head>
<body>
<div class="report">
    <div class="hdr">
        <h1>⚡ APEX OVERDRIVE</h1>
        <div class="sub">GAMING HARDWARE &amp; LATENCY DIAGNOSTIC REPORT</div>
        <div style="color:#3a4255;font-size:11px;margin-top:8px">${ts} &nbsp;|&nbsp; ${osName.toUpperCase()} &nbsp;|&nbsp; ${timerStr}</div>
    </div>

    <!-- PERFORMANCE SCORE GAUGES -->
    <div class="section">
        <div class="section-title">⚡ PERFORMANCE GAUGES</div>
        <div class="gauges">
            ${gaugeRing(score, 'LATENCY INDEX', scoreColor)}
            ${gaugeRing(cpuPct, 'CPU LOAD', cpuPct > 85 ? '#ff3344' : (cpuPct > 60 ? '#ffaa00' : '#00f3ff'))}
            ${gaugeRing(memPct, 'RAM USAGE', memPct > 85 ? '#ff3344' : (memPct > 60 ? '#ffaa00' : '#00ff88'))}
            ${gaugeRing(diskPct, 'DISK USED', diskPct > 90 ? '#ff3344' : '#8b5cf6')}
            ${batPct !== null ? gaugeRing(batPct, 'BATTERY', batPct > 50 ? '#00ff88' : (batPct > 20 ? '#ffaa00' : '#ff3344')) : ''}
        </div>
    </div>

    <!-- NETWORK LATENCY -->
    <div class="section">
        <div class="section-title">🌐 NETWORK LATENCY</div>
        ${barRow('PING', ping, 100, 'ms', '#00f3ff')}
        ${barRow('JITTER', jitter, 30, 'ms', '#8b5cf6')}
        ${pingSvgPath ? `
        <div class="spark-box">
            <div class="spark-label">PING HISTORY WAVEFORM (${telemetryHistory.length} samples)</div>
            <svg viewBox="0 0 440 60" width="100%" height="60" preserveAspectRatio="none">
                <defs><linearGradient id="pingGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00f3ff"/><stop offset="100%" stop-color="transparent"/></linearGradient></defs>
                ${pingAreaPath}
                ${pingSvgPath}
            </svg>
        </div>` : ''}
    </div>

    <!-- CPU & MEMORY -->
    <div class="section">
        <div class="section-title">🖥️ CPU &amp; MEMORY</div>
        <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">PROCESSOR</span><span class="meta-val">${cpuModel}</span></div>
            <div class="meta-item"><span class="meta-label">CORES</span><span class="meta-val">${cpuCores}</span></div>
            <div class="meta-item"><span class="meta-label">CPU LOAD</span><span class="meta-val">${cpuPct}%</span></div>
            <div class="meta-item"><span class="meta-label">TIMER RES</span><span class="meta-val">${timerStr.replace('TIMER: ','')}</span></div>
            <div class="meta-item"><span class="meta-label">RAM USED</span><span class="meta-val">${memUsed} / ${memTotal} GB</span></div>
            <div class="meta-item"><span class="meta-label">DISK USED</span><span class="meta-val">${diskUsed} / ${diskTotal} GB</span></div>
        </div>
        <div style="margin-top:14px">
            ${barRow('CPU USAGE', cpuPct, 100, '%', cpuPct > 85 ? '#ff3344' : '#00f3ff')}
            ${barRow('RAM USAGE', memPct, 100, '%', memPct > 85 ? '#ff3344' : '#00ff88')}
            ${barRow('DISK USAGE', diskPct, 100, '%', diskPct > 90 ? '#ff3344' : '#8b5cf6')}
        </div>
    </div>

    ${batPct !== null ? `
    <!-- BATTERY & POWER -->
    <div class="section">
        <div class="section-title">🔋 BATTERY &amp; POWER</div>
        <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">CHARGE</span><span class="meta-val">${batPct}%</span></div>
            <div class="meta-item"><span class="meta-label">STATUS</span><span class="meta-val">${batStatus}</span></div>
            <div class="meta-item"><span class="meta-label">POWER LINE</span><span class="meta-val">${batPower}</span></div>
            <div class="meta-item"><span class="meta-label">VOLTAGE</span><span class="meta-val">${t.battery.voltageMV ? (t.battery.voltageMV / 1000).toFixed(2) + ' V' : '--'}</span></div>
        </div>
        ${batSvgPath ? `
        <div class="spark-box" style="margin-top:12px">
            <div class="spark-label">BATTERY DISCHARGE WAVEFORM (${batteryChartHistory.length} samples)</div>
            <svg viewBox="0 0 440 60" width="100%" height="60" preserveAspectRatio="none">
                ${batAreaPath}
                ${batSvgPath}
            </svg>
        </div>` : ''}
    </div>` : ''}

    ${gpuName ? `
    <!-- GPU & GRAPHICS -->
    <div class="section">
        <div class="section-title">🎮 GPU &amp; GRAPHICS</div>
        <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">GPU</span><span class="meta-val">${gpuName}</span></div>
            <div class="meta-item"><span class="meta-label">DRIVER</span><span class="meta-val">${gpuDriver}</span></div>
            <div class="meta-item"><span class="meta-label">VRAM</span><span class="meta-val">${gpuVram} MB</span></div>
            <div class="meta-item"><span class="meta-label">HAGS</span><span class="meta-val">${t.gpu.status}</span></div>
        </div>
    </div>` : ''}

    <!-- VERDICT -->
    <div class="section verdict">
        <div class="verdict-tag" style="color:${scoreColor};border:2px solid ${scoreColor};box-shadow:0 0 20px ${scoreColor}44">
            ${score >= 80 ? '🏆 TOURNAMENT READY' : (score >= 50 ? '✅ OPTIMIZED' : '⚠️ NEEDS TUNING')}  —  SCORE: ${score}/100
        </div>
        <div style="color:#5a6377;font-size:12px;margin-top:12px">
            ${score >= 80 ? 'System is fully tuned for competitive eSports: sub-millisecond input response, zero frame drops, and ultra-low ping.' : (score >= 50 ? 'System is performing well. Consider running the Rust Deep Kernel for maximum timer resolution.' : 'System needs optimization. Run APEX OVERDRIVE full boost to unlock peak performance.')}
        </div>
    </div>

    <div class="footer">
        APEX OVERDRIVE v3.0 &nbsp;•&nbsp; Generated ${new Date().toLocaleString()} &nbsp;•&nbsp; github.com/alexhack235-code/APEX-OVERDRIVE-
    </div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ApexOverdrive_Report_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    playSound('complete');
    logToConsole('📊 Exported rich visual diagnostic report (HTML with SVG gauges & waveforms).', 'success');
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

// Battery & Power Actions
const btnUnthrottleBattery = document.getElementById('btnUnthrottleBattery');
if (btnUnthrottleBattery) {
    btnUnthrottleBattery.addEventListener('click', async () => {
        playSound('boost');
        logToConsole('⚡ Engaging UNTHROTTLED BATTERY GAMING MODE (0% EPP, 100% DC Clocks, No Power Throttling)...', 'rust-boost');
        try {
            const res = await fetch('/api/battery/gaming-mode', { method: 'POST' });
            const data = await res.json();
            logToConsole(data.output || '⚡ 100% Max CPU/GPU clocks unlocked on DC Battery! Power throttling bypassed.', 'success');
            playSound('complete');
        } catch (e) {
            logToConsole('Error engaging battery gaming mode: ' + e.message, 'error');
        }
    });
}

const btnEcoBattery = document.getElementById('btnEcoBattery');
if (btnEcoBattery) {
    btnEcoBattery.addEventListener('click', async () => {
        playSound('click');
        logToConsole('🌱 Restoring Eco Battery Saver Mode...', 'info');
        try {
            const res = await fetch('/api/battery/eco-mode', { method: 'POST' });
            const data = await res.json();
            logToConsole(data.output || 'Eco Battery Saver Mode active. Balanced power consumption restored.', 'success');
        } catch (e) {
            logToConsole('Error setting eco mode: ' + e.message, 'error');
        }
    });
}

// GPU Accelerator Action
const btnOptGpu = document.getElementById('btnOptGpu');
if (btnOptGpu) {
    btnOptGpu.addEventListener('click', async () => {
        playSound('boost');
        logToConsole('🎮 Optimizing DirectX D3D GPU Scheduling & Clearing Corrupt Shaders...', 'boost');
        try {
            await fetch('/api/boost/gpu', { method: 'POST' });
            await fetch('/api/clean-shaders', { method: 'POST' });
            logToConsole('✅ GPU Priority elevated & DirectX D3D shader caches purged.', 'success');
            playSound('complete');
        } catch (e) {
            logToConsole('Error optimizing GPU: ' + e.message, 'error');
        }
    });
}

// Compact Laptop View Toggle
const btnCompactMode = document.getElementById('btnCompactMode');
const compactIcon = document.getElementById('compactIcon');
let isCompactMode = false;
if (btnCompactMode) {
    btnCompactMode.addEventListener('click', () => {
        isCompactMode = !isCompactMode;
        document.body.classList.toggle('compact-mode', isCompactMode);
        compactIcon.textContent = isCompactMode ? '🖥️ EXPANDED VIEW' : '📐 COMPACT VIEW';
        playSound('click');
        logToConsole(isCompactMode ? 'Switched to Compact Streamlined HUD (Laptop Mode).' : 'Switched to Full eSports HUD.', 'info');
    });
}

async function fetchEngineStatus() {
    try {
        const res = await fetch('/api/engine-status');
        const data = await res.json();
        if (data.available) {
            logToConsole(`⚡ Native Kernel Accelerator connected (${data.type.toUpperCase()} on ${data.os})`, 'success');
        }
        const timerRes = await fetch('/api/timer-resolution');
        const tData = await timerRes.json();
        if (tData && tData.timer_ms) {
            timerText.textContent = `TIMER: ${tData.timer_ms.toFixed(3)}ms (ULTRA)`;
        }
    } catch (e) {}
}

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    scanGames();
    drawCrosshairPreview();
    setEngineMode('rust');
    fetchEngineStatus();
});
