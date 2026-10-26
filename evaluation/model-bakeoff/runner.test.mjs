import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  assertFreeCatalog, buildRequest, classifyStatus, runCandidate,
  validateCard, validateOutput,
} from './runner.mjs';

const fixture = JSON.parse(await readFile(new URL('./fixtures/offline-civic.json', import.meta.url)));
const card = {
  strategy: 'neglected_actor', problem: 'Volunteers cannot tell which collection point needs more water.',
  beneficiary: 'Neighborhood volunteers', mechanism: 'An offline task board assigns invented supply tokens to sites.',
  feasible_mvp: 'A local browser app with seeded sample records and keyboard controls.',
  demo_sequence: ['Open a sample collection point', 'Move an invented supply token', 'Hear the updated status with a screen reader'],
  dependencies: ['Local browser'], hard_constraint_ids: fixture.hard_constraints.map((item) => item.id),
};
const answer = (overrides = {}) => ({
  id: 'gen-test', model: 'nvidia/nemotron-3-super-120b-a12b:free',
  choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(card) } }],
  usage: { prompt_tokens: 100, completion_tokens: 90 }, ...overrides,
});
const json = (value, status = 200) => new Response(JSON.stringify(value), { status });
const metadata = json({ data: { provider_name: 'Nvidia', total_cost: 0, native_tokens_reasoning: 12 } });

test('request adapters keep distinct provider controls', () => {
  const openrouter = buildRequest({ provider: 'openrouter', model: 'm:free', fixture, upstream: 'Nvidia' });
  const together = buildRequest({ provider: 'together', model: 'Prism-ML/Ternary-Bonsai-27B', fixture });
  assert.deepEqual(openrouter.provider, { require_parameters: true, allow_fallbacks: false, only: ['Nvidia'] });
  assert.equal(openrouter.usage.include, true);
  assert.equal(together.provider, undefined);
  assert.equal(together.response_format.type, 'json_schema');
  assert.equal(openrouter.response_format.json_schema.strict, true);
});

test('constraint IDs do not excuse a semantic violation', () => {
  assert.equal(validateCard(card, fixture), null);
  assert.equal(validateCard({ ...card, mechanism: 'Upload names to a cloud API.' }, fixture), 'obvious_constraint_violation');
  assert.equal(validateCard({ ...card, hard_constraint_ids: ['offline_only'] }, fixture), 'missing_constraint_id');
  assert.equal(validateOutput({ cards: Array(9).fill(card) }, fixture, 'slate'), 'duplicate_strategy');
});

test('HTTP classes include billing and rate errors', () => {
  assert.equal(classifyStatus(400), 'invalid_request');
  assert.equal(classifyStatus(401), 'authentication_blocked');
  assert.equal(classifyStatus(402), 'payment_required');
  assert.equal(classifyStatus(429), 'rate_limited');
  assert.equal(classifyStatus(503), 'provider_unavailable');
});

test('free catalog rejects stale IDs and verifies named upstream', async () => {
  const good = async (url) => url.endsWith('/endpoints')
    ? json({ data: { endpoints: [{ provider_name: 'Nvidia', pricing: { prompt: '0', completion: '0' }, supported_parameters: ['structured_outputs'] }] } })
    : json({ data: [{ id: 'nvidia/nemotron-3-super-120b-a12b:free', pricing: { prompt: '0', completion: '0' } }] });
  await assertFreeCatalog({ provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free', apiKey: 'test', upstream: 'Nvidia', fetchImpl: good });
  await assert.rejects(assertFreeCatalog({ provider: 'openrouter', model: 'qwen/qwen3.8-27b:free', apiKey: 'test', upstream: 'Nvidia', fetchImpl: good }), { code: 'not_verified_free' });
  await assert.rejects(assertFreeCatalog({ provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free', apiKey: 'test', fetchImpl: good }), { code: 'upstream_required' });
  await assert.rejects(assertFreeCatalog({ provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free', upstream: 'Nvidia', fetchImpl: good }), { code: 'missing_key' });
});

test('Together free preflight requires account model and public zero price', async () => {
  const mock = async (url) => url.endsWith('/v1/models')
    ? json([{ id: 'Prism-ML/Ternary-Bonsai-27B' }])
    : new Response('Prism-ML/Ternary-Bonsai-27B Input price $0.00 Output price $0.00');
  await assertFreeCatalog({ provider: 'together', model: 'Prism-ML/Ternary-Bonsai-27B', apiKey: 'test', fetchImpl: mock });
  await assert.rejects(assertFreeCatalog({ provider: 'together', model: 'Qwen/Qwen3.8-Flash', apiKey: 'test', fetchImpl: mock }), { code: 'not_verified_free' });
});

test('accepted result requires usage and verified upstream metadata', async () => {
  const fetchImpl = async (url) => url.includes('/generation?') ? metadata : json(answer());
  const result = await runCandidate({ provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free',
    apiKey: 'test', fixture, upstream: 'Nvidia', fetchImpl });
  assert.equal(result.routed_provider, 'Nvidia');
  assert.equal(result.usage.reported_cost_usd, 0);
  assert.equal(result.usage.reasoning_tokens, 12);
});

test('errors, refusals, truncation, missing usage and uncertain outcomes are explicit', async () => {
  const common = { provider: 'together', model: 'Prism-ML/Ternary-Bonsai-27B', apiKey: 'test', fixture };
  for (const [status, code] of [[400, 'invalid_request'], [401, 'authentication_blocked'],
    [402, 'payment_required'], [429, 'rate_limited']]) {
    await assert.rejects(runCandidate({ ...common, fetchImpl: async () => json({ error: true }, status) }), { code });
  }
  await assert.rejects(runCandidate({ ...common, fetchImpl: async () => new Response('{bad') }), { code: 'malformed_json' });
  await assert.rejects(runCandidate({ ...common, fetchImpl: async () => json(answer({ model: common.model,
    choices: [{ finish_reason: 'length', message: { content: '{}' } }] })) }), { code: 'truncated_output' });
  await assert.rejects(runCandidate({ ...common, fetchImpl: async () => json(answer({ model: common.model,
    choices: [{ finish_reason: 'content_filter', message: { content: '{}' } }] })) }), { code: 'refusal' });
  await assert.rejects(runCandidate({ ...common, fetchImpl: async () => json(answer({ model: common.model, usage: null })) }), { code: 'usage_unverified' });
  await assert.rejects(runCandidate({ ...common, fetchImpl: async () => json(answer({ model: common.model,
    usage: { prompt_tokens: 100, completion_tokens: 901 } })) }), { code: 'usage_over_budget' });
  await assert.rejects(runCandidate({ ...common, fetchImpl: async () => { throw new Error('timeout'); } }), { code: 'outcome_unknown' });
  await assert.rejects(runCandidate({ ...common, apiKey: '' }), { code: 'missing_key' });
});

test('routing mismatch cannot be accepted', async () => {
  const fetchImpl = async (url) => url.includes('/generation?')
    ? json({ data: { provider_name: 'Other', total_cost: 0 } }) : json(answer());
  await assert.rejects(runCandidate({ provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free',
    apiKey: 'test', fixture, upstream: 'Nvidia', fetchImpl }), { code: 'routing_unverified' });
});
