import type { TriageOutcome } from "../../../shared/types";

/** DRAFT rule set. Not clinically reviewed; contents await a reviewer (open question #2). */
export const PROTOCOL_VERSION = "v1-draf";

export const ADULT_MIN_AGE = 18;

export const DANGER_SIGNS: Record<string, string> = {
  sesak_berat_saat_istirahat: "Sesak berat saat istirahat",
  nyeri_dada: "Nyeri dada",
  bibir_biru: "Bibir atau wajah kebiruan",
  kesadaran_menurun: "Kesadaran menurun",
  batuk_darah: "Batuk berdarah",
};

export const REQUIRED_FIELDS = ["durasi_hari", "demam"] as const;

export interface TriageInput {
  age: number | null;
  /** Deliberately loose: the rule never trusts types, so bad data degrades to "missing". */
  answers: Record<string, unknown>;
}

export interface TriageDecision {
  outcome: TriageOutcome;
  reasons: string[];
  missing_fields: string[];
}

const isValidDuration = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0;
const isValidBool = (v: unknown) => typeof v === "boolean";

const FIELD_VALID: Record<(typeof REQUIRED_FIELDS)[number], (v: unknown) => boolean> = {
  durasi_hari: isValidDuration,
  demam: isValidBool,
};

/**
 * Pure function. Order is fixed: danger signs -> scope -> missing data -> consult/monitor.
 * Danger signs apply to everyone, including out-of-scope or unknown age (FR-04, 7.5).
 * Audio is deliberately not an input, so it can never lower an urgent outcome.
 */
export function triage({ age, answers }: TriageInput): TriageDecision {
  const missing = REQUIRED_FIELDS.filter((f) => !FIELD_VALID[f](answers[f])) as string[];
  const outOfScope = age !== null && age < ADULT_MIN_AGE;

  const present = Object.entries(DANGER_SIGNS).filter(([k]) => answers[k] === true);
  if (present.length > 0) {
    const reasons = present.map(([, label]) => label);
    if (age === null) reasons.push("Usia belum diisi; arahan segera tetap berlaku.");
    if (outOfScope) reasons.push("Di luar cakupan dewasa; arahan segera tetap berlaku.");
    return {
      outcome: "perlu-pertolongan-segera",
      reasons,
      missing_fields: age === null ? ["age", ...missing] : missing,
    };
  }

  if (age === null || outOfScope) {
    return {
      outcome: "belum-dapat-dinilai",
      reasons: [
        age === null
          ? "Usia belum diisi; cakupan MVP adalah dewasa."
          : "Di luar cakupan dewasa; tidak ada skor. Cari bantuan tenaga medis bila ada keluhan napas.",
      ],
      missing_fields: age === null ? ["age", ...missing] : missing,
    };
  }

  if (missing.length > 0) {
    return {
      outcome: "belum-dapat-dinilai",
      reasons: ["Informasi belum lengkap; tidak diisi dengan asumsi."],
      missing_fields: missing,
    };
  }

  const reasons: string[] = [];
  if ((answers.durasi_hari as number) >= 14) reasons.push("Keluhan berlangsung 14 hari atau lebih");
  if (answers.demam === true) reasons.push("Ada demam");

  return reasons.length > 0
    ? { outcome: "perlu-konsultasi", reasons, missing_fields: [] }
    : {
        outcome: "pemantauan",
        reasons: ["Tidak ada tanda bahaya pada jawaban yang tersedia; ini bukan pernyataan bebas penyakit."],
        missing_fields: [],
      };
}
