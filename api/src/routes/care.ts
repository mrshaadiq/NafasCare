import type { Hono } from "hono";
import {
  CreateCheckIn,
  CreateInstruction,
  CreateSchedule,
  CreateSummary,
  MODE,
  PatchInstruction,
  PatchSchedule,
  ReportEvent,
  type CareInstruction,
  type CheckIn,
  type MedicationSchedule,
  type Summary,
} from "../../../shared/types";
import { ambiguityFlags } from "../domain/instruction";
import { generateEvents } from "../domain/schedule";
import { err, type AppEnv, type Deps } from "../http";
import type { Repository } from "../repo";

const NOT_FOUND = (what: string) => err("not_found", `${what} tidak ditemukan.`);
const DAY_MS = 24 * 60 * 60 * 1000;

/** Owner check shared by every object: a foreign object is indistinguishable from a missing one. */
const owned = <T extends { user_id: string }>(o: T | null, userId: string): T | null =>
  o && o.user_id === userId ? o : null;

export function registerCareRoutes(app: Hono<AppEnv>, repo: Repository, deps: Deps) {
  /* ---------------- care instructions ---------------- */

  app.post("/care-instructions", async (c) => {
    const body = CreateInstruction.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json(err("invalid_input", body.error.message), 400);
    const i: CareInstruction = {
      id: crypto.randomUUID(),
      user_id: c.get("userId"),
      source_text: body.data.source_text,
      fields: body.data.fields,
      ambiguity_flags: ambiguityFlags(body.data.fields),
      review_status: "draf",
      mode: MODE,
      created_at: deps.now().toISOString(),
      confirmed_at: null,
    };
    await repo.saveInstruction(i);
    return c.json(i, 201);
  });

  app.get("/care-instructions", async (c) => c.json(await repo.listInstructions(c.get("userId"))));

  app.patch("/care-instructions/:id", async (c) => {
    const i = owned(await repo.getInstruction(c.req.param("id")), c.get("userId"));
    if (!i) return c.json(NOT_FOUND("Instruksi"), 404);
    if (i.review_status === "dikonfirmasi") {
      return c.json(err("conflict", "Instruksi sudah dikonfirmasi; buat instruksi baru untuk mengubahnya."), 409);
    }
    const body = PatchInstruction.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json(err("invalid_input", body.error.message), 400);
    i.fields = { ...i.fields, ...body.data.fields };
    i.ambiguity_flags = ambiguityFlags(i.fields);
    await repo.saveInstruction(i);
    return c.json(i);
  });

  // Confirming records that the user checked the draft. It is not medical validation, so an
  // ambiguous instruction can be confirmed but still cannot become a schedule.
  app.post("/care-instructions/:id/confirm", async (c) => {
    const i = owned(await repo.getInstruction(c.req.param("id")), c.get("userId"));
    if (!i) return c.json(NOT_FOUND("Instruksi"), 404);
    if (i.review_status === "draf") {
      i.review_status = "dikonfirmasi";
      i.confirmed_at = deps.now().toISOString();
      await repo.saveInstruction(i);
    }
    return c.json(i);
  });

  /* ---------------- medication schedules ---------------- */

  app.post("/medication-schedules", async (c) => {
    const body = CreateSchedule.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json(err("invalid_input", body.error.message), 400);
    const i = owned(await repo.getInstruction(body.data.instruction_id), c.get("userId"));
    if (!i) return c.json(NOT_FOUND("Instruksi"), 404);
    if (i.review_status !== "dikonfirmasi") {
      return c.json(err("instruction_not_confirmed", "Instruksi harus diperiksa dan dikonfirmasi dulu."), 422);
    }
    if (i.ambiguity_flags.length > 0) {
      return c.json(
        err("instruction_ambiguous", `Instruksi ambigu (${i.ambiguity_flags.join(", ")}); jadwal tidak dibuat.`),
        422,
      );
    }
    if (new Set(body.data.times).size !== i.fields.frekuensi_per_hari) {
      return c.json(err("times_mismatch", "Jumlah jam harus sama dengan frekuensi per hari."), 422);
    }
    const s: MedicationSchedule = {
      id: crypto.randomUUID(),
      user_id: c.get("userId"),
      instruction_id: i.id,
      timezone: body.data.timezone,
      start_date: body.data.start_date,
      times: [...body.data.times].sort(),
      status: "tidak-aktif",
      version: 1,
      mode: MODE,
      created_at: deps.now().toISOString(),
    };
    await repo.saveSchedule(s);
    return c.json(s, 201);
  });

  app.get("/medication-schedules/:id", async (c) => {
    const s = owned(await repo.getSchedule(c.req.param("id")), c.get("userId"));
    return s ? c.json(s) : c.json(NOT_FOUND("Jadwal"), 404);
  });

  app.get("/medication-schedules/:id/events", async (c) => {
    const s = owned(await repo.getSchedule(c.req.param("id")), c.get("userId"));
    if (!s) return c.json(NOT_FOUND("Jadwal"), 404);
    return c.json(await repo.listEvents(s.id));
  });

  app.patch("/medication-schedules/:id", async (c) => {
    const s = owned(await repo.getSchedule(c.req.param("id")), c.get("userId"));
    if (!s) return c.json(NOT_FOUND("Jadwal"), 404);
    if (s.status === "dihentikan") return c.json(err("conflict", "Jadwal sudah dihentikan."), 409);
    const body = PatchSchedule.safeParse(await c.req.json().catch(() => null));
    if (!body.success || Object.keys(body.data).length === 0) {
      return c.json(err("invalid_input", body.success ? "Tidak ada perubahan." : body.error.message), 400);
    }
    const i = await repo.getInstruction(s.instruction_id);
    if (!i || i.fields.durasi_hari == null || i.fields.frekuensi_per_hari == null) {
      return c.json(err("internal", "Instruksi jadwal tidak lengkap."), 500);
    }

    const next: MedicationSchedule = { ...s };
    const p = body.data;
    if (p.status) {
      const allowed: Record<string, string[]> = {
        "tidak-aktif": ["aktif", "dihentikan"],
        aktif: ["aktif", "jeda", "dihentikan"],
        jeda: ["aktif", "dihentikan"],
      };
      if (!allowed[s.status]?.includes(p.status)) {
        return c.json(err("invalid_transition", `Tidak bisa dari ${s.status} ke ${p.status}.`), 409);
      }
      next.status = p.status;
    }
    if (p.times && new Set(p.times).size !== i.fields.frekuensi_per_hari) {
      return c.json(err("times_mismatch", "Jumlah jam harus sama dengan frekuensi per hari."), 422);
    }
    const contentChanged =
      (p.timezone !== undefined && p.timezone !== s.timezone) ||
      (p.start_date !== undefined && p.start_date !== s.start_date) ||
      (p.times !== undefined && [...p.times].sort().join() !== s.times.join());
    if (p.timezone) next.timezone = p.timezone;
    if (p.start_date) next.start_date = p.start_date;
    if (p.times) next.times = [...p.times].sort();
    if (contentChanged) next.version = s.version + 1;

    await repo.saveSchedule(next);

    // Only an active schedule has upcoming events. Paused, stopped or inactive schedules
    // drop their unreported future events and never create new ones.
    const nowMs = deps.now().getTime();
    const upcoming =
      next.status === "aktif"
        ? generateEvents(next, i.fields.durasi_hari).filter((e) => Date.parse(e.planned_at) > nowMs)
        : [];
    await repo.syncEvents(next.id, nowMs, upcoming);
    return c.json(next);
  });

  app.post("/medication-events/:id/report", async (c) => {
    const e = owned(await repo.getEvent(c.req.param("id")), c.get("userId"));
    if (!e) return c.json(NOT_FOUND("Kejadian"), 404);
    const body = ReportEvent.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json(err("invalid_input", body.error.message), 400);
    const reportedAt = deps.now().toISOString();
    await repo.reportEvent(e.id, body.data.status, reportedAt);
    return c.json({ ...e, user_report: body.data.status, reported_at: reportedAt });
  });

  /* ---------------- check-ins and summaries ---------------- */

  app.post("/check-ins", async (c) => {
    const body = CreateCheckIn.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json(err("invalid_input", body.error.message), 400);
    const ci: CheckIn = {
      id: crypto.randomUUID(),
      user_id: c.get("userId"),
      symptoms: body.data.symptoms,
      notes: body.data.notes ?? null,
      mode: MODE,
      created_at: deps.now().toISOString(),
    };
    await repo.saveCheckIn(ci);
    return c.json(ci, 201);
  });

  app.get("/check-ins", async (c) => {
    const since = new Date(deps.now().getTime() - 30 * DAY_MS).toISOString();
    return c.json(await repo.listCheckIns(c.get("userId"), since));
  });

  // A summary is a template over records that exist; nothing is inferred or filled in.
  app.post("/summaries", async (c) => {
    const body = CreateSummary.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) return c.json(err("invalid_input", body.error.message), 400);
    const userId = c.get("userId");
    const to = deps.now();
    const from = new Date(to.getTime() - (body.data.period_days ?? 14) * DAY_MS);
    const [checkIns, instructions, events] = await Promise.all([
      repo.listCheckIns(userId, from.toISOString()),
      repo.listInstructions(userId),
      repo.listEventsInRange(userId, from.getTime(), to.getTime()),
    ]);
    const summary: Summary = {
      id: crypto.randomUUID(),
      user_id: userId,
      mode: MODE,
      generated_at: to.toISOString(),
      content: {
        period_from: from.toISOString(),
        period_to: to.toISOString(),
        check_ins: checkIns.map((ci) => ({ created_at: ci.created_at, symptoms: ci.symptoms, notes: ci.notes })),
        instructions: instructions.map((i) => ({
          id: i.id,
          fields: i.fields,
          review_status: i.review_status,
          ambiguity_flags: i.ambiguity_flags,
        })),
        medication: {
          diminum: events.filter((e) => e.user_report === "diminum").length,
          dilewati: events.filter((e) => e.user_report === "dilewati").length,
          belum_dicatat: events.filter((e) => e.user_report === null).length,
        },
        sources: ["laporan-pengguna", "instruksi-yang-dimasukkan-pengguna"],
        notice:
          "Ringkasan dari catatan pengguna pada mode simulasi. Bukan penilaian klinis; instruksi belum divalidasi tenaga medis.",
      },
    };
    await repo.saveSummary(summary);
    return c.json(summary, 201);
  });

  app.get("/summaries/:id", async (c) => {
    const s = owned(await repo.getSummary(c.req.param("id")), c.get("userId"));
    return s ? c.json(s) : c.json(NOT_FOUND("Ringkasan"), 404);
  });
}
