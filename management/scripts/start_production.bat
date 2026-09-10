@echo off
title ERMS - Production Launch Orchestrator
cd /d "%~dp0\..\.."

echo ========================================================
echo   ERMS Enterprise Multi-Tier Production Launcher
echo ========================================================
echo.

echo [1/3] Building Optimized Frontend Production Bundle...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b 1
)

echo [2/3] Starting Production Backend API & Static Web Server...
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5000/"

echo [3/3] Enterprise Server active at http://localhost:5000/
echo Press Ctrl+C to terminate.
echo.

node backend\src\server.js
