#!/usr/bin/env node
/**
 * sensor_logger_stream.js
 * Hardware & Field IoT Sensor Telemetry Simulator.
 * Appends live observation frames to `sensor_logs/live_active_stream.csv` to demonstrate
 * real-time synchronization with the ERMS Machine Learning Model, Map, and UI.
 *
 * Usage:
 *   node scripts/sensor_logger_stream.js                    # Stream continuously every 4 seconds
 *   node scripts/sensor_logger_stream.js --scenario=flood    # Inject single Silchar flood surge
 *   node scripts/sensor_logger_stream.js --scenario=aqi      # Inject single Delhi AQI spike
 *   node scripts/sensor_logger_stream.js --scenario=heat     # Inject single Churu Thar heat surge
 *   node scripts/sensor_logger_stream.js --scenario=emissions # Inject single Ankleshwar CEMS plume
 */

import fs from 'fs';
import path from 'path';

const logsDir = path.resolve(process.cwd(), 'sensor_logs');
const targetFile = path.join(logsDir, 'live_active_stream.csv');

// Sample field observation scenarios across India
const SCENARIOS = [
  {
    id: 'silchar_flood',
    label: 'CWC BARAK RIVER GAUGE // SILCHAR FLOOD SURGE',
    data: {
      station_id: 'NODE-SILCHA-4696',
      latitude: 24.8273,
      longitude: 92.7979,
      zone: 'BARAK VALLEY, ASSAM',
      elevation_m: 22,
      surface_temp_c: 26.2,
      relative_humidity_pct: 95.5,
      river_water_level_m: 20.42,
      river_danger_level_m: 19.83,
      river_discharge_cumecs: 3680.0,
      aqi: 78,
      pm2_5_ugm3: 42.0,
      pm10_ugm3: 84.0,
      seismic_mmi: 1.4,
      rainfall_24h_mm: 104.0,
      soil_moisture_pct: 99.0,
      pressure_hpa: 1008.2,
      wind_speed_kmh: 16.0,
      wind_gust_kmh: 24.0,
      water_wqi: 54,
      dissolved_oxygen_mg_l: 4.8,
      bod_mg_l: 4.6,
      so2_ugm3: 22.0,
      nox_ugm3: 34.0,
      dart_wave_m: 0.0,
      moraine_pressure_mpa: null,
    },
  },
  {
    id: 'delhi_aqi',
    label: 'CPCB ANAND VIHAR ATMOSPHERIC MONITOR // DELHI AQI SPIKE',
    data: {
      station_id: 'NODE-DELHI-CPCB-01',
      latitude: 28.6139,
      longitude: 77.2090,
      zone: 'NATIONAL CAPITAL REGION',
      elevation_m: 216,
      surface_temp_c: 32.8,
      relative_humidity_pct: 58.0,
      river_water_level_m: 204.1,
      river_danger_level_m: 205.33,
      river_discharge_cumecs: 1180.0,
      aqi: 412,
      pm2_5_ugm3: 285.0,
      pm10_ugm3: 440.0,
      seismic_mmi: 1.2,
      rainfall_24h_mm: 0.0,
      soil_moisture_pct: 28.0,
      pressure_hpa: 1007.4,
      wind_speed_kmh: 6.0,
      wind_gust_kmh: 9.0,
      water_wqi: 32,
      dissolved_oxygen_mg_l: 1.8,
      bod_mg_l: 18.2,
      so2_ugm3: 92.0,
      nox_ugm3: 135.0,
      dart_wave_m: 0.0,
      moraine_pressure_mpa: null,
    },
  },
  {
    id: 'ankleshwar_emissions',
    label: 'GPCB INDUSTRIAL CEMS SENSOR // CHEMICAL PLUME',
    data: {
      station_id: 'NODE-ANKLESH-3930',
      latitude: 21.6265,
      longitude: 73.0033,
      zone: 'CHEMICAL CORRIDOR, GUJARAT',
      elevation_m: 18,
      surface_temp_c: 35.2,
      relative_humidity_pct: 61.0,
      river_water_level_m: 5.4,
      river_danger_level_m: 8.5,
      river_discharge_cumecs: 430.0,
      aqi: 278,
      pm2_5_ugm3: 154.0,
      pm10_ugm3: 225.0,
      seismic_mmi: 1.1,
      rainfall_24h_mm: 0.0,
      soil_moisture_pct: 36.0,
      pressure_hpa: 1007.8,
      wind_speed_kmh: 18.0,
      wind_gust_kmh: 28.0,
      water_wqi: 38,
      dissolved_oxygen_mg_l: 2.8,
      bod_mg_l: 11.4,
      so2_ugm3: 158.0,
      nox_ugm3: 128.0,
      dart_wave_m: 0.0,
      moraine_pressure_mpa: null,
    },
  },
  {
    id: 'churu_heat',
    label: 'THAR ARID AWS SENSOR // 49.2°C HEAT SURGE',
    data: {
      station_id: 'NODE-CHURU-3310',
      latitude: 28.2900,
      longitude: 74.9600,
      zone: 'THAR DESERT, RAJASTHAN',
      elevation_m: 286,
      surface_temp_c: 49.2,
      relative_humidity_pct: 19.0,
      river_water_level_m: null,
      river_danger_level_m: null,
      river_discharge_cumecs: null,
      aqi: 158,
      pm2_5_ugm3: 74.0,
      pm10_ugm3: 210.0,
      seismic_mmi: 1.0,
      rainfall_24h_mm: 0.0,
      soil_moisture_pct: 9.0,
      pressure_hpa: 1001.2,
      wind_speed_kmh: 28.0,
      wind_gust_kmh: 44.0,
      water_wqi: 72,
      dissolved_oxygen_mg_l: 6.2,
      bod_mg_l: 2.2,
      so2_ugm3: 19.0,
      nox_ugm3: 26.0,
      dart_wave_m: 0.0,
      moraine_pressure_mpa: null,
    },
  },
  {
    id: 'sikkim_glof',
    label: 'SOUTH LHONAK CRYOSPHERE SENSOR // MORAINE RUPTURE RISK',
    data: {
      station_id: 'NODE-LHONAK-7371',
      latitude: 27.6042,
      longitude: 88.6475,
      zone: 'NORTH SIKKIM HIMALAYAS',
      elevation_m: 5200,
      surface_temp_c: 1.8,
      relative_humidity_pct: 92.0,
      river_water_level_m: 15.2,
      river_danger_level_m: 12.0,
      river_discharge_cumecs: 2150.0,
      aqi: 28,
      pm2_5_ugm3: 9.0,
      pm10_ugm3: 16.0,
      seismic_mmi: 3.6,
      rainfall_24h_mm: 62.0,
      soil_moisture_pct: 94.0,
      pressure_hpa: 538.0,
      wind_speed_kmh: 36.0,
      wind_gust_kmh: 62.0,
      water_wqi: 80,
      dissolved_oxygen_mg_l: 7.2,
      bod_mg_l: 1.6,
      so2_ugm3: 4.0,
      nox_ugm3: 6.0,
      dart_wave_m: 0.0,
      moraine_pressure_mpa: 3.12,
    },
  },
  {
    id: 'nepal_slope_flood',
    label: 'TRANSBOUNDARY NEPAL-BIHAR FOOTHILLS // KOSHI SLOPE FAILURE & SOIL QUALITY COLLAPSE',
    data: {
      station_id: 'NODE-NEPAL-KOSHI-01',
      latitude: 26.8500,
      longitude: 87.0500,
      zone: 'TRANSBOUNDARY NEPAL-BIHAR FOOTHILLS (KOSHI GORGE)',
      elevation_m: 420,
      surface_temp_c: 24.5,
      relative_humidity_pct: 96.5,
      river_water_level_m: 72.40,
      river_danger_level_m: 70.50,
      river_discharge_cumecs: 14800.0,
      aqi: 42,
      pm2_5_ugm3: 16.5,
      pm10_ugm3: 32.0,
      seismic_mmi: 2.1,
      rainfall_24h_mm: 185.0,
      soil_moisture_pct: 96.5,
      pressure_hpa: 965.0,
      wind_speed_kmh: 24.0,
      wind_gust_kmh: 38.0,
      water_wqi: 38,
      dissolved_oxygen_mg_l: 4.2,
      bod_mg_l: 6.8,
      so2_ugm3: 18.0,
      nox_ugm3: 26.0,
      dart_wave_m: 0.0,
      moraine_pressure_mpa: null,
      slope_gradient_deg: 44.5,
      pore_water_pressure_kpa: 88.5,
      sediment_discharge_ppm: 28400,
      soil_erosion_index: 8.9,
      transboundary_origin: 'Nepal Mahabharat Catchment / Saptakoshi Gorge',
    },
  },
];

