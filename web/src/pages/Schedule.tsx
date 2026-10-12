import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { btn, btnGhost, field, Notice } from "../components/ui";
import type { CareInstruction, MedicationEvent, MedicationSchedule } from "../../../shared/types";

const TZ = [
  ["Asia/Jakarta", "WIB (Jakarta)"],
  ["Asia/Makassar", "WITA (Makassar)"],
  ["Asia/Jayapura", "WIT (Jayapura)"],
] as const;

const STATUS_TEXT: Record<string, string> = {
  "tidak-aktif": "Tidak aktif. Pengingat belum berjalan.",
  aktif: "Aktif. Pengingat tampil di aplikasi ini.",
  jeda: "Dijeda. Kejadian mendatang dihapus.",
  dihentikan: "Dihentikan. Tidak ada kejadian baru.",
};

export default function Schedule() {
  const { id = "" } = useParams(); // instruction id
  const [inst, setInst] = useState<CareInstruction | null>(null);
  const [schedule, setSchedule] = useState<MedicationSchedule | null>(null);
  const [events, setEvents] = useState<MedicationEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tz, setTz] = useState<(typeof TZ)[number][0]>("Asia/Jakarta");
  const [start, setStart] = useState("");
  const [times, setTimes] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      const r = await api<CareInstruction[]>("GET", "/care-instructions");
      if (r.ok) {
        const found = r.data.find((x) => x.id === id) ?? null;
        setInst(found);
        if (found?.fields.frekuensi_per_hari) setTimes(Array(found.fields.frekuensi_per_hari).fill("08:00"));
      } else setError(r.message);
    })();
  }, [id]);

  async function loadEvents(scheduleId: string) {
    const r = await api<MedicationEvent[]>("GET", `/medication-schedules/${scheduleId}/events`);
    if (r.ok) setEvents(r.data);
    else setError(r.message);
  }

  async function create() {
    setError(null);
    const r = await api<MedicationSchedule>("POST", "/medication-schedules", {
      instruction_id: id,
      timezone: tz,
      start_date: start,
      times,
    });
    if (r.ok) {
      setSchedule(r.data);
      await loadEvents(r.data.id);
    } else setError(r.message);
  }

  async function change(patch: Record<string, unknown>) {
    if (!schedule) return;
    setError(null);
    const r = await api<MedicationSchedule>("PATCH", `/medication-schedules/${schedule.id}`, patch);
    if (r.ok) {
      setSchedule(r.data);
      await loadEvents(r.data.id);
    } else setError(r.message);
  }

  async function report(eventId: string, status: "diminum" | "dilewati") {
    const r = await api<MedicationEvent>("POST", `/medication-events/${eventId}/report`, { status });
    if (r.ok) setEvents(events.map((e) => (e.id === eventId ? { ...e, ...r.data } : e)));
    else setError(r.message);
  }

  if (!inst) return <p className="text-slate-600">Instruksi tidak ditemukan.</p>;

  if (inst.ambiguity_flags.length > 0 || inst.review_status !== "dikonfirmasi") {
    return (
      <div className="space-y-4">
        <Notice tone="error">Instruksi ini belum bisa dijadwalkan. Periksa dulu, lalu kembali ke daftar instruksi.</Notice>
        <Link className={btnGhost} to="/instruksi">Ke daftar instruksi</Link>
      </div>
    );
  }

  if (!schedule) {
    return (
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <h1 className="text-xl font-semibold">Atur pengingat: {inst.fields.nama_obat}</h1>
        <p className="text-sm text-slate-600">
          Jadwal dibuat dalam keadaan tidak aktif. Pengingat baru berjalan setelah Anda mengaktifkannya.
        </p>
        {error && <Notice tone="error">{error}</Notice>}

        <label className="block text-sm">
          Zona waktu
          <select className={field} value={tz} onChange={(e) => setTz(e.target.value as typeof tz)}>
            {TZ.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          Mulai tanggal
          <input className={field} type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
        </label>
        <div className="space-y-2">
          <p className="text-sm">Jam minum ({times.length} kali per hari, sesuai instruksi)</p>
          {times.map((t, i) => (
            <input
              key={i}
              type="time"
              className={field}
              value={t}
              onChange={(e) => setTimes(times.map((x, j) => (j === i ? e.target.value : x)))}
              required
            />
          ))}
        </div>
        <button className={btn} disabled={!start || times.length === 0}>Buat jadwal (belum aktif)</button>
      </form>
    );
  }

  const now = Date.now();
  const upcoming = events.filter((e) => Date.parse(e.planned_at) >= now && e.user_report === null);
  const past = events.filter((e) => Date.parse(e.planned_at) < now || e.user_report !== null);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Pengingat: {inst.fields.nama_obat}</h1>
      {error && <Notice tone="error">{error}</Notice>}
      <Notice tone="info">{STATUS_TEXT[schedule.status]}</Notice>

      <div className="flex flex-wrap gap-3">
        {(schedule.status === "tidak-aktif" || schedule.status === "jeda") && (
          <button className={btn} onClick={() => change({ status: "aktif" })}>Aktifkan</button>
        )}
        {schedule.status === "aktif" && <button className={btnGhost} onClick={() => change({ status: "jeda" })}>Jeda</button>}
        {schedule.status !== "dihentikan" && (
          <button className={btnGhost} onClick={() => change({ status: "dihentikan" })}>Hentikan</button>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="font-medium">Akan datang</h2>
        {upcoming.length === 0 && <p className="text-sm text-slate-600">Tidak ada kejadian mendatang.</p>}
        {upcoming.map((e) => (
          <EventRow key={e.id} e={e} onReport={report} />
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Sudah lewat atau sudah dicatat</h2>
        {past.length === 0 && <p className="text-sm text-slate-600">Belum ada.</p>}
        {past.map((e) => (
          <EventRow key={e.id} e={e} onReport={report} />
        ))}
      </section>

      <p className="text-xs text-slate-600">
        "Belum dicatat" berarti Anda belum melapor, bukan berarti dilewati. Catatan Anda hanya laporan Anda sendiri.
      </p>
      <Link className={btnGhost} to="/ringkasan">Buat ringkasan</Link>
    </div>
  );
}

function EventRow({ e, onReport }: { e: MedicationEvent; onReport: (id: string, s: "diminum" | "dilewati") => void }) {
  const when = new Date(e.planned_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" });
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm flex flex-wrap justify-between items-center gap-2">
      <span>{when} WIB</span>
      {e.user_report === null ? (
        <span className="flex gap-2">
          <button className={btnGhost} onClick={() => onReport(e.id, "diminum")}>Sudah diminum</button>
          <button className={btnGhost} onClick={() => onReport(e.id, "dilewati")}>Dilewati</button>
        </span>
      ) : (
        <span className="text-slate-700">{e.user_report === "diminum" ? "Dilaporkan diminum" : "Dilaporkan dilewati"}</span>
      )}
    </div>
  );
}
