import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { describeSample, listSamples } from "../src/domain/audio";
import { MemoryRepository } from "../src/repo";

const hdr = (u: string) => ({ "X-Demo-User": u, "Content-Type": "application/json" });

async function setup(user = "a", consent = true) {
  const app = createApp(new MemoryRepository());
  if (consent) {
    await app.request("/consents", {
      method: "POST",
      headers: hdr(user),
      body: JSON.stringify({ purpose: "skrining-awal", notice_version: "v1" }),
    });
  }
  const s = await app.request("/screenings", { method: "POST", headers: hdr(user), body: '{"age":30}' });
  const { id } = (await s.json()) as { id: string };
  const attach = (sample_id: string, u = user) =>
    app.request(`/screenings/${id}/audio`, { method: "POST", headers: hdr(u), body: JSON.stringify({ sample_id }) });
  return { app, id, attach };
}

describe("audio sample domain", () => {
  it("derives patterns from annotations, and rejects below the demo sample rate", () => {
    const byPattern = Object.fromEntries(
      listSamples().map((s) => [s.id, describeSample(s.id, "x", "2026-10-12T00:00:00Z")!]),
    );
    expect(byPattern["103_2b2_Ar_mc_LittC2SE"]!.pattern).toBe("wheeze");
    expect(byPattern["107_2b3_Al_mc_AKGC417L"]!.pattern).toBe("crackle");
    expect(byPattern["107_2b3_Ar_mc_AKGC417L"]!.pattern).toBe("crackle-dan-wheeze");
    expect(byPattern["101_1b1_Al_sc_Meditron"]!.pattern).toBe("tidak-terdeteksi");
    const rejected = byPattern["104_1b1_Al_sc_Litt3200"]!;
    expect(rejected.status).toBe("ditolak");
    expect(rejected.pattern).toBeNull();
    expect(rejected.rejection_reason).toContain("4000 Hz");
  });

  it("never claims a model, a disease, or a healthy user", () => {
    for (const s of listSamples()) {
      const r = describeSample(s.id, "x", "2026-10-12T00:00:00Z")!;
      expect(r.source).toBe("anotasi-dataset");
      expect(r.model_version).toBe(r.model?.model_version ?? null);
      expect(r.mode).toBe("simulasi");
      expect(r.notice).toContain("bukan prediksi model");
      expect(JSON.stringify(r)).not.toMatch(/confidence|probabilit|persen/i);
    }
    const none = describeSample("101_1b1_Al_sc_Meditron", "x", "t")!;
    expect(none.notice).toContain("bukan bukti bahwa pengguna sehat");
  });
});

describe("offline model output", () => {
  it("is separate from the annotation pattern and is never attached to a rejected sample", () => {
    for (const s of listSamples()) {
      const r = describeSample(s.id, "x", "2026-10-12T00:00:00Z")!;
      if (r.status === "ditolak") {
        expect(r.model).toBeNull();
        expect(r.model_version).toBeNull();
        continue;
      }
      if (!r.model) continue; // manifest generated without ml/predict_manifest.py
      expect(r.model.model_version).toBeTruthy();
      expect(r.model.cycles_matching_annotation).toBeLessThanOrEqual(r.model.cycles);
      const predicted = Object.values(r.model.cycles_predicted).reduce((a, b) => a + b, 0);
      expect(predicted).toBe(r.model.cycles);
      expect(r.model.cycles).toBe(r.cycles);
      expect(typeof r.model.in_training_data).toBe("boolean");
      expect(r.notice).toContain("belum divalidasi klinis");
      expect(r.notice).toContain("tidak dipakai oleh aturan triase");
    }
  });
});

describe("audio endpoints", () => {
  it("lists the curated samples", async () => {
    const { app } = await setup();
    const r = await app.request("/audio-samples", { headers: hdr("a") });
    expect(r.status).toBe(200);
    expect(((await r.json()) as unknown[]).length).toBe(listSamples().length);
  });

  it("attaches a sample and reads it back", async () => {
    const { app, id, attach } = await setup();
    const r = await attach("107_2b3_Ar_mc_AKGC417L");
    expect(r.status).toBe(201);
    const got = await app.request(`/screenings/${id}/audio`, { headers: hdr("a") });
    expect(((await got.json()) as { pattern: string }).pattern).toBe("crackle-dan-wheeze");
  });

  it("an unknown sample is refused, not guessed", async () => {
    const { attach } = await setup();
    expect((await attach("../../etc/passwd")).status).toBe(404);
  });

  it("requires consent and ownership", async () => {
    const noConsent = await setup("a", false);
    expect((await noConsent.attach("101_1b1_Al_sc_Meditron")).status).toBe(403);
    const owned = await setup();
    expect((await owned.attach("101_1b1_Al_sc_Meditron", "b")).status).toBe(404);
  });

  it("a normal-looking audio result cannot lower an urgent triage outcome", async () => {
    const { app, id, attach } = await setup();
    await attach("101_1b1_Al_sc_Meditron");
    await app.request(`/screenings/${id}/answers`, {
      method: "PATCH",
      headers: hdr("a"),
      body: JSON.stringify({ answers: { durasi_hari: 2, demam: false, nyeri_dada: true } }),
    });
    const done = await app.request(`/screenings/${id}/complete`, { method: "POST", headers: hdr("a") });
    expect(((await done.json()) as { outcome: string }).outcome).toBe("perlu-pertolongan-segera");
  });
});
