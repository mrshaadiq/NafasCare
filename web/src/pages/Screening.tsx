import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { btn, field, Notice } from "../components/ui";
import type { Screening as ScreeningT } from "../../../shared/types";

const DANGER: [string, string][] = [
  ["sesak_berat_saat_istirahat", "Sesak berat saat istirahat"],
  ["nyeri_dada", "Nyeri dada"],
  ["bibir_biru", "Bibir atau wajah kebiruan"],
  ["kesadaran_menurun", "Kesadaran menurun"],
  ["batuk_darah", "Batuk berdarah"],
];

type Step = "consent" | "form" | "saving";

export default function Screening() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("consent");
  const [consent, setConsent] = useState(false);
  const [age, setAge] = useState("");
  const [durasi, setDurasi] = useState("");
  const [demam, setDemam] = useState<"" | "ya" | "tidak">("");
  const [danger, setDanger] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const ageNum = age === "" ? null : Number(age);
    const durasiNum = durasi === "" ? null : Number(durasi);
    if (ageNum !== null && (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120)) {
      setError("Usia harus angka bulat 0–120.");
      return;
    }
    if (durasiNum !== null && (!Number.isInteger(durasiNum) || durasiNum < 0 || durasiNum > 365)) {
      setError("Lama keluhan harus angka bulat 0–365 hari.");
      return;
    }

    setStep("saving");
    const c = await api("POST", "/consents", { purpose: "skrining-awal", notice_version: "v1" });
    if (!c.ok) return fail(c.message);
    const s = await api<ScreeningT>("POST", "/screenings", { age: ageNum });
    if (!s.ok) return fail(s.message);

    const answers: Record<string, unknown> = {
      durasi_hari: durasiNum,
      demam: demam === "" ? null : demam === "ya",
    };
    for (const [key] of DANGER) answers[key] = danger[key] ?? false;

    const p = await api("PATCH", `/screenings/${s.data.id}/answers`, { answers });
    if (!p.ok) return fail(p.message);
    const done = await api("POST", `/screenings/${s.data.id}/complete`);
    if (!done.ok) return fail(done.message);
    nav(`/skrining/${s.data.id}/hasil`);
  }

  function fail(message: string) {
    setError(`${message} Jawaban Anda masih ada di layar; coba kirim lagi.`);
    setStep("form");
  }

  if (step === "consent") {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-semibold">Persetujuan</h1>
        <div className="rounded-lg bg-white border border-slate-200 p-4 text-sm space-y-2">
          <p>Tujuan: menyusun analisis awal dari jawaban yang Anda isi, sebagai bahan konsultasi.</p>
          <p>Data yang diproses: usia, lama keluhan, demam, dan tanda bahaya yang Anda pilih.</p>
          <p>Hasil ini bersifat simulasi, memakai aturan draf yang belum ditinjau tenaga medis.</p>
          <p>Jika ada tanda bahaya, aplikasi menampilkan arahan segera tanpa menunggu proses lain.</p>
        </div>
        <label className="flex gap-2 items-start text-sm">
          <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          Saya memahami tujuan dan batas hasil, dan setuju data di atas diproses untuk analisis awal simulasi.
        </label>
        <button className={btn} disabled={!consent} onClick={() => setStep("form")}>Lanjut</button>
      </div>
    );
  }

  const busy = step === "saving";
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h1 className="text-xl font-semibold">Jawab pertanyaan singkat</h1>
      {error && <Notice tone="error">{error}</Notice>}

      <fieldset className="space-y-3">
        <legend className="font-medium mb-1">Tanda bahaya (centang jika ada)</legend>
        {DANGER.map(([key, label]) => (
          <label key={key} className="flex gap-2 items-center text-sm">
            <input
              type="checkbox"
              checked={!!danger[key]}
              onChange={(e) => setDanger({ ...danger, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
        {DANGER.some(([k]) => danger[k]) && (
          <Notice tone="error">Ada tanda bahaya. Cari pertolongan medis sekarang; hasil di bawah tidak menggantikannya.</Notice>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Usia (tahun)
          <input className={field} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        <label className="text-sm">
          Sudah berapa hari keluhan?
          <input className={field} inputMode="numeric" value={durasi} onChange={(e) => setDurasi(e.target.value)} />
        </label>
        <label className="text-sm">
          Apakah ada demam?
          <select className={field} value={demam} onChange={(e) => setDemam(e.target.value as "" | "ya" | "tidak")}>
            <option value="">Belum tahu / tidak diisi</option>
            <option value="ya">Ya</option>
            <option value="tidak">Tidak</option>
          </select>
        </label>
      </div>

      <p className="text-sm text-slate-600">
        Kosong berarti belum diisi. Aplikasi tidak mengisi nilai sendiri, dan hasil akan menyebut apa yang kurang.
      </p>

      <button className={btn} disabled={busy}>
        {busy ? "Memproses…" : "Lihat hasil"}
      </button>
    </form>
  );
}
