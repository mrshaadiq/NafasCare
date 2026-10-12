import type { InstructionFields } from "../../../shared/types";

export const REQUIRED_INSTRUCTION_FIELDS = [
  "nama_obat",
  "dosis",
  "satuan",
  "frekuensi_per_hari",
  "durasi_hari",
] as const;

/**
 * Ambiguity is explicit, never inferred: a missing required field or an "as needed" dose
 * blocks scheduling. The system does not guess units, durations or end dates (10.5).
 */
export function ambiguityFlags(fields: InstructionFields): string[] {
  const flags: string[] = REQUIRED_INSTRUCTION_FIELDS.filter((f) => {
    const v = fields[f];
    return v === undefined || v === null;
  }).map((f) => `kosong:${f}`);
  if (fields.bila_perlu === true) flags.push("bila_perlu");
  return flags;
}
