import type { IdeaCardV1, JobQueueMessage, SessionContext } from '@hacktor/contracts';
import { validateIdeaCard } from '@hacktor/contracts';
import { buildBlueprint, generateDeterministicSlate, ideationStages } from '@hacktor/ideation';
import { DeterministicInferenceProvider, type InferenceProvider } from '@hacktor/providers';

interface JobRow {
  id: string;
  session_id: string;
  job_type: string;
  status: string;
  request_json: string;
  attempt_count: number;
  max_attempts: number;
  cancel_requested: number;
}

export interface JobClaimStore {
  claim(jobId: string): Promise<'claimed' | 'already_processed'>;
  complete(jobId: string): Promise<void>;
}

export interface ProcessingResult {
  job_id: string;
  status: 'completed' | 'duplicate' | 'cancelled';
  artifact_ids?: string[];
}

export async function processFixtureJob(message: JobQueueMessage, store: JobClaimStore): Promise<ProcessingResult> {
  const claim = await store.claim(message.job_id);
  if (claim === 'already_processed') return { job_id: message.job_id, status: 'duplicate' };
  await store.complete(message.job_id);
  return { job_id: message.job_id, status: 'completed' };
}

function deterministicProvider(): InferenceProvider {
  return new DeterministicInferenceProvider((request) =>
    request.stage === 'diverge'
      ? generateDeterministicSlate(request.input as SessionContext)
      : { stage: request.stage, status: 'completed' },
  );
}

async function checkpoint(db: D1Database, sessionId: string, stage: string, status: string, artifact: unknown): Promise<void> {
  await db.prepare(
    `INSERT INTO session_stage_runs (session_id,stage,status,artifact_json,updated_at)
     VALUES (?,?,?,?,datetime('now')) ON CONFLICT(session_id,stage) DO UPDATE SET
     status = excluded.status,artifact_json = excluded.artifact_json,updated_at = datetime('now')`,
  ).bind(sessionId, stage, status, JSON.stringify(artifact)).run();
}

async function claimJob(db: D1Database, jobId: string): Promise<JobRow | null> {
  const job = await db.prepare(
    'SELECT id,session_id,job_type,status,request_json,attempt_count,max_attempts,cancel_requested FROM jobs WHERE id = ?',
  ).bind(jobId).first<JobRow>();
  if (!job || job.status === 'completed' || job.status === 'cancelled' || job.status === 'running') return null;
  await db.prepare(
    `UPDATE jobs SET status = 'running',attempt_count = attempt_count + 1,
     lease_expires_at = datetime('now','+5 minutes'),updated_at = datetime('now') WHERE id = ?`,
  ).bind(jobId).run();
  return job;
}

async function persistSlate(db: D1Database, job: JobRow, cards: IdeaCardV1[]): Promise<string[]> {
  const ids: string[] = [];
  const statements: D1PreparedStatement[] = [];
  const existing = await db.prepare('SELECT card_json FROM idea_versions WHERE session_id = ?').bind(job.session_id).all<{ card_json: string }>();
  const signatures = new Set(existing.results.map((row) => {
    const card = JSON.parse(row.card_json) as Partial<IdeaCardV1>;
    return `${card.problem || ''}\n${card.mechanism || ''}`;
  }));
  for (const card of cards) {
    const validation = validateIdeaCard(card);
    if (!validation.success) throw new Error(`Generated Idea Card is invalid: ${validation.errors.join('; ')}`);
    const signature = `${card.problem}\n${card.mechanism}`;
    if (signatures.has(signature)) continue;
    signatures.add(signature);
    const id = crypto.randomUUID();
    ids.push(id);
    statements.push(db.prepare(
      'INSERT INTO idea_versions (id,session_id,strategy,card_json,schema_version) VALUES (?,?,?,?,?)',
    ).bind(id, job.session_id, card.strategy, JSON.stringify(card), card.schema_version));
  }
  if (ids.length > 0) {
    for (const card of cards.slice(0, 3)) {
      statements.push(db.prepare(
        'INSERT INTO opportunity_hypotheses (id,session_id,problem,beneficiary,assumption,evidence_refs_json) VALUES (?,?,?,?,?,?)',
      ).bind(crypto.randomUUID(), job.session_id, card.problem, card.target_user, card.novelty_hypothesis, '[]'));
    }
  }
  if (statements.length) await db.batch(statements);
  return ids;
}

