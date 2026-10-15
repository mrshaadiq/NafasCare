# NapasCare: Rincian Pengerjaan (Backend First)

Dokumen ini menjabarkan rencana dari `NAPASCARE_PROJECT_2026-10-11.md` (bagian 12, 13, 18, 19) dengan urutan backend didahulukan. Semua data tetap sintetis dan diberi label demo.

Revisi 12 Oktober 2026: status pengerjaan, keputusan database, dan perbaikan hasil review ditambahkan. Dokumen ini menggantikan urutan P0/P1 dan bagian 10.2 di dokumen induk untuk hal yang disebut di bagian "Keputusan".

## Keputusan

| Keputusan | Isi | Alasan |
|---|---|---|
| Backend-first | Backend dikerjakan sebelum frontend, memakai kontrak Zod di `shared/types` | Frontend dapat memakai kontrak yang sama dan mock dari skema yang sama |
| Database demo | **Cloudflare D1** (SQLite lokal lewat `wrangler dev`) | Penyimpanan memori per isolate hilang tanpa pemberitahuan sehingga "tersimpan" bisa palsu |
| Urutan triase | Tanda bahaya → cakupan dewasa → data kurang → konsultasi/pemantauan | Tanda bahaya berlaku untuk siapa pun, termasuk anak atau usia kosong (FR-04, bagian 7.5). Menggantikan urutan bagian 10.2 |
| Audio | Sampel riset ICBHI (disetujui tim). API hanya mengembalikan **pola dari anotasi dataset**, bukan prediksi model. Audio bukan input aturan triase. File `.wav` tidak masuk repo | Hasil audio tidak boleh menurunkan arahan segera; redistribusi dataset belum terverifikasi |
| Peninjau aturan | **Belum ada.** Aturan tetap `draf-belum-ditinjau`; deck menulis jujur | Tidak mengklaim peninjauan klinis |
| Deploy | **Publik** (Pages + Worker + D1 remote) dengan banner SIMULASI; cadangan lokal untuk Grand Final | Juri menilai dari jauh dan final dinilai langsung |
| Instruksi dikonfirmasi | Tidak bisa diubah; buat instruksi baru | Jadwal yang sudah berjalan tidak berubah diam-diam |

## Prinsip

- Tidak ada data pasien nyata di endpoint maupun database selama hackathon.
- Setiap hasil skrining, jadwal, dan ringkasan ditandai `mode: "simulasi"`.
- Aturan triase ditandai `rule_status: "draf-belum-ditinjau"`.
- Jadwal obat dibuat `tidak-aktif` dan hanya aktif lewat tindakan pengguna.
- Hasil yang gagal tidak pernah tampil sebagai "aman" atau "tersimpan" (kegagalan D1 → 500).
- Objek milik pengguna lain dijawab 404, bukan 403.

## Status pengerjaan

| Bagian | Status | Bukti |
|---|---|---|
| Skrining: `POST /screenings`, `PATCH .../answers`, `POST .../complete`, `GET .../result` | Selesai | Tes + uji D1 lokal |
| Persetujuan: `POST /consents`; `complete` ditolak 403 tanpa persetujuan | Selesai | Tes |
| Aturan triase murni + 4 status + `missing_fields` + `reasons` | Selesai | 9 tes |
| Validasi jawaban per pertanyaan (tipe, rentang, kunci asing ditolak) | Selesai | Tes |
| `complete` kedua kali → 409, hasil lama tidak ditimpa | Selesai | Tes |
| CORS untuk frontend lokal (header `X-Demo-User` diizinkan) | Selesai | Tes preflight |
| D1: migrasi 0001 (skrining, hasil, persetujuan) dan 0002 (perawatan) | Selesai | `wrangler d1 migrations apply --local` |
| Instruksi: `POST`, `GET`, `PATCH`, `POST :id/confirm`; tanda ambigu | Selesai | Tes |
| Jadwal: `POST` (tidak-aktif), `PATCH` (aktif/jeda/hentikan/ubah jam), `GET`, `GET :id/events` | Selesai | Tes + uji D1 lokal |
| Kejadian obat: ID deterministik, tanpa duplikat, `POST /medication-events/:id/report` | Selesai | Tes + uji D1 lokal |
| Check-in: `POST /check-ins`, `GET /check-ins` | Selesai | Tes |
| Ringkasan: `POST /summaries`, `GET /summaries/:id` (template) | Selesai | Tes + uji D1 lokal |
| Audio: `GET /audio-samples`, `POST /screenings/:id/audio`, `GET /screenings/:id/audio`; satu sampel ditolak oleh ambang laju sampel demo | Selesai | Tes + uji D1 lokal |
| Audio: eksperimen model offline (`ml/`): baseline MFCC+SVM dan CNN log-mel, split pasien. `AudioResult.model` + `model_version` diisi dari manifest (`ml/predict_manifest.py`), terpisah dari `pattern` anotasi; tidak dipakai aturan triase; sampel ditolak tidak dinilai | Selesai | CNN macro-F1 0,43 (SVM 0,35) pada 25 pasien uji, split acak; 41 tes lolos, `tsc` api dan web bersih |
| Berbagi ringkasan, audit penuh, penghapusan data | Ditunda (P2) | Tidak dikerjakan |
| Frontend (`web/`): React + Vite + Tailwind + React Router. Layar: persetujuan → skrining → hasil + sampel audio; instruksi → periksa → jadwal (aktif/jeda/hentikan) + laporan minum; catatan harian; ringkasan | Scaffold dan semua layar selesai; `tsc` dan `vite build` lolos. **Belum diuji di browser.** | Perlu uji manual dan tangkapan layar untuk deck |

