import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CheckOption,
  ChoiceButton,
  ClinicalNote,
  Field,
  GhostButton,
  inputClass,
  PageHeading,
  PrimaryButton,
  Screen,
  StepHeader,
} from "../components/ui";

const kondisi = ["Asma", "Penyakit paru kronis", "Penyakit jantung", "Merokok", "Tidak ada yang sesuai"];
const pilihanMemburuk = ["Ya", "Tidak", "Tidak yakin"];

export default function RiwayatDanInformasiTambahan() {
  const navigate = useNavigate();
  const [dipilih, setDipilih] = useState<string[]>([]);
  const [memburuk, setMemburuk] = useState<string | null>(null);
  const [suhu, setSuhu] = useState("");
  const [napas, setNapas] = useState("");

  const toggle = (nama: string) =>
    setDipilih((prev) => (prev.includes(nama) ? prev.filter((k) => k !== nama) : [...prev, nama]));

  return (
    <Screen>
      <StepHeader label="Analisis awal" step={3} total={4} />

      <main className="flex flex-1 flex-col gap-6 px-[17.6px] pb-28 pt-9">
        <PageHeading eyebrow="Riwayat dan informasi tambahan" title="Ceritakan sedikit lebih lanjut">
          Bagian ini membantu menyusun ringkasan dari laporan Anda.
        </PageHeading>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-[12.8px] font-bold text-muted">Kondisi yang sudah dimiliki</legend>
          {kondisi.map((nama) => (
            <CheckOption key={nama} label={nama} checked={dipilih.includes(nama)} onToggle={() => toggle(nama)} />
          ))}
        </fieldset>

        <Card className="flex flex-col gap-4">
          <h2 className="font-hand text-lg font-bold text-ink">
            Apakah keluhan semakin memburuk dalam 24 jam terakhir?
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {pilihanMemburuk.map((opsi) => (
              <ChoiceButton key={opsi} selected={memburuk === opsi} onClick={() => setMemburuk(opsi)} className="text-[12px]">
                {opsi}
              </ChoiceButton>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-hand text-lg font-bold text-ink">Pengukuran yang Anda miliki</h2>
          <Field label="Suhu tubuh">
            <input className={inputClass} placeholder="Contoh: 37,5 °C" value={suhu} onChange={(e) => setSuhu(e.target.value)} />
          </Field>
          <p className="-mt-2 text-[12.8px] text-muted">Opsional. Tuliskan sumber pengukurannya.</p>
          <Field label="Frekuensi napas">
            <input
              className={inputClass}
              placeholder="Contoh: hasil hitung manual"
              value={napas}
              onChange={(e) => setNapas(e.target.value)}
            />
          </Field>
          <p className="-mt-2 text-[12.8px] text-muted">Opsional. Tuliskan sumber pengukurannya.</p>
        </Card>

        <div className="flex flex-col gap-2.5">
          <PrimaryButton onClick={() => navigate("/audio")}>Lanjut</PrimaryButton>
          <GhostButton onClick={() => navigate("/audio")}>Lewati bagian ini</GhostButton>
        </div>

        <ClinicalNote />
      </main>
    </Screen>
  );
}
