# ERMS: Environmental Risk Monitoring System

ERMS is a web-based environmental risk monitoring dashboard. It combines a large historical hazard dataset with incoming sensor readings, scores the combined data with a machine-learning anomaly detector, and presents the results on an interactive world map.

The project is designed for a workflow in which sensor data can be appended to a log file while the dashboard is running. The model refreshes its prediction file automatically, and the frontend reloads the prediction file without requiring a page refresh.

## What This Project Does

ERMS provides:

- A React dashboard for exploring environmental risk feeds.
- A Leaflet world map for viewing valid hazard locations.
- Location search through OpenStreetMap Nominatim.
- Risk layers for floods, air quality, forest fires, earthquakes, landslides, extreme heat, industrial emissions, water quality, glacial liquefaction, tsunamis, cyclones, and other hazards.
- An Isolation Forest anomaly model implemented with scikit-learn.
- Combined processing of the historical CSV dataset and live JSON sensor records.
- Automatic model refresh while `database/logs/sensor_data.log` changes.
- Geographic filtering that removes invalid coordinates, ocean points, and hazard placements that do not make geographic sense.
- Dashboard totals for data points and predicted anomalies.
- Hazard-specific confidence scores and prioritized early-warning levels.
- Affected-zone aggregation and time-bucketed risk trends for authority dashboards and long-term analysis.
- Edge-ready execution using local files, with no continuous cloud connection required.

## System Overview

The application has four main stages:

```text
Historical CSV + live sensor log
							|
							v
		 Python data preparation
							|
							v
		 Isolation Forest model
							|
							v
frontend/public/ml_predictions.json
							|
							v
 React worker and Leaflet dashboard
```

### 1. Data ingestion

The model reads:

- `database/data/hazard_data.csv`: the baseline or historical dataset.
- `database/logs/sensor_data.log`: live sensor records. The file accepts JSON objects, one after another, in JSONL/NDJSON style. The parser also tolerates multiple JSON objects separated by whitespace.

Both sources are normalized and combined before training. If both sources contain an `id`, the live record replaces an older record with the same ID. If no ID is available, duplicate latitude and longitude pairs are reduced to the latest record.

### 2. Machine-learning scoring

The Python pipeline converts numeric measurements and categorical risk levels into model features. It then runs an `IsolationForest` inside a scikit-learn pipeline containing:

1. Median imputation for missing numeric values.
2. Standard scaling.
3. Isolation Forest anomaly detection.

The current model uses 200 estimators, a contamination value of `0.08`, and a normalized anomaly threshold of `0.72`.

In addition to the generic anomaly score, the model produces targeted risk intelligence for flooding, forest fires, hazardous pollution, landslides, extreme weather, and industrial safety incidents. Each warning includes a severity level, risk score, confidence score, region, coordinates, update time, and intended audiences: `local-authority` and `citizen`.

### 3. Prediction output

The model writes its result to `frontend/public/ml_predictions.json`. The file contains:

- Model metadata and feature names.
- Summary values such as total rows, anomaly count, anomaly rate, and average score.
- The original normalized records.
- `model_anomaly_score` for every record.
- `model_is_anomaly` for every record.
- `risk_scores` for the six operational warning classes.
- Prioritized `alerts` for warning-level records.
- `affectedZones` for hotspot ranking.
- `riskTrends` for date-based trend analysis.
- `model.execution` metadata describing edge-ready, local processing.

### 4. Frontend visualization

The React frontend loads the generated JSON through `frontend/src/data/anomalyWorker.js`. The worker builds hazard layers, applies geographic validation, and refreshes the data every five seconds. The dashboard then displays the updated totals and map nodes.

## Project Structure

```text
SIH26178/
|-- backend/
|   `-- ml/
|       `-- train_model.py       Python ingestion and anomaly pipeline
|-- database/
|   |-- data/
|   |   `-- hazard_data.csv       Historical baseline dataset
|   `-- logs/
|       |-- sensor_data.log       Live sensor input
|       `-- demo_live.log         Additional sample log, if used
|-- frontend/
|   |-- public/
|   |   `-- ml_predictions.json   Generated model output served to the app
|   |-- src/
|   |   |-- App.jsx               Landing page and theme state
|   |   |-- Dashboard.jsx         Main monitoring dashboard
|   |   |-- data/
|   |   |   |-- anomalyModel.js   Frontend scoring and geographic filtering
|   |   |   `-- anomalyWorker.js  Prediction loading and refresh worker
|   |   |-- assets/                Fonts, cursor, and frontend assets
|   |   |-- index.css              Global and Tailwind styles
|   |   `-- main.jsx               React entry point
|   |-- index.html                 Vite HTML entry point
|   `-- vite.config.js             Frontend Vite configuration
|-- package.json                   npm scripts and JavaScript dependencies
|-- requirements.txt               Python dependencies
|-- run_erms.ps1                   One-command Windows launcher
`-- README.md                      Project documentation
```

## Requirements

Install the following before running ERMS:

- Windows PowerShell.
- Node.js and npm.
- Python 3.14 or a compatible Python 3 installation.
- Python packages listed in `requirements.txt`.

The Python packages are:

- `pandas`
- `numpy`
- `scikit-learn`

## Installation

Open PowerShell in the project root and install the JavaScript dependencies:

```powershell
npm install
```

Create or activate a Python virtual environment if needed:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```powershell
python -m pip install -r requirements.txt
```

## Run Everything With One Command

The recommended Windows command is:

```powershell
npm run start
```

This command starts both processes:

1. The Python model watcher, which reads `database/logs/sensor_data.log` and refreshes the prediction JSON every five seconds.
2. The Vite development server for the React dashboard.

