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

export interface Repository {
  createScreening(s: Screening): Promise<void>;
  getScreening(id: string): Promise<Screening | null>;
  updateScreening(s: Screening): Promise<void>;
  /** Marks the screening complete and stores the result together, or neither. */
  completeScreening(s: Screening, r: TriageResult): Promise<void>;
  getResult(screeningId: string): Promise<TriageResult | null>;
  saveConsent(c: Consent): Promise<void>;
  hasConsent(userId: string, purpose: string): Promise<boolean>;

  /** One audio sample per screening; attaching again replaces it. */
  saveAudioResult(r: AudioResult): Promise<void>;
  getAudioResult(screeningId: string): Promise<AudioResult | null>;

  saveInstruction(i: CareInstruction): Promise<void>;
  getInstruction(id: string): Promise<CareInstruction | null>;
  listInstructions(userId: string): Promise<CareInstruction[]>;

  saveSchedule(s: MedicationSchedule): Promise<void>;
  getSchedule(id: string): Promise<MedicationSchedule | null>;
  /**
   * Drops this schedule's future events that have no user report, then inserts the given
   * events, ignoring ids that already exist. Reported and past events are never touched.
   */
  syncEvents(scheduleId: string, nowMs: number, events: MedicationEvent[]): Promise<void>;
  listEvents(scheduleId: string): Promise<MedicationEvent[]>;
  getEvent(id: string): Promise<MedicationEvent | null>;
  reportEvent(id: string, report: MedicationReport, reportedAt: string): Promise<void>;
  listEventsInRange(userId: string, fromMs: number, toMs: number): Promise<MedicationEvent[]>;

  saveCheckIn(c: CheckIn): Promise<void>;
  listCheckIns(userId: string, sinceIso: string): Promise<CheckIn[]>;

  saveSummary(s: Summary): Promise<void>;
  getSummary(id: string): Promise<Summary | null>;
}

/** In-memory implementation for tests only. Production uses D1Repository. */
export class MemoryRepository implements Repository {
  private screenings = new Map<string, Screening>();
  private results = new Map<string, TriageResult>();
  private consents: Consent[] = [];
  private audio = new Map<string, AudioResult>();
  private instructions = new Map<string, CareInstruction>();
  private schedules = new Map<string, MedicationSchedule>();
  private events = new Map<string, MedicationEvent>();
  private checkIns: CheckIn[] = [];
  private summaries = new Map<string, Summary>();

  async createScreening(s: Screening) {
    this.screenings.set(s.id, structuredClone(s));
  }
  async getScreening(id: string) {
    const s = this.screenings.get(id);
    return s ? structuredClone(s) : null;
  }
  async updateScreening(s: Screening) {
    this.screenings.set(s.id, structuredClone(s));
  }
  async completeScreening(s: Screening, r: TriageResult) {
    this.screenings.set(s.id, structuredClone(s));
    this.results.set(r.screening_id, structuredClone(r));
  }
  async getResult(screeningId: string) {
    const r = this.results.get(screeningId);
    return r ? structuredClone(r) : null;
  }
  async saveConsent(c: Consent) {
    this.consents.push(structuredClone(c));
  }
  async hasConsent(userId: string, purpose: string) {
    return this.consents.some((c) => c.user_id === userId && c.purpose === purpose);
  }

  async saveAudioResult(r: AudioResult) {
    this.audio.set(r.screening_id, structuredClone(r));
  }
  async getAudioResult(screeningId: string) {
    const r = this.audio.get(screeningId);
    return r ? structuredClone(r) : null;
  }

  async saveInstruction(i: CareInstruction) {
    this.instructions.set(i.id, structuredClone(i));
  }
  async getInstruction(id: string) {
    const i = this.instructions.get(id);
    return i ? structuredClone(i) : null;
  }
  async listInstructions(userId: string) {
    return [...this.instructions.values()].filter((i) => i.user_id === userId).map((i) => structuredClone(i));
  }

  async saveSchedule(s: MedicationSchedule) {
    this.schedules.set(s.id, structuredClone(s));
  }
  async getSchedule(id: string) {
    const s = this.schedules.get(id);
    return s ? structuredClone(s) : null;
  }
  async syncEvents(scheduleId: string, nowMs: number, events: MedicationEvent[]) {
    for (const [id, e] of this.events) {
      if (e.schedule_id === scheduleId && e.user_report === null && Date.parse(e.planned_at) > nowMs) {
        this.events.delete(id);
      }
    }
    for (const e of events) if (!this.events.has(e.id)) this.events.set(e.id, structuredClone(e));
  }
  async listEvents(scheduleId: string) {
    return [...this.events.values()]
      .filter((e) => e.schedule_id === scheduleId)
      .sort((a, b) => Date.parse(a.planned_at) - Date.parse(b.planned_at))
      .map((e) => structuredClone(e));
  }
  async getEvent(id: string) {
    const e = this.events.get(id);
    return e ? structuredClone(e) : null;
  }
  async reportEvent(id: string, report: MedicationReport, reportedAt: string) {
    const e = this.events.get(id);
    if (e) this.events.set(id, { ...e, user_report: report, reported_at: reportedAt });
  }
  async listEventsInRange(userId: string, fromMs: number, toMs: number) {
    return [...this.events.values()]
      .filter((e) => e.user_id === userId && Date.parse(e.planned_at) >= fromMs && Date.parse(e.planned_at) <= toMs)
      .map((e) => structuredClone(e));
  }

  async saveCheckIn(c: CheckIn) {
    this.checkIns.push(structuredClone(c));
  }
  async listCheckIns(userId: string, sinceIso: string) {
    return this.checkIns
      .filter((c) => c.user_id === userId && c.created_at >= sinceIso)
      .map((c) => structuredClone(c));
  }

  async saveSummary(s: Summary) {
    this.summaries.set(s.id, structuredClone(s));
  }
  async getSummary(id: string) {
    const s = this.summaries.get(id);
    return s ? structuredClone(s) : null;
  }
}
