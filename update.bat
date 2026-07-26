@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo      Nadeem Traders - RDP Update ^& Deployment
echo ===================================================
echo.

echo [1/4] Pulling latest code from GitHub (main branch)...
call git pull origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Git pull failed! Please check git configuration or branch status.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/4] Installing npm dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: npm install failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/4] Building Node.js server production bundle...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: npm run build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [4/4] Starting / Restarting PM2 process 'Nadeem-Traders'...
:: Delete previous stale process configuration to ensure fresh Node.js server setup
call pm2 delete Nadeem-Traders 2>nul
call pm2 start server.js --name "Nadeem-Traders"

if %ERRORLEVEL% EQU 0 (
    echo.
    call pm2 save
    echo ===================================================
    echo       SUCCESS: Nadeem-Traders updated and online!
    echo ===================================================
    echo Current PM2 Status:
    call pm2 status
) else (
    echo.
    echo ===================================================
    echo       WARNING: PM2 start failed. Trying fallback npm start...
    call pm2 start "npm run start" --name "Nadeem-Traders"
    call pm2 save
    call pm2 status
    echo ===================================================
)

echo.
pause
