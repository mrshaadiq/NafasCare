import { describe, expect, it } from "vitest";
import { triage } from "../src/domain/triage";

const ok = { durasi_hari: 3, demam: false };

describe("triage", () => {
  it("danger sign wins even when other answers are mild", () => {
    const r = triage({ age: 30, answers: { ...ok, nyeri_dada: true } });
    expect(r.outcome).toBe("perlu-pertolongan-segera");
  });

  it("danger sign is urgent even with missing fields", () => {
    const r = triage({ age: 30, answers: { bibir_biru: true } });
    expect(r.outcome).toBe("perlu-pertolongan-segera");
    expect(r.missing_fields).toEqual(["durasi_hari", "demam"]);
  });

  it("audio-like extra input cannot lower an urgent outcome", () => {
    const r = triage({ age: 30, answers: { ...ok, nyeri_dada: true, audio_normal: true } });
    expect(r.outcome).toBe("perlu-pertolongan-segera");
  });

  it("child with a danger sign still gets the urgent direction", () => {
    const r = triage({ age: 10, answers: { ...ok, nyeri_dada: true } });
    expect(r.outcome).toBe("perlu-pertolongan-segera");
    expect(r.reasons.join(" ")).toContain("Di luar cakupan dewasa");
  });

  it("unknown age with a danger sign still gets the urgent direction", () => {
    const r = triage({ age: null, answers: { bibir_biru: true } });
    expect(r.outcome).toBe("perlu-pertolongan-segera");
    expect(r.missing_fields).toContain("age");
  });

  it("out-of-scope age without danger signs gets no score", () => {
    const r = triage({ age: 10, answers: ok });
    expect(r.outcome).toBe("belum-dapat-dinilai");
  });

  it("missing fields are reported, not assumed", () => {
    const r = triage({ age: 30, answers: { durasi_hari: 2 } });
    expect(r.outcome).toBe("belum-dapat-dinilai");
    expect(r.missing_fields).toEqual(["demam"]);
  });

  it("an invalid duration is treated as missing, never as a low result", () => {
    for (const bad of ["abc", -1, 2.5, NaN]) {
      const r = triage({ age: 30, answers: { durasi_hari: bad, demam: false } });
      expect(r.outcome).toBe("belum-dapat-dinilai");
      expect(r.missing_fields).toEqual(["durasi_hari"]);
    }
  });

  it("low result is not worded as disease-free", () => {
    const r = triage({ age: 30, answers: ok });
    expect(r.outcome).toBe("pemantauan");
    expect(r.reasons.join(" ")).toContain("bukan pernyataan bebas penyakit");
  });
});
