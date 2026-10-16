import { useNavigate } from "react-router-dom";
import { BottomNav, Card, EmptyState, PageHeading, PrimaryButton, Screen, SecondaryButton, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

const ringkasan = [
  { label: "Catatan gejala", nilai: "0", sumber: "Laporan pengguna · Belum tersedia" },
  { label: "Jadwal aktif", nilai: "0", sumber: "Instruksi dikonfirmasi pengguna" },
  { label: "Dilaporkan diminum", nilai: "0", sumber: "Laporan pengguna · 16 Oktober 2026" },
];

export default function PantauPerkembangan() {
  const navigate = useNavigate();

  return (
    <Screen>
      <TopBar />

      <main className="flex flex-1 flex-col gap-5 px-[17.6px] pb-32 pt-6">
        <PageHeading eyebrow="Perkembangan" title="Pantau perubahan dari waktu ke waktu">
          Setiap angka menampilkan sumber dan tanggalnya.
        </PageHeading>

        <PrimaryButton className="w-fit px-6" onClick={() => navigate("/tanda-bahaya")}>
          Periksa ulang kondisi
        </PrimaryButton>

        <div className="flex flex-col gap-3">
          {ringkasan.map((item) => (
            <Card key={item.label} className="flex flex-col gap-1">
              <p className="text-[12.8px] text-muted">{item.label}</p>
              <p className="text-[33.6px] font-bold leading-[50px] text-ink">{item.nilai}</p>
              <p className="text-[12.8px] text-muted">{item.sumber}</p>
            </Card>
          ))}
        </div>

        <Card className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <span className="w-fit rounded-full border border-[rgba(70,130,180,0.28)] bg-sky/25 px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-deep">
                Eksperimen
              </span>
              <h2 className="font-hand text-lg font-bold text-ink">Grafik tingkat keluhan</h2>
            </div>
            <p className="text-base text-ink">Laporan pengguna</p>
          </div>
          <EmptyState title="Grafik belum tersedia">
            Tambahkan sedikitnya satu catatan gejala untuk melihat perkembangan.
          </EmptyState>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img src={ICON.calendar} alt="" className="size-5" />
            <h2 className="font-hand text-lg font-bold text-ink">Garis waktu</h2>
          </div>
          <EmptyState title="Belum ada catatan">Mulai dengan check-in singkat.</EmptyState>
          <SecondaryButton onClick={() => navigate("/catat-gejala")}>Catat gejala</SecondaryButton>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <img src={ICON.pulse} alt="" className="size-5" />
            <h2 className="font-hand text-lg font-bold text-ink">Pengingat dan evaluasi ulang</h2>
          </div>
          <p className="text-base leading-[26px] text-muted">
            Bila keluhan memburuk, lakukan pemeriksaan ulang sekarang tanpa menunggu check-in berikutnya.
          </p>
          <PrimaryButton onClick={() => navigate("/tanda-bahaya")}>Periksa ulang kondisi</PrimaryButton>
          <button type="button" onClick={() => navigate("/jadwal")} className="py-2 text-base font-bold text-steel">
            Lihat semua reminder
          </button>
        </Card>
      </main>

      <BottomNav />
    </Screen>
  );
}
