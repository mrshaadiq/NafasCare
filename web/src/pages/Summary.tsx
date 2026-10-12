import { useState } from "react";
import { api } from "../lib/api";
import { btn, field, Notice } from "../components/ui";
import type { Summary as SummaryT } from "../../../shared/types";

const PERIODS = [7, 14, 30] as const;

export default function Summary() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(14);
  const [summary, setSummary] = useState<SummaryT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setError(null);
    const r = await api<SummaryT>("POST", "/summaries", { period_days: days });
    setBusy(false);
    if (r.ok) setSummary(r.data);
    else setError(r.message);
  }

  const c = summary?.content;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Ringkasan untuk konsultasi</h1>
        <p className="text-sm text-slate-600">
          Ringkasan hanya memuat catatan yang sudah ada. Tidak ada informasi baru yang ditambahkan.
        </p>
      </header>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          Periode
          <select className={field + " max-w-[10rem]"} value={days} onChange={(e) => setDays(Number(e.target.value) as typeof days)}>
            {PERIODS.map((d) => <option key={d} value={d}>{d} hari terakhir</option>)}
          </select>
        </label>
        <button className={btn} disabled={busy} onClick={create}>{busy ? "Menyusun…" : "Susun ringkasan"}</button>
      </div>

      {c && summary && (
        <article className="rounded-lg border border-slate-200 bg-white p-4 space-y-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pratinjau · simulasi</p>
          <p>
            Periode: {new Date(c.period_from).toLocaleDateString("id-ID")} – {new Date(c.period_to).toLocaleDateString("id-ID")}
          </p>

          <section>
            <h2 className="font-medium">Laporan pengguna: catatan harian ({c.check_ins.length})</h2>
            {c.check_ins.length === 0 && <p className="text-slate-600">Tidak ada catatan pada periode ini.</p>}
            <ul className="list-disc pl-5">
              {c.check_ins.map((ci, i) => (
                <li key={i}>
                  {new Date(ci.created_at).toLocaleDateString("id-ID")}:{" "}
                  {Object.entries(ci.symptoms).filter(([, v]) => v === true).map(([k]) => k).join(", ") || "tanpa gejala dicentang"}
                  {ci.notes ? ` (${ci.notes})` : ""}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-medium">Instruksi dokter yang dimasukkan ({c.instructions.length})</h2>
            <ul className="list-disc pl-5">
              {c.instructions.map((i) => (
                <li key={i.id}>
                  {i.fields.nama_obat ?? "(tanpa nama)"} · {i.review_status === "dikonfirmasi" ? "sudah diperiksa" : "draf"}
                  {i.ambiguity_flags.length > 0 && " · ada bagian belum lengkap"}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-medium">Status minum obat (laporan Anda)</h2>
            <p>
              Diminum: {c.medication.diminum} · Dilewati: {c.medication.dilewati} · Belum dicatat: {c.medication.belum_dicatat}
            </p>
            <p className="text-slate-600">"Belum dicatat" bukan berarti dilewati.</p>
          </section>

          <Notice tone="info">{c.notice}</Notice>
          <p className="text-xs text-slate-600">Sumber: {c.sources.join(", ")}</p>
        </article>
      )}

      {c && <p className="text-xs text-slate-600">Unduh dan berbagi belum tersedia pada versi ini. Tunjukkan layar ini ke tenaga medis.</p>}
    </div>
  );
}
