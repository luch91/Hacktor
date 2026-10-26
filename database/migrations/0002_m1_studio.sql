-- M1 stage recovery, idea pinning, and bounded job retry metadata.
PRAGMA foreign_keys = ON;

CREATE TABLE session_stage_runs (
  session_id TEXT NOT NULL REFERENCES ideation_sessions(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK(stage IN ('understand','map','diverge','interrogate','evolve','research','converge','blueprint')),
  status TEXT NOT NULL CHECK(status IN ('pending','running','completed','blocked','failed')),
  artifact_json TEXT NOT NULL DEFAULT '{}',
  error_json TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(session_id,stage)
);

CREATE TABLE idea_pins (
  session_id TEXT NOT NULL REFERENCES ideation_sessions(id) ON DELETE CASCADE,
  idea_version_id TEXT NOT NULL REFERENCES idea_versions(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(session_id,idea_version_id)
);

ALTER TABLE jobs ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count >= 0);
ALTER TABLE jobs ADD COLUMN max_attempts INTEGER NOT NULL DEFAULT 3 CHECK(max_attempts BETWEEN 1 AND 8);
ALTER TABLE jobs ADD COLUMN lease_expires_at TEXT;
ALTER TABLE jobs ADD COLUMN cancel_requested INTEGER NOT NULL DEFAULT 0 CHECK(cancel_requested IN (0,1));

CREATE INDEX idx_stage_runs_session ON session_stage_runs(session_id,status);
CREATE INDEX idx_idea_pins_session ON idea_pins(session_id,created_at);
