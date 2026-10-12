import type { MedicationEvent, MedicationSchedule, Timezone } from "../../../shared/types";

const OFFSET: Record<Timezone, string> = {
  "Asia/Jakarta": "+07:00",
  "Asia/Makassar": "+08:00",
  "Asia/Jayapura": "+09:00",
};

export type ScheduleShape = Pick<MedicationSchedule, "id" | "user_id" | "timezone" | "start_date" | "times">;

/**
 * Pure and deterministic. The event id is schedule id + local planned time, so regenerating
 * after an edit or a retried request can never create duplicate reminders (10.6).
 * Indonesian zones have no DST, so fixed offsets are exact.
 */
export function generateEvents(s: ScheduleShape, durasiHari: number): MedicationEvent[] {
  const [y, m, d] = s.start_date.split("-").map(Number) as [number, number, number];
  const times = [...new Set(s.times)].sort();
  const events: MedicationEvent[] = [];
  for (let day = 0; day < durasiHari; day++) {
    const ymd = new Date(Date.UTC(y, m - 1, d + day)).toISOString().slice(0, 10);
    for (const t of times) {
      const local = `${ymd}T${t}`;
      events.push({
        id: `${s.id}:${local}`,
        schedule_id: s.id,
        user_id: s.user_id,
        planned_at: `${local}:00${OFFSET[s.timezone]}`,
        user_report: null,
        reported_at: null,
      });
    }
  }
  return events;
}
