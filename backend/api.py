from pathlib import Path
from typing import Any
import os
import json

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

from analytics import aggregate_equipment_summary
from database import MONGODB_URI, get_collection
from import_dataset import import_dataset as import_sensor_dataset


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data.csv"
MODEL_PATH = BASE_DIR / "senseforge_random_forest_baseline.joblib"
MUTI_MODEL_PATH = BASE_DIR / "senseforge_muti_random_forest.joblib"
MUTI_REPORT_PATH = BASE_DIR / "model_evaluation.json"
BENCHMARK_REPORT_PATH = BASE_DIR / "aggregation_benchmark.json"
TARGET_COLUMN = "is_anomaly"

app = FastAPI(title="SenseForge API", version="1.0.0")
allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
model = joblib.load(MODEL_PATH)
muti_model = joblib.load(MUTI_MODEL_PATH) if MUTI_MODEL_PATH.exists() else None
muti_report = (
    json.loads(MUTI_REPORT_PATH.read_text(encoding="utf-8"))
    if MUTI_REPORT_PATH.exists()
    else None
)
FEATURE_COLUMNS = list(getattr(model, "feature_names_in_", []))
if not FEATURE_COLUMNS:
    raise RuntimeError("Model tidak menyimpan feature_names_in_; daftar fitur harus disediakan.")
imputer = getattr(model, "named_steps", {}).get("imputer")
if imputer is not None and hasattr(imputer, "_fit_dtype") and not hasattr(imputer, "_fill_dtype"):
    imputer._fill_dtype = imputer._fit_dtype

_dataset_cache: pd.DataFrame | None = None


class PredictionRequest(BaseModel):
    features: dict[str, Any]
    reading_id: str | None = None
    equipment_id: str | None = None
    timestamp: str | None = None
    save_to_database: bool = False


def load_dataset() -> pd.DataFrame:
    global _dataset_cache
    if _dataset_cache is not None:
        return _dataset_cache
    if not DATA_PATH.exists():
        raise HTTPException(status_code=404, detail="data.csv tidak ditemukan")
    _dataset_cache = pd.read_csv(DATA_PATH)
    return _dataset_cache


def aggregate_dataframe_summary(df: pd.DataFrame, document_limit: int | None = None) -> list[dict[str, Any]]:
    ordered = df.sort_values("reading_id", ascending=True) if "reading_id" in df.columns else df
    if document_limit is not None:
        ordered = ordered.head(document_limit)

    grouped = ordered.groupby(["equipment_id", "operating_mode"], dropna=False)
    results: list[dict[str, Any]] = []
    for (equipment_id, operating_mode), group in grouped:
        readings = int(len(group))
        anomalies = int((group["is_anomaly"] == 1).sum()) if "is_anomaly" in group else 0
        results.append(
            {
                "_id": {
                    "equipment_id": str(equipment_id),
                    "operating_mode": str(operating_mode),
                },
                "readings": readings,
                "anomalies": anomalies,
                "average_temperature_c": float(group["temperature_c"].mean()),
                "average_vibration_mm_s": float(group["vibration_mm_s"].mean()),
                "average_pressure_kpa": float(group["pressure_kpa"].mean()),
                "average_motor_rpm": float(group["motor_rpm"].mean()),
                "average_flow_rate_lpm": float(group["flow_rate_lpm"].mean()),
                "anomaly_rate": float(anomalies / readings) if readings else 0.0,
            }
        )
    results.sort(key=lambda item: (item["_id"]["equipment_id"], item["_id"]["operating_mode"]))
    return results


def predict_features(features: dict[str, Any]) -> tuple[int, float | None]:
    missing = [name for name in FEATURE_COLUMNS if name not in features]
    if missing:
        raise HTTPException(status_code=422, detail={"missing_features": missing})

    row = pd.DataFrame([{name: features[name] for name in FEATURE_COLUMNS}])
    prediction = int(model.predict(row)[0])
    probabilities = getattr(model, "predict_proba", None)
    confidence = None
    if probabilities is not None:
        confidence = float(max(probabilities(row)[0]))
    return prediction, confidence


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": type(model).__name__,
        "features": FEATURE_COLUMNS,
        "muti_model_available": muti_model is not None,
        "database_configured": bool(MONGODB_URI),
    }


@app.get("/dataset/summary")
def dataset_summary():
    df = load_dataset()
    missing = df.isna().sum()
    numeric = df.select_dtypes(include="number")
    anomaly_counts = df[TARGET_COLUMN].value_counts(dropna=False).to_dict() if TARGET_COLUMN in df else {}
    return {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "column_names": df.columns.tolist(),
        "missing_values": {name: int(count) for name, count in missing.items()},
        "numeric_summary": numeric.describe().to_dict(),
        "anomaly_distribution": {str(key): int(value) for key, value in anomaly_counts.items()},
        "sample": df.head(5).astype(object).where(pd.notna(df.head(5)), None).to_dict(orient="records"),
    }


@app.post("/predict")
def predict(request: PredictionRequest):
    predicted, confidence = predict_features(request.features)
    result = {
        "prediction": predicted,
        "label": "anomaly" if predicted == 1 else "normal",
        "confidence": confidence,
        "reading_id": request.reading_id,
        "equipment_id": request.equipment_id,
        "timestamp": request.timestamp,
    }
    if request.save_to_database:
        document = {**result, "features": request.features}
        try:
            inserted = get_collection("predictions").insert_one(document)
            result["prediction_id"] = str(inserted.inserted_id)
        except Exception as exc:
            raise HTTPException(status_code=503, detail=f"Gagal menyimpan prediksi: {exc}") from exc
    return result


