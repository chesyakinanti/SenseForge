from pathlib import Path

import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

from api import FEATURE_COLUMNS, TARGET_COLUMN, model

DATA_PATH = Path(__file__).resolve().parent / "data.csv"
df = pd.read_csv(DATA_PATH)
predictions = model.predict(df[FEATURE_COLUMNS])

print("Model berhasil dimuat dan melakukan prediksi.")
print("Jumlah fitur:", len(FEATURE_COLUMNS))
print("Baris dievaluasi:", len(df))
print("Accuracy:", round(float(accuracy_score(df[TARGET_COLUMN], predictions)), 4))
print("Confusion matrix:")
print(confusion_matrix(df[TARGET_COLUMN], predictions))
print("Classification report:")
print(classification_report(df[TARGET_COLUMN], predictions, zero_division=0))
