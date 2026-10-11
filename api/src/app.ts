import { Hono } from "hono";
import {
  AnswerPatch,
  CreateScreening,
  MODE,
  RULE_STATUS,
  type ApiError,
  type Screening,
  type TriageResult,
} from "../../shared/types";
import { PROTOCOL_VERSION, triage } from "./domain/triage";
import type { Repository } from "./repo";

type Env = { Variables: { userId: string } };

const err = (code: string, message: string): ApiError => ({ error: { code, message } });

/** Owner check: a foreign object is indistinguishable from a missing one (404). */
async function loadOwned(repo: Repository, id: string, userId: string): Promise<Screening | null> {
  const s = await repo.getScreening(id);
  return s && s.user_id === userId ? s : null;
}

export function createApp(repo: Repository) {
  const app = new Hono<Env>();

  app.use("*", async (c, next) => {
    const userId = c.req.header("X-Demo-User");
    if (!userId) return c.json(err("unauthenticated", "Header X-Demo-User wajib (identitas sintetis)."), 401);
    c.set("userId", userId);
    await next();
  });

  app.onError((e, c) => {
    console.error("internal error", e.name);
    return c.json(err("internal", "Terjadi kesalahan; data tidak tersimpan."), 500);
  });

  app.post("/screenings", async (c) => {
    const body = CreateScreening.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) return c.json(err("invalid_input", body.error.message), 400);
    const s: Screening = {
      id: crypto.randomUUID(),
      user_id: c.get("userId"),
      status: "berjalan",
      mode: MODE,
      age: body.data.age ?? null,
      answers: {},
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    await repo.createScreening(s);
    return c.json(s, 201);
  });

  app.patch("/screenings/:id/answers", async (c) => {
    const s = await loadOwned(repo, c.req.param("id"), c.get("userId"));
    if (!s) return c.json(err("not_found", "Skrining tidak ditemukan."), 404);
    if (s.status === "selesai") return c.json(err("conflict", "Skrining sudah selesai."), 409);
    const body = AnswerPatch.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json(err("invalid_input", body.error.message), 400);
    s.answers = { ...s.answers, ...body.data.answers };
    await repo.updateScreening(s);
    return c.json(s);
  });

  app.post("/screenings/:id/complete", async (c) => {
    const s = await loadOwned(repo, c.req.param("id"), c.get("userId"));
    if (!s) return c.json(err("not_found", "Skrining tidak ditemukan."), 404);
    const decision = triage({ age: s.age, answers: s.answers });
    const now = new Date().toISOString();
    const result: TriageResult = {
      screening_id: s.id,
      ...decision,
      protocol_version: PROTOCOL_VERSION,
      rule_status: RULE_STATUS,
      mode: MODE,
      created_at: now,
    };
    await repo.saveResult(result);
    await repo.updateScreening({ ...s, status: "selesai", completed_at: now });
    return c.json(result);
  });

  app.get("/screenings/:id/result", async (c) => {
    const s = await loadOwned(repo, c.req.param("id"), c.get("userId"));
    if (!s) return c.json(err("not_found", "Skrining tidak ditemukan."), 404);
    const r = await repo.getResult(s.id);
    if (!r) return c.json(err("not_ready", "Hasil belum tersedia."), 409);
    return c.json(r);
  });

  return app;
}
