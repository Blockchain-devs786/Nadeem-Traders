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
echo [4/4] Restarting PM2 process server...
call pm2 restart all
if %errorlevel% neq 0 (
    echo [WARNING] pm2 restart all failed, attempting to start server...
    call pm2 start npm --name "nadeem-traders" -- run preview
)

echo.
echo ===================================================
echo               CURRENT PM2 STATUS
echo ===================================================
call pm2 status

echo.
echo ===================================================
echo        SUCCESS: RDP Server updated and restarted!
echo ===================================================
echo.
pause
