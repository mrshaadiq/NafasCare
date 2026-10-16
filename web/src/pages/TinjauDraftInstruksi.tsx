import { useNavigate } from "react-router-dom";
import { BottomNav, Card, ClinicalNote, ctaFill, GhostButton, PageHeading, PrimaryButton, Screen, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

type Status = "terbaca" | "ambigu";

const draf: { nama: string; dosis: string; frekuensi: string; durasi: string; status: Status }[] = [
  { nama: "Obat A", dosis: "1 tablet", frekuensi: "2 kali sehari", durasi: "5 hari", status: "terbaca" },
  {
    nama: "Obat B",
    dosis: "Tidak tersedia",
    frekuensi: "Jika perlu",
    durasi: "Tidak tersedia",
    status: "ambigu",
  },
];

export default function TinjauDraftInstruksi() {
  const navigate = useNavigate();

  return (
    <Screen>
      <TopBar />

      <main className="flex flex-1 flex-col gap-4 px-[17.6px] pb-32 pt-6">
        <PageHeading eyebrow="Tinjau sebelum diaktifkan" title="Periksa draf jadwal Anda">
          Bandingkan setiap baris dengan instruksi dokter atau apoteker yang Anda miliki.
        </PageHeading>

        <div className="mt-5 flex flex-col gap-4">
          {draf.map((item) => {
            const ambigu = item.status === "ambigu";
            return (
              <Card
                key={item.nama}
                className={`flex flex-col gap-3 ${ambigu ? "border-[rgba(165,100,23,0.28)] bg-[#fff4d8]" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[12.8px] text-muted">Nama obat</span>
                    <span className="font-hand text-lg font-bold text-ink">{item.nama}</span>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] ${
                      ambigu
                        ? "border-[rgba(243,195,99,0.24)] bg-[rgba(243,195,99,0.1)] text-[#a56417]"
                        : "border-[rgba(94,225,171,0.24)] bg-[rgba(94,225,171,0.1)] text-[#30785f]"
                    }`}
                  >
                    {ambigu ? "Ambigu" : "Terbaca"}
                  </span>
                </div>
                <dl className="flex flex-col">
                  {[
                    ["Dosis", item.dosis],
                    ["Frekuensi", item.frekuensi],
                    ["Durasi", item.durasi],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-t border-line py-2.5 text-base">
                      <dt className="text-muted">{label}</dt>
                      <dd className="text-right font-bold text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-[12.8px] text-muted">Sumber: ketikan manual</p>
                {ambigu && (
                  <p className="text-base font-bold leading-[26px] text-[#a56417]">
                    Konfirmasi ke dokter atau apoteker sebelum diaktifkan.
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5">
          <PrimaryButton onClick={() => navigate("/jadwal")}>Aktifkan hanya yang sudah jelas</PrimaryButton>
          <button
            type="button"
            onClick={() => navigate("/instruksi/salin")}
            className={`flex w-full items-center justify-center rounded-[14.4px] px-4 py-3.5 text-base font-bold ${ctaFill}`}
          >
            Edit draf
          </button>
        </div>

        <p className="text-[12.8px] leading-[21px] text-muted">
          Pemeriksaan Anda bukan pengesahan medis atas instruksi yang ambigu.
        </p>

        <ClinicalNote />
      </main>

      <BottomNav />
    </Screen>
  );
}
