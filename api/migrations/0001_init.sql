-- Synthetic demo data only. See RINCIAN_PENGERJAAN_BACKEND_FIRST.md.
CREATE TABLE screenings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  mode TEXT NOT NULL,
  age INTEGER,
  answers TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE INDEX idx_screenings_user ON screenings (user_id);

CREATE TABLE triage_results (
  screening_id TEXT PRIMARY KEY REFERENCES screenings (id),
  outcome TEXT NOT NULL,
  reasons TEXT NOT NULL,
  missing_fields TEXT NOT NULL,
  protocol_version TEXT NOT NULL,
  rule_status TEXT NOT NULL,
  mode TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE consents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  notice_version TEXT NOT NULL,
  granted_at TEXT NOT NULL
);
CREATE INDEX idx_consents_user_purpose ON consents (user_id, purpose);
