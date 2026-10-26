import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openLedger, reserve, dispatch, markUnknown, cancelUndispatched,
  recordGeneration, reconcile, snapshot, reservedMicro } from './ledger.mjs';

const base = (n = 10_000) => ({ provider: 'openrouter', model: 'm', upstream: 'A',
  briefId: 'brief', promptVersion: 'p1', schemaVersion: 's1',
  requestHash: crypto.randomUUID(), inputTokenEstimate: 500,
  maxOutputTokens: 1000, estimateMicro: n / 2, reserveMicro: n });
function settled(db, request) {
  const id = reserve(db, request);
  dispatch(db, id);
  reconcile(db, id, { generationId: id, inputTokens: 1, outputTokens: 1,
    providerCharge: request.reserveMicro / 1_000_000,
    balanceMovement: request.reserveMicro / 1_000_000 });
  return id;
}

async function withLedger(run) {
  const dir = await mkdtemp(join(tmpdir(), 'hacktor-ledger-'));
  const path = join(dir, 'ledger.sqlite');
  const db = openLedger(path);
  try { await run(db, path); } finally { db.close(); await rm(dir, { recursive: true, force: true }); }
}

test('atomic reservation persists across reopen and rejects duplicate request hashes', async () => {
  await withLedger(async (db, path) => {
    const request = base();
    reserve(db, request);
    assert.throws(() => reserve(db, request));
    const second = openLedger(path);
    assert.equal(snapshot(second).exposure_micro, 10_000);
    assert.throws(() => reserve(second, request));
    second.close();
  });
});

test('two handles share reservations and cannot bypass provider limits', async () => {
  await withLedger(async (db, path) => {
    const second = openLedger(path);
    try {
      for (let i = 0; i < 30; i++) settled(i % 2 ? second : db, { ...base(20_000),
        model: `m${i}`, briefId: `b${i}` });
      assert.equal(snapshot(db).exposure_micro, 600_000);
      assert.throws(() => reserve(second, { ...base(1), estimateMicro: 0, model: 'other', briefId: 'new' }),
        { code: 'provider_limit' });
    } finally { second.close(); }
  });
});

test('all money ceilings and request count stop dispatch planning', async () => {
  await withLedger(async (db) => {
    assert.throws(() => reserve(db, { ...base(20_001), estimateMicro: 10_000 }), { code: 'request_limit' });
    for (let i = 0; i < 10; i++) settled(db, { ...base(20_000), briefId: `b${i}` });
    assert.throws(() => reserve(db, { ...base(1), estimateMicro: 0, briefId: 'other' }), { code: 'model_limit' });
    for (let i = 0; i < 10; i++) settled(db, { ...base(20_000), model: `m${i}`, briefId: 'same' });
    assert.throws(() => reserve(db, { ...base(1), estimateMicro: 0, model: 'other', briefId: 'same' }), { code: 'brief_limit' });
    for (let i = 0; i < 10; i++) settled(db, { ...base(20_000), model: `x${i}`, briefId: `x${i}` });
    assert.throws(() => reserve(db, { ...base(1), estimateMicro: 0, model: 'last', briefId: 'last' }), { code: 'provider_limit' });
  });
  await withLedger(async (db) => {
    for (let i = 0; i < 40; i++) settled(db, { ...base(10_000), model: `m${i}`, briefId: `b${i}`,
      provider: i % 2 ? 'together' : 'openrouter' });
    assert.throws(() => reserve(db, { ...base(1), estimateMicro: 0, model: 'new', briefId: 'new' }), { code: 'request_count_limit' });
    assert.equal(snapshot(db).exposure_micro, 400_000);
  });
});

test('unknown billable outcomes hold exposure and cannot be cancelled or retried', async () => {
  await withLedger(async (db) => {
    const request = base();
    const id = reserve(db, request);
    dispatch(db, id);
    recordGeneration(db, id, 'gen-test');
    markUnknown(db, id, 'outcome_unknown');
    assert.equal(snapshot(db).unresolved_micro, 10_000);
    assert.equal(snapshot(db).attempts[0].generation_id, 'gen-test');
    assert.throws(() => cancelUndispatched(db, id, 'timeout'), { code: 'cannot_cancel_dispatched' });
    assert.throws(() => dispatch(db, id), { code: 'not_reserved' });
    assert.throws(() => reserve(db, request));
  });
});

test('billing conflict, missing usage and excess charge fail closed', async () => {
  await withLedger(async (db) => {
    const id = reserve(db, base());
    dispatch(db, id);
    const evidence = { generationId: 'g', inputTokens: 10, outputTokens: 20,
      providerCharge: 0.004, balanceMovement: 0.004 };
    assert.throws(() => reconcile(db, id, { ...evidence, balanceMovement: 0.005 }), { code: 'billing_conflict' });
    assert.throws(() => reconcile(db, id, { ...evidence, inputTokens: undefined }), { code: 'missing_billing_evidence' });
    assert.throws(() => reconcile(db, id, { ...evidence, providerCharge: 0.02, balanceMovement: 0.02 }), { code: 'reservation_exceeded' });
    assert.equal(snapshot(db).unresolved_micro, 10_000);
    reconcile(db, id, evidence);
    assert.equal(snapshot(db).exposure_micro, 4_000);
  });
});

test('price estimate doubles published token cost', () => {
  assert.equal(reservedMicro({ inputTokenEstimate: 1000, maxOutputTokens: 6000,
    inputRate: 0.15, outputRate: 0.5 }), 6300);
});
