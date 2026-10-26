import { readFile } from 'node:fs/promises';

export const strategies = [
  'neglected_actor', 'constraint_inversion', 'cross_domain_transfer',
  'negative_space', 'second_order', 'failure_first', 'counterfactual',
  'low_resource', 'institutional_bottleneck',
];

const endpoints = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  together: 'https://api.together.xyz/v1/chat/completions',
};

const cardProperties = {
  strategy: { type: 'string', enum: strategies },
  problem: { type: 'string' },
  beneficiary: { type: 'string' },
  mechanism: { type: 'string' },
  feasible_mvp: { type: 'string' },
  demo_sequence: { type: 'array', items: { type: 'string' } },
  dependencies: { type: 'array', items: { type: 'string' } },
  hard_constraint_ids: { type: 'array', items: { type: 'string' } },
};

export const cardSchema = {
  type: 'object', properties: cardProperties,
  required: Object.keys(cardProperties), additionalProperties: false,
};
export const slateSchema = {
  type: 'object', properties: { cards: { type: 'array', items: cardSchema } },
  required: ['cards'], additionalProperties: false,
};

export class BakeoffError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'BakeoffError';
    this.code = code;
    this.status = status;
  }
}

export function classifyStatus(status) {
  if (status === 400 || status === 422) return 'invalid_request';
  if (status === 401 || status === 403) return 'authentication_blocked';
  if (status === 402) return 'payment_required';
  if (status === 404) return 'model_unavailable';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'provider_unavailable';
  return 'http_error';
}

function requiredStrings(value, keys) {
  return keys.every((key) => typeof value[key] === 'string' && value[key].trim().length > 0);
}

export function validateCard(card, fixture) {
  if (!card || typeof card !== 'object' || Array.isArray(card)) return 'invalid_card';
  if (!strategies.includes(card.strategy)) return 'invalid_strategy';
  if (!requiredStrings(card, ['problem', 'beneficiary', 'mechanism', 'feasible_mvp'])) return 'missing_field';
  if (!Array.isArray(card.demo_sequence) || card.demo_sequence.length === 0 ||
    !card.demo_sequence.every((item) => typeof item === 'string' && item.trim())) return 'invalid_demo';
  if (!Array.isArray(card.dependencies) || !card.dependencies.every((item) => typeof item === 'string')) return 'invalid_dependencies';
  if (!Array.isArray(card.hard_constraint_ids) ||
    !fixture.hard_constraints.every((item) => card.hard_constraint_ids.includes(item.id))) return 'missing_constraint_id';
  const text = [card.problem, card.beneficiary, card.mechanism, card.feasible_mvp,
    ...card.demo_sequence, ...card.dependencies].join(' ').toLowerCase();
  if (text.includes(String.fromCodePoint(0x2014))) return 'forbidden_typography';
  for (const phrase of fixture.disallowed_phrases ?? []) {
    if (text.includes(phrase.toLowerCase())) return 'obvious_constraint_violation';
  }
  return null;
}

export function validateOutput(output, fixture, task = 'card') {
  const cards = task === 'slate' ? output?.cards : [output];
  if (!Array.isArray(cards) || cards.length !== (task === 'slate' ? 9 : 1)) return 'invalid_card_count';
  for (const card of cards) {
    const problem = validateCard(card, fixture);
    if (problem) return problem;
  }
  if (task === 'slate') {
    if (new Set(cards.map((card) => card.strategy)).size !== 9) return 'duplicate_strategy';
    const mechanisms = cards.map((card) => card.mechanism.trim().toLowerCase());
    if (new Set(mechanisms).size < 7) return 'duplicate_mechanism';
  }
  return null;
}

