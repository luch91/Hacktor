import { ideaStrategies, validateIdeaCard, type IdeaCardV1, type JobQueueMessage, type SessionContext } from '@hacktor/contracts';
import { buildBlueprint, ideationStages, type IdeationStage } from '@hacktor/ideation';
import type { StageRunResult } from '@hacktor/providers';
import { ProviderUnavailable, selectProvider, type ProviderSelection, type ProviderSettings } from './provider';

interface JobRow {
  id: string;
  session_id: string;
  owner_key: string;
  job_type: string;
  request_json: string;
  attempt_count: number;
  max_attempts: number;
  cancel_requested: number;
  lease_token: string;
  inference_mode: string;
}

interface StageRunRow {
  stage: string;
  usage_json: string;
}

export interface ProcessingResult {
  job_id: string;
  status: 'completed' | 'duplicate' | 'cancelled' | 'retry_wait' | 'failed' | 'blocked_quota';
  artifact_ids?: string[];
}

class ProcessingFailure extends Error {
  constructor(message: string, readonly retryable: boolean, readonly quota = false) {
    super(message);
  }
}

function parseJobRequest(value: string): { idea_version_id?: string } {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new ProcessingFailure('Job request is invalid.', false);
  return parsed as { idea_version_id?: string };
}

function selectedStages(jobType: string): IdeationStage[] {
  if (jobType === 'opportunity_map') return ['understand', 'map'];
  if (jobType === 'diverse_slate') return ['understand', 'map', 'diverge'];
  if (jobType === 'validation') return ['research', 'converge'];
  if (jobType === 'blueprint') return ['blueprint'];
  throw new ProcessingFailure('Job type is unsupported.', false);
}

export function validateDiverseSlate(output: unknown, context: SessionContext): IdeaCardV1[] {
  if (!Array.isArray(output) || output.length !== ideaStrategies.length) {
    throw new ProcessingFailure('Inference must return exactly nine Idea Cards.', false);
  }
  const cards: IdeaCardV1[] = [];
  const strategies = new Set<string>();
  const problems = new Set<string>();
  const mechanisms = new Set<string>();
  const beneficiaries = new Set<string>();
  const requiredIds = new Set(context.hard_constraints.map((item) => item.id));
  for (const outputCard of output) {
    const validation = validateIdeaCard(outputCard);
    if (!validation.success) throw new ProcessingFailure(`Invalid Idea Card: ${validation.errors.join('; ')}`, false);
    const card = validation.data;
    if (card.source_ids?.length) throw new ProcessingFailure('Unverified generation cannot cite source records.', false);
    if (card.evidence_status === 'verified' || card.evidence_status === 'partial') {
      throw new ProcessingFailure('Generated ideas cannot claim verified evidence.', false);
    }
    if (!Array.isArray(card.hard_constraint_ids) || [...requiredIds].some((id) => !card.hard_constraint_ids.includes(id))) {
      throw new ProcessingFailure('Idea Card omitted a hard constraint.', false);
    }
    for (const key of ['name', 'one_liner', 'target_user', 'problem', 'mechanism'] as const) {
      if (card[key].includes(String.fromCodePoint(0x2014))) throw new ProcessingFailure('Forbidden typography in Idea Card.', false);
    }
    strategies.add(card.strategy);
    problems.add(card.problem.trim().toLowerCase());
    mechanisms.add(card.mechanism.trim().toLowerCase());
    beneficiaries.add(card.target_user.trim().toLowerCase());
    cards.push(card);
  }
  if (strategies.size !== ideaStrategies.length || problems.size < 7 || mechanisms.size < 7 || beneficiaries.size < 3) {
    throw new ProcessingFailure('Idea slate lacks strategy, problem, mechanism, or beneficiary diversity.', false);
  }
  return cards;
}

