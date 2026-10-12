import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { btn, btnGhost, field, Notice } from "../components/ui";
import type { CareInstruction, InstructionFields } from "../../../shared/types";

const FIELD_LABEL: Record<string, string> = {
  nama_obat: "Nama obat",
  dosis: "Dosis",
  satuan: "Satuan (tablet, ml, dst.)",
  frekuensi_per_hari: "Kali per hari",
  durasi_hari: "Lama minum (hari)",
};

const AMBIG_TEXT: Record<string, string> = {
  bila_perlu: "Dosis 'bila perlu' tidak dijadwalkan otomatis.",
};

function ambiguityLabel(flag: string) {
  if (flag.startsWith("kosong:")) {
    const key = flag.slice(7);
    return `${FIELD_LABEL[key] ?? key} belum ada di instruksi.`;
  }
  return AMBIG_TEXT[flag] ?? flag;
}

export default function Instructions() {
  const [list, setList] = useState<CareInstruction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CareInstruction | null>(null);

  async function reload() {
    const r = await api<CareInstruction[]>("GET", "/care-instructions");
    if (r.ok) setList(r.data);
    else setError(r.message);
  }

  useEffect(() => {
    void reload();
  }, []);

  if (draft) {
    return <Review key={draft.id} initial={draft} onDone={() => { setDraft(null); void reload(); }} />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Instruksi dokter</h1>
        <p className="text-sm text-slate-600">
          Masukkan isi instruksi secara manual. Aplikasi tidak membaca dokumen; setiap isian diperiksa Anda dulu.
        </p>
      </header>

      {error && <Notice tone="error">{error}</Notice>}

      <NewInstruction onCreated={setDraft} />

      <section className="space-y-2">
        <h2 className="font-medium">Instruksi tersimpan</h2>
        {list === null && <p className="text-sm text-slate-600">Memuat…</p>}
        {list?.length === 0 && <p className="text-sm text-slate-600">Belum ada instruksi.</p>}
        {list?.map((i) => (
          <div key={i.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm flex justify-between items-center gap-3">
            <div>
              <p className="font-medium">{i.fields.nama_obat ?? "(tanpa nama)"}</p>
              <p className="text-slate-600">
                {i.review_status === "dikonfirmasi" ? "Sudah diperiksa" : "Draf"}
                {i.ambiguity_flags.length > 0 && ` · ${i.ambiguity_flags.length} bagian belum lengkap`}
              </p>
            </div>
            {i.review_status === "dikonfirmasi" && i.ambiguity_flags.length === 0 ? (
              <Link className={btnGhost} to={`/instruksi/${i.id}/jadwal`}>Atur jadwal</Link>
            ) : (
              <button className={btnGhost} onClick={() => setDraft(i)}>Periksa</button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

function NewInstruction({ onCreated }: { onCreated: (i: CareInstruction) => void }) {
  const [text, setText] = useState("");
  const [f, setF] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    const fields: InstructionFields = {
      nama_obat: f.nama_obat?.trim() || null,
      dosis: f.dosis ? Number(f.dosis) : null,
      satuan: f.satuan?.trim() || null,
      frekuensi_per_hari: f.frekuensi_per_hari ? Number(f.frekuensi_per_hari) : null,
      durasi_hari: f.durasi_hari ? Number(f.durasi_hari) : null,
    };
    const r = await api<CareInstruction>("POST", "/care-instructions", {
      source_text: text.trim() || "(diisi manual)",
      fields,
    });
    setBusy(false);
    if (r.ok) onCreated(r.data);
    else setError(r.message);
  }

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <h2 className="font-medium">Tambah instruksi</h2>
      {error && <Notice tone="error">{error}</Notice>}
      <label className="block text-sm">
        Salin teks dari resep atau catatan dokter (opsional)
        <textarea className={field} rows={2} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(FIELD_LABEL).map(([key, label]) => (
          <label key={key} className="block text-sm">
            {label}
            <input
              className={field}
              value={f[key] ?? ""}
              onChange={(e) => setF({ ...f, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-slate-600">Kosongkan jika tidak tertulis. Aplikasi tidak menebak.</p>
      <button className={btn} disabled={busy}>{busy ? "Menyimpan…" : "Simpan sebagai draf"}</button>
    </form>
  );
}

function Review({ initial, onDone }: { initial: CareInstruction; onDone: () => void }) {
  const [inst, setInst] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<Record<string, string>>({});

  async function saveEdits() {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(edit)) {
      if (k === "nama_obat" || k === "satuan") fields[k] = v.trim() || null;
      else fields[k] = v.trim() === "" ? null : Number(v);
    }
    const r = await api<CareInstruction>("PATCH", `/care-instructions/${inst.id}`, { fields });
    if (r.ok) {
      setInst(r.data);
      setEdit({});
      setError(null);
    } else setError(r.message);
  }

  async function confirm() {
    const r = await api<CareInstruction>("POST", `/care-instructions/${inst.id}/confirm`);
    if (r.ok) setInst(r.data);
    else setError(r.message);
  }

  const ready = inst.review_status === "dikonfirmasi" && inst.ambiguity_flags.length === 0;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Periksa instruksi</h1>
      <p className="text-sm text-slate-600">Pastikan isinya sama dengan instruksi dokter. Ini bukan validasi medis.</p>
      {error && <Notice tone="error">{error}</Notice>}

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm space-y-1">
        {Object.entries(FIELD_LABEL).map(([key, label]) => (
          <p key={key}>
            <span className="text-slate-600">{label}:</span>{" "}
            <strong>{inst.fields[key as keyof InstructionFields] ?? "belum ada"}</strong>
          </p>
        ))}
        <p>
          <span className="text-slate-600">Bila perlu:</span> {inst.fields.bila_perlu ? "ya" : "tidak"}
        </p>
      </div>

      {inst.ambiguity_flags.length > 0 && (
        <Notice tone="error">
          <p className="font-medium mb-1">Belum bisa dijadwalkan:</p>
          <ul className="list-disc pl-5">
            {inst.ambiguity_flags.map((f) => <li key={f}>{ambiguityLabel(f)}</li>)}
          </ul>
        </Notice>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(FIELD_LABEL).map(([key, label]) => (
          <label key={key} className="block text-sm">
            Ubah {label.toLowerCase()}
            <input
              className={field}
              placeholder={String(inst.fields[key as keyof InstructionFields] ?? "")}
              value={edit[key] ?? ""}
              onChange={(e) => setEdit({ ...edit, [key]: e.target.value })}
              disabled={inst.review_status === "dikonfirmasi"}
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {inst.review_status === "draf" && (
          <>
            <button className={btnGhost} onClick={saveEdits} disabled={Object.keys(edit).length === 0}>
              Simpan perubahan
            </button>
            <button className={btn} onClick={confirm}>Saya sudah memeriksa isinya</button>
          </>
        )}
        {ready && <Link className={btn} to={`/instruksi/${inst.id}/jadwal`}>Atur jadwal</Link>}
        <button className={btnGhost} onClick={onDone}>Kembali</button>
      </div>
      {inst.review_status === "dikonfirmasi" && !ready && (
        <p className="text-sm text-slate-600">
          Instruksi sudah diperiksa tetapi belum lengkap. Buat instruksi baru dengan data yang lengkap untuk membuat
          jadwal.
        </p>
      )}
    </div>
  );
}
