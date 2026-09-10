/**
 * start_dev_all.mjs
 * Zero-dependency cross-platform development orchestrator.
 * Concurrently spawns the Backend Express API (port 5000) and the Frontend Vite Dev Server (port 5173).
 */

import { spawn } from 'child_process';
import path from 'path';

const rootDir = process.cwd();
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('========================================================');
console.log('  ERMS MULTI-TIER DEVELOPMENT ENVIRONMENT ORCHESTRATOR');
console.log('========================================================');

// 1. Spawn Backend API Server
const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'backend'),
  stdio: 'pipe',
  shell: true,
});

backend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach((l) => console.log(`\x1b[36m[BACKEND :5000]\x1b[0m ${l}`));
});

backend.stderr.on('data', (data) => {
  console.error(`\x1b[31m[BACKEND ERR]\x1b[0m ${data.toString().trim()}`);
});

// 2. Spawn Frontend Vite Server
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'frontend'),
  stdio: 'pipe',
  shell: true,
});

frontend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach((l) => console.log(`\x1b[32m[FRONTEND :5173]\x1b[0m ${l}`));
});

frontend.stderr.on('data', (data) => {
  console.error(`\x1b[33m[FRONTEND INFO]\x1b[0m ${data.toString().trim()}`);
});

// Clean shutdown handler
function shutdown() {
  console.log('\nStopping ERMS development servers...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
