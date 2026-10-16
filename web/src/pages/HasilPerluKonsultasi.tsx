import { useNavigate } from "react-router-dom";
import { BottomNav, Card, ClinicalNote, PageHeading, PrimaryButton, Screen, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

export default function HasilPerluKonsultasi() {
  const navigate = useNavigate();

  return (
    <Screen>
      <TopBar />

      <main className="flex flex-1 flex-col gap-4 px-[17.6px] pb-32 pt-6">
        <PageHeading eyebrow="Hasil analisis awal" title="Sebaiknya periksakan ke tenaga medis">
          Dibuat 16 Oktober 2026 dari jawaban yang Anda berikan.
        </PageHeading>

        <Card className="mt-5 flex flex-col gap-4">
          <span className="w-fit rounded-full border border-[rgba(243,195,99,0.24)] bg-[rgba(243,195,99,0.1)] px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-[#a56417]">
            Perlu konsultasi
          </span>
          <p className="font-serif text-2xl font-bold italic leading-8 text-ink">
            Atur konsultasi dengan tenaga medis secepatnya.
          </p>
          <PrimaryButton onClick={() => navigate("/ringkasan")}>Simpan ringkasan konsultasi</PrimaryButton>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <img src={ICON.listCheck} alt="" className="size-5" />
            <h2 className="font-hand text-lg font-bold text-ink">Alasan</h2>
          </div>
          <div className="flex flex-col gap-1 border-l-2 border-steel pl-3 text-base leading-[26px] text-muted">
            <p>Keluhan: sesak</p>
            <p>Durasi: 3 hari</p>
          </div>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <img src={ICON.warningOutline} alt="" className="size-5" />
            <h2 className="font-hand text-lg font-bold text-ink">Informasi yang belum tersedia</h2>
          </div>
          <p className="text-base leading-[26px] text-muted">
            Pemeriksaan langsung, rekam medis lengkap, dan penilaian tenaga medis belum tersedia.
          </p>
        </Card>

        <Card className="flex flex-col gap-2">
          <h2 className="font-hand text-lg font-bold text-ink">Keterbatasan hasil</h2>
          <p className="text-base leading-[26px] text-muted">
            Hasil ini bukan diagnosis. Audio hanya informasi tambahan dan data berasal dari laporan Anda.
          </p>
        </Card>

        <Card className="flex flex-col gap-2">
          <h2 className="font-hand text-lg font-bold text-ink">
            Kondisi yang membuat Anda perlu segera mencari bantuan
          </h2>
          <p className="text-base leading-[26px] text-muted">
            Sesak berat saat istirahat, sulit berbicara satu kalimat, bibir kebiruan, nyeri dada hebat, atau kesadaran
            menurun.
          </p>
        </Card>

        <p className="text-base text-steel underline">Lihat sumber aturan: NC-SIM-1.0 (simulasi)</p>

        <ClinicalNote />
      </main>

      <BottomNav />
    </Screen>
  );
}