export function buildRequest({ provider, model, fixture, task = 'card', maxOutputTokens = 900, upstream }) {
  if (!endpoints[provider]) throw new BakeoffError('unsupported_provider', 'Unsupported provider.');
  if (!model || !fixture?.brief || !Array.isArray(fixture.hard_constraints)) {
    throw new BakeoffError('invalid_fixture', 'Model or synthetic fixture is incomplete.');
  }
  const schema = task === 'slate' ? slateSchema : cardSchema;
  const instruction = task === 'slate'
    ? `Create nine substantive ideas, one per strategy: ${strategies.join(', ')}.`
    : `Create one idea using strategy ${strategies[0]}.`;
  const body = {
    model,
    messages: [
      { role: 'system', content: `You design feasible hackathon concepts. ${instruction} Return JSON matching the supplied schema. Never invent data availability, citations, or originality measurements.` },
      { role: 'user', content: JSON.stringify({ brief: fixture.brief, hard_constraints: fixture.hard_constraints, target_beneficiaries: fixture.target_beneficiaries, build_time_hours: fixture.build_time_hours }) },
    ],
    max_tokens: maxOutputTokens,
    response_format: { type: 'json_schema', json_schema: { name: task === 'slate' ? 'hacktor_slate' : 'hacktor_card', strict: true, schema } },
  };
  if (provider === 'openrouter') {
    body.provider = { require_parameters: true, allow_fallbacks: false,
      ...(upstream ? { only: [upstream] } : {}) };
    body.usage = { include: true };
  }
  return body;
}