export async function claimStudioJob(db: D1Database, jobId: string): Promise<JobRow | null> {
  const leaseToken = crypto.randomUUID();
  return db.prepare(
    `UPDATE jobs SET status = 'running',lease_token = ?,
       lease_expires_at = datetime('now','+5 minutes'),attempt_count = attempt_count + 1,
       updated_at = datetime('now')
     WHERE id = ? AND cancel_requested = 0 AND attempt_count < max_attempts
       AND (status IN ('queued','retry_wait')
         OR (status = 'running' AND datetime(lease_expires_at) <= datetime('now')))
     RETURNING id,session_id,owner_key,job_type,request_json,attempt_count,
       max_attempts,cancel_requested,lease_token,inference_mode`,
  ).bind(leaseToken, jobId).first<JobRow>();
}

async function renewLease(db: D1Database, job: JobRow): Promise<void> {
  const row = await db.prepare(
    `UPDATE jobs SET lease_expires_at = datetime('now','+5 minutes'),updated_at = datetime('now')
     WHERE id = ? AND lease_token = ? AND status = 'running'
       AND datetime(lease_expires_at) > datetime('now') RETURNING id`,
  ).bind(job.id, job.lease_token).first<{ id: string }>();
  if (!row) throw new ProcessingFailure('Job lease was lost.', true);
}

async function previousStage(db: D1Database, jobId: string, stage: IdeationStage): Promise<StageRunRow | null> {
  return db.prepare('SELECT stage,usage_json FROM generation_runs WHERE job_id = ? AND stage = ?')
    .bind(jobId, stage).first<StageRunRow>();
}

async function existingArtifacts(db: D1Database, job: JobRow): Promise<string[]> {
  if (job.job_type === 'diverse_slate') {
    const rows = await db.prepare('SELECT id FROM idea_versions WHERE generation_job_id = ? ORDER BY created_at,id')
      .bind(job.id).all<{ id: string }>();
    return rows.results.map((row) => row.id);
  }
  if (job.job_type === 'validation') {
    const rows = await db.prepare("SELECT id FROM scorecards WHERE rubric_version = ? ORDER BY created_at,id")
      .bind(`m1-job:${job.id}`).all<{ id: string }>();
    return rows.results.map((row) => row.id);
  }
  if (job.job_type === 'blueprint') {
    const rows = await db.prepare('SELECT id FROM blueprints WHERE id = ?').bind(job.id).all<{ id: string }>();
    return rows.results.map((row) => row.id);
  }
  return [];
}

function tokenCount(usage: Readonly<Record<string, number>>): number {
  const input = usage.input_tokens;
  const output = usage.output_tokens;
  if (!Number.isSafeInteger(input) || !Number.isSafeInteger(output) || input! < 0 || output! < 0) {
    throw new ProcessingFailure('Provider returned invalid token usage.', false);
  }
  return input! + output!;
}

async function consumedBudget(db: D1Database, jobId: string): Promise<{ tokens: number; cost: number }> {
  const runs = await db.prepare('SELECT usage_json FROM generation_runs WHERE job_id = ?').bind(jobId).all<{ usage_json: string }>();
  const tokens = runs.results.reduce((sum, row) => sum + tokenCount(JSON.parse(row.usage_json) as Record<string, number>), 0);
  const costRow = await db.prepare("SELECT COALESCE(SUM(estimated_cost_usd),0) AS cost FROM usage_ledger WHERE job_id = ? AND kind = 'settle'")
    .bind(jobId).first<{ cost: number }>();
  return { tokens, cost: costRow?.cost ?? 0 };
}

