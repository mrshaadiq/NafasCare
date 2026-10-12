CREATE TABLE care_instructions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_text TEXT NOT NULL,
  fields TEXT NOT NULL,
  ambiguity_flags TEXT NOT NULL,
  review_status TEXT NOT NULL,
  mode TEXT NOT NULL,
  created_at TEXT NOT NULL,
  confirmed_at TEXT
);
CREATE INDEX idx_instructions_user ON care_instructions (user_id);

CREATE TABLE medication_schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  instruction_id TEXT NOT NULL REFERENCES care_instructions (id),
  timezone TEXT NOT NULL,
  start_date TEXT NOT NULL,
  times TEXT NOT NULL,
  status TEXT NOT NULL,
  version INTEGER NOT NULL,
  mode TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE medication_events (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES medication_schedules (id),
  user_id TEXT NOT NULL,
  planned_at TEXT NOT NULL,
  planned_ts INTEGER NOT NULL,
  user_report TEXT,
  reported_at TEXT
);
CREATE INDEX idx_events_schedule ON medication_events (schedule_id, planned_ts);
CREATE INDEX idx_events_user ON medication_events (user_id, planned_ts);

CREATE TABLE check_ins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  notes TEXT,
  mode TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_checkins_user ON check_ins (user_id, created_at);

CREATE TABLE summaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  content TEXT NOT NULL
);
