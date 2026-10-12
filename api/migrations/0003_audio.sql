-- Audio result is stored as one JSON document per screening (research sample, annotation-derived).
CREATE TABLE audio_results (
  screening_id TEXT PRIMARY KEY REFERENCES screenings (id),
  result TEXT NOT NULL,
  created_at TEXT NOT NULL
);
