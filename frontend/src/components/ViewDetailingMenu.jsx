import React, { useState, useEffect, useRef } from 'react';

/** Dashboard detailing toggles and menu drawer. */

export const DEFAULT_VIEW_DETAILS = {
  nodeTelemetry: false,     // 01-04 Node ID, GPS Coordinates, Topographical Zone, Status
  sensorChannels: false,    // CH 01 - CH 12 Physical Multi-Sensor Readings
  topicAnalytics: false,    // Topic Analytics & Regulatory Radar (Needle Barometer, CPCB)
  stressTestBar: false,     // ML Anomaly Validation & Stress Test Scenario Switcher
  anomalyCards: false,      // Critical Exceedance Banner & Anomaly Spec Cards
  cascadingForecast: false, // Downstream Cascading Risk & Proximity Impact Forecast (collapsed drawer bar by default)
};

const IconCleanLayout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

const IconForensicMatrix = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconGpsTarget = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
  </svg>
);

const IconSensorChannels = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconRadarGauge = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4" />
    <path d="m4.93 4.93 2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M12 12l5-3" />
    <path d="M20 12h2" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const IconStressSimulation = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconAnomalyBreach = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconCascadingFlow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export default function ViewDetailingMenu({
  viewDetails = DEFAULT_VIEW_DETAILS,
  onToggleDetail,
  onSetViewPreset,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Compute active count
  const detailKeys = ['nodeTelemetry', 'sensorChannels', 'topicAnalytics', 'stressTestBar', 'anomalyCards', 'cascadingForecast'];
  const activeCount = detailKeys.filter((k) => viewDetails[k]).length;
  const isAllClean = activeCount <= 3;
  const isAllFull = activeCount === detailKeys.length;

  const SECTION_CONFIGS = [
    {
      key: 'nodeTelemetry',
      code: '01',
      title: 'Active Node Telemetry',
      badge: '01-04 GPS',
      icon: <IconGpsTarget />,
      desc: 'Designated Node ID, Geodetic WGS-84 fix, Topographical elevation & link health.',
    },
    {
      key: 'sensorChannels',
      code: '02',
      title: 'Physical Multi-Sensor Stream',
      badge: '12-CH RAW',
      icon: <IconSensorChannels />,
      desc: '12 physical hardware telemetry channels (Surface Temp, River Gauge, Precipitation, Flue Opacity, DART Buoy).',
    },
    {
      key: 'topicAnalytics',
      code: '03',
      title: 'Topic Analytics Radar',
      badge: 'CPCB / IMD',
      icon: <IconRadarGauge />,
      desc: 'Continuous hazard intensity barometer needle, statutory compliance norms & historical tallies.',
    },
    {
      key: 'stressTestBar',
      code: '04',
      title: 'ML Anomaly Stress Test Modes',
      badge: 'SIMULATION',
      icon: <IconStressSimulation />,
      desc: 'Disaster scenario switcher controls (Flood, Heatwave, Industrial Emissions, GLOF, Cyclone).',
    },
    {
      key: 'anomalyCards',
      code: '05',
      title: 'Detected Anomaly Forensics',
      badge: 'ML BREACH',
      icon: <IconAnomalyBreach />,
      desc: 'Critical sensor exceedance alert banners, ML confidence percentage & parameter trigger specs.',
    },
    {
      key: 'cascadingForecast',
      code: '06',
      title: 'Downstream Cascading Forecast',
      badge: 'SPILLOVER',
      icon: <IconCascadingFlow />,
      desc: 'Downstream adjacent settlements at risk, arrival time horizon, population exposure & economic risk.',
    },
  ];

  return (
    <div className="view-detailing-menu-wrapper" ref={menuRef}>
      <button
        type="button"
        className={`detailing-hamburger-btn ${isOpen ? 'active' : ''} ${isAllClean ? 'btn-clean-mode' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Dashboard Detailing and Telemetry Sections"
        aria-expanded={isOpen}
      >
        <div className="hamburger-icon-bars">
          <span className="hbar hbar-1" />
          <span className="hbar hbar-2" />
          <span className="hbar hbar-3" />
        </div>
        <span className="hamburger-text">
          {isAllClean ? 'CLEAN VIEW' : 'VIEW CONTROLS'}
        </span>
        <span className={`hamburger-pill-badge ${activeCount > 3 ? 'badge-full' : 'badge-clean'}`}>
          {activeCount}/6
        </span>
      </button>

      {isOpen && (
        <div className="detailing-drawer-panel">
          <div className="dd-header">
            <div className="dd-header-left">
              <div className="dd-badge-row">
                <span className="dd-pulse-dot" />
                <span className="dd-tag">DASHBOARD DISPLAY MANAGER</span>
                <span className="dd-active-indicator">
                  {isAllClean ? 'CLEAN ONE-LOOK MODE' : (isAllFull ? 'FULL FORENSIC MODE' : 'CUSTOM DISPLAY')}
                </span>
              </div>
              <h4 className="dd-title">CONSOLE DETAILING & TELEMETRY TOGGLES</h4>
              <p className="dd-desc">
                Configure which technical sections appear on your console for a clean, single-look operational view.
              </p>
            </div>
            <button
              type="button"
              className="dd-close-btn"
              onClick={() => setIsOpen(false)}
              title="Close Detailing Menu"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="dd-presets-row">
            <button
              type="button"
              className={`dd-preset-btn ${isAllClean ? 'active' : ''}`}
              onClick={() => onSetViewPreset && onSetViewPreset('clean')}
              title="Hide heavy telemetry grids for an uncluttered one-look view"
            >
              <span className="preset-icon">
                <IconCleanLayout />
              </span>
              <div className="preset-info">
                <span className="preset-title">CLEAN ONE-LOOK VIEW</span>
                <span className="preset-sub">Map + Weather Cockpit only</span>
              </div>
            </button>

            <button
              type="button"
              className={`dd-preset-btn ${isAllFull ? 'active' : ''}`}
              onClick={() => onSetViewPreset && onSetViewPreset('full')}
              title="Show all 12 sensor channels, node forensics and cascading models"
            >
              <span className="preset-icon">
                <IconForensicMatrix />
              </span>
              <div className="preset-info">
                <span className="preset-title">FULL FORENSIC VIEW</span>
                <span className="preset-sub">All 6 deep telemetry sections</span>
              </div>
            </button>
          </div>

          <div className="dd-sections-list">
            <div className="dd-list-label">INDIVIDUAL SECTION CONTROLS:</div>
            {SECTION_CONFIGS.map((sec) => {
              const isChecked = !!viewDetails[sec.key];
              return (
                <div
                  key={sec.key}
                  className={`dd-section-row ${isChecked ? 'row-enabled' : 'row-disabled'}`}
                  onClick={() => onToggleDetail && onToggleDetail(sec.key)}
                >
                  <div className="dd-sec-left">
                    <span className="dd-sec-code">{sec.code}</span>
                    <span className="dd-sec-icon-wrap">{sec.icon}</span>
                    <div className="dd-sec-text">
                      <div className="dd-sec-title-row">
                        <span className="dd-sec-title">{sec.title}</span>
                        <span className="dd-sec-badge">{sec.badge}</span>
                      </div>
                      <p className="dd-sec-desc">{sec.desc}</p>
                    </div>
                  </div>

                  {/* iOS-Style Toggle Switch */}
                  <div className="dd-toggle-wrap">
                    <button
                      type="button"
                      className={`dd-ios-toggle ${isChecked ? 'toggle-on' : 'toggle-off'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleDetail && onToggleDetail(sec.key);
                      }}
                      role="switch"
                      aria-checked={isChecked}
                    >
                      <span className="toggle-thumb" />
                    </button>
                    <span className={`toggle-state-text ${isChecked ? 'text-on' : 'text-off'}`}>
                      {isChecked ? 'VISIBLE' : 'HIDDEN'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="dd-footer">
            <div className="dd-footer-note">
              Configuration persists automatically across browser reloads and syncs on mobile & desktop.
            </div>
            <button
              type="button"
              className="dd-done-btn"
              onClick={() => setIsOpen(false)}
            >
              APPLY & RETURN TO CONSOLE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
