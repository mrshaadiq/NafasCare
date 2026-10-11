import type { Screening, TriageResult } from "../../../shared/types";

export interface Repository {
  createScreening(s: Screening): Promise<void>;
  getScreening(id: string): Promise<Screening | null>;
  updateScreening(s: Screening): Promise<void>;
  saveResult(r: TriageResult): Promise<void>;
  getResult(screeningId: string): Promise<TriageResult | null>;
}

/** In-memory implementation for demo/tests. Swap for D1 once the DB decision is made. */
export class MemoryRepository implements Repository {
  private screenings = new Map<string, Screening>();
  private results = new Map<string, TriageResult>();

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
  async saveResult(r: TriageResult) {
    this.results.set(r.screening_id, structuredClone(r));
  }
  async getResult(screeningId: string) {
    const r = this.results.get(screeningId);
    return r ? structuredClone(r) : null;
  }
}
