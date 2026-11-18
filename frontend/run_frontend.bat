@echo off
title AgentVest Frontend Client
cd /d "%~dp0"
echo ========================================================
echo        AGENTVEST FINTECH REACT FRONTEND CLIENT
echo ========================================================

if not exist "node_modules" (
    echo [INFO] node_modules not detected. Installing dependencies...
    call npm install
)

if not exist ".env" (
    echo [INFO] Creating .env from .env.example...
    copy .env.example .env >nul
)

echo.
echo [INFO] Starting Vite development server...
echo [INFO] Open in your browser: http://localhost:5173
echo.
call npm run dev
pause
