import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, ClinicalNote, PageHeading, PrimaryButton, Screen, StepHeader } from "../components/ui";
import { ICON } from "../components/icons";

const pertanyaan = [
  "Sesak berat saat istirahat?",
  "Tidak mampu berbicara satu kalimat?",
  "Bibir tampak kebiruan?",
  "Nyeri dada hebat?",
  "Kesadaran menurun atau sangat bingung?",
];

type Jawaban = boolean | null;

export default function PemeriksaanTandaBahaya() {
  const navigate = useNavigate();
  const [jawaban, setJawaban] = useState<Jawaban[]>(pertanyaan.map(() => null));

  const jawab = (index: number, nilai: boolean) => {
    // "Ya" langsung membuka arahan darurat tanpa menunggu analisis lain.
    if (nilai) {
      navigate("/darurat", { state: { alasan: [(pertanyaan[index] ?? "").replace("?", "")] } });
      return;
    }
    setJawaban((prev) => prev.map((v, i) => (i === index ? nilai : v)));
  };

  const semuaTerjawab = jawaban.every((v) => v !== null);

  return (
    <Screen>
      <StepHeader label="Analisis awal" step={2} total={4} />

      <main className="flex flex-1 flex-col gap-6 px-[17.6px] pb-28 pt-9">
        <PageHeading eyebrow="Pemeriksaan prioritas" title="Periksa tanda bahaya">
          Jawab satu per satu. Jawaban “Ya” akan langsung membuka arahan darurat tanpa menunggu analisis lain.
        </PageHeading>

        <div className="flex gap-3 rounded-2xl border border-[rgba(255,107,107,0.32)] bg-[rgba(255,107,107,0.08)] p-4">
          <img src={ICON.warning} alt="" className="mt-0.5 size-5 shrink-0" />
          <div className="flex flex-col gap-1.5">
            <p className="text-base font-bold text-[#ff9292]">Jangan menunda bila kondisi memburuk</p>
            <p className="text-base leading-[26px] text-muted">
              Pemeriksaan ini diproses lebih dulu dan tidak menggunakan audio.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {pertanyaan.map((teks, index) => (
            <Card key={teks} className="flex flex-col gap-3.5">
              <p className="text-base font-bold text-ink">{teks}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Tidak", value: false },
                  { label: "Ya", value: true },
                ].map((opsi) => (
                  <button
                    key={opsi.label}
                    type="button"
                    aria-pressed={jawaban[index] === opsi.value}
                    onClick={() => jawab(index, opsi.value)}
                    className={`min-h-11 rounded-[11.2px] border text-base ${
                      jawaban[index] === opsi.value ? "border-steel bg-mist font-bold text-ink" : "border-line bg-paper text-ink"
                    }`}
                  >
                    {opsi.label}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <PrimaryButton disabled={!semuaTerjawab} onClick={() => navigate("/riwayat")}>
          Lanjut
        </PrimaryButton>

        <ClinicalNote />
      </main>
    </Screen>
  );
}
