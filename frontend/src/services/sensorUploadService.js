/**
 * ERMS Sensor Dataset Upload & Real-Time Parser Service
 * Allows field engineers and sensors to upload custom CSV / JSON telemetry files.
 * Automatically extracts geodetic GPS hook, hardware metadata, and maps readings
 * across all 12 physical telemetry channels for instant ML anomaly detection.
 */

import { uploadedTelemetryStore } from '../utils/spatialMlPredictionEngine';

// Sample pre-calibrated sensor test datasets for instant evaluation
export const SAMPLE_SENSOR_DATASETS = [
  {
    id: 'sample-flood-silchar',
    label: 'BARAK RIVER HYDROLOGICAL SENSOR (SILCHAR)',
    filename: 'silchar_barak_gauge_telemetry.csv',
    content: `station_id,timestamp,latitude,longitude,zone,elevation_m,surface_temp_c,relative_humidity_pct,river_water_level_m,river_danger_level_m,river_discharge_cumecs,aqi,pm2_5_ugm3,pm10_ugm3,seismic_mmi,rainfall_24h_mm,soil_moisture_pct,pressure_hpa,wind_speed_kmh,wind_gust_kmh,water_wqi,dissolved_oxygen_mg_l,bod_mg_l,so2_ugm3,nox_ugm3,dart_wave_m,moraine_pressure_mpa
NODE-SILCHA-4696,2026-09-09T01:45:00Z,24.8273,92.7979,"BARAK VALLEY, ASSAM",22,26.0,95.0,20.25,19.83,3420.0,94,54.5,98.7,1.4,84.0,98.0,1011.0,12.0,17.0,60,5.4,3.8,28.5,42.0,0.0,null`,
  },
  {
    id: 'sample-emissions-ankleshwar',
    label: 'ANKLESHWAR PETROCHEMICAL CEMS SENSOR',
    filename: 'ankleshwar_cems_stack_telemetry.csv',
    content: `station_id,timestamp,latitude,longitude,zone,elevation_m,surface_temp_c,relative_humidity_pct,river_water_level_m,river_danger_level_m,river_discharge_cumecs,aqi,pm2_5_ugm3,pm10_ugm3,seismic_mmi,rainfall_24h_mm,soil_moisture_pct,pressure_hpa,wind_speed_kmh,wind_gust_kmh,water_wqi,dissolved_oxygen_mg_l,bod_mg_l,so2_ugm3,nox_ugm3,stack_opacity_pct,voc_ppm
NODE-ANKLESH-3930,2026-09-09T01:50:00Z,21.6265,73.0033,"CHEMICAL CORRIDOR, GUJARAT",18,34.5,62.0,5.2,8.5,420.0,265,142.0,210.0,1.2,0.0,38.0,1008.0,16.0,24.0,42,3.2,9.8,142.0,116.0,38.5,8.4`,
  },
  {
    id: 'sample-water-kanpur',
    label: 'GANGA BASIN NWMP WATER QUALITY BUOY',
    filename: 'kanpur_ganga_water_telemetry.csv',
    content: `station_id,timestamp,latitude,longitude,zone,elevation_m,surface_temp_c,relative_humidity_pct,river_water_level_m,river_danger_level_m,river_discharge_cumecs,aqi,pm2_5_ugm3,pm10_ugm3,seismic_mmi,rainfall_24h_mm,soil_moisture_pct,pressure_hpa,wind_speed_kmh,wind_gust_kmh,water_wqi,dissolved_oxygen_mg_l,bod_mg_l,so2_ugm3,nox_ugm3,tds_ppm,turbidity_ntu,fecal_coliform_mpn
NODE-KANPUR-2081,2026-09-09T01:40:00Z,26.4499,80.3319,"GANGETIC INDUSTRIAL BELT, UP",126,29.0,74.0,112.4,114.0,1650.0,195,98.0,165.0,1.1,12.0,65.0,1010.0,9.0,14.0,28,1.6,22.4,54.0,68.0,1450,34.0,68000`,
  },
  {
    id: 'sample-heat-churu',
    label: 'THAR ARID AUTOMATIC WEATHER STATION',
    filename: 'churu_desert_aws_telemetry.csv',
    content: `station_id,timestamp,latitude,longitude,zone,elevation_m,surface_temp_c,relative_humidity_pct,river_water_level_m,river_danger_level_m,river_discharge_cumecs,aqi,pm2_5_ugm3,pm10_ugm3,seismic_mmi,rainfall_24h_mm,soil_moisture_pct,pressure_hpa,wind_speed_kmh,wind_gust_kmh,water_wqi,dissolved_oxygen_mg_l,bod_mg_l,so2_ugm3,nox_ugm3,heat_index_c,wet_bulb_c
NODE-CHURU-3310,2026-09-09T01:30:00Z,28.2900,74.9600,"THAR DESERT, RAJASTHAN",286,48.6,22.0,null,null,null,145,68.0,185.0,1.0,0.0,12.0,1002.0,24.0,38.0,75,6.5,2.0,18.0,24.0,56.4,32.2`,
  },
  {
    id: 'sample-glof-sikkim',
    label: 'SOUTH LHONAK CRYOSPHERE SENSOR ARRAY',
    filename: 'lhonak_cryosphere_telemetry.csv',
    content: `station_id,timestamp,latitude,longitude,zone,elevation_m,surface_temp_c,relative_humidity_pct,river_water_level_m,river_danger_level_m,river_discharge_cumecs,aqi,pm2_5_ugm3,pm10_ugm3,seismic_mmi,rainfall_24h_mm,soil_moisture_pct,pressure_hpa,wind_speed_kmh,wind_gust_kmh,water_wqi,dissolved_oxygen_mg_l,bod_mg_l,moraine_pressure_mpa,lake_expansion_pct,ice_core_temp_c
NODE-LHONAK-7371,2026-09-09T01:35:00Z,27.6042,88.6475,"NORTH SIKKIM HIMALAYAS",5200,1.2,88.0,14.5,12.0,1850.0,24,8.0,14.0,3.4,48.0,92.0,540.0,32.0,55.0,82,7.4,1.4,2.85,42.0,1.2`,
  },
  {
    id: 'sample-transboundary-koshi',
    label: 'TRANSBOUNDARY NEPAL-BIHAR KOSHI SLOPE & SOIL SENSOR',
    filename: 'nepal_border_koshi_slope_telemetry.csv',
    content: `station_id,timestamp,latitude,longitude,zone,elevation_m,surface_temp_c,relative_humidity_pct,river_water_level_m,river_danger_level_m,river_discharge_cumecs,aqi,pm2_5_ugm3,pm10_ugm3,seismic_mmi,rainfall_24h_mm,soil_moisture_pct,pressure_hpa,wind_speed_kmh,wind_gust_kmh,water_wqi,dissolved_oxygen_mg_l,bod_mg_l,slope_gradient_deg,pore_water_pressure_kpa,sediment_discharge_ppm,soil_erosion_index,transboundary_origin
NODE-NEPAL-KOSHI-01,2026-09-10T02:00:00Z,26.8500,87.0500,"TRANSBOUNDARY NEPAL-BIHAR FOOTHILLS",420,24.5,96.5,72.4,70.5,14800.0,45,18.0,34.0,2.1,185.0,96.5,965.0,22.0,36.0,42,4.8,6.2,44.5,88.5,28400,8.9,"Nepal Mahabharat Catchment / Saptakoshi Gorge"`,
  },
];

