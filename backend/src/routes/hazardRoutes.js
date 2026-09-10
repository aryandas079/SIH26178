/**
 * hazardRoutes.js
 * Endpoints for station registry and spatial risk calculation.
 */

import { Router } from 'express';
import {
  getStations,
  getStationById,
  calculateSpatialRisk,
} from '../controllers/hazardController.js';

const router = Router();

router.get('/stations', getStations);
router.get('/stations/:id', getStationById);
router.post('/hazard/risk', calculateSpatialRisk);

export default router;
