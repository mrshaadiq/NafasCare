import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav, Card, GhostButton, PageHeading, Screen, SecondaryButton, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

type Status = "belum" | "diminum" | "dilewati";

const jadwalAwal: { id: number; jam: string; obat: string; aturan: string; status: Status }[] = [
  { id: 1, jam: "08:00", obat: "Obat A", aturan: "1 tablet · setelah makan", status: "belum" },
  { id: 2, jam: "20:00", obat: "Obat A", aturan: "1 tablet · setelah makan", status: "belum" },
];

const labelStatus: Record<Status, string> = {
  belum: "Belum dicatat",
  diminum: "Diminum",
  dilewati: "Dilewati",
};

export default function JadwalHariIni() {
  const navigate = useNavigate();
  const [jadwal, setJadwal] = useState(jadwalAwal);

  const catat = (id: number, status: Status) =>
    setJadwal((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));

  return (
    <Screen>
      <TopBar />

      <main className="flex flex-1 flex-col gap-4 px-[17.6px] pb-32 pt-6">
        <PageHeading eyebrow="Jadwal dalam aplikasi" title="Jadwal hari ini">
          16 Oktober 2026 · Waktu lokal WIB
        </PageHeading>

        <SecondaryButton className="mt-5 w-fit px-6" onClick={() => navigate("/instruksi/salin")}>
          Tambah instruksi
        </SecondaryButton>

        <div className="flex gap-3 rounded-2xl border border-[rgba(77,159,255,0.25)] bg-[rgba(135,206,235,0.18)] p-4">
          <img src={ICON.info} alt="" className="mt-0.5 size-5 shrink-0" />
          <p className="text-base leading-[26px] text-muted">
            Jika notifikasi perangkat gagal, jadwal tetap tersedia di halaman ini.
          </p>
        </div>

        {jadwal.map((item) => (
          <Card key={item.id} className="flex gap-4">
            <div className="flex size-18 shrink-0 flex-col items-center justify-center rounded-2xl border border-[rgba(70,130,180,0.24)] bg-sky/25">
              <span className="text-xl font-bold text-ink">{item.jam}</span>
              <span className="text-[11.2px] text-muted">WIB</span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between">
                <span className="rounded-full border border-[rgba(94,225,171,0.24)] bg-[rgba(94,225,171,0.1)] px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-[#30785f]">
                  aktif
                </span>
                <button
                  type="button"
                  aria-label="Menu jadwal"
                  className="grid size-9 place-items-center rounded-full border border-line bg-white"
                >
                  <img src={ICON.more} alt="" className="size-5" />
                </button>
              </div>
              <h2 className="font-hand text-lg font-bold text-ink">{item.obat}</h2>
              <p className="text-base text-muted">{item.aturan}</p>
              <p className="text-[12.8px] text-muted">Status: {labelStatus[item.status]}</p>
              <div className="mt-1 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  aria-pressed={item.status === "diminum"}
                  onClick={() => catat(item.id, "diminum")}
                  className={`min-h-11 rounded-[10.4px] border text-[12px] ${
                    item.status === "diminum" ? "border-steel bg-mist font-bold text-ink" : "border-line bg-paper text-ink"
                  }`}
                >
                  Diminum
                </button>
                <button
                  type="button"
                  aria-pressed={item.status === "dilewati"}
                  onClick={() => catat(item.id, "dilewati")}
                  className={`min-h-11 rounded-[10.4px] border text-[12px] ${
                    item.status === "dilewati" ? "border-steel bg-mist font-bold text-ink" : "border-line bg-paper text-ink"
                  }`}
                >
                  Dilewati
                </button>
              </div>
            </div>
          </Card>
        ))}

        <p className="rounded-xl bg-white/50 p-4 text-[12.8px] leading-[21px] text-muted">
          Status Diminum adalah laporan Anda, bukan bukti kepatuhan. Jangan menggandakan dosis yang terlewat;
          konfirmasikan langkah berikutnya kepada dokter atau apoteker.
        </p>

        <GhostButton onClick={() => navigate("/instruksi/tinjau")}>Tinjau draf instruksi</GhostButton>
      </main>

      <BottomNav />
    </Screen>
  );
}
