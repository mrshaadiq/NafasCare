# NapasCare: Rincian Pengerjaan (Backend First)

Dokumen ini menjabarkan rencana dari `NAPASCARE_PROJECT_2026-10-11.md` (bagian 12, 13, 18, 19) dengan urutan backend didahulukan. Semua data tetap sintetis dan diberi label demo.

## Prinsip

- Tidak ada data pasien nyata di endpoint maupun database selama hackathon.
- Setiap hasil skrining, hasil audio, dan jadwal obat ditandai `mode: "simulasi"`.
- Aturan triase ditandai `status: "draf-belum-ditinjau"`.
- Jadwal obat dibuat tidak aktif sampai pengguna memeriksanya.
- Hasil yang gagal tidak pernah ditampilkan sebagai "aman" atau "tersimpan".

## Peran (tim empat orang)

| Peran | Fokus |
|---|---|
| Data/API | Hono, kontrak API, tabel, aturan triase, hak akses |
| Frontend/UX | Form, hasil, riwayat, jadwal, ringkasan, responsif |
| AI dan evaluasi | Manifest dataset, eksperimen audio offline (terpisah) |
| Produk dan klinis | Kebutuhan, materi, aturan yang ditinjau, pitch |

## Hari 1: Fondasi API (Data/API, dibantu Produk)

1. Inisialisasi proyek Workers + Hono + TypeScript dengan `wrangler`.
2. Definisikan skema tabel dari bagian 13: `screenings`, `symptom_answers`, `triage_results`, `consents`, `care_instructions`, `medication_schedules`, `medication_events`, `check_ins`, `summaries`, `share_grants`, `audit_events`.
3. Tentukan penyimpanan sementara untuk demo (misalnya D1 atau memori dengan seed sintetis). Pilihan final database belum diputuskan (bagian 12.1).
4. Endpoint skrining: `POST /screenings`, `PATCH /screenings/:id/answers`, `POST /screenings/:id/complete`, `GET /screenings/:id/result`.
5. Validasi input dengan Zod agar kontrak sama dengan frontend.
6. Versi aturan dicatat di setiap `triage_results` (`protocol_version`).
7. Keluaran hari 1: endpoint skrining bisa diuji dengan `curl` atau Vitest.

Pemeriksaan akhir hari 1: `POST` lalu `GET` mengembalikan hasil sintetis dengan `mode: "simulasi"`.

## Hari 2: Aturan, catatan, dan jadwal (Data/API, dengan Produk)

1. Aturan tanda bahaya sebagai fungsi murni yang bisa diuji. Tanda bahaya diperiksa sebelum audio dan sebelum LLM apa pun (bagian 7.5, FR-04).
2. Setiap hasil memuat `missing_fields` dan `reasons`. Nilai kosong tidak diisi dengan asumsi (FR-05).
3. Status hasil: `perlu-pertolongan-segera`, `perlu-konsultasi`, `pemantauan`, `belum-dapat-dinilai`.
4. Endpoint instruksi: `POST /care-instructions`, `PATCH /care-instructions/:id`, `POST /care-instructions/:id/confirm`.
5. Endpoint jadwal: `POST /medication-schedules` (status awal `tidak-aktif`), `PATCH /medication-schedules/:id` untuk ubah, jeda, atau hentikan.
6. Endpoint catatan: `POST /medication-events/:id/report` dengan status `diminum`, `dilewati`, atau `belum-dicatat` (FR-13).
7. Endpoint `POST /check-ins` dan `GET /summaries/:id` (ringkasan hanya dari catatan yang ada).
8. Hak akses: setiap endpoint memeriksa kepemilikan objek, bukan hanya login. Untuk demo, identitas ditentukan header sintetis.
9. Audit minimal (`audit_events`) tanpa data klinis mentah di log (NFR).

Pemeriksaan akhir hari 2: uji skenario bagian 19 untuk tanda bahaya, jadwal ambigu, dan akses objek milik orang lain.

## Hari 3: Integrasi frontend (Frontend/UX, dengan Data/API)

1. Kontrak tipe dibagikan dari paket bersama (`shared/types`) agar frontend dan API tidak berbeda.
2. Form skrining (React Hook Form + Zod) memanggil `POST` dan `PATCH`. Form tidak kehilangan data saat gagal (NFR).
3. Halaman hasil membaca `GET /screenings/:id/result` dan menampilkan status beserta alasan dan informasi kurang.
4. Riwayat dan monitoring (Recharts) membaca `check-ins` dan `medication-events` dari API.
5. Status proses (memuat, gagal, selesai) terlihat di setiap layar.
6. Data demo diberi label visual "SIMULASI".

Pemeriksaan akhir hari 3: alur skrining dari form sampai hasil berjalan end-to-end di browser lokal.

## Hari 4: Reminder, ringkasan, dan demo (Frontend/UX, Produk, AI)

1. Halaman instruksi: draf dari input manual, sumber terlihat, bagian ambigu ditandai, tombol "periksa" sebelum aktif.
2. Reminder: aktif, edit, jeda, hentikan. Jadwal selalu tampil di aplikasi (notifikasi bukan satu-satunya tempat).
3. Ringkasan konsultasi dengan preview sebelum unduh atau bagikan (FR-14).
4. Responsif untuk ponsel dan desktop, empty state, dan error state.
5. AI: sampel audio riset (bukan mikrofon HP) hanya sebagai contoh berlabel, atau mock yang jelas.
6. Produk: periksa label, daftar klaim, dan sumber materi edukasi (FR-17).
7. Rekam video demo, siapkan deck, dan rapikan README cara menjalankan.

## Pengujian yang wajib lolos sebelum demo

| Skenario (bagian 19) | Cara uji |
|---|---|
| Tanda bahaya memunculkan arahan sebelum audio | Unit test aturan |
| Gejala darurat tidak diturunkan oleh hasil audio | Unit test aturan |
| Jadwal ambigu tidak aktif | Uji endpoint jadwal |
| Pengguna lain tidak bisa membuka objek | Uji endpoint dengan identitas berbeda |
| Akses berbagi yang dicabut tidak lagi berfungsi | Uji endpoint ringkasan |
| Notifikasi gagal, jadwal tetap terlihat | Uji manual UI |
| Layanan AI gagal, jalur manual tetap ada | Uji dengan layanan dimatikan |

## Definition of Done (bagian 19.1)

- Alur skrining sampai pendampingan bisa didemonstrasikan.
- Data demo diberi label, tidak ada data pribadi di repositori.
- Cara menjalankan tercantum di README.
- Keterbatasan (perangkat, performa model, belum ada validasi klinis) terlihat di aplikasi dan deck.
- Dokumen tidak mengklaim validasi klinis atau kemitraan yang belum ada.

## Risiko khusus backend-first

- Keputusan batas data belum final. Gunakan hanya data sintetis sampai ada keputusan tertulis.
- Waktu empat hari ketat. Jika hari 2 tertinggal, pertahankan endpoint skrining dan hasil, lalu tunda jadwal dan ringkasan.
- Cloudflare Workers punya batas CPU dan memori (bagian 12.2). Model PyTorch tidak dijalankan di Worker.
- Lisensi dan manifest dataset audio tetap ditangani tim AI secara terpisah.

## Pertanyaan terbuka yang perlu dijawab

1. Database demo: D1 atau memori dengan seed?
2. Siapa yang meninjau aturan triase versi 1 (tenaga medis atau dosen pembimbing)?
3. Batas usia dewasa dan daftar pengecualian tetap mengikuti bagian 4.4?
