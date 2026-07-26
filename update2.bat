@echo off
echo ==============================================
echo  VPS Update Script (Nadeem Traders)
echo ==============================================
echo.

echo [1/4] Fetching and resetting to match GitHub repository...
git fetch --all
git reset --hard origin/main
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to sync code from repository.
    goto :error
)

echo.
echo [2/4] Installing node dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to install npm dependencies.
    goto :error
)

echo.
echo [3/4] Building production server...
set NITRO_PRESET=node-server
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Error: Production build failed.
    goto :error
)

echo.
echo [4/4] Restarting PM2 process...
call pm2 restart Nadeem-Traders
if %ERRORLEVEL% neq 0 (
    echo Warning: Failed to restart via pm2 directly. Starting process...
    call pm2 delete Nadeem-Traders 2>nul
    call pm2 start .output/server/index.mjs --name "Nadeem-Traders"
    call pm2 save
)

echo.
echo ==============================================
echo  Server updated and restarted successfully!
echo ==============================================
echo.
pause
exit /b 0

:error
echo.
echo ==============================================
echo  Update failed! Please check errors above.
echo ==============================================
echo.
pause
exit /b 1
