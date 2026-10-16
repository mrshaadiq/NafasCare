import { useNavigate } from "react-router-dom";
import { BottomNav, Card, ClinicalNote, PageHeading, PrimaryButton, Screen, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

export default function HasilPemantauan() {
  const navigate = useNavigate();

  return (
    <Screen>
      <TopBar />

      <main className="flex flex-1 flex-col gap-4 px-[17.6px] pb-32 pt-6">
        <PageHeading eyebrow="Hasil analisis awal" title="Catat perkembangan keluhan Anda">
          Dibuat 16 Oktober 2026 dari jawaban yang Anda berikan.
        </PageHeading>

        <Card className="mt-5 flex flex-col gap-4">
          <span className="w-fit rounded-full border border-[rgba(70,130,180,0.28)] bg-sky/25 px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-deep">
            Pemantauan
          </span>
          <p className="font-serif text-2xl font-bold italic leading-8 text-ink">
            Catat perubahan gejala dan periksa ulang bila keluhan memburuk.
          </p>
          <PrimaryButton onClick={() => navigate("/catat-gejala")}>Mulai catat gejala</PrimaryButton>
        </Card>

        <div className="grid gap-4">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img src={ICON.listCheck} alt="" className="size-5" />
              <h2 className="font-hand text-lg font-bold text-ink">Hal yang perlu dicatat</h2>
            </div>
            <div className="flex flex-col gap-1 border-l-2 border-steel pl-3 text-base leading-[26px] text-muted">
              <p>Perubahan batuk, sesak, atau mengi.</p>
              <p>Keluhan yang bertambah berat.</p>
              <p>Waktu dan pemicu yang Anda rasakan.</p>
            </div>
          </Card>

          <Card className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <img src={ICON.warningOutline} alt="" className="size-5" />
              <h2 className="font-hand text-lg font-bold text-ink">Kapan harus mencari bantuan</h2>
            </div>
            <p className="text-base leading-[26px] text-muted">
              Cari bantuan bila keluhan memburuk, muncul sesak berat, nyeri dada hebat, bibir kebiruan, atau kebingungan.
            </p>
          </Card>
        </div>

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
