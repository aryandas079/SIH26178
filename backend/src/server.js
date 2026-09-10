/** ERMS Backend API Server entry point. */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import healthRoutes from './routes/healthRoutes.js';
import telemetryRoutes from './routes/telemetryRoutes.js';
import hazardRoutes from './routes/hazardRoutes.js';
import authRoutes from './routes/authRoutes.js';

import { rateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import { fileWatcherService } from './services/fileWatcherService.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Id', 'X-Admin-Password'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

app.use((req, res, next) => {
  if (!req.url.includes('/stream')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

app.use('/api', healthRoutes);
app.use('/api', telemetryRoutes);
app.use('/api', hazardRoutes);
app.use('/api', authRoutes);

// Serve compiled frontend in production if dist directory is present
const possibleDistPaths = [
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), 'frontend', 'dist'),
  path.resolve(process.cwd(), '..', 'dist'),
  path.resolve(process.cwd(), '..', 'frontend', 'dist'),
];

const distPath = possibleDistPaths.find((p) => fs.existsSync(p));

if (distPath) {
  console.log(`[Production Server] Serving static frontend build from: ${distPath}`);
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(globalErrorHandler);

fileWatcherService.init();

let server;
if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`  ERMS ENTERPRISE BACKEND API RUNNING ON PORT ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`  Sensor Stream: http://localhost:${PORT}/api/sensor-logs/stream`);
    console.log('====================================================');
  });
}

export { app, server };
export default app;
