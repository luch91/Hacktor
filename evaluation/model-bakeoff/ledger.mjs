import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

export const limits = Object.freeze({ aggregate: 1_000_000, provider: 600_000,
  model: 200_000, brief: 200_000, request: 20_000, count: 40 });

export class LedgerError extends Error {
  constructor(code) { super(code); this.code = code; }
}

function micro(value) {
  if (!Number.isFinite(value) || value < 0) throw new LedgerError('invalid_amount');
  return Math.ceil(value * 1_000_000);
}

export function reservedMicro({ inputTokenEstimate, maxOutputTokens, inputRate, outputRate }) {
  if (![inputTokenEstimate, maxOutputTokens, inputRate, outputRate].every(
    (n) => Number.isFinite(n) && n >= 0)) throw new LedgerError('invalid_price');
  // Double published rates to cover billed reasoning output and pricing drift.
  return micro(2 * (inputTokenEstimate * inputRate + maxOutputTokens * outputRate) / 1_000_000);
}

export function openLedger(path) {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL;');
  db.exec(`CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY, provider TEXT NOT NULL, model TEXT NOT NULL,
    upstream TEXT NOT NULL, brief_id TEXT NOT NULL, prompt_version TEXT NOT NULL,
    schema_version TEXT NOT NULL, request_hash TEXT NOT NULL UNIQUE,
    input_token_estimate INTEGER NOT NULL, output_token_max INTEGER NOT NULL,
    estimated_micro INTEGER NOT NULL, reserved_micro INTEGER NOT NULL,
    dispatch_at TEXT, generation_id TEXT, state TEXT NOT NULL,
    actual_input_tokens INTEGER, actual_output_tokens INTEGER,
    reasoning_tokens INTEGER, provider_charge_micro INTEGER,
    balance_movement_micro INTEGER, final_charge_micro INTEGER,
    error_code TEXT, reconciliation_status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  return db;
}

function exposure(db, where = '', values = []) {
  return db.prepare(`SELECT COALESCE(SUM(CASE WHEN state='reconciled' THEN final_charge_micro
    WHEN state='cancelled' THEN 0 ELSE reserved_micro END),0) AS value
    FROM attempts ${where}`).get(...values).value;
}

export function reserve(db, details) {
  const { provider, model, upstream = '', briefId, promptVersion, schemaVersion,
    requestHash, inputTokenEstimate, maxOutputTokens, estimateMicro, reserveMicro } = details;
  if (!['openrouter', 'together'].includes(provider) || !model || !briefId || !requestHash ||
    !promptVersion || !schemaVersion || !Number.isSafeInteger(inputTokenEstimate) ||
    !Number.isSafeInteger(maxOutputTokens) || !Number.isSafeInteger(estimateMicro) ||
    !Number.isSafeInteger(reserveMicro) || reserveMicro < estimateMicro || reserveMicro <= 0) {
    throw new LedgerError('invalid_reservation');
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    if (db.prepare("SELECT COUNT(*) AS n FROM attempts WHERE state IN ('reserved','dispatched','unknown')").get().n > 0) {
      throw new LedgerError('active_attempt');
    }
    if (reserveMicro > limits.request) throw new LedgerError('request_limit');
    if (db.prepare("SELECT COUNT(*) AS n FROM attempts WHERE dispatch_at IS NOT NULL OR state='reserved'").get().n >= limits.count) {
      throw new LedgerError('request_count_limit');
    }
    const checks = [
      ['aggregate_limit', limits.aggregate, exposure(db)],
      ['provider_limit', limits.provider, exposure(db, 'WHERE provider=?', [provider])],
      ['model_limit', limits.model, exposure(db, 'WHERE provider=? AND model=? AND upstream=?', [provider, model, upstream])],
      ['brief_limit', limits.brief, exposure(db, 'WHERE brief_id=?', [briefId])],
    ];
    for (const [code, ceiling, used] of checks) {
      if (used + reserveMicro > ceiling) throw new LedgerError(code);
    }
    const id = randomUUID();
    db.prepare(`INSERT INTO attempts (id,provider,model,upstream,brief_id,prompt_version,
      schema_version,request_hash,input_token_estimate,output_token_max,estimated_micro,
      reserved_micro,state,reconciliation_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'reserved','pending')`)
      .run(id, provider, model, upstream, briefId, promptVersion, schemaVersion, requestHash,
        inputTokenEstimate, maxOutputTokens, estimateMicro, reserveMicro);
    db.exec('COMMIT');
    return id;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function dispatch(db, id) {
  const result = db.prepare("UPDATE attempts SET state='dispatched',dispatch_at=CURRENT_TIMESTAMP WHERE id=? AND state='reserved'").run(id);
  if (result.changes !== 1) throw new LedgerError('not_reserved');
}

export function markUnknown(db, id, errorCode) {
  const result = db.prepare("UPDATE attempts SET state='unknown',error_code=?,reconciliation_status='pending' WHERE id=? AND state='dispatched'").run(errorCode, id);
  if (result.changes !== 1) throw new LedgerError('not_dispatched');
}

export function recordGeneration(db, id, generationId) {
  if (typeof generationId !== 'string' || !generationId) throw new LedgerError('invalid_generation_id');
  const result = db.prepare("UPDATE attempts SET generation_id=? WHERE id=? AND state='dispatched' AND generation_id IS NULL")
    .run(generationId, id);
  if (result.changes !== 1) throw new LedgerError('not_dispatched');
}

export function cancelUndispatched(db, id, errorCode) {
  const result = db.prepare("UPDATE attempts SET state='cancelled',error_code=?,reconciliation_status='not_billed' WHERE id=? AND state='reserved'").run(errorCode, id);
  if (result.changes !== 1) throw new LedgerError('cannot_cancel_dispatched');
}

export function reconcile(db, id, evidence) {
  const { generationId, inputTokens, outputTokens, reasoningTokens = null,
    providerCharge, balanceMovement, errorCode = null } = evidence;
  if (!generationId || !Number.isSafeInteger(inputTokens) || !Number.isSafeInteger(outputTokens) ||
    !Number.isFinite(providerCharge) || !Number.isFinite(balanceMovement)) throw new LedgerError('missing_billing_evidence');
  const providerMicro = micro(providerCharge);
  const balanceMicro = micro(balanceMovement);
  if (Math.abs(providerMicro - balanceMicro) > 2) throw new LedgerError('billing_conflict');
  const attempt = db.prepare('SELECT reserved_micro FROM attempts WHERE id=?').get(id);
  if (!attempt || Math.max(providerMicro, balanceMicro) > attempt.reserved_micro) {
    throw new LedgerError('reservation_exceeded');
  }
  const result = db.prepare(`UPDATE attempts SET state='reconciled',generation_id=?,
    actual_input_tokens=?,actual_output_tokens=?,reasoning_tokens=?,provider_charge_micro=?,
    balance_movement_micro=?,final_charge_micro=?,error_code=?,reconciliation_status='verified'
    WHERE id=? AND state IN ('dispatched','unknown')`).run(generationId, inputTokens,
      outputTokens, reasoningTokens, providerMicro, balanceMicro,
      Math.max(providerMicro, balanceMicro), errorCode, id);
  if (result.changes !== 1) throw new LedgerError('not_dispatched');
}

export function reconcileRejected(db, id, { status, balanceMovement }) {
  if (!Number.isInteger(status) || status < 400 || !Number.isFinite(balanceMovement) ||
    Math.abs(balanceMovement) > 0.000002) throw new LedgerError('rejected_billing_unverified');
  const result = db.prepare(`UPDATE attempts SET state='reconciled',final_charge_micro=0,
    provider_charge_micro=0,balance_movement_micro=0,error_code=?,
    reconciliation_status='verified_rejection' WHERE id=? AND state='dispatched'`)
    .run(`http_${status}`, id);
  if (result.changes !== 1) throw new LedgerError('not_dispatched');
}

export function snapshot(db) {
  const attempts = db.prepare('SELECT * FROM attempts ORDER BY created_at,id').all();
  return { attempts, exposure_micro: exposure(db),
    unresolved_micro: attempts.filter((a) => !['reconciled', 'cancelled'].includes(a.state))
      .reduce((sum, a) => sum + a.reserved_micro, 0) };
}
