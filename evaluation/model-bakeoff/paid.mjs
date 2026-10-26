import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildRequest, loadFixture, validateOutput, BakeoffError } from './runner.mjs';
import { openLedger, reserve, dispatch, markUnknown, reconcile,
  reconcileRejected, reservedMicro, snapshot } from './ledger.mjs';

export const paidCandidates = Object.freeze({
  qwen: { provider: 'openrouter', model: 'qwen/qwen3.5-flash-02-23',
    upstream: 'Alibaba', maxInputRate: 0.065, maxOutputRate: 0.26 },
  glm: { provider: 'openrouter', model: 'z-ai/glm-5.3-flash',
    upstream: 'StreamLake', maxInputRate: 0.0435, maxOutputRate: 0.145 },
});

const sha = (value) => createHash('sha256').update(value).digest('hex');
const fixtureHash = '334808f84262ecaff3034ffb6a4951419be20e98d5ebbe333b2fa9a0750fa5a1';
const safeJson = (value) => JSON.stringify(value, null, 2).replaceAll(String.fromCodePoint(0x2014), '\\u2014') + '\n';

async function assertSyntheticFixture(fixture) {
  const path = resolve('evaluation/model-bakeoff/fixtures/pilot-briefs.json');
  if (sha(await readFile(path)) !== fixtureHash) throw new BakeoffError('fixture_changed', 'Pilot fixture hash changed.');
  const expected = await loadFixture(path, fixture.id);
  if (JSON.stringify(expected) !== JSON.stringify(fixture)) {
    throw new BakeoffError('fixture_changed', 'Paid prompt differs from the frozen synthetic fixture.');
  }
}

