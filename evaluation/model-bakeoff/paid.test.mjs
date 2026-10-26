import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { executePaid, paidCandidates, verifyPaidCatalog } from './paid.mjs';
import { loadFixture } from './runner.mjs';
import { openLedger, snapshot } from './ledger.mjs';

const fixture = await loadFixture(new URL('./fixtures/pilot-briefs.json', import.meta.url), 'flood-water-offline');
const card = { strategy: 'neglected_actor', problem: 'Water site queues are hard to allocate.',
  beneficiary: 'Volunteer coordinators', mechanism: 'Local token board',
  feasible_mvp: 'Keyboard accessible offline browser board with invented records.',
  demo_sequence: ['Move an invented water token'], dependencies: ['Local browser'],
  hard_constraint_ids: fixture.hard_constraints.map((item) => item.id) };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });

function mockProvider({ price = '0.00000026', upstream = 'Alibaba', usage = true,
  failPost = false, record = [] } = {}) {
  let keyReads = 0;
  return async (url, options = {}) => {
    if (url.endsWith('/api/v1/models')) return json({ data: [{ id: paidCandidates.qwen.model }] });
    if (url.endsWith('/endpoints')) return json({ data: { endpoints: [{ provider_name: 'Alibaba',
      supported_parameters: ['structured_outputs'], pricing: { prompt: '0.000000065', completion: price },
      max_completion_tokens: 65536 }] } });
    if (url.endsWith('/api/v1/key')) return json({ data: { usage: keyReads++ ? 0.0002 : 0 } });
    if (url.includes('/generation?')) return json({ data: { provider_name: upstream,
      total_cost: 0.0002, native_tokens_reasoning: 0 } });
    if (url.endsWith('/chat/completions')) {
      record.push('post');
      if (failPost) throw new Error('connection lost');
      return json({ id: 'gen-1', model: paidCandidates.qwen.model,
        choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(card) } }],
        usage: usage ? { prompt_tokens: 300, completion_tokens: 100 } : null });
    }
    throw new Error('unexpected endpoint');
  };
}

async function tempLedger(run) {
  const dir = await mkdtemp(join(tmpdir(), 'hacktor-paid-'));
  try { await run(join(dir, 'ledger.sqlite')); }
  finally { await rm(dir, { recursive: true, force: true }); }
}

test('paid mode remains disabled without explicit local switch', async () => {
  let calls = 0;
  await assert.rejects(executePaid({ candidateKey: 'qwen', fixture, task: 'card', key: 'secret',
    dbPath: 'unused', fetchImpl: async () => { calls++; } }), { code: 'paid_mode_disabled' });
  assert.equal(calls, 0);
});

test('Together paid candidate is blocked without documented billing reconciliation', async () => {
  await assert.rejects(verifyPaidCatalog({ provider: 'together', model: 'Qwen/Qwen3.8-Flash' }),
    { code: 'billing_unavailable' });
});

test('unexpected price blocks before reservation and dispatch', async () => {
  await tempLedger(async (dbPath) => {
    const record = [];
    await assert.rejects(executePaid({ candidateKey: 'qwen', fixture, task: 'card', key: 'secret',
      dbPath, authorized: true, fetchImpl: mockProvider({ price: '0.0000006', record }) }),
    { code: 'unexpected_price' });
    assert.deepEqual(record, []);
  });
});

test('matching route, usage and balance reconcile one paid attempt', async () => {
  await tempLedger(async (dbPath) => {
    const record = [];
    const result = await executePaid({ candidateKey: 'qwen', fixture, task: 'card', key: 'secret',
      dbPath, authorized: true, fetchImpl: mockProvider({ record }) });
    assert.equal(result.status, 'valid');
    assert.equal(result.charge_usd, 0.0002);
    assert.deepEqual(record, ['post']);
    const db = openLedger(dbPath);
    assert.equal(snapshot(db).unresolved_micro, 0);
    db.close();
  });
});

test('wrong upstream or missing usage holds exposure and stops later calls', async () => {
  for (const variant of [{ upstream: 'Other' }, { usage: false }]) {
    await tempLedger(async (dbPath) => {
      const record = [];
      const fetchImpl = mockProvider({ ...variant, record });
      await assert.rejects(executePaid({ candidateKey: 'qwen', fixture, task: 'card',
        key: 'secret', dbPath, authorized: true, fetchImpl }),
      { code: variant.upstream ? 'routing_mismatch' : 'missing_billing_evidence' });
      const db = openLedger(dbPath);
      assert.equal(snapshot(db).attempts[0].state, 'unknown');
      db.close();
      await assert.rejects(executePaid({ candidateKey: 'qwen', fixture, task: 'card',
        key: 'secret', dbPath, authorized: true, fetchImpl }), { code: 'active_attempt' });
      assert.deepEqual(record, ['post']);
    });
  }
});

test('uncertain dispatched request is never retried and secrets stay out of errors', async () => {
  await tempLedger(async (dbPath) => {
    const record = [];
    const fetchImpl = mockProvider({ failPost: true, record });
    let message = '';
    try { await executePaid({ candidateKey: 'qwen', fixture, task: 'card', key: 'secret-marker',
      dbPath, authorized: true, fetchImpl }); } catch (error) { message = error.message; }
    assert.deepEqual(record, ['post']);
    assert.equal(message.includes('secret-marker'), false);
    const db = openLedger(dbPath);
    assert.ok(snapshot(db).unresolved_micro > 0);
    db.close();
  });
});
