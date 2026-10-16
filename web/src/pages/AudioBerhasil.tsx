import { useNavigate } from "react-router-dom";
import { Card, ClinicalNote, PageHeading, PrimaryButton, Screen, StepHeader } from "../components/ui";
import { ICON } from "../components/icons";

const hasil = [
  { label: "Durasi", nilai: "Cukup" },
  { label: "Kebisingan", nilai: "Rendah" },
  { label: "Clipping", nilai: "Tidak terdeteksi" },
];

export default function AudioBerhasil() {
  const navigate = useNavigate();

  return (
    <Screen>
      <StepHeader label="Analisis awal" step={4} total={4} />

      <main className="flex flex-1 flex-col gap-5 px-[17.6px] pb-28 pt-9">
        <PageHeading eyebrow="Hasil pemeriksaan audio" title="Rekaman selesai diperiksa" />

        <Card className="flex flex-col gap-3 pt-3">
          <span className="w-fit rounded-full border border-[rgba(94,225,171,0.24)] bg-[rgba(94,225,171,0.1)] px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-[#30785f]">
            Layak dianalisis
          </span>
          {hasil.map((item) => (
            <div key={item.label} className="flex justify-between border-t border-line pt-3 text-base">
              <span className="text-muted">{item.label}</span>
              <span className="font-bold text-ink">{item.nilai}</span>
            </div>
          ))}
        </Card>

        <div className="flex items-start gap-4 rounded-[20px] border border-[rgba(70,130,180,0.17)] bg-gradient-to-br from-white to-sky/20 p-4 shadow-[0_10px_28px_rgba(70,130,180,0.08)]">
          <span className="grid size-16 shrink-0 place-items-center rounded-full border border-[rgba(100,221,218,0.2)] bg-[rgba(100,221,218,0.08)]">
            <img src={ICON.sound} alt="" className="size-7.5" />
          </span>
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-extrabold uppercase tracking-[1.5px] text-steel">Pola suara terdeteksi</p>
            <h2 className="font-hand text-[21.6px] font-bold text-ink">Mengi (wheeze)</h2>
            <p className="text-base leading-[26px] text-muted">
              Ini hasil pola suara, bukan diagnosis. Hasil tetap digabung dengan gejala Anda.
            </p>
          </div>
        </div>

        <PrimaryButton onClick={() => navigate("/hasil/konsultasi")}>Lihat hasil analisis awal</PrimaryButton>

        <ClinicalNote />
      </main>
    </Screen>
  );
}
