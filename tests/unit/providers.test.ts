import { afterEach, describe, expect, it, vi } from 'vitest';
import { JsonInferenceProvider, normalizeGeneratedValue } from '../../packages/providers/src/index';

const request = {
  stage: 'diverge' as const,
  input: { brief: 'untrusted user input' },
  output_schema_version: '1.0',
  constraints: [],
  model_policy: 'test',
  budget: { max_output_tokens: 100, max_attempts: 1 },
  run_metadata: {},
};

afterEach(() => vi.restoreAllMocks());

describe('provider safety boundary', () => {
  it('normalizes forbidden typography recursively', () => {
    const forbidden = String.fromCodePoint(0x2014);
    expect(normalizeGeneratedValue({ text: `a${forbidden}b`, nested: [`c${forbidden}d`] })).toEqual({
      text: 'a-b',
      nested: ['c-d'],
    });
  });

  it('rejects an invalid provider JSON envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: 'missing output' }))));
    const provider = new JsonInferenceProvider({ endpoint: 'https://provider.test', apiKey: 'test-only', modelId: 'model', promptVersion: 'v1' });
    await expect(provider.runStage(request)).rejects.toThrow('invalid JSON envelope');
  });

  it('fails safely on a provider HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('quota', { status: 429 })));
    const provider = new JsonInferenceProvider({ endpoint: 'https://provider.test', apiKey: 'test-only', modelId: 'model', promptVersion: 'v1' });
    await expect(provider.runStage(request)).rejects.toThrow('HTTP 429');
  });
});
