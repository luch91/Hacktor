export const ideaStrategies = [
  'neglected_actor',
  'constraint_inversion',
  'cross_domain_transfer',
  'negative_space',
  'second_order',
  'failure_first',
  'counterfactual',
  'low_resource',
  'institutional_bottleneck',
] as const;

export const evidenceStatuses = [
  'verified',
  'partial',
  'user_provided',
  'unverified',
  'insufficient_evidence',
] as const;

export const buildDifficulties = ['low', 'medium', 'high'] as const;

export type IdeaStrategy = (typeof ideaStrategies)[number];
export type EvidenceStatus = (typeof evidenceStatuses)[number];
export type BuildDifficulty = (typeof buildDifficulties)[number];

export interface IdeaCardV1 {
  schema_version: '1.0';
  name: string;
  one_liner: string;
  target_user: string;
  problem: string;
  underexplored_insight: string;
  mechanism: string;
  demo_moment: string;
  strategy: IdeaStrategy;
  major_failure_mode: string;
  evidence_status: EvidenceStatus;
  build_difficulty: BuildDifficulty;
  novelty_hypothesis: string;
  hard_constraint_ids: string[];
  hackathon_fit?: string | null;
  dependencies?: string[];
  source_ids?: string[];
  unknowns?: string[];
}

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  request_id: string;
}

export type ApiEnvelope<T> = { data: T } | { error: ApiError };

export interface JobQueueMessage {
  job_id: string;
  schema_version: '1.0';
}

export const ideaCommands = [
  'make_stranger',
  'make_realistic',
  'challenge',
  'find_other_problem',
  'switch_domain',
  'combine',
  'branch',
  'reject',
  'pin',
  'research_more',
] as const;

export type IdeaCommand = (typeof ideaCommands)[number];

export interface IdeaActionRequest {
  command: IdeaCommand;
  instruction?: string;
  other_parent_version_id?: string;
  reason?: string;
}

export interface SessionContext {
  summary: string;
  beneficiaries: string[];
  goals: string[];
  hard_constraints: Array<{ id: string; text: string }>;
  soft_constraints: Array<{ id: string; text: string }>;
  unknowns: string[];
  confirmed: boolean;
  source_status: 'user_provided';
}

export interface SessionContextDraft {
  session_id: string;
  context: SessionContext;
  base_context_revision: number;
  draft_revision: number;
  updated_at: string;
}

export interface BlueprintSummary {
  id: string;
  idea_version_id: string;
  version: number;
  review_required: boolean;
  created_at: string;
}

export interface BlueprintRecord extends BlueprintSummary {
  content_markdown: string;
}

export interface OpportunityHypothesis {
  id: string;
  session_id: string;
  problem: string;
  beneficiary: string | null;
  assumption: string | null;
  evidence_refs: string[];
  evidence_status: 'unverified';
  created_at: string;
}

export function validateSessionContext(value: unknown): value is SessionContext {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.summary === 'string' && item.summary.length <= 40_000
    && Array.isArray(item.beneficiaries) && item.beneficiaries.every((entry) => typeof entry === 'string')
    && Array.isArray(item.goals) && item.goals.every((entry) => typeof entry === 'string')
    && Array.isArray(item.hard_constraints) && item.hard_constraints.every((entry) => Boolean(entry) && typeof entry === 'object' && typeof (entry as { id?: unknown }).id === 'string' && typeof (entry as { text?: unknown }).text === 'string')
    && Array.isArray(item.soft_constraints) && item.soft_constraints.every((entry) => Boolean(entry) && typeof entry === 'object' && typeof (entry as { id?: unknown }).id === 'string' && typeof (entry as { text?: unknown }).text === 'string')
    && Array.isArray(item.unknowns) && item.unknowns.every((entry) => typeof entry === 'string')
    && typeof item.confirmed === 'boolean' && item.source_status === 'user_provided';
}

type ValidationResult =
  | { success: true; data: IdeaCardV1 }
  | { success: false; errors: readonly string[] };

const requiredStrings: ReadonlyArray<keyof IdeaCardV1> = [
  'name',
  'one_liner',
  'target_user',
  'problem',
  'underexplored_insight',
  'mechanism',
  'demo_moment',
  'major_failure_mode',
  'novelty_hypothesis',
];

export function validateIdeaCard(value: unknown): ValidationResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { success: false, errors: ['Idea card must be an object'] };
  }

  const candidate = value as Record<string, unknown>;
  const errors: string[] = [];

  if (candidate.schema_version !== '1.0') errors.push('schema_version must be 1.0');
  for (const key of requiredStrings) {
    if (typeof candidate[key] !== 'string' || candidate[key].length === 0) {
      errors.push(`${key} must be a non-empty string`);
    }
  }
  if (!ideaStrategies.includes(candidate.strategy as IdeaStrategy)) {
    errors.push('strategy is invalid');
  }
  if (!evidenceStatuses.includes(candidate.evidence_status as EvidenceStatus)) {
    errors.push('evidence_status is invalid');
  }
  if (!buildDifficulties.includes(candidate.build_difficulty as BuildDifficulty)) {
    errors.push('build_difficulty is invalid');
  }
  if (!Array.isArray(candidate.hard_constraint_ids)) {
    errors.push('hard_constraint_ids must be an array');
  }

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, data: candidate as unknown as IdeaCardV1 };
}
