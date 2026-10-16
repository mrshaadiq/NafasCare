import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClinicalNote, GhostButton, PageHeading, PrimaryButton, Screen, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

const items = [
  {
    icon: ICON.consent.dilakukan,
    title: "Yang dilakukan",
    body: "Mengolah jawaban keluhan, catatan gejala, audio opsional, dan instruksi yang Anda masukkan.",
  },
  {
    icon: ICON.consent.tidakDilakukan,
    title: "Yang tidak dilakukan",
    body: "Tidak mendiagnosis dan tidak menggantikan pemeriksaan atau saran tenaga medis.",
  },
  {
    icon: ICON.consent.dicatat,
    title: "Data yang dicatat",
    body: "Tujuan persetujuan, versi pemberitahuan NC-PRIV-1.0, dan waktu persetujuan.",
  },
];

export default function Persetujuan() {
  const navigate = useNavigate();
  const [setuju, setSetuju] = useState(false);

  return (
    <Screen>
      <TopBar back tall />

      <main className="flex flex-1 flex-col gap-6 px-[17.6px] pb-28 pt-9">
        <PageHeading eyebrow="Sebelum melanjutkan" title="Kendalikan data Anda">
          Baca batasan prototipe dan pilih apakah Anda bersedia melanjutkan.
        </PageHeading>

        <section className="rounded-[20px] border border-[rgba(70,130,180,0.17)] bg-white p-4 shadow-[0_10px_14px_rgba(70,130,180,0.08)]">
          {items.map((item, index) => (
            <div
              key={item.title}
              className={`flex gap-4 py-5.5 first:pt-0 last:pb-0 ${index < items.length - 1 ? "border-b border-line" : ""}`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-[12.8px] border border-[rgba(100,221,218,0.18)] bg-[rgba(100,221,218,0.09)]">
                <img src={item.icon} alt="" className="size-5" />
              </span>
              <div className="flex flex-col gap-2">
                <h2 className="font-hand text-lg font-bold text-ink">{item.title}</h2>
                <p className="text-base leading-[26px] text-muted">{item.body}</p>
              </div>
            </div>
          ))}
        </section>

        <label className="flex items-start gap-3.5 text-base leading-6 text-muted">
          <input
            type="checkbox"
            checked={setuju}
            onChange={(e) => setSetuju(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-steel"
          />
          <span>Saya telah membaca penjelasan dan setuju data demo saya diproses untuk mencoba prototipe ini.</span>
        </label>

        <div className="flex flex-col gap-2.5">
          <PrimaryButton disabled={!setuju} onClick={() => navigate("/keluhan")}>
            Setuju dan lanjut
          </PrimaryButton>
          <GhostButton onClick={() => navigate("/persetujuan/ditolak")}>Tolak</GhostButton>
        </div>

        <ClinicalNote />
      </main>
    </Screen>
  );
}
