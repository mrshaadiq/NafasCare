import { z } from "zod";

export const MODE = "simulasi" as const;
export const RULE_STATUS = "draf-belum-ditinjau" as const;

export const TriageOutcome = z.enum([
  "perlu-pertolongan-segera",
  "perlu-konsultasi",
  "pemantauan",
  "belum-dapat-dinilai",
]);
export type TriageOutcome = z.infer<typeof TriageOutcome>;

/**
 * One schema per known question id. Unknown keys are rejected, so a typo can never be
 * mistaken for "no danger sign". null means "not available", never "normal".
 */
export const Answers = z
  .object({
    durasi_hari: z.number().int().min(0).max(365).nullable(),
    demam: z.boolean().nullable(),
    sesak_berat_saat_istirahat: z.boolean().nullable(),
    nyeri_dada: z.boolean().nullable(),
    bibir_biru: z.boolean().nullable(),
    kesadaran_menurun: z.boolean().nullable(),
    batuk_darah: z.boolean().nullable(),
  })
  .partial()
  .strict();
export type Answers = z.infer<typeof Answers>;

export const CONSENT_PURPOSE = "skrining-awal" as const;

export const CreateConsent = z.object({
  purpose: z.literal(CONSENT_PURPOSE),
  notice_version: z.string().min(1).max(40),
});
export type CreateConsent = z.infer<typeof CreateConsent>;

export interface Consent {
  id: string;
  user_id: string;
  purpose: typeof CONSENT_PURPOSE;
  notice_version: string;
  granted_at: string;
}

export const CreateScreening = z.object({
  age: z.number().int().min(0).max(120).nullable().optional(),
});
export type CreateScreening = z.infer<typeof CreateScreening>;

export const AnswerPatch = z.object({
  answers: Answers,
});
export type AnswerPatch = z.infer<typeof AnswerPatch>;

export const TriageResult = z.object({
  screening_id: z.string(),
  outcome: TriageOutcome,
  reasons: z.array(z.string()),
  missing_fields: z.array(z.string()),
  protocol_version: z.string(),
  rule_status: z.literal(RULE_STATUS),
  mode: z.literal(MODE),
  created_at: z.string(),
});
export type TriageResult = z.infer<typeof TriageResult>;

export const ScreeningStatus = z.enum(["berjalan", "selesai"]);
export type ScreeningStatus = z.infer<typeof ScreeningStatus>;

export interface Screening {
  id: string;
  user_id: string;
  status: ScreeningStatus;
  mode: typeof MODE;
  age: number | null;
  answers: Answers;
  created_at: string;
  completed_at: string | null;
}

export interface ApiError {
  error: { code: string; message: string };
}

/* ---------- Care instructions, schedules, events, check-ins, summaries ---------- */

export const Timezone = z.enum(["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"]);
export type Timezone = z.infer<typeof Timezone>;

/** null/absent means the source did not state it; the system never guesses (10.5). */
export const InstructionFields = z
  .object({
    nama_obat: z.string().min(1).max(100).nullable(),
    dosis: z.number().positive().max(10000).nullable(),
    satuan: z.string().min(1).max(20).nullable(),
    frekuensi_per_hari: z.number().int().min(1).max(6).nullable(),
    durasi_hari: z.number().int().min(1).max(365).nullable(),
    bila_perlu: z.boolean().nullable(),
  })
  .partial()
  .strict();
export type InstructionFields = z.infer<typeof InstructionFields>;

export const CreateInstruction = z.object({
  source_text: z.string().min(1).max(2000),
  fields: InstructionFields,
});
export type CreateInstruction = z.infer<typeof CreateInstruction>;

export const PatchInstruction = z.object({ fields: InstructionFields });
export type PatchInstruction = z.infer<typeof PatchInstruction>;

export const ReviewStatus = z.enum(["draf", "dikonfirmasi"]);
export type ReviewStatus = z.infer<typeof ReviewStatus>;

