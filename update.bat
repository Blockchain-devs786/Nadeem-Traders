@echo off
:: ============================================================
::  update.bat — Pull latest code, install deps, build & restart PM2
::  Usage: Double-click or run from project root on RDP server
:: ============================================================
setlocal enabledelayedexpansion

echo.
echo  =========================================
echo   Nadeem Traders — Update ^& Deploy (RDP)
echo  =========================================
echo.

cd /d "%~dp0"

:: ── 1. Check Git ──────────────────────────────────────────────
where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed or not in PATH.
    pause
    exit /b 1
)

:: ── 2. Configure Remote & Pull Latest Code ────────────────────
echo [1/5] Pulling latest code from GitHub...
git init >nul 2>&1
git remote set-url origin https://Blockchain-devs786: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@github.com/Blockchain-devs786/green-grocer-pakistan.git >nul 2>&1
if errorlevel 1 (
    git remote add origin https://Blockchain-devs786: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@github.com/Blockchain-devs786/green-grocer-pakistan.git
)

git fetch origin main
if errorlevel 1 (
    echo [ERROR] git fetch failed. Check network or token.
    pause
    exit /b 1
)

git reset --hard origin/main
if errorlevel 1 (
    echo [ERROR] git reset failed.
    pause
    exit /b 1
)
echo [OK] Code updated to latest commit.
echo.

:: ── 3. Install Dependencies ──────────────────────────────────
echo [2/5] Installing npm dependencies...
call npm install --no-audit
if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)
echo [OK] Dependencies installed.
echo.

:: ── 4. Build Production Server ───────────────────────────────
echo [3/5] Building project (Nitro node-server)...
set NITRO_PRESET=node-server
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed. Check the errors above.
    pause
    exit /b 1
)
echo [OK] Build completed.
echo.

:: ── 5. Verify Build Output ───────────────────────────────────
echo [4/5] Verifying build output...
if not exist ".output\server\index.mjs" (
    echo [ERROR] .output\server\index.mjs missing! Build may have failed.
    pause
    exit /b 1
)
echo [OK] Build verified.
echo.

:: ── 6. Restart/Start PM2 ─────────────────────────────────────
echo [5/5] Restarting PM2 process (nadeem-traders)...
where pm2 >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PM2 is not installed. Install with: npm install -g pm2
    pause
    exit /b 1
)

pm2 describe nadeem-traders >nul 2>&1
if errorlevel 1 (
    echo [INFO] Starting nadeem-traders for the first time...
    call pm2 start ecosystem.config.cjs
) else (
    echo [INFO] Reloading nadeem-traders with updated environment...
    call pm2 reload ecosystem.config.cjs --update-env
)

if errorlevel 1 (
    echo [ERROR] PM2 restart failed. Check logs with: pm2 logs nadeem-traders
    pause
    exit /b 1
)

call pm2 save

echo.
echo  =========================================
echo   SUCCESS — Deployment Complete!
echo   Website running at: http://localhost:3002
echo  =========================================
echo.
pause
