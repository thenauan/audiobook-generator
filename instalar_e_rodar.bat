@echo off
chcp 65001 >nul
cd %~dp0..
title Audiobook Generator - Installer ^& Launcher
echo ===================================================
echo     Audiobook Generator - Installer ^& Launcher    
echo ===================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js detected.

:: Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found!
    echo Please install Python: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python detected.

:: Install NPM dependencies
echo.
echo Installing interface dependencies (Node.js)...
call npm install howler @types/howler electron
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Node.js dependencies.
    pause
    exit /b 1
)

:: Install Python dependencies
echo.
echo Installing backend dependencies (Python)...
call python -m pip install ebooklib beautifulsoup4 pypdf mobi deep-translator langdetect mutagen edge-tts tqdm colorama
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo   Installation complete! Starting the app...       
echo ===================================================
echo.
call npx electron electron-main.js
pause