async function reserveStageBudget(db: D1Database, job: JobRow, selection: ProviderSelection, stage: IdeationStage, context: SessionContext, maxOutput: number): Promise<void> {
  if (selection.mode !== 'live') return;
  const existing = await db.prepare('SELECT id FROM usage_ledger WHERE provider_invocation_id = ?')
    .bind(`${job.id}:${stage}:reserve`).first<{ id: string }>();
  if (existing) throw new ProcessingFailure('A prior live invocation has an uncertain outcome. Manual review is required.', false);
  const used = await consumedBudget(db, job.id);
  const estimatedInput = Math.ceil(JSON.stringify(context).length / 4);
  const maximumTokens = estimatedInput + maxOutput;
  const maximumCost = maximumTokens / 1000 * selection.cost_per_1k_tokens_usd;
  if (used.tokens + maximumTokens > selection.max_job_tokens || used.cost + maximumCost > selection.max_job_cost_usd) {
    throw new ProcessingFailure('The remaining job token or spending budget is insufficient.', false, true);
  }
  await db.prepare(
    `INSERT INTO usage_ledger (id,owner_key,provider_invocation_id,job_id,usage_units,estimated_cost_usd,kind)
     VALUES (?,?,?,?,?,?,'reserve')`,
  ).bind(crypto.randomUUID(), job.owner_key, `${job.id}:${stage}:reserve`, job.id, maximumTokens, maximumCost).run();
}

