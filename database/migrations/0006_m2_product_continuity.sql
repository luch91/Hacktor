-- Unconfirmed working context, separate from the confirmed session context.
PRAGMA foreign_keys = ON;

CREATE TABLE session_context_drafts (
  session_id TEXT PRIMARY KEY REFERENCES ideation_sessions(id) ON DELETE CASCADE,
  context_json TEXT NOT NULL,
  base_context_revision INTEGER NOT NULL CHECK(base_context_revision >= 1),
  draft_revision INTEGER NOT NULL DEFAULT 1 CHECK(draft_revision >= 1),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
