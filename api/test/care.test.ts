import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { MemoryRepository } from "../src/repo";

const hdr = (u: string) => ({ "X-Demo-User": u, "Content-Type": "application/json" });
const NOW = new Date("2026-10-12T00:00:00Z");

const complete = { nama_obat: "Obat Contoh", dosis: 1, satuan: "tablet", frekuensi_per_hari: 2, durasi_hari: 3 };

function setup() {
  const repo = new MemoryRepository();
  const clock = { current: new Date(NOW) };
  const app = createApp(repo, { now: () => clock.current });
  const call = async (user: string, method: string, path: string, body?: unknown) => {
    const r = await app.request(path, {
      method,
      headers: hdr(user),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: r.status, body: (await r.json()) as any };
  };
  return { call, clock };
}

type Call = ReturnType<typeof setup>["call"];

async function confirmedInstruction(call: Call, user: string, fields: object = complete) {
  const created = await call(user, "POST", "/care-instructions", { source_text: "contoh sintetis", fields });
  expect(created.status).toBe(201);
  const confirmed = await call(user, "POST", `/care-instructions/${created.body.id}/confirm`);
  expect(confirmed.body.review_status).toBe("dikonfirmasi");
  return created.body.id as string;
}

const scheduleBody = (instruction_id: string, times = ["08:00", "20:00"]) => ({
  instruction_id,
  timezone: "Asia/Jakarta",
  start_date: "2026-10-13",
  times,
});

async function activeSchedule(call: Call, user = "a") {
  const iid = await confirmedInstruction(call, user);
  const s = await call(user, "POST", "/medication-schedules", scheduleBody(iid));
  expect(s.status).toBe(201);
  expect(s.body.status).toBe("tidak-aktif");
  const on = await call(user, "PATCH", `/medication-schedules/${s.body.id}`, { status: "aktif" });
  expect(on.status).toBe(200);
  return s.body.id as string;
}

describe("care instructions", () => {
  it("flags missing fields and never fills them in", async () => {
    const { call } = setup();
    const r = await call("a", "POST", "/care-instructions", {
      source_text: "minum obat",
      fields: { nama_obat: "Obat Contoh", dosis: 1, satuan: "tablet", frekuensi_per_hari: 2 },
    });
    expect(r.body.ambiguity_flags).toEqual(["kosong:durasi_hari"]);
    expect(r.body.fields.durasi_hari).toBeUndefined();
  });

  it("an ambiguous instruction can be confirmed but never becomes a schedule", async () => {
    const { call } = setup();
    const iid = await confirmedInstruction(call, "a", { ...complete, durasi_hari: null });
    const r = await call("a", "POST", "/medication-schedules", scheduleBody(iid));
    expect(r.status).toBe(422);
    expect(r.body.error.code).toBe("instruction_ambiguous");
  });

  it("an as-needed instruction is not turned into a routine schedule", async () => {
    const { call } = setup();
    const iid = await confirmedInstruction(call, "a", { ...complete, bila_perlu: true });
    const r = await call("a", "POST", "/medication-schedules", scheduleBody(iid));
    expect(r.status).toBe(422);
    expect(r.body.error.message).toContain("bila_perlu");
  });

  it("an unconfirmed draft cannot become a schedule", async () => {
    const { call } = setup();
    const created = await call("a", "POST", "/care-instructions", { source_text: "x", fields: complete });
    const r = await call("a", "POST", "/medication-schedules", scheduleBody(created.body.id));
    expect(r.status).toBe(422);
    expect(r.body.error.code).toBe("instruction_not_confirmed");
  });

  it("a confirmed instruction cannot be edited", async () => {
    const { call } = setup();
    const iid = await confirmedInstruction(call, "a");
    const r = await call("a", "PATCH", `/care-instructions/${iid}`, { fields: { dosis: 2 } });
    expect(r.status).toBe(409);
  });

  it("rejects unknown or invalid instruction fields", async () => {
    const { call } = setup();
    for (const fields of [{ dosis: "satu" }, { durasi_hari: 0 }, { harga: 10 }]) {
      const r = await call("a", "POST", "/care-instructions", { source_text: "x", fields });
      expect(r.status).toBe(400);
    }
  });

  it("rejects a time list that does not match the frequency", async () => {
    const { call } = setup();
    const iid = await confirmedInstruction(call, "a");
    const r = await call("a", "POST", "/medication-schedules", scheduleBody(iid, ["08:00"]));
    expect(r.status).toBe(422);
    expect(r.body.error.code).toBe("times_mismatch");
  });
});

describe("medication schedules and events", () => {
  it("creates no events until activated, then exactly frequency x days", async () => {
    const { call } = setup();
    const iid = await confirmedInstruction(call, "a");
    const s = await call("a", "POST", "/medication-schedules", scheduleBody(iid));
    expect((await call("a", "GET", `/medication-schedules/${s.body.id}/events`)).body).toHaveLength(0);
    await call("a", "PATCH", `/medication-schedules/${s.body.id}`, { status: "aktif" });
    const events = (await call("a", "GET", `/medication-schedules/${s.body.id}/events`)).body;
    expect(events).toHaveLength(6);
    expect(events[0].planned_at).toBe("2026-10-13T08:00:00+07:00");
    expect(events.every((e: any) => e.user_report === null)).toBe(true);
  });

  it("re-activating or retrying never duplicates events", async () => {
    const { call } = setup();
    const sid = await activeSchedule(call);
    await call("a", "PATCH", `/medication-schedules/${sid}`, { status: "aktif" });
    await call("a", "PATCH", `/medication-schedules/${sid}`, { status: "aktif" });
    const events = (await call("a", "GET", `/medication-schedules/${sid}/events`)).body;
    expect(events).toHaveLength(6);
    expect(new Set(events.map((e: any) => e.id)).size).toBe(6);
  });

  it("changing times replaces unreported future events and keeps reported ones", async () => {
    const { call } = setup();
    const sid = await activeSchedule(call);
    const first = (await call("a", "GET", `/medication-schedules/${sid}/events`)).body[0];
    await call("a", "POST", `/medication-events/${first.id}/report`, { status: "diminum" });

    const edited = await call("a", "PATCH", `/medication-schedules/${sid}`, { times: ["09:00", "21:00"] });
    expect(edited.body.version).toBe(2);

    const events = (await call("a", "GET", `/medication-schedules/${sid}/events`)).body;
    const reported = events.filter((e: any) => e.user_report !== null);
    expect(reported).toHaveLength(1);
    expect(reported[0].id).toBe(first.id);
    // 1 kept + 6 regenerated, none of the old unreported 08:00/20:00 slots remain
    expect(events).toHaveLength(7);
    expect(events.filter((e: any) => e.user_report === null && /T(08|20):00/.test(e.planned_at))).toHaveLength(0);
    expect(new Set(events.map((e: any) => e.id)).size).toBe(7);
  });

  it("pausing drops unreported future events; stopping is terminal", async () => {
    const { call } = setup();
    const sid = await activeSchedule(call);
    const first = (await call("a", "GET", `/medication-schedules/${sid}/events`)).body[0];
    await call("a", "POST", `/medication-events/${first.id}/report`, { status: "dilewati" });

    await call("a", "PATCH", `/medication-schedules/${sid}`, { status: "jeda" });
    expect((await call("a", "GET", `/medication-schedules/${sid}/events`)).body).toHaveLength(1);

    await call("a", "PATCH", `/medication-schedules/${sid}`, { status: "dihentikan" });
    const again = await call("a", "PATCH", `/medication-schedules/${sid}`, { status: "aktif" });
    expect(again.status).toBe(409);
    expect((await call("a", "GET", `/medication-schedules/${sid}/events`)).body).toHaveLength(1);
  });

  it("an inactive schedule cannot jump straight to paused", async () => {
    const { call } = setup();
    const iid = await confirmedInstruction(call, "a");
    const s = await call("a", "POST", "/medication-schedules", scheduleBody(iid));
    const r = await call("a", "PATCH", `/medication-schedules/${s.body.id}`, { status: "jeda" });
    expect(r.status).toBe(409);
  });

  it("an unreported dose stays null and is never counted as skipped", async () => {
    const { call, clock } = setup();
    const sid = await activeSchedule(call);
    const events = (await call("a", "GET", `/medication-schedules/${sid}/events`)).body;
    await call("a", "POST", `/medication-events/${events[0].id}/report`, { status: "diminum" });

    clock.current = new Date("2026-10-14T00:00:00Z");
    const summary = await call("a", "POST", "/summaries", { period_days: 7 });
    expect(summary.status).toBe(201);
    const m = summary.body.content.medication;
    expect(m.diminum).toBe(1);
    expect(m.dilewati).toBe(0);
    expect(m.belum_dicatat).toBeGreaterThan(0);
    expect(summary.body.mode).toBe("simulasi");
  });
});

describe("check-ins and summaries", () => {
  it("records a check-in and includes only existing data in the summary", async () => {
    const { call } = setup();
    const ci = await call("a", "POST", "/check-ins", { symptoms: { demam: true }, notes: "catatan sintetis" });
    expect(ci.status).toBe(201);
    const s = await call("a", "POST", "/summaries", {});
    expect(s.body.content.check_ins).toHaveLength(1);
    expect(s.body.content.check_ins[0].symptoms).toEqual({ demam: true });
    expect(s.body.content.instructions).toHaveLength(0);
    expect(s.body.content.medication).toEqual({ diminum: 0, dilewati: 0, belum_dicatat: 0 });
    const got = await call("a", "GET", `/summaries/${s.body.id}`);
    expect(got.status).toBe(200);
  });

  it("rejects invalid check-in symptoms", async () => {
    const { call } = setup();
    const r = await call("a", "POST", "/check-ins", { symptoms: { demam: "ya" } });
    expect(r.status).toBe(400);
  });
});

describe("ownership across care objects", () => {
  it("another user gets 404 on every object", async () => {
    const { call } = setup();
    const iid = await confirmedInstruction(call, "a");
    const sid = await activeSchedule(call, "a");
    const event = (await call("a", "GET", `/medication-schedules/${sid}/events`)).body[0];
    const summary = await call("a", "POST", "/summaries", {});

    const attempts: [string, string, unknown?][] = [
      ["PATCH", `/care-instructions/${iid}`, { fields: { dosis: 2 } }],
      ["POST", `/care-instructions/${iid}/confirm`],
      ["POST", "/medication-schedules", scheduleBody(iid)],
      ["GET", `/medication-schedules/${sid}`],
      ["GET", `/medication-schedules/${sid}/events`],
      ["PATCH", `/medication-schedules/${sid}`, { status: "jeda" }],
      ["POST", `/medication-events/${event.id}/report`, { status: "diminum" }],
      ["GET", `/summaries/${summary.body.id}`],
    ];
    for (const [method, path, body] of attempts) {
      const r = await call("b", method, path, body);
      expect([method, path, r.status]).toEqual([method, path, 404]);
    }
    // and the owner's data was not changed by those attempts
    expect((await call("a", "GET", `/medication-schedules/${sid}`)).body.status).toBe("aktif");
  });
});
