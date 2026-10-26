-- M1 lease ownership, explicit mode, and action reconciliation.
PRAGMA foreign_keys = ON;

ALTER TABLE jobs ADD COLUMN lease_token TEXT;
ALTER TABLE jobs ADD COLUMN inference_mode TEXT NOT NULL DEFAULT 'deterministic'
  CHECK(inference_mode IN ('deterministic','live'));
ALTER TABLE idea_versions ADD COLUMN generation_job_id TEXT REFERENCES jobs(id);
ALTER TABLE action_idempotency_keys ADD COLUMN action_id TEXT;
ALTER TABLE action_idempotency_keys ADD COLUMN lease_expires_at TEXT;

CREATE UNIQUE INDEX idx_action_idempotency_action ON action_idempotency_keys(action_id);
CREATE INDEX idx_jobs_expired_lease ON jobs(status,lease_expires_at);
CREATE UNIQUE INDEX idx_ideas_generation_strategy ON idea_versions(generation_job_id,strategy);
