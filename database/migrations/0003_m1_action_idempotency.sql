-- M1 idempotency for synchronous immutable idea actions.
PRAGMA foreign_keys = ON;

CREATE TABLE action_idempotency_keys (
  owner_key TEXT NOT NULL,
  route_key TEXT NOT NULL,
  client_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(owner_key,route_key,client_key)
);

CREATE INDEX idx_action_idempotency_created ON action_idempotency_keys(created_at);
