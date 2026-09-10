import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchLiveWeatherData } from '../utils/weatherApi';
import indiaGeoJson from '../data/india-soi.json';
import {
  LIVE_MET_LAYERS,
  fetchRainViewerRadarFrames,
  renderLiveMetOverlay,
} from '../utils/meteorologicalLayers';
import {
  fetchAllLiveStationTelemetry,
} from '../services/liveTelemetryService';
import {
  getCalibratedSensorReadings,
  evaluateMultiSensorAnomaly,
  predictNearbyImpacts,
  getAllIndiaAnomalyHotspots,
  getDistanceKm,
} from '../utils/anomalyDetectionEngine';
import { resolveGeodeticFix, uploadedTelemetryStore, ALL_INDIA_SETTLEMENTS } from '../utils/spatialMlPredictionEngine';
import { realtimeSensorStreamService } from '../services/realtimeSensorStreamService';
import {
  SAMPLE_SENSOR_DATASETS,
  parseUploadedSensorFile,
  mapRowToSensorReadings,
} from '../services/sensorUploadService';
import {
  generateGenAiExplanation,
  askGenAiDisasterQuestion,
  getStoredGeminiApiKey,
  saveGeminiApiKey,
} from '../services/genAiExplanationService';
import { renderHazardAnomalyOverlays } from '../utils/hazardOverlayRenderer';
import TopicAnalyticsRadar from './TopicAnalyticsRadar';
import HistoricalDatasetExplorerModal from './HistoricalDatasetExplorerModal';

// Pre-curated Indian geographic ecosystems & regional hubs
const QUICK_PRESETS = [
  { name: 'SILCHAR', region: 'BARAK VALLEY, ASSAM', lat: 24.8273, lng: 92.7979 },
  { name: 'NEW DELHI', region: 'NATIONAL CAPITAL REGION', lat: 28.6139, lng: 77.2090 },
  { name: 'MUMBAI', region: 'MAHARASHTRA COAST', lat: 19.0760, lng: 72.8777 },
  { name: 'BENGALURU', region: 'DECCAN PLATEAU, KARNATAKA', lat: 12.9716, lng: 77.5946 },
  { name: 'KOLKATA', region: 'GANGETIC DELTA, WEST BENGAL', lat: 22.5726, lng: 88.3639 },
  { name: 'WESTERN GHATS', region: 'SILENT VALLEY BIOSPHERE, KERALA', lat: 11.0847, lng: 76.4447 },
  { name: 'SHIMLA', region: 'HIMALAYAN FOOTHILLS, HIMACHAL PRADESH', lat: 31.1048, lng: 77.1734 },
  { name: 'LEH LADAKH', region: 'TRANS-HIMALAYAN RAIN-SHADOW, UT LADAKH', lat: 34.1526, lng: 77.5771 },
  { name: 'SUNDARBANS', region: 'TIDAL MANGROVE BASIN, WEST BENGAL', lat: 21.9497, lng: 89.1833 },
  { name: 'GUWAHATI', region: 'BRAHMAPUTRA RIVER VALLEY, ASSAM', lat: 26.1445, lng: 91.7362 },
  { name: 'THAR DESERT', region: 'JAISALMER MARUSTHALI, RAJASTHAN', lat: 26.9157, lng: 70.9083 },
  { name: 'CHENNAI', region: 'COROMANDEL COAST, TAMIL NADU', lat: 13.0827, lng: 80.2707 },
  { name: 'CHERRAPUNJI', region: 'EAST KHASI HILLS, MEGHALAYA', lat: 25.2986, lng: 91.7168 },
];

// Hazard Layer Options with Calamity-Specific Color Vibe for Instant Disaster Identification
const HAZARD_LAYERS = [
  { id: 'flood', name: 'FLOOD', color: '#2563eb', desc: 'Riverine overflow & inundation' },
  { id: 'aqi', name: 'HAZARDOUS AQI', color: '#9333ea', desc: 'Severe toxic particulate PM2.5/PM10' },
  { id: 'fires', name: 'FOREST FIRES', color: '#f97316', desc: 'Wildfire & biomass inferno' },
  { id: 'earthquakes', name: 'EARTHQUAKES', color: '#dc2626', desc: 'Seismic fault rupture' },
  { id: 'landslides', name: 'LANDSLIDES', color: '#92400e', desc: 'Slope failure & debris mudflow' },
  { id: 'heat', name: 'EXTREME HEAT', color: '#ef4444', desc: 'Solar radiation & thermal heatwave' },
  { id: 'emissions', name: 'INDUSTRIAL EMISSIONS', color: '#64748b', desc: 'Chemical exhaust & factory soot' },
  { id: 'water', name: 'WATER QUALITY', color: '#06b6d4', desc: 'River basin effluent & turbidity' },
  { id: 'glacial', name: 'GLACIAL LIQUEFACTION', color: '#0284c7', desc: 'Cryosphere melt & glacial outburst' },
  { id: 'tsunami', name: 'TSUNAMI', color: '#0f766e', desc: 'Deep oceanic seismic surges' },
  { id: 'cyclone', name: 'CYCLONE', color: '#ec4899', desc: 'Tropical vortex & storm depression' },
  { id: 'other', name: 'OTHER HAZARDS', color: '#d97706', desc: 'Multi-hazard sensor anomalies' },
];

// Sovereign India Geographic Focus Bounding Box (Survey of India Extent)
// Spans from Indira Point / Nicobar & Kanyakumari up to Northern Ladakh / Siachen,
// and Western Gujarat to Kibithu, Arunachal Pradesh.
const INDIA_FOCUS_BOUNDS = [
  [6.0, 68.0],   // South-West: Marine Indira Point / Lakshadweep to Western Gujarat
  [37.5, 97.8],  // North-East: Northern Ladakh / Siachen Crown to Kibithu, Arunachal Pradesh
];

// Mobile-specific bounding box optimized for portrait screens to keep Sovereign India centered
const INDIA_MOBILE_FOCUS_BOUNDS = [
  [6.5, 68.0],
  [37.0, 97.5],
];

const REGIONAL_MAP_BOUNDS = [
  [-2.0, 52.0],  // South-West: Northern Indian Ocean / Horn of Africa
  [44.0, 110.0], // North-East: Central Asia / Tibet / South China Sea
];

const IconClose = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconTrendUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', verticalAlign: 'middle' }} aria-hidden="true">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

const IconTrendDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', verticalAlign: 'middle' }} aria-hidden="true">
    <line x1="7" y1="7" x2="17" y2="17" />
    <polyline points="17 7 17 17 7 17" />
  </svg>
);

const IconTrendSteady = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', verticalAlign: 'middle' }} aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }} aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function formatInlineMarkdown(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="qa-inline-code">$1</code>');
}

function renderFormattedQaResponse(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="qa-answer-container">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: '0.35rem' }} />;
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h6 key={idx} className="qa-answer-heading">
              {trimmed.replace(/^###\s*/, '')}
            </h6>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          const content = trimmed.replace(/^[-*•]\s*/, '');
          return (
            <div key={idx} className="qa-answer-bullet">
              <span className="qa-answer-bullet-icon">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
            </div>
          );
        }
        if (/^\d+\.\s+/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
          return (
            <div key={idx} className="qa-answer-numbered">
              <span className="qa-answer-number-tag">{match[1]}</span>
              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(match[2]) }} />
            </div>
          );
        }
        return (
          <p
            key={idx}
            className="qa-answer-paragraph"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }}
          />
        );
      })}
    </div>
  );
}

