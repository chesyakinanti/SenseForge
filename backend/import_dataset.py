
from pathlib import Path

import pandas as pd
from pymongo import ReplaceOne

from database import get_collection


DATA_PATH = Path(__file__).resolve().parent / "data.csv"


def import_dataset():
	df = pd.read_csv(DATA_PATH)
	if "reading_id" not in df.columns:
		raise ValueError("Dataset harus memiliki kolom reading_id sebagai identitas unik")

	collection = get_collection("sensor_data")
	collection.create_index("reading_id", unique=True)
	documents = df.astype(object).where(pd.notna(df), None).to_dict(orient="records")
	operations = [
		ReplaceOne({"reading_id": document["reading_id"]}, document, upsert=True)
		for document in documents
	]
	if operations:
		collection.bulk_write(operations, ordered=False)
	return {"processed": len(documents), "collection": collection.name}


if __name__ == "__main__":
	try:
		print(import_dataset())
	except Exception as exc:
		raise SystemExit(f"Import dataset gagal: {exc}") from exc
