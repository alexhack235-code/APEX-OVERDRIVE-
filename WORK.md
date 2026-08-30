# 🔬 APEX OVERDRIVE // TECHNICAL ARCHITECTURE & KERNEL WORKINGS (WORK.md)
> **In-Depth Engineering Specification & Low-Level Operating System Mechanics**

---

## 🏛️ 1. Executive Architectural Blueprint

Apex Overdrive implements a **hybrid multi-layer architecture** bridging high-level reactive client user interfaces with low-level kernel system calls on both **Windows (NT Kernel)** and **Linux (Monolithic Kernel 5.x / 6.x)**.

```
+------------------------------------------------------------------------------------------------+
|                                    CLIENT APPLICATION LAYER                                    |
|                      HTML5 Cyberpunk HUD // 60 FPS HTML5 Canvas Oscilloscope                    |
|                        Web Audio Synthesizer // In-Game Crosshair Overlay                      |
+------------------------------------------------------------------------------------------------+
                                                 ▲
                                                 │ WebSocket Telemetry (JSON @ 1000ms)
                                                 │ REST API Control Commands
                                                 ▼
+------------------------------------------------------------------------------------------------+
|                                     NODE.JS BACKEND DAEMON                                     |
|                 Express.js REST Engine + WebSocket Server (Port 4888)                          |
|         Telemetry Sampler (CPU Core Breakdown, ICMP Ping Prober, DNS Benchmarker)              |
|                     State Persistence & Factory Rollback (`backup.js`)                         |
+------------------------------------------------------------------------------------------------+
                           │                                                 │
      [MODE 1: STANDARD OVERDRIVE]                      [MODE 2: DEEP RUST KERNEL OVERDRIVE]
                           │                                                 │
                           ▼                                                 ▼
+------------------------------------+             +---------------------------------------------+
|    POWERSHELL / SYSCTL CONTROLLER  |             |          NATIVE RUST & NTDLL KERNEL         |
|  - MMCSS Multimedia SystemProfile  |             |  - NTDLL `NtSetTimerResolution(5000)`       |
|  - Windows Powercfg Ultimate Scheme|             |  - `NtSetSystemInformation(80, 4)` Purge    |
|  - GameDVR Registry Silencer       |             |  - `Win32PrioritySeparation = 0x28` (40)    |
|  - NVMe TRIM / swappiness=10       |             |  - Linux `prctl(PR_SET_TIMERSLACK, 1)`      |
|  - FilterKeys Repeat Delay = 0ms   |             |  - Linux `drop_caches=3` & `compact_memory` |
|  - MMCSS Spatial Audio DSP Buffer  |             |  - TCP BBR Congestion Control & FQ Queuing  |
+------------------------------------+             +---------------------------------------------+
```

---

## ⏱️ 2. Sub-Millisecond System Timer Resolution Mechanics

### The Standard OS Bottleneck:
By default, the Windows NT kernel ticks at **15.625 milliseconds (64 Hz)**. This means Windows only checks thread queues, I/O completions, and network sockets every ~15.6ms. Games operating at 144 FPS, 240 FPS, or 360 FPS require frame deliveries every **6.9ms, 4.1ms, or 2.7ms**. A 15.6ms timer introduces severe micro-stutters and frame pacing variance.

### The Apex Deep Rust Kernel Override:
- **On Windows**: Apex Overdrive bypasses user-mode Win32 APIs (`timeBeginPeriod`) and directly executes native system calls into `ntdll.dll`:
  $$\text{NtSetTimerResolution}(5000, 1, \&\text{currentResolution})$$
  $5000 \times 100\text{ns} = 0.500\text{ms}$ (500 microseconds / 2000 Hz interrupt rate).
  This locks the hardware interrupt timer (APIC / HPET) to maximum frequency, reducing input-to-screen processing delays by up to **31.25x**.
- **On Linux**: Apex Overdrive issues:
  $$\text{prctl}(\text{PR\_SET\_TIMERSLACK}, 1\text{UL})$$
  Setting thread timer slack to **1 nanosecond**, preventing the Linux kernel scheduler from coalescing timer wakeups for maximum timing precision.

---

## 🧠 3. Physical RAM & Standby Page List Purging

### The Memory Cache Bottleneck:
When running games for extended periods, Windows populates physical RAM with **Standby Cache Pages** (cached disk blocks, closed applications). When a game suddenly allocates memory for high-resolution textures or new map zones, the OS memory manager must synchronously evict standby pages, causing a dramatic **FPS drop / frame freeze**.

### The Apex Native Memory Flush:
- **On Windows**: The native engine invokes undocumented NTDLL memory management syscalls with `SeProfileSingleProcessPrivilege` / `SeIncreaseQuotaPrivilege`:
  - `NtSetSystemInformation(SYSTEM_MEMORY_LIST_INFORMATION = 80, Command = 4)` $\rightarrow$ Purges the **Standby Page List**.
  - `NtSetSystemInformation(SYSTEM_MEMORY_LIST_INFORMATION = 80, Command = 3)` $\rightarrow$ Empties the **Modified Page List**.
  - Working set reduction via `EmptyWorkingSet(hProcess)` for all non-critical background services.
