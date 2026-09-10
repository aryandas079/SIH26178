-- ERMS Database Schema (PostgreSQL, SQLite, MySQL)

-- Monitoring Stations
CREATE TABLE IF NOT EXISTS monitoring_stations (
    station_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    elevation_m DECIMAL(8, 2) DEFAULT 0.0,
    basin VARCHAR(128) NOT NULL,
    river VARCHAR(128) NOT NULL,
    danger_level_m DECIMAL(8, 2) NOT NULL,
    warning_level_m DECIMAL(8, 2) NOT NULL,
    state VARCHAR(128) NOT NULL,
    district VARCHAR(128) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensor Telemetry Readings
CREATE TABLE IF NOT EXISTS sensor_telemetry (
    id VARCHAR(64) PRIMARY KEY,
    station_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    surface_temp_c DECIMAL(6, 2),
    relative_humidity_pct DECIMAL(5, 2),
    river_water_level_m DECIMAL(8, 2),
    river_discharge_cumecs DECIMAL(10, 2),
    aqi INTEGER,
    pm2_5_ugm3 DECIMAL(6, 2),
    pm10_ugm3 DECIMAL(6, 2),
    seismic_mmi DECIMAL(4, 2),
    rainfall_24h_mm DECIMAL(8, 2),
    soil_moisture_pct DECIMAL(5, 2),
    pressure_hpa DECIMAL(7, 2),
    wind_speed_kmh DECIMAL(6, 2),
    wind_gust_kmh DECIMAL(6, 2),
    water_wqi DECIMAL(6, 2),
    dissolved_oxygen_mg_l DECIMAL(6, 2),
    bod_mg_l DECIMAL(6, 2),
    so2_ugm3 DECIMAL(6, 2),
    nox_ugm3 DECIMAL(6, 2),
    dart_wave_m DECIMAL(6, 2),
    moraine_pressure_mpa DECIMAL(6, 2),
    slope_gradient_deg DECIMAL(5, 2),
    pore_water_pressure_kpa DECIMAL(7, 2),
    sediment_discharge_ppm DECIMAL(8, 2),
    soil_erosion_index DECIMAL(6, 2),
    transboundary_origin VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES monitoring_stations(station_id) ON DELETE CASCADE
);

-- Indexing for time-series queries
CREATE INDEX IF NOT EXISTS idx_telemetry_station_time ON sensor_telemetry (station_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON sensor_telemetry (timestamp DESC);

-- Hazard Anomaly Alerts
CREATE TABLE IF NOT EXISTS hazard_alerts (
    id VARCHAR(64) PRIMARY KEY,
    station_id VARCHAR(64) NOT NULL,
    hazard_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL, -- LOW, MODERATE, HIGH, CRITICAL
    risk_score DECIMAL(5, 2) NOT NULL,
    summary TEXT NOT NULL,
    threshold_breached VARCHAR(255),
    spillover_reach_km DECIMAL(8, 2),
    eta_hours DECIMAL(6, 2),
    status VARCHAR(32) DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, RESOLVED
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES monitoring_stations(station_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alerts_status_time ON hazard_alerts (status, timestamp DESC);

-- User Session & Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(128) NOT NULL,
    user_name VARCHAR(128),
    user_role VARCHAR(64),
    action VARCHAR(128) NOT NULL,
    resource VARCHAR(255),
    status VARCHAR(32) NOT NULL, -- SUCCESS, DENIED, FAILED
    ip_address VARCHAR(45),
    metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs (timestamp DESC);
