import { useNavigate } from "react-router-dom";
import { Card, ClinicalNote, PrimaryButton, Screen, SecondaryButton, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

export default function DiLuarCakupan() {
  const navigate = useNavigate();

  return (
    <Screen>
      <TopBar back tall />

      <main className="flex flex-1 flex-col gap-6 px-[17.6px] pb-28 pt-9">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-extrabold uppercase tracking-[1.5px] text-steel">Di luar cakupan prototipe</p>
          <h1 className="font-serif text-[31.2px] font-bold italic leading-[34.9px] tracking-[-1.1px] text-ink">
            Skrining ini belum sesuai untuk kondisi Anda
          </h1>
          <p className="text-base leading-[26px] text-muted">
            Prototipe ini ditujukan untuk orang dewasa tanpa kondisi khusus. Anda tetap dapat mencari bantuan medis.
          </p>
        </div>

        <Card className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-11 place-items-center rounded-[12.8px] border border-[rgba(100,221,218,0.18)] bg-[rgba(100,221,218,0.09)]">
            <img src={ICON.infoCircle} alt="" className="size-5" />
          </span>
          <h2 className="font-hand text-lg font-bold text-ink">Penilaian yang disesuaikan diperlukan</h2>
          <p className="text-base leading-[26px] text-muted">
            Model dewasa tidak dijalankan untuk anak, ibu hamil, atau kondisi khusus.
          </p>
        </Card>

        <div className="flex flex-col gap-3.5">
          <PrimaryButton onClick={() => navigate("/darurat")}>Cara mencari bantuan</PrimaryButton>
          <SecondaryButton onClick={() => navigate("/beranda")}>Kembali ke beranda</SecondaryButton>
        </div>

        <ClinicalNote />
      </main>
    </Screen>
  );
}
