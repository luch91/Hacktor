-- Hacktor initial D1 migration. Logical production baseline; not deployed.
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email_normalized TEXT UNIQUE,
  auth_subject TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'builder' CHECK(role IN ('builder','admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE guest_sessions (
  id TEXT PRIMARY KEY,
  capability_hash TEXT NOT NULL UNIQUE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT
);
CREATE TABLE builder_preferences (
  owner_user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  settings_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE source_connectors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_host TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disabled' CHECK(status IN ('disabled','approved','paused')),
  access_methods_json TEXT NOT NULL DEFAULT '[]',
  terms_url TEXT,
  terms_reviewed_at TEXT,
  permission_evidence TEXT,
  rate_budget_json TEXT NOT NULL DEFAULT '{}',
  last_success_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE source_records (
  id TEXT PRIMARY KEY,
  connector_id TEXT REFERENCES source_connectors(id),
  source_kind TEXT NOT NULL CHECK(source_kind IN ('official_organizer','verified_public_project','third_party','user_provided','model_hypothesis')),
  url TEXT,
  title TEXT,
  content_hash TEXT,
  allowed_excerpt TEXT,
  permission_status TEXT NOT NULL DEFAULT 'unreviewed',
  fetched_at TEXT,
  checked_at TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE hackathons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  organizer TEXT,
  official_url TEXT,
  start_at TEXT,
  deadline_at TEXT,
  event_format TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  current_snapshot_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE event_snapshots (
  id TEXT PRIMARY KEY,
  hackathon_id TEXT NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  brief_json TEXT NOT NULL,
  coverage_state TEXT NOT NULL CHECK(coverage_state IN ('verified_brief','partial_evidence','user_provided')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  captured_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(hackathon_id,revision)
);
CREATE TABLE tracks (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES event_snapshots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rules_json TEXT NOT NULL DEFAULT '[]',
  judging_json TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE public_projects (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES hackathons(id),
  source_record_id TEXT NOT NULL REFERENCES source_records(id),
  title TEXT NOT NULL,
  url TEXT,
  mechanism_tags_json TEXT NOT NULL DEFAULT '[]',
  beneficiary_tags_json TEXT NOT NULL DEFAULT '[]',
  summary TEXT,
  checked_at TEXT
);
CREATE TABLE ideation_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  guest_id TEXT REFERENCES guest_sessions(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK(mode IN ('hackathon_first','idea_first')),
  title TEXT NOT NULL,
  source_event_snapshot_id TEXT REFERENCES event_snapshots(id),
  context_json TEXT NOT NULL DEFAULT '{}',
  original_idea_text TEXT,
  context_revision INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived','deleting')),
  review_required INTEGER NOT NULL DEFAULT 0 CHECK(review_required IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK ((user_id IS NOT NULL AND guest_id IS NULL) OR (user_id IS NULL AND guest_id IS NOT NULL))
);
CREATE TABLE session_pins (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES ideation_sessions(id) ON DELETE CASCADE,
  pin_kind TEXT NOT NULL CHECK(pin_kind IN ('constraint','insight','source','note')),
  note TEXT NOT NULL,
  source_record_id TEXT REFERENCES source_records(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE opportunity_hypotheses (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES ideation_sessions(id) ON DELETE CASCADE,
  problem TEXT NOT NULL,
  beneficiary TEXT,
  assumption TEXT,
  evidence_refs_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE idea_versions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES ideation_sessions(id) ON DELETE CASCADE,
  original_user_authored INTEGER NOT NULL DEFAULT 0 CHECK(original_user_authored IN (0,1)),
  strategy TEXT,
  card_json TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'active' CHECK(visibility IN ('active','rejected','archived')),
  source_snapshot_id TEXT REFERENCES event_snapshots(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE idea_edges (
  child_version_id TEXT NOT NULL REFERENCES idea_versions(id) ON DELETE CASCADE,
  parent_version_id TEXT NOT NULL REFERENCES idea_versions(id) ON DELETE CASCADE,
  edge_kind TEXT NOT NULL CHECK(edge_kind IN ('branch','refinement','combine','origin')),
  reason TEXT,
  PRIMARY KEY(child_version_id,parent_version_id),
  CHECK(child_version_id <> parent_version_id)
);
CREATE TABLE idea_actions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES ideation_sessions(id) ON DELETE CASCADE,
  target_version_id TEXT REFERENCES idea_versions(id),
  command TEXT NOT NULL,
  instruction TEXT,
  actor_user_id TEXT REFERENCES users(id),
  result_version_id TEXT REFERENCES idea_versions(id),
  action_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE idea_rejections (
  idea_version_id TEXT PRIMARY KEY REFERENCES idea_versions(id) ON DELETE CASCADE,
  reason TEXT,
  exclusion_pattern TEXT,
  rejected_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE research_claims (
  id TEXT PRIMARY KEY,
  idea_version_id TEXT REFERENCES idea_versions(id) ON DELETE CASCADE,
  source_record_id TEXT REFERENCES source_records(id),
  claim TEXT NOT NULL,
  claim_type TEXT NOT NULL CHECK(claim_type IN ('fact','hypothesis')),
  verification_status TEXT NOT NULL CHECK(verification_status IN ('verified','unverified','stale','source_unavailable')),
  checked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK(claim_type = 'hypothesis' OR source_record_id IS NOT NULL OR verification_status <> 'verified')
);
CREATE TABLE comparison_sets (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES ideation_sessions(id) ON DELETE CASCADE,
  idea_version_ids_json TEXT NOT NULL,
  comparison_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE scorecards (
  id TEXT PRIMARY KEY,
  idea_version_id TEXT NOT NULL REFERENCES idea_versions(id) ON DELETE CASCADE,
  rubric_version TEXT NOT NULL,
  coverage_status TEXT NOT NULL CHECK(coverage_status IN ('scored','partial','not_scored')),
  observed_overlap TEXT NOT NULL CHECK(observed_overlap IN ('low_observed','moderate_observed','high_observed','insufficient_evidence')),
  sample_count INTEGER NOT NULL DEFAULT 0 CHECK(sample_count >= 0),
  score_json TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE blueprints (
  id TEXT PRIMARY KEY,
  idea_version_id TEXT NOT NULL REFERENCES idea_versions(id) ON DELETE CASCADE,
  event_snapshot_id TEXT REFERENCES event_snapshots(id),
  source_manifest_json TEXT NOT NULL DEFAULT '[]',
  content_markdown TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  review_required INTEGER NOT NULL DEFAULT 0 CHECK(review_required IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES ideation_sessions(id) ON DELETE CASCADE,
  owner_key TEXT NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','validating','retry_wait','completed','failed','blocked_quota','cancelled')),
  stage TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  request_json TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  progress_json TEXT NOT NULL DEFAULT '{}',
  result_json TEXT,
  error_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE job_outbox (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published')),
  publish_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);
CREATE TABLE idempotency_keys (
  owner_key TEXT NOT NULL,
  route_key TEXT NOT NULL,
  client_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(owner_key,route_key,client_key)
);
CREATE TABLE generation_runs (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  response_status TEXT NOT NULL,
  usage_json TEXT NOT NULL DEFAULT '{}',
  duration_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(job_id,stage)
);
CREATE TABLE usage_ledger (
  id TEXT PRIMARY KEY,
  owner_key TEXT NOT NULL,
  provider_invocation_id TEXT UNIQUE,
  job_id TEXT REFERENCES jobs(id),
  usage_units REAL NOT NULL DEFAULT 0,
  estimated_cost_usd REAL NOT NULL DEFAULT 0,
  kind TEXT NOT NULL CHECK(kind IN ('reserve','settle','refund')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  subject_kind TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_source_records_connector ON source_records(connector_id,checked_at);
CREATE INDEX idx_snapshots_event_status ON event_snapshots(hackathon_id,status,revision);
CREATE INDEX idx_tracks_snapshot ON tracks(snapshot_id);
CREATE INDEX idx_projects_event ON public_projects(event_id);
CREATE INDEX idx_sessions_user ON ideation_sessions(user_id,updated_at);
CREATE INDEX idx_sessions_guest ON ideation_sessions(guest_id,updated_at);
CREATE INDEX idx_ideas_session_created ON idea_versions(session_id,created_at);
CREATE INDEX idx_idea_edges_parent ON idea_edges(parent_version_id);
CREATE INDEX idx_actions_session ON idea_actions(session_id,created_at);
CREATE INDEX idx_research_claims_idea ON research_claims(idea_version_id);
CREATE INDEX idx_scorecards_idea ON scorecards(idea_version_id,created_at);
CREATE INDEX idx_blueprints_idea ON blueprints(idea_version_id,created_at);
CREATE INDEX idx_jobs_session_status ON jobs(session_id,status,created_at);
CREATE INDEX idx_outbox_pending ON job_outbox(status,created_at);
CREATE INDEX idx_usage_owner ON usage_ledger(owner_key,created_at);

-- Public searchable text only. User ideas are intentionally excluded.
CREATE VIRTUAL TABLE public_event_search USING fts5(hackathon_id UNINDEXED, title, organizer, description);

