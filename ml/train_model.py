"""Train the ERMS demo anomaly model with scikit-learn.

Run from the project root:
    py -3.14 ml/train_model.py

The generated public/ml_predictions.json is a demo artifact. A sensor service can
replace this script's CSV input and write the same prediction contract.
"""
from pathlib import Path
import json
import math

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "src" / "assets" / "hazard_data.csv"
OUTPUT = ROOT / "public" / "ml_predictions.json"

NUMERIC_FIELDS = [
    "latitude", "longitude", "aqi_value", "earthquake_magnitude_est",
    "max_temp_c_forecast",
]
RISK_FIELDS = [
    "flood_risk", "hazardous_aqi_level", "forest_fire_risk",
    "earthquake_risk", "landslide_risk", "extreme_heat_risk",
    "industrial_emissions_level", "water_quality",
    "glacial_liquefaction_risk", "tsunami_risk", "cyclone_risk",
]
SEVERITY = {
    "none": 0, "good": 0, "excellent": 0, "low": 1, "fair": 2,
    "moderate": 3, "unhealthy for sensitive groups": 4, "unhealthy": 5,
    "contaminated": 6, "poor": 6, "high": 7, "very unhealthy": 8,
    "severe": 9, "hazardous": 10,
}


def encode_risk(value: object) -> float:
    return float(SEVERITY.get(str(value).strip().lower(), 0))


def json_safe(value: object) -> object:
    if value is None or isinstance(value, str) or isinstance(value, bool):
        return value
    if isinstance(value, (float, np.floating)):
        return float(value) if math.isfinite(float(value)) else None
    if isinstance(value, (int, np.integer)):
        return int(value)
    return value


def main() -> None:
    frame = pd.read_csv(INPUT)
    features = frame[NUMERIC_FIELDS].apply(pd.to_numeric, errors="coerce")
    for field in RISK_FIELDS:
        features[field] = frame[field].map(encode_risk)

    model = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("isolation_forest", IsolationForest(
            n_estimators=200,
            contamination=0.08,
            random_state=42,
            n_jobs=-1,
        )),
    ])
    model.fit(features)
    decision = model.decision_function(features)
    raw_anomaly = -decision
    low, high = float(raw_anomaly.min()), float(raw_anomaly.max())
    scores = np.clip((raw_anomaly - low) / max(high - low, 1e-9), 0, 1)
    predictions = scores >= 0.72

    raw_records = frame.astype(object).where(pd.notna(frame), None).to_dict(orient="records")
    records = [{field: json_safe(value) for field, value in record.items()} for record in raw_records]
    for record, score, anomaly in zip(records, scores, predictions):
        record["model_anomaly_score"] = round(float(score), 6)
        record["model_is_anomaly"] = bool(anomaly)

    payload = {
        "model": {
            "name": "scikit-learn IsolationForest",
            "version": "1.0",
            "features": NUMERIC_FIELDS + RISK_FIELDS,
            "rows": len(records),
            "contamination": 0.08,
            "threshold": 0.72,
        },
        "summary": {
            "rows": len(records),
            "anomalies": int(predictions.sum()),
            "anomalyRate": round(float(predictions.mean() * 100), 2),
            "averageScore": round(float(scores.mean()), 6),
        },
        "rows": records,
    }
    OUTPUT.parent.mkdir(exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"trained {len(records):,} rows; found {int(predictions.sum()):,} anomalies; wrote {OUTPUT}")


if __name__ == "__main__":
    main()
