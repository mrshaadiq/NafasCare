import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CheckOption,
  ClinicalNote,
  DemoTag,
  Field,
  inputClass,
  PageHeading,
  PrimaryButton,
  Screen,
  StepHeader,
} from "../components/ui";

const gejala = ["Batuk", "Sesak", "Mengi", "Nyeri dada saat bernapas", "Demam"];

export default function KeluhanDurasi() {
  const navigate = useNavigate();
  const [dipilih, setDipilih] = useState<string[]>([]);
  const [durasi, setDurasi] = useState("");
  const [usia, setUsia] = useState("");
  const [khusus, setKhusus] = useState<boolean | null>(null);

  const siapLanjut = dipilih.length > 0 && durasi.trim() !== "" && usia.trim() !== "" && khusus !== null;

  const toggleGejala = (nama: string) =>
    setDipilih((prev) => (prev.includes(nama) ? prev.filter((g) => g !== nama) : [...prev, nama]));

  return (
    <Screen>
      <StepHeader label="Analisis awal" step={1} total={4} />

      <main className="flex flex-1 flex-col gap-6 px-[17.6px] pb-28 pt-9">
        <PageHeading eyebrow="Keluhan dan durasi" title="Apa yang paling terasa?">
          Pilih semua yang sesuai. Jawaban kosong tidak dianggap normal.
        </PageHeading>

        <div className="-mt-2">
          <DemoTag />
        </div>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-[12.8px] font-bold text-muted">Gejala utama</legend>
          {gejala.map((nama) => (
            <CheckOption key={nama} label={nama} checked={dipilih.includes(nama)} onToggle={() => toggleGejala(nama)} />
          ))}
        </fieldset>

        <div className="flex flex-col gap-4">
          <Field label="Durasi keluhan" required>
            <input
              className={inputClass}
              placeholder="Contoh: 3 hari"
              value={durasi}
              onChange={(e) => setDurasi(e.target.value)}
            />
          </Field>
          <Field label="Usia" required>
            <input
              className={inputClass}
              type="number"
              min={0}
              placeholder="Dalam tahun"
              value={usia}
              onChange={(e) => setUsia(e.target.value)}
            />
          </Field>
        </div>

        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <h2 className="font-hand text-lg font-bold text-ink">Apakah Anda sedang hamil atau memiliki kondisi khusus?</h2>
            <p className="text-base leading-[26px] text-muted">
              Kelompok ini memerlukan penilaian yang disesuaikan dan tidak dinilai oleh model dewasa.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Tidak", value: false },
              { label: "Ya", value: true },
            ].map((opsi) => (
              <button
                key={opsi.label}
                type="button"
                aria-pressed={khusus === opsi.value}
                onClick={() => setKhusus(opsi.value)}
                className={`min-h-11 rounded-[11.2px] border text-base ${
                  khusus === opsi.value ? "border-steel bg-mist font-bold text-ink" : "border-line bg-paper text-ink"
                }`}
              >
                {opsi.label}
              </button>
            ))}
          </div>
        </Card>

        <PrimaryButton disabled={!siapLanjut} onClick={() => navigate("/tanda-bahaya")}>
          Lanjut ke tanda bahaya
        </PrimaryButton>

        <ClinicalNote />
      </main>
    </Screen>
  );
}
