@echo off
:: ============================================================
::  release.bat — Push latest code to GitHub automatically
::  Usage: Double-click or run from project root on local machine
:: ============================================================
setlocal enabledelayedexpansion

echo.
echo  =========================================
echo   Nadeem Traders — GitHub Release
echo  =========================================
echo.

cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] git not found. Please install Git for Windows.
    pause
    exit /b 1
)

echo [INFO] Current branch:
git branch --show-current

echo.
echo [INFO] Changed files:
git status --short
echo.

set /p COMMIT_MSG=Enter commit message (or press Enter for default timestamp): 

if "!COMMIT_MSG!"=="" (
    for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set TODAY=%%a-%%b-%%c
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set NOW=%%a:%%b
    set COMMIT_MSG=Release !TODAY! !NOW!
)

echo.
echo [INFO] Staging all changes...
git add -A

echo [INFO] Committing: "!COMMIT_MSG!"
git commit -m "!COMMIT_MSG!"

if errorlevel 1 (
    echo [WARN] Nothing new to commit, or commit failed.
)

echo.
echo [INFO] Pushing to GitHub (origin main)...
git push origin main

if errorlevel 1 (
    echo [ERROR] Push failed. Check your network or git remote credentials.
    pause
    exit /b 1
)

echo.
echo  =========================================
echo   SUCCESS — Code pushed to GitHub!
echo  =========================================
echo.
pause
