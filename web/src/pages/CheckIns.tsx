import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { btn, field, Notice } from "../components/ui";
import type { CheckIn } from "../../../shared/types";

const SYMPTOMS: [string, string][] = [
  ["batuk", "Batuk"],
  ["sesak_ringan", "Napas terasa lebih berat dari biasanya"],
  ["demam", "Demam"],
];

export default function CheckIns() {
  const [list, setList] = useState<CheckIn[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sym, setSym] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const r = await api<CheckIn[]>("GET", "/check-ins");
    if (r.ok) setList(r.data);
    else setError(r.message);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    const symptoms: Record<string, boolean> = {};
    for (const [k] of SYMPTOMS) symptoms[k] = sym[k] ?? false;
    const r = await api<CheckIn>("POST", "/check-ins", { symptoms, notes: notes.trim() || undefined });
    setBusy(false);
    if (r.ok) {
      setSaved(true);
      setNotes("");
      setSym({});
      await load();
    } else setError(`${r.message} Catatan Anda masih di layar.`);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Catatan harian</h1>
        <p className="text-sm text-slate-600">Catat gejala hari ini. Hanya Anda yang bisa melihat catatan ini.</p>
      </header>

      {error && <Notice tone="error">{error}</Notice>}
      {saved && <Notice tone="ok">Catatan tersimpan.</Notice>}

      <form
        className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {SYMPTOMS.map(([k, label]) => (
          <label key={k} className="flex gap-2 items-center text-sm">
            <input type="checkbox" checked={!!sym[k]} onChange={(e) => setSym({ ...sym, [k]: e.target.checked })} />
            {label}
          </label>
        ))}
        {(sym.sesak_ringan || Object.values(sym).some(Boolean)) && (
          <p className="text-xs text-slate-600">
            Jika keluhan memburuk, cari pertolongan medis tanpa menunggu catatan berikutnya.
          </p>
        )}
        <label className="block text-sm">
          Catatan (opsional, jangan isi nama atau data pribadi)
          <textarea className={field} rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button className={btn} disabled={busy}>{busy ? "Menyimpan…" : "Simpan catatan"}</button>
      </form>

      <section className="space-y-2">
        <h2 className="font-medium">30 hari terakhir</h2>
        {list === null && <p className="text-sm text-slate-600">Memuat…</p>}
        {list?.length === 0 && <p className="text-sm text-slate-600">Belum ada catatan.</p>}
        {list?.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <p className="text-slate-600">
              {new Date(c.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} WIB
            </p>
            <p>
              {Object.entries(c.symptoms).filter(([, v]) => v === true).map(([k]) => SYMPTOMS.find(([s]) => s === k)?.[1] ?? k).join(", ") || "Tidak ada gejala dicentang"}
            </p>
            {c.notes && <p className="text-slate-700">{c.notes}</p>}
          </div>
        ))}
      </section>
    </div>
  );
}