export async function assertFreeCatalog({ provider, model, apiKey, upstream, fetchImpl = fetch }) {
  if (!apiKey) throw new BakeoffError('missing_key', 'Provider key is unavailable.');
  if (provider === 'openrouter') {
    const response = await fetchImpl('https://openrouter.ai/api/v1/models');
    if (!response.ok) throw new BakeoffError('catalog_unavailable', 'OpenRouter catalog is unavailable.', response.status);
    const catalog = await response.json();
    const entry = catalog.data?.find((item) => item.id === model);
    if (!entry || !model.endsWith(':free') || Number(entry.pricing?.prompt) !== 0 || Number(entry.pricing?.completion) !== 0) {
      throw new BakeoffError('not_verified_free', 'Model is absent or is not confirmed free in the current catalog.');
    }
    if (!upstream) throw new BakeoffError('upstream_required', 'A named OpenRouter upstream is required.');
    const endpointResponse = await fetchImpl(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
    if (!endpointResponse.ok) throw new BakeoffError('catalog_unavailable', 'OpenRouter endpoint catalog is unavailable.', endpointResponse.status);
    const endpoints = (await endpointResponse.json()).data?.endpoints ?? [];
    const eligible = endpoints.find((item) => item.provider_name?.toLowerCase() === upstream.toLowerCase() &&
      Number(item.pricing?.prompt) === 0 && Number(item.pricing?.completion) === 0 &&
      item.supported_parameters?.includes('structured_outputs'));
    if (!eligible) throw new BakeoffError('not_verified_free', 'Named upstream is not confirmed free with structured output.');
    return entry;
  }
  if (provider === 'together') {
    if (model !== 'Prism-ML/Ternary-Bonsai-27B') {
      throw new BakeoffError('not_verified_free', 'Only the documented free Together model is allowed.');
    }
    const response = await fetchImpl('https://api.together.xyz/v1/models', {
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) throw new BakeoffError('catalog_unavailable', 'Together account model list is unavailable.', response.status);
    const catalog = await response.json();
    const entries = Array.isArray(catalog) ? catalog : catalog.data ?? [];
    const entry = entries.find((item) => item.id === model);
    if (!entry) throw new BakeoffError('model_unavailable', 'Free model is absent from the account catalog.');
    const price = entry.pricing ?? entry.price;
    if (price && !(Number(price.input ?? price.prompt) === 0 && Number(price.output ?? price.completion) === 0)) {
      throw new BakeoffError('not_verified_free', 'Account catalog does not confirm zero price.');
    }
    const publicPage = await fetchImpl('https://www.together.ai/models/prism-ml-ternary-bonsai-27b');
    if (!publicPage.ok) throw new BakeoffError('catalog_unavailable', 'Together public pricing page is unavailable.', publicPage.status);
    const pageText = await publicPage.text();
    if (!pageText.includes(model) || !pageText.includes('$0.00')) {
      throw new BakeoffError('not_verified_free', 'Together public page no longer confirms the free model.');
    }
    return entry;
  }
  throw new BakeoffError('unsupported_provider', 'Unsupported provider.');
}

async function requestJson(url, options, fetchImpl, timeoutMs, dispatched) {
  let response;
  try {
    response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    throw new BakeoffError(dispatched ? 'outcome_unknown' : 'connectivity_failed', 'Request outcome could not be confirmed.');
  }
  if (!response.ok) throw new BakeoffError(classifyStatus(response.status), `Provider returned HTTP ${response.status}.`, response.status);
  try { return await response.json(); } catch {
    throw new BakeoffError('malformed_json', 'Provider response was not valid JSON.');
  }
}

export async function runCandidate({ provider, model, apiKey, fixture, task = 'card', upstream,
  fetchImpl = fetch, timeoutMs = 30000, maxOutputTokens = 900, endpoint = endpoints[provider] }) {
  if (!apiKey) throw new BakeoffError('missing_key', 'Provider key is unavailable.');
  const body = buildRequest({ provider, model, fixture, task, maxOutputTokens, upstream });
  const started = performance.now();
  const result = await requestJson(endpoint, {
    method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }, fetchImpl, timeoutMs, true);
  const choice = result.choices?.[0];
  if (choice?.finish_reason === 'length') throw new BakeoffError('truncated_output', 'Output was truncated.');
  if (choice?.finish_reason === 'content_filter' || choice?.message?.refusal) {
    throw new BakeoffError('refusal', 'Provider refused the request.');
  }
  if (!result.id || result.model !== model || typeof choice?.message?.content !== 'string') {
    throw new BakeoffError('invalid_envelope', 'Response identity or content is invalid.');
  }
  let output;
  try { output = JSON.parse(choice.message.content); } catch {
    throw new BakeoffError('malformed_output', 'Model output is not valid JSON.');
  }
  const validation = validateOutput(output, fixture, task);
  if (validation) throw new BakeoffError(validation, `Output failed ${validation}.`);
  const usage = result.usage;
  if (!Number.isSafeInteger(usage?.prompt_tokens) || !Number.isSafeInteger(usage?.completion_tokens)) {
    throw new BakeoffError('usage_unverified', 'Provider did not return valid token usage.');
  }
  if (usage.prompt_tokens < 0 || usage.completion_tokens < 0 || usage.completion_tokens > maxOutputTokens) {
    throw new BakeoffError('usage_over_budget', 'Provider token usage exceeded the request limit.');
  }
  let routedProvider = provider;
  let actualCost = null;
  let reasoningTokens = usage.completion_tokens_details?.reasoning_tokens ?? null;
  if (provider === 'openrouter') {
    const metadata = await requestJson(`https://openrouter.ai/api/v1/generation?id=${encodeURIComponent(result.id)}`, {
      headers: { authorization: `Bearer ${apiKey}` },
    }, fetchImpl, timeoutMs, false);
    routedProvider = metadata.data?.provider_name;
    actualCost = metadata.data?.total_cost;
    reasoningTokens = metadata.data?.native_tokens_reasoning ?? reasoningTokens;
    if (!routedProvider || (upstream && routedProvider.toLowerCase() !== upstream.toLowerCase())) {
      throw new BakeoffError('routing_unverified', 'Upstream provider does not match the allowlist.');
    }
  }
  return {
    provider, model, routed_provider: routedProvider, task, output,
    usage: { input_tokens: usage.prompt_tokens, output_tokens: usage.completion_tokens,
      reasoning_tokens: reasoningTokens, reported_cost_usd: actualCost ?? usage.cost ?? null },
    latency_ms: Math.round(performance.now() - started), generation_id: result.id,
  };
}

export async function loadFixture(path) {
  const fixture = JSON.parse(await readFile(path, 'utf8'));
  if (!fixture.brief || !Array.isArray(fixture.hard_constraints)) {
    throw new BakeoffError('invalid_fixture', 'Fixture is invalid.');
  }
  return fixture;
}
