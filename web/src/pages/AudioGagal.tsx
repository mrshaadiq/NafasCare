import { useNavigate } from "react-router-dom";
import { ClinicalNote, PageHeading, PrimaryButton, Screen, SecondaryButton, StepHeader } from "../components/ui";
import { ICON } from "../components/icons";

export default function AudioGagal() {
  const navigate = useNavigate();

  return (
    <Screen>
      <StepHeader label="Analisis awal" step={4} total={4} />

      <main className="flex flex-1 flex-col gap-5 px-[17.6px] pb-28 pt-9">
        <PageHeading eyebrow="Hasil pemeriksaan audio" title="Kualitas rekaman perlu diperbaiki" />

        <div className="flex gap-3 rounded-2xl border border-[rgba(243,195,99,0.28)] bg-[#fff4d8] p-5">
          <img src={ICON.warningAmber} alt="" className="mt-0.5 size-5 shrink-0" />
          <div className="flex flex-col gap-2">
            <p className="text-base font-bold text-[#a56417]">Rekaman belum dapat dinilai</p>
            <p className="font-hand text-lg font-bold text-[#a56417]">Terlalu banyak kebisingan</p>
            <p className="text-base leading-[26px] text-muted">Alur skrining tetap bisa dilanjutkan tanpa audio.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <PrimaryButton onClick={() => navigate("/audio")}>Rekam ulang</PrimaryButton>
          <SecondaryButton onClick={() => navigate("/hasil/konsultasi")}>Lanjut tanpa audio</SecondaryButton>
        </div>

        <ClinicalNote />
      </main>
    </Screen>
  );
}
