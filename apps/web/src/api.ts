import {
  ideaCommands,
  type IdeaActionRequest,
  type IdeaCardV1,
  type JobQueueMessage,
  type SessionContext,
  type SessionContextDraft,
  type BlueprintSummary,
  validateSessionContext,
  validateIdeaCard,
} from '@hacktor/contracts';
import {
  combineIdeas,
  critiqueIdea,
  evolveIdea,
} from '@hacktor/ideation';
import { processStudioJob } from '../../../workers/ai-consumer/src/processor';

const COOKIE_SESSION = 'hacktor_session';
const COOKIE_CSRF = 'hacktor_csrf';
const MAX_BODY_BYTES = 50_000;

type JsonObject = Record<string, unknown>;

class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryable = false,
  ) {
    super(message);
  }
}

interface Owner {
  guest_id: string;
  owner_key: string;
}

interface SessionRow {
  id: string;
  guest_id: string;
  mode: string;
  title: string;
  context_json: string;
  original_idea_text: string | null;
  context_revision: number;
  status: string;
  review_required: number;
  created_at: string;
  updated_at: string;
}

interface IdeaRow {
  id: string;
  session_id: string;
  card_json: string;
  strategy: string | null;
  schema_version: string;
  visibility: string;
  created_at: string;
}

interface DraftRow {
  session_id: string;
  context_json: string;
  base_context_revision: number;
  draft_revision: number;
  updated_at: string;
}

type BlueprintRow = Omit<BlueprintSummary, 'review_required'> & { review_required: number };

function draftData(row: DraftRow): SessionContextDraft {
  return { session_id: row.session_id, context: JSON.parse(row.context_json) as SessionContext,
    base_context_revision: row.base_context_revision, draft_revision: row.draft_revision, updated_at: row.updated_at };
}

function parseDraftRevision(request: Request): number {
  const value = request.headers.get('if-match')?.replaceAll('"', '');
  if (!value || !/^(0|[1-9][0-9]*)$/.test(value)) throw new ApiFailure(428, 'draft_revision_required', 'Send the current draft revision in If-Match. Use 0 for a new draft.');
  return Number(value);
}

function requireActiveSession(session: SessionRow): void {
  if (session.status !== 'active') throw new ApiFailure(404, 'session_not_found', 'Session not found.');
}

function normalizeText(value: string): string {
  return value.replaceAll(String.fromCodePoint(0x2014), '-');
}

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json({ data }, headers ? { status, headers } : { status });
}

function failure(error: ApiFailure, requestId: string): Response {
  return Response.json(
    {
      error: {
        code: error.code,
        message: normalizeText(error.message),
        retryable: error.retryable,
        request_id: requestId,
      },
    },
    { status: error.status },
  );
}

function cookieMap(request: Request): Map<string, string> {
  const values = new Map<string, string>();
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const separator = part.indexOf('=');
    if (separator > 0) values.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
  }
  return values;
}

function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function safeEqual(left: string, right: string): Promise<boolean> {
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(left)),
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(right)),
  ]);
  const leftBytes = new Uint8Array(a);
  const rightBytes = new Uint8Array(b);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

async function readBody(request: Request): Promise<JsonObject> {
  const length = Number(request.headers.get('content-length') || '0');
  if (length > MAX_BODY_BYTES) throw new ApiFailure(413, 'body_too_large', 'Request body exceeds 50 KB.');
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ApiFailure(400, 'invalid_json', 'Request body must be valid JSON.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiFailure(422, 'invalid_request', 'Request body must be a JSON object.');
  }
  return value as JsonObject;
}

function requireCsrf(request: Request): void {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) return;
  const cookies = cookieMap(request);
  const cookieToken = cookies.get(COOKIE_CSRF);
  const headerToken = request.headers.get('x-csrf-token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new ApiFailure(403, 'csrf_failed', 'A matching CSRF token is required.');
  }
}

async function authenticate(request: Request, db: D1Database): Promise<Owner> {
  const capability = cookieMap(request).get(COOKIE_SESSION);
  if (!capability) throw new ApiFailure(401, 'authentication_required', 'A private guest session is required.');
  const capabilityHash = await sha256(capability);
  const row = await db
    .prepare(
      `SELECT id FROM guest_sessions
       WHERE capability_hash = ? AND datetime(expires_at) > datetime('now')`,
    )
    .bind(capabilityHash)
    .first<{ id: string }>();
  if (!row) throw new ApiFailure(401, 'session_expired', 'The private guest session is invalid or expired.');
  await db.prepare("UPDATE guest_sessions SET last_seen_at = datetime('now') WHERE id = ?").bind(row.id).run();
  return { guest_id: row.id, owner_key: `guest:${row.id}` };
}

async function ownedSession(db: D1Database, owner: Owner, sessionId: string): Promise<SessionRow> {
  const row = await db
    .prepare(
      `SELECT id,guest_id,mode,title,context_json,original_idea_text,context_revision,status,
              review_required,created_at,updated_at
       FROM ideation_sessions WHERE id = ? AND guest_id = ?`,
    )
    .bind(sessionId, owner.guest_id)
    .first<SessionRow>();
  if (!row || row.status !== 'active') throw new ApiFailure(404, 'session_not_found', 'Session not found.');
  return row;
}

async function ownedIdea(db: D1Database, owner: Owner, ideaId: string): Promise<IdeaRow> {
  const row = await db
    .prepare(
      `SELECT i.id,i.session_id,i.card_json,i.strategy,i.schema_version,i.visibility,i.created_at
       FROM idea_versions i JOIN ideation_sessions s ON s.id = i.session_id
       WHERE i.id = ? AND s.guest_id = ? AND s.status = 'active'`,
    )
    .bind(ideaId, owner.guest_id)
    .first<IdeaRow>();
  if (!row) throw new ApiFailure(404, 'idea_not_found', 'Idea version not found.');
  return row;
}

