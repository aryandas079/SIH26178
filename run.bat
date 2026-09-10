@echo off
title ERMS - Environmental Risk Intelligence Platform
cd /d "%~dp0"

echo ========================================================
echo   ERMS Enterprise Multi-Tier Intelligence Platform
echo   [Frontend :5173] [Backend REST/SSE :5000] [Database Active]
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH!
    echo Please download and install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo [1/3] Installing Frontend dependencies...
    cd frontend
    call npm.cmd install
    cd ..
)

if not exist "backend\node_modules" (
    echo [2/3] Installing Backend dependencies...
    cd backend
    call npm.cmd install
    cd ..
)

echo [3/3] Launching Full-Stack Services...
echo - Backend API:  http://localhost:5000/api/health
echo - Frontend Web: http://localhost:5173/
echo.

REM Automatically launch the browser after a 2-second delay
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173/"

call npm.cmd run dev
