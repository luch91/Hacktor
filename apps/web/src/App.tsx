import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { IdeaCardV1, IdeaCommand, SessionContext } from '@hacktor/contracts';

type ThemePreference = 'dark' | 'light' | 'system';
type Mode = 'hackathon_first' | 'idea_first';
type Screen = 'landing' | 'intake' | 'review' | 'studio';

interface IdeaView {
  id: string;
  strategy: string;
  visibility: string;
  pinned: boolean;
  card: IdeaCardV1;
}

interface EdgeView {
  child_version_id: string;
  parent_version_id: string;
  edge_kind: string;
}

interface StageView {
  stage: string;
  status: 'pending' | 'running' | 'completed' | 'blocked' | 'failed';
}

interface EvidenceView {
  coverage: string;
  claims: Array<{ id: string; claim: string; claim_type: string; verification_status: string }>;
}

const stages = ['Understand', 'Map', 'Diverge', 'Interrogate', 'Evolve', 'Research', 'Converge', 'Blueprint'] as const;
const actionCommands: Array<{ command: IdeaCommand; label: string }> = [
  { command: 'challenge', label: 'Challenge' },
  { command: 'branch', label: 'Branch' },
  { command: 'make_stranger', label: 'Make stranger' },
  { command: 'make_realistic', label: 'Make realistic' },
  { command: 'find_other_problem', label: 'Other problem' },
  { command: 'switch_domain', label: 'Switch domain' },
  { command: 'pin', label: 'Pin' },
  { command: 'reject', label: 'Reject' },
  { command: 'research_more', label: 'Research more' },
];

