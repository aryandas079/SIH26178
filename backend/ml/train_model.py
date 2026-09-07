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

HAZARD_RULES = {
    "flood": {"field": "flood_risk", "label": "Flooding"},
    "wildfire": {"field": "forest_fire_risk", "label": "Forest Fires"},
    "pollution": {"field": "hazardous_aqi_level", "label": "Hazardous Pollution"},
    "landslide": {"field": "landslide_risk", "label": "Landslides"},
    "extreme_weather": {"field": "extreme_heat_risk", "label": "Extreme Weather"},
    "industrial_safety": {"field": "industrial_emissions_level", "label": "Industrial Safety"},
}
WARNING_LEVELS = ((0.85, "critical"), (0.7, "high"), (0.5, "moderate"), (0.3, "watch"))
WARNING_PRIORITY = {"critical": 4, "high": 3, "moderate": 2, "watch": 1, "normal": 0}


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


def numeric_value(value: object) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def risk_level(score: float) -> str:
    for threshold, level in WARNING_LEVELS:
        if score >= threshold:
            return level
    return "normal"


def field_present(row: dict, field: str) -> bool:
    value = row.get(field)
    return value is not None and str(value).strip().lower() not in {"", "none", "good", "excellent", "nan"}


def calculate_hazard_scores(row: dict) -> dict[str, dict]:
    aqi = numeric_value(row.get("aqi_value")) or 0
    temperature = numeric_value(row.get("max_temp_c_forecast")) or 0
    anomaly_score = numeric_value(row.get("model_anomaly_score")) or 0
    direct_scores = {name: encode_risk(row.get(rule["field"])) / 10 for name, rule in HAZARD_RULES.items()}
    direct_scores["pollution"] = max(direct_scores["pollution"], min(aqi / 300, 1))
    direct_scores["wildfire"] = max(direct_scores["wildfire"], min(max(temperature - 30, 0) / 18, 1))
    direct_scores["extreme_weather"] = max(direct_scores["extreme_weather"], min(max(temperature - 32, 0) / 15, 1))

    scores = {}
    for name, rule in HAZARD_RULES.items():
        score = min((direct_scores[name] * 0.75) + (anomaly_score * 0.25), 1)
        available_fields = [rule["field"], "latitude", "longitude"]
        if name in {"pollution", "wildfire", "extreme_weather"}:
            available_fields.append("aqi_value" if name == "pollution" else "max_temp_c_forecast")
        completeness = sum(field_present(row, field) for field in available_fields) / len(available_fields)
        confidence = min(1, 0.45 + (completeness * 0.4) + (0.15 if field_present(row, rule["field"]) else 0))
        scores[name] = {
            "name": rule["label"],
            "score": round(score, 6),
            "confidence": round(confidence, 6),
            "level": risk_level(score),
        }
    return scores


def build_risk_intelligence(records: list[dict]) -> tuple[list[dict], dict, list[dict], dict]:
    alerts = []
    hazard_summary = {}
    trend_buckets = {}
    zone_buckets = {}

    for record in records:
        hazard_scores = calculate_hazard_scores(record)
        record["risk_scores"] = {name: details["score"] for name, details in hazard_scores.items()}
        for name, details in hazard_scores.items():
            summary = hazard_summary.setdefault(name, {"name": details["name"], "observations": 0, "alerts": 0, "maxScore": 0, "averageScore": 0})
            summary["observations"] += 1
            summary["maxScore"] = max(summary["maxScore"], details["score"])
            summary["averageScore"] += details["score"]
            if details["level"] != "normal":
                summary["alerts"] += 1
                alert = {
                    "id": f"{record.get('id', 'row')}-{name}",
                    "type": name,
                    "hazard": details["name"],
                    "region": record.get("region") or "Unknown zone",
                    "latitude": json_safe(record.get("latitude")),
                    "longitude": json_safe(record.get("longitude")),
                    "level": details["level"],
                    "score": details["score"],
                    "confidence": details["confidence"],
                    "lastUpdated": record.get("last_updated"),
                    "audiences": ["local-authority", "citizen"],
                }
                alerts.append(alert)
                zone = alert["region"]
                zone_data = zone_buckets.setdefault(zone, {"region": zone, "alerts": 0, "maxScore": 0, "hazards": set()})
                zone_data["alerts"] += 1
                zone_data["maxScore"] = max(zone_data["maxScore"], details["score"])
                zone_data["hazards"].add(details["name"])
                date_key = str(record.get("last_updated") or "unknown")[:10]
                trend = trend_buckets.setdefault(date_key, {"date": date_key, "alerts": 0, "maxScore": 0})
                trend["alerts"] += 1
                trend["maxScore"] = max(trend["maxScore"], details["score"])

    for summary in hazard_summary.values():
        summary["averageScore"] = round(summary["averageScore"] / max(summary["observations"], 1), 6)
        summary["maxScore"] = round(summary["maxScore"], 6)
    alerts.sort(key=lambda alert: (WARNING_PRIORITY[alert["level"]], alert["score"], alert["confidence"]), reverse=True)
    zones = [{**zone, "maxScore": round(zone["maxScore"], 6), "hazards": sorted(zone["hazards"])} for zone in zone_buckets.values()]
    zones.sort(key=lambda zone: (zone["maxScore"], zone["alerts"]), reverse=True)
    trends = sorted(trend_buckets.values(), key=lambda trend: trend["date"])[-30:]
    return alerts[:250], hazard_summary, zones[:100], trends


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

    alerts, hazard_summary, affected_zones, risk_trends = build_risk_intelligence(records)
    warning_counts = {level: sum(alert["level"] == level for alert in alerts) for level in ["critical", "high", "moderate", "watch"]}

    payload = {
        "model": {
            "name": "scikit-learn IsolationForest",
            "version": "1.0",
            "features": NUMERIC_FIELDS + RISK_FIELDS,
            "rows": len(records),
            "contamination": 0.08,
            "threshold": 0.72,
            "execution": {
                "mode": "edge-ready",
                "cloudConnectivityRequired": False,
                "source": "local CSV and JSONL sensor log",
                "refreshSeconds": 5,
            },
        },
        "summary": {
            "rows": len(records),
            "anomalies": int(predictions.sum()),
            "anomalyRate": round(float(predictions.mean() * 100), 2),
            "averageScore": round(float(scores.mean()), 6),
            "alerts": len(alerts),
            "criticalAlerts": warning_counts["critical"],
            "highAlerts": warning_counts["high"],
        },
        "hazards": hazard_summary,
        "alerts": alerts,
        "affectedZones": affected_zones,
        "riskTrends": risk_trends,
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
