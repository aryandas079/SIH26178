# ERMS Real-Time Sensor Logs Repository (`sensor_logs/`)

This directory is monitored in real-time by the ERMS Machine Learning and Spatial Prediction Engine. When any CSV or JSON sensor telemetry log file is added, edited, or appended to in this directory, the platform instantly ingests the 12-channel hardware readings, calculates anomaly classifications, evaluates downstream cascading risks, and updates the Sovereign Indian Geospatial Map and statistics cockpit within milliseconds.

---

## 1. Directory Structure

```text
sensor_logs/
├── README.md                          # Schema and hardware integration guide
├── live_active_stream.csv             # Default live streaming telemetry channel
├── silchar_barak_gauge_node.csv       # CWC Barak River hydrological flood telemetry
├── new_delhi_cpcb_aqi_node.csv        # CPCB Delhi NCR air quality monitoring telemetry
├── ankleshwar_cems_stack_node.csv     # GPCB Ankleshwar industrial stack emissions
├── churu_thar_aws_node.csv            # IMD Thar Desert extreme heat telemetry
└── sikkim_lhonak_cryosphere_node.csv  # High-altitude Himalayan glacial moraine telemetry
```

---

## 2. Standard CSV Schema (12-Channel Telemetry Format)

Each row in a `.csv` log file represents an observation frame. Headers are case-insensitive.

| Column Header | Type | Description / Units | Normal Range |
| :--- | :--- | :--- | :--- |
| `station_id` | String | Unique hardware sensor ID (e.g. `NODE-SILCHA-4696`) | Alphanumeric |
| `timestamp` | ISO8601 | Observation timestamp (e.g. `2026-09-10T12:00:00Z`) | Date string |
| `latitude` | Float | Geodetic latitude (°N) within India (6.0° to 37.5°) | Float |
| `longitude` | Float | Geodetic longitude (°E) within India (68.0° to 97.5°) | Float |
| `zone` | String | Topographical/administrative zone name | Text |
| `elevation_m` | Float | Station altitude above mean sea level in meters | 0 - 8848 m |
| `surface_temp_c` | Float | Ambient ground surface temperature in Celsius | -20°C to 55°C |
| `relative_humidity_pct` | Float | Relative atmospheric humidity percentage | 5% to 100% |
| `river_water_level_m` | Float | Hydrometric stage level in meters | Gauge-specific |
| `river_danger_level_m`| Float | CWC designated danger level in meters | Gauge-specific |
| `river_discharge_cumecs`| Float | Volumetric river discharge in cubic meters per second | 0 - 50,000 |
| `aqi` | Integer | Composite US-EPA/CPCB Air Quality Index | 0 - 500+ |
| `pm2_5_ugm3` | Float | Fine particulate matter (PM2.5) in µg/m³ | 0 - 500 |
| `pm10_ugm3` | Float | Coarse particulate matter (PM10) in µg/m³ | 0 - 800 |
| `seismic_mmi` | Float | Modified Mercalli Intensity scale | 1.0 - 10.0 |
| `rainfall_24h_mm` | Float | Cumulative 24-hour rainfall precipitation in mm | 0 - 500 mm |
| `soil_moisture_pct` | Float | Sub-surface volumetric soil moisture percentage | 0% - 100% |
| `pressure_hpa` | Float | Barometric surface atmospheric pressure in hPa | 920 - 1040 hPa |
| `wind_speed_kmh` | Float | Sustained wind velocity in km/h | 0 - 250 km/h |
| `wind_gust_kmh` | Float | Maximum instantaneous wind gust in km/h | 0 - 300 km/h |
| `water_wqi` | Integer | Water Quality Index score | 0 (Dead) - 100 (Pristine) |
| `dissolved_oxygen_mg_l`| Float | Dissolved oxygen concentration in mg/L | 0.0 - 14.0 |
| `bod_mg_l` | Float | Biochemical Oxygen Demand in mg/L | 0.0 - 50.0 |
| `so2_ugm3` | Float | Sulfur Dioxide concentration in µg/m³ | 0 - 300 |
| `nox_ugm3` | Float | Nitrogen Oxides concentration in µg/m³ | 0 - 300 |
| `voc_ppm` | Float | Volatile Organic Compounds in ppm | 0 - 50 ppm |
| `stack_opacity_pct` | Float | Optical flue-gas stack opacity percentage | 0% - 100% |
| `moraine_pressure_mpa`| Float | Himalayan glacial moraine hydrostatic pressure in MPa | 0 - 10 MPa |
| `lake_expansion_pct` | Float | High-altitude glacial lake surface area expansion % | 0% - 100% |
| `dart_wave_m` | Float | Deep-ocean DART tsunameter sea-surface anomaly in meters| 0.0 - 15.0 m |
| `storm_surge_m` | Float | Coastal meteorological storm surge above tide in meters | 0.0 - 10.0 m |

---

## 3. How to Stream Data in Real Time

### Option A: Using the Automated Sensor Streamer Script
Run the built-in simulator from your terminal:
```bash
node scripts/sensor_logger_stream.js
```
This continuously pushes live observation frames into `sensor_logs/live_active_stream.csv` across various Indian hazard hubs, updating the web application in real time.

### Option B: Dropping or Modifying Files Manually
Any text editor, python script, or field IoT logger can append or overwrite any `.csv` or `.json` file inside `sensor_logs/`. The Vite dev server file watcher detects changes in under 50ms and emits a push event to the browser.

### Option C: Posting via REST API
Send an HTTP POST to the local ERMS endpoint:
```bash
curl -X POST http://localhost:5173/api/sensor-logs/append \
  -H "Content-Type: application/json" \
  -d '{
    "station_id": "NODE-SILCHA-4696",
    "latitude": 24.8273,
    "longitude": 92.7979,
    "river_water_level_m": 20.45,
    "river_danger_level_m": 19.83,
    "river_discharge_cumecs": 3650.0,
    "surface_temp_c": 25.5,
    "relative_humidity_pct": 96.0,
    "aqi": 82
  }'
```