function parseContext(text: string): SessionContext {
  const normalized = normalizeText(text).trim();
  if (normalized.length < 30 || normalized.length > 40_000) {
    throw new ApiFailure(422, 'invalid_brief', 'Brief text must contain between 30 and 40000 characters.');
  }
  const lines = normalized.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const constraints = lines.filter((line) => /must|required|cannot|deadline|limit/i.test(line));
  return {
    summary: lines.slice(0, 3).join(' ').slice(0, 1200),
    beneficiaries: [],
    goals: lines.filter((line) => /goal|build|create|help|enable/i.test(line)).slice(0, 6),
    hard_constraints: constraints.map((line, index) => ({ id: `hard_${index + 1}`, text: line })),
    soft_constraints: [],
    unknowns: ['Target participant evidence has not been independently verified.'],
    confirmed: false,
    source_status: 'user_provided',
  };
}

async function createGuestSession(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const mode = body.mode;
  const title = typeof body.title === 'string' ? normalizeText(body.title).trim() : '';
  if (mode !== 'hackathon_first' && mode !== 'idea_first') {
    throw new ApiFailure(422, 'invalid_mode', 'Mode must be hackathon_first or idea_first.');
  }
  if (!title || title.length > 140) throw new ApiFailure(422, 'invalid_title', 'A title of at most 140 characters is required.');
  const originalIdea = typeof body.original_idea_text === 'string' ? body.original_idea_text : null;
  if (mode === 'idea_first' && (!originalIdea || originalIdea.length > 12_000)) {
    throw new ApiFailure(422, 'invalid_original_idea', 'Idea-first sessions require original_idea_text.');
  }
  const capability = randomToken();
  const csrf = randomToken(24);
  const guestId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const initialContext: SessionContext = {
    summary: originalIdea ? normalizeText(originalIdea).slice(0, 1200) : '',
    beneficiaries: [],
    goals: [],
    hard_constraints: [],
    soft_constraints: [],
    unknowns: ['Context needs builder review and confirmation.'],
    confirmed: false,
    source_status: 'user_provided',
  };
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO guest_sessions (id,capability_hash,expires_at,last_seen_at) VALUES (?,?,?,datetime(\'now\'))',
    ).bind(guestId, await sha256(capability), expiresAt),
    env.DB.prepare(
      `INSERT INTO ideation_sessions
       (id,guest_id,mode,title,context_json,original_idea_text,review_required)
       VALUES (?,?,?,?,?,?,1)`,
    ).bind(sessionId, guestId, mode, title, JSON.stringify(initialContext), originalIdea),
  ]);
  const headers = new Headers();
  headers.append('set-cookie', `${COOKIE_SESSION}=${capability}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`);
  headers.append('set-cookie', `${COOKIE_CSRF}=${csrf}; Path=/; Secure; SameSite=Strict; Max-Age=604800`);
  return json({ session_id: sessionId, context_revision: 1, csrf_token: csrf }, 201, headers);
}

function jobRouteKey(sessionId: string, jobType: string): string {
  return `sessions/${sessionId}/jobs/${jobType}`;
}

function prepareSessionStage(db: D1Database, sessionId: string, stage: string, status: string, artifact: unknown): D1PreparedStatement {
  return db.prepare(
    `INSERT INTO session_stage_runs (session_id,stage,status,artifact_json,updated_at) VALUES (?,?,?,?,datetime('now'))
     ON CONFLICT(session_id,stage) DO UPDATE SET status = excluded.status,artifact_json = excluded.artifact_json,updated_at = datetime('now')`,
  ).bind(sessionId, stage, status, JSON.stringify(artifact));
}


export async function dispatchPendingOutbox(env: Env): Promise<number> {
  const pending = await env.DB.prepare(
    "SELECT job_id FROM job_outbox WHERE status = 'pending' ORDER BY created_at LIMIT 25",
  ).all<{ job_id: string }>();
  let published = 0;
  for (const row of pending.results) {
    try {
      const message: JobQueueMessage = { job_id: row.job_id, schema_version: '1.0' };
      await env.AI_JOBS.send(message, { contentType: 'json' });
      await env.DB.prepare(
        "UPDATE job_outbox SET status = 'published',publish_attempts = publish_attempts + 1,published_at = datetime('now') WHERE job_id = ? AND status = 'pending'",
      ).bind(row.job_id).run();
      published += 1;
    } catch (error) {
      await env.DB.prepare('UPDATE job_outbox SET publish_attempts = publish_attempts + 1 WHERE job_id = ?')
        .bind(row.job_id).run();
      console.error(JSON.stringify({ message: 'outbox dispatch failed', job_id: row.job_id, error: error instanceof Error ? error.message : String(error) }));
    }
  }
  const recoverable = await env.DB.prepare(
    `SELECT id,attempt_count,max_attempts FROM jobs
     WHERE status = 'retry_wait' OR (status = 'running' AND datetime(lease_expires_at) <= datetime('now'))
     ORDER BY updated_at LIMIT 25`,
  ).all<{ id: string; attempt_count: number; max_attempts: number }>();
  for (const job of recoverable.results) {
    if (job.attempt_count >= job.max_attempts) {
      await env.DB.prepare(
        `UPDATE jobs SET status = 'failed',lease_token = NULL,lease_expires_at = NULL,
         error_json = ?,updated_at = datetime('now') WHERE id = ? AND status IN ('running','retry_wait')`,
      ).bind(JSON.stringify({ code: 'attempts_exhausted', message: 'The job did not complete after its allowed attempts.', retryable: false }), job.id).run();
      continue;
    }
    try {
      await env.AI_JOBS.send({ job_id: job.id, schema_version: '1.0' } satisfies JobQueueMessage, { contentType: 'json' });
      published += 1;
    } catch (error) {
      console.error(JSON.stringify({ message: 'job recovery dispatch failed', job_id: job.id, error: error instanceof Error ? error.message : String(error) }));
    }
  }
  return published;
}

