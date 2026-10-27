import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleApiRequest } from '../../apps/web/src/api';
import type { SessionContext } from '../../packages/contracts/src/index';

const baseContext: SessionContext = {
  summary: 'An offline mutual aid board for neighbors.', beneficiaries: [], goals: [], hard_constraints: [],
  soft_constraints: [], unknowns: ['No participant interviews yet.'], confirmed: false, source_status: 'user_provided',
};

async function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  for (const name of readdirSync(resolve('database/migrations')).filter((file) => file.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(resolve('database/migrations', name), 'utf8'));
  }
  for (const [id, capability] of [['one', 'cap-one'], ['two', 'cap-two']] as const) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(capability));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    sqlite.prepare('INSERT INTO guest_sessions(id,capability_hash,expires_at) VALUES (?,?,datetime(\'now\',\'+1 day\'))').run(id, hash);
    sqlite.prepare(`INSERT INTO ideation_sessions(id,guest_id,mode,title,context_json,original_idea_text,review_required)
      VALUES (?,?,'idea_first','Continuity',?,?,1)`).run(`session-${id}`, id, JSON.stringify(baseContext), `Original idea ${id}`);
    sqlite.prepare(`INSERT INTO idea_versions(id,session_id,card_json,schema_version)
      VALUES (?,?,'{}','1.0')`).run(`idea-${id}`, `session-${id}`);
  }
  const prepare = (sql: string) => {
    const statement = sqlite.prepare(sql);
    const bound = (...args: unknown[]) => ({
      first: async <T>() => (statement.get(...args as []) as T | undefined) ?? null,
      all: async <T>() => ({ results: statement.all(...args as []) as T[] }),
      run: async () => ({ meta: { changes: statement.run(...args as []).changes } }),
      _statement: statement, _args: args,
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
  const env = { DB: db } as Parameters<typeof handleApiRequest>[1];
  const request = (path: string, owner: 'one' | 'two' = 'one', method = 'GET', body?: unknown, revision?: number) => {
    const headers: Record<string, string> = { cookie: `hacktor_session=cap-${owner}; hacktor_csrf=csrf`, 'x-csrf-token': 'csrf' };
    if (body) headers['content-type'] = 'application/json';
    if (revision !== undefined) headers['if-match'] = String(revision);
    return handleApiRequest(new Request(`https://hacktor.test/api/v1${path}`, {
      method, headers, ...(body ? { body: JSON.stringify(body) } : {}),
    }), env);
  };
  return { sqlite, request, env };
}

describe('product continuity owner-scoped API', () => {
  it('persists a draft, rejects stale and cross-owner writes, then consumes it on confirmation', async () => {
    const { sqlite, request } = await fixture();
    const first = await request('/sessions/session-one/draft', 'one', 'PUT', { context: baseContext, base_context_revision: 1 }, 0);
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as { data: { draft: { draft_revision: number } } };
    expect(firstBody.data.draft.draft_revision).toBe(1);
    const changed = { ...baseContext, summary: 'A revised offline mutual aid board.' };
    expect((await request('/sessions/session-one/draft', 'one', 'PUT', { context: changed, base_context_revision: 1 }, 1)).status).toBe(200);
    const stale = await request('/sessions/session-one/draft', 'one', 'PUT', { context: baseContext, base_context_revision: 1 }, 1);
    expect(stale.status).toBe(409);
    expect((await stale.json()) as { error: { code: string } }).toMatchObject({ error: { code: 'draft_revision_conflict' } });
    expect((await request('/sessions/session-one/draft', 'two')).status).toBe(404);
    expect((await request('/sessions/session-one/draft', 'two', 'PUT', { context: changed, base_context_revision: 1 }, 0)).status).toBe(404);
    const read = await request('/sessions/session-one/draft');
    expect((await read.json()) as { data: { draft: { context: SessionContext } } }).toMatchObject({ data: { draft: { context: changed } } });
    expect((await request('/sessions/session-one/context', 'one', 'PATCH', { context: { ...changed, confirmed: true } }, 1)).status).toBe(200);
    expect(sqlite.prepare('SELECT count(*) AS n FROM session_context_drafts').get()).toMatchObject({ n: 0 });
    expect(sqlite.prepare("SELECT original_idea_text FROM ideation_sessions WHERE id = 'session-one'").get()).toMatchObject({ original_idea_text: 'Original idea one' });
    expect((await request('/sessions/session-one/draft', 'one', 'PUT', { context: changed, base_context_revision: 1 }, 2)).status).toBe(409);
    sqlite.close();
  });

  it('keeps the first confirmed context when two tabs confirm the same revision', async () => {
    const { sqlite, request } = await fixture();
    const [left, right] = await Promise.all([
      request('/sessions/session-one/context', 'one', 'PATCH', { context: { ...baseContext, summary: 'First tab', confirmed: true } }, 1),
      request('/sessions/session-one/context', 'one', 'PATCH', { context: { ...baseContext, summary: 'Second tab', confirmed: true } }, 1),
    ]);
    expect([left.status, right.status].sort()).toEqual([200, 409]);
    const row = sqlite.prepare("SELECT context_revision,context_json FROM ideation_sessions WHERE id = 'session-one'").get() as { context_revision: number; context_json: string };
    expect(row.context_revision).toBe(2);
    expect(['First tab', 'Second tab']).toContain((JSON.parse(row.context_json) as SessionContext).summary);
    sqlite.close();
  });

  it('does not recreate a draft when confirmation races with autosave', async () => {
    const { sqlite, request } = await fixture();
    const edited = { ...baseContext, summary: 'A later working draft.' };
    const [save, confirm] = await Promise.all([
      request('/sessions/session-one/draft', 'one', 'PUT', { context: edited, base_context_revision: 1 }, 0),
      request('/sessions/session-one/context', 'one', 'PATCH', { context: { ...edited, confirmed: true } }, 1),
    ]);
    expect(confirm.status).toBe(200);
    expect([200, 409]).toContain(save.status);
    expect(sqlite.prepare('SELECT count(*) AS n FROM session_context_drafts').get()).toMatchObject({ n: 0 });
    const confirmed = sqlite.prepare("SELECT context_json FROM ideation_sessions WHERE id = 'session-one'").get() as { context_json: string };
    expect((JSON.parse(confirmed.context_json) as SessionContext).summary).toBe(edited.summary);
    sqlite.close();
  });

  it('requires CSRF, enforces draft size and rejects expired capabilities', async () => {
    const { sqlite, request, env } = await fixture();
    const oversized = { ...baseContext, summary: 'x'.repeat(60_000) };
    expect((await request('/sessions/session-one/draft', 'one', 'PUT', { context: oversized, base_context_revision: 1 }, 0)).status).toBe(413);
    const missingCsrf = await handleApiRequest(new Request('https://hacktor.test/api/v1/sessions/session-one/draft', {
      method: 'PUT', headers: { cookie: 'hacktor_session=cap-one; hacktor_csrf=csrf', 'if-match': '0', 'content-type': 'application/json' },
      body: JSON.stringify({ context: baseContext, base_context_revision: 1 }),
    }), env);
    expect(missingCsrf.status).toBe(403);
    sqlite.prepare("UPDATE guest_sessions SET expires_at = datetime('now','-1 minute') WHERE id = 'one'").run();
    expect((await request('/sessions/session-one/draft')).status).toBe(401);
    sqlite.close();
  });

  it('lists exact blueprint history and protects content from other or expired owners', async () => {
    const { sqlite, request } = await fixture();
    sqlite.prepare("INSERT INTO idea_versions(id,session_id,card_json,schema_version) VALUES ('idea-one-b','session-one','{}','1.0')").run();
    for (const [id, idea, stamp] of [
      ['blueprint-a', 'idea-one', '2026-01-01 00:00:00'],
      ['blueprint-b', 'idea-one', '2026-01-02 00:00:00'],
      ['blueprint-c', 'idea-one-b', '2026-01-03 00:00:00'],
      ['blueprint-private', 'idea-two', '2026-01-04 00:00:00'],
    ]) sqlite.prepare('INSERT INTO blueprints(id,idea_version_id,content_markdown,created_at) VALUES (?,?,?,?)').run(id, idea, `# ${id}`, stamp);
    const history = (await (await request('/ideas/idea-one/blueprints')).json()) as { data: { blueprints: Array<{ id: string }> } };
    expect(history.data.blueprints.map((item) => item.id)).toEqual(['blueprint-b', 'blueprint-a']);
    const sessionHistory = (await (await request('/sessions/session-one/blueprints')).json()) as { data: { blueprints: Array<{ id: string }> } };
    expect(sessionHistory.data.blueprints.map((item) => item.id)).toEqual(['blueprint-c', 'blueprint-b', 'blueprint-a']);
    const exact = (await (await request('/blueprints/blueprint-a')).json()) as { data: { idea_version_id: string; content_markdown: string } };
    expect(exact.data).toMatchObject({ idea_version_id: 'idea-one', content_markdown: '# blueprint-a' });
    expect(await (await request('/blueprints/blueprint-a/export.md')).text()).toBe('# blueprint-a');
    expect((await request('/blueprints/blueprint-private')).status).toBe(404);
    sqlite.prepare("UPDATE ideation_sessions SET status = 'deleting' WHERE id = 'session-one'").run();
    expect((await request('/blueprints/blueprint-a')).status).toBe(404);
    sqlite.prepare("UPDATE ideation_sessions SET status = 'active' WHERE id = 'session-one'").run();
    sqlite.prepare("UPDATE guest_sessions SET expires_at = datetime('now','-1 minute') WHERE id = 'one'").run();
    expect((await request('/blueprints/blueprint-a')).status).toBe(401);
    sqlite.close();
  });

  it('returns stored Map hypotheses as unverified and an honest empty state', async () => {
    const { sqlite, request } = await fixture();
    const empty = (await (await request('/sessions/session-one/opportunities')).json()) as { data: { stage_status: string; opportunities: unknown[] } };
    expect(empty.data).toEqual({ stage_status: 'pending', opportunities: [] });
    sqlite.prepare("INSERT INTO opportunity_hypotheses(id,session_id,problem,beneficiary,assumption) VALUES ('map-1','session-one','Missing handoff','Coordinators','This delay may affect delivery')").run();
    const mapped = (await (await request('/sessions/session-one/opportunities')).json()) as { data: { opportunities: Array<{ evidence_status: string; evidence_refs: string[] }> } };
    expect(mapped.data.opportunities[0]).toMatchObject({ evidence_status: 'unverified', evidence_refs: [] });
    expect((await request('/sessions/session-one/opportunities', 'two')).status).toBe(404);
    sqlite.prepare("INSERT INTO session_stage_runs(session_id,stage,status) VALUES ('session-one','map','blocked')").run();
    const blocked = (await (await request('/sessions/session-one/opportunities')).json()) as { data: { stage_status: string } };
    expect(blocked.data.stage_status).toBe('blocked');
    sqlite.close();
  });

  it('discovers unfinished jobs without disclosing another owner request', async () => {
    const { sqlite, request } = await fixture();
    sqlite.prepare(`INSERT INTO jobs(id,session_id,owner_key,job_type,status,request_json,request_hash)
      VALUES ('active-job','session-one','guest:one','blueprint','retry_wait',?,'hash')`)
      .run(JSON.stringify({ idea_version_id: 'idea-one', private_note: 'do not disclose' }));
    const response = await request('/sessions/session-one/jobs');
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { jobs: Array<{ id: string; idea_version_id: string; request_json?: string }> } };
    expect(body.data.jobs).toMatchObject([{ id: 'active-job', idea_version_id: 'idea-one' }]);
    expect(JSON.stringify(body)).not.toContain('private_note');
    expect((await request('/sessions/session-one/jobs', 'two')).status).toBe(404);
    sqlite.close();
  });
});
