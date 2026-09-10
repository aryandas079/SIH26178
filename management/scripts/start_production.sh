#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../.." && pwd )"
cd "$DIR"

echo "========================================================"
echo "  ERMS Enterprise Multi-Tier Production Launcher (Linux)"
echo "========================================================"

echo "[1/3] Building Optimized Frontend Production Bundle..."
npm run build

echo "[2/3] Starting Production Backend API & Static Web Server..."
echo "[3/3] Enterprise Server active at http://localhost:5000/"

node backend/src/server.js
