@echo off
title APEX OVERDRIVE — FPS BOOST ENGINE
color 0A

:: Auto-elevate to Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [*] Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ====================================================
echo   APEX OVERDRIVE // ULTRA LOW-LATENCY FPS BOOSTER
echo   Dual-Engine: Standard App + Deep Rust Kernel
echo   Dashboard: http://localhost:4888
echo ====================================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js not found! Please install from https://nodejs.org
    pause
    exit /b 1
)

:: Install dependencies if missing
if not exist node_modules (
    echo [*] Installing dependencies...
    npm install --production
)

:: Auto-open browser after 2 seconds
start /b cmd /c "timeout /t 2 >nul && start http://localhost:4888"

:: AUTO-RESTART LOOP — server will never stay dead
:RESTART_LOOP
echo [ENGINE] Starting Apex Overdrive Server...
node backend/server.js
echo.
echo [CRASH SHIELD] Server stopped unexpectedly — auto-restarting in 3 seconds...
timeout /t 3 >nul
goto RESTART_LOOP