async function enqueueJob(
  request: Request,
  env: Env,
  owner: Owner,
  session: SessionRow,
  jobType: string,
  payload: JsonObject,
): Promise<Response> {
  await dispatchPendingOutbox(env);
  const key = request.headers.get('idempotency-key');
  if (!key || key.length < 8 || key.length > 128) {
    throw new ApiFailure(422, 'idempotency_key_required', 'A valid Idempotency-Key header is required.');
  }
  const routeKey = jobRouteKey(session.id, jobType);
  const requestJson = JSON.stringify(payload);
  const requestHash = await sha256(requestJson);
  const existing = await env.DB.prepare(
    'SELECT job_id,request_hash FROM idempotency_keys WHERE owner_key = ? AND route_key = ? AND client_key = ?',
  ).bind(owner.owner_key, routeKey, key).first<{ job_id: string; request_hash: string }>();
  if (existing) {
    if (!(await safeEqual(existing.request_hash, requestHash))) {
      throw new ApiFailure(409, 'idempotency_conflict', 'The idempotency key was already used with a different request.');
    }
    return json({ job_id: existing.job_id, status: 'queued', duplicate: true }, 202);
  }
  const active = await env.DB.prepare(
    "SELECT count(*) AS count FROM jobs WHERE owner_key = ? AND status IN ('queued','running','validating','retry_wait')",
  ).bind(owner.owner_key).first<{ count: number }>();
  if ((active?.count || 0) >= 5) throw new ApiFailure(429, 'quota_exceeded', 'Too many active jobs. Try again later.', true);
  const recent = await env.DB.prepare(
    "SELECT count(*) AS count FROM jobs WHERE owner_key = ? AND datetime(created_at) > datetime('now','-1 hour')",
  ).bind(owner.owner_key).first<{ count: number }>();
  if ((recent?.count || 0) >= 20) throw new ApiFailure(429, 'hourly_usage_limit', 'The hourly job limit has been reached.', true);
  const jobId = crypto.randomUUID();
  const outboxId = crypto.randomUUID();
  const inferenceMode: string = env.INFERENCE_MODE;
  if (inferenceMode !== 'deterministic' && inferenceMode !== 'live') {
    throw new ApiFailure(503, 'inference_unavailable', 'Inference mode is not configured for this environment.');
  }
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO jobs (id,session_id,owner_key,job_type,status,stage,request_json,request_hash,progress_json,inference_mode)
       VALUES (?,?,?,?,'queued','understand',?,?,?,?)`,
    ).bind(jobId, session.id, owner.owner_key, jobType, requestJson, requestHash, JSON.stringify({ stage_index: 0, stage_count: 8 }), inferenceMode),
    env.DB.prepare('INSERT INTO job_outbox (id,job_id) VALUES (?,?)').bind(outboxId, jobId),
    env.DB.prepare(
      'INSERT INTO idempotency_keys (owner_key,route_key,client_key,request_hash,job_id) VALUES (?,?,?,?,?)',
    ).bind(owner.owner_key, routeKey, key, requestHash, jobId),
  ]);
  const message: JobQueueMessage = { job_id: jobId, schema_version: '1.0' };
  try {
    await env.AI_JOBS.send(message, { contentType: 'json' });
    await env.DB.prepare(
      "UPDATE job_outbox SET status = 'published',publish_attempts = publish_attempts + 1,published_at = datetime('now') WHERE job_id = ?",
    ).bind(jobId).run();
  } catch (error) {
    console.error(JSON.stringify({ message: 'queue publish deferred to outbox', job_id: jobId, error: error instanceof Error ? error.message : String(error) }));
  }
  if (env.HACKTOR_ENV === 'local' && env.INFERENCE_MODE === 'deterministic') {
    const result = await processStudioJob(message, env.DB, { INFERENCE_MODE: env.INFERENCE_MODE });
    if (result.status !== 'completed' && result.status !== 'duplicate') {
      console.error(JSON.stringify({ message: 'local studio job did not complete', job_id: jobId, status: result.status }));
    }
  }
  return json({ job_id: jobId, status: 'queued' }, 202);
}

async function handleIdeaAction(request: Request, env: Env, owner: Owner, ideaId: string): Promise<Response> {
  const idea = await ownedIdea(env.DB, owner, ideaId);
  const body = (await readBody(request)) as unknown as IdeaActionRequest;
  if (!ideaCommands.includes(body.command)) throw new ApiFailure(422, 'invalid_command', 'Unknown idea action command.');
  const clientKey = request.headers.get('idempotency-key');
  if (!clientKey || clientKey.length < 8 || clientKey.length > 128) throw new ApiFailure(422, 'idempotency_key_required', 'A valid Idempotency-Key header is required.');
  const routeKey = `ideas/${idea.id}/actions/${body.command}`;
  const requestHash = await sha256(JSON.stringify(body));
  const actionId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT OR IGNORE INTO action_idempotency_keys
     (owner_key,route_key,client_key,request_hash,action_id,lease_expires_at)
     VALUES (?,?,?,?,?,datetime('now','+2 minutes'))`,
  ).bind(owner.owner_key, routeKey, clientKey, requestHash, actionId).run();
  const prior = await env.DB.prepare(
    'SELECT request_hash,response_json,action_id,lease_expires_at FROM action_idempotency_keys WHERE owner_key = ? AND route_key = ? AND client_key = ?',
  ).bind(owner.owner_key, routeKey, clientKey).first<{ request_hash: string; response_json: string | null; action_id: string | null; lease_expires_at: string | null }>();
  if (prior) {
    if (!(await safeEqual(prior.request_hash, requestHash))) throw new ApiFailure(409, 'idempotency_conflict', 'The idempotency key was already used with a different request.');
    if (prior.action_id === actionId) return executeIdeaAction(actionId);
    if (prior.response_json) return json(JSON.parse(prior.response_json));
    if (prior.action_id) {
      const committed = await env.DB.prepare('SELECT id,command,action_json,result_version_id FROM idea_actions WHERE id = ? AND session_id = ?')
        .bind(prior.action_id, idea.session_id).first<{ id: string; command: string; action_json: string | null; result_version_id: string | null }>();
      if (committed) {
        let response: Record<string, unknown> = { action_id: committed.id };
        if (committed.command === 'challenge') response = { ...response, critique: JSON.parse(committed.action_json || '{}') };
        else if (committed.command === 'reject') response = { ...response, visibility: 'rejected' };
        else if (committed.command === 'pin') response = { ...response, pinned: true };
        else if (committed.command === 'research_more') response = { ...response, claim_id: (JSON.parse(committed.action_json || '{}') as { claim_id: string }).claim_id, verification_status: 'unverified' };
        else if (committed.result_version_id) {
          const child = await env.DB.prepare('SELECT card_json FROM idea_versions WHERE id = ? AND session_id = ?')
            .bind(committed.result_version_id, idea.session_id).first<{ card_json: string }>();
          const edges = await env.DB.prepare('SELECT parent_version_id FROM idea_edges WHERE child_version_id = ? ORDER BY rowid')
            .bind(committed.result_version_id).all<{ parent_version_id: string }>();
          if (!child) throw new ApiFailure(409, 'action_reconciliation_required', 'Committed action is missing its idea version.');
          response = { ...response, idea_version_id: committed.result_version_id, parent_version_ids: edges.results.map((edge) => edge.parent_version_id), card: JSON.parse(child.card_json) };
        }
        const repaired = await env.DB.prepare('UPDATE action_idempotency_keys SET response_json = ? WHERE owner_key = ? AND route_key = ? AND client_key = ? AND action_id = ? AND response_json IS NULL')
          .bind(JSON.stringify(response), owner.owner_key, routeKey, clientKey, prior.action_id).run();
        if (repaired.meta.changes !== 1) throw new ApiFailure(409, 'action_reconciliation_conflict', 'The action changed during response repair.', true);
        return json(response);
      }
    } else throw new ApiFailure(409, 'action_reconciliation_required', 'A legacy incomplete action requires review.');
    const replacementId = crypto.randomUUID();
    const reclaimed = await env.DB.prepare(`UPDATE action_idempotency_keys SET action_id = ?,lease_expires_at = datetime('now','+2 minutes')
      WHERE owner_key = ? AND route_key = ? AND client_key = ? AND response_json IS NULL
        AND action_id = ? AND datetime(lease_expires_at) <= datetime('now') RETURNING action_id`)
      .bind(replacementId, owner.owner_key, routeKey, clientKey, prior.action_id).first<{ action_id: string }>();
    if (!reclaimed) throw new ApiFailure(409, 'action_in_progress', 'The original action is still being processed.', true);
    return executeIdeaAction(replacementId);
  }
  throw new ApiFailure(500, 'action_reservation_missing', 'Action reservation could not be read.');
  async function executeIdeaAction(actionId: string): Promise<Response> {
  const commitAction = async (statements: D1PreparedStatement[], data: unknown): Promise<Response> => {
    statements.push(env.DB.prepare(
      `UPDATE action_idempotency_keys SET response_json = ?,lease_expires_at = NULL
       WHERE owner_key = ? AND route_key = ? AND client_key = ? AND action_id = ?
         AND response_json IS NULL AND datetime(lease_expires_at) > datetime('now')`,
    ).bind(JSON.stringify(data), owner.owner_key, routeKey, clientKey, actionId));
    statements.push(env.DB.prepare(
      'UPDATE persistence_fence SET valid = CASE WHEN changes() = 1 THEN 1 ELSE 0 END WHERE id = 1',
    ));
    try {
      await env.DB.batch(statements);
    } catch (error) {
      const current = await env.DB.prepare(
        `SELECT action_id,response_json,
          datetime(lease_expires_at) > datetime('now') AS lease_valid
         FROM action_idempotency_keys WHERE owner_key = ? AND route_key = ? AND client_key = ?`,
      ).bind(owner.owner_key, routeKey, clientKey).first<{ action_id: string; response_json: string | null; lease_valid: number }>();
      if (current?.response_json) return json(JSON.parse(current.response_json));
      if (current?.action_id !== actionId || !current.lease_valid) {
        throw new ApiFailure(409, 'action_lease_lost', 'This action executor no longer owns a valid lease.', true);
      }
      throw error;
    }
    return json(data);
  };
  if (body.command === 'challenge') {
    const card = JSON.parse(idea.card_json) as IdeaCardV1;
    const critique = critiqueIdea(card);
    return commitAction([env.DB.prepare(
      'INSERT INTO idea_actions (id,session_id,target_version_id,command,instruction,action_json) VALUES (?,?,?,?,?,?)',
    ).bind(actionId, idea.session_id, idea.id, body.command, body.instruction || null, JSON.stringify(critique)),
    prepareSessionStage(env.DB, idea.session_id, 'interrogate', 'completed', { action_id: actionId, idea_version_id: idea.id })], { action_id: actionId, critique });
  }
  if (body.command === 'reject') {
    return commitAction([
      env.DB.prepare("UPDATE idea_versions SET visibility = 'rejected' WHERE id = ?").bind(idea.id),
      env.DB.prepare('INSERT OR REPLACE INTO idea_rejections (idea_version_id,reason,exclusion_pattern) VALUES (?,?,?)').bind(idea.id, body.reason || 'Builder rejected this direction.', body.instruction || null),
      env.DB.prepare('INSERT INTO idea_actions (id,session_id,target_version_id,command,instruction) VALUES (?,?,?,?,?)').bind(actionId, idea.session_id, idea.id, body.command, body.instruction || null),
    ], { action_id: actionId, visibility: 'rejected' });
  }
  if (body.command === 'pin') {
    return commitAction([
      env.DB.prepare('INSERT OR IGNORE INTO idea_pins (session_id,idea_version_id) VALUES (?,?)').bind(idea.session_id, idea.id),
      env.DB.prepare('INSERT INTO idea_actions (id,session_id,target_version_id,command,instruction) VALUES (?,?,?,?,?)').bind(actionId, idea.session_id, idea.id, body.command, body.instruction || null),
    ], { action_id: actionId, pinned: true });
  }
  if (body.command === 'research_more') {
    const claimId = crypto.randomUUID();
    return commitAction([
      env.DB.prepare(
        "INSERT INTO research_claims (id,idea_version_id,claim,claim_type,verification_status) VALUES (?,?,?,'hypothesis','unverified')",
      ).bind(claimId, idea.id, body.instruction || 'Additional research is needed before this claim can be verified.'),
      env.DB.prepare('INSERT INTO idea_actions (id,session_id,target_version_id,command,instruction,action_json) VALUES (?,?,?,?,?,?)').bind(actionId, idea.session_id, idea.id, body.command, body.instruction || null, JSON.stringify({ claim_id: claimId })),
      prepareSessionStage(env.DB, idea.session_id, 'research', 'blocked', { reason: 'Hypothesis recorded without an approved external source.', claim_id: claimId }),
    ], { action_id: actionId, claim_id: claimId, verification_status: 'unverified' });
  }
  const parentCard = JSON.parse(idea.card_json) as IdeaCardV1;
  let nextCard: IdeaCardV1;
  let parents = [idea.id];
  let edgeKind = body.command === 'branch' ? 'branch' : 'refinement';
  if (body.command === 'combine') {
    if (!body.other_parent_version_id) throw new ApiFailure(422, 'second_parent_required', 'Combine requires other_parent_version_id.');
    const other = await ownedIdea(env.DB, owner, body.other_parent_version_id);
    if (other.session_id !== idea.session_id) throw new ApiFailure(409, 'cross_session_combine', 'Ideas from different sessions cannot be combined.');
    if (other.id === idea.id) throw new ApiFailure(409, 'invalid_lineage', 'An idea cannot be combined with itself.');
    nextCard = combineIdeas(parentCard, JSON.parse(other.card_json) as IdeaCardV1, body.instruction);
    parents = [idea.id, other.id];
    edgeKind = 'combine';
  } else {
    nextCard = evolveIdea(parentCard, body.command, body.instruction);
  }
  const validation = validateIdeaCard(nextCard);
  if (!validation.success) throw new ApiFailure(500, 'invalid_generated_idea', validation.errors.join('; '));
  const childId = crypto.randomUUID();
  const statements = [
    env.DB.prepare(
      `INSERT INTO idea_versions (id,session_id,strategy,card_json,schema_version) VALUES (?,?,?,?,?)`,
    ).bind(childId, idea.session_id, nextCard.strategy, JSON.stringify(nextCard), nextCard.schema_version),
    ...parents.map((parentId) => env.DB.prepare(
      'INSERT INTO idea_edges (child_version_id,parent_version_id,edge_kind,reason) VALUES (?,?,?,?)',
    ).bind(childId, parentId, edgeKind, body.reason || body.instruction || null)),
    env.DB.prepare(
      'INSERT INTO idea_actions (id,session_id,target_version_id,command,instruction,result_version_id,action_json) VALUES (?,?,?,?,?,?,?)',
    ).bind(actionId, idea.session_id, idea.id, body.command, body.instruction || null, childId, JSON.stringify({ parent_version_ids: parents })),
  ];
  statements.push(prepareSessionStage(env.DB, idea.session_id, 'evolve', 'completed', { action_id: actionId, idea_version_id: childId, parent_version_ids: parents }));
  return commitAction(statements, { action_id: actionId, idea_version_id: childId, parent_version_ids: parents, card: nextCard });
  }
}

