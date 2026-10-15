import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { btn, btnGhost, field, Notice } from "../components/ui";
import type { AudioResult, AudioSampleInfo, TriageResult } from "../../../shared/types";

const LABEL: Record<string, { title: string; body: string; tone: "error" | "info" }> = {
  "perlu-pertolongan-segera": {
    title: "Perlu pertolongan segera",
    body: "Cari pertolongan medis sekarang. Jangan menunggu hasil aplikasi.",
    tone: "error",
  },
  "perlu-konsultasi": {
    title: "Perlu konsultasi",
    body: "Bawa ringkasan ini ke tenaga medis dan jelaskan keluhan Anda.",
    tone: "info",
  },
  pemantauan: {
    title: "Pemantauan",
    body: "Tidak ada tanda bahaya pada jawaban yang tersedia. Ini bukan pernyataan bebas penyakit.",
    tone: "info",
  },
  "belum-dapat-dinilai": {
    title: "Belum dapat dinilai",
    body: "Informasi belum cukup, atau di luar cakupan dewasa. Aplikasi tidak mengisinya dengan asumsi.",
    tone: "info",
  },
};

const PATTERN: Record<string, string> = {
  wheeze: "Wheeze pada anotasi",
  crackle: "Crackle pada anotasi",
  "crackle-dan-wheeze": "Crackle dan wheeze pada anotasi",
  "tidak-terdeteksi": "Tidak ada crackle atau wheeze pada anotasi",
};

export default function Result() {
  const { id = "" } = useParams();
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await api<TriageResult>("GET", `/screenings/${id}/result`);
      if (r.ok) setResult(r.data);
      else setError(r.message);
    })();
  }, [id]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!result) return <p className="text-slate-600">Memuat hasil…</p>;

  const view = LABEL[result.outcome] ?? LABEL["belum-dapat-dinilai"]!;
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">Hasil simulasi · {result.protocol_version}</p>
        <h1 className="text-xl font-semibold">{view.title}</h1>
      </header>

      <Notice tone={view.tone}>{view.body}</Notice>

      {result.reasons.length > 0 && (
        <section>
          <h2 className="font-medium mb-1">Alasan</h2>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {result.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </section>
      )}

      {result.missing_fields.length > 0 && (
        <section>
          <h2 className="font-medium mb-1">Informasi yang belum ada</h2>
          <p className="text-sm">{result.missing_fields.join(", ")}</p>
        </section>
      )}

      <Notice tone="info">
        Aturan ini berstatus <strong>{result.rule_status}</strong>. Belum ditinjau tenaga medis. Hasil tidak menjadi
        izin perawatan mandiri.
      </Notice>

      <AudioSection screeningId={id} />

      <div className="flex flex-wrap gap-3">
        <Link to="/ringkasan" className={btnGhost}>Buat ringkasan untuk konsultasi</Link>
        <Link to="/skrining" className={btn}>Mulai ulang</Link>
      </div>
    </div>
  );
}

function AudioSection({ screeningId }: { screeningId: string }) {
  const [samples, setSamples] = useState<AudioSampleInfo[] | null>(null);
  const [chosen, setChosen] = useState("");
  const [audio, setAudio] = useState<AudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const s = await api<AudioSampleInfo[]>("GET", "/audio-samples");
      if (s.ok) setSamples(s.data);
      const a = await api<AudioResult>("GET", `/screenings/${screeningId}/audio`);
      if (a.ok) setAudio(a.data);
    })();
  }, [screeningId]);

  async function attach() {
    setBusy(true);
    setError(null);
    const r = await api<AudioResult>("POST", `/screenings/${screeningId}/audio`, { sample_id: chosen });
    setBusy(false);
    if (r.ok) setAudio(r.data);
    else setError(r.message);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <h2 className="font-medium">Contoh analisis suara (sampel riset)</h2>
      <p className="text-sm text-slate-600">
        Pola di bawah berasal dari anotasi dataset riset ICBHI, bukan prediksi model dan bukan rekaman dari
        ponsel Anda. Kotak "eksperimen model offline", bila ada, terpisah dari pola ini. Hasil ini tidak mengubah
        arahan di atas.
      </p>

      {error && <Notice tone="error">{error}</Notice>}

      {audio && (
        <div className="text-sm space-y-1">
          <p>
            Status: <strong>{audio.status === "diterima" ? "Diterima" : "Ditolak"}</strong>
          </p>
          {audio.status === "diterima" && audio.pattern && (
            <p>Pola: {PATTERN[audio.pattern]}</p>
          )}
          {audio.rejection_reason && <p>Alasan: {audio.rejection_reason}</p>}
          {audio.model && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 mt-2 space-y-1">
              <p className="font-medium">Eksperimen model offline ({audio.model.model_version})</p>
              <p>
                Prediksi per siklus:{" "}
                {Object.entries(audio.model.cycles_predicted)
                  .map(([k, n]) => `${k} ${n}`)
                  .join(" · ")}
                . Sama dengan anotasi pada {audio.model.cycles_matching_annotation} dari {audio.model.cycles} siklus.
              </p>
              <p className="text-slate-700">
                {audio.model.in_training_data
                  ? "Pasien sampel ini ada di data latih, jadi kecocokan di atas terlalu optimistis. "
                  : "Pasien sampel ini tidak dipakai melatih model. "}
                Macro-F1 pada pasien uji: {audio.model.heldout_macro_f1.toFixed(2)} (masih rendah). Bukan diagnosis,
                belum divalidasi klinis, dan tidak dipakai oleh aturan triase.
              </p>
            </div>
          )}
          <p className="text-slate-600">{audio.notice}</p>
        </div>
      )}

      {samples && (
        <div className="flex flex-wrap gap-2 items-center">
          <select className={field + " max-w-xs"} value={chosen} onChange={(e) => setChosen(e.target.value)}>
            <option value="">Pilih sampel</option>
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {s.site} · {s.device} · {s.sample_rate_hz} Hz
              </option>
            ))}
          </select>
          <button className={btnGhost} disabled={!chosen || busy} onClick={attach}>
            {busy ? "Memproses…" : "Analisis sampel"}
          </button>
        </div>
      )}
    </section>
  );
}
