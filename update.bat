@echo off
:: Set working directory to the folder containing this batch file
cd /d "%~dp0"

echo ===================================================
echo             NADEEM TRADERS - RDP UPDATE
echo ===================================================
echo.

echo [1/5] Pulling latest code from GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo [ERROR] Git pull failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [3/5] Building production assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [4/5] Re-registering & Starting Nadeem-Traders in PM2...
call pm2 delete Nadeem-Traders 2>nul
call pm2 start .output/server/index.mjs --name "Nadeem-Traders"
if %errorlevel% neq 0 (
    echo [FALLBACK] Starting with npm preview fallback...
    call pm2 start npm --name "Nadeem-Traders" -- run preview
)

echo.
echo [5/5] Ensuring other server websites are online...
call pm2 start energy-website 2>nul

call pm2 save

echo.
echo ===================================================
echo               CURRENT PM2 STATUS
echo ===================================================
call pm2 status

echo.
echo ===================================================
echo        SUCCESS: Server updated and restarted!
echo ===================================================
echo.
pause
