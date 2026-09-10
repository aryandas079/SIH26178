import React from 'react';
import anomalyModel from '../data/hazardAnomalyModel.json';

/** Environmental analytics and ML diagnostics radar across hazard topics. */

export default function TopicAnalyticsRadar({
  activeHazardId,
  onSelectHazard,
  selectedHazards,
  sensorReadings,
  anomalyEval,
  cascadingPrediction,
  onTriggerScenario,
}) {
  if (!sensorReadings) return null;

  // Normalize hazard ID (e.g. 'emissions', 'water', 'glacial', 'tsunami', 'cyclone', 'other', 'flood', etc.)
  const currentHazard = (activeHazardId || 'emissions').toLowerCase();
  const hazardKeyMap = {
    emissions: 'emissions',
    water: 'water',
    glacial: 'glacial',
    tsunami: 'tsunami',
    cyclone: 'cyclone',
    other: 'other',
    flood: 'flood',
    heat: 'heat',
    aqi: 'aqi',
    earthquakes: 'earthquake',
    earthquake: 'earthquake',
    landslides: 'landslide',
    landslide: 'landslide',
    fires: 'fires',
  };
  const activeModelKey = hazardKeyMap[currentHazard] || 'emissions';
  const activeHazardModel = anomalyModel?.hazard_models?.[activeModelKey];

  // Topic Metadata & Regulatory Agency specifications
  const TOPIC_CONFIGS = {
    emissions: {
      num: '07',
      name: 'INDUSTRIAL EMISSIONS',
      color: '#64748b',
      agency: 'CPCB / MoEFCC CONTINUOUS EMISSION MONITORING SYSTEM (CEMS)',
      desc: 'Flue-gas sulfur dioxide, nitrogen oxides, volatile organics & refractory stack opacity across Indian petrochemical and metallurgical clusters.',
      scenarioKey: 'emissions',
      historicalTotal: '842 CPCB Non-Attainment Events',
      peakWindow: 'Winter Inversion (Nov - Feb)',
      criticalStandard: 'SO₂ > 80 µg/m³ | Opacity > 25%',
      sop: 'CPCB GRAP STAGE-IV / MANDATORY INDUSTRIAL SCRUBBER OVERDRIVE',
    },
    water: {
      num: '08',
      name: 'WATER QUALITY',
      color: '#06b6d4',
      agency: 'CPCB NATIONAL WATER QUALITY MONITORING PROGRAMME (NWMP)',
      desc: 'Aquatic dissolved oxygen depletion, biochemical oxygen demand, fecal coliform & industrial heavy metal effluent across monitored river reaches.',
      scenarioKey: 'water',
      historicalTotal: '1,240 Critical Anoxia Reaches',
      peakWindow: 'Pre-Monsoon Lean Flow (Apr - Jun)',
      criticalStandard: 'DO < 4.0 mg/L | BOD > 8.0 mg/L',
      sop: 'NATIONAL RIVER CONSERVATION PLAN (NRCP) EMERGENCY INTERCEPTION',
    },
    glacial: {
      num: '09',
      name: 'GLACIAL LIQUEFACTION & GLOF',
      color: '#0284c7',
      agency: 'SAC (ISRO) & NCPOR HIMALAYAN CRYOSPHERE SURVEY',
      desc: 'High-altitude moraine dam hydrostatic load, supraglacial lake volumetric expansion & thermokarst liquefaction risk across the Indian Himalayas.',
      scenarioKey: 'glacial',
      historicalTotal: '28 Major Himalayan Outbursts',
      peakWindow: 'Summer Cryosphere Ablation (Jul - Sep)',
      criticalStandard: 'Hydrostatic Load > 2.2 MPa | Lake Δ > 30%',
      sop: 'NDMA HIGH-ALTITUDE GLOF SIPHONING & VALLEY EVACUATION DIRECTIVE',
    },
    tsunami: {
      num: '10',
      name: 'TSUNAMI SURGE',
      color: '#0f766e',
      agency: 'INCOIS INDIAN OCEAN TSUNAMI EARLY WARNING SYSTEM (ITEWS)',
      desc: 'Deep-ocean DART bottom pressure transducer anomalies, coastal runup projection & subduction megathrust wave kinematics.',
      scenarioKey: 'tsunami',
      historicalTotal: '14 Deep Ocean ITEWS Bulletins',
      peakWindow: 'Subduction Fault Ruptures (Perennial)',
      criticalStandard: 'DART Wave > 0.40m | Runup > 2.0m',
      sop: 'INCOIS RED TSUNAMI WARNING / COASTAL 1.5KM EXCLUSION ZONE',
    },
    cyclone: {
      num: '11',
      name: 'CYCLONE & STORM SURGE',
      color: '#ec4899',
      agency: 'IMD REGIONAL SPECIALIZED METEOROLOGICAL CENTRE (RSMC)',
      desc: 'Tropical cyclonic vortex barometric pressure depression, sustained eyewall gale vectors & astronomical storm surge inundation.',
      scenarioKey: 'cyclone',
      historicalTotal: '146 Bay of Bengal & Arabian Sea Landfalls',
      peakWindow: 'Post-Monsoon Peak (Oct - Dec)',
      criticalStandard: 'Pressure < 980 hPa | Wind > 62 km/h | Surge > 2.5m',
      sop: 'IMD STAGE-IV LANDFALL RED ALERT / PRE-POSITIONING OF NDRF BATTALIONS',
    },
    other: {
      num: '12',
      name: 'OTHER HAZARDS (MULTI-HAZARD)',
      color: '#d97706',
      agency: 'NATIONAL DISASTER MANAGEMENT AUTHORITY (NDMA) INTEGRATED GRID',
      desc: 'Compound multi-hazard stress index, severe convective lightning downbursts, toxic vapor Hazmat perimeters & pluvial flash drainage failure.',
      scenarioKey: 'other',
      historicalTotal: '2,890 Compound Multi-Risk Incidents',
      peakWindow: 'Pre-Monsoon Convective & Cloudburst Season',
      criticalStandard: 'Multi-Hazard Index > 0.65 | Lightning > 12/km²',
      sop: 'NDMA MULTI-AGENCY INCIDENT COMMAND SYSTEM (ICS) LEVEL-3',
    },
    flood: {
      num: '01',
      name: 'FLOOD',
      color: '#2563eb',
      agency: 'CENTRAL WATER COMMISSION (CWC) & NIH ROORKEE',
      desc: 'High-precision riverbed overtopping, catchment precipitation saturation, discharge surge & downstream hydraulic floodplains.',
      scenarioKey: 'silchar_flood',
      historicalTotal: '3,840 Monitored River Basin Floods',
      peakWindow: 'Southwest Monsoon (Jun - Sep)',
      criticalStandard: 'Water Level > Danger Mark | Discharge > Critical',
      sop: 'CWC HYDROLOGICAL FLASH INUNDATION SOP & EMBANKMENT SURVEILLANCE',
    },
    heat: {
      num: '06',
      name: 'EXTREME HEAT',
      color: '#ef4444',
      agency: 'INDIA METEOROLOGICAL DEPARTMENT (IMD) SYNOPTIC THERMAL DIVISION',
      desc: 'Synoptic anti-cyclonic continental subsidence, wet-bulb physiological threshold & urban heat island thermal radiance.',
      scenarioKey: 'heatwave',
      historicalTotal: '1,920 Severe Heatwave Spells',
      peakWindow: 'Summer Pre-Monsoon (Apr - Jun)',
      criticalStandard: 'Temp > 42.5°C | Heat Index > 48°C',
      sop: 'IMD HEAT ACTION PLAN (HAP) RED ALERT & COOL ROOF DIRECTIVE',
    },
    aqi: {
      num: '02',
      name: 'HAZARDOUS AQI',
      color: '#9333ea',
      agency: 'CPCB / SAMEER NATIONAL AMBIENT AIR QUALITY MONITORING',
      desc: 'Toxic fine particulate PM2.5/PM10 concentration, boundary layer thermal inversion & transboundary aerosol dispersion.',
      scenarioKey: 'auto',
      historicalTotal: '2,400 Severe Air Emergencies',
      peakWindow: 'Winter Stagnation & Crop Burning (Oct - Jan)',
      criticalStandard: 'AQI > 250 | PM2.5 > 120 µg/m³',
      sop: 'GRAP STAGE-IV EMERGENCY BAN ON DIESEL TRUCKS & CONSTRUCTION',
    },
    earthquakes: {
      num: '04',
      name: 'EARTHQUAKES',
      color: '#dc2626',
      agency: 'NATIONAL CENTER FOR SEISMOLOGY (NCS) / MOES',
      desc: 'Bureau of Indian Standards BIS IS 1893 seismic zonation, tectonic fault slip, focal depth & modified Mercalli intensity.',
      scenarioKey: 'nominal',
      historicalTotal: '1,560 Significant Seismic Events',
      peakWindow: 'Perennial Tectonic Compression',
      criticalStandard: 'Magnitude > M4.5 | MMI > V',
      sop: 'NDMA RAPID SEISMIC SEARCH & RESCUE MOBILIZATION PROTOCOL',
    },
    landslides: {
      num: '05',
      name: 'LANDSLIDES',
      color: '#92400e',
      agency: 'GEOLOGICAL SURVEY OF INDIA (GSI) NATIONAL MAPPING (NLSM)',
      desc: 'High slope instability, sheared regolith pore water pressure & monsoon debris runout corridors across Himalayas & Western Ghats.',
      scenarioKey: 'nominal',
      historicalTotal: '4,100 Slope Failure Incidents',
      peakWindow: 'Monsoon Saturation (Jul - Sep)',
      criticalStandard: 'Rainfall Saturation > 100mm/24h',
      sop: 'GSI EARLY SLOPE EVACUATION & DEBRIS FLOW RETENTION BARRIERS',
    },
    fires: {
      num: '03',
      name: 'FOREST FIRES',
      color: '#f97316',
      agency: 'FOREST SURVEY OF INDIA (FSI) VAN AGNI SATELLITE SYSTEM',
      desc: 'Biomass dryness index, thermal anomalies in pine/dry deciduous forests & wildfire perimeter propagation.',
      scenarioKey: 'nominal',
      historicalTotal: '3,200 Forest Fire Alerts',
      peakWindow: 'Dry Spring (Feb - May)',
      criticalStandard: 'Forest Fire Danger Index > High',
      sop: 'FSI AIR TANKER WATER BOMBING & WILDFIRE CONTROL CREWS',
    }
  };

  const config = TOPIC_CONFIGS[currentHazard] || TOPIC_CONFIGS.emissions;
  const isArmed = selectedHazards.some((h) => h.toUpperCase().includes(config.name.split(' ')[0]));
  const activeAnomaly = (anomalyEval?.anomalies || []).find((a) => a.hazardId === currentHazard || a.hazardName?.toLowerCase().includes(currentHazard));

  // Compute live intensity percentage (0 - 100%)
  let intensityPct = 25;
  if (currentHazard === 'emissions') {
    intensityPct = Math.min(100, Math.round((sensorReadings.so2Ugm3 / 150) * 100));
  } else if (currentHazard === 'water') {
    const doDeficit = Math.max(0, 6.5 - sensorReadings.dissolvedOxygenMgL);
    intensityPct = Math.min(100, Math.round((doDeficit / 5.5) * 85 + (sensorReadings.bodMgL > 8 ? 20 : 0)));
  } else if (currentHazard === 'glacial') {
    const press = sensorReadings.morainePressureMpa || 1.2;
    intensityPct = Math.min(100, Math.round((press / 2.8) * 95));
  } else if (currentHazard === 'tsunami') {
    intensityPct = Math.min(100, Math.round((sensorReadings.dartWaveAmplitudeM / 1.8) * 95));
  } else if (currentHazard === 'cyclone') {
    const wind = sensorReadings.maxWindKmh || 15;
    intensityPct = Math.min(100, Math.round((wind / 180) * 100));
  } else if (currentHazard === 'other') {
    intensityPct = Math.min(100, Math.round((sensorReadings.multiHazardStressIndex || 0.25) * 100));
  } else if (currentHazard === 'flood') {
    const overtop = sensorReadings.river?.levelAboveDangerM || 0;
    intensityPct = overtop > 0 ? Math.min(100, Math.round(75 + overtop * 15)) : 35;
  } else if (currentHazard === 'heat') {
    intensityPct = Math.min(100, Math.round(((sensorReadings.tempC - 25) / 25) * 100));
  } else if (currentHazard === 'aqi') {
    intensityPct = Math.min(100, Math.round((sensorReadings.aqi / 450) * 100));
  }

  const intensityLevel = intensityPct >= 80 ? 'CRITICAL EMERGENCY' : (intensityPct >= 65 ? 'WARNING ELEVATION' : (intensityPct >= 45 ? 'MODERATE ADVISORY' : 'NOMINAL BASELINE'));
  const intensityColor = intensityPct >= 80 ? '#dc2626' : (intensityPct >= 65 ? '#ea580c' : (intensityPct >= 45 ? '#eab308' : '#10b981'));

  return (
    <section className="dash-topic-analytics-section" style={{ '--topic-theme-color': config.color }}>
      <div className="topic-analytics-header">
        <div className="tah-left">
          <div className="tah-badge-row">
            <span className="tah-num-badge" style={{ backgroundColor: config.color }}>{config.num}</span>
            <span className="tah-agency-tag">{config.agency}</span>
            <span className="tah-status-pill" style={{ color: !isArmed ? '#64748b' : (activeAnomaly ? '#ef4444' : '#3b82f6'), borderColor: !isArmed ? '#64748b' : (activeAnomaly ? '#ef4444' : 'inherit') }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'inline-block', verticalAlign: '1px', marginRight: '5px' }}>
                <circle cx="12" cy="12" r="12" />
              </svg>
              {!isArmed ? 'STANDBY // DESELECTED' : (activeAnomaly ? 'ML ANOMALY TRIGGERED' : 'ARMED & MONITORING')}
            </span>
          </div>
          <h3 className="tah-title">
            {config.name} — REAL-TIME ANALYTICS & REGULATORY RADAR
          </h3>
          <p className="tah-desc">{config.desc}</p>
        </div>

        <div className="tah-right">
          <div className="tah-quick-switcher">
            <span className="tqs-lbl">SELECT HAZARD TOPIC TO INSPECT:</span>
            <div className="tqs-pills">
              {['emissions', 'water', 'glacial', 'tsunami', 'cyclone', 'other', 'flood', 'heat'].map((tKey) => {
                const cfg = TOPIC_CONFIGS[tKey];
                const active = currentHazard === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    className={`tqs-pill-btn ${active ? 'active' : ''}`}
                    onClick={() => onSelectHazard && onSelectHazard(cfg.name)}
                    style={{ '--pill-c': cfg.color }}
                  >
                    <span className="tqs-dot" style={{ backgroundColor: cfg.color }} />
                    {cfg.num} {cfg.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Dual Ensemble Model Precision Telemetry Strip */}
      {activeHazardModel && (
        <div className="topic-ml-precision-strip">
          <div className="tml-strip-left">
            <span className="tml-model-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              {activeHazardModel.model_type || 'DUAL ENSEMBLE ML MODEL'}
            </span>
            <span className="tml-dataset-badge">
              CALIBRATED ON {(activeHazardModel.sample_count || 10000).toLocaleString()} SOVEREIGN RECORDS ({activeHazardModel.agency})
            </span>
          </div>
          <div className="tml-strip-right">
            <span className="tml-metric">
              PRECISION: <strong>{activeHazardModel.metrics?.precision_pct}%</strong>
            </span>
            <span className="tml-metric">
              RECALL: <strong>{activeHazardModel.metrics?.recall_pct}%</strong>
            </span>
            <span className="tml-metric">
              F1: <strong>{activeHazardModel.metrics?.f1_score}</strong>
            </span>
            <span className="tml-metric">
              ROC-AUC: <strong>{activeHazardModel.metrics?.roc_auc}</strong>
            </span>
            <span className="tml-metric">
              FAR: <strong>{activeHazardModel.metrics?.false_alarm_rate_pct}%</strong>
            </span>
          </div>
        </div>
      )}

      <div className="topic-sensor-gauges-grid">
        {/* TOPIC 07: INDUSTRIAL EMISSIONS */}
        {currentHazard === 'emissions' && (
          <>
            <div className={`gauge-card ${sensorReadings.so2Ugm3 >= 80 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 01</span>
                <span className="gc-name">SULFUR DIOXIDE (SO₂)</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.so2Ugm3}</span>
                <span className="gc-unit">µg/m³</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.so2Ugm3 / 150) * 100)}%`, backgroundColor: sensorReadings.so2Ugm3 >= 80 ? '#dc2626' : '#10b981' }} />
              </div>
              <div className="gc-footer">
                <span>CPCB Limit: <strong>80 µg/m³</strong></span>
                <span className="gc-status">{sensorReadings.so2Ugm3 >= 80 ? 'EXCEEDANCE' : 'COMPLIANT'}</span>
              </div>
            </div>

            <div className={`gauge-card ${sensorReadings.noxUgm3 >= 80 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 02</span>
                <span className="gc-name">NITROGEN OXIDES (NOₓ)</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.noxUgm3}</span>
                <span className="gc-unit">µg/m³</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.noxUgm3 / 150) * 100)}%`, backgroundColor: sensorReadings.noxUgm3 >= 80 ? '#dc2626' : '#10b981' }} />
              </div>
              <div className="gc-footer">
                <span>CPCB Standard: <strong>80 µg/m³</strong></span>
                <span className="gc-status">{sensorReadings.noxUgm3 >= 80 ? 'EXCEEDANCE' : 'OPTIMAL'}</span>
              </div>
            </div>

            <div className={`gauge-card ${sensorReadings.vocPpm >= 5.0 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 03</span>
                <span className="gc-name">VOLATILE ORGANICS (VOCs)</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.vocPpm}</span>
                <span className="gc-unit">ppm</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.vocPpm / 10) * 100)}%`, backgroundColor: sensorReadings.vocPpm >= 5 ? '#f97316' : '#06b6d4' }} />
              </div>
              <div className="gc-footer">
                <span>Refractory Limit: <strong>5.0 ppm</strong></span>
                <span className="gc-status">{sensorReadings.vocPpm >= 5 ? 'TOXIC AURA' : 'NORMAL'}</span>
              </div>
            </div>

            <div className={`gauge-card ${sensorReadings.stackOpacityPct >= 25 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 04</span>
                <span className="gc-name">STACK FLUE OPACITY</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.stackOpacityPct}</span>
                <span className="gc-unit">%</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.stackOpacityPct / 50) * 100)}%`, backgroundColor: sensorReadings.stackOpacityPct >= 25 ? '#dc2626' : '#64748b' }} />
              </div>
              <div className="gc-footer">
                <span>Opacity Max: <strong>25%</strong></span>
                <span className="gc-status">{sensorReadings.stackOpacityPct >= 25 ? 'SMOKE PLUME' : 'CLEAR STACK'}</span>
              </div>
            </div>
          </>
        )}

        {/* TOPIC 08: WATER QUALITY */}
        {currentHazard === 'water' && (
          <>
            <div className={`gauge-card ${sensorReadings.dissolvedOxygenMgL <= 4.0 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 01</span>
                <span className="gc-name">DISSOLVED OXYGEN (DO)</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.dissolvedOxygenMgL}</span>
                <span className="gc-unit">mg/L</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.dissolvedOxygenMgL / 8) * 100)}%`, backgroundColor: sensorReadings.dissolvedOxygenMgL <= 4 ? '#dc2626' : '#06b6d4' }} />
              </div>
              <div className="gc-footer">
                <span>Healthy Min: <strong>4.0 mg/L</strong></span>
                <span className="gc-status">{sensorReadings.dissolvedOxygenMgL <= 2 ? 'CRITICAL ANOXIA' : (sensorReadings.dissolvedOxygenMgL <= 4 ? 'HYPOXIC' : 'HEALTHY')}</span>
              </div>
            </div>

            <div className={`gauge-card ${sensorReadings.bodMgL >= 8.0 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 02</span>
                <span className="gc-name">BIOCHEMICAL OXYGEN (BOD)</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.bodMgL}</span>
                <span className="gc-unit">mg/L</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.bodMgL / 25) * 100)}%`, backgroundColor: sensorReadings.bodMgL >= 8 ? '#dc2626' : '#10b981' }} />
              </div>
              <div className="gc-footer">
                <span>CPCB Limit: <strong>8.0 mg/L</strong></span>
                <span className="gc-status">{sensorReadings.bodMgL >= 8 ? 'SEVERE POLLUTION' : 'ACCEPTABLE'}</span>
              </div>
            </div>

            <div className="gauge-card">
              <div className="gc-top">
                <span className="gc-num">MTR 03</span>
                <span className="gc-name">WATER QUALITY INDEX (WQI)</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.wqiScore}</span>
                <span className="gc-unit">/ 100</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${sensorReadings.wqiScore}%`, backgroundColor: sensorReadings.wqiScore < 45 ? '#dc2626' : '#10b981' }} />
              </div>
              <div className="gc-footer">
                <span>Classification: <strong>{sensorReadings.wqiScore < 45 ? 'CLASS E (DEGRADED)' : 'CLASS C (DRINKABLE)'}</strong></span>
              </div>
            </div>

            <div className="gauge-card">
              <div className="gc-top">
                <span className="gc-num">MTR 04</span>
                <span className="gc-name">FECAL COLIFORM / TDS</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.fecalColiformMpn}</span>
                <span className="gc-unit">MPN/100mL</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.fecalColiformMpn / 10000) * 100)}%`, backgroundColor: '#f97316' }} />
              </div>
              <div className="gc-footer">
                <span>Total Dissolved Solids: <strong>{sensorReadings.tdsPpm} ppm</strong></span>
              </div>
            </div>
          </>
        )}

        {/* TOPIC 09: GLACIAL LIQUEFACTION */}
        {currentHazard === 'glacial' && (
          <>
            <div className={`gauge-card ${(sensorReadings.morainePressureMpa || 1.25) >= 2.2 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 01</span>
                <span className="gc-name">MORAINE HYDROSTATIC PRESSURE</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.morainePressureMpa || 1.25}</span>
                <span className="gc-unit">MPa</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, ((sensorReadings.morainePressureMpa || 1.25) / 3.0) * 100)}%`, backgroundColor: (sensorReadings.morainePressureMpa || 1.25) >= 2.2 ? '#dc2626' : '#0284c7' }} />
              </div>
              <div className="gc-footer">
                <span>Breach Critical: <strong>2.2 MPa</strong></span>
                <span className="gc-status">{(sensorReadings.morainePressureMpa || 1.25) >= 2.2 ? 'RUPTURE IMMINENT' : 'STABLE MORAINE'}</span>
              </div>
            </div>

            <div className={`gauge-card ${(sensorReadings.lakeExpansionPct || 14.5) >= 30 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 02</span>
                <span className="gc-name">LAKE VOLUME EXPANSION</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">+{sensorReadings.lakeExpansionPct || 14.5}</span>
                <span className="gc-unit">%</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, ((sensorReadings.lakeExpansionPct || 14.5) / 50) * 100)}%`, backgroundColor: (sensorReadings.lakeExpansionPct || 14.5) >= 30 ? '#dc2626' : '#38bdf8' }} />
              </div>
              <div className="gc-footer">
                <span>Satellite Sentinel SAR: <strong>64 Million m³</strong></span>
                <span className="gc-status">{(sensorReadings.lakeExpansionPct || 14.5) >= 30 ? 'SURGE DETECTED' : 'EXPANDING'}</span>
              </div>
            </div>

            <div className="gauge-card">
              <div className="gc-top">
                <span className="gc-num">MTR 03</span>
                <span className="gc-name">ICE CORE TEMPERATURE</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.iceCoreTempC !== null ? sensorReadings.iceCoreTempC : -3.4}</span>
                <span className="gc-unit">°C</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, ((sensorReadings.iceCoreTempC || -3.4) + 10) * 8)}%`, backgroundColor: (sensorReadings.iceCoreTempC || -3.4) >= 0 ? '#dc2626' : '#0ea5e9' }} />
              </div>
              <div className="gc-footer">
                <span>Cryosphere Base: <strong>-4.5°C</strong></span>
                <span className="gc-status">{(sensorReadings.iceCoreTempC || -3.4) >= 0 ? 'THERMAL ABLATION' : 'FROZEN'}</span>
              </div>
            </div>

            <div className="gauge-card">
              <div className="gc-top">
                <span className="gc-num">MTR 04</span>
                <span className="gc-name">PERMAFROST THAW RATE</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.permafrostThawRateCmMo || 1.8}</span>
                <span className="gc-unit">cm/mo</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, ((sensorReadings.permafrostThawRateCmMo || 1.8) / 6) * 100)}%`, backgroundColor: '#38bdf8' }} />
              </div>
              <div className="gc-footer">
                <span>Liquefaction Index: <strong>{sensorReadings.liquefactionFactor || 0.38}</strong></span>
              </div>
            </div>
          </>
        )}

        {/* TOPIC 10: TSUNAMI */}
        {currentHazard === 'tsunami' && (
          <>
            <div className={`gauge-card ${sensorReadings.dartWaveAmplitudeM >= 0.40 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 01</span>
                <span className="gc-name">DART BUOY WAVE AMPLITUDE</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.dartWaveAmplitudeM}</span>
                <span className="gc-unit">m</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.dartWaveAmplitudeM / 2.0) * 100)}%`, backgroundColor: sensorReadings.dartWaveAmplitudeM >= 0.4 ? '#dc2626' : '#0f766e' }} />
              </div>
              <div className="gc-footer">
                <span>Deep Ocean Trigger: <strong>0.40 m</strong></span>
                <span className="gc-status">{sensorReadings.dartWaveAmplitudeM >= 0.4 ? 'TSUNAMI ANOMALY' : 'NORMAL SWELL'}</span>
              </div>
            </div>

            <div className={`gauge-card ${sensorReadings.coastalRunupM >= 2.0 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 02</span>
                <span className="gc-name">PROJECTED COASTAL RUNUP</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">+{sensorReadings.coastalRunupM}</span>
                <span className="gc-unit">m</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.coastalRunupM / 5.0) * 100)}%`, backgroundColor: sensorReadings.coastalRunupM >= 2.0 ? '#dc2626' : '#14b8a6' }} />
              </div>
              <div className="gc-footer">
                <span>Inundation Limit: <strong>2.0 m</strong></span>
                <span className="gc-status">{sensorReadings.coastalRunupM >= 2.0 ? 'INUNDATION RISK' : 'LOW RISK'}</span>
              </div>
            </div>

            <div className="gauge-card">
              <div className="gc-top">
                <span className="gc-num">MTR 03</span>
                <span className="gc-name">BOTTOM PRESSURE DELTA (BPR)</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.bottomPressureDeltaKpa}</span>
                <span className="gc-unit">kPa</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.bottomPressureDeltaKpa / 10.0) * 100)}%`, backgroundColor: '#0f766e' }} />
              </div>
              <div className="gc-footer">
                <span>Bathymetric Depth: <strong>3,400 m MSL</strong></span>
              </div>
            </div>

            <div className="gauge-card">
              <div className="gc-top">
                <span className="gc-num">MTR 04</span>
                <span className="gc-name">ESTIMATED TIME TO COAST (ETA)</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.tsunamiEtaMin}</span>
                <span className="gc-unit">Minutes</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: '65%', backgroundColor: '#14b8a6' }} />
              </div>
              <div className="gc-footer">
                <span>Wave Velocity: <strong>720 km/h</strong></span>
              </div>
            </div>
          </>
        )}

        {/* TOPIC 11: CYCLONE */}
        {currentHazard === 'cyclone' && (
          <>
            <div className={`gauge-card ${sensorReadings.centralPressureHpa <= 980 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 01</span>
                <span className="gc-name">CENTRAL PRESSURE</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.centralPressureHpa}</span>
                <span className="gc-unit">hPa</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, ((1015 - sensorReadings.centralPressureHpa) / 80) * 100)}%`, backgroundColor: sensorReadings.centralPressureHpa <= 980 ? '#be185d' : '#ec4899' }} />
              </div>
              <div className="gc-footer">
                <span>Depression Limit: <strong>980 hPa</strong></span>
                <span className="gc-status">{sensorReadings.centralPressureHpa <= 980 ? 'DEEP CYCLONIC EYE' : 'NORMAL'}</span>
              </div>
            </div>

            <div className={`gauge-card ${sensorReadings.maxWindKmh >= 62 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 02</span>
                <span className="gc-name">SUSTAINED EYEWALL WINDS</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.maxWindKmh}</span>
                <span className="gc-unit">km/h</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.maxWindKmh / 200) * 100)}%`, backgroundColor: sensorReadings.maxWindKmh >= 118 ? '#be185d' : (sensorReadings.maxWindKmh >= 62 ? '#ec4899' : '#10b981') }} />
              </div>
              <div className="gc-footer">
                <span>Gale Warning: <strong>62 km/h</strong></span>
                <span className="gc-status">{sensorReadings.maxWindKmh >= 118 ? 'VERY SEVERE CYCLONE' : (sensorReadings.maxWindKmh >= 62 ? 'CYCLONIC STORM' : 'MODERATE')}</span>
              </div>
            </div>

            <div className={`gauge-card ${sensorReadings.stormSurgeM >= 2.5 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 03</span>
                <span className="gc-name">COASTAL STORM SURGE</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">+{sensorReadings.stormSurgeM}</span>
                <span className="gc-unit">m</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.stormSurgeM / 6.0) * 100)}%`, backgroundColor: sensorReadings.stormSurgeM >= 2.5 ? '#be185d' : '#f472b6' }} />
              </div>
              <div className="gc-footer">
                <span>Tidal Surge Alert: <strong>2.5 m</strong></span>
                <span className="gc-status">{sensorReadings.stormSurgeM >= 2.5 ? 'INUNDATION SURGE' : 'LOW SURGE'}</span>
              </div>
            </div>

            <div className="gauge-card">
              <div className="gc-top">
                <span className="gc-num">MTR 04</span>
                <span className="gc-name">IMD CLASSIFICATION</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val-text">{sensorReadings.cycloneCategory}</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: '85%', backgroundColor: '#be185d' }} />
              </div>
              <div className="gc-footer">
                <span>Coriolis Vorticity: <strong>{sensorReadings.vorticityIndex} × 10⁻⁵ s⁻¹</strong></span>
              </div>
            </div>
          </>
        )}

        {/* TOPIC 12: OTHER HAZARDS */}
        {currentHazard === 'other' && (
          <>
            <div className={`gauge-card ${sensorReadings.multiHazardStressIndex >= 0.65 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 01</span>
                <span className="gc-name">MULTI-HAZARD STRESS INDEX</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.multiHazardStressIndex}</span>
                <span className="gc-unit">/ 1.00</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${sensorReadings.multiHazardStressIndex * 100}%`, backgroundColor: sensorReadings.multiHazardStressIndex >= 0.65 ? '#dc2626' : '#d97706' }} />
              </div>
              <div className="gc-footer">
                <span>Threshold: <strong>0.65</strong></span>
                <span className="gc-status">{sensorReadings.multiHazardStressIndex >= 0.65 ? 'COMPOUND STRESS' : 'STABLE'}</span>
              </div>
            </div>

            <div className={`gauge-card ${sensorReadings.lightningDensitySqkm >= 12 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 02</span>
                <span className="gc-name">LIGHTNING STRIKE DENSITY</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.lightningDensitySqkm}</span>
                <span className="gc-unit">strikes/km²</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.lightningDensitySqkm / 25) * 100)}%`, backgroundColor: sensorReadings.lightningDensitySqkm >= 12 ? '#dc2626' : '#fbbf24' }} />
              </div>
              <div className="gc-footer">
                <span>Severe Storm: <strong>12 strikes/km²</strong></span>
                <span className="gc-status">{sensorReadings.lightningDensitySqkm >= 12 ? 'THUNDERSTORM' : 'MODERATE'}</span>
              </div>
            </div>

            <div className={`gauge-card ${sensorReadings.chemicalVaporPpm >= 1.0 ? 'alert' : ''}`}>
              <div className="gc-top">
                <span className="gc-num">MTR 03</span>
                <span className="gc-name">CHEMICAL VAPOR PLUME</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">{sensorReadings.chemicalVaporPpm}</span>
                <span className="gc-unit">ppm</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.chemicalVaporPpm / 3.0) * 100)}%`, backgroundColor: sensorReadings.chemicalVaporPpm >= 1.0 ? '#dc2626' : '#d97706' }} />
              </div>
              <div className="gc-footer">
                <span>Hazmat Alert: <strong>1.0 ppm</strong></span>
                <span className="gc-status">{sensorReadings.chemicalVaporPpm >= 1.0 ? 'HAZMAT SPILL' : 'NOMINAL'}</span>
              </div>
            </div>

            <div className="gauge-card">
              <div className="gc-top">
                <span className="gc-num">MTR 04</span>
                <span className="gc-name">PLUVIAL FLASH INUNDATION</span>
              </div>
              <div className="gc-val-wrap">
                <span className="gc-val">+{sensorReadings.pluvialDepthM}</span>
                <span className="gc-unit">m</span>
              </div>
              <div className="gc-progress-bar">
                <div className="gc-progress-fill" style={{ width: `${Math.min(100, (sensorReadings.pluvialDepthM / 1.5) * 100)}%`, backgroundColor: '#d97706' }} />
              </div>
              <div className="gc-footer">
                <span>Urban Drainage Max: <strong>0.50 m</strong></span>
              </div>
            </div>
          </>
        )}

        {/* DEFAULT FALLBACK FOR FLOOD / HEAT / OTHERS */}
        {!['emissions', 'water', 'glacial', 'tsunami', 'cyclone', 'other'].includes(currentHazard) && (
          <>
            <div className="gauge-card">
              <div className="gc-top"><span className="gc-num">MTR 01</span><span className="gc-name">SURFACE INTENSITY</span></div>
              <div className="gc-val-wrap"><span className="gc-val">{sensorReadings.tempC}°C</span></div>
              <div className="gc-footer"><span>Heat Index: {sensorReadings.heatIndexC}°C</span></div>
            </div>
            <div className="gauge-card">
              <div className="gc-top"><span className="gc-num">MTR 02</span><span className="gc-name">AIR QUALITY</span></div>
              <div className="gc-val-wrap"><span className="gc-val">{sensorReadings.aqi} AQI</span></div>
              <div className="gc-footer"><span>PM2.5: {sensorReadings.pm25Ugm3} µg/m³</span></div>
            </div>
            <div className="gauge-card">
              <div className="gc-top"><span className="gc-num">MTR 03</span><span className="gc-name">24H RAINFALL</span></div>
              <div className="gc-val-wrap"><span className="gc-val">{sensorReadings.rainfall24hMm} mm</span></div>
              <div className="gc-footer"><span>Precipitation Level</span></div>
            </div>
            <div className="gauge-card">
              <div className="gc-top"><span className="gc-num">MTR 04</span><span className="gc-name">WIND SPEED</span></div>
              <div className="gc-val-wrap"><span className="gc-val">{sensorReadings.windSpeedKmh} km/h</span></div>
              <div className="gc-footer"><span>Gusts: {sensorReadings.windGustKmh} km/h</span></div>
            </div>
          </>
        )}
      </div>

      <div className="topic-intensity-barometer">
        <div className="tib-header">
          <div className="tib-label-wrap">
            <span className="tib-title">REGULATORY STRESS & ANOMALY INTENSITY BAROMETER</span>
            <span className="tib-sub">CALIBRATED ON CPCB / IMD / INCOIS CONTINUOUS SCALES</span>
          </div>
          <div className="tib-score-tag" style={{ color: intensityColor, borderColor: intensityColor }}>
            CURRENT LOAD: {intensityPct}% [{intensityLevel}]
          </div>
        </div>

        <div className="tib-bar-wrapper">
          <div className="tib-gradient-track" />
          <div className="tib-needle" style={{ left: `${intensityPct}%`, borderColor: intensityColor }}>
            <span className="tib-needle-marker" style={{ backgroundColor: intensityColor }} />
            <span className="tib-needle-label" style={{ color: intensityColor }}>{intensityPct}%</span>
          </div>
        </div>

        <div className="tib-ticks-row">
          <span>0% NOMINAL</span>
          <span>40% CAUTION</span>
          <span>70% ELEVATED</span>
          <span>85% CRITICAL ANOMALY</span>
          <span>100% EXTREME</span>
        </div>
      </div>

      <div className="topic-intel-row">
        <div className="ti-box shade-pistachio">
          <span className="ti-lbl">HISTORICAL RECORD TALLY</span>
          <span className="ti-val">{config.historicalTotal}</span>
          <span className="ti-sub">SEASONAL WINDOW: {config.peakWindow}</span>
        </div>

        <div className="ti-box shade-sage">
          <span className="ti-lbl">REGULATORY BENCHMARK</span>
          <span className="ti-val danger-text">{config.criticalStandard}</span>
          <span className="ti-sub">STATUTORY EXCEEDANCE LINE</span>
        </div>

        <div className="ti-box shade-forest">
          <span className="ti-lbl">EMERGENCY ACTION DIRECTIVE</span>
          <span className="ti-val" style={{ fontSize: '0.82rem', color: '#b91c1c' }}>{config.sop}</span>
          <span className="ti-sub">NATIONAL PROTOCOL ACTIVE</span>
        </div>

        <div className="ti-box action-box">
          <span className="ti-lbl">ML STRESS SIMULATION</span>
          <button
            type="button"
            className="ti-simulate-btn"
            style={{ backgroundColor: config.color }}
            onClick={() => onTriggerScenario && onTriggerScenario(config.scenarioKey)}
            title={`Simulate active ${config.name} anomaly state`}
          >
            SIMULATE {config.name.split(' ')[0]} ANOMALY
          </button>
          <span className="ti-sub">TESTS ML DETECTOR & MAP PLOT</span>
        </div>
      </div>
    </section>
  );
}
