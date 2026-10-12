import type {
  AudioResult,
  CareInstruction,
  CheckIn,
  Consent,
  MedicationEvent,
  MedicationReport,
  MedicationSchedule,
  Screening,
  Summary,
  TriageResult,
} from "../../../shared/types";
import type { Repository } from "./index";

type ScreeningRow = Omit<Screening, "answers"> & { answers: string };
type ResultRow = Omit<TriageResult, "reasons" | "missing_fields"> & {
  reasons: string;
  missing_fields: string;
};

export class D1Repository implements Repository {
  constructor(private db: D1Database) {}

  private insertScreening(s: Screening) {
    return this.db
      .prepare(
        `INSERT INTO screenings (id, user_id, status, mode, age, answers, created_at, completed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
      )
      .bind(s.id, s.user_id, s.status, s.mode, s.age, JSON.stringify(s.answers), s.created_at, s.completed_at);
  }

  private updateScreeningStmt(s: Screening) {
    return this.db
      .prepare(`UPDATE screenings SET status = ?2, age = ?3, answers = ?4, completed_at = ?5 WHERE id = ?1`)
      .bind(s.id, s.status, s.age, JSON.stringify(s.answers), s.completed_at);
  }

  async createScreening(s: Screening) {
    await this.insertScreening(s).run();
  }

  async getScreening(id: string) {
    const row = await this.db.prepare(`SELECT * FROM screenings WHERE id = ?1`).bind(id).first<ScreeningRow>();
    return row ? ({ ...row, answers: JSON.parse(row.answers) } as Screening) : null;
  }

  async updateScreening(s: Screening) {
    await this.updateScreeningStmt(s).run();
  }

  async completeScreening(s: Screening, r: TriageResult) {
    await this.db.batch([
      this.updateScreeningStmt(s),
      this.db
        .prepare(
          `INSERT INTO triage_results
             (screening_id, outcome, reasons, missing_fields, protocol_version, rule_status, mode, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
        )
        .bind(
          r.screening_id,
          r.outcome,
          JSON.stringify(r.reasons),
          JSON.stringify(r.missing_fields),
          r.protocol_version,
          r.rule_status,
          r.mode,
          r.created_at,
        ),
    ]);
  }

  async getResult(screeningId: string) {
    const row = await this.db
      .prepare(`SELECT * FROM triage_results WHERE screening_id = ?1`)
      .bind(screeningId)
      .first<ResultRow>();
    return row
      ? ({
          ...row,
          reasons: JSON.parse(row.reasons),
          missing_fields: JSON.parse(row.missing_fields),
        } as TriageResult)
      : null;
  }

  async saveConsent(c: Consent) {
    await this.db
      .prepare(
        `INSERT INTO consents (id, user_id, purpose, notice_version, granted_at) VALUES (?1, ?2, ?3, ?4, ?5)`,
      )
      .bind(c.id, c.user_id, c.purpose, c.notice_version, c.granted_at)
      .run();
  }

  async hasConsent(userId: string, purpose: string) {
    const row = await this.db
      .prepare(`SELECT 1 AS ok FROM consents WHERE user_id = ?1 AND purpose = ?2 LIMIT 1`)
      .bind(userId, purpose)
      .first();
    return row !== null;
  }

  async saveAudioResult(r: AudioResult) {
    await this.db
      .prepare(`INSERT OR REPLACE INTO audio_results (screening_id, result, created_at) VALUES (?1, ?2, ?3)`)
      .bind(r.screening_id, JSON.stringify(r), r.created_at)
      .run();
  }

  async getAudioResult(screeningId: string) {
    const row = await this.db
      .prepare(`SELECT result FROM audio_results WHERE screening_id = ?1`)
      .bind(screeningId)
      .first<{ result: string }>();
    return row ? (JSON.parse(row.result) as AudioResult) : null;
  }

  async saveInstruction(i: CareInstruction) {
    await this.db
      .prepare(
        `INSERT OR REPLACE INTO care_instructions
           (id, user_id, source_text, fields, ambiguity_flags, review_status, mode, created_at, confirmed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
      )
      .bind(
        i.id,
        i.user_id,
        i.source_text,
        JSON.stringify(i.fields),
        JSON.stringify(i.ambiguity_flags),
        i.review_status,
        i.mode,
        i.created_at,
        i.confirmed_at,
      )
      .run();
  }

  private toInstruction(r: Record<string, unknown>): CareInstruction {
    return {
      ...(r as unknown as CareInstruction),
      fields: JSON.parse(r.fields as string),
      ambiguity_flags: JSON.parse(r.ambiguity_flags as string),
    };
  }

  async getInstruction(id: string) {
    const r = await this.db.prepare(`SELECT * FROM care_instructions WHERE id = ?1`).bind(id).first();
    return r ? this.toInstruction(r) : null;
  }

  async listInstructions(userId: string) {
    const { results } = await this.db
      .prepare(`SELECT * FROM care_instructions WHERE user_id = ?1 ORDER BY created_at`)
      .bind(userId)
      .all();
    return results.map((r) => this.toInstruction(r));
  }

  async saveSchedule(s: MedicationSchedule) {
    await this.db
      .prepare(
        `INSERT OR REPLACE INTO medication_schedules
           (id, user_id, instruction_id, timezone, start_date, times, status, version, mode, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
      )
      .bind(
        s.id,
        s.user_id,
        s.instruction_id,
        s.timezone,
        s.start_date,
        JSON.stringify(s.times),
        s.status,
        s.version,
        s.mode,
        s.created_at,
      )
      .run();
  }

  async getSchedule(id: string) {
    const r = await this.db.prepare(`SELECT * FROM medication_schedules WHERE id = ?1`).bind(id).first();
    return r ? ({ ...r, times: JSON.parse(r.times as string) } as unknown as MedicationSchedule) : null;
  }

  async syncEvents(scheduleId: string, nowMs: number, events: MedicationEvent[]) {
    const del = this.db
      .prepare(
        `DELETE FROM medication_events
         WHERE schedule_id = ?1 AND user_report IS NULL AND planned_ts > ?2`,
      )
      .bind(scheduleId, nowMs);
    const ins = events.map((e) =>
      this.db
        .prepare(
          `INSERT OR IGNORE INTO medication_events
             (id, schedule_id, user_id, planned_at, planned_ts, user_report, reported_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
        )
        .bind(e.id, e.schedule_id, e.user_id, e.planned_at, Date.parse(e.planned_at), e.user_report, e.reported_at),
    );
    // The delete is first, so it runs in the first chunk; every chunk is atomic.
    const stmts = [del, ...ins];
    for (let i = 0; i < stmts.length; i += 50) await this.db.batch(stmts.slice(i, i + 50));
  }

  private static EVENT_COLS = `id, schedule_id, user_id, planned_at, user_report, reported_at`;

  async listEvents(scheduleId: string) {
    const { results } = await this.db
      .prepare(`SELECT ${D1Repository.EVENT_COLS} FROM medication_events WHERE schedule_id = ?1 ORDER BY planned_ts`)
      .bind(scheduleId)
      .all();
    return results as unknown as MedicationEvent[];
  }

  async getEvent(id: string) {
    const r = await this.db
      .prepare(`SELECT ${D1Repository.EVENT_COLS} FROM medication_events WHERE id = ?1`)
      .bind(id)
      .first();
    return r as unknown as MedicationEvent | null;
  }

  async reportEvent(id: string, report: MedicationReport, reportedAt: string) {
    await this.db
      .prepare(`UPDATE medication_events SET user_report = ?2, reported_at = ?3 WHERE id = ?1`)
      .bind(id, report, reportedAt)
      .run();
  }

  async listEventsInRange(userId: string, fromMs: number, toMs: number) {
    const { results } = await this.db
      .prepare(
        `SELECT ${D1Repository.EVENT_COLS} FROM medication_events
         WHERE user_id = ?1 AND planned_ts >= ?2 AND planned_ts <= ?3`,
      )
      .bind(userId, fromMs, toMs)
      .all();
    return results as unknown as MedicationEvent[];
  }

  async saveCheckIn(c: CheckIn) {
    await this.db
      .prepare(
        `INSERT INTO check_ins (id, user_id, symptoms, notes, mode, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
      )
      .bind(c.id, c.user_id, JSON.stringify(c.symptoms), c.notes, c.mode, c.created_at)
      .run();
  }

  async listCheckIns(userId: string, sinceIso: string) {
    const { results } = await this.db
      .prepare(`SELECT * FROM check_ins WHERE user_id = ?1 AND created_at >= ?2 ORDER BY created_at`)
      .bind(userId, sinceIso)
      .all();
    return results.map((r) => ({ ...r, symptoms: JSON.parse(r.symptoms as string) }) as unknown as CheckIn);
  }

  async saveSummary(s: Summary) {
    await this.db
      .prepare(`INSERT INTO summaries (id, user_id, mode, generated_at, content) VALUES (?1, ?2, ?3, ?4, ?5)`)
      .bind(s.id, s.user_id, s.mode, s.generated_at, JSON.stringify(s.content))
      .run();
  }

  async getSummary(id: string) {
    const r = await this.db.prepare(`SELECT * FROM summaries WHERE id = ?1`).bind(id).first();
    return r ? ({ ...r, content: JSON.parse(r.content as string) } as unknown as Summary) : null;
  }
}
