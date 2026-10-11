import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { MemoryRepository } from "../src/repo";

const hdr = (u: string) => ({ "X-Demo-User": u, "Content-Type": "application/json" });

describe("screening flow", () => {
  it("POST -> PATCH -> complete -> GET returns simulated result", async () => {
    const app = createApp(new MemoryRepository());
    const created = await app.request("/screenings", {
      method: "POST",
      headers: hdr("user-a"),
      body: JSON.stringify({ age: 30 }),
    });
    const { id } = await created.json() as { id: string };
    await app.request(`/screenings/${id}/answers`, {
      method: "PATCH",
      headers: hdr("user-a"),
      body: JSON.stringify({ answers: { durasi_hari: 3, demam: false } }),
    });
    const done = await app.request(`/screenings/${id}/complete`, { method: "POST", headers: hdr("user-a") });
    expect(done.status).toBe(200);
    const res = await app.request(`/screenings/${id}/result`, { headers: hdr("user-a") });
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.mode).toBe("simulasi");
    expect(body.rule_status).toBe("draf-belum-ditinjau");
    expect(body.protocol_version).toBe("v1-draf");
  });

  it("another user cannot open or change the object", async () => {
    const app = createApp(new MemoryRepository());
    const { id } = await (
      await app.request("/screenings", { method: "POST", headers: hdr("user-a"), body: "{}" })
    ).json() as { id: string };
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
});