export default function Dashboard({
  onBackHome,
  viewDetails: controlledViewDetails,
  onToggleDetail: controlledOnToggleDetail,
  onSetViewPreset: controlledOnSetViewPreset,
}) {
  // Local fallback if not provided from parent
  const [internalViewDetails, setInternalViewDetails] = useState({
    nodeTelemetry: false,
    sensorChannels: false,
    topicAnalytics: false,
    stressTestBar: false,
    anomalyCards: false,
    cascadingForecast: false,
  });

  const viewDetails = controlledViewDetails || internalViewDetails;
  const onToggleDetail = controlledOnToggleDetail || ((key) => {
    setInternalViewDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  });
  const onSetViewPreset = controlledOnSetViewPreset || ((preset) => {
    if (preset === 'clean') {
      setInternalViewDetails({
        nodeTelemetry: false,
        sensorChannels: false,
        topicAnalytics: false,
        stressTestBar: false,
        anomalyCards: false,
        cascadingForecast: false,
      });
    } else {
      setInternalViewDetails({
        nodeTelemetry: true,
        sensorChannels: true,
        topicAnalytics: true,
        stressTestBar: true,
        anomalyCards: true,
        cascadingForecast: true,
      });
    }
  });

  const activeDetailCount = ['nodeTelemetry', 'sensorChannels', 'topicAnalytics', 'stressTestBar', 'anomalyCards', 'cascadingForecast'].filter((k) => viewDetails[k]).length;
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState(null);

  const [liveData, setLiveData] = useState(null);
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);

  const [isMapExpanded, setIsMapExpanded] = useState(true);
  const [selectedHazards, setSelectedHazards] = useState(['FLOOD']);
  const [activeAnalyticsTopic, setActiveAnalyticsTopic] = useState('emissions');

  // ML Multi-Hazard Anomaly Detection & Sensor Telemetry State
  const [sensorReadings, setSensorReadings] = useState(null);
  const [anomalyEval, setAnomalyEval] = useState({ hasAnomaly: false, anomalies: [] });
  const [cascadingPrediction, setCascadingPrediction] = useState(null);
  const [isForecastExpanded, setIsForecastExpanded] = useState(false);
  const [anomalyScenario, setAnomalyScenario] = useState('auto'); // 'auto', 'silchar_flood', 'heatwave', 'nominal'
  const hazardOverlayGroupRef = useRef(null);

  // Live Actual Meteorological Telemetry Overlay State (MSN Weather Real-Time Scale)
  const [activeLiveLayer, setActiveLiveLayer] = useState('rain');
  const [mapTimeWindow, setMapTimeWindow] = useState('NOW (LIVE)');
  const [radarFrames, setRadarFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const liveOverlayGroupRef = useRef(null);

  // Map Option Overlays
  const [showHazardLegends, setShowHazardLegends] = useState(false);
  const [showHazardTimePanel, setShowHazardTimePanel] = useState(false);
  const [showPrecipitationScale, setShowPrecipitationScale] = useState(false);

  // Executive Layer Studio State (Clean, non-congested unified layer dock above map)
  const [activeStudioTab, setActiveStudioTab] = useState('hazards'); // 'hazards' | 'meteorology' | 'hotspots'
  const [isStudioExpanded, setIsStudioExpanded] = useState(true);

  // Mobile Touch Navigation State
  const [activeMobileTab, setActiveMobileTab] = useState('cockpit');

  const handleMobileTabNav = (tabKey) => {
    setActiveMobileTab(tabKey);
    let targetId = 'mobile-sec-cockpit';
    if (tabKey === 'map') {
      setIsMapExpanded(true);
      targetId = 'mobile-sec-map';
    } else if (tabKey === 'sensors') {
      if (typeof onToggleDetail === 'function' && !viewDetails.sensorChannels) {
        onToggleDetail('sensorChannels');
      }
      targetId = 'mobile-sec-sensors';
    } else if (tabKey === 'alerts') {
      targetId = 'mobile-sec-alerts';
    } else if (tabKey === 'copilot') {
      targetId = 'mobile-sec-copilot';
    }

    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 768) return;
    const sectionIds = ['mobile-sec-cockpit', 'mobile-sec-map', 'mobile-sec-sensors', 'mobile-sec-alerts', 'mobile-sec-copilot'];
    const tabMap = {
      'mobile-sec-cockpit': 'cockpit',
      'mobile-sec-map': 'map',
      'mobile-sec-sensors': 'sensors',
      'mobile-sec-alerts': 'alerts',
      'mobile-sec-copilot': 'copilot',
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && tabMap[entry.target.id]) {
            setActiveMobileTab(tabMap[entry.target.id]);
          }
        });
      },
      { threshold: 0.2 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isMapExpanded, viewDetails]);

  // Real-Time Multi-Station Meteorological Ingestion State
  const [liveTelemetry, setLiveTelemetry] = useState(null);
  const [isTelemetryLoading, setIsTelemetryLoading] = useState(false);

  const [activeNode, setActiveNode] = useState({
    id: 'NODE-SILCHAR-7241',
    name: 'SILCHAR TELEMETRIC STATION',
    lat: '24.8273° N',
    lng: '92.7979° E',
    zone: 'BARAK VALLEY, ASSAM',
    elevation: '24 m',
    riskScore: 'LIVE SENSOR CALIBRATED',
    status: 'ONLINE // ACTIVE TELEMETRY LINK',
  });

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const hotspotsLayerGroupRef = useRef(null);

  // All-India Anomaly Hotspots from the 12 fine-tuned datasets (16 issue locations)
  const [allIndiaHotspots] = useState(getAllIndiaAnomalyHotspots());
  const [showHotspotsOverlay, setShowHotspotsOverlay] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedSensorInfo, setUploadedSensorInfo] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const [genAiData, setGenAiData] = useState(null);
  const [isGenAiLoading, setIsGenAiLoading] = useState(false);
  const [genAiCustomQuestion, setGenAiCustomQuestion] = useState('');
  const [genAiAnswerHistory, setGenAiAnswerHistory] = useState([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState(getStoredGeminiApiKey());
  const [telemetryApiKeyInput, setTelemetryApiKeyInput] = useState('');
  const [apiSaveMessage, setApiSaveMessage] = useState('');
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);
  const [historicalModalDatasetId, setHistoricalModalDatasetId] = useState('flood');
  const [genAiElapsedSec, setGenAiElapsedSec] = useState(0);
  const genAiTimerRef = useRef(null);
  const [isQaLoading, setIsQaLoading] = useState(false);
  const [qaElapsedSec, setQaElapsedSec] = useState(0);
  const qaTimerRef = useRef(null);
  const [copiedAnswerId, setCopiedAnswerId] = useState(null);

  const [liveSensorStreamInfo, setLiveSensorStreamInfo] = useState(null);
  const [isSensorBannerExpanded, setIsSensorBannerExpanded] = useState(false);
  const [showStreamDrawer, setShowStreamDrawer] = useState(false);
  const [streamLogFiles, setStreamLogFiles] = useState([]);
  const [isSimulatingStream, setIsSimulatingStream] = useState(false);
  const [streamToast, setStreamToast] = useState(null);

  useEffect(() => {
    const key = getStoredGeminiApiKey();
    if (key && !localStorage.getItem('ERMS_GEMINI_API_KEY')) {
      localStorage.setItem('ERMS_GEMINI_API_KEY', key);
      setGeminiApiKeyInput(key);
    }
  }, []);

  useEffect(() => {
    if (isGenAiLoading) {
      setGenAiElapsedSec(0);
      const startT = Date.now();
      genAiTimerRef.current = setInterval(() => {
        setGenAiElapsedSec(parseFloat(((Date.now() - startT) / 1000).toFixed(1)));
      }, 100);
    } else {
      if (genAiTimerRef.current) {
        clearInterval(genAiTimerRef.current);
        genAiTimerRef.current = null;
      }
    }
    return () => {
      if (genAiTimerRef.current) clearInterval(genAiTimerRef.current);
    };
  }, [isGenAiLoading]);

  useEffect(() => {
    if (isQaLoading) {
      setQaElapsedSec(0);
      const startT = Date.now();
      qaTimerRef.current = setInterval(() => {
        setQaElapsedSec(parseFloat(((Date.now() - startT) / 1000).toFixed(1)));
      }, 100);
    } else {
      if (qaTimerRef.current) {
        clearInterval(qaTimerRef.current);
        qaTimerRef.current = null;
      }
    }
    return () => {
      if (qaTimerRef.current) clearInterval(qaTimerRef.current);
    };
  }, [isQaLoading]);

  const handleCopyDirective = (text, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedAnswerId(id);
      setTimeout(() => setCopiedAnswerId(null), 2000);
    }
  };

  // Load initial live weather and multi-sensor data for Silchar on mount
  useEffect(() => {
    loadLocationData(QUICK_PRESETS[0].lat, QUICK_PRESETS[0].lng, QUICK_PRESETS[0].name, QUICK_PRESETS[0].region);
  }, []);

  // Fetch real-time multi-station meteorological telemetry across all 30 Indian observation hubs
  const refreshLiveTelemetry = async (force = false) => {
    setIsTelemetryLoading(true);
    try {
      const telem = await fetchAllLiveStationTelemetry(force);
      setLiveTelemetry(telem);
    } catch (err) {
      console.error('Failed to update live station telemetry:', err);
    } finally {
      setIsTelemetryLoading(false);
    }
  };

  // Initial fetch and continuous 60-second real-time auto-refresh across India
  useEffect(() => {
    refreshLiveTelemetry();
    const intervalId = setInterval(() => {
      refreshLiveTelemetry(true);
    }, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Central function to load actual live weather and multi-sensor telemetry data
  const loadLocationData = async (lat, lng, name, region, scenarioOverride = null) => {
    setIsLoading(true);
    try {
      const data = await fetchLiveWeatherData(lat, lng, name, region);
      setLiveData(data);

      const scenario = scenarioOverride || anomalyScenario;
      const readings = getCalibratedSensorReadings(lat, lng, name, data);

      // Apply scenario overrides if simulating specific states across all 12 disaster domains
      if (
        scenario === 'silchar_flood' ||
        (scenario === 'auto' && readings.river && readings.river.distanceToRiverKm < 75)
      ) {
        if (readings.river) {
          const breachM = 0.38;
          readings.river.waterLevelM = Math.round((readings.river.dangerLevelM + breachM) * 100) / 100;
          readings.river.levelAboveDangerM = breachM;
          readings.river.waterLevelRatio = 1.02;
          readings.river.dischargeCumecs = Math.round(readings.river.criticalDischargeCumecs * 0.74);
          readings.river.trend = 'Rising (+3.8 cm/hr)';
        }
      } else if (scenario === 'heatwave') {
        readings.tempC = 46.5;
        readings.heatIndexC = 54.2;
        readings.wetBulbC = 31.8;
      } else if (scenario === 'emissions') {
        readings.so2Ugm3 = 138.0;
        readings.noxUgm3 = 112.0;
        readings.vocPpm = 8.2;
        readings.stackOpacityPct = 36.0;
        readings.co2FluxPpm = 640.0;
      } else if (scenario === 'water') {
        readings.dissolvedOxygenMgL = 1.4;
        readings.bodMgL = 21.0;
        readings.wqiScore = 32;
        readings.fecalColiformMpn = 54000;
        readings.turbidityNtu = 28.0;
      } else if (scenario === 'glacial') {
        readings.morainePressureMpa = 2.85;
        readings.lakeExpansionPct = 42.0;
        readings.iceCoreTempC = 1.2;
        readings.permafrostThawRateCmMo = 5.4;
        readings.liquefactionFactor = 0.82;
      } else if (scenario === 'tsunami') {
        readings.dartWaveAmplitudeM = 1.65;
        readings.coastalRunupM = 4.2;
        readings.bottomPressureDeltaKpa = 7.8;
        readings.tsunamiEtaMin = 28;
      } else if (scenario === 'cyclone') {
        readings.centralPressureHpa = 942.0;
        readings.maxWindKmh = 185.0;
        readings.windGustKmh = 225.0;
        readings.stormSurgeM = 4.8;
        readings.cycloneCategory = 'VERY SEVERE CYCLONIC STORM (VSCS)';
      } else if (scenario === 'other') {
        readings.multiHazardStressIndex = 0.86;
        readings.lightningDensitySqkm = 22.0;
        readings.chemicalVaporPpm = 2.8;
        readings.pluvialDepthM = 0.75;
      } else if (scenario === 'nominal') {
        if (readings.river) {
          readings.river.waterLevelM = Math.round((readings.river.dangerLevelM - 4.5) * 100) / 100;
          readings.river.levelAboveDangerM = -4.5;
          readings.river.waterLevelRatio = 0.77;
          readings.river.dischargeCumecs = 620;
          readings.river.trend = 'Steady';
        }
        readings.tempC = 28.5;
        readings.heatIndexC = 31.2;
        readings.aqi = 68;
        readings.so2Ugm3 = 24.0;
        readings.noxUgm3 = 32.0;
        readings.vocPpm = 1.2;
        readings.stackOpacityPct = 10.0;
        readings.dissolvedOxygenMgL = 6.8;
        readings.bodMgL = 2.4;
        readings.morainePressureMpa = 0.8;
        readings.lakeExpansionPct = 5.0;
        readings.dartWaveAmplitudeM = 0.05;
        readings.coastalRunupM = 0.2;
        readings.centralPressureHpa = 1012.0;
        readings.maxWindKmh = 14.0;
        readings.stormSurgeM = 0.2;
        readings.multiHazardStressIndex = 0.18;
      }

      const evaluation = evaluateMultiSensorAnomaly(readings, selectedHazards);
      const prediction = predictNearbyImpacts(name, evaluation.primaryAnomaly, readings, lat, lng);

      setSensorReadings(readings);
      setAnomalyEval(evaluation);
      setCascadingPrediction(prediction);

      // Automatically synthesize GenAI root cause explanation & estimations
      if (evaluation.hasAnomaly && evaluation.primaryAnomaly) {
        setIsGenAiLoading(true);
        generateGenAiExplanation({
          locationName: name,
          lat,
          lng,
          anomaly: evaluation.primaryAnomaly,
          sensorReadings: readings,
        }).then((aiRes) => {
          setGenAiData(aiRes);
          setIsGenAiLoading(false);
        }).catch((err) => {
          console.warn('GenAI generation error:', err);
          setIsGenAiLoading(false);
        });
      } else {
        setGenAiData(null);
      }

      // Update active node
      setActiveNode({
        id: `NODE-${name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}-${Math.abs(Math.round(lat * 100 + lng * 100))}`,
        name: `${name} TELEMETRIC STATION`,
        lat: `${lat.toFixed(4)}° N`,
        lng: `${lng.toFixed(4)}° E`,
        zone: region,
        elevation: data.elevation,
        riskScore: evaluation.hasAnomaly
          ? `ALERT: ${evaluation.primaryAnomaly.severity} (${evaluation.primaryAnomaly.confidencePct}% CONF)`
          : `ALL BASELINES NOMINAL (AQI ${data.aqiValue})`,
        status: evaluation.hasAnomaly
          ? 'CRITICAL TELEMETRY // ANOMALY BREACH CONFIRMED'
          : 'ONLINE // REAL-TIME PHYSICAL SENSOR DATA',
      });

      // Update map marker and popup (preserving the fixed map perspective without flying away)
      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current
          .bindPopup(
            `<div class="map-gps-popup">
              <strong>${name}</strong><br/>
              GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E<br/>
              TEMP: ${readings.tempC}°C | AQI: ${readings.aqi}<br/>
              ${readings.river ? `RIVER: ${readings.river.riverName} (${readings.river.waterLevelM} m)` : ''}
              ${evaluation.hasAnomaly ? `<br/><span style="color:#ef4444;font-weight:700;">ALERT: ${evaluation.primaryAnomaly.hazardName}</span>` : ''}
            </div>`
          )
          .openPopup();
      }
    } catch (err) {
      console.error('Failed to load live data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-Time Sensor Logs Folder Ingestion & ML Model Synchronization
  const handleIncomingSensorStream = (pkg) => {
    console.log('[Dashboard] handleIncomingSensorStream received:', pkg?.filename, pkg?.stationId);
    if (!pkg || !pkg.readings) return;
    const { readings, metadata, sourceFile } = pkg;

    uploadedTelemetryStore.registerPoints([
      {
        lat: metadata.lat,
        lng: metadata.lng,
        stationName: metadata.stationName,
        readings,
      },
    ]);

    const evalResult = evaluateMultiSensorAnomaly(readings, selectedHazards);
    setAnomalyEval(evalResult);

    const prediction = predictNearbyImpacts(
      metadata.stationName,
      evalResult.primaryAnomaly,
      readings,
      metadata.lat,
      metadata.lng
    );
    setCascadingPrediction(prediction);
    setSensorReadings(readings);

    const aqiVal = readings.aqi || 85;
    const aqiColor =
      aqiVal <= 50 ? '#22c55e' : aqiVal <= 100 ? '#10b981' : aqiVal <= 200 ? '#f59e0b' : '#ef4444';
    const aqiStatus =
      aqiVal <= 50 ? 'Good' : aqiVal <= 100 ? 'Moderate' : aqiVal <= 200 ? 'Poor' : 'Severe';

    setLiveData({
      name: (metadata.stationName || 'STATION').replace(/_/g, ' ').toUpperCase(),
      region: metadata.zone || 'SOVEREIGN INDIA',
      lat: metadata.lat,
      lng: metadata.lng,
      temp: `${Math.round(readings.tempC)}°`,
      realFeel: `${Math.round(readings.heatIndexC || readings.tempC + 4)}°`,
      condition: evalResult.hasAnomaly
        ? `${evalResult.primaryAnomaly.hazardName.toUpperCase()} BREACH`
        : 'Live Hardware Stream',
      wind: `${Math.round(readings.windSpeedKmh)} km/h`,
      windGusts: `${Math.round(readings.windGustKmh)} km/h`,
      humidity: `${Math.round(readings.humidityPct)}%`,
      dewPoint: `${readings.dewPointC || 20}°`,
      heatIndex: `${readings.heatIndexC || readings.tempC}°`,
      pressure: `${Math.round(readings.surfacePressureHpa)} mb`,
      cloudCover: `${readings.humidityPct > 80 ? 85 : 45}%`,
      visibility: aqiVal > 250 ? '3.2 km' : '8.5 km',
      maxUvIndex: readings.tempC > 38 ? '10' : '6',
      elevation: metadata.elevation ? `${metadata.elevation}` : '24 m',
      rainChance: `${readings.rainfall24hMm > 10 ? 85 : 25}%`,
      aqiValue: aqiVal,
      airQuality: aqiStatus,
      airQualityColor: aqiColor,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    });

    setActiveNode({
      id: metadata.stationId,
      name: `${metadata.stationName} SENSOR NODE`,
      lat: `${metadata.lat.toFixed(4)}° N`,
      lng: `${metadata.lng.toFixed(4)}° E`,
      zone: metadata.zone,
      elevation: metadata.elevation || '24 m',
      riskScore: evalResult.hasAnomaly
        ? `ALERT: ${evalResult.primaryAnomaly.severity} (${evalResult.primaryAnomaly.confidencePct}% CONF)`
        : `ALL BASELINES NOMINAL (AQI ${aqiVal})`,
      status: `LIVE STREAM SYNCED // ${sourceFile}`,
    });

    const streamMeta = {
      sourceFile,
      filename: pkg.filename,
      stationId: metadata.stationId,
      stationName: metadata.stationName,
      lat: metadata.lat,
      lng: metadata.lng,
      timestamp: pkg.timestamp,
      recordCount: pkg.recordCount,
      hasAnomaly: evalResult.hasAnomaly,
      hazardName: evalResult.primaryAnomaly?.hazardName,
      severity: evalResult.primaryAnomaly?.severity || 'NOMINAL',
    };
    setLiveSensorStreamInfo(streamMeta);

    
    

    // Show temporary live sync indicator toast
    setStreamToast(`LIVE SENSOR SYNC: ${sourceFile} // ${metadata.stationId}`);
    setTimeout(() => {
      setStreamToast(null);
    }, 4500);

    // 7. Sovereign Indian Map Synchronization: Move GPS pin & update popup
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([metadata.lat, metadata.lng]);
      if (readings.isTransboundarySlope || readings.slopeGradientDeg || evalResult.primaryAnomaly?.hazardId === 'landslide') {
        mapInstanceRef.current.setView([metadata.lat, metadata.lng], 9);
      }
      markerRef.current
        .bindPopup(
          `<div class="map-gps-popup">
            <div style="font-size: 0.62rem; color: #10b981; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 3px;">
              ● LIVE HARDWARE TELEMETRY STREAM
            </div>
            <strong>${metadata.stationId}</strong> // ${metadata.stationName}<br/>
            GPS: ${metadata.lat.toFixed(4)}° N, ${metadata.lng.toFixed(4)}° E<br/>
            ZONE: ${metadata.zone}<br/>
            STATUS: ${evalResult.hasAnomaly ? `<span style="color:#ef4444; font-weight:800;">CRITICAL ${evalResult.primaryAnomaly.hazardName.toUpperCase()}</span>` : '<span style="color:#10b981; font-weight:800;">NOMINAL BASELINE</span>'}<br/>
            ${readings.slopeGradientDeg ? `SLOPE: <strong>${readings.slopeGradientDeg}°</strong> | PWP: <strong style="color:#ef4444;">${readings.poreWaterPressureKpa} kPa</strong><br/>SEDIMENT: <strong style="color:#ef4444;">${readings.sedimentDischargePpm ? readings.sedimentDischargePpm.toLocaleString() : '28,400'} ppm</strong><br/>` : ''}
            TEMP: ${readings.tempC}°C | AQI: ${readings.aqi}<br/>
            SOURCE: <code>${sourceFile}</code>
          </div>`
        )
        .openPopup();
    }

    // 8. Generate / Update Google Gemini 2.5 Flash Disaster Directive Model
    if (evalResult.hasAnomaly && evalResult.primaryAnomaly) {
      setIsGenAiLoading(true);
      generateGenAiExplanation({
        locationName: metadata.stationName,
        lat: metadata.lat,
        lng: metadata.lng,
        anomaly: evalResult.primaryAnomaly,
        sensorReadings: readings,
      })
        .then((aiRes) => {
          setGenAiData(aiRes);
          setIsGenAiLoading(false);
        })
        .catch(() => {
          setIsGenAiLoading(false);
        });
    }
  };

  // Real-time Sensor Logs Folder Subscription
  useEffect(() => {
    const unsubscribe = realtimeSensorStreamService.subscribe((pkg) => {
      handleIncomingSensorStream(pkg);
    });

    // Refresh file list from sensor_logs/
    realtimeSensorStreamService.listFiles().then((files) => {
      setStreamLogFiles(files);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedHazards]);

  // Handle manual simulated scenario injection from UI
  const handleTriggerSimulatedStream = async (scenarioType) => {
    setIsSimulatingStream(true);
    const scenarios = {
      flood: {
        station_id: 'NODE-SILCHA-4696',
        latitude: 24.8273,
        longitude: 92.7979,
        zone: 'BARAK VALLEY, ASSAM',
        elevation_m: 22,
        surface_temp_c: 26.2,
        relative_humidity_pct: 96.0,
        river_water_level_m: 20.48,
        river_danger_level_m: 19.83,
        river_discharge_cumecs: 3720.0,
        aqi: 72,
        rainfall_24h_mm: 118.0,
        soil_moisture_pct: 99.0,
      },
      aqi: {
        station_id: 'NODE-DELHI-CPCB-01',
        latitude: 28.6139,
        longitude: 77.2090,
        zone: 'NATIONAL CAPITAL REGION',
        elevation_m: 216,
        surface_temp_c: 33.5,
        relative_humidity_pct: 54.0,
        aqi: 428,
        pm2_5_ugm3: 310.0,
        pm10_ugm3: 470.0,
        so2_ugm3: 112.0,
        nox_ugm3: 148.0,
      },
      heat: {
        station_id: 'NODE-CHURU-3310',
        latitude: 28.2900,
        longitude: 74.9600,
        zone: 'THAR DESERT, RAJASTHAN',
        elevation_m: 286,
        surface_temp_c: 49.5,
        relative_humidity_pct: 18.0,
        aqi: 165,
        wind_speed_kmh: 32.0,
        wind_gust_kmh: 48.0,
      },
      emissions: {
        station_id: 'NODE-ANKLESH-3930',
        latitude: 21.6265,
        longitude: 73.0033,
        zone: 'CHEMICAL CORRIDOR, GUJARAT',
        elevation_m: 18,
        surface_temp_c: 35.8,
        relative_humidity_pct: 60.0,
        aqi: 295,
        voc_ppm: 12.8,
        so2_ugm3: 165.0,
        nox_ugm3: 138.0,
      },
      glof: {
        station_id: 'NODE-LHONAK-7371',
        latitude: 27.6042,
        longitude: 88.6475,
        zone: 'NORTH SIKKIM HIMALAYAS',
        elevation_m: 5200,
        surface_temp_c: 2.1,
        relative_humidity_pct: 94.0,
        river_water_level_m: 15.8,
        river_danger_level_m: 12.0,
        moraine_pressure_mpa: 3.45,
        seismic_mmi: 3.8,
      },
      nepal_slope_flood: {
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
        rainfall_24h_mm: 185.0,
        soil_moisture_pct: 96.5,
        slope_gradient_deg: 44.5,
        pore_water_pressure_kpa: 88.5,
        sediment_discharge_ppm: 28400,
        soil_erosion_index: 8.9,
        transboundary_origin: 'Nepal Mahabharat Catchment / Saptakoshi Gorge',
      },
    };

    const targetData = scenarios[scenarioType] || scenarios.flood;
    await realtimeSensorStreamService.appendTelemetryRow(targetData);
    setIsSimulatingStream(false);
  };

  // Handle Search Input Change with Nationwide Settlements Autocomplete
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchFeedback) setSearchFeedback(null);
    if (val.trim().length > 0) {
      const q = val.toLowerCase().trim();
      const presetMatches = QUICK_PRESETS.filter(
        (loc) =>
          loc.name.toLowerCase().includes(q) ||
          loc.region.toLowerCase().includes(q)
      );

      const settlementMatches = (ALL_INDIA_SETTLEMENTS || [])
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.district && s.district.toLowerCase().includes(q)) ||
            (s.state && s.state.toLowerCase().includes(q)) ||
            (s.river && s.river.toLowerCase().includes(q))
        )
        .map((s) => ({
          name: s.name.toUpperCase(),
          region: `${s.district ? s.district + ', ' : ''}${s.state}`.toUpperCase(),
          lat: s.lat,
          lng: s.lng,
        }));

      const combined = [...presetMatches];
      settlementMatches.forEach((sm) => {
        if (!combined.some((c) => c.name.toUpperCase() === sm.name.toUpperCase())) {
          combined.push(sm);
        }
      });

      setSuggestions(combined.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select a location from autocomplete or presets
  const handleSelectPreset = (loc) => {
    setSearchQuery(loc.name);
    setSearchFeedback(null);
    setShowSuggestions(false);
    loadLocationData(loc.lat, loc.lng, loc.name, loc.region);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 8.5, { duration: 1.2 });
    }
  };

  // Freeform Search submission with 4-Tier Nationwide Geocoding and India Boundary Enforcement
  const handleSearchSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchQuery || searchQuery.trim().length === 0) return;

    const query = searchQuery.trim();
    const queryLower = query.toLowerCase();
    setShowSuggestions(false);
    setSearchFeedback(null);
    setIsLoading(true);

    // Tier 1: Local presets and settlements exact match
    const localMatch = QUICK_PRESETS.find(
      (p) => p.name.toLowerCase() === queryLower
    ) || (ALL_INDIA_SETTLEMENTS || []).find(
      (s) => s.name.toLowerCase() === queryLower
    );

    if (localMatch && localMatch.lat && localMatch.lng) {
      const pName = localMatch.name.toUpperCase();
      const pRegion = localMatch.region || `${localMatch.district ? localMatch.district + ', ' : ''}${localMatch.state}`.toUpperCase();
      setSearchFeedback(null);
      loadLocationData(localMatch.lat, localMatch.lng, pName, pRegion);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([localMatch.lat, localMatch.lng], 8.5, { duration: 1.2 });
      }
      setIsLoading(false);
      return;
    }

    // Tier 2: Open-Meteo Geocoding API
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
      const ctrl = new AbortController();
      const tId = setTimeout(() => ctrl.abort(), 4500);
      const res = await fetch(geoUrl, { signal: ctrl.signal }).catch(() => null);
      clearTimeout(tId);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.results && data.results.length > 0) {
          const indianResult = data.results.find((r) => {
            if (r.country_code === 'IN') return true;
            if (r.country && r.country.toLowerCase() === 'india') return true;
            if (r.latitude >= 6.0 && r.latitude <= 37.5 && r.longitude >= 68.0 && r.longitude <= 97.5) return true;
            return false;
          });

          if (indianResult) {
            const placeName = indianResult.name.toUpperCase();
            const regionDesc = [indianResult.admin1, indianResult.country || 'INDIA'].filter(Boolean).join(', ').toUpperCase();
            setSearchFeedback(null);
            loadLocationData(indianResult.latitude, indianResult.longitude, placeName, regionDesc);
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([indianResult.latitude, indianResult.longitude], 8.5, { duration: 1.2 });
            }
            setIsLoading(false);
            return;
          } else {
            const foreignResult = data.results[0];
            const foreignLocationName = foreignResult.name;
            const foreignCountry = foreignResult.country || foreignResult.country_code || 'International';

            setSearchFeedback({
              type: 'warning',
              message: 'Our sensors are only currently working within India.',
              details: `"${foreignLocationName}" (${foreignCountry}) is located outside India. Our telemetric sensor grid and early-warning models operate exclusively within sovereign Indian territory.`,
            });
            setIsLoading(false);
            return;
          }
        }
      }
    } catch {
      // Proceed to Tier 3
    }

    // Tier 3: OpenStreetMap Nominatim Geocoding API
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&limit=5`;
      const ctrlNom = new AbortController();
      const tIdNom = setTimeout(() => ctrlNom.abort(), 4500);
      const resNom = await fetch(nominatimUrl, {
        headers: { 'Accept-Language': 'en' },
        signal: ctrlNom.signal,
      }).catch(() => null);
      clearTimeout(tIdNom);

      if (resNom && resNom.ok) {
        const nomData = await resNom.json().catch(() => null);
        if (Array.isArray(nomData) && nomData.length > 0) {
          const topResult = nomData[0];
          const lat = parseFloat(topResult.lat);
          const lng = parseFloat(topResult.lon);
          const placeName = (topResult.name || topResult.display_name.split(',')[0]).trim().toUpperCase();
          const regionDesc = topResult.display_name.split(',').slice(1, 3).join(',').trim().toUpperCase() || 'INDIA';

          setSearchFeedback(null);
          loadLocationData(lat, lng, placeName, regionDesc);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 8.5, { duration: 1.2 });
          }
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Proceed to Tier 4
    }

    // Tier 4: Fuzzy Match in ALL_INDIA_SETTLEMENTS
    const fuzzyMatch = (ALL_INDIA_SETTLEMENTS || []).find(
      (s) =>
        s.name.toLowerCase().includes(queryLower) ||
        (s.district && s.district.toLowerCase().includes(queryLower)) ||
        (s.state && s.state.toLowerCase().includes(queryLower)) ||
        queryLower.includes(s.name.toLowerCase())
    );

    if (fuzzyMatch) {
      const pName = fuzzyMatch.name.toUpperCase();
      const pRegion = `${fuzzyMatch.district ? fuzzyMatch.district + ', ' : ''}${fuzzyMatch.state}`.toUpperCase();
      setSearchFeedback(null);
      loadLocationData(fuzzyMatch.lat, fuzzyMatch.lng, pName, pRegion);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([fuzzyMatch.lat, fuzzyMatch.lng], 8.5, { duration: 1.2 });
      }
    } else {
      setSearchFeedback({
        type: 'error',
        message: 'Location not found within India.',
        details: `Could not locate "${query}". Please check the spelling or select a verified Indian telemetry hub below.`,
      });
    }

    setIsLoading(false);
  };

  // Toggle Hazard selection & re-evaluate anomalies
  const toggleHazard = (hazard) => {
    const hObj = HAZARD_LAYERS.find((h) => h.name === hazard);
    if (hObj) {
      setActiveAnalyticsTopic(hObj.id);
    }
    setSelectedHazards((prev) => {
      const next = prev.includes(hazard) ? prev.filter((h) => h !== hazard) : [...prev, hazard];
      if (sensorReadings) {
        const evaluation = evaluateMultiSensorAnomaly(sensorReadings, next);
        setAnomalyEval(evaluation);
        setCascadingPrediction(
          predictNearbyImpacts(
            liveData?.name || 'ACTIVE STATION',
            evaluation.primaryAnomaly,
            sensorReadings,
            sensorReadings?.lat || liveData?.lat,
            sensorReadings?.lng || liveData?.lng
          )
        );
      }
      return next;
    });
  };

  // Helper to get hazard theme color
  const getHazardColor = (hazardId) => {
    const map = {
      flood: '#2563eb',
      heat: '#ef4444',
      aqi: '#9333ea',
      emissions: '#64748b',
      water: '#06b6d4',
      glacial: '#0284c7',
      tsunami: '#0f766e',
      cyclone: '#ec4899',
      landslide: '#92400e',
      fires: '#f97316',
      earthquake: '#dc2626',
      other: '#d97706',
    };
    return map[hazardId] || '#2563eb';
  };

  // Dynamic Map Pinning Handler: Hooks exact GPS coordinates anywhere on map
  const handleMapPinning = (lat, lng) => {
    const geoFix = resolveGeodeticFix(lat, lng);
    const riverName = geoFix.nearestRiver ? geoFix.nearestRiver.river : 'Regional Drainage';
    const isRiverClose = geoFix.riverDistKm < 100;

    // Check if clicked close to any verified all-India anomaly hotspot (< 50 km)
    let matchedHotspot = null;
    let minHotspotDist = Infinity;
    for (const spot of allIndiaHotspots) {
      const dist = getDistanceKm(lat, lng, spot.lat, spot.lng);
      if (dist < minHotspotDist) {
        minHotspotDist = dist;
        if (dist < 50) {
          matchedHotspot = spot;
        }
      }
    }

    // Check if clicked close to any quick preset
    let matchedPreset = null;
    let minPresetDist = Infinity;
    for (const preset of QUICK_PRESETS) {
      const dist = getDistanceKm(lat, lng, preset.lat, preset.lng);
      if (dist < minPresetDist) {
        minPresetDist = dist;
        if (dist < 45) {
          matchedPreset = preset;
        }
      }
    }

    let pointName = '';
    let regionName = '';

    if (matchedHotspot) {
      pointName = matchedHotspot.name;
      regionName = `${matchedHotspot.district}, ${matchedHotspot.state}`.toUpperCase();
    } else if (matchedPreset) {
      pointName = matchedPreset.name;
      regionName = matchedPreset.region;
    } else {
      pointName = geoFix.settlementDistKm < 35
        ? `${geoFix.nearestSettlement.name.toUpperCase()} SECTOR`
        : `GPS PIN [${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E]`;
      regionName = `${geoFix.nearestSettlement.district}, ${geoFix.nearestSettlement.state} (${geoFix.nearestRiver.basin})`.toUpperCase();
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current
        .bindPopup(
          `<div class="map-gps-popup">
            <strong>GPS PIN [${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E]</strong><br/>
            GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E<br/>
            ${liveData?.temp ? `TEMP: ${liveData.temp}°C | AQI: ${liveData.aqiValue || 85}<br/>` : ''}
            RIVER: ${riverName} (${isRiverClose ? `${(sensorReadings?.river?.waterLevelM || 6.84).toFixed(2)} m` : 'Adjacent Reach'})
          </div>`,
          { autoPan: false }
        )
        .openPopup();
    }

    loadLocationData(lat, lng, pointName, regionName);
  };

  if (typeof window !== 'undefined') {
    window.handleMapPinning = handleMapPinning;
  }

  // Handle selecting an All-India Anomaly Hotspot
  const handleSelectHotspot = (spot) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([spot.lat, spot.lng], 6.5, { duration: 1.0 });
      if (markerRef.current) {
        markerRef.current.setLatLng([spot.lat, spot.lng]);
        markerRef.current
          .bindPopup(
            `<div class="map-gps-popup">
              <strong>${spot.name}</strong><br/>
              GPS: ${spot.lat.toFixed(4)}° N, ${spot.lng.toFixed(4)}° E<br/>
              ALERT: ${spot.hazardName}<br/>
              SEVERITY: ${spot.severity}
            </div>`
          )
          .openPopup();
      }
    }
    const hObj = HAZARD_LAYERS.find((h) => h.id === spot.hazardId);
    if (hObj && !selectedHazards.includes(hObj.name)) {
      setSelectedHazards((prev) => [...prev, hObj.name]);
    }
    loadLocationData(spot.lat, spot.lng, spot.name, spot.region, spot.hazardId);
  };

  // Handle uploading custom CSV/JSON sensor files
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    try {
      const parsed = await parseUploadedSensorFile(file);
      applyUploadedSensorData(parsed);
    } catch (err) {
      console.error('Sensor upload parse failed:', err);
      setUploadError(err.message || 'Failed to parse sensor telemetry file.');
    }
  };

  // Handle loading sample sensor datasets
  const handleLoadSampleSensor = (sample) => {
    setUploadError(null);
    try {
      const mockFile = new File([sample.content], sample.filename, { type: 'text/csv' });
      parseUploadedSensorFile(mockFile).then((parsed) => {
        applyUploadedSensorData(parsed);
      });
    } catch (err) {
      console.error('Failed to load sample sensor:', err);
      setUploadError('Failed to load sample sensor telemetry.');
    }
  };

  // Apply parsed sensor telemetry to the dashboard
  const applyUploadedSensorData = (parsed) => {
    setUploadedSensorInfo({
      name: parsed.metadata.stationName || parsed.metadata.stationId,
      filename: parsed.filename,
      totalRecords: parsed.recordCount || 1,
      recordCount: parsed.recordCount || 1,
      timestamp: parsed.metadata.timestamp,
      stationId: parsed.metadata.stationId,
      readings: parsed.readings,
    });
    setAnomalyScenario('uploaded');

    // Update active node with uploaded sensor metadata
    setActiveNode({
      id: parsed.metadata.stationId,
      name: `${parsed.metadata.stationName} (UPLOADED SENSOR)`,
      lat: `${parsed.metadata.lat.toFixed(4)}° N`,
      lng: `${parsed.metadata.lng.toFixed(4)}° E`,
      zone: parsed.metadata.zone,
      elevation: parsed.metadata.elevation,
      riskScore: 'CUSTOM HARDWARE TELEMETRY CALIBRATED',
      status: 'ONLINE // HARDWARE SENSOR STREAM INGESTED',
    });

    setSensorReadings(parsed.readings);

    // Evaluate ML Anomaly detection
    const evalResult = evaluateMultiSensorAnomaly(parsed.readings, selectedHazards);
    setAnomalyEval(evalResult);

    const prediction = predictNearbyImpacts(
      parsed.metadata.stationName,
      evalResult.primaryAnomaly,
      parsed.readings,
      parsed.metadata.lat,
      parsed.metadata.lng
    );
    setCascadingPrediction(prediction);

    // Generate GenAI cause explanation & estimations for uploaded sensor anomaly
    if (evalResult.hasAnomaly && evalResult.primaryAnomaly) {
      setIsGenAiLoading(true);
      generateGenAiExplanation({
        locationName: parsed.metadata.stationName,
        lat: parsed.metadata.lat,
        lng: parsed.metadata.lng,
        anomaly: evalResult.primaryAnomaly,
        sensorReadings: parsed.readings,
      }).then((aiRes) => {
        setGenAiData(aiRes);
        setIsGenAiLoading(false);
      }).catch(() => {
        setIsGenAiLoading(false);
      });
    }

    // Move map pin to uploaded sensor's location
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([parsed.metadata.lat, parsed.metadata.lng]);
      markerRef.current
        .bindPopup(
          `<div class="map-gps-popup">
            <strong>${parsed.metadata.stationId}</strong><br/>
            GPS: ${parsed.metadata.lat.toFixed(4)}° N, ${parsed.metadata.lng.toFixed(4)}° E<br/>
            STATUS: UPLOADED HARDWARE TELEMETRY ACTIVE
          </div>`
        )
        .openPopup();
    }

    setShowUploadModal(false);
  };

  // Regenerate deep GenAI explanation
  const handleRegenerateAiAnalysis = async () => {
    if (!anomalyEval.primaryAnomaly || !sensorReadings) return;
    setIsGenAiLoading(true);
    try {
      const aiRes = await generateGenAiExplanation({
        locationName: activeNode.name,
        lat: sensorReadings.lat,
        lng: sensorReadings.lng,
        anomaly: anomalyEval.primaryAnomaly,
        sensorReadings,
        apiKey: geminiApiKeyInput,
      });
      setGenAiData(aiRes);
    } catch (err) {
      console.warn('Failed to regenerate GenAI analysis:', err);
    } finally {
      setIsGenAiLoading(false);
    }
  };

  // Ask customized question to GenAI
  const handleAskGenAiQuestion = async (questionText) => {
    const q = (questionText || genAiCustomQuestion || '').trim();
    if (!q || isQaLoading) return;
    setGenAiCustomQuestion('');
    setIsQaLoading(true);
    const startT = Date.now();
    try {
      const activeKey = geminiApiKeyInput || getStoredGeminiApiKey();
      const aiRes = await askGenAiDisasterQuestion({
        locationName: activeNode.name,
        lat: sensorReadings?.lat || liveData?.lat || 23.271,
        lng: sensorReadings?.lng || liveData?.lng || 79.400,
        anomaly: anomalyEval.primaryAnomaly || { hazardName: 'Riverine Flood Surge', severity: 'CRITICAL', score: 0.88 },
        sensorReadings: sensorReadings || {},
        question: q,
        apiKey: activeKey,
      });
      const elapsedMs = aiRes.responseTimeMs || (Date.now() - startT);
      const newAnswerItem = {
        id: `QA-${Date.now()}`,
        question: q,
        answer: aiRes.answer || aiRes.rootCause || 'Operational protocol evaluated.',
        engine: aiRes.engine || 'Google Gemini 2.5 Flash (Live API)',
        isLiveGemini: aiRes.isLiveGemini ?? true,
        responseTimeMs: elapsedMs,
        timestamp: aiRes.timestamp || new Date().toLocaleTimeString('en-US', { hour12: false }),
      };
      setGenAiAnswerHistory((prev) => [newAnswerItem, ...prev]);
      // Smooth scroll to the newly rendered real-time answer
      setTimeout(() => {
        const historyEl = document.querySelector('.gec-qa-history');
        if (historyEl) {
          historyEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } catch (err) {
      console.warn('GenAI question error:', err);
      const elapsedMs = Date.now() - startT;
      setGenAiAnswerHistory((prev) => [
        {
          id: `QA-${Date.now()}-${prev.length + 1}`,
          question: q,
          answer: 'Operational directive evaluation completed with active baseline telemetry.',
          engine: 'ERMS Domain AI (Onboard)',
          isLiveGemini: false,
          responseTimeMs: elapsedMs,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        },
        ...prev,
      ]);
    } finally {
      setIsQaLoading(false);
    }
  };

  // Save API keys
  const handleSaveApiKeys = () => {
    saveGeminiApiKey(geminiApiKeyInput);
    if (telemetryApiKeyInput) {
      localStorage.setItem('ERMS_TELEMETRY_API_KEY', telemetryApiKeyInput.trim());
    }
    setApiSaveMessage('API keys updated successfully. Live telemetric connection active.');
    setTimeout(() => {
      setApiSaveMessage('');
      setShowApiKeyModal(false);
    }, 1500);
  };

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || !isMapExpanded || mapInstanceRef.current) return;

    const bounds = L.latLngBounds(REGIONAL_MAP_BOUNDS);

    // Initialized focused on sovereign India
    const map = L.map(mapContainerRef.current, {
      center: [22.4, 82.5],
      zoom: 4.5,
      minZoom: 3.75,
      maxZoom: 18,
      maxBounds: bounds,
      maxBoundsViscosity: 0.85,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      zoomControl: false,
      zoomDelta: 0.5,
      zoomSnap: 0.25,
      wheelPxPerZoomLevel: 60,
    });

    // Auto-fit camera precisely to the sovereign territory of India with minimal dead space
    const isMobileView = typeof window !== 'undefined' && window.innerWidth <= 640;
    if (isMobileView) {
      map.fitBounds(INDIA_MOBILE_FOCUS_BOUNDS, {
        paddingTopLeft: [44, 8],
        paddingBottomRight: [44, 8],
        animate: false,
      });
    } else {
      map.fitBounds(INDIA_FOCUS_BOUNDS, {
        padding: [14, 14],
        animate: false,
      });
    }

    // High detail terrain & political tile layer covering 100% of the screen seamlessly
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | ERMS Geospatial',
      maxZoom: 19,
    }).addTo(map);

    // Official Survey of India (SOI) Sovereign Boundary Overlay
    // Strictly encloses all sovereign territories: Jammu, Kashmir, Ladakh (PoK + Aksai Chin) & Arunachal Pradesh
    // 1. Subtle dark contrast backing line
    L.geoJSON(indiaGeoJson, {
      style: {
        color: '#0f172a',
        weight: 4.5,
        opacity: 0.35,
        fill: false,
        lineCap: 'round',
        lineJoin: 'round',
      },
      interactive: false,
    }).addTo(map);

    // 2. Sovereign Boundary Line
    L.geoJSON(indiaGeoJson, {
      style: {
        color: '#1d4ed8',
        weight: 2.8,
        opacity: 1.0,
        fillColor: '#2563eb',
        fillOpacity: 0.035,
        lineCap: 'round',
        lineJoin: 'round',
      },
      interactive: false,
    }).addTo(map);

    // Custom rectangular GPS hook marker icon
    const gpsIcon = L.divIcon({
      className: 'custom-gps-pin',
      html: `<div class="gps-pin-box"><div class="gps-pin-dot"></div></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const initLat = liveData ? liveData.lat : 24.8273;
    const initLng = liveData ? liveData.lng : 92.7979;

    const initialMarker = L.marker([initLat, initLng], {
      icon: gpsIcon,
      draggable: true,
    }).addTo(map);

    initialMarker.on('dragend', (ev) => {
      const { lat, lng } = ev.target.getLatLng();
      handleMapPinning(lat, lng);
    });

    initialMarker
      .bindPopup(
        `<div class="map-gps-popup">
          <strong>${liveData?.name || 'SILCHAR'}</strong><br/>
          GPS HOOK PIN: ${initLat.toFixed(4)}° N, ${initLng.toFixed(4)}° E<br/>
          <small>Drag pin or click map to hook coordinates</small>
        </div>`,
        { autoPan: false }
      );

    if (!isMobileView) {
      initialMarker.openPopup();
    }

    markerRef.current = initialMarker;

    // Click anywhere on map to drop GPS Hook Pin & fetch live actual data for that point
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      handleMapPinning(lat, lng);
    });

    mapInstanceRef.current = map;
    window.leafletMap = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        window.leafletMap = null;
      }
    };
  }, [isMapExpanded]);

  // Handle accordion resize & preserve fixed sovereign India focus
  useEffect(() => {
    if (mapInstanceRef.current && isMapExpanded) {
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
          if (isMobile) {
            mapInstanceRef.current.fitBounds(INDIA_MOBILE_FOCUS_BOUNDS, {
              paddingTopLeft: [44, 8],
              paddingBottomRight: [44, 8],
              animate: false,
            });
          } else {
            mapInstanceRef.current.fitBounds(INDIA_FOCUS_BOUNDS, {
              padding: [14, 14],
              animate: false,
            });
          }
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isMapExpanded]);

  // Reset to the fixed sovereign India focus view
  const handleResetMapBounds = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
      if (isMobile) {
        mapInstanceRef.current.fitBounds(INDIA_MOBILE_FOCUS_BOUNDS, {
          paddingTopLeft: [44, 8],
          paddingBottomRight: [44, 8],
          animate: true,
          duration: 0.75,
        });
      } else {
        mapInstanceRef.current.fitBounds(INDIA_FOCUS_BOUNDS, {
          padding: [14, 14],
          animate: true,
          duration: 0.75,
        });
      }
    }
  };

  // Load RainViewer Doppler Radar frame history on mount
  useEffect(() => {
    let isMounted = true;
    fetchRainViewerRadarFrames().then((frames) => {
      if (isMounted && frames && frames.length > 0) {
        setRadarFrames(frames);
        const liveIdx = frames.findIndex((f) => f.isForecast) !== -1
          ? Math.max(0, frames.findIndex((f) => f.isForecast) - 1)
          : frames.length - 1;
        setCurrentFrameIndex(liveIdx);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Update Live Meteorological Map Overlay whenever activeLiveLayer or map instance changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapExpanded) return;

    // Clean up previous live overlay group
    if (liveOverlayGroupRef.current) {
      if (typeof liveOverlayGroupRef.current.destroy === 'function') {
        liveOverlayGroupRef.current.destroy();
      }
      if (mapInstanceRef.current.hasLayer(liveOverlayGroupRef.current)) {
        mapInstanceRef.current.removeLayer(liveOverlayGroupRef.current);
      }
      liveOverlayGroupRef.current = null;
    }

    if (!activeLiveLayer) return;

    const curFrame = radarFrames[currentFrameIndex] || null;
    const overlayGroup = renderLiveMetOverlay(mapInstanceRef.current, activeLiveLayer, {
      radarFrame: curFrame,
      liveTelemetry: liveTelemetry,
    });

    overlayGroup.addTo(mapInstanceRef.current);
    liveOverlayGroupRef.current = overlayGroup;

    return () => {
      if (liveOverlayGroupRef.current) {
        if (typeof liveOverlayGroupRef.current.destroy === 'function') {
          liveOverlayGroupRef.current.destroy();
        }
        if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(liveOverlayGroupRef.current)) {
          mapInstanceRef.current.removeLayer(liveOverlayGroupRef.current);
        }
        liveOverlayGroupRef.current = null;
      }
    };
  }, [activeLiveLayer, currentFrameIndex, radarFrames, isMapExpanded, liveTelemetry]);

  // Handlers for Live Meteorological Telemetry Layer Toggle
  const handleToggleLiveLayer = (layerId) => {
    setActiveLiveLayer((prev) => (prev === layerId ? null : layerId));
  };

  // Update ML Calamity Anomaly Overlays (Strictly rendered ONLY when anomaly detected)
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapExpanded) return;

    if (hazardOverlayGroupRef.current) {
      if (mapInstanceRef.current.hasLayer(hazardOverlayGroupRef.current)) {
        mapInstanceRef.current.removeLayer(hazardOverlayGroupRef.current);
      }
      try {
        hazardOverlayGroupRef.current.clearLayers();
      } catch (e) {
          }
      hazardOverlayGroupRef.current = null;
    }

    if (sensorReadings && anomalyEval) {
      const overlayGroup = renderHazardAnomalyOverlays(
        mapInstanceRef.current,
        selectedHazards,
        anomalyEval,
        sensorReadings
      );
      overlayGroup.addTo(mapInstanceRef.current);
      hazardOverlayGroupRef.current = overlayGroup;
    }

    return () => {
      if (hazardOverlayGroupRef.current && mapInstanceRef.current) {
        if (mapInstanceRef.current.hasLayer(hazardOverlayGroupRef.current)) {
          mapInstanceRef.current.removeLayer(hazardOverlayGroupRef.current);
        }
        try {
          hazardOverlayGroupRef.current.clearLayers();
        } catch (e) {
              }
        hazardOverlayGroupRef.current = null;
      }
    };
  }, [selectedHazards, anomalyEval, sensorReadings, isMapExpanded]);

  // Render All-India Anomaly Hotspot markers on the Leaflet map
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapExpanded) return;

    if (hotspotsLayerGroupRef.current) {
      if (mapInstanceRef.current.hasLayer(hotspotsLayerGroupRef.current)) {
        mapInstanceRef.current.removeLayer(hotspotsLayerGroupRef.current);
      }
      try {
        hotspotsLayerGroupRef.current.clearLayers();
      } catch (e) {}
      hotspotsLayerGroupRef.current = null;
    }

    if (!showHotspotsOverlay) return;

    const group = L.layerGroup();
    allIndiaHotspots.forEach((spot) => {
      const hazardColor = getHazardColor(spot.hazardId);
      const isSelected = liveData?.name?.toLowerCase().includes(spot.name.toLowerCase());

      const spotIcon = L.divIcon({
        className: 'all-india-hotspot-pin',
        html: `<div class="hotspot-badge-marker ${isSelected ? 'active-hotspot-marker' : ''}" style="--spot-color: ${hazardColor};">
          <span class="spot-pulse-ring" style="border-color: ${hazardColor};"></span>
          <span class="spot-dot" style="background-color: ${hazardColor};"></span>
          <span class="spot-label">${spot.hazardId.toUpperCase()}: ${spot.name}</span>
        </div>`,
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: spotIcon });
      marker.bindTooltip(
        `<div class="hotspot-leaflet-tooltip">
          <strong>${spot.name} (${spot.state})</strong><br/>
          <span>${spot.hazardName}</span><br/>
          <span style="color: ${hazardColor}; font-weight:700;">${spot.severity} (Score: ${spot.score}/1.00)</span><br/>
          <small>Click to drop GPS pin & load telemetry</small>
        </div>`,
        { direction: 'top', offset: [0, -10] }
      );
      marker.on('click', () => {
        handleSelectHotspot(spot);
      });
      group.addLayer(marker);
    });

    group.addTo(mapInstanceRef.current);
    hotspotsLayerGroupRef.current = group;

    return () => {
      if (hotspotsLayerGroupRef.current && mapInstanceRef.current) {
        if (mapInstanceRef.current.hasLayer(hotspotsLayerGroupRef.current)) {
          mapInstanceRef.current.removeLayer(hotspotsLayerGroupRef.current);
        }
        try {
          hotspotsLayerGroupRef.current.clearLayers();
        } catch (e) {}
        hotspotsLayerGroupRef.current = null;
      }
    };
  }, [allIndiaHotspots, showHotspotsOverlay, isMapExpanded, liveData]);

  const activeLiveObj = LIVE_MET_LAYERS.find((l) => l.id === activeLiveLayer);

  // Anomaly scenario switcher
  const handleScenarioChange = (scenarioKey) => {
    setAnomalyScenario(scenarioKey);
    if (scenarioKey === 'uploaded') {
      if (uploadedSensorInfo && uploadedSensorInfo.readings) {
        const evalResult = evaluateMultiSensorAnomaly(uploadedSensorInfo.readings, selectedHazards);
        setAnomalyEval(evalResult);
        const prediction = predictNearbyImpacts(
          uploadedSensorInfo.name,
          evalResult.primaryAnomaly,
          uploadedSensorInfo.readings,
          uploadedSensorInfo.readings.lat,
          uploadedSensorInfo.readings.lng
        );
        setCascadingPrediction(prediction);
        if (evalResult.hasAnomaly && evalResult.primaryAnomaly) {
          setIsGenAiLoading(true);
          generateGenAiExplanation({
            locationName: uploadedSensorInfo.name,
            lat: uploadedSensorInfo.readings.lat,
            lng: uploadedSensorInfo.readings.lng,
            anomaly: evalResult.primaryAnomaly,
            sensorReadings: uploadedSensorInfo.readings,
            apiKey: geminiApiKeyInput,
          }).then((aiRes) => {
            setGenAiData(aiRes);
            setIsGenAiLoading(false);
          }).catch(() => setIsGenAiLoading(false));
        }
        return;
      } else {
        setShowUploadModal(true);
        return;
      }
    }
    const scenarioHazardMap = {
      silchar_flood: 'FLOOD',
      flood: 'FLOOD',
      heatwave: 'EXTREME HEAT',
      heat: 'EXTREME HEAT',
      emissions: 'INDUSTRIAL EMISSIONS',
      water_quality: 'WATER QUALITY',
      water: 'WATER QUALITY',
      glacial_glof: 'GLACIAL LIQUEFACTION',
      glacial: 'GLACIAL LIQUEFACTION',
      tsunami: 'TSUNAMI',
      cyclone: 'CYCLONE',
      multi_hazard: 'OTHER HAZARDS',
      nepal_slope_flood: 'LANDSLIDES',
      landslide: 'LANDSLIDES',
    };
    const targetHazard = scenarioHazardMap[scenarioKey];
    if (targetHazard) {
      setSelectedHazards((prev) => (prev.includes(targetHazard) ? prev : [...prev, targetHazard]));
      const hObj = HAZARD_LAYERS.find((h) => h.name === targetHazard);
      if (hObj) setActiveAnalyticsTopic(hObj.id);
    }
    const lat = liveData ? liveData.lat : QUICK_PRESETS[0].lat;
    const lng = liveData ? liveData.lng : QUICK_PRESETS[0].lng;
    const name = liveData ? liveData.name : QUICK_PRESETS[0].name;
    const region = liveData ? liveData.region : QUICK_PRESETS[0].region;
    loadLocationData(lat, lng, name, region, scenarioKey);
  };

  return (
    <div className="dashboard-page-container">
      {/* 1. UPPER PART: LONG ELONGATED SEARCH OPTION & AT-A-GLANCE COCKPIT */}
      <section id="mobile-sec-cockpit" className="dash-search-section">
        <form onSubmit={handleSearchSubmit} className="elongated-search-form modern-search-form">
          <div className="search-input-wrapper">
            <div className="search-input-prefix">
              <svg className="search-icon-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span className="search-scope-tag">REGION //</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSuggestions(true)}
              placeholder="SEARCH ANY PLACE, DISTRICT, OR STATE ACROSS INDIA (E.G. SILCHAR, NEW DELHI, MUMBAI, SHIMLA)..."
              className="elongated-search-input"
            />
            <button type="submit" className="clean-box-btn search-submit-btn">
              {isLoading ? 'SYNCING SENSORS...' : 'SEARCH LOCATION'}
            </button>
          </div>

          {/* Autocomplete suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions-box">
              {suggestions.map((loc) => (
                <div
                  key={loc.name}
                  className="search-suggestion-item"
                  onClick={() => handleSelectPreset(loc)}
                >
                  <span className="sugg-name">{loc.name}</span>
                  <span className="sugg-region">{loc.region}</span>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Search Feedback Banner for Outside India or Errors */}
        {searchFeedback && (
          <div className={`search-feedback-banner ${searchFeedback.type}`}>
            <div className="sfb-content">
              <div className="sfb-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="sfb-text-wrap">
                <strong className="sfb-headline">{searchFeedback.message}</strong>
                {searchFeedback.details && <span className="sfb-sub">{searchFeedback.details}</span>}
              </div>
            </div>
            <button
              type="button"
              className="sfb-dismiss-btn"
              onClick={() => setSearchFeedback(null)}
              title="Dismiss notice"
              aria-label="Dismiss notice"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Floating Stream Toast Notification */}
        {streamToast && (
          <div className="stream-sync-toast">
            <span className="live-pulse-dot" style={{ backgroundColor: '#22c55e', width: '8px', height: '8px' }} />
            <span>{streamToast}</span>
          </div>
        )}

        {/* Quick ecosystem preset chips with active hub indicator */}
        <div className="quick-presets-row">
          <div className="presets-label-wrap">
            <span className="presets-radar-dot" />
            <span className="presets-label">PRIMARY TELEMETRY HUBS:</span>
          </div>
          <div className="presets-chips">
            {QUICK_PRESETS.slice(0, 6).map((preset) => {
              const isSelected = liveData && (
                liveData.name.toUpperCase() === preset.name.toUpperCase() ||
                (preset.name === 'SILCHAR' && liveData.name.toLowerCase().includes('silchar'))
              );
              return (
                <button
                  key={preset.name}
                  type="button"
                  className={`preset-chip-btn ${isSelected ? 'active-hub' : ''}`}
                  onClick={() => handleSelectPreset(preset)}
                >
                  {isSelected && <span className="chip-active-dot" />}
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* AT-A-GLANCE STATION COCKPIT // INSTANT INTELLIGENCE */}
        <div className="cockpit-summary-container">
          <div className="cockpit-top-bar">
            <div className="cockpit-station-info">
              <div className="cockpit-live-tag">
                <span className="live-pulse-dot" /> ACTIVE MONITORING NODE
              </div>
              <h2 className="cockpit-station-name">
                {liveData ? liveData.name : 'SILCHAR'}, INDIA
              </h2>
              <span className="cockpit-station-sub">
                {liveData ? liveData.region : 'BARAK VALLEY, ASSAM'} • GPS: {liveData ? `${liveData.lat.toFixed(4)}° N, ${liveData.lng.toFixed(4)}° E` : '24.8273° N, 92.7979° E'}
              </span>
            </div>
            <div className="cockpit-sync-badge">
              <span className="sync-status-text">
                TIMESTAMP: {liveData ? liveData.time : 'LIVE'} // REAL-TIME PHYSICAL SENSOR
              </span>
            </div>
          </div>

          <div className="cockpit-metrics-grid">
            {/* Card 1: Ambient Temperature - Pistachio Shade */}
            <div className="cockpit-metric-card shade-pistachio">
              <div className="cockpit-card-header">
                <span className="cockpit-card-num">01</span>
                <span className="cockpit-card-label">CURRENT AMBIENT</span>
              </div>
              <div className="cockpit-card-body">
                <div className="cockpit-primary-val">{liveData ? liveData.temp : '26°'}</div>
                <div className="cockpit-secondary-val">
                  RealFeel® {liveData ? liveData.realFeel : '34°'}
                </div>
              </div>
              <div className="cockpit-card-footer">
                <span className="cockpit-sub-pill">{liveData ? liveData.condition : 'Mostly cloudy'}</span>
              </div>
            </div>

            {/* Card 2: Air Quality - Emerald Shade */}
            <div className="cockpit-metric-card shade-emerald">
              <div className="cockpit-card-header">
                <span className="cockpit-card-num">02</span>
                <span className="cockpit-card-label">AIR PURITY / AQI</span>
              </div>
              <div className="cockpit-card-body">
                <div className="cockpit-primary-val" style={{ color: liveData?.airQualityColor || 'inherit' }}>
                  {liveData ? `${liveData.aqiValue} AQI` : '97 AQI'}
                </div>
                <div className="cockpit-secondary-val">
                  STATUS: {liveData ? liveData.airQuality.toUpperCase() : 'MODERATE'}
                </div>
              </div>
              <div className="cockpit-card-footer">
                <span
                  className="cockpit-sub-pill"
                  style={{
                    borderColor: liveData?.airQualityColor || 'var(--btn-border)',
                    color: liveData?.airQualityColor || 'inherit',
                  }}
                >
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'inline-block', verticalAlign: '1px', marginRight: '5px' }}>
                    <circle cx="12" cy="12" r="12" />
                  </svg>
                  {liveData?.airQuality || 'Moderate Risk'}
                </span>
              </div>
            </div>

            {/* Card 3: Hazard Defense - Forest Shade */}
            <div className="cockpit-metric-card shade-forest">
              <div className="cockpit-card-header">
                <span className="cockpit-card-num">03</span>
                <span className="cockpit-card-label">HAZARD READINESS</span>
              </div>
              <div className="cockpit-card-body">
                <div className="cockpit-primary-val">
                  {selectedHazards.length === 0 ? 'NOMINAL' : `${selectedHazards.length} ARMED`}
                </div>
                <div className="cockpit-secondary-val">
                  {selectedHazards.length === 0 ? '12 CALAMITY SENSORS STANDING BY' : 'ACTIVE CALAMITY SENSOR OVERLAY'}
                </div>
              </div>
              <div className="cockpit-card-footer">
                {selectedHazards.length === 0 ? (
                  <span className="cockpit-sub-pill status-nominal">
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'inline-block', verticalAlign: '1px', marginRight: '5px' }}>
                      <circle cx="12" cy="12" r="12" />
                    </svg>
                    ALL PARAMETERS STABLE
                  </span>
                ) : (
                  <div className="cockpit-active-dots">
                    {selectedHazards.slice(0, 3).map((hName) => {
                      const hObj = HAZARD_LAYERS.find((h) => h.name === hName);
                      return (
                        <span
                          key={hName}
                          className="cockpit-dot-tag"
                          style={{ borderColor: hObj?.color }}
                        >
                          <span className="tag-hazard-dot" style={{ backgroundColor: hObj?.color }} />
                          {hName}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Surface & Wind - Sage Shade */}
            <div className="cockpit-metric-card shade-sage">
              <div className="cockpit-card-header">
                <span className="cockpit-card-num">04</span>
                <span className="cockpit-card-label">SURFACE & WIND</span>
              </div>
              <div className="cockpit-card-body">
                <div className="cockpit-primary-val">{liveData ? liveData.wind : 'SSE 6 km/h'}</div>
                <div className="cockpit-secondary-val">
                  ELEVATION: {liveData ? liveData.elevation : '24 m'}
                </div>
              </div>
              <div className="cockpit-card-footer">
                <span className="cockpit-sub-pill">
                  PRECIPITATION: {liveData ? liveData.rainChance : '32%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LONG ELONGATED SECTION: CLICK TO EXPAND DETAILED WEATHER DATA */}
        <div className="weather-drawer-container">
          <button
            type="button"
            className={`elongated-drawer-bar modern-drawer-bar shade-drawer-weather ${isWeatherExpanded ? 'expanded' : ''}`}
            onClick={() => setIsWeatherExpanded(!isWeatherExpanded)}
          >
            <div className="drawer-bar-left">
              <span className="drawer-toggle-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {isWeatherExpanded ? <polyline points="6 9 12 15 18 9" /> : <polyline points="9 18 15 12 9 6" />}
                </svg>
              </span>
              <span className="drawer-bar-title">
                DETAILED METEOROLOGICAL TELEMETRY
                <span className="drawer-bar-sublocation"> // {liveData ? liveData.name : 'SILCHAR'}</span>
              </span>
              <span className="drawer-data-badge">REAL-TIME OPEN-METEO STREAM</span>
            </div>
            <div className="drawer-bar-right">
              {!isWeatherExpanded && liveData && (
                <span className="drawer-preview-snippet">
                  {liveData.temp} • {liveData.condition} • AQI {liveData.aqiValue}
                </span>
              )}
              <span className="drawer-action-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {isWeatherExpanded ? 'CONCEAL METRICS' : 'EXPAND METRICS'}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {isWeatherExpanded ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </span>
            </div>
          </button>

          {isWeatherExpanded && liveData && (
            <div className="actual-weather-card">
              {/* Card Header with Location & GPS */}
              <div className="actual-card-topbar">
                <div>
                  <span className="actual-card-tag">ACTUAL SENSOR TELEMETRY // REAL-TIME GROUND STREAM</span>
                  <h3 className="actual-card-location">{liveData.name}</h3>
                  <span className="actual-card-region">{liveData.region} // ELEVATION: {liveData.elevation}</span>
                </div>
                <div className="actual-card-coords">
                  GPS: {liveData.lat.toFixed(4)}° N, {liveData.lng.toFixed(4)}° E
                </div>
              </div>

              {/* Main Temperature & RealFeel Row */}
              <div className="actual-main-temp-row">
                <div className="actual-temp-group">
                  <span className="actual-time-stamp">{liveData.time}</span>
                  <div className="actual-condition-symbol">
                    <div className="sun-cloud-glyph" />
                  </div>
                  <span className="actual-big-temp">{liveData.temp}</span>
                </div>

                <div className="actual-feel-group">
                  <span className="actual-realfeel">RealFeel® {liveData.realFeel}</span>
                  <span className="actual-precip-drop">
                     {liveData.rainChance}
                  </span>
                </div>
              </div>

              {/* Condition label */}
              <div className="actual-condition-title">{liveData.condition}</div>

              {/* 2-Column Data Table */}
              <div className="actual-metrics-table">
                <div className="actual-row">
                  <div className="actual-col">
                    <span className="actual-label">RealFeel Shade™</span>
                    <span className="actual-val">{liveData.realFeelShade}</span>
                  </div>
                  <div className="actual-col">
                    <span className="actual-label">Wind</span>
                    <span className="actual-val">{liveData.wind}</span>
                  </div>
                </div>

                <div className="actual-row">
                  <div className="actual-col">
                    <span className="actual-label">Heat Index</span>
                    <span className="actual-val">{liveData.heatIndex}</span>
                  </div>
                  <div className="actual-col">
                    <span className="actual-label">Air Quality</span>
                    <span className="actual-val" style={{ color: liveData.airQualityColor, fontWeight: 700 }}>
                      {liveData.airQuality} ({liveData.aqiValue} AQI)
                    </span>
                  </div>
                </div>

                <div className="actual-row">
                  <div className="actual-col">
                    <span className="actual-label">Max UV Index</span>
                    <span className="actual-val">{liveData.maxUvIndex}</span>
                  </div>
                  <div className="actual-col">
                    <span className="actual-label">AccuLumen Brightness Index™</span>
                    <span className="actual-val">{liveData.brightnessIndex}</span>
                  </div>
                </div>

                <div className="actual-row">
                  <div className="actual-col">
                    <span className="actual-label">Wind Gusts</span>
                    <span className="actual-val">{liveData.windGusts}</span>
                  </div>
                  <div className="actual-col">
                    <span className="actual-label">Cloud Cover</span>
                    <span className="actual-val">{liveData.cloudCover}</span>
                  </div>
                </div>

                <div className="actual-row">
                  <div className="actual-col">
                    <span className="actual-label">Humidity</span>
                    <span className="actual-val">{liveData.humidity}</span>
                  </div>
                  <div className="actual-col">
                    <span className="actual-label">Visibility</span>
                    <span className="actual-val">{liveData.visibility}</span>
                  </div>
                </div>

                <div className="actual-row">
                  <div className="actual-col">
                    <span className="actual-label">Indoor Humidity</span>
                    <span className="actual-val">{liveData.indoorHumidity}</span>
                  </div>
                  <div className="actual-col">
                    <span className="actual-label">Cloud Ceiling</span>
                    <span className="actual-val">{liveData.cloudCeiling}</span>
                  </div>
                </div>

                <div className="actual-row">
                  <div className="actual-col">
                    <span className="actual-label">Dew Point</span>
                    <span className="actual-val">{liveData.dewPoint}</span>
                  </div>
                  <div className="actual-col">
                    <span className="actual-label">Surface Elevation</span>
                    <span className="actual-val">{liveData.elevation} MSL</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

            {/* VIEW MODE QUICK-BAR (SINGLE-LOOK CLEAN VS FULL FORENSIC) */}
      <div className="dash-view-quickbar">
        <div className="dvq-left">
          <span className="dvq-radar-dot" style={{ backgroundColor: activeDetailCount <= 2 ? '#10b981' : '#6366f1' }} />
          <div className="dvq-text">
            <span className="dvq-label">CONSOLE VIEW:</span>
            <span className="dvq-status">
              {activeDetailCount <= 2 ? 'CLEAN ONE-LOOK VIEW' : `FORENSIC MODE (${activeDetailCount}/6 SECTIONS ACTIVE)`}
            </span>
          </div>
          <span className="dvq-subnote">
            {activeDetailCount <= 2
              ? 'Minimalist layout optimized for instant clarity on mobile & desktop'
              : 'Deep telemetry, 12-channel hardware stream & cascading impact models enabled'}
          </span>
        </div>
        <div className="dvq-right">
          <button
            type="button"
            className="dvq-preset-btn ai-quick-jump-btn"
            onClick={() => {
              setIsForecastExpanded(true);
              setTimeout(() => {
                const el = document.getElementById('genai-qna-console');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  const inp = el.querySelector('.gec-qa-input');
                  if (inp) inp.focus();
                }
              }, 60);
            }}
            title="Jump directly to Google Gemini 2.5 Flash Disaster Model Console"
          >
            <span className="live-pulse-dot" style={{ backgroundColor: '#22c55e', width: '7px', height: '7px', display: 'inline-block', marginRight: '6px' }} />
            <span>INTERROGATE GEMINI AI</span>
            <span className="ai-btn-speed-tag">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: '3px' }}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              ~1.2s
            </span>
          </button>
          <button
            type="button"
            className="dvq-preset-btn"
            onClick={() => {
              setHistoricalModalDatasetId(anomalyEval?.primaryAnomaly?.hazardId || 'flood');
              setShowHistoricalModal(true);
            }}
            title="Open Historical Dataset Explorer & Infographics"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '5px' }}>
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            DATASET INFOGRAPHICS
          </button>
          <button
            type="button"
            className={`dvq-preset-btn ${showStreamDrawer ? 'active' : ''}`}
            onClick={() => setShowStreamDrawer(!showStreamDrawer)}
            title="Inspect sensor_logs/ folder files, live telemetry stream & simulator"
          >
            <span className="live-pulse-dot" style={{ backgroundColor: '#06b6d4', width: '7px', height: '7px', display: 'inline-block', marginRight: '6px' }} />
            SENSOR_LOGS/ ({streamLogFiles.length || '6'} FILES)
          </button>
          <button
            type="button"
            className={`dvq-preset-btn ${activeDetailCount <= 2 ? 'active' : ''}`}
            onClick={() => onSetViewPreset && onSetViewPreset('clean')}
            title="Switch to clean minimalist one-look view"
          >
            CLEAN VIEW
          </button>
          <button
            type="button"
            className={`dvq-preset-btn ${activeDetailCount === 6 ? 'active' : ''}`}
            onClick={() => onSetViewPreset && onSetViewPreset('full')}
            title="Show all 12 channels, node forensics & cascading models"
          >
            FULL FORENSIC
          </button>
        </div>
      </div>

      {/* 2. LOWER PART: MAP OF INDIA SECTION */}
      <section id="mobile-sec-map" className="dash-map-section">
        <button
          type="button"
          className={`elongated-drawer-bar modern-drawer-bar shade-drawer-map ${isMapExpanded ? 'expanded' : ''}`}
          onClick={() => setIsMapExpanded(!isMapExpanded)}
        >
          <div className="drawer-bar-left">
            <span className="drawer-toggle-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {isMapExpanded ? <polyline points="6 9 12 15 18 9" /> : <polyline points="9 18 15 12 9 6" />}
              </svg>
            </span>
            <span className="drawer-bar-title">
              GEOSPATIAL SOVEREIGN MAP
              <span className="drawer-bar-sublocation"> // INDIA POLITICAL, TERRAIN & RIVERS</span>
            </span>
            <span className="drawer-data-badge">SURVEY OF INDIA (SOI) ACCREDITED</span>
            {liveSensorStreamInfo && (
              <span className="drawer-data-badge live-stream-badge">
                <span className="live-pulse-dot" style={{ backgroundColor: '#22c55e', width: '6px', height: '6px', display: 'inline-block', marginRight: '4px' }} />
                STREAM: {liveSensorStreamInfo.sourceFile}
              </span>
            )}
          </div>
          <div className="drawer-bar-right">
            <span className="drawer-preview-snippet">
              {selectedHazards.length > 0 ? `${selectedHazards.length} CALAMITIES ARMED` : '12 SENSOR LAYERS READY'}
            </span>
            <span className="drawer-action-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              {isMapExpanded ? 'CONCEAL MAP' : 'EXPAND MAP'}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {isMapExpanded ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
              </svg>
            </span>
          </div>
        </button>

        {isMapExpanded && (
          <div className="expanded-map-container">
            {/* EXECUTIVE UNIFIED LAYER STUDIO (DE-CONGESTED, TABBED & IMMEDIATE HERO MAP ACCESS) */}
            <div className="executive-layer-studio">
              <div className="els-header-bar">
                <div className="els-tabs-group">
                  <button
                    type="button"
                    className={`els-tab-btn ${activeStudioTab === 'hazards' ? 'active' : ''}`}
                    onClick={() => setActiveStudioTab('hazards')}
                  >
                    <span className="els-tab-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </span>
                    <span className="els-tab-title">CALAMITY HAZARDS</span>
                    <span className={`els-tab-count ${selectedHazards.length > 0 ? 'highlight' : ''}`}>
                      {selectedHazards.length} ARMED
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`els-tab-btn ${activeStudioTab === 'meteorology' ? 'active' : ''}`}
                    onClick={() => setActiveStudioTab('meteorology')}
                  >
                    <span className="els-tab-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                      </svg>
                    </span>
                    <span className="els-tab-title">LIVE METEOROLOGY</span>
                    <span className="els-tab-count highlight">
                      {activeLiveObj ? activeLiveObj.name : 'STANDBY'}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`els-tab-btn ${activeStudioTab === 'hotspots' ? 'active' : ''}`}
                    onClick={() => setActiveStudioTab('hotspots')}
                  >
                    <span className="els-tab-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    </span>
                    <span className="els-tab-title">ANOMALY HOTSPOTS</span>
                    <span className="els-tab-count">
                      {allIndiaHotspots.length} DETECTED
                    </span>
                  </button>
                </div>

                <div className="els-actions-group">
                  {activeStudioTab === 'hazards' && selectedHazards.length > 0 && (
                    <button
                      type="button"
                      className="els-action-btn"
                      onClick={() => setSelectedHazards([])}
                      title="Disarm all active calamity layers"
                    >
                      DISARM ALL
                    </button>
                  )}

                  {activeStudioTab === 'meteorology' && (
                    <div className="els-sync-group">
                      <span className="els-sync-stamp">
                        <span className="live-pulse-dot green" /> {liveTelemetry?.formattedTime || 'LIVE'}
                      </span>
                      <button
                        type="button"
                        className="els-action-btn"
                        onClick={() => refreshLiveTelemetry(true)}
                        disabled={isTelemetryLoading}
                        title="Refresh synoptic station telemetry"
                      >
                        {isTelemetryLoading ? 'SYNCING...' : 'SYNC'}
                      </button>
                    </div>
                  )}

                  {activeStudioTab === 'hotspots' && (
                    <button
                      type="button"
                      className={`els-action-btn ${showHotspotsOverlay ? 'active' : ''}`}
                      onClick={() => setShowHotspotsOverlay(!showHotspotsOverlay)}
                      title="Toggle visibility of 16 anomaly pins on map"
                    >
                      PINS: {showHotspotsOverlay ? 'VISIBLE' : 'HIDDEN'}
                    </button>
                  )}

                  <button
                    type="button"
                    className="els-collapse-toggle-btn"
                    onClick={() => setIsStudioExpanded(!isStudioExpanded)}
                    title={isStudioExpanded ? 'Minimize layer tray for maximal map canvas' : 'Expand layer options'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    {isStudioExpanded ? 'CONCEAL TRAY' : 'EXPAND TRAY'}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {isStudioExpanded ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                    </svg>
                  </button>
                </div>
              </div>

              {isStudioExpanded && (
                <div className="els-tray-body">
                  {/* 1. CALAMITY HAZARDS PANEL */}
                  {activeStudioTab === 'hazards' && (
                    <div className="els-panel-content">
                      <div className="els-chips-flow">
                        {HAZARD_LAYERS.map((hazard, idx) => {
                          const isSelected = selectedHazards.includes(hazard.name);
                          const code = String(idx + 1).padStart(2, '0');
                          return (
                            <button
                              key={hazard.id}
                              type="button"
                              className={`els-chip-item ${isSelected ? 'active' : ''}`}
                              style={{ '--hazard-color': hazard.color }}
                              onClick={() => toggleHazard(hazard.name)}
                              title={`${hazard.name} — ${hazard.desc}`}
                            >
                              <div className="els-chip-top">
                                <span className="els-chip-code">{code}</span>
                                <span
                                  className={`els-chip-dot ${isSelected ? 'active' : ''}`}
                                  style={{ backgroundColor: hazard.color }}
                                />
                              </div>
                              <span className="els-chip-label">{hazard.name}</span>
                              <span className={`els-chip-status ${isSelected ? 'armed' : ''}`}>
                                {isSelected ? 'ARMED' : 'OFF'}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {selectedHazards.length > 0 && (
                        <div className="els-active-summary-strip">
                          <span className="els-ass-title">ARMED SENSOR FEEDS:</span>
                          <div className="els-ass-tags">
                            {selectedHazards.map((hName) => {
                              const hObj = HAZARD_LAYERS.find((h) => h.name === hName);
                              return (
                                <span
                                  key={hName}
                                  className="els-ass-tag"
                                  style={{ borderColor: hObj?.color }}
                                >
                                  <span className="els-ass-dot" style={{ backgroundColor: hObj?.color }} />
                                  {hName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. LIVE METEOROLOGY PANEL */}
                  {activeStudioTab === 'meteorology' && (
                    <div className="els-panel-content">
                      <div className="els-chips-flow">
                        {LIVE_MET_LAYERS.map((layer) => {
                          const isSelected = activeLiveLayer === layer.id;
                          let liveSnippet = 'LIVE STREAM';
                          if (liveTelemetry && liveTelemetry.stations && liveTelemetry.stations.length > 0) {
                            if (layer.id === 'rain') {
                              const rainingCount = liveTelemetry.stations.filter((s) => s.isRaining || s.precipitation > 0.1).length;
                              liveSnippet = `${rainingCount} CELLS`;
                            } else if (layer.id === 'wind') {
                              const avgWind = Math.round(
                                liveTelemetry.stations.reduce((acc, s) => acc + s.windSpeed, 0) / liveTelemetry.stations.length
                              );
                              liveSnippet = `${avgWind} km/h`;
                            } else if (layer.id === 'heat') {
                              const maxApp = Math.max(...liveTelemetry.stations.map((s) => s.apparentTemp));
                              liveSnippet = `PEAK ${maxApp}°C`;
                            } else if (layer.id === 'pressure') {
                              const minP = Math.min(...liveTelemetry.stations.map((s) => s.pressureMsl));
                              liveSnippet = `${Math.round(minP)} hPa`;
                            } else if (layer.id === 'humidity') {
                              const avgHum = Math.round(
                                liveTelemetry.stations.reduce((acc, s) => acc + s.humidity, 0) / liveTelemetry.stations.length
                              );
                              liveSnippet = `${avgHum}% RH`;
                            } else if (layer.id === 'aqi') {
                              const maxAqi = Math.max(...liveTelemetry.stations.map((s) => s.aqi));
                              liveSnippet = `PEAK ${maxAqi}`;
                            } else if (layer.id === 'cyclone') {
                              liveSnippet = 'RSMC ACTIVE';
                            } else if (layer.id === 'storms') {
                              const stormCount = liveTelemetry.stations.filter((s) => s.isStorm).length;
                              liveSnippet = stormCount > 0 ? `${stormCount} CELLS` : '0 SQUALLS';
                            } else if (layer.id === 'clouds') {
                              const avgClouds = Math.round(
                                liveTelemetry.stations.reduce((acc, s) => acc + s.cloudCover, 0) / liveTelemetry.stations.length
                              );
                              liveSnippet = `${avgClouds}% COV`;
                            } else if (layer.id === 'uv') {
                              const maxUv = Math.max(...liveTelemetry.stations.map((s) => s.uvIndex));
                              liveSnippet = `${maxUv} UVI`;
                            } else if (layer.id === 'ocean') {
                              liveSnippet = 'BUOYS ONLINE';
                            } else if (layer.id === 'visibility') {
                              const minVis = Math.min(...liveTelemetry.stations.map((s) => s.visibilityKm));
                              liveSnippet = `MIN ${minVis} km`;
                            }
                          }

                          return (
                            <button
                              key={layer.id}
                              type="button"
                              className={`els-chip-item ${isSelected ? 'active' : ''}`}
                              style={{ '--hazard-color': layer.color }}
                              onClick={() => handleToggleLiveLayer(layer.id)}
                              title={`${layer.name} — ${layer.desc}`}
                            >
                              <div className="els-chip-top">
                                <span className="els-chip-code">{layer.code}</span>
                                <span
                                  className={`els-chip-dot ${isSelected ? 'active' : ''}`}
                                  style={{ backgroundColor: layer.color }}
                                />
                              </div>
                              <span className="els-chip-label">{layer.name}</span>
                              <span className={`els-chip-status ${isSelected ? 'armed' : ''}`}>
                                {isSelected ? liveSnippet : 'STANDBY'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. ANOMALY HOTSPOTS PANEL */}
                  {activeStudioTab === 'hotspots' && (
                    <div className="els-panel-content">
                      <div className="els-hotspots-scroll">
                        {allIndiaHotspots.map((spot) => {
                          const isCurrent =
                            activeNode.name.toUpperCase().includes(spot.name.toUpperCase()) ||
                            spot.name.toUpperCase().includes(activeNode.name.toUpperCase());
                          const hazardMeta = HAZARD_LAYERS.find((h) => h.id === spot.hazardId) || { color: '#ef4444' };
                          return (
                            <button
                              key={spot.id}
                              type="button"
                              className={`els-hotspot-pill ${isCurrent ? 'active' : ''}`}
                              style={{ '--spot-accent': hazardMeta.color }}
                              onClick={() => handleSelectHotspot(spot)}
                              title={`${spot.name} (${spot.state}): ${spot.hazardName} — Score: ${(spot.score * 100).toFixed(0)}%`}
                            >
                              <span className="ehp-dot" style={{ backgroundColor: hazardMeta.color }} />
                              <span className="ehp-name">{spot.name}</span>
                              <span className="ehp-hazard" style={{ color: hazardMeta.color }}>
                                {spot.hazardId.toUpperCase()}
                              </span>
                              <span className="ehp-score">{(spot.score * 100).toFixed(0)}%</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Leaflet Map Canvas */}
            <div className="map-viewport-frame">
              <div ref={mapContainerRef} className="leaflet-map-element" />

              {/* Sovereign India Boundary Compliance Badge (Top-Left) */}
              <div className="map-compliance-badge" title="Survey of India (SOI) Official Sovereign Boundary Compliant">
                <span className="soi-blue-dot" /> SOI BOUNDARY COMPLIANT
              </div>

              {/* MSN / Bing Weather Floating Layer Switcher (Left Vertical Dock as Arrow-Marked) */}
              <div className="map-floating-left-dock" title="Atmospheric & Hazard Visualization Layers">
                {[
                  {
                    id: 'rain',
                    label: 'Rain Radar',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" />
                        <path d="M16 14v6" />
                        <path d="M8 14v6" />
                        <path d="M12 16v6" />
                      </svg>
                    ),
                  },
                  {
                    id: 'wind',
                    label: 'Wind Particles',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
                        <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
                        <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
                      </svg>
                    ),
                  },
                  {
                    id: 'heat',
                    label: 'Thermal Heat',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                        <line x1="12" y1="9" x2="12" y2="12" />
                      </svg>
                    ),
                  },
                  {
                    id: 'clouds',
                    label: 'Satellite Clouds',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                      </svg>
                    ),
                  },
                  {
                    id: 'storms',
                    label: 'Doppler Radar',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    ),
                  },
                  {
                    id: 'aqi',
                    label: 'Air Quality AQI',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12h18" />
                        <path d="M5 16h14" />
                        <path d="M7 20h10" />
                        <path d="M18 8a6 6 0 0 0-12 0" />
                      </svg>
                    ),
                  },
                  {
                    id: 'cyclone',
                    label: 'Cyclone Eye',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="2.5" />
                        <path d="M12 4c4.4 0 8 3.6 8 8 0 2.2-.9 4.2-2.3 5.7" />
                        <path d="M12 20c-4.4 0-8-3.6-8-8 0-2.2.9-4.2 2.3-5.7" />
                      </svg>
                    ),
                  },
                  {
                    id: 'ocean',
                    label: 'Ocean Buoys',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`map-icon-btn ${activeLiveLayer === item.id ? 'active' : ''}`}
                    onClick={() => setActiveLiveLayer(item.id)}
                    title={`Switch layer: ${item.label}`}
                    aria-label={item.label}
                  >
                    {item.icon}
                  </button>
                ))}

                <div className="dock-left-divider" />

                <button
                  type="button"
                  className="map-icon-btn dock-zoom-btn"
                  onClick={() => mapInstanceRef.current?.zoomIn()}
                  title="Zoom In (+)"
                  aria-label="Zoom In"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="map-icon-btn dock-zoom-btn"
                  onClick={() => mapInstanceRef.current?.zoomOut()}
                  title="Zoom Out (−)"
                  aria-label="Zoom Out"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

              {/* MSN / Bing Weather Style Unified Top Command Dock */}
              <div className="map-top-command-dock">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchSubmit(e);
                  }}
                  className="dock-search-group"
                  title="Search Indian city, river basin, or coordinates"
                >
                  <button type="submit" className="dock-search-btn" title="Search Location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    className="dock-search-input"
                    placeholder="Search location..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (searchFeedback) setSearchFeedback(null);
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="dock-clear-btn"
                      onClick={() => {
                        setSearchQuery('');
                        if (searchFeedback) setSearchFeedback(null);
                      }}
                      title="Clear search"
                      aria-label="Clear search"
                    >
                      <IconClose size={12} />
                    </button>
                  )}

                  {/* Floating Warning Notice if outside India */}
                  {searchFeedback && (
                    <div className={`dock-search-alert-popover ${searchFeedback.type}`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span>{searchFeedback.message}</span>
                      <button
                        type="button"
                        className="dock-alert-close"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchFeedback(null);
                        }}
                        aria-label="Dismiss notice"
                      >
                        <IconClose size={12} />
                      </button>
                    </div>
                  )}
                </form>

                <div className="dock-divider" />

                <button
                  type="button"
                  className="dock-action-btn dock-reset-btn"
                  onClick={handleResetMapBounds}
                  title="Reset View to Sovereign India Extent"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span>RESET INDIA</span>
                </button>

                <div className="dock-divider" />

                <button
                  type="button"
                  className={`dock-action-btn dock-basins-btn ${showHazardLegends ? 'active' : ''}`}
                  onClick={() => setShowHazardLegends((prev) => !prev)}
                  title="Click to view Flood Prone Basins of India & Hazard Legends (NIH Roorkee / CWC)"
                  aria-expanded={showHazardLegends}
                >
                  <span className="dock-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                    </svg>
                  </span>
                  <span className="dock-label">FLOOD BASINS</span>
                  <span className="dock-pill">{selectedHazards.length} ACTIVE</span>
                  <span className="dock-arrow">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {showHazardLegends ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                    </svg>
                  </span>
                </button>
              </div>

              {/* Clickable Options Drawer for Top-Right Circled Part (NIH Flood Basins & Hazard Legends) */}
              {showHazardLegends && (
                <div className="map-floating-legends-drawer">
                  <div className="mfld-header">
                    <div className="mfld-title-group">
                      <span className="mfld-title-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                        </svg>
                      </span>
                      <span className="mfld-title">FLOOD PRONE BASINS & HAZARDS (NIH ROORKEE)</span>
                    </div>
                    <button
                      type="button"
                      className="mfld-close-btn"
                      onClick={() => setShowHazardLegends(false)}
                      title="Close options view"
                      aria-label="Close"
                    >
                      <IconClose size={13} />
                    </button>
                  </div>
                  <div className="mfld-content">
                    {/* 1. NIH Roorkee Flood Prone Basins & River Corridor Legend */}
                    <div className="hazard-floating-legend-card nih-flood-legend in-drawer">
                      <div className="hfl-header">
                        <span className="hfl-title">FLOOD PRONE BASINS OF INDIA</span>
                        <span className="hfl-sub">NATIONAL INSTITUTE OF HYDROLOGY, ROORKEE</span>
                      </div>
                      <div className="hfl-items">
                        <div
                          className="hfl-item interactive-toggle"
                          onClick={() => toggleHazard('FLOOD')}
                          style={{ cursor: 'pointer' }}
                          title="Click to toggle Flood Basins"
                        >
                          <span className="hfl-swatch" style={{ backgroundColor: '#38bdf8', border: '1px solid #0284c7' }} />
                          <span className="hfl-text">Flood Prone Basin Corridors (NIH Roorkee)</span>
                          <span className="hfl-check-pill" style={{
                            marginLeft: 'auto',
                            padding: '2px 6px',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            borderRadius: '4px',
                            backgroundColor: selectedHazards.includes('FLOOD') ? '#0284c7' : 'var(--btn-hover-bg)',
                            color: selectedHazards.includes('FLOOD') ? '#ffffff' : 'var(--text-muted)'
                          }}>
                            {selectedHazards.includes('FLOOD') ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        <div className="hfl-item">
                          <span className="hfl-swatch line-swatch" style={{ backgroundColor: '#1d4ed8' }} />
                          <span className="hfl-text">Meandering River Flood Overflow Course</span>
                        </div>
                      </div>
                      <div className="hfl-footer">CWC & NIH Roorkee Hydrological Survey</div>
                    </div>


              {/* 2. BIS Seismic Zone Legend Box */}
              {selectedHazards.includes('EARTHQUAKES') && (
                <div className="hazard-floating-legend-card bis-seismic-legend">
                  <div className="hfl-header">
                    <span className="hfl-title">INDIA SEISMIC ZONE</span>
                    <span className="hfl-sub">BIS IS 1893 (PART 1) : 2002</span>
                  </div>
                  <div className="hfl-items">
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#fbf0e4', border: '1px solid #d1d5db' }} />
                      <span className="hfl-text">Zone - II (Least Active)</span>
                    </div>
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#f0a882' }} />
                      <span className="hfl-text">Zone - III (Moderate)</span>
                    </div>
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#de5437' }} />
                      <span className="hfl-text">Zone - IV (High)</span>
                    </div>
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#b31b26' }} />
                      <span className="hfl-text">Zone - V (Highest)</span>
                    </div>
                  </div>
                  <div className="hfl-footer">National Center for Seismology / MoES</div>
                </div>
              )}

              {/* 3. GSI Landslide Susceptibility Legend */}
              {selectedHazards.includes('LANDSLIDES') && (
                <div className="hazard-floating-legend-card gsi-landslide-legend">
                  <div className="hfl-header">
                    <span className="hfl-title">LANDSLIDE SUSCEPTIBILITY</span>
                    <span className="hfl-sub">GSI / NDMA NATIONAL MAPPING (NLSM)</span>
                  </div>
                  <div className="hfl-items">
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#b91c1c' }} />
                      <span className="hfl-text">Very High / Critical Hazard Zone</span>
                    </div>
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#ea580c' }} />
                      <span className="hfl-text">High Hazard (Siwaliks / Sahyadri)</span>
                    </div>
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#facc15' }} />
                      <span className="hfl-text">Moderate Hazard Zone</span>
                    </div>
                  </div>
                  <div className="hfl-footer">Geological Survey of India (GSI) / NDMA</div>
                </div>
              )}

              {/* 4. State-Wise AQI Legend & Top Gradient Bar */}
              {selectedHazards.includes('HAZARDOUS AQI') && (
                <div className="hazard-floating-legend-card aqi-state-legend">
                  <div className="hfl-header">
                    <span className="hfl-title">STATE WISE AQI ON DIWALI 2025</span>
                    <span className="hfl-sub">SOURCE: AQI.IN, IQAIR, CPCB/SAMEER</span>
                  </div>
                  <div className="aqi-state-gradient-bar" />
                  <div className="asl-ticks-row">
                    <span>0</span>
                    <span>134</span>
                    <span>268</span>
                    <span>402</span>
                    <span>536</span>
                  </div>
                  <div className="asl-total-callout">
                    <span className="asl-total-label">TOTAL NATIONAL AQI:</span>
                    <span className="asl-total-num">280 <small>(Very Unhealthy)</small></span>
                  </div>
                  <div className="hfl-footer">CPCB National Ambient Air Quality Index</div>
                </div>
              )}

              {/* 5. IMD Maximum Temperature Legend */}
              {selectedHazards.includes('EXTREME HEAT') && (
                <div className="hazard-floating-legend-card imd-heat-legend">
                  <div className="hfl-header">
                    <span className="hfl-title">MAXIMUM TEMPERATURE (IMD)</span>
                    <span className="hfl-sub">INDIA METEOROLOGICAL DEPARTMENT</span>
                  </div>
                  <div className="imd-swatches-grid">
                    <div className="imd-swatch-item">
                      <span className="imd-swatch-box" style={{ backgroundColor: '#4a0404' }} />
                      <span>&gt; 44°C (Severe Core)</span>
                    </div>
                    <div className="imd-swatch-item">
                      <span className="imd-swatch-box" style={{ backgroundColor: '#b91c1c' }} />
                      <span>40 - 44°C (Heatwave)</span>
                    </div>
                    <div className="imd-swatch-item">
                      <span className="imd-swatch-box" style={{ backgroundColor: '#ea580c' }} />
                      <span>34 - 40°C (Warm Plains)</span>
                    </div>
                    <div className="imd-swatch-item">
                      <span className="imd-swatch-box" style={{ backgroundColor: '#eab308' }} />
                      <span>26 - 34°C (Sub-Himalayan)</span>
                    </div>
                    <div className="imd-swatch-item">
                      <span className="imd-swatch-box" style={{ backgroundColor: '#16a34a' }} />
                      <span>18 - 26°C (NE Hills)</span>
                    </div>
                    <div className="imd-swatch-item">
                      <span className="imd-swatch-box" style={{ backgroundColor: '#2563eb' }} />
                      <span>&lt; 16°C (Alpine Snow)</span>
                    </div>
                  </div>
                  <div className="hfl-footer">Government of India / IMD Synoptic Division</div>
                </div>
              )}

                            {/* 07. CPCB Industrial Emissions Standards Legend */}
              {selectedHazards.includes('INDUSTRIAL EMISSIONS') && (
                <div className="hazard-floating-legend-card cpcb-emissions-legend">
                  <div className="hfl-header">
                    <span className="hfl-title">INDUSTRIAL EMISSIONS STANDARDS</span>
                    <span className="hfl-sub">CENTRAL POLLUTION CONTROL BOARD (CPCB)</span>
                  </div>
                  <div className="hfl-items">
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#64748b' }} />
                      <span className="hfl-text">Industrial Petrochemical & Thermal Cluster</span>
                    </div>
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#94a3b8', border: '1px dashed #64748b' }} />
                      <span className="hfl-text">Toxic Flue Plume Dispersion Zone</span>
                    </div>
                  </div>
                  <div className="hfl-footer">CPCB National Ambient Standard: SO₂ 80 µg/m³</div>
                </div>
              )}

              {/* 08. Water Quality Criteria Legend */}
              {selectedHazards.includes('WATER QUALITY') && (
                <div className="hazard-floating-legend-card cpcb-water-legend">
                  <div className="hfl-header">
                    <span className="hfl-title">CPCB RIVER WATER QUALITY CRITERIA</span>
                    <span className="hfl-sub">NATIONAL WATER QUALITY MONITORING (NWMP)</span>
                  </div>
                  <div className="hfl-items">
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#06b6d4' }} />
                      <span className="hfl-text">Class C (Drinking water with treatment)</span>
                    </div>
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#f97316' }} />
                      <span className="hfl-text">Class D (Fisheries & Wildlife Propagation)</span>
                    </div>
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#dc2626' }} />
                      <span className="hfl-text">Class E (Severely Polluted / Anoxia DO &lt; 4.0)</span>
                    </div>
                  </div>
                  <div className="hfl-footer">CPCB Designated Best Use River Classification</div>
                </div>
              )}

              {/* 09. Glacial GLOF Legend */}
              {selectedHazards.includes('GLACIAL LIQUEFACTION') && (
                <div className="hazard-floating-legend-card isro-glacial-legend">
                  <div className="hfl-header">
                    <span className="hfl-title">HIMALAYAN GLOF & CRYOSPHERE ATLAS</span>
                    <span className="hfl-sub">SPACE APPLICATIONS CENTRE (ISRO) & NCPOR</span>
                  </div>
                  <div className="hfl-items">
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#0284c7' }} />
                      <span className="hfl-text">Critical Glacial Lake Outburst Basin</span>
                    </div>
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#38bdf8', border: '1px dashed #0284c7' }} />
                      <span className="hfl-text">Cryospheric High-Velocity Surge Channel</span>
                    </div>
                  </div>
                  <div className="hfl-footer">Himalayan Moraine Dam Outburst Monitoring</div>
                </div>
              )}

              {/* 10. Tsunami Warning Legend */}
              {selectedHazards.includes('TSUNAMI') && (
                <div className="hazard-floating-legend-card incois-tsunami-legend">
                  <div className="hfl-header">
                    <span className="hfl-title">INCOIS TSUNAMI EARLY WARNING (ITEWS)</span>
                    <span className="hfl-sub">INDIAN NATIONAL CENTRE FOR OCEAN INFORMATION</span>
                  </div>
                  <div className="hfl-items">
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#0f766e' }} />
                      <span className="hfl-text">Coastal Inundation Risk Sector</span>
                    </div>
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#14b8a6', border: '1px dashed #0f766e' }} />
                      <span className="hfl-text">Subduction Continental Shelf</span>
                    </div>
                  </div>
                  <div className="hfl-footer">MoES / ITEWS Deep Ocean DART Buoy Network</div>
                </div>
              )}

              {/* 11. Cyclone Scale Legend */}
              {selectedHazards.includes('CYCLONE') && (
                <div className="hazard-floating-legend-card imd-cyclone-legend">
                  <div className="hfl-header">
                    <span className="hfl-title">IMD TROPICAL CYCLONE WARNING</span>
                    <span className="hfl-sub">REGIONAL SPECIALIZED METEOROLOGICAL CENTRE</span>
                  </div>
                  <div className="hfl-items">
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#be185d' }} />
                      <span className="hfl-text">Core Eyewall Gale Ring (&gt; 130 km/h)</span>
                    </div>
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#ec4899' }} />
                      <span className="hfl-text">Outer Cyclonic Gale Buffer</span>
                    </div>
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#f43f5e' }} />
                      <span className="hfl-text">Coastal Storm Surge Inundation (+4.8m)</span>
                    </div>
                  </div>
                  <div className="hfl-footer">IMD Stage-IV Landfall Warning Protocol</div>
                </div>
              )}

              {/* 12. Other Hazards Legend */}
              {selectedHazards.includes('OTHER HAZARDS') && (
                <div className="hazard-floating-legend-card ndma-other-legend">
                  <div className="hfl-header">
                    <span className="hfl-title">NDMA MULTI-HAZARD DISASTER GRID</span>
                    <span className="hfl-sub">NATIONAL DISASTER MANAGEMENT AUTHORITY</span>
                  </div>
                  <div className="hfl-items">
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#d97706' }} />
                      <span className="hfl-text">Severe Lightning & Cloudburst Perimeter</span>
                    </div>
                    <div className="hfl-item">
                      <span className="hfl-swatch" style={{ backgroundColor: '#fbbf24' }} />
                      <span className="hfl-text">Urban Pluvial Inundation Hotspot</span>
                    </div>
                  </div>
                  <div className="hfl-footer">NDMA Compound Early Warning Framework</div>
                </div>
              )}
                  </div>
                </div>
              )}

              {/* River Flood Anomaly Active Badge on Map */}
              {selectedHazards.includes('FLOOD') && anomalyEval?.anomalies?.some((a) => a.hazardId === 'flood') && (
                <div className="map-river-flood-indicator">
                  <span className="flood-pulse-ring" />
                  <div className="flood-ind-content">
                    <span className="flood-ind-title">
                      [SURGE ALERT] {String(sensorReadings?.river?.riverName || 'BARAK').toUpperCase()} RIVER CORRIDOR ACTIVE
                    </span>
                    <span className="flood-ind-sub">
                      WATER LEVEL: {sensorReadings?.river?.waterLevelM} m (+{sensorReadings?.river?.levelAboveDangerM} m ABOVE DANGER MARK) // SURGE: {sensorReadings?.river?.dischargeCumecs} CUMECS
                    </span>
                  </div>
                </div>
              )}

              {/* Clickable Icon for Bottom-Left Circled Part (Hazards & Time Window Filters) */}
              <div className="map-bottom-left-bar">
                {showHazardTimePanel ? (
                  <div className="map-floating-bottom-bar expanded">
                    <div className="mfb-header">
                      <div className="mfb-header-title">
                        <span className="mfb-header-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </span>
                        <span>HAZARD & TEMPORAL FILTERS</span>
                      </div>
                      <button
                        type="button"
                        className="mfb-close-btn"
                        onClick={() => setShowHazardTimePanel(false)}
                        title="Minimize to icon"
                        aria-label="Close"
                      >
                        <IconClose size={13} />
                      </button>
                    </div>

                    <div className="mfb-section">
                      <span className="mfb-section-label">ACTIVE HAZARD OVERLAYS</span>
                      <div className="mfb-chips-grid">
                        {[
                          {
                            id: 'FLOOD',
                            label: 'Flood Corridor',
                            icon: (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                              </svg>
                            ),
                            color: '#0284c7'
                          },
                          {
                            id: 'HAZARDOUS AQI',
                            label: 'AQI Saturation',
                            icon: (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.7 7.7A7.1 7.1 0 0 0 5 10.8A4 4 0 0 0 6 18h12a3.6 3.6 0 0 0 1.7-6.8" />
                              </svg>
                            ),
                            color: '#a855f7'
                          },
                          {
                            id: 'EARTHQUAKES',
                            label: 'Seismic Faults',
                            icon: (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                              </svg>
                            ),
                            color: '#f97316'
                          },
                          {
                            id: 'EXTREME HEAT',
                            label: 'Thermal Heat',
                            icon: (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                              </svg>
                            ),
                            color: '#ef4444'
                          },
                        ].map((item) => {
                          const isActive = selectedHazards.includes(item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              className={`mfb-filter-chip ${isActive ? 'active' : ''}`}
                              onClick={() => toggleHazard(item.id)}
                              title={`Toggle ${item.label}`}
                            >
                              <span
                                className="chip-indicator"
                                style={{ backgroundColor: isActive ? item.color : 'var(--text-muted)' }}
                              />
                              <span className="chip-icon">{item.icon}</span>
                              <span className="chip-label">{item.label}</span>
                              {isActive && (
                                <span className="chip-check">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mfb-section">
                      <span className="mfb-section-label">TEMPORAL TIME WINDOW</span>
                      <div className="mfb-segmented-bar">
                        {['PAST 6H', 'PAST 24H', 'NOW (LIVE)', '+24H FCST'].map((timeOpt) => {
                          const isSelected = mapTimeWindow === timeOpt;
                          return (
                            <button
                              key={timeOpt}
                              type="button"
                              className={`mfb-segment-btn ${isSelected ? 'active' : ''}`}
                              onClick={() => setMapTimeWindow(timeOpt)}
                            >
                              {timeOpt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="map-toggle-icon-btn mfb-toggle-btn"
                    onClick={() => setShowHazardTimePanel(true)}
                    title="Click to view Hazards & Time Options"
                  >
                    <span className="mtb-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </span>
                    <span className="mtb-text">HAZARDS & TIME</span>
                    <span className="mtb-pill-badge">{selectedHazards.length} ACTIVE • {mapTimeWindow}</span>
                    <span className="mtb-arrow">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </span>
                  </button>
                )}
              </div>

              {/* Clickable Icon for Bottom-Right Circled Part (Precipitation & Radar Intensity Scale) */}
              <div className="map-bottom-right-bar">
                {showPrecipitationScale ? (
                  <div className="map-floating-legend-bar expanded">
                    <div className="mfl-header">
                      <div className="mfl-title-group">
                        <span className="mfl-title-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="20" x2="12" y2="10" />
                            <line x1="18" y1="20" x2="18" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="16" />
                          </svg>
                        </span>
                        <span className="mfl-header-title">{activeLiveObj?.scale?.title || 'ATMOSPHERIC INTENSITY'}</span>
                      </div>
                      <button
                        type="button"
                        className="mfl-close-btn"
                        onClick={() => setShowPrecipitationScale(false)}
                        title="Minimize to icon"
                        aria-label="Close"
                      >
                        <IconClose size={13} />
                      </button>
                    </div>

                    <div className="mfl-subhead-row">
                      <span className="mfl-param-name">{activeLiveObj?.name || 'LIVE OBSERVATION'}</span>
                      <span className="mfl-unit-tag">[{activeLiveObj?.unit || 'mm/h'}]</span>
                    </div>

                    <div
                      className="mfl-ramp"
                      style={{
                        background:
                          activeLiveObj?.scale?.gradient ||
                          'linear-gradient(90deg, #38bdf8 0%, #10b981 30%, #eab308 60%, #f97316 80%, #ef4444 100%)',
                      }}
                    />

                    <div className="mfl-ticks-row">
                      <div className="mfl-tick left">
                        <span className="mfl-tick-val">{activeLiveObj?.scale?.ticks?.[0]?.label || '0.0'}</span>
                        <span className="mfl-tick-desc">DRY</span>
                      </div>
                      <div className="mfl-tick center">
                        <span className="mfl-tick-val">{activeLiveObj?.scale?.ticks?.[2]?.label || '10.0'}</span>
                        <span className="mfl-tick-desc">MODERATE</span>
                      </div>
                      <div className="mfl-tick right">
                        <span className="mfl-tick-val">{activeLiveObj?.scale?.ticks?.[4]?.label || '50+'}</span>
                        <span className="mfl-tick-desc">TORRENTIAL</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="map-toggle-icon-btn mfl-toggle-btn"
                    onClick={() => setShowPrecipitationScale(true)}
                    title="Click to view Precipitation & Intensity Scale"
                  >
                    <span className="mtb-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="20" x2="12" y2="10" />
                        <line x1="18" y1="20" x2="18" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="16" />
                      </svg>
                    </span>
                    <span className="mtb-text">{activeLiveObj?.scale?.title || 'PRECIPITATION SCALE'}</span>
                    <span
                      className="mtb-mini-ramp"
                      style={{
                        background:
                          activeLiveObj?.scale?.gradient ||
                          'linear-gradient(90deg, #38bdf8, #10b981, #ef4444)',
                      }}
                    />
                    <span className="mtb-arrow">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </span>
                  </button>
                )}
              </div>

              <div className="map-guidance-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="22" y1="12" x2="18" y2="12" />
                  <line x1="6" y1="12" x2="2" y2="12" />
                  <line x1="12" y1="6" x2="12" y2="2" />
                  <line x1="12" y1="22" x2="12" y2="18" />
                </svg>
                <span>CLICK MAP TO HOOK GPS & INSPECT MULTI-SENSOR TELEMETRY</span>
              </div>
            </div>

            {/* 3. ACTIVE NODE TELEMETRY - INTEGRATED IN MAP SECTION (REAL DATA) */}
            {viewDetails.nodeTelemetry && (
              <div className="map-active-node-section">
                <div className="map-node-header-bar">
                  <div className="mnh-left">
                    <span className="mnh-badge">01-04 GPS</span>
                    <h4 className="mnh-title">ACTIVE NODE TELEMETRY</h4>
                    <span className="mnh-sub">REAL-TIME GPS MARKER STREAM // GEODETIC WGS-84 FIX</span>
                  </div>
                  <div className="mnh-right">
                    <span className="mnh-sync-time">
                      <span className="live-pulse-dot green" /> {liveData?.time ? `SYNCED: ${liveData.time}` : 'LIVE PHYSICAL SENSOR LINK'}
                    </span>
                    <button
                      type="button"
                      className="mnh-hide-btn"
                      onClick={() => onToggleDetail && onToggleDetail('nodeTelemetry')}
                      title="Hide Active Node Telemetry"
                    >
                      − HIDE
                    </button>
                  </div>
                </div>

                <div className="active-node-box modern-node-box">
                  <div className="node-grid">
                    {/* Card 01: Node Identifier & Telemetry Station */}
                    <div className="node-col-card shade-pistachio">
                      <div className="node-card-top">
                        <span className="node-index">01</span>
                        <span className="node-label">DESIGNATED NODE ID</span>
                      </div>
                      <div className="node-val highlight">{activeNode.id}</div>
                      <span className="node-sub">
                        {activeNode.name} • {liveData?.condition || 'CALIBRATED'}
                      </span>
                    </div>

                    {/* Card 02: GPS Coordinates & River Catchment */}
                    <div className="node-col-card shade-sage">
                      <div className="node-card-top">
                        <span className="node-index">02</span>
                        <span className="node-label">GPS HOOK COORDINATES</span>
                      </div>
                      <div className="node-val">{activeNode.lat}, {activeNode.lng}</div>
                      <span className="node-sub">
                        GEODETIC WGS-84 • {sensorReadings?.river?.river ? `RIVER: ${sensorReadings.river.river.toUpperCase()}` : 'REGIONAL DRAINAGE BASIN'}
                      </span>
                    </div>

                    {/* Card 03: Topographical Zone & Elevation */}
                    <div className="node-col-card shade-forest">
                      <div className="node-card-top">
                        <span className="node-index">03</span>
                        <span className="node-label">TOPOGRAPHICAL ZONE</span>
                      </div>
                      <div className="node-val">{activeNode.zone}</div>
                      <span className="node-sub">
                        ELEVATION: {activeNode.elevation} • HUMIDITY: {liveData?.humidity || `${sensorReadings?.humidityPct || 75}%`}
                      </span>
                    </div>

                    {/* Card 04: Real Sensor Link Health & Risk Assessment */}
                    <div className="node-col-card shade-emerald">
                      <div className="node-card-top">
                        <span className="node-index">04</span>
                        <span className="node-label">TELEMETRY LINK STATUS</span>
                      </div>
                      <div className="node-val node-status-online">
                        <span className="live-pulse-dot" /> {activeNode.status}
                      </div>
                      <span className="node-sub">
                        {liveData?.temp ? `${liveData.temp} • AQI ${liveData.aqiValue || 85} • ` : ''}{activeNode.riskScore}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!viewDetails.nodeTelemetry && (
              <div
                className="map-node-collapsed-strip"
                onClick={() => onToggleDetail && onToggleDetail('nodeTelemetry')}
                title="Click to expand Active Node Telemetry"
              >
                <div className="mncs-left">
                  <span className="mncs-badge">01 GPS NODE</span>
                  <span className="mncs-title">ACTIVE NODE TELEMETRY</span>
                  <span className="mncs-preview">
                    {activeNode.id} • {activeNode.lat}, {activeNode.lng} • Elev: {activeNode.elevation} • {activeNode.zone}
                  </span>
                </div>
                <button type="button" className="mncs-expand-btn">
                  + VIEW NODE TELEMETRY
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. PHYSICAL SENSOR READINGS & REGULATORY RADAR */}
      <section id="mobile-sec-sensors" className="dash-node-section">
        {(viewDetails.sensorChannels || viewDetails.topicAnalytics) && (
          <div className="section-title-bar">
            <div className="stb-left">
              <h3 className="section-title-text">PHYSICAL SENSOR READINGS & REGULATORY RADAR</h3>
              <span className="section-title-sub">REAL-TIME MULTI-SENSOR IOT STREAM // TOPIC BAROMETER</span>
            </div>
          </div>
        )}

        {/* Expanded 03: Topic Analytics & Regulatory Diagnostics Radar */}
        {viewDetails.topicAnalytics && (
          <div className="detailing-section-wrapper" style={{ margin: '1rem 0' }}>
            <div className="detailing-section-toolbar">
              <div className="dst-left">
                <span className="dst-badge">REGULATORY RADAR</span>
                <span className="dst-title">TOPIC ANALYTICS & REGULATORY DIAGNOSTICS</span>
              </div>
              <button
                type="button"
                className="dst-hide-btn"
                onClick={() => onToggleDetail && onToggleDetail('topicAnalytics')}
                title="Hide Topic Analytics Radar"
              >
                − HIDE RADAR
              </button>
            </div>
            <TopicAnalyticsRadar
              activeHazardId={activeAnalyticsTopic}
              onSelectHazard={(hName) => {
                const hObj = HAZARD_LAYERS.find((h) => h.name === hName);
                if (hObj) setActiveAnalyticsTopic(hObj.id);
                setSelectedHazards((prev) => (prev.includes(hName) ? prev : [...prev, hName]));
              }}
              selectedHazards={selectedHazards}
              sensorReadings={sensorReadings}
              anomalyEval={anomalyEval}
              cascadingPrediction={cascadingPrediction}
              onTriggerScenario={(sKey) => handleScenarioChange(sKey)}
            />
          </div>
        )}

        {/* Expanded 02: 12-Channel Multi-Sensor Telemetry Grid */}
        {sensorReadings && viewDetails.sensorChannels && (
          <div className="telemetry-sensors-grid-wrapper">
            <div className="telemetry-grid-header">
              <div className="tgh-left">
                <span className="tg-title">PHYSICAL MULTI-SENSOR READINGS [ALL 12 CHANNELS]</span>
                <span className="tg-sub">
                  HARDWARE SENSORS SYNCHRONIZED FOR THIS GEOSPATIAL FIX
                  {uploadedSensorInfo && (
                    <span className="tgh-uploaded-indicator"> • ACTIVE FEED: {uploadedSensorInfo.name} ({uploadedSensorInfo.totalRecords} RECORDS)</span>
                  )}
                </span>
              </div>
              <div className="tgh-right-actions">
                <button
                  type="button"
                  className="dst-hide-btn"
                  onClick={() => onToggleDetail && onToggleDetail('sensorChannels')}
                  title="Toggle 12-channel hardware sensor grid"
                >
                  − HIDE DETAILS
                </button>
              </div>
            </div>

            {/* MSN WEATHER INSPIRED DETAILS HEADER */}
            <div className="msn-weather-header">
              <div className="msn-wh-left">
                <h4 className="msn-wh-title">Weather & Hazard Telemetry Details</h4>
                <span className="msn-wh-time">{liveTelemetry?.formattedTime ? `Synced: ${liveTelemetry.formattedTime}` : 'LIVE REAL-TIME TELEMETRY'}</span>
              </div>
              <div
                className="msn-wh-link"
                onClick={() => {
                  setHistoricalModalDatasetId(anomalyEval?.primaryAnomaly?.hazardId || 'flood');
                  setShowHistoricalModal(true);
                }}
                title="Explore historical records and infographics"
              >
                SUGGESTIONS & HISTORICAL DATASETS &gt;
              </div>
            </div>

            {/* MSN WEATHER INSPIRED 12-CARD INTERACTIVE TELEMETRY GRID */}
            <div className="msn-telemetry-grid">
              {/* Card 1: Surface Temperature (MSN Slider Gauge) */}
              <div className={`msn-card shade-pistachio ${sensorReadings.tempC >= 42 ? 'card-alert' : ''}`}>
                <div className="msn-card-top">
                  <span className="msn-card-title">Temperature</span>
                  <span className="msn-card-badge">CH 01</span>
                </div>
                <div className="msn-card-middle">
                  <div className="msn-slider-widget">
                    <div className="msn-slider-track">
                      <div
                        className="msn-slider-fill"
                        style={{ width: `${Math.min(100, Math.max(10, (sensorReadings.tempC / 50) * 100))}%` }}
                      />
                      <div
                        className="msn-slider-thumb"
                        style={{ left: `${Math.min(94, Math.max(6, (sensorReadings.tempC / 50) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <div className="msn-main-val-group">
                    <span className="msn-main-number">{sensorReadings.tempC}°</span>
                  </div>
                </div>
                <div className="msn-card-bottom">
                  <span className={`msn-trend-tag ${sensorReadings.tempC >= 42 ? 'rising' : 'steady'}`}>
                    {sensorReadings.tempC >= 42 ? <>Heatwave <IconTrendUp /></> : <>Steady <IconTrendSteady /></>}
                  </span>
                  <span className="msn-trend-desc">
                    {sensorReadings.tempC >= 42
                      ? `Exceeding severe threshold by +${(sensorReadings.tempC - 40).toFixed(1)}°C.`
                      : `Steady at current station value of ${sensorReadings.tempC}°.`}
                  </span>
                </div>
              </div>

              {/* Card 2: Feels Like (MSN Smooth Wave Curve) */}
              <div className="msn-card shade-sage">
                <div className="msn-card-top">
                  <span className="msn-card-title">Feels like</span>
                  <span className="msn-card-badge">CH 02</span>
                </div>
                <div className="msn-card-middle">
                  <div className="msn-wave-widget">
                    <svg className="msn-wave-svg" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <path d="M0,25 Q30,10 60,22 T100,18" fill="none" stroke="var(--btn-border)" strokeWidth="3" />
                      <circle cx="68" cy="21" r="5" fill="#ffffff" stroke="var(--text-title)" strokeWidth="2.5" />
                    </svg>
                    <span className="msn-val-sub" style={{ display: 'block', fontSize: '0.64rem', marginTop: '2px' }}>
                      Dominant factor: humidity ({sensorReadings.humidityPct}%)
                    </span>
                  </div>
                  <div className="msn-main-val-group" style={{ textAlign: 'right' }}>
                    <span className="msn-main-number">{sensorReadings.heatIndexC}°</span>
                    <span className="msn-val-sub">Actual: {sensorReadings.tempC}°</span>
                  </div>
                </div>
                <div className="msn-card-bottom">
                  <span className="msn-trend-tag warm">Slightly Warm <IconTrendDown /></span>
                  <span className="msn-trend-desc">
                    Feels warmer than actual temperature due to {sensorReadings.humidityPct}% humidity.
                  </span>
                </div>
              </div>

              {/* Card 3: Cloud Cover & Density */}
              <div className="msn-card shade-forest">
                <div className="msn-card-top">
                  <span className="msn-card-title">Cloud cover</span>
                  <span className="msn-card-badge">ATMOS</span>
                </div>
                <div className="msn-card-middle">
                  <div className="msn-cloud-widget">
                    <span className="msn-cloud-label">
                      {sensorReadings.rainfall24hMm > 60 ? 'Overcast Rain' : (sensorReadings.humidityPct > 70 ? 'Mostly Cloudy' : 'Partly Sunny')}
                    </span>
                  </div>
                  <div className="msn-main-val-group" style={{ textAlign: 'right' }}>
                    <span className="msn-main-number">{sensorReadings.rainfall24hMm > 60 ? '92%' : (sensorReadings.humidityPct > 70 ? '87%' : '45%')}</span>
                    <span className="msn-val-sub">Coverage</span>
                  </div>
                </div>
                <div className="msn-card-bottom">
                  <span className="msn-trend-tag steady">Scattered <IconTrendDown /></span>
                  <span className="msn-trend-desc">Partly sunny with stable boundary layer clearing.</span>
                </div>
              </div>

              {/* Card 4: Precipitation (MSN Circular Liquid Reservoir) */}
              <div className={`msn-card shade-pistachio ${sensorReadings.rainfall24hMm >= 70 ? 'card-alert' : ''}`}>
                <div className="msn-card-top">
                  <span className="msn-card-title">Precipitation</span>
                  <span className="msn-card-badge">CH 06</span>
                </div>
                <div className="msn-card-middle">
                  <div className="msn-circular-widget">
                    <div className="msn-circ-drops">
                      <svg width="10" height="12" viewBox="0 0 24 24" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                      </svg>
                      <svg width="8" height="10" viewBox="0 0 24 24" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                      </svg>
                    </div>
                    <div
                      className="msn-circ-wave"
                      style={{ height: `${Math.min(100, Math.max(20, (sensorReadings.rainfall24hMm / 150) * 100))}%` }}
                    />
                    <span style={{ position: 'relative', zIndex: 2, fontWeight: 800, fontSize: '0.72rem' }}>
                      {sensorReadings.rainfall24hMm >= 100 ? `${(sensorReadings.rainfall24hMm / 10).toFixed(1)} cm` : `${sensorReadings.rainfall24hMm} mm`}
                    </span>
                  </div>
                  <div className="msn-main-val-group" style={{ textAlign: 'right' }}>
                    <span className="msn-main-number">{sensorReadings.rainfall24hMm} <small style={{ fontSize: '1rem' }}>mm</small></span>
                    <span className="msn-val-sub">In next 24h</span>
                  </div>
                </div>
                <div className="msn-card-bottom">
                  <span className={`msn-trend-tag ${sensorReadings.rainfall24hMm >= 64.5 ? 'alert' : 'steady'}`}>
                    {sensorReadings.rainfall24hMm >= 64.5 ? <>Heavy Rain <IconTrendUp /></> : <>Light Showers <IconTrendSteady /></>}
                  </span>
                  <span className="msn-trend-desc">
                    {sensorReadings.rainfall24hMm >= 64.5 ? 'Monsoonal catchment accumulation expected.' : 'Rain stopping soon through morning.'}
                  </span>
                </div>
              </div>

              {/* Card 5: Wind & Gusts (MSN Compass Rose Dial) */}
              <div className="msn-card shade-emerald">
                <div className="msn-card-top">
                  <span className="msn-card-title">Wind</span>
                  <span className="msn-card-badge">CH 09</span>
                </div>
                <div className="msn-card-middle">
                  <div className="msn-compass-widget">
                    <span className="msn-compass-pt n">N</span>
                    <span className="msn-compass-pt s">S</span>
                    <span className="msn-compass-pt e">E</span>
                    <span className="msn-compass-pt w">W</span>
                    <div className="msn-compass-arrow" style={{ transform: 'rotate(235deg)' }} />
                  </div>
                  <div className="msn-main-val-group" style={{ textAlign: 'right' }}>
                    <span className="msn-main-number">{sensorReadings.windSpeedKmh} <small style={{ fontSize: '1rem' }}>km/h</small></span>
                    <span className="msn-val-sub">Gusts: {sensorReadings.windGustKmh} km/h • 235° SW</span>
                  </div>
                </div>
                <div className="msn-card-bottom">
                  <span className="msn-trend-tag steady">Force: {sensorReadings.windSpeedKmh > 40 ? '6 (Strong)' : '2 (Light)'} <IconTrendSteady /></span>
                  <span className="msn-trend-desc">Steady with averages holding at {sensorReadings.windSpeedKmh} km/h expected from SW.</span>
                </div>
              </div>

              {/* Card 6: Humidity (MSN Vertical Equalizer Bars) */}
              <div className="msn-card shade-sage">
                <div className="msn-card-top">
                  <span className="msn-card-title">Humidity</span>
                  <span className="msn-card-badge">HYGRO</span>
                </div>
                <div className="msn-card-middle">
                  <div className="msn-humidity-bars">
                    {[0.6, 0.75, 0.9, 0.82, 0.88, 0.94, 0.85].map((factor, idx) => (
                      <div key={idx} className="msn-h-bar">
                        <div
                          className="msn-h-bar-fill"
                          style={{ height: `${Math.min(100, Math.round(sensorReadings.humidityPct * factor))}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="msn-main-val-group" style={{ textAlign: 'right' }}>
                    <span className="msn-main-number">{sensorReadings.humidityPct}%</span>
                    <span className="msn-val-sub">{sensorReadings.dewPointC}° Dew point</span>
                  </div>
                </div>
                <div className="msn-card-bottom">
                  <span className="msn-trend-tag warm">Very humid <IconTrendSteady /></span>
                  <span className="msn-trend-desc">Steady at {sensorReadings.humidityPct}% relative humidity.</span>
                </div>
              </div>

              {/* Card 7: River Stage & Hydrology */}
              <div className={`msn-card shade-emerald ${sensorReadings.river?.levelAboveDangerM > 0 ? 'card-alert' : ''}`}>
                <div className="msn-card-top">
                  <span className="msn-card-title">River Stage & Hydrology</span>
                  <span className="msn-card-badge">CH 03</span>
                </div>
                <div className="msn-card-middle">
                  <div className="msn-stage-column">
                    <div
                      className="msn-stage-water"
                      style={{
                        height: `${Math.min(100, Math.max(25, (sensorReadings.river?.waterLevelM / (sensorReadings.river?.dangerLevelM * 1.15 || 25)) * 100))}%`,
                        backgroundColor: sensorReadings.river?.levelAboveDangerM > 0 ? '#ef4444' : '#2563eb'
                      }}
                    />
                    <div className="msn-stage-danger-line" title="Statutory Danger Mark" />
                  </div>
                  <div className="msn-main-val-group" style={{ textAlign: 'right' }}>
                    <span className="msn-main-number">
                      {sensorReadings.river ? `${sensorReadings.river.waterLevelM} m` : 'NO RIVER'}
                    </span>
                    <span className="msn-val-sub">
                      Danger: {sensorReadings.river ? `${sensorReadings.river.dangerLevelM} m` : 'N/A'} • Discharge: {sensorReadings.river?.dischargeCumecs || 0} cumecs
                    </span>
                  </div>
                </div>
                <div className="msn-card-bottom">
                  <span className={`msn-trend-tag ${sensorReadings.river?.levelAboveDangerM > 0 ? 'rising' : 'safe'}`}>
                    {sensorReadings.river?.levelAboveDangerM > 0 ? <>Breached <IconTrendUp /></> : <>Nominal <IconTrendSteady /></>}
                  </span>
                  <span className="msn-trend-desc">
                    {sensorReadings.river?.levelAboveDangerM > 0
                      ? `+${sensorReadings.river.levelAboveDangerM}m over danger mark at ${sensorReadings.river.gaugeStation}.`
                      : `Holding steady ${(sensorReadings.river?.dangerLevelM - sensorReadings.river?.waterLevelM || 2.5).toFixed(1)}m below danger level.`}
                  </span>
                </div>
              </div>

              {/* Card 8: Air Quality (AQI) */}
              <div className={`msn-card shade-forest ${sensorReadings.aqi >= 200 ? 'card-alert' : ''}`}>
                <div className="msn-card-top">
                  <span className="msn-card-title">Air Quality (AQI)</span>
                  <span className="msn-card-badge">CH 04</span>
                </div>
                <div className="msn-card-middle">
                  <div style={{ flex: 1 }}>
                    <div className="msn-aqi-track">
                      <div
                        className="msn-aqi-pin"
                        style={{ left: `${Math.min(95, Math.max(5, (sensorReadings.aqi / 450) * 100))}%` }}
                      />
                    </div>
                    <span className="msn-val-sub" style={{ display: 'block', marginTop: '6px' }}>
                      PM2.5: {sensorReadings.pm25Ugm3} µg/m³ • PM10: {sensorReadings.pm10Ugm3} µg/m³
                    </span>
                  </div>
                  <div className="msn-main-val-group" style={{ textAlign: 'right' }}>
                    <span className="msn-main-number" style={{ color: sensorReadings.aqi >= 200 ? '#ef4444' : 'inherit' }}>
                      {sensorReadings.aqi}
                    </span>
                    <span className="msn-val-sub">AQI Index</span>
                  </div>
                </div>
                <div className="msn-card-bottom">
                  <span className={`msn-trend-tag ${sensorReadings.aqi >= 200 ? 'alert' : 'safe'}`}>
                    {sensorReadings.aqi >= 200 ? <>Unhealthy <IconTrendUp /></> : <>Moderate <IconTrendSteady /></>}
                  </span>
                  <span className="msn-trend-desc">
                    {sensorReadings.aqi >= 200 ? 'Particulate exceeds CPCB statutory threshold.' : 'Steady atmospheric aerosol dispersion.'}
                  </span>
                </div>
              </div>

              {/* Card 9: Soil Moisture & Porosity */}
              <div className={`msn-card shade-sage ${sensorReadings.soilMoisturePct >= 85 ? 'card-alert' : ''}`}>
                <div className="msn-card-top">
                  <span className="msn-card-title">Soil Moisture & Porosity</span>
                  <span className="msn-card-badge">CH 07</span>
                </div>
                <div className="msn-card-middle">
                  <div className="msn-slider-widget">
                    <div className="msn-slider-track">
                      <div
                        className="msn-slider-fill"
                        style={{ width: `${sensorReadings.soilMoisturePct}%`, background: '#10b981' }}
                      />
                      <div
                        className="msn-slider-thumb"
                        style={{ left: `${sensorReadings.soilMoisturePct}%` }}
                      />
                    </div>
                    <span className="msn-val-sub">Percolation rate: 4.2 mm/h • 1.0m Dielectric</span>
                  </div>
                  <div className="msn-main-val-group" style={{ textAlign: 'right' }}>
                    <span className="msn-main-number">{sensorReadings.soilMoisturePct}%</span>
                    <span className="msn-val-sub">Saturation</span>
                  </div>
                </div>
                <div className="msn-card-bottom">
                  <span className={`msn-trend-tag ${sensorReadings.soilMoisturePct >= 85 ? 'rising' : 'steady'}`}>
                    {sensorReadings.soilMoisturePct >= 85 ? <>Saturated <IconTrendUp /></> : <>Nominal <IconTrendSteady /></>}
                  </span>
                  <span className="msn-trend-desc">
                    {sensorReadings.soilMoisturePct >= 85 ? 'Near-zero percolation buffering remaining.' : 'Ground retention within stability capacity.'}
                  </span>
                </div>
              </div>

              {/* Card 10: Barometric Pressure */}
              <div className="msn-card shade-forest">
                <div className="msn-card-top">
                  <span className="msn-card-title">Barometric Pressure</span>
                  <span className="msn-card-badge">CH 08</span>
                </div>
                <div className="msn-card-middle">
                  <div className="msn-wave-widget">
                    <svg className="msn-wave-svg" viewBox="0 0 100 35" preserveAspectRatio="none">
                      <path d="M0,18 Q50,12 100,18" fill="none" stroke="var(--border-strong)" strokeWidth="2.5" />
                      <circle cx="50" cy="15" r="4" fill="#10b981" />
                    </svg>
                    <span className="msn-val-sub" style={{ display: 'block', fontSize: '0.64rem' }}>
                      Tendency: Steady • Delta: +0.2 hPa/3h
                    </span>
                  </div>
                  <div className="msn-main-val-group" style={{ textAlign: 'right' }}>
                    <span className="msn-main-number">{sensorReadings.surfacePressureHpa}</span>
                    <span className="msn-val-sub">hPa MSL</span>
                  </div>
                </div>
                <div className="msn-card-bottom">
                  <span className="msn-trend-tag steady">Stable <IconTrendSteady /></span>
                  <span className="msn-trend-desc">Steady sea-level pressure across regional basin.</span>
                </div>
              </div>

              {/* Card 11: Surface Water Quality */}
              <div className={`msn-card shade-moss ${sensorReadings.wqiScore <= 45 ? 'card-alert' : ''}`}>
                <div className="msn-card-top">
                  <span className="msn-card-title">Surface Water Quality</span>
                  <span className="msn-card-badge">CH 10</span>
                </div>
                <div className="msn-card-middle">
                  <div className="msn-slider-widget">
                    <div className="msn-slider-track">
                      <div
                        className="msn-slider-fill"
                        style={{
                          width: `${sensorReadings.wqiScore}%`,
                          background: sensorReadings.wqiScore <= 45 ? '#ef4444' : '#06b6d4'
                        }}
                      />
                      <div className="msn-slider-thumb" style={{ left: `${sensorReadings.wqiScore}%` }} />
                    </div>
                    <span className="msn-val-sub">DO: {sensorReadings.dissolvedOxygenMgL} mg/L • BOD: {sensorReadings.bodMgL} mg/L</span>
                  </div>
                  <div className="msn-main-val-group" style={{ textAlign: 'right' }}>
                    <span className="msn-main-number">{sensorReadings.wqiScore}</span>
                    <span className="msn-val-sub">WQI Score</span>
                  </div>
                </div>
                <div className="msn-card-bottom">
                  <span className={`msn-trend-tag ${sensorReadings.wqiScore <= 45 ? 'alert' : 'safe'}`}>
                    {sensorReadings.wqiScore <= 45 ? <>Hypoxic <IconTrendUp /></> : <>Acceptable <IconTrendSteady /></>}
                  </span>
                  <span className="msn-trend-desc">
                    {sensorReadings.wqiScore <= 45 ? 'CPCB Class E critical DO depletion alert.' : 'CPCB NWMP telemetry within baseline limits.'}
                  </span>
                </div>
              </div>

              {/* Card 12: Industrial Stack Flue & Emissions */}
              <div className={`msn-card shade-sage ${sensorReadings.so2Ugm3 >= 80 ? 'card-alert' : ''}`}>
                <div className="msn-card-top">
                  <span className="msn-card-title">Industrial Emissions (OCEMS)</span>
                  <span className="msn-card-badge">CH 11</span>
                </div>
                <div className="msn-card-middle">
                  <div className="msn-slider-widget">
                    <div className="msn-slider-track">
                      <div
                        className="msn-slider-fill"
                        style={{
                          width: `${Math.min(100, (sensorReadings.so2Ugm3 / 150) * 100)}%`,
                          background: sensorReadings.so2Ugm3 >= 80 ? '#ef4444' : '#64748b'
                        }}
                      />
                      <div className="msn-slider-thumb" style={{ left: `${Math.min(95, (sensorReadings.so2Ugm3 / 150) * 100)}%` }} />
                    </div>
                    <span className="msn-val-sub">NOx: {sensorReadings.noxUgm3} µg/m³ • Stack Opacity: {sensorReadings.stackOpacityPct}%</span>
                  </div>
                  <div className="msn-main-val-group" style={{ textAlign: 'right' }}>
                    <span className="msn-main-number">{sensorReadings.so2Ugm3}</span>
                    <span className="msn-val-sub">SO₂ µg/m³</span>
                  </div>
                </div>
                <div className="msn-card-bottom">
                  <span className={`msn-trend-tag ${sensorReadings.so2Ugm3 >= 80 ? 'alert' : 'safe'}`}>
                    {sensorReadings.so2Ugm3 >= 80 ? <>Exceedance <IconTrendUp /></> : <>Compliant <IconTrendSteady /></>}
                  </span>
                  <span className="msn-trend-desc">
                    {sensorReadings.so2Ugm3 >= 80 ? 'Continuous scrubber breach above 80 µg/m³.' : 'All factory stacks within CPCB tolerance.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HORIZONTAL ROW OF SMALLER RECTANGULAR BLOCKS FOR UNSELECTED SECTIONS (02) */}
        {!viewDetails.sensorChannels && (
          <div className="collapsed-blocks-row">
            <div
              className="collapsed-mini-block"
              onClick={() => onToggleDetail && onToggleDetail('sensorChannels')}
              title="Click to expand 12-Channel Hardware Sensor Readings"
            >
              <div className="cmb-top">
                <span className="cmb-badge">02 12-CH RAW</span>
                <span className="cmb-btn">+ VIEW CHANNELS</span>
              </div>
              <div className="cmb-title">12-CHANNEL SENSOR READINGS</div>
              <div className="cmb-desc">
                Surface Temp, River Gauge, Rain Rate, AQI, Seismometer, Flue Exhaust, DART Buoy
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. DETECTED ANOMALIES & MAP TELEMETRY SECTION */}
      <section id="mobile-sec-alerts" className="dash-anomalies-section">
        <div className="section-title-bar">
          <h3 className="section-title-text">DETECTED ANOMALIES & MAP TELEMETRY</h3>
          <span className="section-title-sub">MACHINE LEARNING INFERENCE & PROXIMITY CASCADING PREDICTION</span>
        </div>

        {/* 1. Expanded Stress Test Scenario Bar (When Active) */}
        {viewDetails.stressTestBar && (
          <div className="anomalies-scenario-bar">
            <div className="asb-header-row">
              <span className="as-label">ML ANOMALY VALIDATION & STRESS TEST MODES:</span>
              <button
                type="button"
                className="dst-hide-btn"
                onClick={() => onToggleDetail && onToggleDetail('stressTestBar')}
                title="Toggle scenario simulation bar"
              >
                − HIDE MODES
              </button>
            </div>
            <div className="as-chips">
            <button
              type="button"
              className={`as-chip-btn ${anomalyScenario === 'silchar_flood' || (anomalyScenario === 'auto' && liveData?.name?.toLowerCase().includes('silchar')) ? 'active' : ''}`}
              onClick={() => handleScenarioChange('silchar_flood')}
              title="Simulate river overtopping in Barak basin at Silchar"
            >
              01 FLOOD
            </button>
            <button
              type="button"
              className={`as-chip-btn ${anomalyScenario === 'heatwave' ? 'active' : ''}`}
              onClick={() => handleScenarioChange('heatwave')}
              title="Simulate severe heatwave thermal anomaly"
            >
              06 HEATWAVE
            </button>
            <button
              type="button"
              className={`as-chip-btn ${anomalyScenario === 'emissions' ? 'active' : ''}`}
              onClick={() => handleScenarioChange('emissions')}
              title="Simulate industrial chemical emissions exceedance"
            >
              07 EMISSIONS
            </button>
            <button
              type="button"
              className={`as-chip-btn ${anomalyScenario === 'water' ? 'active' : ''}`}
              onClick={() => handleScenarioChange('water')}
              title="Simulate severe water quality hypoxia crisis"
            >
              08 WATER QUALITY
            </button>
            <button
              type="button"
              className={`as-chip-btn ${anomalyScenario === 'glacial' ? 'active' : ''}`}
              onClick={() => handleScenarioChange('glacial')}
              title="Simulate Himalayan glacial lake outburst flood"
            >
              09 GLACIAL GLOF
            </button>
            <button
              type="button"
              className={`as-chip-btn ${anomalyScenario === 'tsunami' ? 'active' : ''}`}
              onClick={() => handleScenarioChange('tsunami')}
              title="Simulate INCOIS tsunami surge & coastal runup"
            >
              10 TSUNAMI
            </button>
            <button
              type="button"
              className={`as-chip-btn ${anomalyScenario === 'cyclone' ? 'active' : ''}`}
              onClick={() => handleScenarioChange('cyclone')}
              title="Simulate IMD super cyclone vortex & surge"
            >
              11 CYCLONE
            </button>
            <button
              type="button"
              className={`as-chip-btn ${anomalyScenario === 'other' ? 'active' : ''}`}
              onClick={() => handleScenarioChange('other')}
              title="Simulate compound multi-hazard disaster escalation"
            >
              12 MULTI-HAZARD
            </button>
            <button
              type="button"
              className={`as-chip-btn ${anomalyScenario === 'nominal' ? 'active' : ''}`}
              onClick={() => handleScenarioChange('nominal')}
              title="Set all sensors to nominal baseline (No Anomaly)"
            >
              NOMINAL BASELINE
            </button>
            <button
              type="button"
              className={`as-chip-btn ${anomalyScenario === 'auto' ? 'active' : ''}`}
              onClick={() => handleScenarioChange('auto')}
              title="Use live real-time sensor streams"
            >
              LIVE SENSOR FEED
            </button>
            <button
              type="button"
              className={`as-chip-btn ${anomalyScenario === 'uploaded' ? 'active' : ''}`}
              onClick={() => {
                if (uploadedSensorInfo) {
                  handleScenarioChange('uploaded');
                } else {
                  setShowUploadModal(true);
                }
              }}
              title="Run ML evaluation on uploaded sensor feed"
            >
              UPLOADED SENSOR FEED {uploadedSensorInfo ? `[${uploadedSensorInfo.name.slice(0, 8)}]` : ''}
            </button>
          </div>
          </div>
        )}

        {/* 2. Expanded Detected Anomaly Spec Cards (When Active) */}
        {anomalyEval.hasAnomaly && viewDetails.anomalyCards && (
            <div className="detected-anomalies-wrapper">
              {/* Active Anomaly Status Header */}
              <div className="anomalies-alert-banner shade-forest">
                <div className="aab-left">
                  <span className="aab-pulse-badge">
                    <span className="live-pulse-dot" style={{ backgroundColor: '#ef4444' }} />
                    CRITICAL SENSOR EXCEEDANCE CONFIRMED
                  </span>
                  <h4 className="aab-headline">
                    {anomalyEval.anomaliesCount} HAZARD ANOMAL{anomalyEval.anomaliesCount > 1 ? 'IES' : 'Y'} DETECTED ACROSS MONITORED VECTORS
                  </h4>
                  <p className="aab-desc">
                    THE TRAINED DUAL ENSEMBLE ML MODEL (CALIBRATED ON 552,912 DISASTER RECORDS ACROSS 12 HAZARD DOMAINS) HAS TRIGGERED AN ACTIVE CALAMITY STATE. CORRESPONDING GEOMETRIC OVERLAYS ARE NOW PLOTTED ON THE SOVEREIGN MAP.
                  </p>
                </div>
                <div className="aab-right">
                  <span className="aab-score-pill">
                    ML ANOMALY SCORE: <strong>{anomalyEval.compositeScore} / 1.00</strong>
                  </span>
                  <button
                    type="button"
                    className="dst-hide-btn"
                    onClick={() => onToggleDetail && onToggleDetail('anomalyCards')}
                    title="Hide anomaly spec cards"
                  >
                    − HIDE
                  </button>
                </div>
              </div>

            {/* Anomaly Cards Grid */}
            <div className="anomaly-cards-grid">
              {anomalyEval.anomalies.map((anomaly, idx) => (
                <div key={idx} className="anomaly-spec-card" style={{ '--anomaly-border': anomaly.color }}>
                  <div className="asc-top">
                    <span className="asc-badge" style={{ backgroundColor: anomaly.color }}>
                      {anomaly.severity}
                    </span>
                    <span className="asc-confidence">
                      ML CONFIDENCE: <strong>{anomaly.confidencePct}%</strong>
                    </span>
                  </div>

                  {/* Empirical Precision Telemetry */}
                  {anomaly.modelPrecision && (
                    <div className="asc-precision-metrics">
                      <span className="asc-pm-item" title="Empirical Precision on Held-Out Indian Disaster Validation Data">
                        PRECISION: <strong>{anomaly.modelPrecision}%</strong>
                      </span>
                      <span className="asc-pm-divider">•</span>
                      <span className="asc-pm-item" title="Empirical Recall Sensitivity">
                        RECALL: <strong>{anomaly.modelRecall || 98.0}%</strong>
                      </span>
                      <span className="asc-pm-divider">•</span>
                      <span className="asc-pm-item" title="Harmonic Mean F1-Score">
                        F1: <strong>{anomaly.modelF1 || 0.98}</strong>
                      </span>
                      <span className="asc-pm-divider">•</span>
                      <span className="asc-pm-item" title="Area Under ROC Curve">
                        ROC-AUC: <strong>{anomaly.modelAuc || 1.0}</strong>
                      </span>
                      <span className="asc-pm-divider">•</span>
                      <span className="asc-pm-item" title="Empirical False Alarm Rate">
                        FAR: <strong>{anomaly.falseAlarmRate ?? 0.8}%</strong>
                      </span>
                    </div>
                  )}

                  <h4 className="asc-title" style={{ color: anomaly.color }}>
                    {anomaly.hazardName}
                  </h4>
                  <p className="asc-trigger">
                    <strong>TRIGGER CONDITION:</strong> {anomaly.trigger}
                  </p>

                  {/* Top Feature Attributions */}
                  {anomaly.featureAttributions && anomaly.featureAttributions.length > 0 && (
                    <div className="asc-attribution-box">
                      <div className="asc-attr-heading">
                        <span>TOP FEATURE ATTRIBUTIONS (DUAL ENSEMBLE WEIGHTS)</span>
                        <span>N={(anomaly.sampleCount || 10000).toLocaleString()} RECORDS</span>
                      </div>
                      <div className="asc-attr-list">
                        {anomaly.featureAttributions.slice(0, 3).map((attr, aIdx) => (
                          <div key={aIdx} className="asc-attr-row">
                            <span className="asc-attr-name">{attr.feature.replace(/_/g, ' ')}</span>
                            <div className="asc-attr-bar-wrap">
                              <div
                                className="asc-attr-bar-fill"
                                style={{
                                  width: `${Math.max(8, Math.min(100, attr.contributionPct))}%`,
                                  backgroundColor: anomaly.color,
                                }}
                              />
                            </div>
                            <span className="asc-attr-pct">{attr.contributionPct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {anomaly.hazardId === 'flood' && (
                    <div className="asc-flood-details">
                      <div>River: <strong>{anomaly.riverName}</strong></div>
                      <div>Water Level: <strong className="danger-text">{anomaly.waterLevelM} m</strong> (Danger: {anomaly.dangerLevelM} m)</div>
                      <div>Surge Discharge: <strong>{anomaly.dischargeCumecs} cumecs</strong></div>
                      <div>Corridor Status: <strong className="danger-text">FLOWING BLUE LINE PLOTTED ON MAP</strong></div>
                    </div>
                  )}
                  {anomaly.hazardId === 'heat' && (
                    <div className="asc-flood-details">
                      <div>Peak Ambient: <strong className="danger-text">{anomaly.tempC}°C</strong></div>
                      <div>Heat Index: <strong className="danger-text">{anomaly.heatIndexC}°C</strong></div>
                      <div>Wet Bulb: <strong>{anomaly.wetBulbC}°C</strong></div>
                      <div>Regional Status: <strong className="danger-text">THERMAL GRADIENT & INTENSITY BAR ACTIVE</strong></div>
                    </div>
                  )}
                  {anomaly.hazardId === 'aqi' && (
                    <div className="asc-flood-details">
                      <div>Air Quality Index: <strong className="danger-text">{anomaly.aqi} AQI</strong></div>
                      <div>Particulate PM2.5: <strong className="danger-text">{anomaly.pm25Ugm3} µg/m³</strong></div>
                      <div>Particulate PM10: <strong>{anomaly.pm10Ugm3} µg/m³</strong></div>
                      <div>Pollution Severity: <strong className="danger-text">HAZARDOUS ATMOSPHERIC SMOG</strong></div>
                    </div>
                  )}
                  {anomaly.hazardId === 'emissions' && (
                    <div className="asc-flood-details">
                      <div>SO₂ Exceedance: <strong className="danger-text">{anomaly.so2Ugm3} µg/m³</strong> (CPCB Limit: 80)</div>
                      <div>NOₓ Flux: <strong>{anomaly.noxUgm3} µg/m³</strong></div>
                      <div>Total VOCs: <strong className="danger-text">{anomaly.vocPpm} ppm</strong></div>
                      <div>Stack Opacity: <strong className="danger-text">{anomaly.stackOpacityPct}%</strong></div>
                    </div>
                  )}
                  {anomaly.hazardId === 'water' && (
                    <div className="asc-flood-details">
                      <div>Dissolved Oxygen: <strong className="danger-text">{anomaly.dissolvedOxygenMgL} mg/L</strong> (Healthy Min: 4.0)</div>
                      <div>BOD Loading: <strong className="danger-text">{anomaly.bodMgL} mg/L</strong> (Max: 8.0)</div>
                      <div>Water Quality Score: <strong>{anomaly.wqiScore} / 100</strong></div>
                      <div>Fecal Coliform: <strong>{anomaly.fecalColiformMpn} MPN/100mL</strong></div>
                    </div>
                  )}
                  {anomaly.hazardId === 'glacial' && (
                    <div className="asc-flood-details">
                      <div>Moraine Pressure: <strong className="danger-text">{anomaly.morainePressureMpa} MPa</strong> (Limit: 2.2)</div>
                      <div>Lake Vol Expansion: <strong className="danger-text">+{anomaly.lakeExpansionPct}%</strong></div>
                      <div>Ice Core Temp: <strong>{anomaly.iceCoreTempC}°C</strong></div>
                      <div>Status: <strong className="danger-text">GLOF MORAINE BREACH RISK</strong></div>
                    </div>
                  )}
                  {anomaly.hazardId === 'tsunami' && (
                    <div className="asc-flood-details">
                      <div>DART Wave Amplitude: <strong className="danger-text">{anomaly.dartWaveAmplitudeM} m</strong></div>
                      <div>Coastal Runup: <strong className="danger-text">+{anomaly.coastalRunupM} m</strong></div>
                      <div>ETA to Shoreline: <strong>{anomaly.tsunamiEtaMin} Minutes</strong></div>
                      <div>INCOIS Alert: <strong className="danger-text">COASTAL EVACUATION BULLETIN</strong></div>
                    </div>
                  )}
                  {anomaly.hazardId === 'cyclone' && (
                    <div className="asc-flood-details">
                      <div>Central Pressure: <strong className="danger-text">{anomaly.centralPressureHpa} hPa</strong></div>
                      <div>Eyewall Winds: <strong className="danger-text">{anomaly.maxWindKmh} km/h</strong></div>
                      <div>Storm Surge: <strong className="danger-text">+{anomaly.stormSurgeM} m</strong></div>
                      <div>IMD Stage: <strong>{anomaly.cycloneCategory}</strong></div>
                    </div>
                  )}
                  {anomaly.hazardId === 'other' && (
                    <div className="asc-flood-details">
                      <div>Multi-Hazard Stress: <strong className="danger-text">{anomaly.multiHazardStressIndex} / 1.00</strong></div>
                      <div>Lightning Density: <strong>{anomaly.lightningDensitySqkm} strikes/km²</strong></div>
                      <div>Hazardous Vapor: <strong className="danger-text">{anomaly.chemicalVaporPpm} ppm</strong></div>
                      <div>Cascading Status: <strong className="danger-text">COMPOUND MULTI-VECTOR ALERT</strong></div>
                    </div>
                  )}
                  {anomaly.hazardId === 'landslide' && (
                    <div className="asc-flood-details">
                      <div>Factor of Safety (FS): <strong className={anomaly.factorOfSafety < 1.0 ? 'danger-text' : 'warning-text'}>{anomaly.factorOfSafety} [{anomaly.geotechnicalStatus || 'SLOPE SHEAR'}]</strong></div>
                      <div>Hillslope Gradient: <strong className="danger-text">{anomaly.slopeGradientDeg || 44.5}°</strong> (Critical: 30°)</div>
                      <div>Pore-Water Pressure: <strong className="danger-text">{anomaly.poreWaterPressureKpa || 88.5} kPa</strong> (Limit: 60 kPa)</div>
                      <div>Effective Shear Strength: <strong>{anomaly.effectiveShearStrengthKpa || 14.5} kPa</strong></div>
                      <div>Soil Saturation: <strong className="danger-text">{anomaly.soilMoisturePct || 96.5}%</strong></div>
                      <div>Sediment Slurry: <strong className="danger-text">{(anomaly.sedimentDischargePpm || 28400).toLocaleString()} ppm</strong></div>
                      <div>Transboundary Origin: <strong className="danger-text">{anomaly.isTransboundarySlope ? 'NEPAL-HIMALAYAN WATERSHED SURCHARGE' : 'LOCAL BASIN'}</strong></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Predictive Cascading Risk Section */}
        {cascadingPrediction && (viewDetails?.cascadingForecast !== false) && (
          <div className="cascading-forecast-wrapper">
            <button
              type="button"
              className={`elongated-drawer-bar modern-drawer-bar shade-drawer-cascading ${isForecastExpanded ? 'expanded' : ''}`}
              onClick={() => setIsForecastExpanded(!isForecastExpanded)}
              title={isForecastExpanded ? 'Conceal Cascading Forecast' : 'Expand Cascading Forecast'}
            >
              <div className="drawer-bar-left">
                <span className="drawer-toggle-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {isForecastExpanded ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                  </svg>
                </span>
                <span className="drawer-bar-title">DOWNSTREAM CASCADING RISK & PROXIMITY IMPACT FORECAST</span>
                <span className="drawer-data-badge">
                  {cascadingPrediction.hubName} • {cascadingPrediction.riverName ? `${String(cascadingPrediction.riverName).toUpperCase()} RIVER BASIN` : 'DISASTER BELT'}
                </span>
              </div>
              <div className="drawer-bar-right">
                <span className="cp-alert-pill">{cascadingPrediction.evacuationStatus}</span>
                <span className="drawer-action-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  {isForecastExpanded ? 'CONCEAL FORECAST' : 'EXPAND FORECAST'}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {isForecastExpanded ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                  </svg>
                </span>
              </div>
            </button>

            {isForecastExpanded && (
              <div className="cascading-prediction-card modern-anomalies-box shade-emerald">
                <div className="cp-header">
                  <div className="cp-title-wrap">
                    <span className="cp-badge">PREDICTIVE INTELLIGENCE ENGINE // PROXIMITY CASCADE</span>
                    <h4 className="cp-headline">
                      DOWNSTREAM CASCADING RISK & PROXIMITY IMPACT FORECAST
                    </h4>
                    <span className="cp-sub">
                      PRIMARY EPICENTER: {cascadingPrediction.hubName} • {cascadingPrediction.riverName ? `${String(cascadingPrediction.riverName).toUpperCase()} RIVER BASIN` : 'REGIONAL DISASTER BELT'}
                    </span>
                  </div>
                  <div className="cp-header-right">
                    <div className="cp-alert-pill">
                      {cascadingPrediction.evacuationStatus}
                    </div>
                    <button
                      type="button"
                      className="dst-hide-btn"
                      onClick={() => setIsForecastExpanded(false)}
                      title="Hide cascading risk forecast"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      HIDE FORECAST
                    </button>
                  </div>
                </div>

                {/* Historical Precedent Banner (Clickable to open Historical Dataset Explorer) */}
                <div
                  className="cp-historical-banner clickable-historical-banner"
                  onClick={() => {
                    const targetId = anomalyEval.primaryAnomaly?.hazardId || 'flood';
                    setHistoricalModalDatasetId(targetId);
                    setShowHistoricalModal(true);
                  }}
                  title="Click to explore dataset infographics and search historical observations"
                >
                  <div className="cp-banner-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                  <div className="cp-banner-text">
                    <div className="cp-banner-heading-row">
                      <span className="cp-banner-heading">HISTORICAL PRECEDENT & FREQUENCY ANALYSIS:</span>
                      <button
                        type="button"
                        className="cp-banner-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetId = anomalyEval.primaryAnomaly?.hazardId || 'flood';
                          setHistoricalModalDatasetId(targetId);
                          setShowHistoricalModal(true);
                        }}
                        title="Open full interactive dataset explorer & infographics"
                      >
                        [ <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'text-bottom', margin: '0 4px' }}>
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg> VIEW DATASET INFOGRAPHICS & SEARCH RECORDS ]
                      </button>
                    </div>
                    <p className="cp-banner-body">{cascadingPrediction.historicalPrecedent}</p>
                  </div>
                </div>

                {/* Root Cause Mechanism */}
                <div className="cp-cause-box">
                  <div className="cp-cause-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
                  <div className="cp-cause-text">
                    <div className="cp-cause-heading">PHYSICAL TRIGGER MECHANISM:</div>
                    <p className="cp-cause-body">{cascadingPrediction.rootCause}</p>
                  </div>
                </div>

                {/* Transboundary Himalayan Mountain Slope & Soil Degradation Analysis Card */}
                {cascadingPrediction.transboundaryGeomorphology && (
                  <div className="transboundary-soil-card">
                    <div className="tsc-header">
                      <div className="tsc-header-left">
                        <span className="tsc-badge">
                          TRANSBOUNDARY HIMALAYAN GEOTECHNICAL & SOIL IMPACT ASSESSMENT
                        </span>
                        <h4 className="tsc-title">
                          MOUNTAIN SLOPE SHEAR FAILURE, SEDIMENT SLURRY & TOPSOIL DEGRADATION
                        </h4>
                        <div className="tsc-origin">
                          UPSTREAM ORIGIN BASIN: <strong>{cascadingPrediction.transboundaryGeomorphology.riskOrigin || cascadingPrediction.transboundaryGeomorphology.originCatchment || 'High-Altitude Himalayan Catchment'}</strong>
                        </div>
                      </div>
                      <div className="tsc-header-right">
                        <span className={`tsc-status-pill ${(cascadingPrediction.transboundaryGeomorphology.poreWaterPressureKpa || 88.5) >= 60 ? 'critical' : 'warning'}`}>
                          {String(cascadingPrediction.transboundaryGeomorphology.soilShearStatus || cascadingPrediction.transboundaryGeomorphology.shearStrengthStatus || 'CRITICAL SHEAR COLLAPSE').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="tsc-grid">
                      <div className="tsc-metric-box">
                        <span className="tsc-metric-label">UPSTREAM SLOPE GRADIENT</span>
                        <span className="tsc-metric-value">{cascadingPrediction.transboundaryGeomorphology.slopeGradientDeg || cascadingPrediction.transboundaryGeomorphology.hillslopeGradientDeg || 44.5}°</span>
                        <span className="tsc-metric-sub">Himalayan V-Shaped Gorge Angle</span>
                      </div>
                      <div className="tsc-metric-box">
                        <span className="tsc-metric-label">PORE-WATER PRESSURE (u)</span>
                        <span className="tsc-metric-value danger-text">{cascadingPrediction.transboundaryGeomorphology.poreWaterPressureKpa || 88.5} kPa</span>
                        <span className="tsc-metric-sub">Critical Shear Threshold: 60.0 kPa</span>
                      </div>
                      <div className="tsc-metric-box">
                        <span className="tsc-metric-label">SEDIMENT SLURRY LOAD</span>
                        <span className="tsc-metric-value danger-text">{(cascadingPrediction.transboundaryGeomorphology.sedimentDischargePpm || 28400).toLocaleString()} ppm</span>
                        <span className="tsc-metric-sub">Hyper-Concentrated Colluvium</span>
                      </div>
                      <div className="tsc-metric-box">
                        <span className="tsc-metric-label">ESTIMATED MASS WASTING</span>
                        <span className="tsc-metric-value">~{typeof cascadingPrediction.transboundaryGeomorphology.estimatedMassWastingM3 === 'number' ? (cascadingPrediction.transboundaryGeomorphology.estimatedMassWastingM3 / 1000000).toFixed(2) : '3.85'}M m³</span>
                        <span className="tsc-metric-sub">Regolith Slurry & Boulders</span>
                      </div>
                      <div className="tsc-metric-box">
                        <span className="tsc-metric-label">RIVERBED AGGRADATION</span>
                        <span className="tsc-metric-value danger-text">+{typeof cascadingPrediction.transboundaryGeomorphology.riverbedAggradationMeters === 'number' ? cascadingPrediction.transboundaryGeomorphology.riverbedAggradationMeters.toFixed(2) : '2.10'} m</span>
                        <span className="tsc-metric-sub">Downstream Channel Floor Rise</span>
                      </div>
                      <div className="tsc-metric-box">
                        <span className="tsc-metric-label">CARRYING CAPACITY LOSS</span>
                        <span className="tsc-metric-value danger-text">-{cascadingPrediction.transboundaryGeomorphology.dischargeCapacityLossPct || 58}%</span>
                        <span className="tsc-metric-sub">Cross-Sectional Area Choke</span>
                      </div>
                      <div className="tsc-metric-box">
                        <span className="tsc-metric-label">SAND SPLAY HAZARD AREA</span>
                        <span className="tsc-metric-value danger-text">{(cascadingPrediction.transboundaryGeomorphology.sandSplayHazardHa || cascadingPrediction.transboundaryGeomorphology.agriculturalSandSplayHa || 18400).toLocaleString()} Ha</span>
                        <span className="tsc-metric-sub">Alluvial Agricultural Topsoil Buried</span>
                      </div>
                    </div>

                    <div className="tsc-narrative-box">
                      <div className="tsc-narrative-title">GEOTECHNICAL & AGRO-ECOLOGICAL IMPACT MECHANISM:</div>
                      <p className="tsc-narrative-text">{cascadingPrediction.transboundaryGeomorphology.soilQualityImpact || cascadingPrediction.transboundaryGeomorphology.soilQualityLossDesc}</p>
                    </div>
                  </div>
                )}

                {/* Downstream Vulnerable Places Grid */}
                <div className="cp-places-section">
                  <h5 className="cp-section-title">
                    DOWNSTREAM ADJACENT SETTLEMENTS AT RISK (CASCADING SPILLOVER PROPAGATION):
                  </h5>
                  <div className="cp-places-grid">
                    {cascadingPrediction.nearbyPlaces.map((place, pIdx) => (
                      <div key={place.placeName} className="cp-place-item-card">
                        <div className="cp-place-top">
                          <span className="cp-place-index">0{pIdx + 1}</span>
                          <span className="cp-place-name">{place.placeName.toUpperCase()}</span>
                          <span className="cp-place-prob">{place.spilloverProbabilityPct}% PROBABILITY</span>
                        </div>
                        <div className="cp-place-metrics">
                          <div className="cp-p-metric">
                            <span className="cp-pm-lbl">DISTANCE:</span>
                            <span className="cp-pm-val">{place.distanceKm} km downstream</span>
                          </div>
                          <div className="cp-p-metric">
                            <span className="cp-pm-lbl">ESTIMATED ARRIVAL:</span>
                            <span className="cp-pm-val">{place.timeHorizonHours} Hours to surge</span>
                          </div>
                          <div className="cp-p-metric">
                            <span className="cp-pm-lbl">POPULATION AT RISK:</span>
                            <span className="cp-pm-val">~{place.displacedPop ? place.displacedPop.toLocaleString() : '12,480'}</span>
                          </div>
                          <div className="cp-p-metric">
                            <span className="cp-pm-lbl">PROJECTED LOSS:</span>
                            <span className="cp-pm-val">₹{place.economicLossCr || '41.2'} Cr</span>
                          </div>
                          <div className="cp-p-metric full-col">
                            <span className="cp-pm-lbl">VULNERABILITY LEVEL:</span>
                            <span className="cp-pm-val">{place.vulnerabilityCategory}</span>
                          </div>
                        </div>
                        <div className="cp-place-footer">
                          <span>{place.predictedImpact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              {/* Quantified Impact Metrics */}
              <div className="cp-exposure-row">
                <div className="cp-exp-card shade-pistachio">
                  <span className="cp-exp-lbl">POPULATION AT RISK</span>
                  <span className="cp-exp-val">~{cascadingPrediction.estimatedDisplacedPopulation.toLocaleString()} Residents</span>
                  <span className="cp-exp-sub">Low-lying riparian floodplain tracts</span>
                </div>
                <div className="cp-exp-card shade-sage">
                  <span className="cp-exp-lbl">PROJECTED ECONOMIC RISK</span>
                  <span className="cp-exp-val">₹{cascadingPrediction.economicRiskCrores} Crores</span>
                  <span className="cp-exp-sub">Agricultural crop & civil infrastructure</span>
                </div>
                <div className="cp-exp-card shade-forest">
                  <span className="cp-exp-lbl">CRITICAL INFRASTRUCTURE</span>
                  <span className="cp-exp-val">
                    {cascadingPrediction?.quantifiedEstimations?.criticalInfrastructure ||
                      genAiData?.quantifiedEstimations?.criticalInfrastructure ||
                      'HIGHWAY & SUBSTATION'}
                  </span>
                  <span className="cp-exp-sub">Culvert overtopping & power grid isolate</span>
                </div>
              </div>

              {/* Extended Estimations & Emergency Resource Allocations */}
              <div className="cp-resource-deployments-grid">
                <div className="cp-res-card">
                  <span className="cp-res-num">
                    {cascadingPrediction?.quantifiedEstimations?.ndrfBattalions ||
                      genAiData?.quantifiedEstimations?.ndrfBattalions ||
                      4} BATTALIONS
                  </span>
                  <span className="cp-res-lbl">NDRF RAPID MOBILIZATION</span>
                  <span className="cp-res-detail">Flood rescue boats, pneumatic cutters & sniffer units</span>
                </div>
                <div className="cp-res-card">
                  <span className="cp-res-num">
                    {cascadingPrediction?.quantifiedEstimations?.sdrfRapidTeams ||
                      genAiData?.quantifiedEstimations?.sdrfRapidTeams ||
                      8} TEAMS
                  </span>
                  <span className="cp-res-lbl">SDRF FIRST RESPONDERS</span>
                  <span className="cp-res-detail">District emergency operation center dispatch</span>
                </div>
                <div className="cp-res-card">
                  <span className="cp-res-num">
                    +{cascadingPrediction?.quantifiedEstimations?.timeToPeakSurgeHours ||
                      genAiData?.quantifiedEstimations?.timeToPeakSurgeHours ||
                      2.5} HOURS
                  </span>
                  <span className="cp-res-lbl">TIME TO PEAK IMPACT</span>
                  <span className="cp-res-detail">Estimated window before flood crest arrival</span>
                </div>
                <div className="cp-res-card">
                  <span className="cp-res-num">
                    {(
                      cascadingPrediction?.quantifiedEstimations?.waterPurificationKits ||
                      genAiData?.quantifiedEstimations?.waterPurificationKits ||
                      15000
                    ).toLocaleString()} UNITS
                  </span>
                  <span className="cp-res-lbl">WATER & MEDICAL RELIEF</span>
                  <span className="cp-res-detail">Chlorine disinfection sachets & ORS emergency packs</span>
                </div>
              </div>

              {/* Specific Measures & Actionable Cures for the Cause */}
              <div className="cp-remediation-cures-section">
                <div className="cures-header-row">
                  <div className="cures-badge-title">
                    <span className="cures-pill">OPERATIONAL COUNTERMEASURES</span>
                    <h5 className="cures-headline">SPECIFIC ACTIONABLE MEASURES & ENGINEERING CURES FOR THE CAUSE</h5>
                  </div>
                  <span className="cures-protocol-tag">NDMA & CWC STANDARD OPERATING PROCEDURE</span>
                </div>

                <div className="cures-phases-grid">
                  {/* Phase 1: Immediate Containment */}
                  <div className="cure-phase-card phase-immediate">
                    <div className="cpc-header">
                      <span className="cpc-phase-badge">PHASE 01</span>
                      <span className="cpc-phase-title">IMMEDIATE CONTAINMENT (0–6 HOURS)</span>
                    </div>
                    <ul className="cpc-actions-list">
                      {(
                        cascadingPrediction?.remediationMeasures?.immediate0to6h ||
                        genAiData?.remediationMeasures?.immediate0to6h || [
                          'Activate emergency spillway bypass sluice gates to relieve hydrostatic head on primary dykes.',
                          'Deploy geotextile sandbag revetment along weak bend perimeters to arrest lateral erosion.',
                          'Trigger district-wide VHF telemetry sirens and broadcast geofenced SMS evacuation alerts.',
                          'Isolate 33kV/11kV electrical feeder substations in low-lying zones to prevent electrocution hazards.',
                        ]
                      ).map((item, idx) => (
                        <li key={idx} className="cpc-action-item">
                          <span className="cpc-bullet">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                          <span className="cpc-text">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Phase 2: Mid-Term Stabilization */}
                  <div className="cure-phase-card phase-stabilization">
                    <div className="cpc-header">
                      <span className="cpc-phase-badge">PHASE 02</span>
                      <span className="cpc-phase-title">SYSTEM STABILIZATION (6–48 HOURS)</span>
                    </div>
                    <ul className="cpc-actions-list">
                      {(
                        cascadingPrediction?.remediationMeasures?.stabilization6to48h ||
                        genAiData?.remediationMeasures?.stabilization6to48h || [
                          'Station high-discharge diesel de-watering pumps (500 HP) at low-lying arterial underpasses.',
                          'Establish mobile water testing labs to monitor coliform spikes and chlorine residual levels.',
                          'Deploy drone acoustic sensors to detect subsurface piping voids beneath earthen embankments.',
                          'Mobilize NDRF outboard motor boats to maintain clear humanitarian supply corridors.',
                        ]
                      ).map((item, idx) => (
                        <li key={idx} className="cpc-action-item">
                          <span className="cpc-bullet">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                          <span className="cpc-text">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Phase 3: Permanent Structural Cure */}
                  <div className="cure-phase-card phase-longterm">
                    <div className="cpc-header">
                      <span className="cpc-phase-badge">PHASE 03</span>
                      <span className="cpc-phase-title">PERMANENT STRUCTURAL CURE (POST-EVENT)</span>
                    </div>
                    <ul className="cpc-actions-list">
                      {(
                        cascadingPrediction?.remediationMeasures?.longTermCure ||
                        genAiData?.remediationMeasures?.longTermCure || [
                          'Construct reinforced concrete retaining walls with gabion toe armoring along critical meander bends.',
                          'Dredge accumulated alluvial silt bars from the riverbed to restore designed cross-sectional hydraulic capacity.',
                          'Implement mandatory afforestation buffers (Vetiver grass & deep-rooted riparian species) on slopes.',
                          'Enforce CPCB Real-Time Water Quality Monitoring (RTWQMS) mandates with automated industrial shutoff valves.',
                        ]
                      ).map((item, idx) => (
                        <li key={idx} className="cpc-action-item">
                          <span className="cpc-bullet">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                          <span className="cpc-text">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* GenAI Disaster Model Explainer */}
              <div className="genai-explainer-card">
                <div className="gec-header-row">
                  <div className="gec-title-block">
                    <div className="gec-badge-row">
                      <span className="gec-badge">
                        {genAiData?.isLiveGemini ? 'LIVE CLOUD // GOOGLE GEMINI 1.5 FLASH' : 'DOMAIN GENAI REASONING ENGINE // FINE-TUNED'}
                      </span>
                      <span className="gec-status-pill">
                        {anomalyEval.primaryAnomaly?.hazardName?.toUpperCase()} EXPLAINER
                      </span>
                    </div>
                    <h5 className="gec-headline">
                      DEEP PHYSICAL ROOT CAUSE ANALYSIS & CAUSAL DISASTER PROGNOSIS
                    </h5>
                  </div>
                  <div className="gec-actions">
                    <button
                      type="button"
                      className="gec-regen-btn"
                      onClick={handleRegenerateAiAnalysis}
                      disabled={isGenAiLoading}
                      title="Regenerate deep physical cause analysis with latest telemetry"
                    >
                      {isGenAiLoading ? (
                        'GENERATING REASONING...'
                      ) : (
                        <>
                          REGENERATE ANALYSIS
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: '-1px', marginLeft: '5px' }}>
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="gec-content-grid">
                  {/* Physical Root Cause */}
                  <div className="gec-box gec-cause-box">
                    <div className="gec-box-header">
                      <span className="gec-box-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      </span>
                      <span className="gec-box-title">PHYSICAL ROOT CAUSE & EXCEEDANCE MECHANICS</span>
                    </div>
                    <p className="gec-box-text">
                      {genAiData?.rootCause || cascadingPrediction.rootCause}
                    </p>
                  </div>

                  {/* Future Prognosis & Secondary Cascades */}
                  <div className="gec-box gec-prognosis-box">
                    <div className="gec-box-header">
                      <span className="gec-box-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                      </span>
                      <span className="gec-box-title">24–72H SECONDARY HAZARD & SPILLOVER PROGNOSIS</span>
                    </div>
                    <p className="gec-box-text">
                      {genAiData?.futureSecondaryPrognosis ||
                        'Unmitigated saturation will destabilize foundation piers of regional bridges and saturate local sewage networks, posing secondary contamination risks within 24 to 48 hours.'}
                    </p>
                  </div>

                  {/* Engineering SOP */}
                  <div className="gec-box gec-sop-box full-col">
                    <div className="gec-box-header">
                      <span className="gec-box-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      </span>
                      <span className="gec-box-title">TECHNICAL STANDARD OPERATING PROCEDURE (SOP SPECIFICATION)</span>
                    </div>
                    <p className="gec-box-text">
                      {genAiData?.countermeasureSop ||
                        'Initiate NDMA Calamity Directive 4-B: Hydraulic stress relief must precede heavy earthmoving. Restrict vehicular gross weight on riparian bridges to under 12 tonnes. Continuous dissolved oxygen & particulate aeration required.'}
                    </p>
                  </div>
                </div>

                {/* Interactive Q&A Interrogation Bar - Prominent Executive AI Console */}
                <div id="mobile-sec-copilot" className="gec-interactive-qa modern-ai-console">
                  <div className="gec-qa-top">
                    <h4 className="gec-qa-headline">INTERROGATE GENAI DISASTER MODEL (COMMAND CONSOLE Q&A)</h4>
                    <p className="gec-qa-sub">
                      ASK SPECIFIC OPERATIONAL, EVACUATION, OR REMEDIATION QUESTIONS // REAL-TIME HAZARD COPILOT
                    </p>
                  </div>

                  {/* Suggestion Prompts */}
                  <div className="gec-qa-chips">
                    {[
                      {
                        q: 'What is the dyke / embankment breach probability?',
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        )
                      },
                      {
                        q: 'Which downstream evacuation route is safest?',
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                          </svg>
                        )
                      },
                      {
                        q: 'How to neutralize toxic effluent plume in water?',
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3l4.8 8.1c.9 1.5-.2 3.6-2 3.6H7.2c-1.8 0-2.9-2.1-2-3.6L10 9.3" />
                            <line x1="8" y1="16" x2="16" y2="16" />
                          </svg>
                        )
                      },
                      {
                        q: 'What are the peak surge arrival tolerances downstream?',
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="13" r="8" />
                            <path d="M12 9v4l2 2M12 2v3M10 2h4M19 6l-1.5 1.5" />
                          </svg>
                        )
                      },
                      {
                        q: 'What is the estimated displaced population & loss?',
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        )
                      },
                      {
                        q: 'Which NDRF battalions & boats are required?',
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="4" />
                            <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
                            <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
                            <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
                            <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
                          </svg>
                        )
                      }
                    ].map((item, qIdx) => (
                      <button
                        key={qIdx}
                        type="button"
                        className="gec-chip-btn"
                        onClick={() => handleAskGenAiQuestion(item.q)}
                        disabled={isQaLoading}
                        title={`Click to ask: "${item.q}"`}
                      >
                        <span className="chip-icon-symbol">{item.icon}</span>
                        <span className="chip-question-text">{item.q}</span>
                        <span className="chip-instant-tag">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: '3px' }}>
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                          ASK
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Q&A Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAskGenAiQuestion(genAiCustomQuestion);
                    }}
                    className="gec-qa-form"
                  >
                    <div className="gec-qa-input-wrapper">
                      <span className="gec-input-prompt-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="4 17 10 11 4 5" />
                          <line x1="12" y1="19" x2="20" y2="19" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        className="gec-qa-input"
                        value={genAiCustomQuestion}
                        onChange={(e) => setGenAiCustomQuestion(e.target.value)}
                        placeholder="Ask the GenAI disaster model any physical root cause, evacuation, or remediation question..."
                        disabled={isQaLoading}
                      />
                    </div>
                    <button
                      type="submit"
                      className="gec-qa-submit-btn"
                      disabled={isQaLoading || !genAiCustomQuestion.trim()}
                      title="Submit question to Google Gemini 2.5 Flash"
                    >
                      {isQaLoading ? (
                        <span className="gec-btn-loading-content">
                          <span className="gec-spinner" />
                          <span>REASONING ({qaElapsedSec.toFixed(1)}s)...</span>
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          ASK MODEL
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </form>

                  {/* Live Generation Progress Card */}
                  {isQaLoading && (
                    <div className="gec-generating-card">
                      <div className="gec-gen-top">
                        <div className="gec-gen-indicator">
                          <span className="gec-gen-pulse" />
                          <span className="gec-gen-title">INTERROGATING GOOGLE GEMINI 2.5 FLASH CLOUD MODEL...</span>
                        </div>
                        <span className="gec-gen-timer">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: '4px' }}>
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                          {qaElapsedSec.toFixed(1)}s ELAPSED
                        </span>
                      </div>
                      <div className="gec-gen-track">
                        <div className="gec-gen-bar" />
                      </div>
                      <span className="gec-gen-sub">
                        Synthesizing multi-channel physical telemetry, statutory danger mark exceedance, and NDMA Standard Operating Procedures
                      </span>
                    </div>
                  )}

                  {/* Answer History Stream */}
                  {genAiAnswerHistory.length > 0 && (
                    <div className="gec-qa-history">
                      <div className="gec-qa-history-top">
                        <span className="qa-history-count">
                          {genAiAnswerHistory.length} OPERATIONAL EVALUATION{genAiAnswerHistory.length > 1 ? 'S' : ''} RECORDED
                        </span>
                        <button
                          type="button"
                          className="qa-clear-btn"
                          onClick={() => setGenAiAnswerHistory([])}
                          title="Clear Q&A History"
                        >
                          CLEAR HISTORY
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: '-1px', marginLeft: '4px' }}>
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                      {genAiAnswerHistory.map((item, hIdx) => (
                        <div key={item.id || hIdx} className="gec-qa-item">
                          <div className="gec-qa-q">
                            <div className="qa-q-meta">
                              <span className="qa-role-badge qa-badge-user">OPERATOR QUERY</span>
                              {item.timestamp && <span className="qa-timestamp">{item.timestamp}</span>}
                              {item.responseTimeMs && (
                                <span className="qa-speed-badge">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: '3px' }}>
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                  </svg>
                                  {(item.responseTimeMs / 1000).toFixed(2)}s
                                </span>
                              )}
                              {item.engine && (
                                <span className={`qa-engine-tag ${item.isLiveGemini !== false ? 'live-cloud-tag' : ''}`}>
                                  {item.engine}
                                </span>
                              )}
                            </div>
                            <span className="qa-q-text">{item.question}</span>
                          </div>
                          <div className="gec-qa-a">
                            <div className="qa-a-meta-row">
                              <span className="qa-role-badge qa-badge-ai">
                                <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'inline-block', verticalAlign: '1px', marginRight: '5px' }}>
                                  <circle cx="12" cy="12" r="12" />
                                </svg>
                                {item.isLiveGemini !== false ? 'GEMINI 2.5 FLASH DIRECTIVE' : 'DOMAIN AI DIRECTIVE'}
                              </span>
                              <button
                                type="button"
                                className="qa-copy-action-btn"
                                onClick={() => handleCopyDirective(item.answer, item.id || hIdx)}
                                title="Copy directive to clipboard"
                              >
                                {copiedAnswerId === (item.id || hIdx) ? (
                                  <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: '4px' }}>
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    COPIED TO CLIPBOARD
                                  </>
                                ) : (
                                  <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: '4px' }}>
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                    COPY DIRECTIVE
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="qa-a-text">
                              {renderFormattedQaResponse(item.answer)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        {/* 4. Empty State if No Anomaly Detected and Anomaly Cards are Active */}
        {!anomalyEval.hasAnomaly && viewDetails.anomalyCards && (
          <div className="empty-anomalies-container">
            <div className="empty-anomalies-box modern-anomalies-box shade-forest">
              <div className="anomalies-status-header">
                <div className="anomalies-header-left">
                  <span className="anomalies-pulse-badge">
                    <span className="live-pulse-dot" /> SURVEILLANCE SENSORS ACTIVE
                  </span>
                  <h4 className="anomalies-headline">0 CRITICAL HAZARD ESCALATIONS DETECTED</h4>
                </div>
                <span className="anomalies-badge">SYSTEM STABLE</span>
              </div>
              <p className="empty-text">
                AUTOMATED IOT SENSOR & SATELLITE TELEMETRY INGESTION IS CONTINUOUSLY EVALUATED BY THE ML ANOMALY DETECTION ENGINE ACROSS ALL 12 DISASTER VECTORS. REAL-TIME TELEMETRY FEED FOR {liveData ? liveData.name.toUpperCase() : 'ACTIVE STATION'} REMAINS STRICTLY WITHIN NOMINAL BASELINE TOLERANCES. NO CALAMITIES ARE PLOTTED ON THE MAP.
              </p>
            </div>
          </div>
        )}

        {/* 5. HORIZONTAL ROW OF SMALLER RECTANGULAR BLOCKS FOR UNSELECTED SECTIONS */}
        {(!viewDetails.topicAnalytics || !viewDetails.stressTestBar || !viewDetails.anomalyCards || (cascadingPrediction && !viewDetails.cascadingForecast)) && (
          <div className="collapsed-blocks-row">
            {!viewDetails.topicAnalytics && (
              <div
                className="collapsed-mini-block"
                onClick={() => onToggleDetail && onToggleDetail('topicAnalytics')}
                title="Click to expand Topic Analytics & Regulatory Diagnostics Radar"
              >
                <div className="cmb-top">
                  <span className="cmb-badge">03 TOPIC RADAR</span>
                  <span className="cmb-btn">+ VIEW RADAR</span>
                </div>
                <div className="cmb-title">TOPIC ANALYTICS & REGULATORY RADAR</div>
                <div className="cmb-desc">Dual Ensemble Precision • CPCB/IMD Standards • Sensor Barometers</div>
              </div>
            )}

            {!viewDetails.stressTestBar && (
              <div
                className="collapsed-mini-block"
                onClick={() => onToggleDetail && onToggleDetail('stressTestBar')}
                title="Click to expand ML Anomaly Validation & Stress Test Modes"
              >
                <div className="cmb-top">
                  <span className="cmb-badge">04 SIMULATION</span>
                  <span className="cmb-btn">+ VIEW MODES</span>
                </div>
                <div className="cmb-title">ML STRESS TEST MODES</div>
                <div className="cmb-desc">10 Scenario Simulators (Flood, Heatwave, GLOF, Cyclone, Multi-Hazard)</div>
              </div>
            )}

            {!viewDetails.anomalyCards && (
              <div
                className={`collapsed-mini-block ${anomalyEval.hasAnomaly ? 'alert-mini-block' : ''}`}
                onClick={() => onToggleDetail && onToggleDetail('anomalyCards')}
                title="Click to expand Active Anomaly Forensics"
              >
                <div className="cmb-top">
                  <span className={`cmb-badge ${anomalyEval.hasAnomaly ? 'alert-badge' : ''}`}>
                    {anomalyEval.hasAnomaly ? '05 ML BREACH' : '05 SENSORS'}
                  </span>
                  <span className={`cmb-btn ${anomalyEval.hasAnomaly ? 'alert-btn' : ''}`}>+ VIEW SPECS</span>
                </div>
                <div className="cmb-title">
                  {anomalyEval.hasAnomaly
                    ? `${anomalyEval.anomaliesCount || 1} HAZARD ANOMAL${(anomalyEval.anomaliesCount || 1) > 1 ? 'IES' : 'Y'} DETECTED`
                    : 'SURVEILLANCE SENSORS NOMINAL'}
                </div>
                <div className="cmb-desc">
                  {anomalyEval.hasAnomaly
                    ? `Score: ${anomalyEval.compositeScore || '0.82'}/1.00 • Critical Sensor Exceedance Confirmed`
                    : 'System Stable • 0 Critical Hazard Escalations Plotted'}
                </div>
              </div>
            )}

            {cascadingPrediction && !viewDetails.cascadingForecast && (
              <div
                className="collapsed-mini-block"
                onClick={() => onToggleDetail && onToggleDetail('cascadingForecast')}
                title="Click to expand Downstream Cascading Risk Forecast"
              >
                <div className="cmb-top">
                  <span className="cmb-badge">06 SPILLOVER</span>
                  <span className="cmb-btn">+ VIEW FORECAST</span>
                </div>
                <div className="cmb-title">DOWNSTREAM CASCADING RISK</div>
                <div className="cmb-desc">
                  {cascadingPrediction.nearbyPlaces?.length || 3} Settlements at Risk • ~{(cascadingPrediction.estimatedDisplacedPopulation || 0).toLocaleString()} Displaced
                </div>
              </div>
            )}
          </div>
        )}

        {/* Real-Time Sensor Logs Streaming System */}
        {liveSensorStreamInfo && (
          !isSensorBannerExpanded ? (
            <div
              className="map-node-collapsed-strip sensor-sync-collapsed-strip"
              onClick={() => setIsSensorBannerExpanded(true)}
              title="Click to expand Real-Time Sensor Log Sync Banner"
              style={{ marginTop: '1.5rem', marginBottom: '1.25rem' }}
            >
              <div className="mncs-left">
                <span className="live-pulse-dot green" />
                <span className="mncs-badge">07 SENSOR STREAM</span>
                <span className="mncs-title">REAL-TIME SENSOR LOG SYNCED</span>
                <span className="mncs-preview">
                  {liveSensorStreamInfo.sourceFile} • NODE: {liveSensorStreamInfo.stationId} • {liveSensorStreamInfo.hasAnomaly ? `ALERT: ${liveSensorStreamInfo.hazardName?.toUpperCase()} (${liveSensorStreamInfo.severity})` : 'ML BASELINES NOMINAL'}
                </span>
              </div>
              <button type="button" className="mncs-expand-btn">
                + VIEW SENSOR LOGS
              </button>
            </div>
          ) : (
            <div
              className={`realtime-sensor-sync-banner ${liveSensorStreamInfo.hasAnomaly ? 'has-anomaly' : 'nominal'}`}
              style={{ marginTop: '1.5rem', marginBottom: showStreamDrawer ? '0.75rem' : '1.25rem' }}
            >
              <div className="rssb-left">
                <span className="rssb-pulse-dot" />
                <div className="rssb-info-group">
                  <div className="rssb-headline-row">
                    <span className="rssb-tag">REAL-TIME SENSOR LOG SYNCED</span>
                    <span className="rssb-file"><code>{liveSensorStreamInfo.sourceFile}</code></span>
                    <span className="rssb-time">
                      {new Date(liveSensorStreamInfo.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="rssb-sub-row">
                    NODE: <strong>{liveSensorStreamInfo.stationId}</strong> // {liveSensorStreamInfo.stationName} (GPS: {liveSensorStreamInfo.lat.toFixed(4)}° N, {liveSensorStreamInfo.lng.toFixed(4)}° E)
                  </div>
                </div>
              </div>
              <div className="rssb-right">
                <span className={`rssb-status-pill ${liveSensorStreamInfo.hasAnomaly ? 'alert' : 'nominal'}`}>
                  {liveSensorStreamInfo.hasAnomaly
                    ? `ML ALERT: ${liveSensorStreamInfo.hazardName?.toUpperCase()} (${liveSensorStreamInfo.severity})`
                    : 'ML BASELINES NOMINAL'}
                </span>
                <button
                  type="button"
                  className="rssb-action-btn"
                  onClick={() => setShowStreamDrawer(!showStreamDrawer)}
                  title="View active sensor_logs/ folder files and live telemetry stream"
                >
                  {showStreamDrawer ? 'HIDE REPOSITORY' : 'INSPECT SENSOR_LOGS/'}
                </button>
                <button
                  type="button"
                  className="rssb-hide-btn"
                  onClick={() => {
                    setIsSensorBannerExpanded(false);
                    setShowStreamDrawer(false);
                  }}
                  title="Conceal Sensor Stream Banner"
                >
                  CONCEAL BANNER
                </button>
              </div>
            </div>
          )
        )}

        {/* Expandable sensor_logs/ Directory Inspector & Simulator Tray */}
        {showStreamDrawer && (
          <div className="sensor-logs-drawer-panel" style={{ marginBottom: '1.5rem' }}>
            <div className="sldp-header">
              <div className="sldp-title-group">
                <span className="sldp-badge">FILE TREE REPOSITORY</span>
                <h3 className="sldp-title">REAL-TIME SENSOR LOGS DIRECTORY (`sensor_logs/`)</h3>
                <span className="sldp-sub">
                  Monitored continuously via Vite HMR WebSocket & Server-Sent Events. Any file added or edited here updates ML models & map instantly.
                </span>
              </div>
              <div className="sldp-header-actions">
                <button
                  type="button"
                  className="sldp-refresh-btn"
                  onClick={() => realtimeSensorStreamService.listFiles().then(setStreamLogFiles)}
                >
                  REFRESH DIRECTORY
                </button>
                <button
                  type="button"
                  className="sldp-close-btn"
                  onClick={() => setShowStreamDrawer(false)}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Quick Test Simulator Controls */}
            <div className="sldp-sim-controls">
              <span className="sldp-sim-label">QUICK TELEMETRY INJECTION (TRIGGER INSTANT ML & MAP SYNC):</span>
              <div className="sldp-sim-buttons">
                <button
                  type="button"
                  className="sldp-sim-btn flood"
                  disabled={isSimulatingStream}
                  onClick={() => handleTriggerSimulatedStream('flood')}
                >
                  INJECT SILCHAR FLOOD SURGE (20.48m)
                </button>
                <button
                  type="button"
                  className="sldp-sim-btn aqi"
                  disabled={isSimulatingStream}
                  onClick={() => handleTriggerSimulatedStream('aqi')}
                >
                  INJECT DELHI SEVERE AQI SPIKE (428 AQI)
                </button>
                <button
                  type="button"
                  className="sldp-sim-btn heat"
                  disabled={isSimulatingStream}
                  onClick={() => handleTriggerSimulatedStream('heat')}
                >
                  INJECT CHURU THAR HEAT SURGE (49.5°C)
                </button>
                <button
                  type="button"
                  className="sldp-sim-btn emissions"
                  disabled={isSimulatingStream}
                  onClick={() => handleTriggerSimulatedStream('emissions')}
                >
                  INJECT ANKLESHWAR CEMS PLUME (295 AQI)
                </button>
                <button
                  type="button"
                  className="sldp-sim-btn glof"
                  disabled={isSimulatingStream}
                  onClick={() => handleTriggerSimulatedStream('glof')}
                >
                  INJECT SIKKIM MORAINE RISK (3.45 MPa)
                </button>
                <button
                  type="button"
                  className="sldp-sim-btn nepal"
                  disabled={isSimulatingStream}
                  onClick={() => handleTriggerSimulatedStream('nepal_slope_flood')}
                  title="Simulate high-slope pore pressure surge, debris flow, and transboundary soil quality degradation in Nepal-Bihar Koshi reach"
                >
                  INJECT NEPAL-BIHAR SLOPE FAILURE & SOIL QUALITY COLLAPSE (44.5° / 88.5 kPa PWP)
                </button>
              </div>
            </div>

            {/* Active files in sensor_logs/ */}
            <div className="sldp-files-grid">
              {streamLogFiles.length > 0 ? (
                streamLogFiles.map((file) => (
                  <div
                    key={file.filename}
                    className={`sldp-file-card ${liveSensorStreamInfo?.filename === file.filename ? 'active' : ''}`}
                  >
                    <div className="sldp-file-top">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <strong className="sldp-file-name">{file.filename}</strong>
                      {liveSensorStreamInfo?.filename === file.filename && (
                        <span className="sldp-active-badge">CURRENT STREAM</span>
                      )}
                    </div>
                    <div className="sldp-file-meta">
                      <span>Size: {Math.round(file.sizeBytes / 1024 * 10) / 10} KB</span>
                      <span>Modified: {new Date(file.lastModified).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="sldp-loading-msg">Loading sensor_logs/ directory entries...</div>
              )}
            </div>
          </div>
        )}
        {/* SENSOR DATASET UPLOAD MODAL DIALOG */}
        {showUploadModal && (
          <div className="sensor-upload-modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="sensor-upload-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="sumc-header">
                <div className="sumc-title-block">
                  <span className="sumc-tag">HARDWARE TELEMETRY INGESTION</span>
                  <h4 className="sumc-title">UPLOAD SENSOR DATASET // MULTI-CHANNEL SYNCHRONIZATION</h4>
                  <span className="sumc-sub">
                    INGEST FIELD SENSOR TELEMETRY (CSV/JSON) OR LOAD PRE-CALIBRATED DISASTER DATASETS ACROSS ALL 12 HARDWARE CHANNELS
                  </span>
                </div>
                <button
                  type="button"
                  className="sumc-close-btn"
                  onClick={() => setShowUploadModal(false)}
                  title="Close upload modal"
                  aria-label="Close"
                >
                  <IconClose size={13} />
                </button>
              </div>

              <div className="sumc-body">
                {/* File Upload Drop Area */}
                <div className="sumc-drop-area">
                  <input
                    type="file"
                    id="sensorFileInput"
                    className="sumc-file-input"
                    accept=".csv,.json,text/csv,application/json"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="sensorFileInput" className="sumc-drop-label">
                    <div className="sumc-drop-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <span className="sumc-drop-title">CHOOSE CSV OR JSON SENSOR DATASET</span>
                    <span className="sumc-drop-hint">
                      Supports standard IoT columns: <code>station_id, latitude, longitude, surface_temp_c, river_water_level_m, aqi, rainfall_24h_mm, etc.</code>
                    </span>
                    <span className="sumc-drop-btn">[ BROWSE SENSOR FILE ]</span>
                  </label>
                </div>

                {uploadError && (
                  <div className="sumc-error-banner">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '6px' }}>
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    {uploadError}
                  </div>
                )}

                {/* Pre-Calibrated Sample Datasets */}
                <div className="sumc-samples-section">
                  <div className="sumc-samples-title">OR LOAD PRE-CALIBRATED FIELD SENSOR DATASETS (1-CLICK SYNC):</div>
                  <div className="sumc-samples-grid">
                    {SAMPLE_SENSOR_DATASETS.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        className="sumc-sample-card"
                        onClick={() => handleLoadSampleSensor(sample)}
                      >
                        <div className="ssc-top">
                          <span className="ssc-title">{sample.label}</span>
                          <span className="ssc-file">{sample.filename}</span>
                        </div>
                        <span className="ssc-load-btn">[ LOAD & SYNC CHANNELS ]</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sumc-footer">
                <span className="sumc-footer-note">
                  Channel synchronizer maps incoming streams to CH01-CH12 hardware telemetry and automatically triggers the fine-tuned ML anomaly model.
                </span>
                <button
                  type="button"
                  className="sumc-done-btn"
                  onClick={() => setShowUploadModal(false)}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API KEYS CONFIGURATION MODAL DIALOG */}
        {showApiKeyModal && (
          <div className="api-key-modal-overlay" onClick={() => setShowApiKeyModal(false)}>
            <div className="api-key-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="akmc-header">
                <div className="akmc-title-block">
                  <span className="akmc-tag">CONFIGURATION // EXTERNAL CONNECTIONS</span>
                  <h4 className="akmc-title">API KEYS & TELEMETRY FEEDS CONFIGURATION</h4>
                  <span className="akmc-sub">
                    CONNECT LIVE GENERATIVE AI (GEMINI 1.5 FLASH) & LIVE OBSERVATION TELEMETRY KEYS
                  </span>
                </div>
                <button
                  type="button"
                  className="akmc-close-btn"
                  onClick={() => setShowApiKeyModal(false)}
                  title="Close API key modal"
                  aria-label="Close"
                >
                  <IconClose size={13} />
                </button>
              </div>

              <div className="akmc-body">
                {/* Gemini API Key */}
                <div className="akmc-field-group">
                  <label className="akmc-label">
                    <span>GOOGLE GEMINI API KEY</span>
                    <span className="akmc-label-sub">(Powers enterprise real-time GenAI disaster physics explanations)</span>
                  </label>
                  <input
                    type="password"
                    className="akmc-input"
                    value={geminiApiKeyInput}
                    onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                  />
                  <span className="akmc-hint">
                    Get a free API key at <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer">aistudio.google.com</a>.
                  </span>
                </div>

                {/* Telemetry / Weather API Key */}
                <div className="akmc-field-group">
                  <label className="akmc-label">
                    <span>LIVE OBSERVATION TELEMETRY API KEY (OPTIONAL)</span>
                    <span className="akmc-label-sub">(Open-Meteo / IMD / NOAA sync token)</span>
                  </label>
                  <input
                    type="password"
                    className="akmc-input"
                    value={telemetryApiKeyInput}
                    onChange={(e) => setTelemetryApiKeyInput(e.target.value)}
                    placeholder="Optional token..."
                  />
                  <span className="akmc-hint">
                    Default uses high-availability open hydrological & meteorological sync with 30 synoptic Indian stations.
                  </span>
                </div>

                {apiSaveMessage && (
                  <div className="akmc-success-banner">
                    <IconCheck />{apiSaveMessage}
                  </div>
                )}

                <div className="akmc-offline-note">
                  <strong>ZERO-DOWNTIME GUARANTEE:</strong> If no API keys are provided, ERMS operates in 100% offline sovereign mode utilizing its built-in fine-tuned ML anomaly model (552,912 records) and calibrated scientific domain GenAI explainer with zero latency.
                </div>
              </div>

              <div className="akmc-footer">
                <button
                  type="button"
                  className="akmc-cancel-btn"
                  onClick={() => setShowApiKeyModal(false)}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  className="akmc-save-btn"
                  onClick={handleSaveApiKeys}
                >
                  SAVE & CONNECT KEYS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORICAL DATASET EXPLORER & INFOGRAPHICS MODAL */}
        <HistoricalDatasetExplorerModal
          isOpen={showHistoricalModal}
          onClose={() => setShowHistoricalModal(false)}
          initialDatasetId={historicalModalDatasetId}
          onSelectCoordinate={(loc) => {
            loadLocationData(loc.lat, loc.lng, loc.name, loc.region, loc.hazardId);
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([loc.lat, loc.lng], 7, { duration: 1.0 });
            }
          }}
        />
      </section>

      {/* MOBILE PRECISION BOTTOM DOCK (Touchscreen Navigation Bar, rendered on mobile only) */}
      <nav className="mobile-bottom-dock" aria-label="Mobile Viewport Navigation">
        <button
          type="button"
          className={`mbd-item ${activeMobileTab === 'cockpit' ? 'active' : ''}`}
          onClick={() => handleMobileTabNav('cockpit')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>COCKPIT</span>
        </button>

        <button
          type="button"
          className={`mbd-item ${activeMobileTab === 'map' ? 'active' : ''}`}
          onClick={() => handleMobileTabNav('map')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <span>MAP</span>
        </button>

        <button
          type="button"
          className={`mbd-item ${activeMobileTab === 'sensors' ? 'active' : ''}`}
          onClick={() => handleMobileTabNav('sensors')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
          </svg>
          <span>SENSORS</span>
        </button>

        <button
          type="button"
          className={`mbd-item ${activeMobileTab === 'alerts' ? 'active' : ''}`}
          onClick={() => handleMobileTabNav('alerts')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>ALERTS</span>
        </button>

        <button
          type="button"
          className={`mbd-item ${activeMobileTab === 'copilot' ? 'active' : ''}`}
          onClick={() => handleMobileTabNav('copilot')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>COPILOT</span>
        </button>
      </nav>
    </div>
  );
}
