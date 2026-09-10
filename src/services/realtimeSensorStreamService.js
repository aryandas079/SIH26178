/**
 * realtimeSensorStreamService.js
 * Client-side Real-Time Sensor Logs Stream Ingestion Service.
 * Listens to Vite HMR WebSocket updates, Server-Sent Events (SSE), and REST fallbacks
 * whenever any file in the `sensor_logs/` folder is added, modified, or appended to.
 * Normalizes raw hardware log observations into 12-channel physical telemetry
 * ready for the Machine Learning Anomaly Detection & Proximity Cascading Engine.
 */

import { mapRowToSensorReadings } from './sensorUploadService';

class RealtimeSensorStreamService {
  constructor() {
    this.subscribers = new Set();
    this.latestTelemetry = null;
    this.eventSource = null;
    this.pollingTimer = null;
    this.isInitialized = false;

    this.init();
  }

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Listen to Vite HMR WebSocket custom events (instantaneous zero-latency push)
    if (import.meta && import.meta.hot) {
      import.meta.hot.on('sensor-log-stream-update', (data) => {
        this.handleIncomingTelemetry(data, 'vite-hmr-ws');
      });
    }

    // 2. Connect to Server-Sent Events (SSE) stream endpoint
    this.connectSSE();

    // 3. Initial fetch of latest sensor log state
    this.fetchLatest();
  }

  connectSSE() {
    if (typeof window === 'undefined' || !window.EventSource) return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      const sse = new EventSource('/api/sensor-logs/stream');
      this.eventSource = sse;

      sse.onmessage = (event) => {
        if (!event.data) return;
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingTelemetry(data, 'sse-stream');
        } catch (err) {
          console.warn('[RealtimeSensorStream] SSE parse error:', err);
        }
      };

      sse.onerror = () => {
        // If SSE fails or reconnecting, fall back to lightweight periodic polling
        sse.close();
        this.eventSource = null;
        this.startFallbackPolling();
      };
    } catch {
      this.startFallbackPolling();
    }
  }

  startFallbackPolling() {
    if (this.pollingTimer) return;
    this.pollingTimer = setInterval(() => {
      this.fetchLatest();
    }, 3000);
  }

  async fetchLatest() {
    try {
      const res = await fetch('/api/sensor-logs/latest');
      if (!res.ok) return null;
      const json = await res.json();
      if (json && json.payload) {
        this.handleIncomingTelemetry(json.payload, 'rest-poll');
        return json.payload;
      }
    } catch {
      // Server may be starting or offline
    }
    return null;
  }

  handleIncomingTelemetry(rawPayload, transport = 'unknown') {
    if (!rawPayload || !rawPayload.latestRow) return;

    // Determine station name from filename or station_id
    const filename = rawPayload.filename || 'live_active_stream.csv';
    const stationId = rawPayload.latestRow.station_id || rawPayload.latestRow.station || 'FIELD-NODE';
    const baseName = filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').toUpperCase();

    // Normalize raw CSV/JSON row to standard 12-channel physical format
    const normalized = mapRowToSensorReadings(rawPayload.latestRow, baseName);

    // Build rich update package
    const telemetryPackage = {
      sourceFile: `sensor_logs/${filename}`,
      filename,
      stationId,
      transport,
      timestamp: rawPayload.timestamp || new Date().toISOString(),
      recordCount: rawPayload.recordCount || 1,
      lastModified: rawPayload.lastModified,
      metadata: {
        ...normalized.metadata,
        stationId,
        sourceFile: filename,
      },
      readings: normalized.readings,
      rawRow: rawPayload.latestRow,
    };

    // Prevent redundant notifications if timestamp and readings are identical
    if (
      this.latestTelemetry &&
      this.latestTelemetry.filename === filename &&
      this.latestTelemetry.lastModified === rawPayload.lastModified &&
      this.latestTelemetry.recordCount === rawPayload.recordCount
    ) {
      return;
    }

    this.latestTelemetry = telemetryPackage;

    console.log('[RealtimeSensorStream] Dispatching telemetry to subscribers:', {
      filename,
      stationId,
      transport,
      subscribersCount: this.subscribers.size,
    });

    // Notify all active subscribers
    for (const callback of this.subscribers) {
      try {
        callback(telemetryPackage);
      } catch (err) {
        console.error('[RealtimeSensorStream] Error in subscriber callback:', err);
      }
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);

    // Immediately replay latest telemetry if already cached
    if (this.latestTelemetry) {
      try {
        callback(this.latestTelemetry);
      } catch (err) {
        console.error('[RealtimeSensorStream] Error in initial subscriber callback:', err);
      }
    }

    return () => {
      this.subscribers.delete(callback);
    };
  }

  async listFiles() {
    try {
      const res = await fetch('/api/sensor-logs/files');
      if (!res.ok) return [];
      const json = await res.json();
      return json.files || [];
    } catch (err) {
      console.warn('[RealtimeSensorStream] Failed to list log files:', err);
      return [];
    }
  }

  async appendTelemetryRow(rowObject) {
    try {
      const res = await fetch('/api/sensor-logs/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowObject),
      });
      return await res.json();
    } catch (err) {
      console.error('[RealtimeSensorStream] Failed to append telemetry row:', err);
      return { success: false, error: err.message };
    }
  }
}

export const realtimeSensorStreamService = new RealtimeSensorStreamService();
export default realtimeSensorStreamService;
