# SenseForge
### Monitor. Analyze. Optimize.

**SenseForge** adalah aplikasi web untuk mendeteksi anomali pada mesin industri berdasarkan data multisensor menggunakan Machine Learning, serta mengelola dan menganalisis data sensor dalam jumlah besar menggunakan Big Data Analytics.

Aplikasi ini dikembangkan oleh **Kelompok 2** sebagai proyek Big Data 2 dengan mengintegrasikan pemrosesan data, deteksi anomali, penyimpanan berbasis MongoDB, dan visualisasi hasil analisis dalam satu dashboard.

---

## 📌 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Tujuan](#-tujuan)
- [Fitur Utama](#-fitur-utama)
- [Parameter Sensor](#-parameter-sensor)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Struktur Proyek](#-struktur-proyek)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Instalasi dan Konfigurasi](#-instalasi-dan-konfigurasi)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Pengujian dan Evaluasi](#-pengujian-dan-evaluasi)
- [Deployment](#-deployment)
- [Keamanan](#-keamanan)
- [Tim Pengembang](#-tim-pengembang)
- [Status Proyek](#-status-proyek)

---

## 📖 Tentang Proyek

Mesin industri menghasilkan data sensor yang dapat digunakan untuk memahami kondisi operasionalnya. Perubahan pola suhu, getaran, daya listrik, dan kebisingan dapat menjadi indikasi adanya kondisi yang tidak biasa.

SenseForge dirancang untuk membantu pengguna mengolah data sensor, mengidentifikasi data yang terindikasi anomali, serta memahami pola dan ringkasan data melalui dashboard.

Sistem memanfaatkan dua pendekatan utama:

- **Machine Learning:** mempelajari pola data sensor dan menghasilkan deteksi anomali berdasarkan model yang digunakan.
- **Big Data Analytics:** mendukung pengelolaan, agregasi, dan pemrosesan data dalam jumlah besar serta evaluasi performa pipeline.

Data yang digunakan berasal dari dataset yang tersedia untuk penelitian atau pengujian. Sistem tidak mengklaim melakukan pemantauan sensor fisik secara langsung kecuali integrasi perangkat tersebut benar-benar diterapkan.

## 🎯 Tujuan

1. Mengembangkan aplikasi web untuk mendeteksi anomali berdasarkan data sensor mesin industri.
2. Mengintegrasikan Machine Learning dengan aplikasi pengolahan data berbasis Python.
3. Memanfaatkan MongoDB untuk menyimpan dan mengakses data sensor serta hasil analisis.
4. Menerapkan Big Data Analytics untuk mengolah, merangkum, dan mengevaluasi pemrosesan data.
5. Menyajikan tren sensor, riwayat data, hasil deteksi, dan informasi performa melalui dashboard.
6. Mengevaluasi kemampuan sistem berdasarkan hasil pengujian yang terukur.

## ✨ Fitur Utama

### 1. Dashboard Monitoring

Menampilkan ringkasan kondisi data sensor, statistik operasional, tren sensor, dan informasi anomali berdasarkan data yang tersedia.

### 2. Pengelolaan Data Sensor

Mendukung proses pengambilan, penyimpanan, dan pengolahan dataset sesuai fitur impor yang diimplementasikan pada aplikasi.

### 3. Deteksi Anomali dengan Machine Learning

Memproses fitur sensor menggunakan model Machine Learning yang telah dilatih untuk mengidentifikasi data yang terindikasi normal atau anomali.

### 4. Visualisasi Data Sensor

Menampilkan tren dan perubahan parameter sensor agar pola data lebih mudah dianalisis.

### 5. Histori dan Hasil Deteksi

Menyajikan data historis dan hasil deteksi anomali sesuai data yang telah diproses dan disimpan.

### 6. Big Data Analytics

Mendukung agregasi dan analisis data dalam jumlah besar, termasuk pengukuran waktu pemrosesan, latensi query, throughput, atau metrik lain yang benar-benar diimplementasikan dan diuji.

> Ketersediaan setiap fitur mengikuti implementasi aktual pada repository SenseForge.

## 📊 Parameter Sensor

SenseForge menggunakan empat parameter sensor utama:

| Parameter | Keterangan |
|---|---|
| Temperature | Menggambarkan kondisi suhu mesin |
| Vibration | Menggambarkan tingkat getaran mesin |
| Power | Menggambarkan penggunaan daya listrik mesin |
| Noise / Acoustic | Menggambarkan tingkat kebisingan atau karakteristik suara mesin |

Satuan, rentang nilai, dan ketersediaan setiap parameter mengikuti dataset yang digunakan. Nama kolom dan satuan harus dipastikan melalui dokumentasi dataset sebelum data diproses.

## 🛠️ Teknologi yang Digunakan

| Teknologi | Peran |
|---|---|
| Next.js | Pengembangan frontend dan dashboard web |
| React | Pengembangan komponen antarmuka |
| TypeScript / JavaScript | Pengembangan logika frontend sesuai implementasi |
| Python | Pemrosesan data dan pengembangan backend |
| FastAPI | Penyedia layanan REST API |
| MongoDB Atlas | Penyimpanan data berbasis dokumen di cloud |
| Pandas / NumPy | Pengolahan data, jika digunakan |
| Scikit-learn | Pengembangan atau inferensi model Machine Learning, jika digunakan |
| Joblib | Penyimpanan dan pemuatan model, jika digunakan |
| Git & GitHub | Version control dan kolaborasi pengembangan |
| Vercel | Target deployment frontend Next.js |

## 🏗️ Arsitektur Sistem

Secara umum, alur sistem dirancang sebagai berikut:

1. Dataset sensor disiapkan dan divalidasi.
2. Backend menerima data dan melakukan pemrosesan sesuai pipeline.
3. MongoDB digunakan untuk menyimpan serta mengambil data.
4. Model Machine Learning menganalisis pola sensor dan menghasilkan deteksi anomali.
5. Big Data Analytics menjalankan agregasi serta pengujian performa pemrosesan.
6. Backend menyediakan hasil melalui API.
7. Frontend Next.js mengambil dan menyajikan hasil dalam dashboard.

```text
Dataset Sensor
      |
      v
Backend Python / FastAPI
      |
      +------> MongoDB Atlas
      |
      +------> Machine Learning
      |          |
      |          v
      |      Hasil Anomali
      |
      +------> Big Data Analytics
                 |
                 v
           Hasil Agregasi
           dan Benchmark
                 |
                 v
              REST API
                 |
                 v
          Next.js Dashboard
```

Diagram tersebut menggambarkan alur konseptual. Detail pemanggilan modul mengikuti implementasi aktual di dalam kode.

## 📁 Struktur Proyek

Struktur berikut merupakan gambaran umum berdasarkan susunan repository. Sesuaikan nama file dan folder dengan struktur yang benar-benar tersedia.

```text
Web/
├── app/                    # Halaman dan routing Next.js
├── backend/                # Backend Python / FastAPI
│   ├── main.py             # Contoh entry point, sesuaikan
│   ├── requirements.txt    # Contoh dependensi backend
│   └── ...                 # Model, routes, services, analytics
├── components/             # Komponen antarmuka
├── lib/                    # Utilitas dan helper
├── public/                 # Aset statis
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

## 💻 Persyaratan Sistem

Pastikan perangkat pengembangan memiliki:

- Node.js versi yang kompatibel dengan proyek Next.js.
- npm atau package manager yang sesuai.
- Python versi yang kompatibel dengan dependensi backend.
- Git dan GitHub Desktop untuk pengelolaan repository.
- Akun MongoDB Atlas serta database yang sudah dikonfigurasi.
- Browser modern untuk mengakses aplikasi.

Versi perangkat lunak yang digunakan sebaiknya disesuaikan dengan konfigurasi proyek dan dependensi yang sudah diuji.

## ⚙️ Instalasi dan Konfigurasi

### 1. Clone Repository

```bash
git clone <URL_REPOSITORY_GITHUB>
cd Web
```

Ganti `<URL_REPOSITORY_GITHUB>` dengan URL repository SenseForge yang sebenarnya.

Jika repository sudah tersedia di komputer, langkah clone tidak perlu dilakukan lagi.

### 2. Instalasi Frontend

Dari direktori root proyek:

```bash
npm install
```

### 3. Konfigurasi Environment Frontend

Buat file `.env.local` di root proyek sesuai variabel yang dibaca oleh kode frontend.

Contoh:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

URL tersebut digunakan untuk pengembangan lokal jika FastAPI berjalan pada port 8000. Untuk deployment, gunakan URL backend yang sebenarnya.

Jangan menaruh kredensial MongoDB atau secret backend ke dalam variabel `NEXT_PUBLIC_*`.

### 4. Instalasi Backend Python

Masuk ke direktori backend:

```bash
cd backend
```

Jika proyek menyediakan `requirements.txt`, buat virtual environment:

```bash
python -m venv .venv
```

Aktifkan virtual environment di Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Kemudian instal dependensi:

```bash
pip install -r requirements.txt
```

Jika proyek menggunakan `pyproject.toml` atau mekanisme dependensi lain, ikuti konfigurasi yang tersedia di repository.

### 5. Konfigurasi MongoDB Atlas

Buat file environment backend sesuai lokasi dan mekanisme konfigurasi yang digunakan oleh aplikasi.

Contoh variabel:

```env
MONGODB_URI=<MONGODB_ATLAS_CONNECTION_STRING>
MONGODB_DATABASE=senseforge
```

Nama variabel di atas hanya contoh. Gunakan nama yang sesuai dengan kode backend.

Pastikan koneksi database, autentikasi, dan izin jaringan sudah dikonfigurasi dengan benar. Jangan commit file environment atau membagikan connection string yang berisi kredensial.

## ▶️ Menjalankan Aplikasi

Jalankan backend dan frontend pada dua terminal terpisah.

### Backend FastAPI

Dari direktori backend, jika file utama bernama `main.py` dan objek FastAPI bernama `app`:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Jika entry point berbeda, sesuaikan perintah dengan struktur proyek.

Dokumentasi API FastAPI biasanya tersedia pada:

```text
http://127.0.0.1:8000/docs
```

### Frontend Next.js

Dari direktori root proyek:

```bash
npm run dev
```

Kemudian buka:

```text
http://localhost:3000
```

Pastikan backend berjalan sebelum menguji fitur frontend yang membutuhkan API.

## 🧪 Pengujian dan Evaluasi

Pengujian dilakukan sesuai fitur yang tersedia dalam aplikasi, mencakup:

### Pengujian Fungsional

- Memastikan frontend dapat dibuka.
- Memastikan API dapat menerima dan mengembalikan data.
- Memastikan koneksi MongoDB berfungsi.
- Memastikan pipeline Machine Learning menerima fitur yang sesuai.
- Memastikan hasil deteksi dapat ditampilkan.
- Memastikan agregasi dan visualisasi menghasilkan data yang konsisten.

### Evaluasi Machine Learning

Gunakan metrik evaluasi yang sesuai dengan model dan ketersediaan label, misalnya precision, recall, F1-score, atau metrik lain yang relevan.

Nilai evaluasi harus dicantumkan berdasarkan hasil eksperimen aktual, bukan angka perkiraan.

### Evaluasi Big Data

Pengujian dapat mencakup:

- Waktu pemrosesan pada beberapa ukuran dataset.
- Latensi query database.
- Throughput pemrosesan.
- Penggunaan sumber daya jika diukur.
- Perbandingan performa berdasarkan konfigurasi pengujian.

Catat ukuran dataset, perangkat atau lingkungan pengujian, konfigurasi, dan metode pengukuran agar hasilnya dapat direproduksi.

## 🚀 Deployment

Frontend Next.js ditargetkan untuk deployment melalui Vercel. Backend FastAPI dan MongoDB Atlas perlu dikonfigurasi agar dapat diakses secara online.

Sebelum deployment:

1. Pastikan frontend berhasil dibangun.
2. Pastikan backend dapat dijalankan tanpa error.
3. Pastikan model ML dan seluruh dependensi yang diperlukan tersedia di lingkungan deployment.
4. Atur environment variables melalui pengaturan hosting.
5. Pastikan koneksi database dan izin jaringan benar.
6. Hubungkan URL API production ke frontend.
7. Uji seluruh alur aplikasi setelah deployment.

URL aplikasi dan status deployment akan ditambahkan setelah deployment berhasil dilakukan.

## 🔐 Keamanan

- Jangan mengunggah `.env`, `.env.local`, password, token, atau kredensial database ke repository.
- Gunakan environment variables untuk konfigurasi sensitif.
- Batasi akses MongoDB Atlas sesuai kebutuhan.
- Validasi input yang diterima API.
- Jangan mengekspos secret backend melalui frontend.
- Gunakan data dan dependensi yang sumbernya jelas serta sesuai ketentuan penggunaannya.

## 👥 Tim Pengembang — Kelompok 2

SenseForge dikembangkan oleh **Kelompok 2** sebagai proyek Big Data 2. Tim terdiri dari lima anggota dengan pembagian tanggung jawab pada backend dan database, Machine Learning, Big Data Analytics, frontend dashboard, serta integrasi dan deployment.

| No. | Nama Anggota | Tanggung Jawab |
|---|---|---|
| 1 | **Radithya Ahmad Farid** | Backend & Database |
| 2 | **Salman Al Parizi** | Data Processing & Machine Learning |
| 3 | **Chesya Kinanti** | Frontend & Dashboard |
| 4 | **Luthfia Khaira Rizenda** | Big Data Analytics |
| 5 | **Mutia Nur Khalifa** | Integrasi Akhir & Deployment |

### Pembagian Tugas

- **Radithya Ahmad Farid — Backend & Database:** menyiapkan struktur MongoDB, mengimpor dataset, dan mengembangkan API.
- **Salman Al Parizi — Data Processing & Machine Learning:** melakukan preprocessing, membangun model deteksi anomali, serta mengevaluasi hasil prediksi.
- **Chesya Kinanti — Frontend & Dashboard:** mengembangkan antarmuka SenseForge, visualisasi parameter sensor, histori data, dan tampilan hasil deteksi anomali.
- **Luthfia Khaira Rizenda — Big Data Analytics:** mengembangkan pipeline agregasi, menguji pemrosesan pada berbagai ukuran dataset, dan mengevaluasi performa sistem.
- **Mutia Nur Khalifa — Integrasi Akhir & Deployment:** menghubungkan seluruh modul, melakukan pengujian end-to-end, memperbaiki masalah integrasi, dan menyiapkan deployment aplikasi.

## 📌 Status Proyek

**Status:** Tahap integrasi akhir dan deployment.

Dokumentasi ini akan diperbarui mengikuti perkembangan implementasi, hasil pengujian, dan alamat deployment resmi.

---

Dikembangkan oleh **Kelompok 2 — SenseForge** sebagai proyek **Big Data 2**.

**Monitor. Analyze. Optimize.**
