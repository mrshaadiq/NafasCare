import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { MemoryRepository } from "../src/repo";

const hdr = (u: string) => ({ "X-Demo-User": u, "Content-Type": "application/json" });
const consentBody = JSON.stringify({ purpose: "skrining-awal", notice_version: "v1" });

type App = ReturnType<typeof createApp>;

async function grantConsent(app: App, user: string) {
  const r = await app.request("/consents", { method: "POST", headers: hdr(user), body: consentBody });
  expect(r.status).toBe(201);
}

async function createScreening(app: App, user: string, body: unknown = { age: 30 }) {
  const r = await app.request("/screenings", { method: "POST", headers: hdr(user), body: JSON.stringify(body) });
  return ((await r.json()) as { id: string }).id;
}

const patch = (app: App, user: string, id: string, answers: unknown) =>
  app.request(`/screenings/${id}/answers`, {
    method: "PATCH",
    headers: hdr(user),
    body: JSON.stringify({ answers }),
  });

describe("screening flow", () => {
  it("consent -> POST -> PATCH -> complete -> GET returns simulated result", async () => {
    const app = createApp(new MemoryRepository());
    await grantConsent(app, "user-a");
    const id = await createScreening(app, "user-a");
    expect((await patch(app, "user-a", id, { durasi_hari: 3, demam: false })).status).toBe(200);
    const done = await app.request(`/screenings/${id}/complete`, { method: "POST", headers: hdr("user-a") });
    expect(done.status).toBe(200);
    const res = await app.request(`/screenings/${id}/result`, { headers: hdr("user-a") });
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.mode).toBe("simulasi");
    expect(body.rule_status).toBe("draf-belum-ditinjau");
    expect(body.protocol_version).toBe("v1-draf");
  });

  it("complete is refused without consent", async () => {
    const app = createApp(new MemoryRepository());
    const id = await createScreening(app, "user-a");
    const r = await app.request(`/screenings/${id}/complete`, { method: "POST", headers: hdr("user-a") });
    expect(r.status).toBe(403);
    expect(((await r.json()) as { error: { code: string } }).error.code).toBe("consent_required");
  });

  it("consent of another user does not count", async () => {
    const app = createApp(new MemoryRepository());
    await grantConsent(app, "user-b");
    const id = await createScreening(app, "user-a");
    const r = await app.request(`/screenings/${id}/complete`, { method: "POST", headers: hdr("user-a") });
    expect(r.status).toBe(403);
  });

  it("completing twice is a conflict and keeps the first result", async () => {
    const app = createApp(new MemoryRepository());
    await grantConsent(app, "user-a");
    const id = await createScreening(app, "user-a");
    await patch(app, "user-a", id, { durasi_hari: 3, demam: false });
    const first = await app.request(`/screenings/${id}/complete`, { method: "POST", headers: hdr("user-a") });
    const firstBody = (await first.json()) as { created_at: string };
    const second = await app.request(`/screenings/${id}/complete`, { method: "POST", headers: hdr("user-a") });
    expect(second.status).toBe(409);
    const res = await app.request(`/screenings/${id}/result`, { headers: hdr("user-a") });
    expect(((await res.json()) as { created_at: string }).created_at).toBe(firstBody.created_at);
  });

  it("rejects invalid or unknown answers instead of storing them", async () => {
    const app = createApp(new MemoryRepository());
    const id = await createScreening(app, "user-a");
    for (const answers of [
      { durasi_hari: "abc" },
      { durasi_hari: -1 },
      { nyeri_dada: "true" },
      { nyeri_dada: 1 },
      { nyeri_dada_typo: true },
    ]) {
      expect((await patch(app, "user-a", id, answers)).status).toBe(400);
    }
  });

  it("another user cannot open or change the object", async () => {
    const app = createApp(new MemoryRepository());
    const id = await createScreening(app, "user-a", {});
    for (const [method, path] of [
      ["GET", `/screenings/${id}/result`],
      ["PATCH", `/screenings/${id}/answers`],
      ["POST", `/screenings/${id}/complete`],
    ] as const) {
      const r = await app.request(path, { method, headers: hdr("user-b"), body: method === "GET" ? undefined : "{}" });
      expect(r.status).toBe(404);
    }
  });

  it("repo failure returns an error, never a saved state", async () => {
    const repo = new MemoryRepository();
    repo.createScreening = async () => {
      throw new Error("db down");
    };
    const app = createApp(repo);
    const r = await app.request("/screenings", { method: "POST", headers: hdr("user-a"), body: "{}" });
    expect(r.status).toBe(500);
    expect(((await r.json()) as { error: { code: string } }).error.code).toBe("internal");
  });

  it("answers the CORS preflight without an identity header", async () => {
    const app = createApp(new MemoryRepository());
    const r = await app.request("/screenings", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "x-demo-user,content-type",
      },
    });
    expect(r.status).toBe(204);
    expect(r.headers.get("Access-Control-Allow-Headers")?.toLowerCase()).toContain("x-demo-user");
  });
});
