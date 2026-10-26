import type { IdeationStage } from '@hacktor/ideation';

export interface StageBudget {
  max_output_tokens: number;
  max_attempts: number;
}

export interface StageRunRequest<TInput> {
  stage: IdeationStage;
  input: TInput;
  output_schema_version: string;
  constraints: readonly string[];
  model_policy: string;
  budget: StageBudget;
  run_metadata: Readonly<Record<string, string>>;
}

export interface StageRunResult<TOutput> {
  output: TOutput;
  provider: string;
  model_id: string;
  prompt_version: string;
  usage: Readonly<Record<string, number>>;
}

export interface InferenceProvider {
  runStage<TInput, TOutput>(request: StageRunRequest<TInput>): Promise<StageRunResult<TOutput>>;
}

export function normalizeGeneratedValue<T>(value: T): T {
  if (typeof value === 'string') return value.replaceAll(String.fromCodePoint(0x2014), '-') as T;
  if (Array.isArray(value)) return value.map((item) => normalizeGeneratedValue(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeGeneratedValue(item)]),
    ) as T;
  }
  return value;
}

export type DeterministicStageRunner = (request: StageRunRequest<unknown>) => unknown;

export class DeterministicInferenceProvider implements InferenceProvider {
  constructor(private readonly runner: DeterministicStageRunner) {}

  async runStage<TInput, TOutput>(
    request: StageRunRequest<TInput>,
  ): Promise<StageRunResult<TOutput>> {
    const output = normalizeGeneratedValue(this.runner(request as StageRunRequest<unknown>) as TOutput);
    return Promise.resolve({
      output,
      provider: 'deterministic_test_adapter',
      model_id: 'hacktor-fixture-v1',
      prompt_version: 'm1-deterministic-v1',
      usage: { input_tokens: 0, output_tokens: 0 },
    });
  }
}

export interface JsonInferenceProviderOptions {
  endpoint: string;
  apiKey: string;
  modelId: string;
  promptVersion: string;
  timeoutMs?: number;
}

export class JsonInferenceProvider implements InferenceProvider {
  constructor(private readonly options: JsonInferenceProviderOptions) {}

  async runStage<TInput, TOutput>(
    request: StageRunRequest<TInput>,
  ): Promise<StageRunResult<TOutput>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 30_000);
    try {
      const response = await fetch(this.options.endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.options.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: this.options.modelId, request }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Inference provider returned HTTP ${response.status}`);
      }
      const body: unknown = await response.json();
      if (!body || typeof body !== 'object' || !('output' in body)) {
        throw new Error('Inference provider returned an invalid JSON envelope');
      }
      const envelope = body as { output: TOutput; usage?: Record<string, number> };
      return {
        output: normalizeGeneratedValue(envelope.output),
        provider: 'json_inference_provider',
        model_id: this.options.modelId,
        prompt_version: this.options.promptVersion,
        usage: envelope.usage ?? {},
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