export async function processStudioJob(
  message: JobQueueMessage,
  db: D1Database,
  provider: InferenceProvider = deterministicProvider(),
): Promise<ProcessingResult> {
  const job = await claimJob(db, message.job_id);
  if (!job) return { job_id: message.job_id, status: 'duplicate' };
  if (job.cancel_requested) {
    await db.prepare("UPDATE jobs SET status = 'cancelled',updated_at = datetime('now') WHERE id = ?").bind(job.id).run();
    return { job_id: job.id, status: 'cancelled' };
  }
  const session = await db.prepare('SELECT context_json FROM ideation_sessions WHERE id = ?').bind(job.session_id).first<{ context_json: string }>();
  if (!session) throw new Error('Job session no longer exists');
  const context = JSON.parse(session.context_json) as SessionContext;
  const request = JSON.parse(job.request_json) as { idea_version_id?: string };
  const startedAt = Date.now();
  let artifactIds: string[] = [];
  for (const [index, stage] of ideationStages.entries()) {
    if (job.job_type === 'opportunity_map' && index > 1) {
      await checkpoint(db, job.session_id, stage, 'blocked', { reason: 'Not requested by opportunity_map job.' });
      continue;
    }
    if (job.job_type === 'validation' && stage !== 'research' && stage !== 'converge') continue;
    if (job.job_type === 'blueprint' && stage !== 'blueprint') continue;
    if (job.job_type === 'diverse_slate' && ['interrogate', 'evolve', 'research', 'converge', 'blueprint'].includes(stage)) {
      const reason = stage === 'interrogate' || stage === 'evolve'
        ? 'Requires a builder-selected idea action.'
        : stage === 'research'
          ? 'Automated sources are disabled; validation can assess evidence coverage.'
          : stage === 'converge'
            ? 'Requires builder selection and evidence-aware validation.'
            : 'Requires one selected immutable idea version.';
      await checkpoint(db, job.session_id, stage, 'blocked', { reason });
      continue;
    }
    await checkpoint(db, job.session_id, stage, 'running', {});
    await db.prepare("UPDATE jobs SET stage = ?,progress_json = ?,updated_at = datetime('now') WHERE id = ?")
      .bind(stage, JSON.stringify({ stage_index: index + 1, stage_count: ideationStages.length }), job.id).run();
    const run = await provider.runStage<SessionContext, unknown>({
      stage,
      input: context,
      output_schema_version: '1.0',
      constraints: context.hard_constraints.map((constraint) => constraint.text),
      model_policy: 'm1-structured-ideation',
      budget: { max_output_tokens: stage === 'diverge' ? 7000 : 1200, max_attempts: 2 },
      run_metadata: { job_id: job.id, session_id: job.session_id },
    });
    if (stage === 'diverge' && job.job_type === 'diverse_slate') artifactIds = await persistSlate(db, job, run.output as IdeaCardV1[]);
    await db.batch([
      db.prepare(
        `INSERT OR IGNORE INTO generation_runs
         (id,job_id,stage,provider,model_id,schema_version,prompt_version,response_status,usage_json,duration_ms)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ).bind(crypto.randomUUID(), job.id, stage, run.provider, run.model_id, '1.0', run.prompt_version, 'valid', JSON.stringify(run.usage), Date.now() - startedAt),
      db.prepare(
        "INSERT INTO usage_ledger (id,owner_key,provider_invocation_id,job_id,usage_units,estimated_cost_usd,kind) SELECT ?,owner_key,?,?,0,0,'settle' FROM jobs WHERE id = ?",
      ).bind(crypto.randomUUID(), `${job.id}:${stage}`, job.id, job.id),
    ]);
    await checkpoint(db, job.session_id, stage, 'completed', { artifact_ids: stage === 'diverge' ? artifactIds : [] });
  }
  if (job.job_type === 'validation' && request.idea_version_id) {
    const scorecardId = crypto.randomUUID();
    await db.prepare(
      `INSERT INTO scorecards
       (id,idea_version_id,rubric_version,coverage_status,observed_overlap,sample_count,score_json,evidence_json)
       VALUES (?,?,'m1-v1','partial','insufficient_evidence',0,?,?)`,
    ).bind(scorecardId, request.idea_version_id, JSON.stringify({ buildability: 'requires_builder_review', differentiation: 'hypothesis_only' }), '[]').run();
    artifactIds = [scorecardId];
  }
  if (job.job_type === 'blueprint' && request.idea_version_id) {
    const idea = await db.prepare('SELECT card_json FROM idea_versions WHERE id = ? AND session_id = ?')
      .bind(request.idea_version_id, job.session_id).first<{ card_json: string }>();
    if (!idea) throw new Error('Blueprint idea version was not found in the job session');
    const blueprintId = crypto.randomUUID();
    await db.prepare(
      'INSERT INTO blueprints (id,idea_version_id,source_manifest_json,content_markdown,review_required) VALUES (?,?,?,?,1)',
    ).bind(blueprintId, request.idea_version_id, '[]', buildBlueprint(JSON.parse(idea.card_json) as IdeaCardV1, request.idea_version_id)).run();
    artifactIds = [blueprintId];
  }
  const finalStage = job.job_type === 'opportunity_map' ? 'map' : job.job_type === 'validation' ? 'converge' : job.job_type === 'blueprint' ? 'blueprint' : 'diverge';
  await db.prepare(
    "UPDATE jobs SET status = 'completed',stage = ?,result_json = ?,lease_expires_at = NULL,updated_at = datetime('now') WHERE id = ?",
  ).bind(finalStage, JSON.stringify({ artifact_ids: artifactIds, inference_mode: 'deterministic_test_adapter' }), job.id).run();
  return { job_id: job.id, status: 'completed', artifact_ids: artifactIds };
}

export async function markJobFailure(db: D1Database, jobId: string, error: unknown): Promise<boolean> {
  const row = await db.prepare('SELECT attempt_count,max_attempts FROM jobs WHERE id = ?').bind(jobId).first<{ attempt_count: number; max_attempts: number }>();
  const retry = Boolean(row && row.attempt_count < row.max_attempts);
  await db.prepare(
    "UPDATE jobs SET status = ?,error_json = ?,lease_expires_at = NULL,updated_at = datetime('now') WHERE id = ?",
  ).bind(retry ? 'retry_wait' : 'failed', JSON.stringify({ code: 'processing_failed', message: error instanceof Error ? error.message : String(error), retryable: retry }), jobId).run();
  return retry;
}
