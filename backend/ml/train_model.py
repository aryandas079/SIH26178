from __future__ import annotations

import argparse
import json
import math
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASELINE = ROOT / "database" / "data" / "hazard_data.csv"
DEFAULT_INPUT = ROOT / "database" / "logs" / "sensor_data.log"
DEFAULT_OUTPUT = ROOT / "frontend" / "public" / "ml_predictions.json"

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
ALIAS_MAP = {
    "lat": "latitude",
    "latitude": "latitude",
    "lon": "longitude",
    "lng": "longitude",
    "longitude": "longitude",
    "aqi": "aqi_value",
    "aqi_value": "aqi_value",
    "eq_mag": "earthquake_magnitude_est",
    "earthquake_magnitude": "earthquake_magnitude_est",
    "earthquake_magnitude_est": "earthquake_magnitude_est",
    "max_temp": "max_temp_c_forecast",
    "temperature": "max_temp_c_forecast",
    "max_temp_c_forecast": "max_temp_c_forecast",
    "flood": "flood_risk",
    "flood_risk": "flood_risk",
    "hazardous_aqi": "hazardous_aqi_level",
    "hazardous_aqi_level": "hazardous_aqi_level",
    "forest_fire": "forest_fire_risk",
    "forest_fire_risk": "forest_fire_risk",
    "earthquake": "earthquake_risk",
    "earthquake_risk": "earthquake_risk",
    "landslide": "landslide_risk",
    "landslide_risk": "landslide_risk",
    "extreme_heat": "extreme_heat_risk",
    "extreme_heat_risk": "extreme_heat_risk",
    "industrial_emissions": "industrial_emissions_level",
    "industrial_emissions_level": "industrial_emissions_level",
    "water_quality": "water_quality",
    "glacial_liquefaction": "glacial_liquefaction_risk",
    "glacial_liquefaction_risk": "glacial_liquefaction_risk",
    "tsunami": "tsunami_risk",
    "tsunami_risk": "tsunami_risk",
    "cyclone": "cyclone_risk",
    "cyclone_risk": "cyclone_risk",
}


def normalize_columns(frame: pd.DataFrame) -> pd.DataFrame:
    renamed = frame.copy()
    renamed.columns = [str(column).strip().lower().replace(" ", "_").replace("-", "_") for column in renamed.columns]
    rename_map = {}
    for column in renamed.columns:
        normalized_key = ALIAS_MAP.get(column, column)
        if normalized_key != column:
            rename_map[column] = normalized_key
    return renamed.rename(columns=rename_map)


def parse_jsonl(path: Path) -> pd.DataFrame:
    rows: list[dict] = []
    if not path.exists() or path.stat().st_size == 0:
        return pd.DataFrame(columns=[*NUMERIC_FIELDS, *RISK_FIELDS])

    text = path.read_text(encoding="utf-8", errors="ignore")
    decoder = json.JSONDecoder()
    index = 0

    while index < len(text):
        while index < len(text) and text[index].isspace():
            index += 1
        if index >= len(text):
            break
        try:
            payload, end = decoder.raw_decode(text[index:])
        except json.JSONDecodeError:
            index += 1
            continue
        if isinstance(payload, list):
            rows.extend(payload)
        elif isinstance(payload, dict):
            rows.append(payload)
        index += end

    if not rows:
        return pd.DataFrame(columns=[*NUMERIC_FIELDS, *RISK_FIELDS])
    return normalize_columns(pd.json_normalize(rows))


def load_sensor_frame(input_path: Path) -> pd.DataFrame:
    if input_path.suffix.lower() == ".csv":
        return normalize_columns(pd.read_csv(input_path))
    if input_path.suffix.lower() in {".jsonl", ".ndjson", ".log"}:
        return parse_jsonl(input_path)
    raise ValueError(f"Unsupported sensor log format: {input_path}")


def load_combined_frame(input_path: Path) -> pd.DataFrame:
    baseline = pd.DataFrame()
    if DEFAULT_BASELINE.exists():
        baseline = load_sensor_frame(DEFAULT_BASELINE)

    live = pd.DataFrame()
    if input_path.exists() and input_path.resolve() != DEFAULT_BASELINE.resolve():
        live = load_sensor_frame(input_path)

    if baseline.empty and live.empty:
        return pd.DataFrame(columns=[*NUMERIC_FIELDS, *RISK_FIELDS])
    if baseline.empty:
        return live
    if live.empty:
        return baseline

    combined = pd.concat([baseline, live], ignore_index=True, sort=False)
    if "id" in combined.columns:
        combined = combined.drop_duplicates(subset=["id"], keep="last")
    else:
        combined = combined.drop_duplicates(subset=["latitude", "longitude"], keep="last")
    return combined


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


def build_prediction_payload(frame: pd.DataFrame) -> dict:
    normalized = frame.copy()
    for column in NUMERIC_FIELDS:
        if column not in normalized.columns:
            normalized[column] = np.nan
    for column in RISK_FIELDS:
        if column not in normalized.columns:
            normalized[column] = "none"
    features = normalized[NUMERIC_FIELDS].apply(pd.to_numeric, errors="coerce")
    for field in RISK_FIELDS:
        features[field] = normalized[field].map(encode_risk)

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

    raw_records = normalized.astype(object).where(pd.notna(normalized), None).to_dict(orient="records")
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
    return payload


def write_predictions(payload: dict, output_path: Path) -> None:
    output_path.parent.mkdir(exist_ok=True)
    output_path.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")


def run_once(input_path: Path, output_path: Path) -> dict:
    frame = load_combined_frame(input_path)
    payload = build_prediction_payload(frame)
    write_predictions(payload, output_path)
    print(f"trained {payload['summary']['rows']:,} rows; found {payload['summary']['anomalies']:,} anomalies; wrote {output_path}")
    return payload


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train ERMS anomaly model from a sensor log file or a CSV dataset.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="CSV or JSONL/NDJSON sensor log file to ingest alongside the baseline dataset.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Path for the prediction JSON used by the dashboard.")
    parser.add_argument("--watch", action="store_true", help="Continuously monitor the input file and refresh predictions when new sensor data is appended.")
    parser.add_argument("--poll-seconds", type=float, default=5.0, help="Refresh interval in seconds for live sensor monitoring.")
    parser.add_argument("--iterations", type=int, default=-1, help="How many live refresh cycles to run before exiting. Use -1 for indefinite monitoring.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.watch:
        loop_count = 0
        while True:
            payload = run_once(args.input, args.output)
            loop_count += 1
            if args.iterations > 0 and loop_count >= args.iterations:
                break
            time.sleep(max(args.poll_seconds, 1.0))
        return

    run_once(args.input, args.output)


if __name__ == "__main__":
    main()
