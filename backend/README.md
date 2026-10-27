# SenseForge Backend

Backend untuk dataset sensor, pipeline deteksi anomali, dan penyimpanan MongoDB.

## Persiapan

Gunakan Python yang didukung `scikit-learn==1.9.1`. Dari folder proyek, jalankan:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Model baseline milik anggota tim lain disimpan dengan scikit-learn 1.6.1; pada versi baru mungkin muncul peringatan saat file itu dimuat. Model Muti dilatih memakai versi yang dipin di requirements.

Buat atau lengkapi `.env`:

```text
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/?retryWrites=true&w=majority
```

API prediksi dan EDA dapat dijalankan tanpa MongoDB; endpoint penyimpanan dan impor dataset membutuhkan `MONGODB_URI` yang valid.

## Menjalankan

```powershell
uvicorn api:app --reload
```

Buka dokumentasi interaktif di `http://127.0.0.1:8000/docs`.

## Endpoint

- `GET /health`: status API, model, fitur model, dan status konfigurasi database.
- `GET /dataset/summary`: ukuran dataset, nama kolom, missing values, statistik numerik, distribusi target, dan sampel.
- `GET /dataset/records?skip=0&limit=100&is_anomaly=1`: data sensor dari MongoDB dengan pagination dan filter anomali opsional. Jalankan impor dataset terlebih dahulu.
- `GET /analytics/equipment?document_limit=10000`: aggregation sensor per equipment dan operating mode. Tanpa limit, semua dokumen dipakai.
- `POST /predict`: prediksi anomali dari 13 fitur sensor yang dipakai model.
- `GET /model/evaluation`: accuracy, confusion matrix, dan classification report pada `data.csv`.
- `POST /predict/muti`: prediksi dengan model Muti dan lima fitur yang dipilih dari data training.
- `GET /model/muti/evaluation`: laporan evaluasi holdout kronologis model Muti.
- `POST /predictions/import-dataset`: impor 50.000 baris ke koleksi `sensor_data`; impor dapat diulang tanpa membuat duplikat berdasarkan `reading_id`.
- `GET /predictions?limit=100`: riwayat prediksi yang disimpan.

CORS mengizinkan frontend lokal pada port 3000 dan 5173. Untuk alamat lain, atur `CORS_ORIGINS` di `.env` sebagai daftar origin yang dipisahkan koma.

Contoh body `POST /predict`:

```json
{
  "reading_id": "R000000",
  "features": {
    "temperature_c": 60.1,
    "vibration_mm_s": 0.19,
    "pressure_kpa": 135.2,
    "motor_rpm": 2111.3,
    "flow_rate_lpm": 27.3,
    "power_consumption_kw": 34.2,
    "coolant_temp_c": 25.3,
    "acoustic_level_db": 67.1,
    "oil_viscosity_cst": 75.3,
    "humidity_pct": 53.5,
    "ambient_temp_c": 22.0,
    "equipment_age_hours": 2240.6,
    "hours_since_maintenance": 0.0
  }
}
```

Nilai sensor boleh `null`; pipeline model mengisi nilai kosong dengan median. `/model/evaluation` mengevaluasi pada dataset yang tersedia dan bukan pengganti evaluasi held-out/test set.

Jalankan pemeriksaan EDA terminal dengan `python cek_dataset.py`. Untuk mengulang preprocessing, training, dan evaluasi Muti jalankan `python ml_pipeline.py`; hasilnya disimpan sebagai `data_cleaned.csv`, `senseforge_muti_random_forest.joblib`, dan `model_evaluation.json`.

Evaluasi Muti menggunakan data training 70%, validation 10%, dan test kronologis 20%. Pada test, hasil terakhir: precision anomali 0.827, recall 0.213, F1 anomali 0.338, dan ROC-AUC 0.680. Recall yang masih rendah perlu diperhatikan; threshold dipilih hanya dari validation, bukan test. Model baseline teman memakai fitur/tujuan berbeda dan dilaporkan terpisah.

## Upi: MongoDB Analytics Benchmark

Pipeline di `analytics.py` mengurutkan dokumen dengan index `reading_id`, membatasi jumlah dokumen, lalu mengelompokkan data berdasarkan `equipment_id` dan `operating_mode`. Pipeline menghitung jumlah pembacaan/anomali, anomaly rate, dan rata-rata lima sensor. Endpoint `GET /analytics/equipment` menjalankan ringkasan ini pada koleksi MongoDB.

Jalankan benchmark read-only dengan:

```powershell
python benchmark_aggregation.py --repeats 5
```

Default benchmark memakai 100, 1.000, 5.000, 10.000, dan seluruh dokumen koleksi; ukurannya otomatis dibatasi oleh jumlah data yang tersedia. Satu warm-up dilakukan per ukuran. Waktu pemrosesan adalah rata-rata waktu dinding dari request aggregate hingga cursor selesai dibaca; latency dilaporkan sebagai p50/p95 dari pengulangan yang diukur; throughput adalah dokumen terproses dibagi waktu rata-rata. Hasil disimpan di `aggregation_benchmark.json` dan `aggregation_benchmark.csv`.