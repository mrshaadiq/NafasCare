import type { Answers, TriageOutcome } from "../../../shared/types";

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
  answers: Answers;
}

export interface TriageDecision {
  outcome: TriageOutcome;
  reasons: string[];
  missing_fields: string[];
}

const isAnswered = (v: unknown) => v !== undefined && v !== null && v !== "";

/**
 * Pure function. Order is fixed: scope -> danger signs -> missing data -> consult/monitor.
 * Audio is deliberately not an input, so it can never lower an urgent outcome.
 */
export function triage({ age, answers }: TriageInput): TriageDecision {
  const missing_fields = REQUIRED_FIELDS.filter((f) => !isAnswered(answers[f]));

  if (age === null || age < ADULT_MIN_AGE) {
    return {
      outcome: "belum-dapat-dinilai",
      reasons: [
        age === null
          ? "Usia belum diisi; cakupan MVP adalah dewasa."
          : "Di luar cakupan dewasa; tidak ada skor. Cari bantuan tenaga medis bila ada keluhan napas.",
      ],
      missing_fields: age === null ? ["age", ...missing_fields] : missing_fields,
    };
  }

  const present = Object.entries(DANGER_SIGNS).filter(([k]) => answers[k] === true);
  if (present.length > 0) {
    return {
      outcome: "perlu-pertolongan-segera",
      reasons: present.map(([, label]) => label),
      missing_fields,
    };
  }

  if (missing_fields.length > 0) {
    return {
      outcome: "belum-dapat-dinilai",
      reasons: ["Informasi belum lengkap; tidak diisi dengan asumsi."],
      missing_fields,
    };
  }

  const reasons: string[] = [];
  const durasi = Number(answers.durasi_hari);
  if (durasi >= 14) reasons.push("Keluhan berlangsung 14 hari atau lebih");
  if (answers.demam === true) reasons.push("Ada demam");

  return reasons.length > 0
    ? { outcome: "perlu-konsultasi", reasons, missing_fields: [] }
    : {
        outcome: "pemantauan",
        reasons: ["Tidak ada tanda bahaya pada jawaban yang tersedia; ini bukan pernyataan bebas penyakit."],
        missing_fields: [],
      };
}