Open the dashboard at:

```text
http://localhost:5173/
```

You can also run the launcher directly:

```powershell
.\run_erms.ps1
```

Stop the application with `Ctrl+C`. The launcher also stops the model watcher when the Vite process exits.

## Individual Commands

Run one model refresh:

```powershell
npm run ml:train
```

Run the model continuously without starting the frontend:

```powershell
npm run ml:watch
```

Start only the Vite frontend:

```powershell
npm run dev
```

Create a production build:

```powershell
npm run build
```

Preview the production build:

```powershell
npm run preview
```

Run the JavaScript linter:

```powershell
npm run lint
```

## Adding Live Sensor Data

Append one JSON object per line to `database/logs/sensor_data.log`. For example:

```json
{"id":"live-001","region":"Silchar","latitude":24.8333,"longitude":92.7789,"aqi_value":245,"earthquake_magnitude_est":1.2,"max_temp_c_forecast":38.5,"flood_risk":"high","hazardous_aqi_level":"hazardous","forest_fire_risk":"low","earthquake_risk":"none","landslide_risk":"moderate","extreme_heat_risk":"high","industrial_emissions_level":"moderate","water_quality":"poor","glacial_liquefaction_risk":"none","tsunami_risk":"none","cyclone_risk":"none","last_updated":"2026-09-07T12:00:00Z"}
```

When the watcher is running:

1. The next model cycle reads the new record.
2. The record is merged with the historical dataset.
3. The model recalculates scores and anomaly totals.
4. `frontend/public/ml_predictions.json` is rewritten.
5. The frontend worker detects the refreshed data on its next poll.
6. The dashboard data-point count, anomaly count, hazard layers, and map nodes update automatically.

The same prediction JSON is also a stable handoff contract for a future central analytics service, emergency-management API, mobile notification gateway, or policy reporting job. The current repository does not contain an external cloud service or SMS/push provider, so external notification dispatch remains an integration point rather than an active network dependency.

To remove a live record, delete its JSON line from `sensor_data.log`. The next model cycle rebuilds the combined dataset without that record.

## Sensor Field Reference

The model recognizes these numeric fields:

| Field | Meaning |
| --- | --- |
| `latitude` | Sensor latitude from -90 to 90 |
| `longitude` | Sensor longitude from -180 to 180 |
| `aqi_value` | Numeric air quality index |
| `earthquake_magnitude_est` | Estimated earthquake magnitude |
| `max_temp_c_forecast` | Forecast maximum temperature in Celsius |

It also recognizes these categorical risk fields:

| Field | Risk feed |
| --- | --- |
| `flood_risk` | Flood |
| `hazardous_aqi_level` | Hazardous AQI |
| `forest_fire_risk` | Forest Fires |
| `earthquake_risk` | Earthquakes |
| `landslide_risk` | Landslides |
| `extreme_heat_risk` | Extreme Heat |
| `industrial_emissions_level` | Industrial Emissions |
| `water_quality` | Water Quality |
| `glacial_liquefaction_risk` | Glacial Liquefaction |
| `tsunami_risk` | Tsunami |
| `cyclone_risk` | Cyclone |

Common aliases such as `lat`, `lon`, `aqi`, `temperature`, `flood`, and `cyclone` are normalized by the Python loader.

## Geographic Filtering

The frontend applies geographic checks before creating map nodes:

- Invalid latitude and longitude values are removed.
- Points in the ocean are removed from land-based layers.
- Cyclones are limited to plausible latitude and coastal ranges.
- Tsunamis are limited to coastal locations with a tsunami signal.
- Glacial liquefaction requires a high-latitude location and a glacial risk signal.
- Floods, fires, landslides, heat, earthquakes, emissions, water quality, and air quality require matching row-level measurements.

This prevents a hazard category from appearing everywhere just because a row contains unrelated environmental data.

## Generated Prediction Format

The generated JSON has this general shape:

```json
{
	"model": {
		"name": "scikit-learn IsolationForest",
		"version": "1.0",
		"features": [],
		"rows": 100001,
		"contamination": 0.08,
		"threshold": 0.72
	},
	"summary": {
		"rows": 100001,
		"anomalies": 1408,
		"anomalyRate": 1.41,
		"averageScore": 0.25
	},
	"rows": []
}
```

The exact totals change whenever the baseline CSV or live sensor log changes.

## Troubleshooting

### PowerShell blocks scripts

The `start` script already uses a process-scoped execution-policy bypass. If PowerShell still blocks a direct launcher call, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run start
```

### The dashboard shows stale data

Check that:

1. `npm run start` is still running.
2. The new log entry is valid JSON.
3. The entry is in `database/logs/sensor_data.log`.
4. `frontend/public/ml_predictions.json` has a recent modified time.
5. The browser is using the Vite URL at `http://localhost:5173/`.

### The model does not detect a new record

Make sure the JSON object contains valid coordinates and at least one meaningful numeric or risk value. The model can ingest a record without every field, but missing values may be imputed and may not produce a strong anomaly score.

### Port 5173 is already in use

Stop the other Vite process, or start the frontend on another port:

```powershell
npm run dev:server -- --host 0.0.0.0 --port 5174
```

## Current Status

ERMS is an actively developed prototype. Edge-oriented live-data ingestion, multi-hazard scoring, geographic filtering, prioritized dashboard alerts, affected-zone mapping, risk trends, and the one-command Windows launcher are implemented. External mobile push/SMS delivery, authenticated sensor ingestion, a persistent cloud database, automated tests, and production operational monitoring are not included yet.

## License

No license has been specified for this repository yet.