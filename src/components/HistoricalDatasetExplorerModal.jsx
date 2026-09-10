import React, { useState, useMemo } from 'react';
import historicalData from '../data/historicalDatasetSummaries.json';

const DATASET_LIST = [
  { id: 'flood', name: 'River Flood', category: 'water', file: 'india_river_flood_data.csv', records: '100,000', color: '#2563eb' },
  { id: 'water', name: 'Water Quality', category: 'water', file: 'india_water_quality_10000_records.csv', records: '10,000', color: '#06b6d4' },
  { id: 'tsunami', name: 'Tsunami Runup', category: 'water', file: 'real_tsunami_india_survey_records.csv', records: '40', color: '#0f766e' },
  { id: 'cyclone', name: 'Cyclone Storms', category: 'water', file: 'india_cyclone_data.csv', records: '102,572', color: '#ec4899' },
  { id: 'heat', name: 'Extreme Heat', category: 'climate', file: 'excessive_heat_india_10000_records.csv', records: '10,000', color: '#ef4444' },
  { id: 'aqi', name: 'Hazardous AQI', category: 'climate', file: 'india_aqi_data.csv', records: '100,000', color: '#9333ea' },
  { id: 'emissions', name: 'CEMS Emissions', category: 'climate', file: 'india_industrial_emissions_10000_records.csv', records: '10,000', color: '#64748b' },
  { id: 'fires', name: 'Forest Fires', category: 'climate', file: 'india_forest_fire_dataset.csv', records: '300', color: '#f97316' },
  { id: 'earthquake', name: 'Earthquakes', category: 'geological', file: 'india_earthquake_data.csv', records: '100,000', color: '#dc2626' },
  { id: 'landslide', name: 'Landslides', category: 'geological', file: 'india_landslide_data.csv', records: '100,000', color: '#92400e' },
  { id: 'glacial', name: 'Glacial Outburst', category: 'geological', file: 'himalayan_glacial_liquefaction_10000_records.csv', records: '10,000', color: '#0284c7' },
  { id: 'other', name: 'Multi-Hazard', category: 'geological', file: 'india_multi_hazard_disasters_10000_records.csv', records: '10,000', color: '#d97706' },
];

const CATEGORIES = [
  { id: 'all', label: 'All Hazards (12)' },
  { id: 'water', label: 'Water & Coastal (4)' },
  { id: 'climate', label: 'Climate & Air (4)' },
  { id: 'geological', label: 'Geological & Terrain (4)' },
];

// Clean Inline SVG Icons
const IconDatabase = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconPeak = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconGauge = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2v4" />
    <path d="m4.93 4.93 2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M12 12l5-3" />
    <path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" />
  </svg>
);

const IconPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconClose = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconOverview = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const IconTable = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
    <path d="M9 3v18" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function HistoricalDatasetExplorerModal({
  isOpen,
  onClose,
  initialDatasetId = 'flood',
  onSelectCoordinate,
}) {
  const [activeDatasetId, setActiveDatasetId] = useState(initialDatasetId || 'flood');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'records'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'anomalies', 'nominal'
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  // Sync if initialDatasetId changes
  React.useEffect(() => {
    if (initialDatasetId && historicalData[initialDatasetId]) {
      setActiveDatasetId(initialDatasetId);
    }
  }, [initialDatasetId]);

  // Reset pagination and search when changing dataset
  const handleSelectDataset = (id) => {
    setActiveDatasetId(id);
    setSearchQuery('');
    setFilterMode('all');
    setSelectedPoint(null);
    setCurrentPage(1);
  };

  const dataset = historicalData[activeDatasetId] || historicalData['flood'];

  // Filter datasets by category
  const visibleDatasets = useMemo(() => {
    if (selectedCategory === 'all') return DATASET_LIST;
    return DATASET_LIST.filter((d) => d.category === selectedCategory);
  }, [selectedCategory]);

  // Filter records based on search query and filterMode
  const filteredRecords = useMemo(() => {
    if (!dataset || !dataset.sampleRecords) return [];
    let list = dataset.sampleRecords;

    if (filterMode === 'anomalies') {
      list = list.filter((r) => r.isAnomaly);
    } else if (filterMode === 'nominal') {
      list = list.filter((r) => !r.isAnomaly);
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => r.searchString.includes(q));
    }

    return list;
  }, [dataset, filterMode, searchQuery]);

  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  // Quick switch from Hotspot card to Records table
  const handleInspectHotspot = (hotspotName) => {
    setSearchQuery(hotspotName);
    setFilterMode('all');
    setCurrentPage(1);
    setViewMode('records');
  };

  if (!isOpen) return null;

  return (
    <div className="hde-modal-overlay" onClick={onClose}>
      <div className="hde-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="hde-header">
          <div className="hde-title-block">
            <div className="hde-tag-row">
              <span className="live-pulse-dot" style={{ backgroundColor: '#22c55e' }} />
              <span className="hde-tag">DISASTER OBSERVATORY DATASETS</span>
              <span className="hde-active-file-pill">{dataset.filename}</span>
            </div>
            <h3 className="hde-headline">
              Historical Disaster Telemetry & Empirical Records
            </h3>
            <span className="hde-sub">
              552,912 validated disaster records across 12 canonical Indian hazard domains with Isolation Forest ML anomaly analytics.
            </span>
          </div>

          <div className="hde-header-right-actions">
                <div className="hde-view-toggle-bar">
              <button
                type="button"
                className={`hde-view-btn ${viewMode === 'overview' ? 'active' : ''}`}
                onClick={() => setViewMode('overview')}
                title="View clean infographics, KPIs, and hazard hotspot analytics"
              >
                <IconOverview />
                <span>Overview & Insights</span>
              </button>
              <button
                type="button"
                className={`hde-view-btn ${viewMode === 'records' ? 'active' : ''}`}
                onClick={() => setViewMode('records')}
                title="Search and inspect individual data records and forensic readings"
              >
                <IconTable />
                <span>Data Records ({dataset.sampleRecords?.length || 0})</span>
              </button>
            </div>

            <button
              type="button"
              className="hde-close-btn"
              onClick={onClose}
              title="Close dataset explorer"
              aria-label="Close"
            >
              <IconClose />
            </button>
          </div>
        </div>

        <div className="hde-nav-control-bar">
            <div className="hde-category-pills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`hde-cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

            <div className="hde-datasets-pills-strip">
            {visibleDatasets.map((d) => {
              const isActive = d.id === activeDatasetId;
              const recCount = historicalData[d.id]?.totalRecords
                ? Number(historicalData[d.id].totalRecords).toLocaleString()
                : d.records;
              return (
                <button
                  key={d.id}
                  type="button"
                  className={`hde-dataset-pill ${isActive ? 'active' : ''}`}
                  style={{ '--pill-accent': d.color }}
                  onClick={() => handleSelectDataset(d.id)}
                  title={`Switch to ${d.name} dataset (${recCount} records)`}
                >
                  <span className="hde-pill-dot" style={{ backgroundColor: d.color }} />
                  <span className="hde-pill-name">{d.name}</span>
                  <span className="hde-pill-count">{recCount}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hde-body-content">
          {viewMode === 'overview' ? (
            <div className="hde-overview-container">
              <div className="hde-dataset-hero-banner">
                <div className="hde-dhb-info">
                  <span className="hde-dhb-badge" style={{ backgroundColor: `${dataset.severityBreakdown?.[2]?.color || '#2563eb'}22`, color: dataset.severityBreakdown?.[2]?.color || '#2563eb' }}>
                    {dataset.category?.toUpperCase() || 'CANONICAL DOMAIN'}
                  </span>
                  <h2 className="hde-dhb-title">{dataset.displayName}</h2>
                  <p className="hde-dhb-desc">
                    Archived observational telemetry covering {dataset.dateRange} across {dataset.metrics.monitoredEntities} {dataset.metrics.entityLabel}. Indexed from <code>{dataset.filename}</code> and audited for extreme anomaly exceedances.
                  </p>
                </div>
                <div className="hde-dhb-cta">
                  <button
                    type="button"
                    className="hde-dhb-btn"
                    onClick={() => setViewMode('records')}
                  >
                    <span>Browse Raw Data Records</span>
                    <IconArrowRight />
                  </button>
                </div>
              </div>

              <div className="hde-kpi-grid">
                <div className="hde-kpi-card">
                  <div className="hde-kpi-top">
                    <span className="hde-kpi-lbl">TOTAL ARCHIVED OBSERVATIONS</span>
                    <span className="hde-kpi-icon-wrap"><IconDatabase /></span>
                  </div>
                  <div className="hde-kpi-val">{dataset.metrics.totalEvents.toLocaleString()}</div>
                  <span className="hde-kpi-sub">Period: {dataset.dateRange}</span>
                </div>

                <div className="hde-kpi-card highlight-danger">
                  <div className="hde-kpi-top">
                    <span className="hde-kpi-lbl">CRITICAL ANOMALY EXCEEDANCES</span>
                    <span className="hde-kpi-icon-wrap text-danger"><IconAlert /></span>
                  </div>
                  <div className="hde-kpi-val text-danger">{dataset.metrics.anomalyCount.toLocaleString()}</div>
                  <span className="hde-kpi-sub">{dataset.metrics.anomalyPct}% Empirical Exceedance Rate</span>
                </div>

                <div className="hde-kpi-card">
                  <div className="hde-kpi-top">
                    <span className="hde-kpi-lbl">PEAK RECORDED TELEMETRY</span>
                    <span className="hde-kpi-icon-wrap"><IconPeak /></span>
                  </div>
                  <div className="hde-kpi-val">
                    {typeof dataset.metrics.peakRecorded === 'number' ? dataset.metrics.peakRecorded.toLocaleString() : dataset.metrics.peakRecorded} <small>{dataset.unit}</small>
                  </div>
                  <span className="hde-kpi-sub">95th Percentile: {dataset.metrics.p95Threshold} {dataset.unit}</span>
                </div>

                <div className="hde-kpi-card">
                  <div className="hde-kpi-top">
                    <span className="hde-kpi-lbl">HISTORICAL BASELINE MEAN</span>
                    <span className="hde-kpi-icon-wrap"><IconGauge /></span>
                  </div>
                  <div className="hde-kpi-val">
                    {typeof dataset.metrics.meanValue === 'number' ? dataset.metrics.meanValue.toLocaleString() : dataset.metrics.meanValue} <small>{dataset.unit}</small>
                  </div>
                  <span className="hde-kpi-sub">{dataset.metrics.monitoredEntities} {dataset.metrics.entityLabel}</span>
                </div>
              </div>

              <div className="hde-charts-grid">
                  <div className="hde-panel-card">
                  <div className="hde-panel-header">
                    <div className="hde-panel-title-wrap">
                      <h4 className="hde-panel-title">Severity Distribution Spectrum</h4>
                      <span className="hde-panel-sub">Breakdown of all {dataset.metrics.totalEvents.toLocaleString()} canonical records</span>
                    </div>
                  </div>

                  <div className="hde-stacked-bar">
                    {dataset.severityBreakdown.map((seg, idx) => (
                      <div
                        key={idx}
                        className="hde-bar-segment"
                        style={{
                          width: `${seg.pct}%`,
                          backgroundColor: seg.color,
                        }}
                        title={`${seg.label}: ${seg.count.toLocaleString()} records (${seg.pct}%)`}
                      />
                    ))}
                  </div>

                  <div className="hde-legend-grid">
                    {dataset.severityBreakdown.map((seg, idx) => (
                      <div key={idx} className="hde-legend-card">
                        <div className="hde-legend-top">
                          <span className="hde-legend-dot" style={{ backgroundColor: seg.color }} />
                          <span className="hde-legend-lbl">{seg.label}</span>
                        </div>
                        <div className="hde-legend-numbers">
                          <strong className="hde-legend-pct">{seg.pct}%</strong>
                          <span className="hde-legend-count">{seg.count.toLocaleString()} records</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hde-spectrum-note">
                    <strong>Operational Insight:</strong> Records exceeding the 95th percentile benchmark trigger the Isolation Forest high-hazard alert pipeline in real-time.
                  </div>
                </div>

                  <div className="hde-panel-card">
                  <div className="hde-panel-header">
                    <div className="hde-panel-title-wrap">
                      <h4 className="hde-panel-title">Top Recurring Hazard Hotspots</h4>
                      <span className="hde-panel-sub">Highest frequency incident clusters across India</span>
                    </div>
                    <span className="hde-filter-hint">Click location to filter table</span>
                  </div>

                  <div className="hde-hotspots-list">
                    {dataset.topHotspots.map((spot, idx) => {
                      const maxIncidents = dataset.topHotspots[0]?.incidentCount || 1;
                      const fillPct = Math.round((spot.incidentCount / maxIncidents) * 100);
                      return (
                        <div
                          key={idx}
                          className="hde-hotspot-item"
                          onClick={() => handleInspectHotspot(spot.name)}
                          title={`Filter records by ${spot.name}, ${spot.state}`}
                        >
                          <div className="hde-hs-rank-badge">0{idx + 1}</div>
                          <div className="hde-hs-info">
                            <div className="hde-hs-title-row">
                              <span className="hde-hs-name">{spot.name}</span>
                              <span className="hde-hs-state">{spot.state}</span>
                            </div>
                            <div className="hde-hs-bar-bg">
                              <div className="hde-hs-bar-fill" style={{ width: `${fillPct}%` }} />
                            </div>
                          </div>
                          <div className="hde-hs-stats">
                            <span className="hde-hs-count">{spot.incidentCount.toLocaleString()} Incidents</span>
                            <span className="hde-hs-peak">Peak: {spot.peakRecorded}</span>
                          </div>
                          <div className="hde-hs-action">
                            <IconArrowRight />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="hde-explainer-card">
                <div className="hde-exp-col">
                  <h5 className="hde-exp-heading">WHAT THIS DATASET MEASURES</h5>
                  <p className="hde-exp-text">
                    Tracks continuous empirical measurements ({dataset.unit}) across accredited gauging stations, meteorological sensors, and government survey archives throughout India.
                  </p>
                </div>
                <div className="hde-exp-divider" />
                <div className="hde-exp-col">
                  <h5 className="hde-exp-heading">ROLE IN ERMS EARLY WARNING PIPELINE</h5>
                  <p className="hde-exp-text">
                    Serves as canonical baseline data for training the real-time Isolation Forest anomaly detection model and calibrating cascading disaster simulation scenarios.
                  </p>
                </div>
                <div className="hde-exp-divider" />
                <div className="hde-exp-col">
                  <h5 className="hde-exp-heading">GEOSPATIAL VERIFICATION</h5>
                  <p className="hde-exp-text">
                    Observations include WGS-84 coordinates. Clicking any data point in the records table allows instantaneous map navigation to the exact sensing station.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="hde-records-container">
              <div className="hde-search-controls-bar">
                <div className="hde-search-input-wrap">
                  <IconSearch />
                  <input
                    type="text"
                    className="hde-search-input"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={`Search ${dataset.filename} by station, river, district, state, year, value...`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="hde-clear-search"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      <IconClose />
                    </button>
                  )}
                </div>

                  <div className="hde-filter-chips">
                  <button
                    type="button"
                    className={`hde-fchip ${filterMode === 'all' ? 'active' : ''}`}
                    onClick={() => { setFilterMode('all'); setCurrentPage(1); }}
                  >
                    ALL RECORDS ({dataset.sampleRecords?.length || 0})
                  </button>
                  <button
                    type="button"
                    className={`hde-fchip danger ${filterMode === 'anomalies' ? 'active' : ''}`}
                    onClick={() => { setFilterMode('anomalies'); setCurrentPage(1); }}
                  >
                    CRITICAL EXCEEDANCES ({dataset.sampleRecords?.filter(r => r.isAnomaly).length || 0})
                  </button>
                  <button
                    type="button"
                    className={`hde-fchip ${filterMode === 'nominal' ? 'active' : ''}`}
                    onClick={() => { setFilterMode('nominal'); setCurrentPage(1); }}
                  >
                    NOMINAL BASELINE ({dataset.sampleRecords?.filter(r => !r.isAnomaly).length || 0})
                  </button>
                </div>
              </div>

              <div className="hde-results-header">
                <span className="hde-results-count">
                  Showing <strong>{filteredRecords.length}</strong> matching data points in <code>{dataset.filename}</code>
                  {searchQuery && (
                    <button
                      type="button"
                      className="hde-reset-filter-btn"
                      onClick={() => setSearchQuery('')}
                    >
                      (Clear filter)
                    </button>
                  )}
                </span>
                <span className="hde-click-hint">
                  Click any row to inspect forensic readings & map coordinates
                </span>
              </div>

              {selectedPoint && (
                <div className="hde-point-inspector-card">
                  <div className="hpi-header">
                    <div className="hpi-title-wrap">
                      <div className="hpi-badge-row">
                        <span className="hpi-badge">INDIVIDUAL DATA POINT FORENSICS</span>
                        <span className="hpi-rec-badge">RECORD #{selectedPoint.recordId}</span>
                      </div>
                      <h4 className="hpi-title">
                        {selectedPoint.location.toUpperCase()} ({selectedPoint.state}) — {selectedPoint.entity}
                      </h4>
                      <span className="hpi-sub">
                        TIMESTAMP: {selectedPoint.date} • SOURCE: <code>{dataset.filename}</code>
                      </span>
                    </div>
                    <div className="hpi-actions">
                      {selectedPoint.lat && selectedPoint.lng && onSelectCoordinate && (
                        <button
                          type="button"
                          className="hpi-map-btn"
                          onClick={() => {
                            onSelectCoordinate({
                              lat: selectedPoint.lat,
                              lng: selectedPoint.lng,
                              name: selectedPoint.location,
                              region: `${selectedPoint.location}, ${selectedPoint.state}`,
                              hazardId: activeDatasetId,
                            });
                            onClose();
                          }}
                          title="Close explorer and fly map to this coordinate"
                        >
                          <IconPin />
                          <span>FOCUS MAP PIN ON THIS LOCATION</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="hpi-close-btn"
                        onClick={() => setSelectedPoint(null)}
                        title="Close point forensics"
                        aria-label="Close forensics"
                      >
                        <IconClose />
                      </button>
                    </div>
                  </div>

                  <div className="hpi-metrics-grid">
                    <div className="hpi-m-card">
                      <span className="hpi-m-lbl">MEASURED SENSOR VALUE</span>
                      <span className={`hpi-m-val ${selectedPoint.isAnomaly ? 'text-danger' : ''}`}>
                        {selectedPoint.measuredValue} {selectedPoint.unit}
                      </span>
                      <span className="hpi-m-sub">Column: {dataset.valColName}</span>
                    </div>

                    {selectedPoint.dangerLevel && (
                      <div className="hpi-m-card">
                        <span className="hpi-m-lbl">STATUTORY DANGER THRESHOLD</span>
                        <span className="hpi-m-val">{selectedPoint.dangerLevel} {selectedPoint.unit}</span>
                        <span className="hpi-m-sub">
                          Variance: {((selectedPoint.measuredValue - selectedPoint.dangerLevel)).toFixed(2)} {selectedPoint.unit}
                        </span>
                      </div>
                    )}

                    <div className="hpi-m-card">
                      <span className="hpi-m-lbl">ISOLATION FOREST CLASSIFICATION</span>
                      <span className="hpi-m-val">
                        {selectedPoint.isAnomaly ? 'CONFIRMED ANOMALY' : 'WITHIN NOMINAL RANGE'}
                      </span>
                      <span className="hpi-m-sub">
                        95th Percentile Benchmark: {dataset.metrics.p95Threshold}
                      </span>
                    </div>

                    {selectedPoint.lat && selectedPoint.lng && (
                      <div className="hpi-m-card">
                        <span className="hpi-m-lbl">GPS COORDINATES</span>
                        <span className="hpi-m-val">{selectedPoint.lat}° N, {selectedPoint.lng}° E</span>
                        <span className="hpi-m-sub">WGS-84 Geodetic Fix</span>
                      </div>
                    )}
                  </div>

                  {selectedPoint.details && Object.keys(selectedPoint.details).length > 0 && (
                    <div className="hpi-raw-attributes">
                      <div className="hpi-raw-title">ADDITIONAL SENSOR ATTRIBUTES (FROM CSV):</div>
                      <div className="hpi-raw-grid">
                        {Object.entries(selectedPoint.details).map(([k, v]) => (
                          <div key={k} className="hpi-raw-item">
                            <span className="hpi-raw-k">{k}:</span>
                            <span className="hpi-raw-v">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="hde-table-wrapper">
                <table className="hde-records-table">
                  <thead>
                    <tr>
                      <th>RECORD ID</th>
                      <th>GEODETIC LOCATION</th>
                      <th>ENTITY / BASIN / STATION</th>
                      <th>DATE / TIME</th>
                      <th>MEASURED LEVEL</th>
                      <th>STATUS / SEVERITY</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="hde-empty-row">
                          No data points found matching "{searchQuery}". Try clearing the search query or selecting "ALL RECORDS".
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map((rec, rIdx) => {
                        const isSelected = selectedPoint && (selectedPoint.uniqueKey === rec.uniqueKey || selectedPoint.recordId === rec.recordId);
                        const isCritical = rec.statusText === 'CRITICAL EXCEEDANCE' || (rec.isAnomaly && !rec.statusText);
                        const isWarning = rec.statusText === 'MODERATE WARNING';
                        const rowClass = isCritical ? 'row-anomaly' : (isWarning ? 'row-warning' : 'row-safe');

                        return (
                          <tr
                            key={rec.uniqueKey || `${rec.recordId}-${rIdx}`}
                            className={`hde-row ${isSelected ? 'row-selected' : ''} ${rowClass}`}
                            onClick={() => setSelectedPoint(rec)}
                          >
                            <td className="hde-cell-id">
                              <span className="hde-id-badge">{rec.recordId}</span>
                            </td>
                            <td className="hde-cell-loc">
                              <strong>{rec.location}</strong>
                              <span className="hde-state-sub">{rec.state}</span>
                            </td>
                            <td className="hde-cell-entity">{rec.entity}</td>
                            <td className="hde-cell-date">{rec.date}</td>
                            <td className="hde-cell-val">
                              <strong className={isCritical ? 'text-danger' : (isWarning ? 'text-warning' : '')}>
                                {typeof rec.measuredValue === 'number' ? rec.measuredValue.toLocaleString() : rec.measuredValue}
                              </strong>{' '}
                              <span className="hde-unit-tag">{rec.unit}</span>
                              {rec.dangerLevel && (
                                <span className="hde-danger-sub">Threshold: {rec.dangerLevel} {rec.unit}</span>
                              )}
                            </td>
                            <td className="hde-cell-status">
                              <span
                                className={`hde-status-badge ${
                                  isCritical ? 'badge-anomaly' : (isWarning ? 'badge-warning' : 'badge-safe')
                                }`}
                              >
                                {rec.statusText || (rec.isAnomaly ? 'CRITICAL EXCEEDANCE' : 'NOMINAL BASELINE')}
                              </span>
                            </td>
                            <td className="hde-cell-action">
                              <button
                                type="button"
                                className="hde-inspect-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPoint(rec);
                                }}
                              >
                                FORENSICS
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="hde-pagination-row">
                  <button
                    type="button"
                    className="hde-page-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous Page
                  </button>
                  <span className="hde-page-indicator">
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredRecords.length} records)
                  </span>
                  <button
                    type="button"
                    className="hde-page-btn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next Page
                  </button>
                </div>
              )}

              </div>
          )}
        </div>

        <div className="hde-footer">
          <div className="hde-footer-left">
            <span className="hde-footer-legend">
              Each of the 12 disaster datasets is indexed from canonical survey files and audited by the ERMS Isolation Forest ML Engine.
            </span>
          </div>
          <div className="hde-footer-right">
            <button type="button" className="hde-footer-close-btn" onClick={onClose}>
              CLOSE EXPLORER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
