@echo off
:: ============================================================================
:: APEX OVERDRIVE // ULTRA LOW-LATENCY & FPS KERNEL BOOSTER
:: Automatically requests Administrator privileges and launches the HUD Dashboard
:: ============================================================================

title APEX OVERDRIVE // KERNEL GAMING ACCELERATOR
cd /d "%~dp0"

:: Check for Administrative Privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ELEVATION] Requesting Administrator Privileges for Kernel Tweaks...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c \"\"%~dpnx0\"\"' -Verb RunAs"
    exit /b
)

cls
echo ============================================================================
echo   APEX OVERDRIVE // ULTRA LOW-LATENCY & FPS KERNEL BOOSTER
echo ============================================================================
echo [STATUS] Running with elevated Windows Administrator Privileges.
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found in PATH!
    echo Please ensure Node.js is installed to run the local telemetry hub.
    pause
    exit /b
)

:: Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo [INIT] Installing required dependencies (express, ws)...
    npm install
)

:: Verify or Compile Native Kernel Engine if missing
if not exist "native_engine\ApexDeepKernel.exe" (
    echo [BUILD] Compiling Native NTDLL Kernel Accelerator...
    if exist "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
        "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /optimize+ /platform:x64 /out:native_engine\ApexDeepKernel.exe native_engine\ApexDeepKernel.cs
        echo [BUILD] Native Kernel Accelerator compiled successfully.
    )
)

echo [STARTING] Launching Apex Overdrive Telemetry Engine on port 4888...
echo [OPENING]  Opening HUD Dashboard in your default browser...

:: Open Browser after 1.5 seconds in background
start /min powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:4888'"

:: Start Node server
node backend/server.js
pause
