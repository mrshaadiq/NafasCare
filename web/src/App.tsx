import { Link, Route, Routes } from "react-router-dom";
import Opening from "./pages/Opening";
import Dashboard from "./pages/Dashboard";
import Persetujuan from "./pages/Persetujuan";
import PersetujuanDitolak from "./pages/PersetujuanDitolak";
import KeluhanDurasi from "./pages/KeluhanDurasi";
import PemeriksaanTandaBahaya from "./pages/PemeriksaanTandaBahaya";
import ArahanDarurat from "./pages/ArahanDarurat";
import RiwayatDanInformasiTambahan from "./pages/RiwayatDanInformasiTambahan";
import AnalisisAudio from "./pages/AnalisisAudio";
import AudioBerhasil from "./pages/AudioBerhasil";
import AudioGagal from "./pages/AudioGagal";
import HasilPerluKonsultasi from "./pages/HasilPerluKonsultasi";
import HasilPemantauan from "./pages/HasilPemantauan";
import BelumDapatDinilai from "./pages/BelumDapatDinilai";
import DiLuarCakupan from "./pages/DiLuarCakupan";
import PilihanTindakLanjut from "./pages/PilihanTindakLanjut";
import CatatGejala from "./pages/CatatGejala";
import SalinInstruksiPerawatan from "./pages/SalinInstruksiPerawatan";
import TinjauDraftInstruksi from "./pages/TinjauDraftInstruksi";
import JadwalHariIni from "./pages/JadwalHariIni";
import PantauPerkembangan from "./pages/PantauPerkembangan";
import RingkasanKonsultasi from "./pages/RingkasanKonsultasi";
import Pengaturan from "./pages/Pengaturan";
import KonfirmasiHapusData from "./pages/KonfirmasiHapusData";

/** Rute mengikuti urutan alur di artboard Figma (node 0:1). */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Opening />} />
      <Route path="/beranda" element={<Dashboard />} />
      <Route path="/persetujuan" element={<Persetujuan />} />
      <Route path="/persetujuan/ditolak" element={<PersetujuanDitolak />} />
      <Route path="/keluhan" element={<KeluhanDurasi />} />
      <Route path="/tanda-bahaya" element={<PemeriksaanTandaBahaya />} />
      <Route path="/darurat" element={<ArahanDarurat />} />
      <Route path="/riwayat" element={<RiwayatDanInformasiTambahan />} />
      <Route path="/audio" element={<AnalisisAudio />} />
      <Route path="/audio/berhasil" element={<AudioBerhasil />} />
      <Route path="/audio/gagal" element={<AudioGagal />} />
      <Route path="/hasil/konsultasi" element={<HasilPerluKonsultasi />} />
      <Route path="/hasil/pemantauan" element={<HasilPemantauan />} />
      <Route path="/hasil/belum-dinilai" element={<BelumDapatDinilai />} />
      <Route path="/hasil/di-luar-cakupan" element={<DiLuarCakupan />} />
      <Route path="/tindak-lanjut" element={<PilihanTindakLanjut />} />
      <Route path="/catat-gejala" element={<CatatGejala />} />
      <Route path="/instruksi/salin" element={<SalinInstruksiPerawatan />} />
      <Route path="/instruksi/tinjau" element={<TinjauDraftInstruksi />} />
      <Route path="/jadwal" element={<JadwalHariIni />} />
      <Route path="/pantau" element={<PantauPerkembangan />} />
      <Route path="/ringkasan" element={<RingkasanKonsultasi />} />
      <Route path="/pengaturan" element={<Pengaturan />} />
      <Route path="/pengaturan/hapus-data" element={<KonfirmasiHapusData />} />
      <Route
        path="*"
        element={
          <main className="mx-auto flex min-h-dvh max-w-[400px] flex-col items-center justify-center gap-4 bg-cream p-6 text-center">
            <p className="text-base text-muted">Halaman tidak ditemukan.</p>
            <Link to="/" className="font-bold text-steel">
              Kembali ke awal
            </Link>
          </main>
        }
      />
    </Routes>
  );
}
