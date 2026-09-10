/** Routes for live SSE telemetry stream, observations, and data ingestion. */

import { Router } from 'express';
import {
  streamTelemetry,
  getLatestTelemetry,
  listTelemetryFiles,
  appendTelemetryRow,
} from '../controllers/telemetryController.js';

const router = Router();

router.get('/sensor-logs/stream', streamTelemetry);
router.get('/sensor-logs/latest', getLatestTelemetry);
router.get('/sensor-logs/files', listTelemetryFiles);
router.post('/sensor-logs/append', appendTelemetryRow);

export default router;
