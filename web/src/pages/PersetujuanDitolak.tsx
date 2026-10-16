import { useNavigate } from "react-router-dom";
import { ClinicalNote, PageHeading, PrimaryButton, Screen, SecondaryButton, TopBar, Card } from "../components/ui";
import { ICON } from "../components/icons";

export default function PersetujuanDitolak() {
  const navigate = useNavigate();

  return (
    <Screen>
      <TopBar tall />

      <main className="flex flex-1 flex-col gap-6 px-[17.6px] pb-28 pt-9">
        <PageHeading eyebrow="Persetujuan belum diberikan" title="Tanpa persetujuan, analisis tidak dapat dijalankan">
          Anda dapat membaca kembali cara data demonstrasi dipakai, atau keluar dari alur.
        </PageHeading>

        <Card className="flex flex-col items-center gap-4 p-4 text-center">
          <span className="grid size-11 place-items-center rounded-[12.8px] border border-[rgba(100,221,218,0.18)] bg-[rgba(100,221,218,0.09)]">
            <img src={ICON.shield} alt="" className="size-5" />
          </span>
          <h2 className="font-hand text-lg font-bold text-ink">Pilihan Anda tetap dihormati</h2>
          <p className="text-base leading-[26px] text-muted">
            Tidak ada analisis gejala atau audio yang dijalankan setelah Anda menolak.
          </p>
          <div className="flex w-full flex-col gap-3.5 pt-2">
            <PrimaryButton onClick={() => navigate("/persetujuan")}>Baca penjelasan lagi</PrimaryButton>
            <SecondaryButton onClick={() => navigate("/")}>Keluar</SecondaryButton>
          </div>
        </Card>

        <ClinicalNote />
      </main>
    </Screen>
  );
}
