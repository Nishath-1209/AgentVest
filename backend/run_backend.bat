@echo off
title AgentVest Backend Server
cd /d "%~dp0"
echo ========================================================
echo        AGENTVEST MULTI-AGENT BACKEND SERVER
echo ========================================================

if not exist ".venv" (
    echo [INFO] Virtual environment not found. Initializing .venv...
    py -3.11 -m venv .venv 2>nul || python -m venv .venv
    call .\.venv\Scripts\activate.bat
    echo [INFO] Installing backend dependencies from requirements.txt...
    pip install --upgrade pip
    pip install -r requirements.txt
) else (
    call .\.venv\Scripts\activate.bat
)

if not exist ".env" (
    echo [INFO] Creating .env from .env.example...
    copy .env.example .env >nul
)

echo.
echo [INFO] Starting FastAPI server on http://127.0.0.1:8000 ...
echo [INFO] Interactive Swagger Documentation: http://127.0.0.1:8000/docs
echo.
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
