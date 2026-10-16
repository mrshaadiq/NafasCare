import { useNavigate } from "react-router-dom";
import { BottomNav, Card, ClinicalNote, PageHeading, PrimaryButton, Screen, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

const kurang = ["Gejala utama", "Durasi keluhan", "Riwayat penyakit", "Pengobatan saat ini", "Pemicu yang diketahui"];

export default function BelumDapatDinilai() {
  const navigate = useNavigate();

  return (
    <Screen>
      <TopBar />

      <main className="flex flex-1 flex-col gap-4 px-[17.6px] pb-32 pt-6">
        <PageHeading eyebrow="Hasil analisis awal" title="Informasi belum cukup">
          Dibuat 16 Oktober 2026 dari jawaban yang Anda berikan.
        </PageHeading>

        <Card className="mt-5 flex flex-col gap-4">
          <span className="w-fit rounded-full border border-line bg-[rgba(112,128,144,0.1)] px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-[#596978]">
            Belum dapat dinilai
          </span>
          <p className="font-serif text-2xl font-bold italic leading-8 text-ink">
            Beberapa jawaban yang dibutuhkan belum tersedia.
          </p>
          <PrimaryButton onClick={() => navigate("/persetujuan")}>Lengkapi jawaban</PrimaryButton>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <img src={ICON.infoCircle} alt="" className="size-5" />
            <h2 className="font-hand text-lg font-bold text-ink">Yang masih kurang</h2>
          </div>
          <ul className="flex flex-col gap-1 text-base leading-[26px] text-muted">
            {kurang.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => navigate("/darurat")}
            className="py-2 text-left text-base font-bold text-[#2f7d32]"
          >
            Cari bantuan medis
          </button>
        </Card>

        <Card className="flex flex-col gap-2">
          <h2 className="font-hand text-lg font-bold text-ink">Keterbatasan hasil</h2>
          <p className="text-base leading-[26px] text-muted">
            Hasil ini bukan diagnosis. Audio hanya informasi tambahan dan data berasal dari laporan Anda.
          </p>
        </Card>

        <p className="text-base text-steel underline">Lihat sumber aturan: NC-SIM-1.0 (simulasi)</p>

        <ClinicalNote />
      </main>

      <BottomNav />
    </Screen>
  );
}
