/**
 * vitePluginSensorLogs.js
 * High-performance real-time filesystem watcher plugin for Vite.
 * Monitors the `sensor_logs/` directory for incoming telemetry logs (CSV/JSON),
 * parses observations, pushes updates over Vite's HMR WebSocket and SSE streams,
 * and enables instantaneous synchronization with the ERMS Machine Learning model and UI.
 */

import fs from 'fs';
import path from 'path';

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim().replace(/^"|"$/g, ''));
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim().replace(/^"|"$/g, ''));
  return result;
}

function parseCSVText(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
  );
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      const v = vals[idx];
      if (v === '' || v === 'null' || v === 'undefined' || v === 'N/A' || v === undefined) {
        obj[h] = null;
      } else if (!isNaN(v) && v.trim() !== '') {
        obj[h] = parseFloat(v);
      } else {
        obj[h] = v;
      }
    });
    rows.push(obj);
  }
  return rows;
}

function parseSensorFile(filePath, filename) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content || !content.trim()) return null;

    let rows = [];
    if (filename.toLowerCase().endsWith('.json')) {
      const parsed = JSON.parse(content);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } else if (filename.toLowerCase().endsWith('.csv')) {
      rows = parseCSVText(content);
    } else {
      return null;
    }

    if (rows.length === 0) return null;

    // Use latest row for instantaneous telemetry
    const latestRow = rows[rows.length - 1];
    const stats = fs.statSync(filePath);

    return {
      filename,
      filePath,
      recordCount: rows.length,
      latestRow,
      allRows: rows.slice(-50), // keep latest 50 for rapid inspection
      rawContent: content,
      lastModified: stats.mtime.toISOString(),
      sizeBytes: stats.size,
    };
  } catch (err) {
    console.warn(`[SensorLogsWatcher] Error parsing ${filename}:`, err.message);
    return null;
  }
}

export default function sensorLogWatcherPlugin() {
  const logsDir = path.resolve(process.cwd(), 'sensor_logs');
  let sseClients = new Set();
  let latestPayload = null;
  let debounceTimer = null;

  // Ensure sensor_logs directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Pre-load default active stream if available
  const defaultFile = path.join(logsDir, 'live_active_stream.csv');
  if (fs.existsSync(defaultFile)) {
    const parsed = parseSensorFile(defaultFile, 'live_active_stream.csv');
    if (parsed) {
      latestPayload = {
        type: 'sensor-log-stream-update',
        timestamp: new Date().toISOString(),
        source: 'init',
        ...parsed,
      };
    }
  }

  return {
    name: 'vite-plugin-sensor-logs-watcher',

    configureServer(server) {
      function broadcastUpdate(payload) {
        latestPayload = payload;

        // 1. Broadcast via Vite's HMR WebSocket directly to all connected browsers
        server.ws.send({
          type: 'custom',
          event: 'sensor-log-stream-update',
          data: payload,
        });

        // 2. Broadcast via Server-Sent Events (SSE)
        const sseData = `data: ${JSON.stringify(payload)}\n\n`;
        for (const client of sseClients) {
          try {
            client.write(sseData);
          } catch {
            sseClients.delete(client);
          }
        }
      }

      function handleFileEvent(filename) {
        if (!filename) return;
        const lower = filename.toLowerCase();
        if (!lower.endsWith('.csv') && !lower.endsWith('.json')) return;
        if (lower === 'readme.md') return;

        const fullPath = path.join(logsDir, filename);
        const parsed = parseSensorFile(fullPath, filename);
        if (!parsed) return;

        const payload = {
          type: 'sensor-log-stream-update',
          timestamp: new Date().toISOString(),
          source: 'fs-watch',
          ...parsed,
        };

        console.log(`[SensorLogsWatcher] Telemetry update detected: sensor_logs/${filename} (${parsed.recordCount} records)`);
        broadcastUpdate(payload);
      }

      // Start fs.watch on sensor_logs directory
      try {
        fs.watch(logsDir, (eventType, filename) => {
          if (!filename) return;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            handleFileEvent(filename);
          }, 60);
        });
        console.log(`[SensorLogsWatcher] Watching directory for live telemetry: ${logsDir}`);
      } catch (err) {
        console.error('[SensorLogsWatcher] Failed to initialize fs.watch:', err);
      }

      // REST & SSE Endpoints
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // 1. Server-Sent Events (SSE) Real-Time Stream
        if (url === '/api/sensor-logs/stream') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          res.write(': connected\n\n');

          // Send current state immediately on connect
          if (latestPayload) {
            res.write(`data: ${JSON.stringify(latestPayload)}\n\n`);
          }

          sseClients.add(res);

          req.on('close', () => {
            sseClients.delete(res);
          });
          return;
        }

        // 2. Get Latest Sensor Telemetry
        if (url === '/api/sensor-logs/latest') {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(JSON.stringify({ success: true, payload: latestPayload }));
          return;
        }

        // 3. List All Files in sensor_logs/
        if (url === '/api/sensor-logs/files') {
          try {
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
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(JSON.stringify({ success: true, files: summaries }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // 4. Append / Post Real-Time Sensor Telemetry
        if (url === '/api/sensor-logs/append' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const targetPath = path.join(logsDir, 'live_active_stream.csv');
              let rowLine = '';

              if (body.trim().startsWith('{')) {
                const json = JSON.parse(body);
                // Convert JSON to CSV row
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
                  const val = json[h] ?? json[h.replace(/_/g, '')] ?? null;
                  if (val === null || val === undefined) return '';
                  if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
                  return val;
                });
                rowLine = `\n${vals.join(',')}`;
              } else {
                rowLine = `\n${body.trim()}`;
              }

              fs.appendFileSync(targetPath, rowLine, 'utf-8');
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify({ success: true, message: 'Telemetry appended to live_active_stream.csv' }));
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}
