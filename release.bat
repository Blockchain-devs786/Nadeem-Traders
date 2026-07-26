@echo off
:: ============================================================
::  release.bat — Push latest code to GitHub
::  Usage: Double-click or run from project root
:: ============================================================
setlocal enabledelayedexpansion

echo.
echo  =========================================
echo   Nadeem Traders — GitHub Release
echo  =========================================
echo.

:: Make sure we're in the right directory
cd /d "%~dp0"

:: Check git is available
where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] git not found. Please install Git for Windows.
    pause
    exit /b 1
)

:: Show current status
echo [INFO] Current branch:
git branch --show-current

echo.
echo [INFO] Changed files:
git status --short

echo.

:: Ask for a commit message
set /p COMMIT_MSG=Enter commit message (or press Enter for default): 

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
    echo [WARN] Nothing to commit, or commit failed. Check above output.
    pause
    exit /b 0
)

echo.
echo [INFO] Pushing to origin...
git push

if errorlevel 1 (
    echo [ERROR] Push failed. Check your credentials or remote URL.
    pause
    exit /b 1
)

echo.
echo  =========================================
echo   SUCCESS — Code pushed to GitHub!
echo  =========================================
echo.
pause
