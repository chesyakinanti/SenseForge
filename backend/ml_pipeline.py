import json
from pathlib import Path

import joblib
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data.csv"
CLEANED_DATA_PATH = BASE_DIR / "data_cleaned.csv"
MODEL_PATH = BASE_DIR / "senseforge_muti_random_forest.joblib"
REPORT_PATH = BASE_DIR / "model_evaluation.json"
TIMESTAMP_COLUMN = "timestamp"
TARGET_COLUMN = "is_anomaly"
SENSOR_COLUMNS = [
    "temperature_c",
    "vibration_mm_s",
    "pressure_kpa",
    "motor_rpm",
    "flow_rate_lpm",
    "power_consumption_kw",
    "coolant_temp_c",
    "acoustic_level_db",
    "oil_viscosity_cst",
    "humidity_pct",
    "ambient_temp_c",
]
FEATURE_COUNT = 5
TEST_FRACTION = 0.2
VALIDATION_FRACTION = 0.1


def main() -> None:
    df = pd.read_csv(DATA_PATH, parse_dates=[TIMESTAMP_COLUMN])
    required_columns = SENSOR_COLUMNS + [TARGET_COLUMN, TIMESTAMP_COLUMN]
    missing_columns = [column for column in required_columns if column not in df.columns]
    if missing_columns:
        raise ValueError(f"Kolom wajib tidak tersedia: {missing_columns}")

    original_rows = len(df)
    if "reading_id" in df.columns:
        df = df.drop_duplicates(subset="reading_id", keep="first").copy()
    else:
        df = df.drop_duplicates().copy()
    removed_duplicates = original_rows - len(df)

    df = df.dropna(subset=[TARGET_COLUMN, TIMESTAMP_COLUMN]).copy()
    df[TARGET_COLUMN] = df[TARGET_COLUMN].astype(int)
    if set(df[TARGET_COLUMN].unique()) != {0, 1}:
        raise ValueError("Target is_anomaly harus memiliki kelas 0 dan 1")

    df[SENSOR_COLUMNS] = df[SENSOR_COLUMNS].apply(pd.to_numeric, errors="coerce")
    timestamps = sorted(df[TIMESTAMP_COLUMN].unique())
    train_cutoff_index = int(len(timestamps) * (1 - TEST_FRACTION - VALIDATION_FRACTION))
    test_cutoff_index = int(len(timestamps) * (1 - TEST_FRACTION))
    if train_cutoff_index <= 0 or test_cutoff_index <= train_cutoff_index or test_cutoff_index >= len(timestamps):
        raise ValueError("Dataset tidak cukup untuk pembagian train/test kronologis")
    validation_start = timestamps[train_cutoff_index]
    test_start = timestamps[test_cutoff_index]

    train_df = df[df[TIMESTAMP_COLUMN] < validation_start]
    validation_df = df[
        (df[TIMESTAMP_COLUMN] >= validation_start)
        & (df[TIMESTAMP_COLUMN] < test_start)
    ]
    test_df = df[df[TIMESTAMP_COLUMN] >= test_start]
    correlations = train_df[SENSOR_COLUMNS + [TARGET_COLUMN]].corr(numeric_only=True)[TARGET_COLUMN]
    feature_columns = correlations.drop(TARGET_COLUMN).abs().nlargest(FEATURE_COUNT).index.tolist()
    x_train = train_df[feature_columns]
    y_train = train_df[TARGET_COLUMN]
    x_validation = validation_df[feature_columns]
    y_validation = validation_df[TARGET_COLUMN]
    x_test = test_df[feature_columns]
    y_test = test_df[TARGET_COLUMN]
    if y_train.nunique() < 2 or y_validation.nunique() < 2 or y_test.nunique() < 2:
        raise ValueError("Train, validation, dan test harus memiliki dua kelas target")

    pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=400,
                    class_weight="balanced_subsample",
                    random_state=42,
                    n_jobs=-1,
                    min_samples_leaf=3,
                ),
            ),
        ]
    )
    pipeline.fit(x_train, y_train)

    validation_probabilities = pipeline.predict_proba(x_validation)[:, 1]
    validation_precision, validation_recall, thresholds = precision_recall_curve(
        y_validation, validation_probabilities
    )
    validation_f1 = (
        2 * validation_precision[:-1] * validation_recall[:-1]
        / (validation_precision[:-1] + validation_recall[:-1] + 1e-12)
    )
    threshold_index = int(validation_f1.argmax())
    decision_threshold = float(thresholds[threshold_index])

    probabilities = pipeline.predict_proba(x_test)[:, 1]
    predictions = (probabilities >= decision_threshold).astype(int)
    matrix = confusion_matrix(y_test, predictions, labels=[0, 1])
    true_negative, false_positive, false_negative, true_positive = matrix.ravel()
    metrics = {
        "accuracy": float(accuracy_score(y_test, predictions)),
        "precision_anomaly": float(precision_score(y_test, predictions, zero_division=0)),
        "recall_anomaly": float(recall_score(y_test, predictions, zero_division=0)),
        "f1_anomaly": float(f1_score(y_test, predictions, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, probabilities)),
        "average_precision": float(average_precision_score(y_test, probabilities)),
        "specificity": float(true_negative / (true_negative + false_positive)),
        "confusion_matrix_labels_0_1": matrix.tolist(),
        "classification_report": classification_report(
            y_test, predictions, labels=[0, 1], output_dict=True, zero_division=0
        ),
    }

    cleaned_df = df.copy()
    cleaned_df[feature_columns] = pipeline.named_steps["imputer"].transform(df[feature_columns])
    cleaned_df.to_csv(CLEANED_DATA_PATH, index=False)
    joblib.dump(pipeline, MODEL_PATH)

    report = {
        "dataset": DATA_PATH.name,
        "cleaned_dataset": CLEANED_DATA_PATH.name,
        "model": MODEL_PATH.name,
        "scikit_learn_version": sklearn.__version__,
        "feature_columns": feature_columns,
        "feature_selection": "Top five sensor features by absolute train-only correlation with is_anomaly",
        "target_column": TARGET_COLUMN,
        "rows_original": original_rows,
        "rows_after_cleaning": len(df),
        "duplicates_removed": removed_duplicates,
        "missing_values_before_imputation": {
            column: int(count) for column, count in df[feature_columns].isna().sum().items()
        },
        "imputation": "Median, fitted using training rows only",
        "outliers": "Preserved as potential anomaly signals; not clipped or removed",
        "split_strategy": "Chronological holdout by timestamp",
        "split_fractions": {"train": 1 - TEST_FRACTION - VALIDATION_FRACTION, "validation": VALIDATION_FRACTION, "test": TEST_FRACTION},
        "validation_start_timestamp": pd.Timestamp(validation_start).isoformat(),
        "test_start_timestamp": pd.Timestamp(test_start).isoformat(),
        "train_rows": len(train_df),
        "validation_rows": len(validation_df),
        "test_rows": len(test_df),
        "train_class_counts": {
            str(key): int(value) for key, value in y_train.value_counts().sort_index().items()
        },
        "test_class_counts": {
            str(key): int(value) for key, value in y_test.value_counts().sort_index().items()
        },
        "decision_threshold": decision_threshold,
        "validation_f1_at_threshold": float(validation_f1[threshold_index]),
        "metrics": metrics,
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"Rows: {original_rows} -> {len(df)}; duplicate IDs removed: {removed_duplicates}")
    print(f"Selected sensor features: {', '.join(feature_columns)}")
    print(f"Chronological split: train={len(train_df)}, validation={len(validation_df)}, test={len(test_df)}")
    print(f"Validation starts: {pd.Timestamp(validation_start)}; test starts: {pd.Timestamp(test_start)}")
    print(f"Decision threshold selected on validation: {decision_threshold:.4f}")
    for name in (
        "accuracy",
        "precision_anomaly",
        "recall_anomaly",
        "f1_anomaly",
        "roc_auc",
        "average_precision",
        "specificity",
    ):
        print(f"{name}: {metrics[name]:.4f}")
    print("Confusion matrix [normal, anomaly]:")
    print(matrix)
    print(f"Cleaned dataset saved: {CLEANED_DATA_PATH.name}")
    print(f"Model saved: {MODEL_PATH.name}")
    print(f"Evaluation saved: {REPORT_PATH.name}")


if __name__ == "__main__":
    main()