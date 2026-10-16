import { useNavigate } from "react-router-dom";
import { BottomNav, Card, PageHeading, PrimaryButton, Screen, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

const pilihan = [
  { label: "Catat gejala", desc: "Tambahkan kondisi hari ini ke garis waktu.", icon: ICON.plus, to: "/catat-gejala" },
  {
    label: "Masukkan instruksi perawatan",
    desc: "Salin instruksi yang diberikan dokter atau apoteker.",
    icon: ICON.tag,
    to: "/instruksi/salin",
  },
  {
    label: "Ringkasan untuk konsultasi",
    desc: "Tinjau data yang tersedia sebelum dibawa.",
    icon: ICON.doc,
    to: "/ringkasan",
  },
];

export default function PilihanTindakLanjut() {
  const navigate = useNavigate();

  return (
    <Screen>
      <TopBar />

      <main className="flex flex-1 flex-col gap-6 px-[17.6px] pb-32 pt-6">
        <PageHeading eyebrow="Tindak lanjut" title="Apa yang ingin Anda lakukan?">
          Anda dapat kembali dan memilih langkah lain kapan saja.
        </PageHeading>

        <div className="flex flex-col gap-4">
          {pilihan.map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className="flex items-center gap-4 rounded-[20px] border border-[rgba(70,130,180,0.17)] bg-white p-4 text-left shadow-[0_10px_14px_rgba(70,130,180,0.08)]"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-[12.8px] border border-[rgba(100,221,218,0.18)] bg-[rgba(100,221,218,0.09)]">
                <img src={item.icon} alt="" className="size-5" />
              </span>
              <span className="flex flex-1 flex-col gap-2">
                <span className="font-hand text-lg font-bold text-ink">{item.label}</span>
                <span className="text-base leading-[26px] text-muted">{item.desc}</span>
              </span>
              <img src={ICON.chevron} alt="" className="size-5 shrink-0" />
            </button>
          ))}
        </div>

        <Card className="flex flex-col gap-4">
          <span className="w-fit rounded-full border border-[rgba(70,130,180,0.28)] bg-sky/25 px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-deep">
            Langkah selanjutnya
          </span>
          <div className="flex flex-col gap-2">
            <h2 className="font-hand text-lg font-bold text-ink">Semua catatan akan muncul di Pantau</h2>
            <p className="text-base leading-[26px] text-muted">
              Lihat perubahan gejala dan jadwal yang Anda laporkan dalam satu tempat.
            </p>
          </div>
          <PrimaryButton trailing={null} className="bg-mist text-ink shadow-none" onClick={() => navigate("/pantau")}>
            Buka Pantau
          </PrimaryButton>
        </Card>
      </main>

      <BottomNav />
    </Screen>
  );
}