/**
 * Parses CSV text into an array of objects
 */
export function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file must contain a header line and at least one data row.');
  }

  const parseLine = (line) => {
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
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      const v = vals[idx];
      if (v === '' || v === 'null' || v === 'undefined' || v === 'N/A') {
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

/**
 * Maps arbitrary parsed sensor row into the standard 12-channel physical telemetry format
 */
export function mapRowToSensorReadings(row, baseLocationName = 'UPLOADED SENSOR STATION') {
  const findVal = (...keys) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null) return row[k];
      const match = Object.keys(row).find((rk) => rk.includes(k));
      if (match && row[match] !== undefined && row[match] !== null) return row[match];
    }
    return null;
  };

  const lat = parseFloat(findVal('lat', 'latitude') ?? 24.8273);
  const lng = parseFloat(findVal('lng', 'longitude', 'lon') ?? 92.7979);
  const tempC = parseFloat(findVal('temp', 'surface_temp', 'surface_temp_c', 'temperature') ?? 26.0);
  const humidityPct = parseFloat(findVal('humidity', 'relative_humidity', 'relative_humidity_pct') ?? 95.0);
  const rainfall24hMm = parseFloat(findVal('rainfall', 'rainfall_24h', 'rainfall_24h_mm', 'precipitation') ?? 84.0);
  const aqi = parseInt(findVal('aqi', 'us_aqi') ?? 94, 10);
  const pm25 = parseFloat(findVal('pm2_5', 'pm25', 'pm2_5_ugm3') ?? Math.round(aqi * 0.58 * 10) / 10);
  const pm10 = parseFloat(findVal('pm10', 'pm10_ugm3') ?? Math.round(aqi * 1.05 * 10) / 10);
  const pressureHpa = parseFloat(findVal('pressure', 'pressure_hpa', 'surface_pressure') ?? 1011.0);
  const windSpeedKmh = parseFloat(findVal('wind_speed', 'wind_speed_kmh', 'wind') ?? 12.0);
  const windGustKmh = parseFloat(findVal('wind_gust', 'wind_gust_kmh', 'gusts') ?? Math.round(windSpeedKmh * 1.4));
  const seismicMmi = parseFloat(findVal('seismic', 'seismic_mmi', 'mmi') ?? 1.4);
  const soilMoisturePct = parseFloat(findVal('soil_moisture', 'soil_moisture_pct') ?? 98.0);
  const wqiScore = parseInt(findVal('wqi', 'water_wqi', 'water_quality_index') ?? 60, 10);
  const dissolvedOxygenMgL = parseFloat(findVal('dissolved_oxygen', 'dissolved_oxygen_mg_l', 'do') ?? 5.4);
  const bodMgL = parseFloat(findVal('bod', 'bod_mg_l') ?? 3.8);
  const so2Ugm3 = parseFloat(findVal('so2', 'so2_ugm3', 'stack_so2') ?? 28.5);
  const noxUgm3 = parseFloat(findVal('nox', 'nox_ugm3', 'stack_nox') ?? 42.0);
  const vocPpm = parseFloat(findVal('voc', 'voc_ppm', 'voc_level_ppm') ?? 1.4);
  const stackOpacityPct = parseFloat(findVal('stack_opacity', 'stack_opacity_pct', 'opacity') ?? 14.2);
  const morainePressureMpa = findVal('moraine_pressure', 'moraine_pressure_mpa', 'moraine') !== null ? parseFloat(findVal('moraine_pressure', 'moraine_pressure_mpa', 'moraine')) : null;
  const lakeExpansionPct = findVal('lake_expansion', 'lake_expansion_pct') !== null ? parseFloat(findVal('lake_expansion', 'lake_expansion_pct')) : null;
  const dartWaveAmplitudeM = parseFloat(findVal('dart', 'dart_wave_m', 'wave_amplitude') ?? 0.0);
  const stormSurgeM = parseFloat(findVal('storm_surge', 'surge', 'storm_surge_m') ?? 0.3);

  // River telemetry
  const waterLvl = findVal('river_water_level_m', 'water_level', 'river_gauge_telemetry') !== null ? parseFloat(findVal('river_water_level_m', 'water_level', 'river_gauge_telemetry')) : 20.25;
  const dangerLvl = findVal('river_danger_level_m', 'danger_level') !== null ? parseFloat(findVal('river_danger_level_m', 'danger_level')) : 19.83;
  const discharge = findVal('river_discharge_cumecs', 'discharge', 'discharge_cumecs') !== null ? parseFloat(findVal('river_discharge_cumecs', 'discharge', 'discharge_cumecs')) : 3420.0;
  
  const rawRiver = row['river_name'] ?? row['river'] ?? row['basin_river'];
  const riverName = typeof rawRiver === 'string' && isNaN(rawRiver) && rawRiver.trim().length > 0
    ? rawRiver.trim()
    : (typeof baseLocationName === 'string' && baseLocationName.toUpperCase().includes('SILCHAR') ? 'Barak' : 'Barak');

  const diff = Math.round((waterLvl - dangerLvl) * 100) / 100;
  const ratio = Math.round((waterLvl / dangerLvl) * 100) / 100;

  const heatIndex = Math.round((tempC + (humidityPct > 60 ? (humidityPct - 60) * 0.22 : 0)) * 10) / 10;
  const wetBulb = Math.round((tempC * Math.atan(0.151977 * Math.pow(humidityPct + 8.313659, 0.5)) + Math.atan(tempC + humidityPct) - Math.atan(humidityPct - 1.676331) + 0.00391838 * Math.pow(humidityPct, 1.5) * Math.atan(0.023101 * humidityPct) - 4.686035) * 10) / 10;

  const stationId = findVal('station_id', 'station', 'node_id', 'id') ?? `NODE-${baseLocationName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}-${Math.abs(Math.round(lat * 100 + lng * 100))}`;
  const zone = findVal('zone', 'topographical_zone', 'region') ?? 'BARAK VALLEY, ASSAM';
  const elevation = findVal('elevation_m', 'elevation') ? `${findVal('elevation_m', 'elevation')} m` : '22 m';

  return {
    metadata: {
      stationId,
      stationName: baseLocationName,
      lat,
      lng,
      zone,
      elevation,
      timestamp: findVal('timestamp', 'date') ?? new Date().toISOString(),
    },
    readings: {
      locationName: baseLocationName,
      lat,
      lng,
      tempC,
      heatIndexC: heatIndex,
      wetBulbC: wetBulb,
      humidityPct,
      dewPointC: Math.round((tempC - (100 - humidityPct) / 5) * 10) / 10,
      rainfall24hMm,
      windSpeedKmh,
      windGustKmh,
      surfacePressureHpa: pressureHpa,
      soilMoisturePct,
      aqi,
      pm25Ugm3: pm25,
      pm10Ugm3: pm10,
      dominantPollutant: pm25 > 60 ? 'PM2.5' : 'NO2',
      seismicZone: lat > 27 ? 'Zone V (Severe)' : 'Zone II (Low)',
      seismicMmi,
      focalDepthKm: 35.0,
      wqiScore,
      dissolvedOxygenMgL,
      waterPh: 7.4,
      bodMgL,
      tdsPpm: parseFloat(findVal('tds_ppm') ?? 480),
      turbidityNtu: parseFloat(findVal('turbidity_ntu') ?? 6.5),
      fecalColiformMpn: parseInt(findVal('fecal_coliform_mpn') ?? 850, 10),
      so2Ugm3,
      noxUgm3,
      vocPpm,
      stackOpacityPct,
      co2FluxPpm: 435.0,
      morainePressureMpa,
      lakeExpansionPct,
      iceCoreTempC: findVal('ice_core_temp_c') !== null ? parseFloat(findVal('ice_core_temp_c')) : null,
      permafrostThawRateCmMo: morainePressureMpa ? 3.8 : null,
      liquefactionFactor: morainePressureMpa ? 0.72 : null,
      dartWaveAmplitudeM,
      bottomPressureDeltaKpa: dartWaveAmplitudeM > 0.3 ? 6.2 : 0.0,
      coastalRunupM: dartWaveAmplitudeM > 0.3 ? 3.4 : 0.2,
      seismicMomentMw: 5.4,
      tsunamiEtaMin: dartWaveAmplitudeM > 0.3 ? 45 : 0,
      centralPressureHpa: pressureHpa < 990 ? pressureHpa : 1011.0,
      maxWindKmh: windSpeedKmh,
      stormSurgeM,
      cycloneCategory: windSpeedKmh >= 118 ? 'VERY SEVERE CYCLONIC STORM' : (windSpeedKmh >= 62 ? 'CYCLONIC STORM' : 'NOMINAL SYNOPTIC FLOW'),
      vorticityIndex: windSpeedKmh >= 62 ? 6.5 : 1.5,
      multiHazardStressIndex: Math.round((0.25 + (diff > 0 ? 0.35 : 0) + (aqi > 200 ? 0.25 : 0)) * 100) / 100,
      lightningDensitySqkm: 12.0,
      chemicalVaporPpm: vocPpm,
      pluvialDepthM: rainfall24hMm > 70 ? 0.42 : 0.02,
      // Transboundary Nepal-Himalayan Slope & Soil Degradation Physics
      slopeGradientDeg: parseFloat(findVal('slope_gradient_deg', 'slope_gradient', 'slope_degrees', 'slope') ?? (lat > 26.5 ? 44.5 : 18.0)),
      poreWaterPressureKpa: parseFloat(findVal('pore_water_pressure_kpa', 'pore_water_pressure', 'pore_pressure', 'pwp') ?? (soilMoisturePct > 85 ? Math.round((soilMoisturePct - 50) * 1.8 * 10) / 10 : 28.0)),
      effectiveShearStrengthKpa: parseFloat(findVal('effective_shear_strength_kpa', 'shear_strength', 'shear_kpa') ?? Math.max(6.0, Math.round((45.0 + (100.0 - (soilMoisturePct > 85 ? (soilMoisturePct - 50) * 1.8 : 28.0)) * 0.45) * 10) / 10)),
      soilErosionIndex: parseFloat(findVal('soil_erosion_index', 'soil_erosion', 'topsoil_loss') ?? (soilMoisturePct > 88 ? 8.9 : 3.2)),
      sedimentDischargePpm: parseFloat(findVal('sediment_discharge_ppm', 'sediment_ppm', 'silt_ppm', 'sediment') ?? (soilMoisturePct > 88 ? 28400 : 3500)),
      sandSplayHazardAreaHa: parseFloat(findVal('sand_splay_hazard_area_ha', 'sand_splay_area', 'sand_splay_ha') ?? 18400),
      transboundaryRiskOrigin: findVal('transboundary_origin', 'country_origin', 'origin_catchment') ?? (lat > 26.0 && lng > 83.5 && lng < 89.0 ? 'Nepal Mahabharat Catchment / Saptakoshi-Gandak Arc' : null),
      river: {
        riverName,
        basin: `${riverName} Basin`,
        gaugeStation: `${stationId} Hydrometric Station`,
        waterLevelM: waterLvl,
        dangerLevelM: dangerLvl,
        highestFloodLevelM: dangerLvl + 1.2,
        levelAboveDangerM: diff,
        waterLevelRatio: ratio,
        dischargeCumecs: discharge,
        criticalDischargeCumecs: 3200,
        trend: diff > 0 ? `Rising (+${Math.round(diff * 10)} cm/hr)` : 'Steady',
        distanceToRiverKm: 0.5,
        historicalEvents: 373,
      },
    },
  };
}

