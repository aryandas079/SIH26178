# ERMS Machine Learning & Geospatial Intelligence Engine

This tier houses the analytical models, spatial indexing pipelines, and training workflows powering the real-time environmental hazard prediction system across sovereign India.

---

## Architecture Overview

```
Physical Telemetry & Open-Meteo API
              │
              ▼
   [ Feature Normalization ]
 (12-Channel Standard Matrix)
              │
              ▼
 [ Spatial k-NN Drainage Index ] ──► (11 River Basins, 59 CWC Gauges)
              │
              ▼
 [ Scikit-Learn Anomaly Model ] ──► (Isolation Forest + Severity Calibrator)
              │
              ▼
[ Topological Propagation Engine ] ──► (Surge Arrival Hours, Spillover %, Loss Estimate)
```

---

## Directory Structure

- **`models/`**: Serialized model parameters and threshold weights (`hazardAnomalyModel.json`).
- **`training/`**:
  - `train_anomaly_detector.py`: Scikit-learn training pipeline utilizing historical calamity telemetry to calibrate multi-hazard severity thresholds.
  - `generate_hazard_geometries.py`: Geodetic geometry synthesizer generating boundary vectors and flood plain extents.
- **`geospatial/`**:
  - `indianRiversGeo.json`: Topological drainage vectors for 11 major river basins (Ganga, Yamuna, Brahmaputra, Barak, Narmada, Godavari, Krishna, Kaveri, Mahanadi, Tapti, Sutlej).
  - `india-soi.json`: Official Survey of India sovereign boundary polygon.
  - `indiaHazardGeometries.json`: Vulnerability polygons for seismicity, storm surge, landslides, and air degradation.
  - `historicalDatasetSummaries.json`: Historical baseline observations.

---

## Retraining the Model

To retrain the anomaly detection engine with updated ground-truth datasets:

```bash
# Ensure Python 3.9+ and required packages are installed
pip install scikit-learn numpy pandas

# Execute training script
python ml_engine/training/train_anomaly_detector.py

# The script evaluates validation scores and exports updated weights to:
# ml_engine/models/hazardAnomalyModel.json
```
