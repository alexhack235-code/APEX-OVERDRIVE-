#!/usr/bin/env bash
# ============================================================================
# APEX OVERDRIVE // UNIVERSAL LINUX + WINDOWS KERNEL GAMING BOOSTER
# One-Click Linux Launcher
# ============================================================================

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "============================================================================"
echo "  ⚡ APEX OVERDRIVE // LINUX KERNEL & LOW-LATENCY GAMING ACCELERATOR ⚡   "
echo "============================================================================"

# Check for root/sudo privileges for kernel sysctl and cpufreq tuning
if [ "$EUID" -ne 0 ]; then
    echo "[INFO] Running as regular user. Requesting sudo permissions for kernel tweaks..."
    sudo -v || true
fi

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed! Please install Node.js (v18+) to run Apex Overdrive."
    exit 1
fi

# Build Rust Core if cargo is present and binary not built yet
if command -v cargo >/dev/null 2>&1; then
    if [ ! -f "rust_core/target/release/apex_rust_core" ]; then
        echo "[RUST] Building high-performance Linux Rust kernel accelerator..."
        cd rust_core
        cargo build --release
        cd ..
    fi
fi

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "[INIT] Installing web dependencies..."
    npm install
fi

echo "[STARTING] Launching Apex Overdrive Telemetry Hub on port 4888..."
echo "[OPENING]  Opening HUD Dashboard in your default browser..."

# Open default browser in background
(sleep 2 && (xdg-open http://localhost:4888 2>/dev/null || sensible-browser http://localhost:4888 2>/dev/null || open http://localhost:4888 2>/dev/null || true)) &

node backend/server.js
