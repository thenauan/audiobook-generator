@echo off
setlocal
cd /d "%~dp0"
title Audiobook Generator with AI

echo ===================================================
echo     Iniciando Audiobook Generator with AI
echo ===================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao foi encontrado no sistema!
    echo Por favor, instale o Node.js em: https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] Instalando dependencias do projeto...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependencias.
        pause
        exit /b 1
    )
)

echo [OK] Iniciando servidor do Audiobook Generator...
echo [INFO] O navegador sera aberto automaticamente.
echo.

call npm start

pause