export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);
  const path = url.pathname;
  try {
    if (request.method === 'GET' && path === '/api/v1/health') {
      return json({ service: 'hacktor-web', status: 'ok', milestone: 'M1', api_version: 'v1', inference_mode: 'credential_gated' });
    }
    if (request.method === 'POST' && path === '/api/v1/briefs/parse') {
      const body = await readBody(request);
      if (typeof body.text !== 'string') throw new ApiFailure(422, 'invalid_brief', 'Brief text is required.');
      return json({ context: parseContext(body.text) });
    }
    if (request.method === 'POST' && path === '/api/v1/sessions') return createGuestSession(request, env);

    if (!/^\/api\/v1\/(sessions\/[^/]+(?:\/(?:context|draft|jobs|ideas|blueprints|opportunities))?|jobs\/[^/]+|ideas\/[^/]+\/(?:actions|evidence|validation|blueprints)|blueprints\/[^/]+(?:\/export\.md)?)$/.test(path)) {
      throw new ApiFailure(404, 'not_found', 'API route not found.');
    }

    const owner = await authenticate(request, env.DB);
    requireCsrf(request);
    const sessionMatch = path.match(/^\/api\/v1\/sessions\/([^/]+)$/);
    if (sessionMatch?.[1] && request.method === 'GET') {
      const session = await ownedSession(env.DB, owner, sessionMatch[1]);
      const stages = await env.DB.prepare('SELECT stage,status,artifact_json,error_json,updated_at FROM session_stage_runs WHERE session_id = ? ORDER BY rowid').bind(session.id).all();
      return json({ ...session, context: JSON.parse(session.context_json), context_json: undefined, stages: stages.results });
    }
    if (sessionMatch?.[1] && request.method === 'DELETE') {
      const session = await ownedSession(env.DB, owner, sessionMatch[1]);
      await env.DB.prepare("UPDATE ideation_sessions SET status = 'deleting',updated_at = datetime('now') WHERE id = ?").bind(session.id).run();
      return json({ session_id: session.id, status: 'deleting' }, 202);
    }
    const draftMatch = path.match(/^\/api\/v1\/sessions\/([^/]+)\/draft$/);
    if (draftMatch?.[1]) {
      const session = await ownedSession(env.DB, owner, draftMatch[1]);
      requireActiveSession(session);
      if (request.method === 'GET') {
        const row = await env.DB.prepare('SELECT session_id,context_json,base_context_revision,draft_revision,updated_at FROM session_context_drafts WHERE session_id = ?')
          .bind(session.id).first<DraftRow>();
        return json({ draft: row ? draftData(row) : null, context_revision: session.context_revision });
      }
      if (request.method === 'PUT') {
        const expected = parseDraftRevision(request);
        const body = await readBody(request);
        if (new TextEncoder().encode(JSON.stringify(body)).length > MAX_BODY_BYTES) throw new ApiFailure(413, 'body_too_large', 'Draft exceeds 50 KB.');
        if (!validateSessionContext(body.context) || body.context.confirmed) throw new ApiFailure(422, 'invalid_draft', 'A complete unconfirmed context is required.');
        if (!Number.isInteger(body.base_context_revision) || body.base_context_revision !== session.context_revision || session.review_required !== 1) {
          throw new ApiFailure(409, 'draft_base_conflict', 'The confirmed context changed. Reload the workspace before saving.');
        }
        const serialized = normalizeText(JSON.stringify(body.context));
        const row = expected === 0
          ? await env.DB.prepare(
            `INSERT OR IGNORE INTO session_context_drafts (session_id,context_json,base_context_revision)
             SELECT id,?,context_revision FROM ideation_sessions
             WHERE id = ? AND guest_id = ? AND status = 'active' AND review_required = 1 AND context_revision = ?
             RETURNING session_id,context_json,base_context_revision,draft_revision,updated_at`,
          ).bind(serialized, session.id, owner.guest_id, session.context_revision).first<DraftRow>()
          : await env.DB.prepare(
            `UPDATE session_context_drafts SET context_json = ?,draft_revision = draft_revision + 1,updated_at = datetime('now')
             WHERE session_id = ? AND draft_revision = ? AND base_context_revision = ?
               AND EXISTS (SELECT 1 FROM ideation_sessions WHERE id = ? AND guest_id = ? AND status = 'active'
                 AND review_required = 1 AND context_revision = ?)
             RETURNING session_id,context_json,base_context_revision,draft_revision,updated_at`,
          ).bind(serialized, session.id, expected, session.context_revision, session.id, owner.guest_id, session.context_revision).first<DraftRow>();
        if (!row) throw new ApiFailure(409, 'draft_revision_conflict', 'A newer draft exists. Review it before replacing saved work.');
        return json({ draft: draftData(row) });
      }
      if (request.method === 'DELETE') {
        const expected = parseDraftRevision(request);
        const deleted = await env.DB.prepare('DELETE FROM session_context_drafts WHERE session_id = ? AND draft_revision = ? RETURNING session_id')
          .bind(session.id, expected).first<{ session_id: string }>();
        if (!deleted) throw new ApiFailure(409, 'draft_revision_conflict', 'The draft changed. Reload before discarding it.');
        return json({ session_id: session.id, deleted: true });
      }
    }
    const contextMatch = path.match(/^\/api\/v1\/sessions\/([^/]+)\/context$/);
    if (contextMatch?.[1] && request.method === 'PATCH') {
      const session = await ownedSession(env.DB, owner, contextMatch[1]);
      const expected = request.headers.get('if-match')?.replaceAll('"', '');
      if (expected !== String(session.context_revision)) throw new ApiFailure(409, 'revision_conflict', 'The session context changed. Reload and review it again.');
      const body = await readBody(request);
      if (!body.context || typeof body.context !== 'object' || Array.isArray(body.context)) throw new ApiFailure(422, 'invalid_context', 'Context must be an object.');
      if (!validateSessionContext(body.context) || !body.context.confirmed) throw new ApiFailure(422, 'confirmation_required', 'A complete context must be explicitly confirmed before generation.');
      const context = body.context;
      const nextRevision = session.context_revision + 1;
      try {
        await env.DB.batch([
          env.DB.prepare(
            `UPDATE ideation_sessions SET context_json = ?,context_revision = ?,review_required = 0,updated_at = datetime('now')
             WHERE id = ? AND guest_id = ? AND status = 'active' AND context_revision = ?`,
          ).bind(normalizeText(JSON.stringify(context)), nextRevision, session.id, owner.guest_id, session.context_revision),
          env.DB.prepare('UPDATE persistence_fence SET valid = CASE WHEN changes() = 1 THEN 1 ELSE 0 END WHERE id = 1'),
          env.DB.prepare('DELETE FROM session_context_drafts WHERE session_id = ?').bind(session.id),
        ]);
      } catch { throw new ApiFailure(409, 'revision_conflict', 'The session context changed. Reload and review it again.'); }
      return json({ session_id: session.id, context_revision: nextRevision, context });
    }
    const opportunitiesMatch = path.match(/^\/api\/v1\/sessions\/([^/]+)\/opportunities$/);
    if (opportunitiesMatch?.[1] && request.method === 'GET') {
      const session = await ownedSession(env.DB, owner, opportunitiesMatch[1]);
      requireActiveSession(session);
      const stage = await env.DB.prepare("SELECT status FROM session_stage_runs WHERE session_id = ? AND stage = 'map'")
        .bind(session.id).first<{ status: string }>();
      const rows = await env.DB.prepare(
        'SELECT id,session_id,problem,beneficiary,assumption,evidence_refs_json,created_at FROM opportunity_hypotheses WHERE session_id = ? ORDER BY datetime(created_at),rowid LIMIT 100',
      ).bind(session.id).all<{ id: string; session_id: string; problem: string; beneficiary: string | null; assumption: string | null; evidence_refs_json: string; created_at: string }>();
      return json({ stage_status: stage?.status || 'pending', opportunities: rows.results.map((row) => ({
        id: row.id, session_id: row.session_id, problem: row.problem, beneficiary: row.beneficiary,
        assumption: row.assumption, evidence_refs: JSON.parse(row.evidence_refs_json) as string[],
        evidence_status: 'unverified', created_at: row.created_at,
      })) });
    }
    const sessionBlueprintsMatch = path.match(/^\/api\/v1\/sessions\/([^/]+)\/blueprints$/);
    if (sessionBlueprintsMatch?.[1] && request.method === 'GET') {
      const session = await ownedSession(env.DB, owner, sessionBlueprintsMatch[1]);
      requireActiveSession(session);
      const rows = await env.DB.prepare(
        `SELECT b.id,b.idea_version_id,b.version,b.review_required,b.created_at FROM blueprints b
         JOIN idea_versions i ON i.id = b.idea_version_id WHERE i.session_id = ?
         ORDER BY datetime(b.created_at) DESC,b.rowid DESC LIMIT 100`,
      ).bind(session.id).all<BlueprintRow>();
      return json({ blueprints: rows.results.map((row) => ({ ...row, review_required: Boolean(row.review_required) })) });
    }
    const jobsMatch = path.match(/^\/api\/v1\/sessions\/([^/]+)\/jobs$/);
    if (jobsMatch?.[1] && request.method === 'GET') {
      const session = await ownedSession(env.DB, owner, jobsMatch[1]);
      requireActiveSession(session);
      const rows = await env.DB.prepare(
        `SELECT id,job_type,status,stage,request_json,created_at FROM jobs WHERE session_id = ?
         AND status IN ('queued','running','validating','retry_wait') ORDER BY datetime(created_at) DESC,rowid DESC LIMIT 10`,
      ).bind(session.id).all<{ id: string; job_type: string; status: string; stage: string | null; request_json: string; created_at: string }>();
      return json({ jobs: rows.results.map(({ request_json, ...row }) => ({
        ...row, idea_version_id: (JSON.parse(request_json) as { idea_version_id?: string }).idea_version_id || null,
      })) });
    }
    if (jobsMatch?.[1] && request.method === 'POST') {
      const session = await ownedSession(env.DB, owner, jobsMatch[1]);
      const context = JSON.parse(session.context_json) as SessionContext;
      if (!context.confirmed) throw new ApiFailure(409, 'context_not_confirmed', 'Review and confirm context before generation.');
      const body = await readBody(request);
      if (body.job_type !== 'opportunity_map' && body.job_type !== 'diverse_slate') throw new ApiFailure(422, 'invalid_job_type', 'Unknown session job type.');
      return enqueueJob(request, env, owner, session, String(body.job_type), body);
    }
    const ideasMatch = path.match(/^\/api\/v1\/sessions\/([^/]+)\/ideas$/);
    if (ideasMatch?.[1] && request.method === 'GET') {
      const session = await ownedSession(env.DB, owner, ideasMatch[1]);
      const ideas = await env.DB.prepare(
        `SELECT i.id,i.strategy,i.card_json,i.visibility,i.created_at,
          EXISTS(SELECT 1 FROM idea_pins p WHERE p.idea_version_id = i.id) AS pinned
         FROM idea_versions i WHERE i.session_id = ? ORDER BY i.created_at`,
      ).bind(session.id).all<{ id: string; strategy: string; card_json: string; visibility: string; created_at: string; pinned: number }>();
      const edges = await env.DB.prepare(
        `SELECT e.child_version_id,e.parent_version_id,e.edge_kind,e.reason FROM idea_edges e
         JOIN idea_versions i ON i.id = e.child_version_id WHERE i.session_id = ?`,
      ).bind(session.id).all();
      return json({ ideas: ideas.results.map((idea) => ({ ...idea, card: JSON.parse(idea.card_json), card_json: undefined, pinned: Boolean(idea.pinned) })), edges: edges.results });
    }
    const jobMatch = path.match(/^\/api\/v1\/jobs\/([^/]+)$/);
    if (jobMatch?.[1] && request.method === 'GET') {
      const job = await env.DB.prepare(
        `SELECT j.id,j.job_type,j.status,j.stage,j.progress_json,j.result_json,j.error_json,j.attempt_count,j.created_at,j.updated_at
         FROM jobs j JOIN ideation_sessions s ON s.id = j.session_id WHERE j.id = ? AND s.guest_id = ?`,
      ).bind(jobMatch[1], owner.guest_id).first<Record<string, unknown>>();
      if (!job) throw new ApiFailure(404, 'job_not_found', 'Job not found.');
      return json({ ...job, progress: JSON.parse(String(job.progress_json)), result: job.result_json ? JSON.parse(String(job.result_json)) : null, error: job.error_json ? JSON.parse(String(job.error_json)) : null, progress_json: undefined, result_json: undefined, error_json: undefined });
    }
    const actionMatch = path.match(/^\/api\/v1\/ideas\/([^/]+)\/actions$/);
    if (actionMatch?.[1] && request.method === 'POST') return await handleIdeaAction(request, env, owner, actionMatch[1]);
    const evidenceMatch = path.match(/^\/api\/v1\/ideas\/([^/]+)\/evidence$/);
    if (evidenceMatch?.[1] && request.method === 'GET') {
      const idea = await ownedIdea(env.DB, owner, evidenceMatch[1]);
      const claims = await env.DB.prepare('SELECT id,claim,claim_type,verification_status,checked_at,source_record_id FROM research_claims WHERE idea_version_id = ? ORDER BY created_at').bind(idea.id).all();
      return json({ idea_version_id: idea.id, coverage: claims.results.length ? 'partial' : 'insufficient_evidence', claims: claims.results });
    }
    const validationMatch = path.match(/^\/api\/v1\/ideas\/([^/]+)\/validation$/);
    if (validationMatch?.[1] && request.method === 'POST') {
      const idea = await ownedIdea(env.DB, owner, validationMatch[1]);
      const session = await ownedSession(env.DB, owner, idea.session_id);
      return enqueueJob(request, env, owner, session, 'validation', { idea_version_id: idea.id });
    }
    const blueprintMatch = path.match(/^\/api\/v1\/ideas\/([^/]+)\/blueprints$/);
    if (blueprintMatch?.[1] && request.method === 'GET') {
      const idea = await ownedIdea(env.DB, owner, blueprintMatch[1]);
      const session = await ownedSession(env.DB, owner, idea.session_id);
      requireActiveSession(session);
      const rows = await env.DB.prepare(
        `SELECT id,idea_version_id,version,review_required,created_at FROM blueprints
         WHERE idea_version_id = ? ORDER BY datetime(created_at) DESC,rowid DESC LIMIT 100`,
      ).bind(idea.id).all<BlueprintRow>();
      return json({ idea_version_id: idea.id, blueprints: rows.results.map((row) => ({ ...row, review_required: Boolean(row.review_required) })) });
    }
    if (blueprintMatch?.[1] && request.method === 'POST') {
      const idea = await ownedIdea(env.DB, owner, blueprintMatch[1]);
      const session = await ownedSession(env.DB, owner, idea.session_id);
      return enqueueJob(request, env, owner, session, 'blueprint', { idea_version_id: idea.id });
    }
    const blueprintReadMatch = path.match(/^\/api\/v1\/blueprints\/([^/]+)$/);
    if (blueprintReadMatch?.[1] && request.method === 'GET') {
      const blueprint = await env.DB.prepare(
        `SELECT b.id,b.idea_version_id,b.version,b.review_required,b.created_at,b.content_markdown FROM blueprints b
         JOIN idea_versions i ON i.id = b.idea_version_id JOIN ideation_sessions s ON s.id = i.session_id
         WHERE b.id = ? AND s.guest_id = ? AND s.status = 'active'`,
      ).bind(blueprintReadMatch[1], owner.guest_id).first<BlueprintRow & { content_markdown: string }>();
      if (!blueprint) throw new ApiFailure(404, 'blueprint_not_found', 'Blueprint not found.');
      return json({ ...blueprint, review_required: Boolean(blueprint.review_required), content_markdown: normalizeText(blueprint.content_markdown) });
    }
    const exportMatch = path.match(/^\/api\/v1\/blueprints\/([^/]+)\/export\.md$/);
    if (exportMatch?.[1] && request.method === 'GET') {
      const blueprint = await env.DB.prepare(
        `SELECT b.content_markdown FROM blueprints b JOIN idea_versions i ON i.id = b.idea_version_id
         JOIN ideation_sessions s ON s.id = i.session_id WHERE b.id = ? AND s.guest_id = ? AND s.status = 'active'`,
      ).bind(exportMatch[1], owner.guest_id).first<{ content_markdown: string }>();
      if (!blueprint) throw new ApiFailure(404, 'blueprint_not_found', 'Blueprint not found.');
      return new Response(normalizeText(blueprint.content_markdown), { headers: { 'content-type': 'text/markdown; charset=utf-8', 'content-disposition': `attachment; filename="hacktor-${exportMatch[1]}.md"` } });
    }
    throw new ApiFailure(404, 'not_found', 'API route not found.');
  } catch (error) {
    if (error instanceof ApiFailure) return failure(error, requestId);
    console.error(JSON.stringify({ message: 'unhandled API error', request_id: requestId, path, error: error instanceof Error ? error.message : String(error) }));
    return failure(new ApiFailure(500, 'internal_error', 'An unexpected error occurred.', true), requestId);
  }
}