Total: 40 tes otomatis lolos, `tsc --noEmit` bersih. Tes memakai repo memori; jalur D1 diverifikasi manual dengan `wrangler dev` dan `curl`, belum ada tes otomatis untuk `D1Repository`.

## Aturan bisnis yang diterapkan

- **Ambigu**: instruksi wajib memuat nama obat, dosis, satuan, frekuensi per hari, dan durasi. Kolom kosong menghasilkan `kosong:<kolom>`; `bila_perlu: true` menghasilkan `bila_perlu`. Instruksi ambigu boleh dikonfirmasi, tetapi jadwalnya ditolak 422 `instruction_ambiguous`. Sistem tidak menebak durasi atau tanggal akhir.
- **Jadwal**: jumlah jam harus sama dengan frekuensi per hari. Zona waktu dibatasi WIB, WITA, WIT (tanpa DST, offset tetap). Perubahan jam, tanggal mulai, atau zona menaikkan `version`.
- **Kejadian**: dibangkitkan hanya untuk waktu yang belum lewat saat jadwal `aktif`. ID = `schedule_id:YYYY-MM-DDTHH:MM`. Ubah jadwal, jeda, atau hentikan menghapus kejadian mendatang yang belum dilaporkan; kejadian yang sudah dilaporkan atau sudah lewat tetap ada.
- **Laporan**: `user_report` `null` berarti belum dicatat dan tidak pernah dihitung `dilewati`.
- **Hentikan**: status terminal; setiap perubahan setelahnya 409.
- **Ringkasan**: hanya dari check-in, instruksi, dan kejadian yang ada; memuat sumber dan catatan bahwa isinya bukan penilaian klinis.

## Sisa pekerjaan (urut prioritas)

1. **Frontend** (Frontend/UX): scaffold React + Vite, memakai `shared/types` dan header `X-Demo-User`. Layar minimum: skrining → hasil, instruksi → jadwal, catatan, ringkasan. Label "SIMULASI" di setiap layar.
2. **Tes otomatis untuk `D1Repository`** (Data/API): jalankan suite yang sama terhadap D1 lokal (Miniflare/`@cloudflare/vitest-pool-workers`) agar tidak hanya diuji manual.
3. **Berkas aturan sebagai data** (Produk + klinis): pindahkan `DANGER_SIGNS`, `REQUIRED_FIELDS`, ambang 14 hari ke `protocol/v0-draft.json` agar peninjau dapat membaca tanpa membuka kode. Tunggu keputusan peninjau.
4. **Persiapan deploy publik** (Data/API + Frontend): `wrangler d1 create napascare` lalu isi `database_id`, terapkan migrasi dengan `--remote`, deploy Worker, deploy frontend ke Pages, batasi CORS ke domain Pages. Banner SIMULASI dan peringatan "jangan isi data pribadi" di setiap layar. Pertimbangkan batas laju (Workers rate limiting) karena endpoint publik tanpa autentikasi. D1 gratis: 5 juta baris dibaca dan 100 ribu baris ditulis per hari.
5. **Audio (lanjutan, opsional)**: jika baseline MFCC+SVM selesai, tambahkan `model_version` dan metrik per kelas di deck. Tanpa itu, deck menyebut hasil audio sebagai anotasi dataset. Isi manifest dibuat ulang dengan `python tools/build_audio_manifest.py <folder ICBHI>`.
6. **README**: cara menjalankan (`npm install`, `wrangler d1 migrations apply napascare --local`, `npm run dev`, `npm test`).
7. Video, deck, perbaikan hasil uji pengguna.

