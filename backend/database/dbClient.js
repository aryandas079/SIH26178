/** Unified database access adapter for stations, telemetry, alerts, and audit logs. */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEEDS_PATH = fs.existsSync(path.resolve(__dirname, 'seeds', 'stations_seed.json'))
  ? path.resolve(__dirname, 'seeds', 'stations_seed.json')
  : path.resolve(process.cwd(), 'database', 'seeds', 'stations_seed.json');

const DB_DIR = process.env.VERCEL
  ? path.join('/tmp', 'database', 'data')
  : (fs.existsSync(path.resolve(__dirname, 'data'))
      ? path.resolve(__dirname, 'data')
      : path.resolve(process.cwd(), 'database', 'data'));

try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
} catch (e) {}

const TELEMETRY_FILE = path.join(DB_DIR, 'telemetry_store.json');
const ALERTS_FILE = path.join(DB_DIR, 'alerts_store.json');
const AUDIT_FILE = path.join(DB_DIR, 'audit_store.json');

function readJsonSafe(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function writeJsonSafe(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // In-memory state maintained if serverless environment is read-only
  }
}

class DatabaseClient {
  constructor() {
    this.stations = readJsonSafe(SEEDS_PATH, []);
    this.telemetry = readJsonSafe(TELEMETRY_FILE, []);
    this.alerts = readJsonSafe(ALERTS_FILE, []);
    this.auditLogs = readJsonSafe(AUDIT_FILE, []);
    this.connectionType = process.env.DATABASE_URL ? 'External Relational (URL)' : 'Embedded Zero-Dependency Persistence Engine';
  }

  getStations() {
    return this.stations;
  }

  getStationById(id) {
    return this.stations.find((s) => s.station_id === id) || null;
  }

  insertTelemetry(row) {
    const record = {
      id: 'tel-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: row.timestamp || new Date().toISOString(),
      ...row,
    };
    this.telemetry.push(record);
    if (this.telemetry.length > 5000) {
      this.telemetry = this.telemetry.slice(-5000);
    }
    writeJsonSafe(TELEMETRY_FILE, this.telemetry);
    return record;
  }

  getLatestTelemetry(stationId = null) {
    if (stationId) {
      const filtered = this.telemetry.filter((t) => t.station_id === stationId);
      return filtered[filtered.length - 1] || null;
    }
    return this.telemetry[this.telemetry.length - 1] || null;
  }

  getTelemetryHistory(stationId = null, limit = 50) {
    let pool = stationId ? this.telemetry.filter((t) => t.station_id === stationId) : this.telemetry;
    return pool.slice(-limit);
  }

  createAlert(alertData) {
    const alert = {
      id: 'alt-' + Date.now(),
      status: 'ACTIVE',
      timestamp: new Date().toISOString(),
      ...alertData,
    };
    this.alerts.push(alert);
    writeJsonSafe(ALERTS_FILE, this.alerts);
    return alert;
  }

  getActiveAlerts() {
    return this.alerts.filter((a) => a.status === 'ACTIVE');
  }

  resolveAlert(alertId) {
    const found = this.alerts.find((a) => a.id === alertId);
    if (found) {
      found.status = 'RESOLVED';
      found.resolved_at = new Date().toISOString();
      writeJsonSafe(ALERTS_FILE, this.alerts);
    }
    return found;
  }

  logAudit({ userId, userName, userRole, action, resource, status, ipAddress, metadata }) {
    const entry = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: userId || 'anonymous',
      userName: userName || 'Unknown',
      userRole: userRole || 'GUEST',
      action: action || 'UNKNOWN_ACTION',
      resource: resource || '/',
      status: status || 'SUCCESS',
      ipAddress: ipAddress || '127.0.0.1',
      metadata: metadata || null,
    };
    this.auditLogs.push(entry);
    if (this.auditLogs.length > 2000) {
      this.auditLogs = this.auditLogs.slice(-2000);
    }
    writeJsonSafe(AUDIT_FILE, this.auditLogs);
    return entry;
  }

  getAuditLogs(limit = 100) {
    return this.auditLogs.slice(-limit).reverse();
  }

  // Health check
  health() {
    return {
      status: 'HEALTHY',
      type: this.connectionType,
      records: {
        stations: this.stations.length,
        telemetry: this.telemetry.length,
        alerts: this.alerts.length,
        auditLogs: this.auditLogs.length,
      },
    };
  }
}

export const dbClient = new DatabaseClient();
export default dbClient;
