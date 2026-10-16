import { useNavigate } from "react-router-dom";
import { Card, ClinicalNote, PageHeading, PrimaryButton, Screen, SecondaryButton, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

export default function DiLuarCakupan() {
  const navigate = useNavigate();

  return (
    <Screen>
      <TopBar tall />

      <main className="flex flex-1 flex-col gap-6 px-[17.6px] pb-28 pt-9">
        <PageHeading eyebrow="Di luar cakupan prototipe" title="Skrining ini belum sesuai untuk kondisi Anda">
          Prototipe ini ditujukan untuk orang dewasa tanpa kondisi khusus. Anda tetap dapat mencari bantuan medis.
        </PageHeading>

        <Card className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-11 place-items-center rounded-[12.8px] border border-[rgba(100,221,218,0.18)] bg-[rgba(100,221,218,0.09)]">
            <img src={ICON.info} alt="" className="size-5" />
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
