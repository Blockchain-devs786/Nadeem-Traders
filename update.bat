@echo off
:: ============================================================
::  update.bat — Pull latest code, install deps, build & restart
::  Usage: Double-click or run from project root on the RDP server
:: ============================================================
setlocal enabledelayedexpansion

echo.
echo  =========================================
echo   Nadeem Traders — Update ^& Deploy
echo  =========================================
echo.

:: Make sure we're in the right directory
cd /d "%~dp0"

:: ── 1. Pull latest code ─────────────────────────────────────
echo [1/5] Pulling latest code from GitHub...
git pull
if errorlevel 1 (
    echo [ERROR] git pull failed. Check your network or credentials.
    pause
    exit /b 1
)
echo.

:: ── 2. Install / update dependencies ────────────────────────
echo [2/5] Installing dependencies (npm)...
npm install
if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)
echo.

:: ── 3. Build the project ─────────────────────────────────────
echo [3/5] Building project (Nitro node-server preset)...
set NITRO_PRESET=node-server
npm run build
if errorlevel 1 (
    echo [ERROR] Build failed. Check the output above for errors.
    pause
    exit /b 1
)
echo.

:: ── 4. Verify the build output ───────────────────────────────
echo [4/5] Verifying build output...
if not exist ".output\server\index.mjs" (
    echo [ERROR] .output\server\index.mjs not found — build may have used wrong preset.
    echo         Check vite.config.ts and ensure NITRO_PRESET=node-server is set.
    pause
    exit /b 1
)

:: Check nitro.json preset field
findstr /C:"node-server" .output\nitro.json >nul 2>&1
if errorlevel 1 (
    echo [ERROR] nitro.json preset is NOT node-server!
    echo         Open vite.config.ts and confirm: process.env.NITRO_PRESET = "node-server"
    echo         Then rebuild manually with: set NITRO_PRESET=node-server ^&^& npm run build
    pause
    exit /b 1
)
echo [OK] Build verified — preset is node-server.
echo.

:: ── 5. Restart PM2 app ───────────────────────────────────────
echo [5/5] Restarting PM2 app (nadeem-traders)...

:: Check if PM2 is available
where pm2 >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pm2 not found. Install with: npm install -g pm2
    pause
    exit /b 1
)

:: Check if the app is already registered with PM2
pm2 describe nadeem-traders >nul 2>&1
if errorlevel 1 (
    echo [INFO] App not in PM2 — starting fresh from ecosystem.config.cjs...
    pm2 start ecosystem.config.cjs
) else (
    echo [INFO] App found in PM2 — reloading gracefully...
    pm2 reload ecosystem.config.cjs --update-env
)

if errorlevel 1 (
    echo [ERROR] PM2 start/reload failed. Check: pm2 logs nadeem-traders --lines 50
    pause
    exit /b 1
)

:: Save PM2 list so it survives reboots
pm2 save

echo.
echo  =========================================
echo   SUCCESS — Site is live at:
echo   http://localhost:3002
echo  =========================================
echo.
echo  Quick commands:
echo    pm2 status
echo    pm2 logs nadeem-traders --lines 50
echo    pm2 restart nadeem-traders
echo.
pause
