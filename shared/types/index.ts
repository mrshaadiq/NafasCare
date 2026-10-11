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

/** Answers are free-keyed by question id; null/absent means "not available", never "normal". */
export const AnswerValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export const Answers = z.record(AnswerValue);
export type Answers = z.infer<typeof Answers>;

export const CreateScreening = z.object({
  age: z.number().int().min(0).max(120).optional(),
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
