import { Link, useNavigate } from "react-router-dom";
import { BottomNav, Card, EmptyState, PageHeading, PrimaryButton, Screen, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

const shortcuts = [
  { label: "Catat gejala", icon: ICON.plus, to: "/catat-gejala" },
  { label: "Masukkan instruksi dokter", icon: ICON.tag, to: "/instruksi/salin" },
  { label: "Ringkasan konsultasi", icon: ICON.doc, to: "/ringkasan" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Screen>
      <TopBar />

      <main className="flex flex-1 flex-col gap-7 px-[17.6px] pb-32 pt-6">
        <section className="flex flex-col gap-4">
          <PageHeading eyebrow="Selamat datang" title="Apa yang ingin Anda lakukan hari ini?">
            Mulai dari keluhan saat ini atau lanjutkan catatan Anda.
          </PageHeading>
          <p className="flex items-center gap-2.5 text-[12.8px] text-muted">
            <img src={ICON.calendar} alt="" className="size-5" />
            {today}
          </p>
        </section>

        <Card className="flex flex-col gap-4">
          <div className="flex gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-[17.6px] bg-sky/25">
              <img src={ICON.pulse} alt="" className="size-[30px]" />
            </span>
            <div className="flex flex-col gap-2">
              <span className="w-fit rounded-full border border-[rgba(70,130,180,0.28)] bg-sky/25 px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-deep">
                Sekitar 3 menit
              </span>
              <h2 className="font-hand text-2xl font-bold text-ink">Mulai analisis awal</h2>
              <p className="text-base leading-[26px] text-muted">
                Jawab pertanyaan keluhan dan periksa tanda bahaya lebih dulu.
              </p>
            </div>
          </div>
          <PrimaryButton onClick={() => navigate("/persetujuan")}>Mulai skrining</PrimaryButton>
        </Card>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-hand text-lg font-bold italic text-ink">Jadwal hari ini</h2>
            <Link to="/jadwal" className="text-[12.8px] text-steel">
              Lihat semua
            </Link>
          </div>
          <EmptyState title="Belum ada jadwal aktif">
            Masukkan dan periksa instruksi untuk membuat reminder.
          </EmptyState>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-hand text-lg font-bold italic text-ink">Riwayat terakhir</h2>
          <EmptyState title="Belum ada hasil skrining">
            Hasil pertama Anda akan tampil di sini setelah alur selesai.
          </EmptyState>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-hand text-lg font-bold italic text-ink">Pintasan</h2>
          <div className="flex flex-col gap-2.5">
            {shortcuts.map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate(item.to)}
                className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-paper p-3 text-left"
              >
                <span className="grid size-10.5 shrink-0 place-items-center rounded-xl bg-sky/22">
                  <img src={item.icon} alt="" className="size-5" />
                </span>
                <span className="flex-1 text-base font-bold text-ink">{item.label}</span>
                <img src={ICON.chevron} alt="" className="size-5" />
              </button>
            ))}
          </div>
        </section>

        <footer className="mt-4 flex gap-3 border-t border-line pt-6">
          <img src={ICON.info} alt="" className="mt-0.5 h-5 w-3" />
          <div className="flex flex-col gap-1 text-xs leading-5 text-muted">
            <p className="font-bold">Tentang prototipe ini</p>
            <p>
              NapasCare tidak memberikan diagnosis. Bila Anda mengalami keluhan berat atau memburuk, cari pertolongan
              medis.
            </p>
          </div>
        </footer>
      </main>

      <BottomNav />
    </Screen>
  );
}
