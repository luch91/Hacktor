import type { SessionContext } from '@hacktor/contracts';
import { generateDeterministicTestSlate } from '@hacktor/ideation';
import {
  DeterministicInferenceProvider,
  JsonInferenceProvider,
  type InferenceProvider,
} from '@hacktor/providers';

export type InferenceMode = 'deterministic' | 'live' | 'disabled';

export interface ProviderSettings {
  INFERENCE_MODE: string;
  INFERENCE_ENDPOINT?: string;
  INFERENCE_API_KEY?: string;
  INFERENCE_MODEL_ID?: string;
  INFERENCE_MAX_JOB_TOKENS?: string;
  INFERENCE_MAX_JOB_COST_USD?: string;
  INFERENCE_COST_PER_1K_TOKENS_USD?: string;
}

export interface ProviderSelection {
  mode: Exclude<InferenceMode, 'disabled'>;
  provider: InferenceProvider;
  max_job_tokens: number;
  max_job_cost_usd: number;
  cost_per_1k_tokens_usd: number;
}

export class ProviderUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderUnavailable';
  }
}

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function selectProvider(settings: ProviderSettings): ProviderSelection {
  if (settings.INFERENCE_MODE === 'deterministic') {
    return {
      mode: 'deterministic',
      provider: new DeterministicInferenceProvider((request) =>
        request.stage === 'diverge'
          ? generateDeterministicTestSlate(request.input as SessionContext)
          : { stage: request.stage, status: 'completed' },
      ),
      max_job_tokens: 0,
      max_job_cost_usd: 0,
      cost_per_1k_tokens_usd: 0,
    };
  }
  if (settings.INFERENCE_MODE !== 'live') {
    throw new ProviderUnavailable('Inference processing is disabled.');
  }
  if (!settings.INFERENCE_ENDPOINT || !settings.INFERENCE_API_KEY || !settings.INFERENCE_MODEL_ID) {
    throw new ProviderUnavailable('Live inference endpoint, credential, or model is unavailable.');
  }
  const maxTokens = positiveNumber(settings.INFERENCE_MAX_JOB_TOKENS, 12_000);
  const maxCost = positiveNumber(settings.INFERENCE_MAX_JOB_COST_USD, 0);
  const unitCost = positiveNumber(settings.INFERENCE_COST_PER_1K_TOKENS_USD, 0);
  if (maxCost <= 0 || unitCost <= 0) {
    throw new ProviderUnavailable('An approved live inference spending budget is unavailable.');
  }
  return {
    mode: 'live',
    provider: new JsonInferenceProvider({
      endpoint: settings.INFERENCE_ENDPOINT,
      apiKey: settings.INFERENCE_API_KEY,
      modelId: settings.INFERENCE_MODEL_ID,
      promptVersion: 'm1-live-v1',
    }),
    max_job_tokens: maxTokens,
    max_job_cost_usd: maxCost,
    cost_per_1k_tokens_usd: unitCost,
  };
}
