/** Watches the sensor logs directory for incoming hardware telemetry. */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sseBroadcaster } from './sseBroadcaster.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export function parseSensorFile(filePath, filename) {
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

    const latestRow = rows[rows.length - 1];
    const stats = fs.statSync(filePath);

    return {
      filename,
      filePath,
      recordCount: rows.length,
      latestRow,
      allRows: rows.slice(-50),
      rawContent: content,
      lastModified: stats.mtime.toISOString(),
      sizeBytes: stats.size,
    };
  } catch (err) {
    console.warn(`[FileWatcher] Error parsing ${filename}:`, err.message);
    return null;
  }
}

class FileWatcherService {
  constructor() {
    const candidates = [
      path.resolve(__dirname, '../../database/sensor_logs'),
      path.resolve(__dirname, '../../sensor_logs'),
      path.resolve(process.cwd(), 'database', 'sensor_logs'),
      path.resolve(process.cwd(), 'sensor_logs'),
    ];
    this.logsDir = candidates.find((d) => fs.existsSync(d)) || candidates[0];
    this.latestPayload = null;
    this.debounceTimer = null;
  }

  init() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
    } catch (e) {}

    // Pre-load default stream
    const defaultFile = path.join(this.logsDir, 'live_active_stream.csv');
    if (fs.existsSync(defaultFile)) {
      const parsed = parseSensorFile(defaultFile, 'live_active_stream.csv');
      if (parsed) {
        this.latestPayload = {
          type: 'sensor-log-stream-update',
          timestamp: new Date().toISOString(),
          source: 'init',
          ...parsed,
        };
      }
    }

    try {
      fs.watch(this.logsDir, (eventType, filename) => {
        if (!filename) return;
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.handleFileChange(filename);
        }, 60);
      });
      console.log(`[FileWatcher] Monitoring telemetry directory: ${this.logsDir}`);
    } catch (err) {
      console.error('[FileWatcher] Failed to start watcher:', err.message);
    }
  }

  handleFileChange(filename) {
    const lower = filename.toLowerCase();
    if (!lower.endsWith('.csv') && !lower.endsWith('.json')) return;
    if (lower === 'readme.md') return;

    const fullPath = path.join(this.logsDir, filename);
    const parsed = parseSensorFile(fullPath, filename);
    if (!parsed) return;

    const payload = {
      type: 'sensor-log-stream-update',
      timestamp: new Date().toISOString(),
      source: 'fs-watch',
      ...parsed,
    };

    this.latestPayload = payload;
    console.log(`[FileWatcher] Ingested update: ${filename} (${parsed.recordCount} rows)`);
    sseBroadcaster.broadcast(payload);
  }

  getLogsDirectory() {
    return this.logsDir;
  }

  getLatestPayload() {
    return this.latestPayload;
  }
}

export const fileWatcherService = new FileWatcherService();
export default fileWatcherService;
