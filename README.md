# NapasCare

> Nama kerja. Nama dan merek final belum ditetapkan.

NapasCare adalah prototipe aplikasi kesehatan untuk membantu pengguna melakukan **analisis awal atas keluhan pernapasan**, memahami langkah tindak lanjut, dan mencatat perkembangan kondisi. Setelah konsultasi, pengguna dapat memasukkan instruksi dokter untuk membuat pengingat obat dan ringkasan perawatan.

Proyek ini dibuat untuk JOINTS UGM 2026.

> **Batas penggunaan.** Seluruh data di repo ini bersifat sintetis dan berlabel demo. Aplikasi ini bukan alat diagnosis dan tidak menggantikan pemeriksaan tenaga medis. Aturan triase belum ditinjau secara klinis. Jangan memasukkan data pribadi atau informasi kesehatan nyata.

Dokumen perancangan lengkap ada di [NAPASCARE_PROJECT_2026-10-11.md](NAPASCARE_PROJECT_2026-10-11.md), dan rincian pengerjaan backend di [RINCIAN_PENGERJAAN_BACKEND_FIRST.md](RINCIAN_PENGERJAAN_BACKEND_FIRST.md).

## Fitur

- **Persetujuan dan tanda bahaya.** Pengguna memberi persetujuan, lalu diperiksa tanda bahaya sebelum alur lain. Tanda bahaya berlaku untuk semua pengguna.
- **Skrining keluhan.** Jawaban terstruktur tentang gejala, durasi, dan riwayat.
- **Hasil tindak lanjut.** Keluaran berupa konsultasi, pemantauan, data belum cukup, atau di luar cakupan.
- **Analisis audio (eksperimen).** Pola suara pernapasan dari sampel riset ICBHI. Hasil audio tidak menentukan arahan triase.
- **Instruksi dokter dan jadwal obat.** Draf instruksi ditinjau pengguna, lalu dikonfirmasi. Instruksi yang sudah dikonfirmasi tidak berubah diam-diam.
- **Pemantauan dan ringkasan.** Catatan harian, riwayat konsultasi, dan ringkasan yang hanya dapat dilihat pemiliknya.

## Struktur repo

```
api/        Cloudflare Worker (Hono) + D1 (SQLite), tes dengan Vitest
web/        Frontend React + Vite + Tailwind CSS + React Router
shared/     Kontrak tipe dan skema Zod yang dipakai API dan web
ml/         Skrip training dan prediksi audio (Python, PyTorch, offline)
tools/      Skrip pembangkit manifest audio demo
```

## Prasyarat

- Node.js (LTS) dan npm dengan dukungan workspaces
- Python hanya jika ingin menjalankan `ml/` atau `tools/`

## Menjalankan secara lokal

Pasang dependensi dari root repo:

```bash
npm install
```

**1. Backend (API)**

Terapkan migrasi ke D1 lokal, lalu jalankan Worker:

```bash
cd api
npx wrangler d1 migrations apply napascare --local
npm run dev
```

API berjalan di `http://127.0.0.1:8787`. Setiap request wajib membawa header `X-Demo-User` sebagai identitas sintetis.

**2. Frontend (web)**

Di terminal terpisah:

```bash
cd web
npm run dev
```

Buka `http://localhost:5173`. Alamat API dapat diubah dengan variabel `VITE_API_URL` (default `http://127.0.0.1:8787`).

## Perintah

| Lokasi | Perintah | Fungsi |
|---|---|---|
| `api/` | `npm run dev` | Menjalankan Worker lokal dengan `wrangler dev` |
| `api/` | `npm test` | Menjalankan tes API (Vitest) |
| `api/` | `npm run typecheck` | Pemeriksaan tipe API |
| `web/` | `npm run dev` | Menjalankan frontend dengan Vite |
| `web/` | `npm run build` | Pemeriksaan tipe lalu build produksi ke `web/dist` |
| `web/` | `npm run typecheck` | Pemeriksaan tipe frontend |

## Database

Penyimpanan demo memakai **Cloudflare D1**. Skema ada di `api/migrations/`:

- `0001_init.sql`: skrining, hasil, dan persetujuan
- `0002_care.sql`: instruksi perawatan, jadwal obat, dan catatan
- `0003_audio.sql`: data sampel audio

Untuk deploy publik, buat database dengan `wrangler d1 create napascare`, lalu isi `database_id` di `api/wrangler.toml`. Jangan memakai `database_id` placeholder untuk deploy remote.

## Audio

- Sampel berasal dari dataset ICBHI. File `.wav` tidak disertakan di repo.
- `tools/build_audio_manifest.py` membangun manifest sampel dari folder dataset.
- `ml/train_baseline.py` dan `ml/train_cnn.py` melatih model secara offline.
- `ml/predict_manifest.py` menambahkan keluaran model ke sampel demo.

```bash
python ml/train_baseline.py "<folder ICBHI_final_database>"
python ml/predict_manifest.py "<folder ICBHI_final_database>" --model cnn
```

Model PyTorch tidak dijalankan di Worker. API hanya membaca hasil yang sudah disimpan.

## Pengujian

```bash
cd api && npm test
cd web && npm run build
```

Tes API memakai repositori dalam memori. Jalur D1 diverifikasi manual dengan `wrangler dev` dan belum memiliki tes otomatis.

## Status

Prototipe untuk demo. Belum ada peninjauan klinis, kemitraan layanan kesehatan, autentikasi pengguna, atau izin produk. Lihat bagian risiko dan keputusan terbuka di dokumen perancangan.
