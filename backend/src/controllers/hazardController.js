/** Controller handling station registry and spatial risk calculations. */

import { dbClient } from '../../../database/dbClient.js';

export function getStations(req, res) {
  const stations = dbClient.getStations();
  res.json({
    success: true,
    count: stations.length,
    stations,
  });
}

export function getStationById(req, res) {
  const { id } = req.params;
  const station = dbClient.getStationById(id);
  if (!station) {
    return res.status(404).json({ success: false, error: 'Station not found.' });
  }
  res.json({ success: true, station });
}

export function calculateSpatialRisk(req, res) {
  const { latitude, longitude, surfaceTemp, aqi, waterLevel, rainfall } = req.body || {};

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, error: 'Latitude and longitude are required.' });
  }

  // Multi-hazard composite scoring formula
  const tempFactor = Math.min(100, Math.max(0, ((surfaceTemp || 28) - 20) * 3));
  const aqiFactor = Math.min(100, (aqi || 80) / 4);
  const waterFactor = Math.min(100, (waterLevel || 18) * 4);
  const rainFactor = Math.min(100, (rainfall || 20) * 1.5);

  const compositeScore = Math.round((tempFactor * 0.15 + aqiFactor * 0.25 + waterFactor * 0.35 + rainFactor * 0.25));

  let riskTier = 'LOW';
  if (compositeScore >= 75) riskTier = 'CRITICAL';
  else if (compositeScore >= 55) riskTier = 'HIGH';
  else if (compositeScore >= 35) riskTier = 'MODERATE';

  res.json({
    success: true,
    coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
    compositeScore,
    riskTier,
    factors: {
      temperature: Math.round(tempFactor),
      airQuality: Math.round(aqiFactor),
      hydrological: Math.round(waterFactor),
      precipitation: Math.round(rainFactor),
    },
    timestamp: new Date().toISOString(),
  });
}
