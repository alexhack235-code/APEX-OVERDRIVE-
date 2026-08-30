#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# APEX OVERDRIVE // ANDROID TERMUX 1-CLICK LAUNCHER
# Ultra Low-Latency Gaming & FPS Booster for Android Mobile & Emulators
# ==============================================================================

echo -e "\033[1;36m"
echo "================================================================"
echo "    ⚡ APEX OVERDRIVE // ANDROID TERMUX GAMING ACCELERATOR ⚡   "
echo "        Optimizing Mobile Gaming, CODM, Blood Strike & FPS       "
echo "================================================================"
echo -e "\033[0m"

# 1. Check Node.js in Termux
if ! command -v node &> /dev/null; then
    echo -e "\033[1;33m[*] Node.js not detected. Installing via Termux pkg manager...\033[0m"
    pkg update -y
    pkg install -y nodejs
fi

# 2. Check Node Dependencies
if [ ! -d "node_modules" ]; then
    echo -e "\033[1;33m[*] Installing Node.js lightweight dependencies...\033[0m"
    npm install --production
fi

# 3. Check for Root Access (Optional for deep kernel acceleration)
if command -v su &> /dev/null || command -v tsu &> /dev/null; then
    echo -e "\033[1;32m[+] Root access detected (tsu/su available)! Deep Android Linux Kernel tuning active.\033[0m"
else
    echo -e "\033[1;36m[*] Running in Termux User Mode (Standby RAM flush, Web Telemetry, DNS benchmark active).\033[0m"
fi

echo -e "\033[1;32m[+] Starting Apex Overdrive Server Daemon on port 4888...\033[0m"
echo -e "\033[1;35m>>> Open in your Android Chrome/Browser at: http://localhost:4888 <<<\033[0m"

# Open Android browser automatically if termux-api is available
if command -v termux-open-url &> /dev/null; then
    (sleep 2 && termux-open-url http://localhost:4888) &
elif command -v am &> /dev/null; then
    (sleep 2 && am start -a android.intent.action.VIEW -d http://localhost:4888 >/dev/null 2>&1) &
fi

# Launch Node Server
node backend/server.js