async function persistStage(
  db: D1Database,
  job: JobRow,
  stage: IdeationStage,
  run: StageRunResult<unknown>,
  context: SessionContext,
  selection: ProviderSelection,
  startedAt: number,
): Promise<string[]> {
  await renewLease(db, job);
  const statements: D1PreparedStatement[] = [];
  const artifactIds: string[] = [];
  if (stage === 'diverge' && job.job_type === 'diverse_slate') {
    const cards = validateDiverseSlate(run.output, context);
    const prior = await db.prepare('SELECT card_json FROM idea_versions WHERE session_id = ? AND generation_job_id IS NULL')
      .bind(job.session_id).all<{ card_json: string }>();
    const known = new Set(prior.results.map((row) => {
      const card = JSON.parse(row.card_json) as IdeaCardV1;
      return `${card.problem.toLowerCase()}\n${card.mechanism.toLowerCase()}`;
    }));
    for (const card of cards) {
      if (known.has(`${card.problem.toLowerCase()}\n${card.mechanism.toLowerCase()}`)) continue;
      const id = crypto.randomUUID();
      artifactIds.push(id);
      statements.push(db.prepare(
        `INSERT OR IGNORE INTO idea_versions
         (id,session_id,strategy,card_json,schema_version,generation_job_id) VALUES (?,?,?,?,?,?)`,
      ).bind(id, job.session_id, card.strategy, JSON.stringify(card), card.schema_version, job.id));
    }
    for (const card of cards.slice(0, 3)) {
      statements.push(db.prepare(
        'INSERT INTO opportunity_hypotheses (id,session_id,problem,beneficiary,assumption,evidence_refs_json) VALUES (?,?,?,?,?,?)',
      ).bind(crypto.randomUUID(), job.session_id, card.problem, card.target_user, card.novelty_hypothesis, '[]'));
    }
  }
  const tokens = tokenCount(run.usage);
  const cost = selection.mode === 'live' ? tokens / 1000 * selection.cost_per_1k_tokens_usd : 0;
  const used = await consumedBudget(db, job.id);
  if (selection.mode === 'live' && (used.tokens + tokens > selection.max_job_tokens || used.cost + cost > selection.max_job_cost_usd)) {
    throw new ProcessingFailure('Provider usage exceeded the approved job budget.', false, true);
  }
  statements.push(db.prepare(
    `INSERT INTO generation_runs
     (id,job_id,stage,provider,model_id,schema_version,prompt_version,response_status,usage_json,duration_ms)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).bind(crypto.randomUUID(), job.id, stage, run.provider, run.model_id, '1.0', run.prompt_version, 'valid', JSON.stringify(run.usage), Date.now() - startedAt));
  statements.push(db.prepare(
    `INSERT INTO usage_ledger
     (id,owner_key,provider_invocation_id,job_id,usage_units,estimated_cost_usd,kind)
     VALUES (?,?,?,?,?,?,'settle')`,
  ).bind(crypto.randomUUID(), job.owner_key, `${job.id}:${stage}:settle`, job.id, tokens, cost));
  statements.push(db.prepare(
    `INSERT INTO session_stage_runs (session_id,stage,status,artifact_json,updated_at)
     VALUES (?,?, 'completed',?,datetime('now'))
     ON CONFLICT(session_id,stage) DO UPDATE SET status = excluded.status,
       artifact_json = excluded.artifact_json,updated_at = datetime('now')`,
  ).bind(job.session_id, stage, JSON.stringify({ job_id: job.id, artifact_ids: artifactIds })));
  statements.push(db.prepare(
    `UPDATE jobs SET stage = ?,progress_json = ?,updated_at = datetime('now')
     WHERE id = ? AND lease_token = ? AND status = 'running'`,
  ).bind(stage, JSON.stringify({ stage_index: ideationStages.indexOf(stage) + 1, stage_count: 8 }), job.id, job.lease_token));
  await db.batch(statements);
  return artifactIds;
}

async function persistLocalArtifact(db: D1Database, job: JobRow, request: { idea_version_id?: string }): Promise<string[]> {
  const ideaId = request.idea_version_id;
  if (!ideaId) throw new ProcessingFailure('An idea version is required for this job.', false);
  const idea = await db.prepare('SELECT card_json FROM idea_versions WHERE id = ? AND session_id = ?')
    .bind(ideaId, job.session_id).first<{ card_json: string }>();
  if (!idea) throw new ProcessingFailure('The selected idea version is unavailable.', false);
  if (job.job_type === 'validation') {
    await db.batch([db.prepare(
      `INSERT OR IGNORE INTO scorecards
       (id,idea_version_id,rubric_version,coverage_status,observed_overlap,sample_count,score_json,evidence_json)
       VALUES (?,?,?,'partial','insufficient_evidence',0,?,?)`,
    ).bind(job.id, ideaId, `m1-job:${job.id}`, JSON.stringify({ differentiation: 'hypothesis_only' }), '[]'),
    db.prepare(
      `INSERT INTO session_stage_runs (session_id,stage,status,artifact_json)
       VALUES (?,'converge','completed',?) ON CONFLICT(session_id,stage) DO UPDATE SET
       status = excluded.status,artifact_json = excluded.artifact_json`,
    ).bind(job.session_id, JSON.stringify({ job_id: job.id, artifact_ids: [job.id] }))]);
    return [job.id];
  }
  if (job.job_type === 'blueprint') {
    await db.batch([db.prepare(
      `INSERT OR IGNORE INTO blueprints
       (id,idea_version_id,source_manifest_json,content_markdown,review_required) VALUES (?,?,?,?,1)`,
    ).bind(job.id, ideaId, '[]', buildBlueprint(JSON.parse(idea.card_json) as IdeaCardV1, ideaId)),
    db.prepare(
      `INSERT INTO session_stage_runs (session_id,stage,status,artifact_json)
       VALUES (?,'blueprint','completed',?) ON CONFLICT(session_id,stage) DO UPDATE SET
       status = excluded.status,artifact_json = excluded.artifact_json`,
    ).bind(job.session_id, JSON.stringify({ job_id: job.id, artifact_ids: [job.id] }))]);
    return [job.id];
  }
  return [];
}

async function markBlockedStages(db: D1Database, job: JobRow): Promise<void> {
  if (job.job_type !== 'diverse_slate' && job.job_type !== 'opportunity_map') return;
  const stages = job.job_type === 'opportunity_map' ? ideationStages.slice(2) : ideationStages.slice(3);
  await db.batch(stages.map((stage) => db.prepare(
    `INSERT INTO session_stage_runs (session_id,stage,status,artifact_json)
     VALUES (?,?,'blocked',?) ON CONFLICT(session_id,stage) DO NOTHING`,
  ).bind(job.session_id, stage, JSON.stringify({ reason: 'Requires a builder action, selected idea, or authorized evidence.' }))));
}

export async function markJobFailure(db: D1Database, job: JobRow, error: unknown): Promise<ProcessingResult> {
  const retry = error instanceof ProcessingFailure ? error.retryable : true;
  const quota = error instanceof ProcessingFailure && error.quota;
  const status = quota ? 'blocked_quota' : retry && job.attempt_count < job.max_attempts ? 'retry_wait' : 'failed';
  const message = error instanceof Error ? error.message : 'Processing failed.';
  const updated = await db.prepare(
    `UPDATE jobs SET status = ?,error_json = ?,lease_token = NULL,lease_expires_at = NULL,
       updated_at = datetime('now') WHERE id = ? AND lease_token = ? AND status = 'running' RETURNING id`,
  ).bind(status, JSON.stringify({ code: quota ? 'budget_exceeded' : 'processing_failed', message, retryable: status === 'retry_wait' }), job.id, job.lease_token).first<{ id: string }>();
  return { job_id: job.id, status: updated ? status : 'duplicate' };
}

export async function processStudioJob(
  message: JobQueueMessage,
  db: D1Database,
  settings: ProviderSettings,
): Promise<ProcessingResult> {
  if (message.schema_version !== '1.0') throw new ProcessingFailure('Unsupported Queue message version.', false);
  const job = await claimStudioJob(db, message.job_id);
  if (!job) return { job_id: message.job_id, status: 'duplicate' };
  try {
    const selection = selectProvider(settings);
    if (job.inference_mode !== selection.mode) throw new ProcessingFailure('Job mode differs from configured inference mode.', false);
    const session = await db.prepare('SELECT context_json FROM ideation_sessions WHERE id = ?')
      .bind(job.session_id).first<{ context_json: string }>();
    if (!session) throw new ProcessingFailure('Job session no longer exists.', false);
    const context = JSON.parse(session.context_json) as SessionContext;
    const request = parseJobRequest(job.request_json);
    for (const stage of selectedStages(job.job_type)) {
      await renewLease(db, job);
      if (await previousStage(db, job.id, stage)) continue;
      if (job.job_type === 'validation' || job.job_type === 'blueprint') {
        await persistLocalArtifact(db, job, request);
        continue;
      }
      const maxOutput = stage === 'diverge' ? 7000 : 900;
      await reserveStageBudget(db, job, selection, stage, context, maxOutput);
      const startedAt = Date.now();
      const run = await selection.provider.runStage<SessionContext, unknown>({
        stage,
        input: context,
        output_schema_version: '1.0',
        constraints: context.hard_constraints.map((item) => item.text),
        model_policy: 'm1-structured-ideation',
        budget: { max_output_tokens: maxOutput, max_attempts: 1 },
        run_metadata: { job_id: job.id, session_id: job.session_id },
      });
      await persistStage(db, job, stage, run, context, selection, startedAt);
    }
    await markBlockedStages(db, job);
    const artifactIds = await existingArtifacts(db, job);
    const lastStage = selectedStages(job.job_type).at(-1)!;
    const completed = await db.prepare(
      `UPDATE jobs SET status = 'completed',stage = ?,result_json = ?,lease_token = NULL,
         lease_expires_at = NULL,updated_at = datetime('now')
       WHERE id = ? AND lease_token = ? AND status = 'running' RETURNING id`,
    ).bind(lastStage, JSON.stringify({ artifact_ids: artifactIds, inference_mode: selection.mode }), job.id, job.lease_token).first<{ id: string }>();
    return completed ? { job_id: job.id, status: 'completed', artifact_ids: artifactIds } : { job_id: job.id, status: 'duplicate' };
  } catch (error) {
    const normalized = error instanceof ProviderUnavailable ? new ProcessingFailure(error.message, false, true) : error;
    return markJobFailure(db, job, normalized);
  }
}