/**
 * Handles uploaded sensor File (CSV or JSON)
 */
export async function parseUploadedSensorFile(file) {
  const text = await file.text();
  const filename = file.name.toLowerCase();

  let rows = [];
  if (filename.endsWith('.json')) {
    const parsed = JSON.parse(text);
    rows = Array.isArray(parsed) ? parsed : [parsed];
  } else {
    rows = parseCSV(text);
  }

  if (rows.length === 0) {
    throw new Error('No valid records found in the uploaded sensor file.');
  }

  const primaryRow = rows[0];
  const stationName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
  const mapped = mapRowToSensorReadings(primaryRow, stationName);

  // Register all parsed points into the spatial ML model's dynamic telemetry store
  const allMappedPoints = rows.map((r) => {
    try {
      const m = mapRowToSensorReadings(r, stationName);
      return {
        lat: m.metadata.lat,
        lng: m.metadata.lng,
        stationName: m.metadata.stationName,
        readings: m.readings,
      };
    } catch {
      return null;
    }
  }).filter(Boolean);

  uploadedTelemetryStore.registerPoints(allMappedPoints);

  return {
    filename: file.name,
    recordCount: rows.length,
    rawRecords: rows,
    metadata: mapped.metadata,
    readings: mapped.readings,
  };
}