- **On Linux**:
  $$\text{sync} \quad \text{and} \quad \text{echo 3} > /\text{proc}/\text{sys}/\text{vm}/\text{drop\_caches}$$
  $$\text{echo 1} > /\text{proc}/\text{sys}/\text{vm}/\text{compact\_memory}$$
  Evicts PageCache, dentries, and inodes, and defragments contiguous RAM blocks for direct allocation by game engines.

---

## ⚡ 4. CPU Scheduler Quantum & Thread Priority Separations

### Win32 Priority Separation Math:
In Windows, `HKLM\SYSTEM\CurrentControlSet\Control\PriorityControl\Win32PrioritySeparation` controls how CPU time slices (quanta) are distributed between foreground (your active game) and background tasks.

Apex Overdrive sets:
$$\text{Win32PrioritySeparation} = 40 \quad (\text{0x28 Hexadecimal})$$

This binary bitmask breaks down into:
1. **Bits 0-1 (`00b`)**: Short quanta (high responsiveness).
2. **Bits 2-3 (`10b`)**: Variable quanta (foreground receives 3x the quantum of background tasks).
3. **Bits 4-5 (`10b`)**: Foreground boost enabled (3:1 foreground-to-background ratio).

**Result**: When playing a game, the game executable receives **300% more continuous CPU execution time** before the OS scheduler attempts to context-switch to background services.

### Core Unparking:
Windows Powercfg core parking is completely disabled (`0cc5b647-c1df-4637-891a-dec60c318583 = 100`), ensuring all CPU physical and logical cores remain awake at 100% boost frequency with zero frequency downclocking during match loading screens.

---

## 🌐 5. Network Protocol Stack & Zero-Queuing (Anti-Lag)

```
[ Game Action (Click / Shoot) ]
             │
             ▼
[ Standard OS Stack: Waits up to 200ms to batch packets (Nagle's Algorithm) ] ❌ High Ping Spikes
             │
             ▼  APEX OVERDRIVE APPLIED
[ TcpAckFrequency = 1, TCPDelAckTicks = 0, TCPNoDelay = 1 ]                 ✅ 0ms Immediate Transmission
[ TCP BBR Congestion Control + Fair Queueing (FQ) ]                         ✅ Anti-Bufferbloat
[ NetworkThrottlingIndex = 0xFFFFFFFF (Disabled) ]                          ✅ 100% Network Card Bandwidth
```

1. **Nagle's Algorithm Suppression**: Standard networks buffer outbound packets. Setting `TcpAckFrequency=1` and `TCPDelAckTicks=0` forces the TCP stack to acknowledge and send packets immediately upon socket write.
2. **TCP BBR (Bottleneck Bandwidth and RTT)**: Replaces loss-based congestion algorithms (like Cubic) with a model-based algorithm that measures true network pipe delivery rates, preventing router queue buildup (bufferbloat).
3. **Network Throttling Bypass**: Disables Windows `SystemProfile\NetworkThrottlingIndex`, which normally restricts non-multimedia network packets to 10 packets/ms.

---

## 🎮 6. In-Game Rendering & GPU Compositor Pipeline

1. **DirectX GameDVR Silencer**:
   - `GameDVR_Enabled = 0`, `GameDVR_FSEBehaviorMode = 2`, `GameDVR_HonorUserFSEBehaviorMode = 1`.
   - Bypasses the Desktop Window Manager (DWM) compositor overlay, forcing **True Fullscreen Exclusive DirectFlip mode**, minimizing display input lag.
2. **DirectX & GPU Shader Cache Cleaner**:
   - Cleans temporary binary blobs in `%LOCALAPPDATA%\D3DSCache`, `NVIDIA\DXCache`, and `AMD\DxCache`. Eliminates shader recompilation cache conflicts when updating game patches.
3. **FilterKeys 0ms Input Response**:
   - Sets Windows `Keyboard Response\DelayBeforeAcceptance = 0` and `AutoRepeatDelay = 150ms / Rate = 15ms`, ensuring directional keyboard taps (WASD counter-strafing in CS2/Valorant) register with zero actuation delay.

---

## 📊 7. Live Telemetry & Oscilloscope Pipeline

1. **Per-Core CPU Sampler**: Calculates delta user/system CPU ticks per individual hardware core across a continuous time window, exposing core frequency (MHz) and utilization percentage.
2. **Dual-Node ICMP Prober**: Real-time ping testing against primary Anycast nodes (`1.1.1.1`) and secondary resolvers (`8.8.8.8`) to measure standard deviation jitter in milliseconds.
3. **60 FPS Canvas Oscilloscope**: Uses quadratic Bézier interpolation on HTML5 Canvas to render smooth real-time telemetry curves with hardware-accelerated CSS glowing shaders.

---

## 🛡️ 8. State Persistence & Safe Rollback (`backup.js`)

Apex Overdrive records every registry key, sysctl parameter, and power configuration modified into `backend/backup_state.json`. Clicking **`↺ RESTORE DEFAULTS`** performs a clean rollback:
- Restores standard Balanced/High Performance power GUID.
- Re-enables standard network packet throttling.
- Restores stock CPU frequency scaling governors (`schedutil` on Linux).
- Re-enables standard Windows notification systems.
