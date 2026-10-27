from pathlib import Path

import pandas as pd

DATA_PATH = Path(__file__).resolve().parent / "data.csv"
df = pd.read_csv(DATA_PATH)

print("Ukuran dataset:", f"{len(df):,} baris x {len(df.columns)} kolom")
print("\nTipe data:")
print(df.dtypes.to_string())

missing = df.isna().sum()
missing_report = pd.DataFrame({
	"jumlah_kosong": missing,
	"persentase_kosong": (missing / len(df) * 100).round(2),
})
print("\nNilai kosong:")
print(missing_report[missing_report["jumlah_kosong"] > 0].to_string())

print("\nRingkasan fitur numerik:")
print(df.select_dtypes(include="number").describe().round(3).to_string())

if "is_anomaly" in df.columns:
	print("\nDistribusi target is_anomaly:")
	print(df["is_anomaly"].value_counts(dropna=False).sort_index().to_string())
	print("\nPersentase target (%):")
	print((df["is_anomaly"].value_counts(normalize=True, dropna=False).sort_index() * 100).round(2).to_string())

print("\nLima baris pertama:")
print(df.head().to_string(index=False))