function resolveTheme(preference: ThemePreference): 'dark' | 'light' {
  if (preference !== 'system') return preference;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function readTheme(): ThemePreference {
  const value = localStorage.getItem('hacktor-theme');
  return value === 'light' || value === 'system' ? value : 'dark';
}

function csrfToken(): string {
  const part = document.cookie.split('; ').find((value) => value.startsWith('hacktor_csrf='));
  return part?.split('=').slice(1).join('=') || sessionStorage.getItem('hacktor-csrf') || '';
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set('content-type', 'application/json');
  if (init?.method && init.method !== 'GET' && csrfToken()) headers.set('x-csrf-token', csrfToken());
  const response = await fetch(`/api/v1${path}`, { ...init, headers, credentials: 'same-origin' });
  const body = (await response.json()) as { data?: T; error?: { message: string } };
  if (!response.ok || !body.data) throw new Error(body.error?.message || `Request failed with ${response.status}`);
  return body.data;
}

export function App() {
  const [theme, setTheme] = useState<ThemePreference>(readTheme);
  const [screen, setScreen] = useState<Screen>('landing');
  const [mode, setMode] = useState<Mode>('hackathon_first');
  const [title, setTitle] = useState('');
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [revision, setRevision] = useState(1);
  const [context, setContext] = useState<SessionContext | null>(null);
  const [ideas, setIdeas] = useState<IdeaView[]>([]);
  const [edges, setEdges] = useState<EdgeView[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [critique, setCritique] = useState<Record<string, string[]> | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [blueprintId, setBlueprintId] = useState('');
  const [stageStates, setStageStates] = useState<Record<string, StageView['status']>>({});
  const [evidence, setEvidence] = useState<EvidenceView | null>(null);

  const selected = useMemo(() => ideas.find((idea) => idea.id === selectedId) || ideas[0], [ideas, selectedId]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(theme);
      document.documentElement.dataset.themePreference = theme;
    };
    apply();
    localStorage.setItem('hacktor-theme', theme);
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    const savedSession = localStorage.getItem('hacktor-session-id');
    if (!savedSession || !csrfToken()) return;
    void (async () => {
      try {
        const session = await api<{ title: string; context_revision: number; context: SessionContext; stages: StageView[] }>(`/sessions/${savedSession}`);
        const ideaSet = await api<{ ideas: IdeaView[]; edges: EdgeView[] }>(`/sessions/${savedSession}/ideas`);
        setSessionId(savedSession);
        setTitle(session.title);
        setRevision(session.context_revision);
        setContext(session.context);
        setStageStates(Object.fromEntries(session.stages.map((stage) => [stage.stage, stage.status])));
        setIdeas(ideaSet.ideas);
        setEdges(ideaSet.edges);
        if (ideaSet.ideas[0]) setSelectedId(ideaSet.ideas[0].id);
        setScreen('studio');
        setStatus('Restored the private local workspace.');
      } catch {
        localStorage.removeItem('hacktor-session-id');
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setEvidence(null);
      return;
    }
    void api<EvidenceView>(`/ideas/${selectedId}/evidence`).then(setEvidence).catch(() => setEvidence(null));
  }, [selectedId]);

  function begin(nextMode: Mode) {
    setMode(nextMode);
    setScreen('intake');
    setTitle(nextMode === 'hackathon_first' ? 'My hackathon workspace' : 'My idea workspace');
    setStatus('');
  }

  async function submitIntake(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus('Creating a private workspace...');
    try {
      let parsed: SessionContext;
      if (mode === 'hackathon_first') {
        const result = await api<{ context: SessionContext }>('/briefs/parse', { method: 'POST', body: JSON.stringify({ text: input }) });
        parsed = result.context;
      } else {
        parsed = {
          summary: input,
          beneficiaries: [],
          goals: [],
          hard_constraints: [],
          soft_constraints: [],
          unknowns: ['Target participant evidence has not been independently verified.'],
          confirmed: false,
          source_status: 'user_provided',
        };
      }
      const created = await api<{ session_id: string; context_revision: number; csrf_token: string }>('/sessions', {
        method: 'POST',
        body: JSON.stringify({ mode, title, ...(mode === 'idea_first' ? { original_idea_text: input } : {}) }),
      });
      sessionStorage.setItem('hacktor-csrf', created.csrf_token);
      setSessionId(created.session_id);
      localStorage.setItem('hacktor-session-id', created.session_id);
      setRevision(created.context_revision);
      setContext(parsed);
      setScreen('review');
      setStatus('Review and confirm the context before generation.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to create the workspace.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmContext() {
    if (!context) return;
    setBusy(true);
    try {
      const confirmed = { ...context, confirmed: true };
      const result = await api<{ context_revision: number; context: SessionContext }>(`/sessions/${sessionId}/context`, {
        method: 'PATCH',
        headers: { 'if-match': String(revision) },
        body: JSON.stringify({ context: confirmed }),
      });
      setContext(result.context);
      setRevision(result.context_revision);
      setScreen('studio');
      setStatus('Context confirmed. Generate a diverse slate when ready.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to confirm context.');
    } finally {
      setBusy(false);
    }
  }

  async function loadIdeas() {
    const result = await api<{ ideas: IdeaView[]; edges: EdgeView[] }>(`/sessions/${sessionId}/ideas`);
    setIdeas(result.ideas);
    setEdges(result.edges);
    if (!selectedId && result.ideas[0]) setSelectedId(result.ideas[0].id);
  }

  async function loadStages() {
    const result = await api<{ stages: StageView[] }>(`/sessions/${sessionId}`);
    setStageStates(Object.fromEntries(result.stages.map((stage) => [stage.stage, stage.status])));
  }

  async function generate() {
    setBusy(true);
    setStatus('Running the eight-stage deterministic local demonstration...');
    try {
      const key = crypto.randomUUID();
      const job = await api<{ job_id: string }>(`/sessions/${sessionId}/jobs`, {
        method: 'POST',
        headers: { 'idempotency-key': key },
        body: JSON.stringify({ job_type: 'diverse_slate', preferences: { count: 9 } }),
      });
      const state = await api<{ status: string }>(`/jobs/${job.job_id}`);
      await loadIdeas();
      await loadStages();
      setStatus(`Job ${state.status}. Results use the deterministic test adapter, not live AI.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Generation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function runAction(command: IdeaCommand) {
    if (!selected) return;
    if (command === 'combine') return;
    setBusy(true);
    try {
      const result = await api<{ critique?: Record<string, string[]> }>(`/ideas/${selected.id}/actions`, {
        method: 'POST',
        headers: { 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({ command, reason: 'Builder action from the Studio inspector.' }),
      });
      if (result.critique) setCritique(result.critique);
      await loadIdeas();
      await loadStages();
      setEvidence(await api<EvidenceView>(`/ideas/${selected.id}/evidence`));
      setStatus(`${command.replaceAll('_', ' ')} completed without changing the parent version.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Idea action failed.');
    } finally {
      setBusy(false);
    }
  }

  async function combineWithNext() {
    if (!selected || ideas.length < 2) return;
    const other = ideas.find((idea) => idea.id !== selected.id);
    if (!other) return;
    setBusy(true);
    try {
      await api(`/ideas/${selected.id}/actions`, {
        method: 'POST',
        headers: { 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({ command: 'combine', other_parent_version_id: other.id, reason: 'Builder combined two selected directions.' }),
      });
      await loadIdeas();
      await loadStages();
      setStatus('Combined idea created with two parent edges.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Combine failed.');
    } finally {
      setBusy(false);
    }
  }

  async function createBlueprint() {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await api<{ job_id: string }>(`/ideas/${selected.id}/blueprints`, {
        method: 'POST',
        headers: { 'idempotency-key': crypto.randomUUID() },
        body: '{}',
      });
      const job = await api<{ result: { artifact_ids: string[] } | null }>(`/jobs/${result.job_id}`);
      const createdId = job.result?.artifact_ids[0];
      if (!createdId) throw new Error('Blueprint job completed without an artifact.');
      setBlueprintId(createdId);
      await loadStages();
      setStatus('Blueprint created for the exact selected idea version. Review is required.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Blueprint creation failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <button className="wordmark plain-button" onClick={() => setScreen('landing')} type="button" aria-label="Hacktor home">hacktor<span>.</span></button>
        <p className="header-mode">Deep Ideation Studio</p>
        <fieldset className="theme-picker">
          <legend>Appearance</legend>
          {(['dark', 'light', 'system'] as const).map((value) => (
            <label key={value}><input checked={theme === value} name="theme" onChange={() => setTheme(value)} type="radio" value={value} />{value}</label>
          ))}
        </fieldset>
      </header>

      {screen === 'landing' && (
        <section className="hero" id="top">
          <p className="eyebrow">Deep Ideation Studio</p>
          <h1>Find the idea beneath the <span>obvious one.</span></h1>
          <p className="hero-copy">Map overlooked problems, generate nine structurally different directions, challenge assumptions, preserve every branch, and turn one exact version into a build-ready blueprint.</p>
          <div className="entry-grid">
            <button onClick={() => begin('hackathon_first')} type="button"><small>01 / Brief-led</small><strong>Start with a hackathon</strong><span>Paste the official brief, review constraints, then explore.</span></button>
            <button onClick={() => begin('idea_first')} type="button"><small>02 / Idea-led</small><strong>Start with an idea</strong><span>Keep your original words intact, then branch beyond them.</span></button>
          </div>
          <p className="notice" role="status">Local M1 demonstration uses a deterministic test adapter. Live AI and automated research sources remain disabled.</p>
        </section>
      )}

      {screen === 'intake' && (
        <section className="intake-shell">
          <button className="back-link" onClick={() => setScreen('landing')} type="button">Back to entry paths</button>
          <p className="eyebrow">{mode === 'hackathon_first' ? 'Hackathon-first' : 'Idea-first'} intake</p>
          <h1>{mode === 'hackathon_first' ? 'Paste the brief.' : 'Write the idea exactly as you mean it.'}</h1>
          <form onSubmit={(event) => void submitIntake(event)}>
            <label>Workspace title<input required maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label>{mode === 'hackathon_first' ? 'Hackathon brief' : 'Original idea'}<textarea required minLength={mode === 'hackathon_first' ? 30 : 1} rows={12} value={input} onChange={(event) => setInput(event.target.value)} /></label>
            <button disabled={busy} type="submit">{busy ? 'Creating...' : 'Review context'}</button>
          </form>
          {status && <p className="status-line" role="status">{status}</p>}
        </section>
      )}

      {screen === 'review' && context && (
        <section className="review-shell">
          <p className="eyebrow">Understand / Review checkpoint</p>
          <h1>Correct the context before generation.</h1>
          <div className="review-grid">
            <label>Working summary<textarea rows={8} value={context.summary} onChange={(event) => setContext({ ...context, summary: event.target.value })} /></label>
            <div className="constraint-panel"><h2>Hard constraints</h2>{context.hard_constraints.length ? context.hard_constraints.map((item) => <p key={item.id}>{item.text}</p>) : <p>No hard constraints detected. Add them to the summary if needed.</p>}<h2>Unknowns</h2>{context.unknowns.map((item) => <p key={item}>{item}</p>)}</div>
          </div>
          <button disabled={busy} onClick={() => void confirmContext()} type="button">Confirm context and enter Studio</button>
          <p className="status-line" role="status">{status}</p>
        </section>
      )}

      {screen === 'studio' && (
        <section className="studio-shell">
          <aside className="stage-rail" aria-label="Ideation stages"><p className="eyebrow">Workflow</p><ol>{stages.map((stage, index) => { const state = stageStates[stage.toLowerCase()]; return <li className={state || (index < 2 ? 'pending' : '')} key={stage}><span>{String(index + 1).padStart(2, '0')}</span>{stage}{state === 'blocked' ? <i>review</i> : null}</li>; })}</ol></aside>
          <section className="studio-canvas">
            <div className="canvas-header"><div><p className="eyebrow">{title}</p><h1>Idea constellation</h1></div><button disabled={busy} onClick={() => void generate()} type="button">{ideas.length ? 'Generate another slate' : 'Generate diverse slate'}</button></div>
            <p className="status-line" role="status">{status}</p>
            {!ideas.length ? <div className="empty-canvas"><span>09</span><h2>Nine strategies are ready.</h2><p>Confirming context does not generate anything. Start the deterministic local run when you are ready.</p></div> : (
              <div className="idea-grid" role="list" aria-label="Generated ideas">{ideas.map((idea) => <button className={selected?.id === idea.id ? 'idea-card selected' : 'idea-card'} key={idea.id} onClick={() => { setSelectedId(idea.id); setCritique(null); }} role="listitem" type="button"><small>{idea.strategy.replaceAll('_', ' ')} {idea.pinned ? '/ pinned' : ''}</small><strong>{idea.card.name}</strong><span>{idea.card.one_liner}</span><em>{idea.visibility}</em></button>)}</div>
            )}
            {edges.length > 0 && <details className="lineage"><summary>Immutable lineage ({edges.length} edges)</summary><ul>{edges.map((edge) => <li key={`${edge.child_version_id}:${edge.parent_version_id}`}>{edge.edge_kind}: {edge.parent_version_id.slice(0, 8)} to {edge.child_version_id.slice(0, 8)}</li>)}</ul></details>}
          </section>
          <aside className="inspector">
            <p className="eyebrow">Selected version</p>
            {selected ? <><h2>{selected.card.name}</h2><p>{selected.card.problem}</p><dl><dt>Target</dt><dd>{selected.card.target_user}</dd><dt>Mechanism</dt><dd>{selected.card.mechanism}</dd><dt>Evidence</dt><dd>{evidence?.coverage || selected.card.evidence_status}. {evidence?.claims.length ? `${evidence.claims.length} claim records.` : 'No external sources attached.'}</dd><dt>Version</dt><dd>{selected.id}</dd></dl><div className="action-stack">{actionCommands.map((action) => <button disabled={busy} key={action.command} onClick={() => void runAction(action.command)} type="button">{action.label}</button>)}<button disabled={busy || ideas.length < 2} onClick={() => void combineWithNext()} type="button">Combine with another</button><button className="primary" disabled={busy} onClick={() => void createBlueprint()} type="button">Create blueprint</button></div>{ideas.length > 1 && <details className="comparison"><summary>Compare with another idea</summary><dl><dt>Current mechanism</dt><dd>{selected.card.mechanism}</dd><dt>Alternative mechanism</dt><dd>{ideas.find((idea) => idea.id !== selected.id)?.card.mechanism}</dd></dl></details>}{critique && <div className="critique"><h3>Critique</h3>{Object.entries(critique).map(([key, values]) => <div key={key}><strong>{key.replaceAll('_', ' ')}</strong>{values.map((value) => <p key={value}>{value}</p>)}</div>)}</div>}{evidence?.claims.map((claim) => <div className="evidence-claim" key={claim.id}><strong>{claim.claim_type} / {claim.verification_status}</strong><p>{claim.claim}</p></div>)}{blueprintId && <a className="export-link" href={`/api/v1/blueprints/${blueprintId}/export.md`}>Export Markdown blueprint</a>}</> : <p>Select an idea to inspect it.</p>}
          </aside>
        </section>
      )}
    </main>
  );
}
