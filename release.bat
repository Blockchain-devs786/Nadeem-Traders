@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo           Nadeem Traders - Git Release Script
echo ===================================================
echo.

:: Get optional commit message from first parameter
set "MSG=%~1"

:: If no message parameter passed, prompt user
if "%MSG%"=="" (
    set /p "MSG=Enter commit message (Press Enter for default): "
)

:: Fallback default message if user pressed Enter without typing
if "%MSG%"=="" (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set mytime=%%a:%%b)
    set "MSG=Release update !mydate! !mytime!"
)

echo.
echo [1/3] Staging changes...
git add .

echo.
echo [2/3] Committing changes with message: "%MSG%"...
git commit -m "%MSG%"

echo.
echo [3/3] Pushing to GitHub (origin main)...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo       SUCCESS: Code pushed to GitHub!
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo       ERROR: Push failed! Check your connection or git status.
    echo ===================================================
)

echo.
pause
