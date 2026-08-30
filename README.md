# ⚡ APEX OVERDRIVE // USER MANUAL & OPERATING GUIDE
> **Universal Linux & Windows Low-Latency Gaming Engine & In-Game FPS Multiplier**

---

## 🎯 What is Apex Overdrive?

**Apex Overdrive** is a next-generation, cross-platform gaming accelerator. It is designed to be **so intuitive that anyone can use it with a single click**, yet engineered with a **Deep Native Rust OS Kernel Engine** to deliver competitive eSports-grade hardware tuning:
- 🚀 **Maximum In-Game FPS** and buttery-smooth frame pacing.
- ⏱️ **Sub-Millisecond System Timer Resolution** (`0.500ms` on Windows / `1ns` on Linux).
- 🌐 **Zero Packet Queuing & Lowest Ping** (TCP BBR, TCP NoDelay, Fair Queueing).
- 🧠 **Direct OS Standby Memory List Purging** without memory fragmentation.
- 🎮 **Gamer Arsenal**: In-Game Crosshair Overlay, 10-Second Hardware Stress Benchmark, DirectX Shader Stutter Purger, Per-Core CPU Heatmap, and Game Priority Lockers.

---

## 🕹️ Quick Start Guide (How to Run)

### 🪟 On Windows (10 & 11)
1. Navigate to the `FPS-BOOST LATENCY` folder.
2. Right-click [`Launch-ApexOverdrive.bat`](file:///c:/Users/Baha/Desktop/FPS-BOOST%20LATENCY/Launch-ApexOverdrive.bat) and choose **"Run as administrator"** (or simply double-click it; it will prompt for Administrator privileges automatically).
3. The HUD Dashboard will automatically launch in your default web browser at:
   ```
   http://localhost:4888
   ```

### 🐧 On Linux (Ubuntu, Arch, Fedora, Debian, SteamOS / Steam Deck)
1. Open terminal in the project directory.
2. Run:
   ```bash
   chmod +x Launch-ApexOverdrive.sh
   ./Launch-ApexOverdrive.sh
   ```
3. Open `http://localhost:4888` in your browser.

### 📱 On Android via Termux (Mobile Gaming, CODM & Blood Strike Mobile)
1. In Termux on your Android device, run:
   ```bash
   chmod +x Launch-ApexOverdrive-Termux.sh
   ./Launch-ApexOverdrive-Termux.sh
   ```
2. The script will install Node.js automatically and open `http://localhost:4888` in your Android Chrome or mobile browser!

---

## ⚡ How to Use the Features

```
+-----------------------------------------------------------------------------------------+
|                                    APEX OVERDRIVE HUD                                    |
+-----------------------------------------------------------------------------------------+
| [🏆 ESPORTS TOURNAMENT PRO]    [🚀 STABLE HIGH FPS GAMER]    [🌐 ZERO-PING & JITTER KILLER] |
+-----------------------------------------------------------------------------------------+
| [🎯 VALORANT]   [💣 CS2]   [⚡ FORTNITE]   [🔥 APEX / WARZONE]   [🧱 ROBLOX / MINECRAFT] |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [🔥 ENGAGE DEEP RUST KERNEL OVERDRIVE 🔥]                   [  98 / 100 FPS INDEX  ]   |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
|  [📊 10-SEC BENCHMARK]   |   [⚡ PER-CORE CPU HEATMAP (Core 0, 1, 2, 3... MHz)]         |
+-----------------------------------------------------------------------------------------+
|  [🌐 NETWORK OSCILLOSCOPE] [🧠 RAM PURGER] [💾 STORAGE TRIM] [⚙️ SCHEDULER UNPARKING]     |
+-----------------------------------------------------------------------------------------+
|  [🌐 DNS LEADERBOARD]     [⌨️ 0ms INPUT DELAY] [🎯 CROSSHAIR] [🎮 RUNNING GAME LOCKER]  |
+-----------------------------------------------------------------------------------------+
```

---

### 1. 🏆 1-Click Instant Presets (Dummy-Proof Auto-Engine)
At the top of the interface, you will find 3 instant preset banners:
- **🏆 ESPORTS TOURNAMENT PRO**: 
  - *When to use*: Before playing competitive ranked games (Valorant, CS2, Apex, Fortnite).
  - *What it does*: Activates Deep Rust 0.5ms kernel timer, flushes standby RAM, sets FilterKeys to 0ms input delay, locks spatial audio buffers, and tunes CPU quantum.
- **🚀 STABLE HIGH FPS GAMER**: 
  - *When to use*: For AAA titles, open-world games, and streaming.
  - *What it does*: Unparks all CPU cores, silences GameDVR background recording, triggers NVMe TRIM, and compacts background working sets.
- **🌐 ZERO-PING & JITTER KILLER**:
  - *When to use*: Whenever you experience high ping, packet loss, or Wi-Fi jitter.
  - *What it does*: Engages TCP BBR, disables delayed ACKs, and flushes DNS cache.

---

### 2. 🎮 1-Click Game-Specific Profiles
Click on your game title banner before launching:
- **BLOOD STRIKE**: 0.500ms kernel timer resolution + instant WASD FilterKeys 0ms repeat delay + TCP NoDelay for rapid hit-registration.
- **CODM / GAMELOOP (EMULATORS)**: Core unparking for Android virtualization (VT-x / KVM), Standby memory purge to stop emulator memory leaks, and high-priority audio buffer.
- **VALORANT**: Locks raw mouse input, bypasses Vanguard priority queues, and enables TCP NoDelay.
- **COUNTER-STRIKE 2**: Locks sub-millisecond 0.5ms timer for subtick packet precision and Source 2 thread allocation.
- **FORTNITE**: Accelerates NVMe asset streaming, unparks physics cores, and forces DirectFlip exclusive fullscreen.
- **APEX LEGENDS / WARZONE**: Purges corrupt GPU shader caches and boosts spatial footstep audio DSP.
- **ROBLOX / MINECRAFT**: Trims Java/Luau heap garbage collector and flushes memory fragmentation.

---

### 3. 📊 Real-Time Hardware Benchmark Stress Tester
- Click **`⚡ START 10-SEC STRESS TEST`**.
- The tool will run a live 10-second hardware draw-call simulation.
- View your **Average FPS**, **1% Low FPS**, **0.1% Low FPS (Micro-Stutter score)**, and **Frame Time Jitter Variance (ms)** on the animated canvas graph.

---

### 4. 🧹 DirectX & GPU Shader Cache Purger
- Click **`PURGE CACHES`** under the Input & Shader section.
- Wipes old, corrupt DirectX (D3D), NVIDIA DXCache, and AMD DxCache files.
- *Use this whenever a game stutters or drops frames when loading new maps, guns, or player models.*

---

### 5. 🎯 In-Game Pro Crosshair Overlay
- Customize the crosshair color, size, gap, and center dot in the preview box.
- Click **`TOGGLE OVERLAY`**.
- An unclickable, transparent crosshair reticle is projected directly in the center of your screen for hipfire and noscope precision.

---

### 6. 🌐 Global DNS Benchmark & 1-Click Switcher
- Click **`⚡ BENCHMARK ALL`**.
- The engine will test live round-trip ping to **Cloudflare (1.1.1.1)**, **Google (8.8.8.8)**, **Quad9 (9.9.9.9)**, **Riot Games**, and **Valve Steam SDR**.
- Click **`SET AS DEFAULT`** next to the fastest provider to instantly reconfigure your active network adapter.

---

### 7. 🎯 Active Game Process Priority Locker
- Select your running game from the dropdown list (e.g. `cs2.exe`, `valorant.exe`).
- Choose **`REALTIME`** or **`HIGH`** priority and click **`LOCK`**.
- Your game process is immediately granted top CPU scheduling and High I/O throughput over all background Windows/Linux tasks.

---

### 8. ↺ Restore Defaults
- If you ever want to revert all system power plans, network configurations, and registry/sysctl values back to factory defaults, simply click **`↺ RESTORE DEFAULTS`** in the top-right header.