const CSV_HEADERS = [
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

function formatCSVRow(dataObj) {
  const row = {
    ...dataObj,
    timestamp: new Date().toISOString(),
  };

  return CSV_HEADERS.map((h) => {
    const val = row[h];
    if (val === null || val === undefined) return '';
    if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }).join(',');
}

function ensureTargetFile() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  if (!fs.existsSync(targetFile)) {
    fs.writeFileSync(targetFile, `${CSV_HEADERS.join(',')}\n`, 'utf-8');
  }
}

function writeObservation(scenario) {
  ensureTargetFile();
  const line = formatCSVRow(scenario.data);
  fs.appendFileSync(targetFile, `${line}\n`, 'utf-8');

  const timeStr = new Date().toLocaleTimeString();
  console.log(`[${timeStr}] ⚡ Telemetry Written to sensor_logs/live_active_stream.csv`);
  console.log(`       Node: ${scenario.data.station_id} // ${scenario.label}`);
  console.log(`       GPS:  ${scenario.data.latitude}° N, ${scenario.data.longitude}° E`);
  console.log(`       Temp: ${scenario.data.surface_temp_c}°C | AQI: ${scenario.data.aqi} | Rainfall: ${scenario.data.rainfall_24h_mm}mm`);
  if (scenario.data.river_water_level_m) {
    console.log(`       River Level: ${scenario.data.river_water_level_m}m (Danger: ${scenario.data.river_danger_level_m}m)`);
  }
  console.log('------------------------------------------------------------');
}

