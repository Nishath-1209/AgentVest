@echo off
title AgentVest Launcher
echo ========================================================
echo        AGENTVEST MULTI-AGENT INVESTMENT ADVISOR
echo ========================================================
echo.
echo Launching Backend FastAPI server in new window...
start "AgentVest Backend" cmd /c "cd /d ""%~dp0backend"" && run_backend.bat"
timeout /t 3 /nobreak >nul
echo Launching Frontend React client in new window...
start "AgentVest Frontend" cmd /c "cd /d ""%~dp0frontend"" && run_frontend.bat"
echo.
echo Both servers are starting up:
echo   - Backend API Docs: http://127.0.0.1:8000/docs
echo   - Frontend UI:      http://localhost:5173
echo.
pause
