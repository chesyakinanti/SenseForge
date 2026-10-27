# SenseForge — Frontend Preview

Dashboard **Smart CMMS** untuk pemantauan kondisi mesin dan deteksi anomali
multisensor. Versi ini adalah **frontend-only** dengan data demo; belum terhubung
ke MongoDB, FastAPI, atau model Machine Learning.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Root akan mengarah ke `/login`.

Build produksi:

```bash
npm run build
npm start
```

Cek TypeScript:

```bash
npm run typecheck
```

## Login demo

Halaman login hanya tampilan. Tidak ada autentikasi, validasi password, atau
pengiriman data ke server. Tombol **Masuk sebagai Demo** menyimpan flag di
`localStorage` lalu membuka dashboard.

## Halaman

| Route | Isi |
|---|---|
| `/login` | Halaman masuk demo |
| `/dashboard` | KPI sensor, tren, health armada, heatmap anomali, pipeline |
| `/machines` | Daftar mesin, filter, grid/list |
| `/machines/[id]` | Detail mesin + tab sensor, anomali, maintenance |
| `/sensors` | Eksplorasi histori sensor, tabel, export CSV |
| `/anomalies` | Daftar temuan, filter, drawer detail |
| `/maintenance` | Timeline perawatan + tambah catatan (sesi lokal) |
| `/processing` | Pipeline, kualitas data, benchmark |
| `/settings` | Tema, profil demo, konfigurasi API |

## Tema

- **Dark — Forge Console**: navy industri, teal, amber.
- **Light — Steel Lab**: cloud white, steel mist, navy.

Tema disimpan oleh `next-themes` dan mendukung preferensi sistem. Animasi
menghormati `prefers-reduced-motion`.

## Aset logo

Letakkan logo di:

```
public/Images/
├─ Logo full darkmode.png
├─ Logo full lightmode.png
├─ Logo darkmode.png
└─ Logo lightmode.png
```

File yang sekarang ada adalah salinan teroptimasi dari folder
`../Assets`. File asli tidak diubah. Nama file harus tetap sama agar kode
menemukannya. `app/icon.png` dipakai sebagai favicon.

## Data demo

- 8 mesin, histori sintetis deterministik, 12 anomali, log maintenance, dan
  benchmark contoh.
- Label **Data demo** ditampilkan di antarmuka.
- Skor anomali adalah indikasi model, bukan diagnosis kerusakan.
- Service layer ada di `lib/api.ts`; data dan generator di `lib/data.ts`.
- Untuk integrasi backend, ganti isi fungsi di `lib/api.ts` dengan `fetch` ke
  endpoint FastAPI. Komponen halaman tidak perlu diubah.

## Struktur

```
app/                 route Next.js App Router
components/          layout, UI, chart, domain
lib/                 tipe, data demo, API mock, hook, util
public/Images/       aset logo
```

## Catatan

- Belum ada autentikasi nyata, upload dataset, atau persistensi backend.
- Tambah maintenance dan perubahan status anomali hanya tersimpan selama sesi.
- Unit sensor mengikuti metadata demo dan perlu disesuaikan dengan dataset final.
