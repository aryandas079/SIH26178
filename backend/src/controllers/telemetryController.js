/**
 * telemetryController.js
 * Controller handling telemetry streams, latest observations, file archives, and row appending.
 */

import fs from 'fs';
import path from 'path';
import { sseBroadcaster } from '../services/sseBroadcaster.js';
import { fileWatcherService } from '../services/fileWatcherService.js';
import { dbClient } from '../../../database/dbClient.js';

export function streamTelemetry(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write(': connected to ERMS telemetry stream\n\n');

  // Immediately send current latest payload on connection
  const current = fileWatcherService.getLatestPayload();
  if (current) {
    res.write(`data: ${JSON.stringify(current)}\n\n`);
  }

  sseBroadcaster.addClient(res);

  req.on('close', () => {
    sseBroadcaster.removeClient(res);
  });
}

export function getLatestTelemetry(req, res) {
  const current = fileWatcherService.getLatestPayload();
  res.json({
    success: true,
    payload: current,
    timestamp: new Date().toISOString(),
  });
}

export function listTelemetryFiles(req, res) {
  try {
    const logsDir = fileWatcherService.getLogsDirectory();
    if (!fs.existsSync(logsDir)) {
      return res.json({ success: true, files: [] });
    }

    const files = fs.readdirSync(logsDir).filter((f) => {
      const l = f.toLowerCase();
      return (l.endsWith('.csv') || l.endsWith('.json')) && l !== 'readme.md';
    });

    const summaries = files.map((f) => {
      const fullPath = path.join(logsDir, f);
      const stats = fs.statSync(fullPath);
      return {
        filename: f,
        sizeBytes: stats.size,
        lastModified: stats.mtime.toISOString(),
      };
    });

    res.json({
      success: true,
      files: summaries,
      totalCount: summaries.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export function appendTelemetryRow(req, res) {
  try {
    const body = req.body;
    const logsDir = fileWatcherService.getLogsDirectory();
    const targetPath = path.join(logsDir, 'live_active_stream.csv');

    let rowLine = '';

    if (typeof body === 'object' && !Array.isArray(body)) {
      const headers = [
        'station_id', 'timestamp', 'latitude', 'longitude', 'zone',
        'elevation_m', 'surface_temp_c', 'relative_humidity_pct',
        'river_water_level_m', 'river_danger_level_m', 'river_discharge_cumecs',
        'aqi', 'pm2_5_ugm3', 'pm10_ugm3', 'seismic_mmi', 'rainfall_24h_mm',
        'soil_moisture_pct', 'pressure_hpa', 'wind_speed_kmh', 'wind_gust_kmh',
        'water_wqi', 'dissolved_oxygen_mg_l', 'bod_mg_l', 'so2_ugm3',
        'nox_ugm3', 'dart_wave_m', 'moraine_pressure_mpa',
        'slope_gradient_deg', 'pore_water_pressure_kpa', 'sediment_discharge_ppm',
        'soil_erosion_index', 'transboundary_origin'
      ];
      const vals = headers.map((h) => {
        const val = body[h] ?? null;
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val;
      });
      rowLine = `\n${vals.join(',')}`;

      // Also persist to database layer
      dbClient.insertTelemetry(body);
    } else if (typeof body === 'string') {
      rowLine = `\n${body.trim()}`;
    }

    fs.appendFileSync(targetPath, rowLine, 'utf-8');

    res.json({
      success: true,
      message: 'Telemetry successfully appended to live_active_stream.csv',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}
