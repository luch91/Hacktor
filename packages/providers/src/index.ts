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
