@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo             NADEEM TRADERS - RDP UPDATE
echo ===================================================
echo.

echo [1/4] Pulling latest code from GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo [ERROR] Git pull failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] Building production assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [4/4] Restarting PM2 process (Nadeem-Traders)...
call pm2 restart Nadeem-Traders
if %errorlevel% neq 0 (
    echo [WARNING] Restarting Nadeem-Traders failed, recreating process...
    call pm2 delete Nadeem-Traders
    call pm2 start npm --name "Nadeem-Traders" -- run preview
    call pm2 save
)

echo.
echo ===================================================
echo               CURRENT PM2 STATUS
echo ===================================================
call pm2 status

echo.
echo ===================================================
echo        SUCCESS: RDP Server updated!
echo ===================================================
echo.
pause
