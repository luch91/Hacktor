import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleApiRequest } from '../../apps/web/src/api';
import { generateDeterministicTestSlate } from '../../packages/ideation/src/index';
import type { SessionContext } from '../../packages/contracts/src/index';

const context: SessionContext = {
  summary: 'Build a climate flood readiness tool for coastal residents.',
  beneficiaries: ['coastal residents'], goals: [], hard_constraints: [], soft_constraints: [],
  unknowns: [], confirmed: true, source_status: 'user_provided',
};

async function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  const migrationDir = resolve('database/migrations');
  for (const name of readdirSync(migrationDir).filter((file) => file.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(resolve(migrationDir, name), 'utf8'));
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('capability'));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  sqlite.prepare("INSERT INTO guest_sessions(id,capability_hash,expires_at) VALUES ('guest',?,datetime('now','+1 day'))").run(hash);
  sqlite.prepare("INSERT INTO ideation_sessions(id,guest_id,mode,title,context_json) VALUES ('session','guest','hackathon_first','Climate',?)")
    .run(JSON.stringify(context));
  for (const [index, card] of generateDeterministicTestSlate(context).slice(0, 2).entries()) {
    sqlite.prepare('INSERT INTO idea_versions(id,session_id,strategy,card_json,schema_version) VALUES (?,?,?,?,?)')
      .run(`idea-${index + 1}`, 'session', card.strategy, JSON.stringify(card), '1.0');
  }
  const prepare = (sql: string) => {
    const statement = sqlite.prepare(sql);
    const bound = (...args: unknown[]) => ({
      first: async <T>() => (statement.get(...args as []) as T | undefined) ?? null,
      all: async <T>() => ({ results: statement.all(...args as []) as T[] }),
      run: async () => ({ meta: { changes: statement.run(...args as []).changes } }),
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
  const env = { DB: db, INFERENCE_MODE: 'deterministic' } as Parameters<typeof handleApiRequest>[1];
  const action = (key: string, body: Record<string, unknown>) => handleApiRequest(new Request('https://hacktor.test/api/v1/ideas/idea-1/actions', {
    method: 'POST',
    headers: { cookie: 'hacktor_session=capability; hacktor_csrf=csrf', 'x-csrf-token': 'csrf', 'idempotency-key': key, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }), env);
  return { sqlite, db, action };
}

describe('M1 action lease fencing', () => {
  it('rolls back a lone executor when its lease expires before commit', async () => {
    const { sqlite, db, action } = await fixture();
    const original = db.batch.bind(db);
    let expired = false;
    db.batch = async (statements) => {
      if (!expired && statements.length > 4) {
        expired = true;
        sqlite.prepare("UPDATE action_idempotency_keys SET lease_expires_at = datetime('now','-1 minute')").run();
      }
      return original(statements);
    };
    const response = await action('expired-branch-key', { command: 'branch', instruction: 'Try a narrower workflow.' });
    expect(response.status).toBe(409);
    expect(sqlite.prepare('SELECT count(*) AS n FROM idea_versions').get()).toMatchObject({ n: 2 });
    expect(sqlite.prepare('SELECT count(*) AS n FROM idea_edges').get()).toMatchObject({ n: 0 });
    expect(sqlite.prepare('SELECT count(*) AS n FROM idea_actions').get()).toMatchObject({ n: 0 });
    db.batch = original;
    expect((await action('expired-branch-key', { command: 'branch', instruction: 'Try a narrower workflow.' })).status).toBe(200);
    expect(sqlite.prepare('SELECT count(*) AS n FROM idea_versions').get()).toMatchObject({ n: 3 });
    sqlite.close();
  });

  it('rejects slow executor writes after reclaim while preserving both combine parents', async () => {
    const { sqlite, db, action } = await fixture();
    const original = db.batch.bind(db);
    let paused = false;
    const body = { command: 'combine', other_parent_version_id: 'idea-2' };
    db.batch = async (statements) => {
      if (!paused && statements.length > 4) {
        paused = true;
        sqlite.prepare("UPDATE action_idempotency_keys SET lease_expires_at = datetime('now','-1 minute')").run();
        const winner = await action('combine-key', body);
        expect(winner.status).toBe(200);
      }
      return original(statements);
    };
    const resumed = await action('combine-key', body);
    expect(resumed.status).toBe(200);
    expect(sqlite.prepare("SELECT count(*) AS n FROM idea_actions WHERE command = 'combine'").get()).toMatchObject({ n: 1 });
    expect(sqlite.prepare('SELECT count(*) AS n FROM idea_edges').get()).toMatchObject({ n: 2 });
    expect(sqlite.prepare('SELECT count(*) AS n FROM idea_versions').get()).toMatchObject({ n: 3 });
    sqlite.close();
  });

  it('allows one simultaneous reclaim and returns one claim on repeated research requests', async () => {
    const { sqlite, action } = await fixture();
    sqlite.prepare(`INSERT INTO action_idempotency_keys
      (owner_key,route_key,client_key,request_hash,action_id,lease_expires_at)
      VALUES ('guest:guest','ideas/idea-1/actions/research_more','research-key','stale','old',datetime('now','-1 minute'))`).run();
    // Use a real reservation hash so competing requests have the same canonical request.
    const body = { command: 'research_more', instruction: 'Check flood sensor calibration.' };
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    sqlite.prepare("UPDATE action_idempotency_keys SET request_hash = ? WHERE client_key = 'research-key'").run(hash);
    const [left, right] = await Promise.all([action('research-key', body), action('research-key', body)]);
    expect([left.status, right.status]).toContain(200);
    expect([left.status, right.status].every((status) => status === 200 || status === 409)).toBe(true);
    const repeated = await action('research-key', body);
    expect(repeated.status).toBe(200);
    expect(sqlite.prepare('SELECT count(*) AS n FROM research_claims').get()).toMatchObject({ n: 1 });
    expect(sqlite.prepare("SELECT count(*) AS n FROM idea_actions WHERE command = 'research_more'").get()).toMatchObject({ n: 1 });
    sqlite.close();
  });

  it('repairs a committed action whose response was not persisted', async () => {
    const { sqlite, action } = await fixture();
    const body = { command: 'challenge' };
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    sqlite.prepare(`INSERT INTO action_idempotency_keys
      (owner_key,route_key,client_key,request_hash,action_id,lease_expires_at)
      VALUES ('guest:guest','ideas/idea-1/actions/challenge','challenge-key',?,'committed',datetime('now','-1 minute'))`).run(hash);
    sqlite.prepare(`INSERT INTO idea_actions(id,session_id,target_version_id,command,action_json)
      VALUES ('committed','session','idea-1','challenge',?)`).run(JSON.stringify({ risks: ['Unverified assumption'] }));
    const first = await action('challenge-key', body);
    const repeated = await action('challenge-key', body);
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual(await repeated.json());
    expect(sqlite.prepare("SELECT count(*) AS n FROM idea_actions WHERE command = 'challenge'").get()).toMatchObject({ n: 1 });
    expect(sqlite.prepare("SELECT response_json IS NOT NULL AS saved FROM action_idempotency_keys WHERE client_key = 'challenge-key'").get()).toMatchObject({ saved: 1 });
    sqlite.close();
  });
});
