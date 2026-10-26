import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SessionContext } from '../../packages/contracts/src/index';
import { generateDeterministicTestSlate } from '../../packages/ideation/src/index';
import { claimStudioJob, processStudioJob } from '../../workers/ai-consumer/src/processor';

const context: SessionContext = {
  summary: 'Build a climate flood readiness tool for coastal residents.',
  beneficiaries: ['coastal residents'], goals: ['show a working response handoff'],
  hard_constraints: [{ id: 'offline', text: 'Must work offline' }], soft_constraints: [],
  unknowns: [], confirmed: true, source_status: 'user_provided',
};

function testDb(mode: 'deterministic' | 'live' = 'deterministic') {
  const sqlite = new DatabaseSync(':memory:');
  const migrationDir = resolve('database/migrations');
  for (const name of readdirSync(migrationDir).filter((file) => file.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(resolve(migrationDir, name), 'utf8'));
  }
  sqlite.prepare("INSERT INTO guest_sessions(id,capability_hash,expires_at) VALUES ('guest','hash',datetime('now','+1 day'))").run();
  sqlite.prepare("INSERT INTO ideation_sessions(id,guest_id,mode,title,context_json) VALUES ('session','guest','hackathon_first','Climate',?)")
    .run(JSON.stringify(context));
  sqlite.prepare("INSERT INTO jobs(id,session_id,owner_key,job_type,request_json,request_hash,inference_mode) VALUES ('job','session','guest','diverse_slate','{}','hash',?)")
    .run(mode);
  const prepare = (sql: string) => {
    const statement = sqlite.prepare(sql);
    const bound = (...args: unknown[]) => ({
      first: async <T>() => (statement.get(...args as []) as T | undefined) ?? null,
      all: async <T>() => ({ results: statement.all(...args as []) as T[] }),
      run: async () => statement.run(...args as []),
      _statement: statement,
      _args: args,
    });
    return { bind: bound, ...bound() };
  };
  const db = {
    prepare,
    batch: async (statements: Array<{ _statement: ReturnType<DatabaseSync['prepare']>; _args: unknown[] }>) => {
      sqlite.exec('BEGIN');
      try {
        const results = statements.map((item) => item._statement.run(...item._args as []));
        sqlite.exec('COMMIT');
        return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  } as unknown as D1Database;
  return { sqlite, db, message: { job_id: 'job', schema_version: '1.0' as const } };
}

afterEach(() => vi.unstubAllGlobals());

describe('M1 durable queue processing', () => {
  it('claims atomically, recovers an expired lease, and completes only once', async () => {
    const { sqlite, db, message } = testDb();
    const [first, second] = await Promise.all([claimStudioJob(db, 'job'), claimStudioJob(db, 'job')]);
    expect([first, second].filter(Boolean)).toHaveLength(1);
    sqlite.prepare("UPDATE jobs SET lease_expires_at = datetime('now','-1 minute') WHERE id = 'job'").run();
    const result = await processStudioJob(message, db, { INFERENCE_MODE: 'deterministic' });
    expect(result.status).toBe('completed');
    expect(sqlite.prepare("SELECT count(*) AS n FROM idea_versions WHERE generation_job_id = 'job'").get()).toMatchObject({ n: 9 });
    expect((await processStudioJob(message, db, { INFERENCE_MODE: 'deterministic' })).status).toBe('duplicate');
    expect(sqlite.prepare("SELECT count(*) AS n FROM generation_runs WHERE job_id = 'job'").get()).toMatchObject({ n: 3 });
    sqlite.close();
  });

  it('resumes after interrupted persistence without duplicating artifacts', async () => {
    const { sqlite, db, message } = testDb();
    const original = db.batch.bind(db);
    let interrupted = false;
    db.batch = async (items) => {
      if (!interrupted && items.length > 5) { interrupted = true; throw new Error('worker interruption'); }
      return original(items);
    };
    expect((await processStudioJob(message, db, { INFERENCE_MODE: 'deterministic' })).status).toBe('retry_wait');
    db.batch = original;
    expect((await processStudioJob(message, db, { INFERENCE_MODE: 'deterministic' })).status).toBe('completed');
    expect(sqlite.prepare("SELECT count(*) AS n FROM idea_versions WHERE generation_job_id = 'job'").get()).toMatchObject({ n: 9 });
    expect(sqlite.prepare("SELECT count(*) AS n FROM generation_runs WHERE job_id = 'job'").get()).toMatchObject({ n: 3 });
    sqlite.close();
  });

  it('uses the live adapter against a mock endpoint and records usage', async () => {
    const { sqlite, db, message } = testDb('live');
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { request: { stage: string } };
      return new Response(JSON.stringify({
        output: body.request.stage === 'diverge' ? generateDeterministicTestSlate(context) : { stage: body.request.stage },
        usage: { input_tokens: 30, output_tokens: body.request.stage === 'diverge' ? 1000 : 20 },
      }), { status: 200 });
    }));
    const result = await processStudioJob(message, db, {
      INFERENCE_MODE: 'live', INFERENCE_ENDPOINT: 'https://mock.invalid/inference',
      INFERENCE_API_KEY: 'test-only', INFERENCE_MODEL_ID: 'mock-model',
      INFERENCE_MAX_JOB_TOKENS: '12000', INFERENCE_MAX_JOB_COST_USD: '20',
      INFERENCE_COST_PER_1K_TOKENS_USD: '1',
    });
    expect(result.status).toBe('completed');
    expect(sqlite.prepare("SELECT count(*) AS n FROM generation_runs WHERE provider = 'json_inference_provider'").get()).toMatchObject({ n: 3 });
    expect(sqlite.prepare("SELECT count(*) AS n FROM usage_ledger WHERE kind = 'reserve'").get()).toMatchObject({ n: 3 });
    sqlite.close();
  });

  it('blocks live inference without an approved credential and budget', async () => {
    const { sqlite, db, message } = testDb('live');
    expect((await processStudioJob(message, db, { INFERENCE_MODE: 'live' })).status).toBe('blocked_quota');
    expect(sqlite.prepare('SELECT count(*) AS n FROM idea_versions').get()).toMatchObject({ n: 0 });
    sqlite.close();
  });

  it('rolls back cards and claims when the lease expires before the artifact batch', async () => {
    const { sqlite, db, message } = testDb();
    const original = db.batch.bind(db);
    let expired = false;
    db.batch = async (items) => {
      if (!expired && items.length > 10) {
        expired = true;
        sqlite.prepare("UPDATE jobs SET lease_expires_at = datetime('now','-1 minute') WHERE id = 'job'").run();
      }
      return original(items);
    };
    expect((await processStudioJob(message, db, { INFERENCE_MODE: 'deterministic' })).status).toBe('duplicate');
    expect(sqlite.prepare("SELECT count(*) AS n FROM idea_versions WHERE generation_job_id = 'job'").get()).toMatchObject({ n: 0 });
    expect(sqlite.prepare('SELECT count(*) AS n FROM opportunity_hypotheses').get()).toMatchObject({ n: 0 });
    expect(sqlite.prepare("SELECT count(*) AS n FROM generation_runs WHERE stage = 'diverge'").get()).toMatchObject({ n: 0 });
    db.batch = original;
    expect((await processStudioJob(message, db, { INFERENCE_MODE: 'deterministic' })).status).toBe('completed');
    expect(sqlite.prepare("SELECT count(*) AS n FROM idea_versions WHERE generation_job_id = 'job'").get()).toMatchObject({ n: 9 });
    expect(sqlite.prepare('SELECT count(*) AS n FROM opportunity_hypotheses').get()).toMatchObject({ n: 3 });
    sqlite.close();
  });

  it('serializes competing consumers and duplicate Queue delivery', async () => {
    const { sqlite, db, message } = testDb();
    const results = await Promise.all([
      processStudioJob(message, db, { INFERENCE_MODE: 'deterministic' }),
      processStudioJob(message, db, { INFERENCE_MODE: 'deterministic' }),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual(['completed', 'duplicate']);
    expect((await processStudioJob(message, db, { INFERENCE_MODE: 'deterministic' })).status).toBe('duplicate');
    expect(sqlite.prepare("SELECT count(*) AS n FROM idea_versions WHERE generation_job_id = 'job'").get()).toMatchObject({ n: 9 });
    expect(sqlite.prepare('SELECT count(*) AS n FROM opportunity_hypotheses').get()).toMatchObject({ n: 3 });
    sqlite.close();
  });

  it('fences blueprint persistence and recovers one artifact', async () => {
    const { sqlite, db, message } = testDb();
    const card = generateDeterministicTestSlate(context)[0]!;
    sqlite.prepare("INSERT INTO idea_versions(id,session_id,strategy,card_json,schema_version) VALUES ('idea','session',?,?,'1.0')")
      .run(card.strategy, JSON.stringify(card));
    sqlite.prepare("UPDATE jobs SET job_type = 'blueprint',request_json = ? WHERE id = 'job'").run(JSON.stringify({ idea_version_id: 'idea' }));
    const original = db.batch.bind(db);
    let expired = false;
    db.batch = async (items) => {
      if (!expired && items.length === 4) {
        expired = true;
        sqlite.prepare("UPDATE jobs SET lease_expires_at = datetime('now','-1 minute') WHERE id = 'job'").run();
      }
      return original(items);
    };
    expect((await processStudioJob(message, db, { INFERENCE_MODE: 'deterministic' })).status).toBe('duplicate');
    expect(sqlite.prepare('SELECT count(*) AS n FROM blueprints').get()).toMatchObject({ n: 0 });
    db.batch = original;
    expect((await processStudioJob(message, db, { INFERENCE_MODE: 'deterministic' })).status).toBe('completed');
    expect((await processStudioJob(message, db, { INFERENCE_MODE: 'deterministic' })).status).toBe('duplicate');
    expect(sqlite.prepare('SELECT count(*) AS n FROM blueprints').get()).toMatchObject({ n: 1 });
    sqlite.close();
  });
});