export interface CareInstruction {
  id: string;
  user_id: string;
  source_text: string;
  fields: InstructionFields;
  ambiguity_flags: string[];
  review_status: ReviewStatus;
  mode: typeof MODE;
  created_at: string;
  confirmed_at: string | null;
}

const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const YMD = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v));

export const CreateSchedule = z.object({
  instruction_id: z.string().min(1),
  timezone: Timezone,
  start_date: YMD,
  times: z.array(HHMM).min(1).max(6),
});
export type CreateSchedule = z.infer<typeof CreateSchedule>;

export const ScheduleStatus = z.enum(["tidak-aktif", "aktif", "jeda", "dihentikan"]);
export type ScheduleStatus = z.infer<typeof ScheduleStatus>;

export const PatchSchedule = z
  .object({
    status: z.enum(["aktif", "jeda", "dihentikan"]),
    timezone: Timezone,
    start_date: YMD,
    times: z.array(HHMM).min(1).max(6),
  })
  .partial()
  .strict();
export type PatchSchedule = z.infer<typeof PatchSchedule>;

export interface MedicationSchedule {
  id: string;
  user_id: string;
  instruction_id: string;
  timezone: Timezone;
  start_date: string;
  times: string[];
  status: ScheduleStatus;
  version: number;
  mode: typeof MODE;
  created_at: string;
}

export const MedicationReport = z.enum(["diminum", "dilewati"]);
export type MedicationReport = z.infer<typeof MedicationReport>;

export const ReportEvent = z.object({ status: MedicationReport });

export interface MedicationEvent {
  id: string;
  schedule_id: string;
  user_id: string;
  planned_at: string;
  /** null = belum dicatat. Never interpreted as "dilewati". */
  user_report: MedicationReport | null;
  reported_at: string | null;
}

export const CreateCheckIn = z.object({
  symptoms: Answers,
  notes: z.string().max(500).optional(),
});
export type CreateCheckIn = z.infer<typeof CreateCheckIn>;

export interface CheckIn {
  id: string;
  user_id: string;
  symptoms: Answers;
  notes: string | null;
  mode: typeof MODE;
  created_at: string;
}

export const CreateSummary = z.object({ period_days: z.number().int().min(1).max(90).optional() });
export type CreateSummary = z.infer<typeof CreateSummary>;

export interface SummaryContent {
  period_from: string;
  period_to: string;
  check_ins: { created_at: string; symptoms: Answers; notes: string | null }[];
  instructions: { id: string; fields: InstructionFields; review_status: ReviewStatus; ambiguity_flags: string[] }[];
  medication: { diminum: number; dilewati: number; belum_dicatat: number };
  sources: string[];
  notice: string;
}

export interface Summary {
  id: string;
  user_id: string;
  mode: typeof MODE;
  generated_at: string;
  content: SummaryContent;
}

/* ---------- Research audio samples (annotation-derived, not a model) ---------- */

export const AttachAudio = z.object({ sample_id: z.string().min(1).max(80) });
export type AttachAudio = z.infer<typeof AttachAudio>;

export const AudioPattern = z.enum(["wheeze", "crackle", "crackle-dan-wheeze", "tidak-terdeteksi"]);
export type AudioPattern = z.infer<typeof AudioPattern>;

export interface AudioSampleInfo {
  id: string;
  device: string;
  site: string;
  duration_s: number;
  sample_rate_hz: number;
  cycles: number;
  note: string;
}

export interface AudioResult {
  screening_id: string;
  sample_id: string;
  /** Always "anotasi-dataset": the pattern comes from the dataset's labels, not a model. */
  source: "anotasi-dataset";
  source_label: string;
  status: "diterima" | "ditolak";
  rejection_reason: string | null;
  /** null when rejected. Never a disease and never a percentage. */
  pattern: AudioPattern | null;
  cycles: number;
  cycles_with_crackle: number;
  cycles_with_wheeze: number;
  device: string;
  site: string;
  model_version: null;
  mode: typeof MODE;
  notice: string;
  created_at: string;
}