@app.post("/predict/muti")
def predict_muti(request: PredictionRequest):
    if muti_model is None or muti_report is None:
        raise HTTPException(status_code=503, detail="Model SF Anomaly Detector belum tersedia; jalankan ml_pipeline.py")
    feature_columns = muti_report["feature_columns"]
    missing = [name for name in feature_columns if name not in request.features]
    if missing:
        raise HTTPException(status_code=422, detail={"missing_features": missing})
    row = pd.DataFrame([{name: request.features[name] for name in feature_columns}])
    probability = float(muti_model.predict_proba(row)[0][1])
    threshold = float(muti_report["decision_threshold"])
    predicted = int(probability >= threshold)
    return {
        "model": "muti_random_forest",
        "prediction": predicted,
        "label": "anomaly" if predicted else "normal",
        "anomaly_probability": probability,
        "decision_threshold": threshold,
        "features_used": feature_columns,
        "reading_id": request.reading_id,
        "equipment_id": request.equipment_id,
        "timestamp": request.timestamp,
    }


@app.post("/predictions/import-dataset")
def import_dataset():
    try:
        return import_sensor_dataset()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Gagal mengimpor dataset: {exc}") from exc


@app.get("/predictions")
def list_predictions(limit: int = 100):
    if not 1 <= limit <= 1000:
        raise HTTPException(status_code=422, detail="limit harus antara 1 dan 1000")
    try:
        docs = list(get_collection("predictions").find({}, {"_id": 0}).limit(limit))
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Gagal membaca database: {exc}") from exc
    return {"items": docs, "count": len(docs)}


@app.get("/dataset/records")
def list_sensor_records(skip: int = 0, limit: int = 100, is_anomaly: int | None = None):
    if skip < 0 or not 1 <= limit <= 1000:
        raise HTTPException(status_code=422, detail="skip minimal 0 dan limit harus antara 1 dan 1000")
    if is_anomaly not in (None, 0, 1):
        raise HTTPException(status_code=422, detail="is_anomaly hanya boleh 0 atau 1")
    query = {"is_anomaly": is_anomaly} if is_anomaly is not None else {}
    try:
        collection = get_collection("sensor_data")
        docs = list(collection.find(query, {"_id": 0}).skip(skip).limit(limit))
        total = collection.count_documents(query)
        return {"items": docs, "count": len(docs), "total": total, "skip": skip, "limit": limit}
    except Exception:
        # Fallback ke dataset backend data.csv (50.000 baris asli) jika MongoDB Atlas menolak koneksi TLS/IP
        df = load_dataset()
        filtered = df[df[TARGET_COLUMN] == is_anomaly] if is_anomaly is not None and TARGET_COLUMN in df else df
        total = int(len(filtered))
        sliced = filtered.iloc[skip : skip + limit]
        docs = sliced.astype(object).where(pd.notna(sliced), None).to_dict(orient="records")
        return {"items": docs, "count": len(docs), "total": total, "skip": skip, "limit": limit}


@app.get("/analytics/equipment")
def equipment_analytics(document_limit: int | None = None):
    if document_limit is not None and not 1 <= document_limit <= 1_000_000:
        raise HTTPException(status_code=422, detail="document_limit harus antara 1 dan 1000000")
    try:
        collection = get_collection("sensor_data")
        total_documents = collection.count_documents({})
        results = aggregate_equipment_summary(collection, document_limit)
        return {
            "collection": collection.name,
            "total_documents_available": total_documents,
            "documents_aggregated": sum(row["readings"] for row in results),
            "groups": results,
        }
    except Exception:
        # Fallback ke agregasi langsung pada data.csv backend jika MongoDB Atlas menolak koneksi TLS/IP
        df = load_dataset()
        total_documents = int(len(df))
        results = aggregate_dataframe_summary(df, document_limit)
        return {
            "collection": "sensor_data (data.csv)",
            "total_documents_available": total_documents,
            "documents_aggregated": sum(row["readings"] for row in results),
            "groups": results,
        }


@app.get("/analytics/benchmark")
def aggregation_benchmark():
    if not BENCHMARK_REPORT_PATH.exists():
        raise HTTPException(status_code=404, detail="Laporan benchmark belum tersedia")
    return json.loads(BENCHMARK_REPORT_PATH.read_text(encoding="utf-8"))


@app.get("/model/evaluation")
def evaluate_model():
    df = load_dataset()
    if TARGET_COLUMN not in df:
        raise HTTPException(status_code=422, detail=f"Kolom target {TARGET_COLUMN} tidak tersedia")
    missing = [name for name in FEATURE_COLUMNS if name not in df.columns]
    if missing:
        raise HTTPException(status_code=422, detail={"missing_features": missing})
    y_true = df[TARGET_COLUMN].astype(int)
    y_pred = model.predict(df[FEATURE_COLUMNS])
    labels = sorted(int(value) for value in y_true.unique())
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=labels).tolist(),
        "labels": labels,
        "classification_report": classification_report(
            y_true, y_pred, output_dict=True, zero_division=0
        ),
        "rows_evaluated": int(len(df)),
        "note": "Evaluasi pada data.csv; gunakan data uji terpisah untuk estimasi generalisasi yang tidak bias.",
    }


@app.get("/model/muti/evaluation")
def evaluate_muti_model():
    if muti_report is None:
        raise HTTPException(status_code=404, detail="Laporan evaluasi SF Anomaly Detector belum tersedia")
    return muti_report
