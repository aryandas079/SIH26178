/**
 * healthRoutes.js
 * Endpoints for health, readiness, and monitoring probes.
 */

import { Router } from 'express';
import { dbClient } from '../../../database/dbClient.js';
import { sseBroadcaster } from '../services/sseBroadcaster.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ERMS Enterprise Backend API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    activeSSEStreams: sseBroadcaster.getClientCount(),
    database: dbClient.health(),
  });
});

router.get('/ready', (req, res) => {
  res.json({ status: 'READY', ready: true });
});

export default router;
