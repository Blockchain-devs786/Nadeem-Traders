@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo               NADEEM TRADERS - RELEASE
echo ===================================================
echo.

set "commit_msg=%~1"

if "%commit_msg%"=="" (
    set /p "commit_msg=Enter commit message (or press ENTER for default): "
)

if "%commit_msg%"=="" (
    set "commit_msg=Update site content and features - %date% %time%"
)

echo.
echo [1/3] Staging changes...
git add .

echo [2/3] Committing changes: "!commit_msg!"
git commit -m "!commit_msg!"

echo [3/3] Pushing to GitHub (origin/main)...
git push origin main

echo.
echo ===================================================
echo        SUCCESS: Code pushed to GitHub!
echo ===================================================
echo.
pause
