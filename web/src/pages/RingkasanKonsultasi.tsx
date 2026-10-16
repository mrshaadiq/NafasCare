import { Brand, BottomNav, Card, ClinicalNote, PageHeading, Screen, SecondaryButton, PrimaryButton, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

const bagian = [
  {
    no: "01",
    judul: "Laporan pengguna",
    isi: [
      { label: "Keluhan awal", nilai: "Tidak tersedia" },
      { label: "Catatan terbaru", nilai: "Tidak tersedia" },
    ],
    sumber: "Sumber: laporan pengguna · 16 Oktober 2026",
  },
  {
    no: "02",
    judul: "Hasil model atau aturan",
    isi: [],
    teks: "Belum tersedia.",
    sumber: "Aturan simulasi NC-SIM-1.0",
  },
  {
    no: "03",
    judul: "Instruksi dokter",
    isi: [],
    teks: "Belum tersedia atau belum dikonfirmasi pengguna.",
    sumber: "Sumber: input manual pengguna · 16 Oktober 2026",
  },
];

export default function RingkasanKonsultasi() {
  const bagikan = () => {
    if (navigator.share) {
      void navigator.share({ title: "Ringkasan konsultasi", text: "Ringkasan konsultasi NapasCare (simulasi)." });
    }
  };

  return (
    <Screen>
      <TopBar />

      <main className="flex flex-1 flex-col gap-4 px-[17.6px] pb-32 pt-6">
        <PageHeading eyebrow="Preview sebelum berbagi" title="Ringkasan konsultasi">
          Dibuat 16 Oktober 2026 · Hanya memuat data yang tersedia
        </PageHeading>

        <span className="w-fit rounded-full border border-[rgba(70,130,180,0.28)] bg-sky/25 px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-deep">
          Data demonstrasi
        </span>

        <Card className="overflow-hidden p-0 shadow-[0_10px_28px_rgba(70,130,180,0.08)]">
          <div className="flex items-center justify-between gap-4 bg-sky/20 p-6">
            <Brand />
            <div className="text-right">
              <p className="text-base font-bold text-ink">Ringkasan konsultasi</p>
              <p className="text-xs text-muted">Periode sampai 16 Oktober 2026</p>
            </div>
          </div>

          {bagian.map((item) => (
            <section key={item.no} className="grid grid-cols-[40px_1fr] gap-3 border-t border-line p-5.5">
              <p className="text-xs font-extrabold tracking-[1.2px] text-[#5d7893]">{item.no}</p>
              <div className="flex flex-col gap-2">
                <h2 className="font-hand text-lg font-bold text-ink">{item.judul}</h2>
                {item.isi.map((baris) => (
                  <div key={baris.label} className="flex flex-col">
                    <p className="text-xs text-muted">{baris.label}</p>
                    <p className="text-base font-bold text-ink">{baris.nilai}</p>
                  </div>
                ))}
                {item.teks && <p className="text-base text-muted">{item.teks}</p>}
                <p className="text-[12.8px] leading-5 text-muted">{item.sumber}</p>
              </div>
            </section>
          ))}

          <p className="bg-[rgba(243,195,99,0.06)] px-5.5 py-4 text-xs leading-[18px] text-[#a56417]">
            Teks klinis ini adalah contoh simulasi dan perlu ditinjau tenaga medis sebelum penggunaan nyata.
          </p>
        </Card>

        <div className="flex flex-col gap-2.5">
          <PrimaryButton trailing={ICON.download} onClick={() => window.print()}>
            Unduh ringkasan
          </PrimaryButton>
          <SecondaryButton onClick={bagikan}>
            <img src={ICON.share} alt="" className="size-5" />
            Bagikan
          </SecondaryButton>
        </div>

        <ClinicalNote />
      </main>

      <BottomNav />
    </Screen>
  );
}
