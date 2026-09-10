Set-Location -Path $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  ERMS Enterprise Multi-Tier Intelligence Platform" -ForegroundColor Green
Write-Host "  [Frontend :5173] [Backend REST/SSE :5000] [Database Active]" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js was not found in your PATH." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "[1/3] Installing Frontend dependencies..." -ForegroundColor Cyan
    Set-Location -Path "frontend"
    cmd /c "npm install"
    Set-Location -Path ".."
}

if (-not (Test-Path "backend\node_modules")) {
    Write-Host "[2/3] Installing Backend dependencies..." -ForegroundColor Cyan
    Set-Location -Path "backend"
    cmd /c "npm install"
    Set-Location -Path ".."
}

Write-Host "[3/3] Launching Full-Stack Services..." -ForegroundColor Cyan
Write-Host "- Backend API:  http://localhost:5000/api/health" -ForegroundColor Green
Write-Host "- Frontend Web: http://localhost:5173/" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost:5173/"

cmd /c "npm run dev"