## Garis potong

Jika waktu habis, pertahankan: skrining + hasil + frontend + instruksi/jadwal. Tunda: berbagi, audit penuh, penghapusan data, audio sungguhan. Jangan menambah fitur baru pada hari terakhir.

## Pengujian yang wajib lolos sebelum demo

| Skenario (bagian 19) | Cara uji | Status |
|---|---|---|
| Tanda bahaya memunculkan arahan sebelum audio | Unit test aturan | Lolos |
| Gejala darurat tidak diturunkan oleh hasil audio | Unit test aturan | Lolos |
| Anak atau usia kosong dengan tanda bahaya tetap arahan segera | Unit test aturan | Lolos |
| Anak tanpa tanda bahaya tidak mendapat skor | Unit test aturan | Lolos |
| Nilai tidak valid tidak berubah menjadi hasil rendah | Unit test + uji endpoint | Lolos |
| Jadwal ambigu atau "bila perlu" tidak aktif | Uji endpoint | Lolos |
| Dokumen tanpa durasi tidak ditebak | Uji endpoint | Lolos |
| Jadwal diubah, kejadian tidak ganda | Uji endpoint | Lolos |
| Belum melapor tidak dihitung dilewati | Uji endpoint + ringkasan | Lolos |
| Pengguna lain tidak bisa membuka objek | Uji endpoint, dua identitas | Lolos |
| Persetujuan wajib sebelum hasil | Uji endpoint | Lolos |
| Database gagal tidak menampilkan tersimpan | Uji repo gagal → 500 | Lolos |
| Akses berbagi yang dicabut tidak lagi berfungsi | Belum ada endpoint berbagi | Ditunda |
| Notifikasi gagal, jadwal tetap terlihat | Uji manual UI | Menunggu frontend |
| Layanan AI gagal, jalur manual tetap ada | Uji dengan layanan dimatikan | Menunggu audio/OCR |

## Definition of Done (bagian 19.1)

- Alur skrining sampai pendampingan bisa didemonstrasikan.
- Data demo diberi label, tidak ada data pribadi di repositori.
- Cara menjalankan tercantum di README.
- Keterbatasan (perangkat, performa model, belum ada validasi klinis) terlihat di aplikasi dan deck.
- Dokumen tidak mengklaim validasi klinis atau kemitraan yang belum ada.

## Risiko

- **Frontend belum ada** dan tenggat 15–16 Oktober. Mulai scaffold sekarang, jangan menunggu backend selesai sempurna.
- Aturan triase belum ditinjau; isinya placeholder. Jangan dipakai sebagai layanan publik.
- API tanpa autentikasi nyata (`X-Demo-User` bukan autentikasi). Jangan deploy publik tanpa banner simulasi dan larangan input data pribadi.
- Bidang `notes` pada check-in adalah teks bebas; UI harus memperingatkan agar tidak mengisi data pribadi.
- Cloudflare Workers punya batas CPU dan memori (bagian 12.2). Model PyTorch tidak dijalankan di Worker.
- Lisensi dan manifest dataset audio tetap ditangani tim AI secara terpisah.

## Pertanyaan terbuka

1. Siapa yang meninjau aturan triase versi 1 (tenaga medis atau dosen pembimbing)? Belum ada; cari sebelum Grand Final 1 November.
2. Batas usia dewasa dan daftar pengecualian tetap mengikuti bagian 4.4? Folder ICBHI lokal tidak memuat berkas demografi, jadi usia subjek sampel tidak dapat dinyatakan.
3. Ke panitia (Technical Meeting 12 Oktober): apakah 15–16 Oktober satu tenggat (batas 23.50 WIB tanggal 16), dan apakah repo wajib publik serta video boleh *unlisted*?
4. Lisensi redistribusi ICBHI: belum terverifikasi; jangan commit `.wav`.