async function getJson(url, key, fetchImpl) {
  const response = await fetchImpl(url, { headers: { authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new BakeoffError('read_only_preflight_failed', 'Read-only provider check failed.', response.status);
  return response.json();
}

export async function keyUsage(key, fetchImpl = fetch) {
  if (!key) throw new BakeoffError('missing_key', 'Provider key is unavailable.');
  const result = await getJson('https://openrouter.ai/api/v1/key', key, fetchImpl);
  const usage = result.data?.usage;
  if (typeof usage !== 'number' || !Number.isFinite(usage) || usage < 0) {
    throw new BakeoffError('balance_unavailable', 'Key usage is unavailable.');
  }
  return usage;
}

export async function verifyPaidCatalog(candidate, fetchImpl = fetch) {
  if (candidate.provider !== 'openrouter' || !candidate.upstream) {
    throw new BakeoffError('billing_unavailable', 'No verified charge reconciliation path.');
  }
  const base = 'https://openrouter.ai/api/v1/models/';
  const models = await fetchImpl('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(15000) });
  if (!models.ok) throw new BakeoffError('catalog_unavailable', 'Model catalog unavailable.', models.status);
  const listed = (await models.json()).data?.find((item) => item.id === candidate.model);
  if (!listed) throw new BakeoffError('model_unavailable', 'Model absent from current catalog.');
  const endpointResponse = await fetchImpl(`${base}${candidate.model}/endpoints`, { signal: AbortSignal.timeout(15000) });
  if (!endpointResponse.ok) throw new BakeoffError('catalog_unavailable', 'Upstream catalog unavailable.', endpointResponse.status);
  const endpoints = (await endpointResponse.json()).data?.endpoints ?? [];
  const exact = endpoints.find((item) => item.provider_name === candidate.upstream &&
    item.supported_parameters?.includes('structured_outputs'));
  if (!exact) throw new BakeoffError('upstream_unavailable', 'Named schema upstream is unavailable.');
  const inputRate = Number(exact.pricing?.prompt) * 1_000_000;
  const outputRate = Number(exact.pricing?.completion) * 1_000_000;
  if (!Number.isFinite(inputRate) || !Number.isFinite(outputRate) ||
    inputRate <= 0 || outputRate <= 0 || inputRate > candidate.maxInputRate + 0.0000001 ||
    outputRate > candidate.maxOutputRate + 0.0000001) {
    throw new BakeoffError('unexpected_price', 'Current endpoint rate exceeds frozen ceiling.');
  }
  return { inputRate, outputRate, maxOutputTokens: exact.max_completion_tokens ?? null };
}

export async function executePaid({ candidateKey, fixture, task, key, dbPath,
  maxOutputTokens = task === 'slate' ? 6000 : 900, fetchImpl = fetch,
  authorized = false, timeoutMs = 120000 }) {
  if (!authorized) throw new BakeoffError('paid_mode_disabled', 'Explicit local paid mode is required.');
  const candidate = paidCandidates[candidateKey];
  if (!candidate || !key || !fixture?.id || !['card', 'slate'].includes(task)) {
    throw new BakeoffError('invalid_paid_request', 'Paid candidate or synthetic fixture is invalid.');
  }
  if (!dbPath || maxOutputTokens > 6000 || maxOutputTokens < 1) {
    throw new BakeoffError('invalid_paid_request', 'Output limit or ledger path is invalid.');
  }
  await assertSyntheticFixture(fixture);
  const price = await verifyPaidCatalog(candidate, fetchImpl);
  if (price.maxOutputTokens !== null && price.maxOutputTokens < maxOutputTokens) {
    throw new BakeoffError('output_limit_unavailable', 'Model output limit is too small.');
  }
  const baselineUsage = await keyUsage(key, fetchImpl);
  const body = buildRequest({ ...candidate, fixture, task, maxOutputTokens });
  const requestText = JSON.stringify(body);
  const inputTokenEstimate = Buffer.byteLength(requestText, 'utf8') + 128;
  const reserveMicro = reservedMicro({ inputTokenEstimate, maxOutputTokens,
    inputRate: price.inputRate, outputRate: price.outputRate });
  const estimateMicro = Math.ceil(reserveMicro / 2);
  const db = openLedger(dbPath);
  let id;
  try {
    id = reserve(db, { ...candidate, briefId: fixture.id, promptVersion: 'm2a-pilot-v2',
      schemaVersion: 'idea-card-v1', requestHash: sha(`${candidate.model}\n${candidate.upstream}\n${fixture.id}\n${requestText}`),
      inputTokenEstimate, maxOutputTokens, estimateMicro, reserveMicro });
    dispatch(db, id);
    const started = performance.now();
    let response;
    try {
      response = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: requestText, signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      markUnknown(db, id, 'outcome_unknown');
      throw new BakeoffError('outcome_unknown', 'Dispatched request may be billable.');
    }
    if (!response.ok) {
      let after;
      try { after = await keyUsage(key, fetchImpl); } catch { markUnknown(db, id, 'billing_unavailable'); throw new BakeoffError('billing_unavailable', 'Failed request could not be reconciled.'); }
      try { reconcileRejected(db, id, { status: response.status, balanceMovement: after - baselineUsage }); }
      catch { markUnknown(db, id, 'rejected_billing_unverified'); throw new BakeoffError('rejected_billing_unverified', 'Failed request may be billable.'); }
      return { attempt_id: id, status: 'rejected', http_status: response.status,
        latency_ms: Math.round(performance.now() - started), charge_usd: 0 };
    }
    let result;
    try { result = await response.json(); } catch { markUnknown(db, id, 'malformed_json'); throw new BakeoffError('malformed_json', 'Paid response lacks parseable generation evidence.'); }
    if (!result.id) { markUnknown(db, id, 'missing_generation_id'); throw new BakeoffError('missing_generation_id', 'Paid response cannot be reconciled.'); }
    let metadata;
    let afterUsage;
    try {
      metadata = (await getJson(`https://openrouter.ai/api/v1/generation?id=${encodeURIComponent(result.id)}`, key, fetchImpl)).data;
      afterUsage = await keyUsage(key, fetchImpl);
    } catch { markUnknown(db, id, 'billing_unavailable'); throw new BakeoffError('billing_unavailable', 'Paid response could not be reconciled.'); }
    if (metadata?.provider_name !== candidate.upstream || result.model !== candidate.model) {
      markUnknown(db, id, 'routing_mismatch');
      throw new BakeoffError('routing_mismatch', 'Actual model or upstream differs from the allowlist.');
    }
    const input = result.usage?.prompt_tokens;
    const output = result.usage?.completion_tokens;
    try {
      reconcile(db, id, { generationId: result.id, inputTokens: input, outputTokens: output,
        reasoningTokens: metadata.native_tokens_reasoning ?? null,
        providerCharge: metadata.total_cost, balanceMovement: afterUsage - baselineUsage });
    } catch (error) {
      markUnknown(db, id, error.code ?? 'billing_conflict');
      throw new BakeoffError(error.code ?? 'billing_conflict', 'Paid request billing could not be reconciled.');
    }
    let outputData;
    let validation;
    try { outputData = JSON.parse(result.choices?.[0]?.message?.content ?? '');
      validation = validateOutput(outputData, fixture, task); }
    catch { validation = 'malformed_output'; }
    if (result.choices?.[0]?.finish_reason === 'length') validation = 'truncated_output';
    if (result.choices?.[0]?.message?.refusal) validation = 'refusal';
    const outputDir = resolve('evaluation/model-bakeoff/output');
    await mkdir(outputDir, { recursive: true });
    await writeFile(resolve(outputDir, `${id}.json`), safeJson({ attempt_id: id,
      candidate: candidateKey, brief_id: fixture.id, task, output: outputData ?? null,
      validation: validation ?? null, latency_ms: Math.round(performance.now() - started) }));
    return { attempt_id: id, status: validation ? 'invalid' : 'valid',
      validation: validation ?? null, input_tokens: input, output_tokens: output,
      charge_usd: snapshot(db).attempts.find((item) => item.id === id).final_charge_micro / 1_000_000,
      latency_ms: Math.round(performance.now() - started) };
  } finally { db.close(); }
}