// Check arguments
const args = process.argv.slice(2);
const scenarioArg = args.find((a) => a.startsWith('--scenario='));
const intervalArg = args.find((a) => a.startsWith('--interval='));

if (scenarioArg) {
  const key = scenarioArg.split('=')[1].toLowerCase();
  const found = SCENARIOS.find((s) => s.id === key) ||
    SCENARIOS.find((s) => s.id.startsWith(key)) ||
    SCENARIOS.find((s) => s.id.includes(key));
  const target = found || SCENARIOS[0];
  console.log(`\n=== INJECTING SINGLE OBSERVATION: ${target.label} ===`);
  writeObservation(target);
  process.exit(0);
}

// Continuous streaming loop
const intervalMs = intervalArg ? parseInt(intervalArg.split('=')[1], 10) : 4000;
let step = 0;

console.log('\n============================================================');
console.log('  ERMS REAL-TIME SENSOR TELEMETRY STREAMER');
console.log(`  Writing continuous updates to: ${targetFile}`);
console.log(`  Interval: ${intervalMs} ms (Press Ctrl+C to terminate)`);
console.log('============================================================\n');

// Initial write
writeObservation(SCENARIOS[0]);

setInterval(() => {
  step = (step + 1) % SCENARIOS.length;
  writeObservation(SCENARIOS[step]);
}, intervalMs);
