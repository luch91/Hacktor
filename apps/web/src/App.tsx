import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { BlueprintRecord, BlueprintSummary, IdeaCardV1, IdeaCommand, OpportunityHypothesis, SessionContext, SessionContextDraft } from '@hacktor/contracts';

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

interface JobView {
  status: string;
  stage: string | null;
  progress: { stage_index?: number; stage_count?: number };
  result: { artifact_ids?: string[] } | null;
  error: { message?: string } | null;
}

interface ActiveJobSummary { id: string; job_type: string; status: string; stage: string | null; idea_version_id: string | null }
interface TrackedJob { id: string; kind: 'slate' | 'blueprint'; ideaId?: string | undefined }
type DraftSaveState = 'idle' | 'unsaved' | 'saving' | 'saved' | 'conflict' | 'failed';

class ApiRequestError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) { super(message); }
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

function BlueprintDocument({ markdown }: { markdown: string }) {
  return <article className="blueprint-document">{markdown.split(/\r?\n/).map((line, index) => {
    const content = line.trim();
    if (!content) return null;
    if (content.startsWith('### ')) return <h4 key={index}>{content.slice(4)}</h4>;
    if (content.startsWith('## ')) return <h3 key={index}>{content.slice(3)}</h3>;
    if (content.startsWith('# ')) return <h2 key={index}>{content.slice(2)}</h2>;
    if (/^(?:-|\d+\.)\s/.test(content)) return <p className="blueprint-list-line" key={index}>{content}</p>;
    return <p key={index}>{content}</p>;
  })}</article>;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set('content-type', 'application/json');
  if (init?.method && init.method !== 'GET' && csrfToken()) headers.set('x-csrf-token', csrfToken());
  const response = await fetch(`/api/v1${path}`, { ...init, headers, credentials: 'same-origin' });
  const body = (await response.json()) as { data?: T; error?: { message: string; code: string } };
  if (!response.ok || !body.data) throw new ApiRequestError(body.error?.message || `Request failed with ${response.status}`, response.status, body.error?.code || 'request_failed');
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
  const [activeJob, setActiveJob] = useState<TrackedJob | null>(null);
  const [jobState, setJobState] = useState<JobView | null>(null);
  const [compareId, setCompareId] = useState('');
  const [activeStage, setActiveStage] = useState('diverge');
  const [blueprintText, setBlueprintText] = useState('');
  const [blueprintIdeaId, setBlueprintIdeaId] = useState('');
  const [originalIdea, setOriginalIdea] = useState('');
  const [mobileView, setMobileView] = useState<'ideas' | 'inspector'>('ideas');
  const [draftSaveState, setDraftSaveState] = useState<DraftSaveState>('idle');
  const [draftRevision, setDraftRevision] = useState(0);
  const draftRevisionRef = useRef(0);
  const lastSavedDraftRef = useRef('');
  const draftSavingRef = useRef(false);
  const draftGenerationRef = useRef(0);
  const draftBlockedRef = useRef(false);
  const draftConfirmingRef = useRef(false);
  const latestContextRef = useRef<SessionContext | null>(null);
  const [blueprintHistory, setBlueprintHistory] = useState<BlueprintSummary[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityHypothesis[]>([]);
  const [mapStatus, setMapStatus] = useState('pending');
  const [restorationStatus, setRestorationStatus] = useState('');
  const [activeServerJobs, setActiveServerJobs] = useState<ActiveJobSummary[]>([]);

  const selected = useMemo(() => ideas.find((idea) => idea.id === selectedId) || ideas[0], [ideas, selectedId]);
  const compared = ideas.find((idea) => idea.id === compareId && idea.id !== selected?.id);
  const selectedBlueprints = blueprintHistory.filter((blueprint) => blueprint.idea_version_id === selected?.id);
  latestContextRef.current = context;

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
    if (!savedSession) return;
    void (async () => {
      try {
        const session = await api<{ title: string; mode: Mode; original_idea_text: string | null; context_revision: number; context: SessionContext; stages: StageView[] }>(`/sessions/${savedSession}`);
        const [ideaSet, draftResult, blueprintsResult, opportunitiesResult, jobsResult] = await Promise.all([
          api<{ ideas: IdeaView[]; edges: EdgeView[] }>(`/sessions/${savedSession}/ideas`),
          api<{ draft: SessionContextDraft | null }>(`/sessions/${savedSession}/draft`),
          api<{ blueprints: BlueprintSummary[] }>(`/sessions/${savedSession}/blueprints`),
          api<{ stage_status: string; opportunities: OpportunityHypothesis[] }>(`/sessions/${savedSession}/opportunities`),
          api<{ jobs: ActiveJobSummary[] }>(`/sessions/${savedSession}/jobs`),
        ]);
        draftGenerationRef.current += 1;
        setSessionId(savedSession);
        setTitle(session.title);
        setMode(session.mode);
        setOriginalIdea(session.original_idea_text || '');
        setRevision(session.context_revision);
        const restoredContext = !session.context.confirmed && draftResult.draft?.base_context_revision === session.context_revision
          ? draftResult.draft.context : session.context;
        draftRevisionRef.current = draftResult.draft?.draft_revision || 0;
        setDraftRevision(draftRevisionRef.current);
        lastSavedDraftRef.current = JSON.stringify(restoredContext);
        setDraftSaveState(draftResult.draft ? 'saved' : 'idle');
        setContext(restoredContext);
        setStageStates(Object.fromEntries(session.stages.map((stage) => [stage.stage, stage.status])));
        const savedStage = localStorage.getItem(`hacktor-stage-${savedSession}`);
        if (savedStage && stages.some((stage) => stage.toLowerCase() === savedStage)) setActiveStage(savedStage);
        setIdeas(ideaSet.ideas);
        setEdges(ideaSet.edges);
        setBlueprintHistory(blueprintsResult.blueprints);
        setOpportunities(opportunitiesResult.opportunities);
        setMapStatus(opportunitiesResult.stage_status);
        setActiveServerJobs(jobsResult.jobs);
        const savedSelection = localStorage.getItem(`hacktor-selected-${savedSession}`);
        setSelectedId(ideaSet.ideas.find((idea) => idea.id === savedSelection)?.id || ideaSet.ideas[0]?.id || '');
        const savedJob = localStorage.getItem(`hacktor-job-${savedSession}`);
        const rememberedJob: TrackedJob | null = (() => {
          if (!savedJob) return null;
          try { return JSON.parse(savedJob) as TrackedJob; }
          catch { localStorage.removeItem(`hacktor-job-${savedSession}`); return null; }
        })();
        const serverJob = jobsResult.jobs.find((job) => job.id === rememberedJob?.id) || jobsResult.jobs[0];
        if (serverJob) setActiveJob({ id: serverJob.id, kind: serverJob.job_type === 'blueprint' ? 'blueprint' : 'slate', ideaId: serverJob.idea_version_id || (rememberedJob?.id === serverJob.id ? rememberedJob?.ideaId : undefined) });
        else if (rememberedJob) setActiveJob(rememberedJob);
        setScreen(session.context.confirmed ? 'studio' : 'review');
        setStatus(draftResult.draft ? 'Restored the saved review draft.' : 'Restored the private workspace.');
      } catch (error) {
        if (error instanceof ApiRequestError && [401, 404].includes(error.status)) {
          localStorage.removeItem('hacktor-session-id');
          setRestorationStatus(error.status === 401 ? 'Private access expired. Start a new workspace to continue.' : 'The saved workspace is no longer available.');
        } else setRestorationStatus('Could not reach the saved workspace. Refresh to try again.');
      }
    })();
  }, []);

  useEffect(() => {
    if (sessionId && selectedId) localStorage.setItem(`hacktor-selected-${sessionId}`, selectedId);
  }, [sessionId, selectedId]);

  useEffect(() => {
    if (sessionId) localStorage.setItem(`hacktor-stage-${sessionId}`, activeStage);
  }, [sessionId, activeStage]);

  useEffect(() => {
    if (!sessionId || !context || context.confirmed || screen !== 'review' || draftBlockedRef.current || draftConfirmingRef.current) return;
    if (JSON.stringify(context) === lastSavedDraftRef.current) return;
    setDraftSaveState('unsaved');
    const timer = setTimeout(() => void saveDraft(context), 600);
    return () => clearTimeout(timer);
  }, [context, screen, sessionId]);

  async function saveDraft(snapshot: SessionContext) {
    if (!sessionId || draftSavingRef.current || draftBlockedRef.current || draftConfirmingRef.current) return;
    const generation = draftGenerationRef.current;
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSavedDraftRef.current) return;
    draftSavingRef.current = true;
    setDraftSaveState('saving');
    let succeeded = false;
    try {
      const result = await api<{ draft: SessionContextDraft }>(`/sessions/${sessionId}/draft`, {
        method: 'PUT', headers: { 'if-match': String(draftRevisionRef.current) },
        body: JSON.stringify({ context: snapshot, base_context_revision: revision }),
      });
      if (generation !== draftGenerationRef.current) return;
      draftRevisionRef.current = result.draft.draft_revision;
      setDraftRevision(result.draft.draft_revision);
      lastSavedDraftRef.current = serialized;
      succeeded = true;
      setDraftSaveState(JSON.stringify(latestContextRef.current) === serialized ? 'saved' : 'unsaved');
    } catch (error) {
      if (generation !== draftGenerationRef.current) return;
      if (error instanceof ApiRequestError && error.status === 409) {
        draftBlockedRef.current = true;
        setDraftSaveState('conflict');
      } else setDraftSaveState('failed');
    } finally {
      draftSavingRef.current = false;
      const latest = latestContextRef.current;
      if (succeeded && generation === draftGenerationRef.current && latest && JSON.stringify(latest) !== serialized) void saveDraft(latest);
    }
  }

  async function resolveDraftConflict(choice: 'reload' | 'replace') {
    if (!sessionId || !context) return;
    const localContext = context;
    try {
      const result = await api<{ draft: SessionContextDraft | null }>(`/sessions/${sessionId}/draft`);
      draftRevisionRef.current = result.draft?.draft_revision || 0;
      setDraftRevision(draftRevisionRef.current);
      if (choice === 'reload') {
        const restored = result.draft?.context || context;
        lastSavedDraftRef.current = JSON.stringify(restored);
        setContext(restored);
        setDraftSaveState('saved');
      } else {
        lastSavedDraftRef.current = JSON.stringify(result.draft?.context || '');
        draftBlockedRef.current = false;
        await saveDraft(localContext);
      }
      draftBlockedRef.current = false;
    } catch { setDraftSaveState('failed'); }
  }

  useEffect(() => {
    if (!activeJob || !sessionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let checks = 0;
    localStorage.setItem(`hacktor-job-${sessionId}`, JSON.stringify(activeJob));
    const poll = async () => {
      try {
        const job = await api<JobView>(`/jobs/${activeJob.id}`);
        if (cancelled) return;
        setJobState(job);
        if (job.status === 'completed') {
          const ideasResult = await api<{ ideas: IdeaView[]; edges: EdgeView[] }>(`/sessions/${sessionId}/ideas`);
          const sessionResult = await api<{ stages: StageView[] }>(`/sessions/${sessionId}`);
          const [historyResult, mapResult] = await Promise.all([
            api<{ blueprints: BlueprintSummary[] }>(`/sessions/${sessionId}/blueprints`),
            api<{ stage_status: string; opportunities: OpportunityHypothesis[] }>(`/sessions/${sessionId}/opportunities`),
          ]);
          if (cancelled) return;
          setIdeas(ideasResult.ideas);
          setEdges(ideasResult.edges);
          setSelectedId((current) => current || ideasResult.ideas[0]?.id || '');
          setStageStates(Object.fromEntries(sessionResult.stages.map((stage) => [stage.stage, stage.status])));
          setBlueprintHistory(historyResult.blueprints);
          setOpportunities(mapResult.opportunities);
          setMapStatus(mapResult.stage_status);
          setActiveServerJobs((current) => current.filter((item) => item.id !== activeJob.id));
          if (activeJob.kind === 'blueprint' && job.result?.artifact_ids?.[0]) {
            const id = job.result.artifact_ids[0];
            const blueprint = await api<BlueprintRecord>(`/blueprints/${id}`);
            if (cancelled) return;
            setBlueprintId(blueprint.id);
            setBlueprintIdeaId(blueprint.idea_version_id);
            setBlueprintText(blueprint.content_markdown);
            setActiveStage('blueprint');
            setMobileView('ideas');
          }
          setStatus(`${activeJob.kind === 'slate' ? 'Idea slate' : 'Blueprint'} completed. Content uses the deterministic test adapter.`);
          localStorage.removeItem(`hacktor-job-${sessionId}`);
          setActiveJob(null);
          return;
        }
        if (job.status === 'failed' || job.status === 'blocked_quota' || job.status === 'cancelled') {
          setActiveServerJobs((current) => current.filter((item) => item.id !== activeJob.id));
          setStatus(job.error?.message || `Job ${job.status}. Review the context and try again if safe.`);
          localStorage.removeItem(`hacktor-job-${sessionId}`);
          setActiveJob(null);
          return;
        }
        setStatus(`Job ${job.status.replaceAll('_', ' ')}${job.stage ? `: ${job.stage}` : ''}. You can refresh and return to this workspace.`);
      } catch {
        if (!cancelled) setStatus('Connection interrupted. Checking the existing job again; no new job was submitted.');
      }
      checks += 1;
      if (!cancelled) timer = setTimeout(() => void poll(), Math.min(1500 * Math.ceil(checks / 5), 15_000));
    };
    void poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [activeJob, sessionId]);

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
      draftGenerationRef.current += 1;
      draftRevisionRef.current = 0;
      lastSavedDraftRef.current = '';
      draftBlockedRef.current = false;
      setDraftRevision(0);
      setDraftSaveState('unsaved');
      setIdeas([]);
      setEdges([]);
      setSelectedId('');
      setBlueprintHistory([]);
      setOpportunities([]);
      setActiveJob(null);
      setSessionId(created.session_id);
      localStorage.setItem('hacktor-session-id', created.session_id);
      setRevision(created.context_revision);
      setContext(parsed);
      setOriginalIdea(mode === 'idea_first' ? input : '');
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
    draftConfirmingRef.current = true;
    draftGenerationRef.current += 1;
    setBusy(true);
    try {
      const confirmed = { ...context, confirmed: true };
      const result = await api<{ context_revision: number; context: SessionContext }>(`/sessions/${sessionId}/context`, {
        method: 'PATCH',
        headers: { 'if-match': String(revision) },
        body: JSON.stringify({ context: confirmed }),
      });
      setContext(result.context);
      lastSavedDraftRef.current = '';
      draftRevisionRef.current = 0;
      setDraftRevision(0);
      setDraftSaveState('idle');
      setRevision(result.context_revision);
      setScreen('studio');
      setStatus('Context confirmed. Generate a diverse slate when ready.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to confirm context.');
      try {
        const latest = await api<{ draft: SessionContextDraft | null }>(`/sessions/${sessionId}/draft`);
        draftRevisionRef.current = latest.draft?.draft_revision || 0;
        setDraftRevision(draftRevisionRef.current);
      } catch { /* Keep the local interpretation visible for recovery. */ }
    } finally {
      draftConfirmingRef.current = false;
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
    if (activeJob) return;
    setBusy(true);
    setStatus('Submitting the deterministic local slate job...');
    try {
      const key = crypto.randomUUID();
      const job = await api<{ job_id: string }>(`/sessions/${sessionId}/jobs`, {
        method: 'POST',
        headers: { 'idempotency-key': key },
        body: JSON.stringify({ job_type: 'diverse_slate', preferences: { count: 9 } }),
      });
      setActiveJob({ id: job.job_id, kind: 'slate' });
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
      const result = await api<{ critique?: Record<string, string[]>; idea_version_id?: string }>(`/ideas/${selected.id}/actions`, {
        method: 'POST',
        headers: { 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({ command, reason: 'Builder action from the Studio inspector.' }),
      });
      if (result.critique) setCritique(result.critique);
      await loadIdeas();
      if (result.idea_version_id) { setSelectedId(result.idea_version_id); setActiveStage('evolve'); }
      if (result.critique) setActiveStage('interrogate');
      await loadStages();
      setEvidence(await api<EvidenceView>(`/ideas/${selected.id}/evidence`));
      setStatus(`${command.replaceAll('_', ' ')} completed without changing the parent version.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Idea action failed.');
    } finally {
      setBusy(false);
    }
  }

  async function combineSelected() {
    if (!selected || !compared) return;
    setBusy(true);
    try {
      const result = await api<{ idea_version_id: string; parent_version_ids: string[] }>(`/ideas/${selected.id}/actions`, {
        method: 'POST',
        headers: { 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({ command: 'combine', other_parent_version_id: compared.id, reason: 'Builder combined two explicitly selected directions.' }),
      });
      await loadIdeas();
      setSelectedId(result.idea_version_id);
      setActiveStage('evolve');
      await loadStages();
      setStatus('Combined idea created with two parent edges.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Combine failed.');
    } finally {
      setBusy(false);
    }
  }

  async function createBlueprint() {
    if (!selected || activeJob) return;
    setBusy(true);
    try {
      const result = await api<{ job_id: string }>(`/ideas/${selected.id}/blueprints`, {
        method: 'POST',
        headers: { 'idempotency-key': crypto.randomUUID() },
        body: '{}',
      });
      setActiveJob({ id: result.job_id, kind: 'blueprint', ideaId: selected.id });
      setStatus('Blueprint job submitted for the selected immutable version.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Blueprint creation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function openBlueprint(id: string) {
    setBusy(true);
    try {
      const blueprint = await api<BlueprintRecord>(`/blueprints/${id}`);
      setBlueprintId(blueprint.id);
      setBlueprintIdeaId(blueprint.idea_version_id);
      setBlueprintText(blueprint.content_markdown);
      setSelectedId(blueprint.idea_version_id);
      setActiveStage('blueprint');
      setMobileView('ideas');
      setStatus('Reopened a stored blueprint for its exact idea version.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not reopen the blueprint.'); }
    finally { setBusy(false); }
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
          {sessionId && <div className="continuity-card"><strong>Continue {title}</strong><p>{context?.confirmed ? activeJob ? 'A job is still in progress.' : ideas.length ? 'Return to your ideas and stored artifacts.' : 'Context confirmed. Ready to explore.' : 'Your context review is unfinished.'}</p><button onClick={() => setScreen(context?.confirmed ? 'studio' : 'review')} type="button">Continue current workspace</button><small>Starting a new guest workspace replaces access to this one in this browser.</small></div>}
          {restorationStatus && <p className="status-line" role="status">{restorationStatus}</p>}
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
          {mode === 'idea_first' && <div className="original-panel"><strong>Original idea, preserved exactly</strong><p>{originalIdea}</p></div>}
          <div className="review-grid">
            <label>Working summary<textarea rows={8} value={context.summary} onChange={(event) => setContext({ ...context, summary: event.target.value })} /></label>
            <div className="constraint-panel"><h2>Hard constraints</h2>{context.hard_constraints.length ? context.hard_constraints.map((item) => <p key={item.id}>{item.text}</p>) : <p>No hard constraints detected. Add them to the summary if needed.</p>}<h2>Unknowns</h2>{context.unknowns.map((item) => <p key={item}>{item}</p>)}</div>
          </div>
          <div className={`draft-indicator ${draftSaveState}`} role="status" aria-live="polite"><strong>Working draft: {draftSaveState}</strong>{draftRevision > 0 && <span> Revision {draftRevision}</span>}{draftSaveState === 'failed' && <><p>Could not save. Your edits remain on this screen.</p><button onClick={() => void saveDraft(context)} type="button">Retry save</button></>}{draftSaveState === 'conflict' && <><p>Another tab saved a newer draft. Choose which work to keep.</p><button onClick={() => void resolveDraftConflict('reload')} type="button">Load saved draft</button><button onClick={() => void resolveDraftConflict('replace')} type="button">Replace saved draft with my edits</button></>}</div>
          <button disabled={busy} onClick={() => void confirmContext()} type="button">Confirm context and enter Studio</button>
          <p className="status-line" role="status">{status}</p>
        </section>
      )}

      {screen === 'studio' && (
        <section className={`studio-shell mobile-${mobileView}`}>
          <aside className="stage-rail" aria-label="Ideation stages"><p className="eyebrow">Workflow</p><ol>{stages.map((stage, index) => { const key = stage.toLowerCase(); const state = stageStates[key] || 'pending'; return <li className={state} key={stage}><button aria-current={activeStage === key ? 'step' : undefined} onClick={() => setActiveStage(key)} type="button"><span>{String(index + 1).padStart(2, '0')}</span><strong>{stage}</strong><small>{state}</small></button></li>; })}</ol></aside>
          <nav className="mobile-studio-nav" aria-label="Studio panels"><button aria-current={mobileView === 'ideas' ? 'page' : undefined} onClick={() => setMobileView('ideas')} type="button">Explore ideas</button><button aria-current={mobileView === 'inspector' ? 'page' : undefined} onClick={() => setMobileView('inspector')} type="button">Inspect and act</button></nav>
          <section className="studio-canvas">
            <div className="canvas-header"><div><p className="eyebrow">{title} / {mode === 'idea_first' ? 'Idea first' : 'Hackathon first'}</p><h1>{stages.find((stage) => stage.toLowerCase() === activeStage)}<span className="stage-state">{stageStates[activeStage] || 'pending'}</span></h1></div><button disabled={busy || Boolean(activeJob)} onClick={() => void generate()} type="button">{activeJob ? 'Job in progress' : ideas.length ? 'Generate another slate' : 'Generate diverse slate'}</button></div>
            <p className="status-line" role="status">{status}</p>
            {activeJob && <div className="job-progress" role="status"><strong>{jobState?.status.replaceAll('_', ' ') || 'queued'}</strong><span>{jobState?.stage || 'Awaiting stage update'} {jobState?.progress.stage_index ? `${jobState.progress.stage_index} of ${jobState.progress.stage_count || 8}` : ''}</span></div>}
            {activeServerJobs.length > 1 && <div className="stage-detail"><h2>Unfinished jobs</h2>{activeServerJobs.map((job) => <button className="compare-link" key={job.id} onClick={() => setActiveJob({ id: job.id, kind: job.job_type === 'blueprint' ? 'blueprint' : 'slate', ideaId: job.idea_version_id || undefined })} type="button">Track {job.job_type.replaceAll('_', ' ')}: {job.status.replaceAll('_', ' ')}</button>)}</div>}
            {activeStage === 'understand' && context && <div className="stage-detail"><h2>Working context</h2>{mode === 'idea_first' && <p><strong>Original words:</strong> {originalIdea}</p>}<p>{context.summary}</p><h3>Hard constraints</h3>{context.hard_constraints.length ? context.hard_constraints.map((item) => <p key={item.id}>{item.text}</p>) : <p>None confirmed in the current context.</p>}<h3>Unknowns</h3>{context.unknowns.map((item) => <p key={item}>{item}</p>)}</div>}
            {activeStage === 'map' && <div className="stage-detail"><h2>Opportunity map</h2><p>Stage status: {mapStatus}. These stored entries are unverified hypotheses derived from the workspace. No organizer rules or external sources were checked.</p>{opportunities.length ? <div className="opportunity-grid">{opportunities.map((item) => <article className="opportunity-card" key={item.id}><small>Unverified hypothesis</small><h3>{item.problem}</h3><p><strong>Potential beneficiary:</strong> {item.beneficiary || 'Not recorded'}</p><p><strong>Working assumption:</strong> {item.assumption || 'Not recorded'}</p><p><strong>Suspected bottleneck:</strong> Not separately recorded.</p><p><strong>Source evidence:</strong> {item.evidence_refs.length ? `${item.evidence_refs.length} references need verification.` : 'No verified references.'}</p><p><strong>Unknown:</strong> Whether this problem and mechanism occur in the target setting.</p></article>)}</div> : <p>No opportunity hypotheses are stored yet. A deterministic local slate can create working hypotheses; unavailable generation leaves this stage empty.</p>}<p>Stable hypothesis identifiers are retained, but idea cards are not yet linked to them.</p></div>}
            {activeStage === 'research' && <div className="stage-detail"><h2>Research coverage</h2><p>Automated sources are disabled. Claim records below are hypotheses or builder supplied observations until independently verified.</p>{evidence?.claims.length ? evidence.claims.map((claim) => <div className="evidence-claim" key={claim.id}><strong>{claim.claim_type} / {claim.verification_status}</strong><p>{claim.claim}</p></div>) : <p>No source backed claims are attached to this version.</p>}</div>}
            {activeStage === 'blueprint' && <div className="stage-detail"><h2>Blueprint review</h2><p>Selected idea: {selected?.card.name || 'None'}, version {selected?.id.slice(0, 8) || 'none'}. Each artifact belongs to this exact immutable version.</p><h3>Stored blueprint history</h3>{selectedBlueprints.length ? <ul className="blueprint-history">{selectedBlueprints.map((item) => <li key={item.id}><button aria-current={blueprintId === item.id ? 'true' : undefined} onClick={() => void openBlueprint(item.id)} type="button">Blueprint {item.id.slice(0, 8)} / version {item.version} / {item.created_at}</button></li>)}</ul> : <p>No stored blueprint exists for this version. Create one using the selected version in the inspector.</p>}{blueprintText && blueprintIdeaId === selected?.id && <><div className="blueprint-toolbar"><span>Opened artifact {blueprintId.slice(0, 8)}</span><button onClick={() => setActiveStage('diverge')} type="button">Return to selected idea</button><a href={`/api/v1/blueprints/${blueprintId}/export.md`}>Export Markdown blueprint</a></div><BlueprintDocument markdown={blueprintText} /></>}</div>}
            {activeStage === 'interrogate' && <div className="stage-detail"><h2>Interrogate the selected version</h2><p>Challenge records weaknesses and assumptions without editing the version.</p>{critique ? Object.entries(critique).map(([key, values]) => <div key={key}><strong>{key.replaceAll('_', ' ')}</strong>{values.map((value) => <p key={value}>{value}</p>)}</div>) : <p>Choose Challenge in the inspector to record a critique.</p>}</div>}
            {activeStage === 'converge' && <div className="stage-detail"><h2>Compare two chosen directions</h2><p>Choose a second version in the inspector. Comparison uses stored card text, not an originality score.</p>{selected && compared && <div className="comparison-grid">{[selected, compared].map((idea) => <article key={idea.id}><h3>{idea.card.name}</h3><p><strong>Beneficiary:</strong> {idea.card.target_user}</p><p><strong>Problem:</strong> {idea.card.problem}</p><p><strong>Mechanism:</strong> {idea.card.mechanism}</p><p><strong>Demo:</strong> {idea.card.demo_moment}</p><p><strong>Dependencies:</strong> {idea.card.dependencies?.join(', ') || 'Not specified'}</p><p><strong>Unknowns:</strong> {idea.card.unknowns?.join(', ') || 'Not specified'}</p></article>)}</div>}</div>}
            {!ideas.length ? <div className="empty-canvas"><span>09</span><h2>Nine strategies are ready.</h2><p>Confirming context does not generate anything. Start the deterministic local run when you are ready.</p></div> : (
              <div className="idea-grid" role="list" aria-label="Generated ideas">{ideas.map((idea) => <button className={selected?.id === idea.id ? 'idea-card selected' : 'idea-card'} key={idea.id} onClick={() => { setSelectedId(idea.id); setCritique(null); setMobileView('inspector'); }} role="listitem" type="button"><small>{idea.strategy.replaceAll('_', ' ')} {idea.pinned ? '/ pinned' : ''}</small><strong>{idea.card.name}</strong><span>{idea.card.one_liner}</span><em>{idea.visibility}</em></button>)}</div>
            )}
            {edges.length > 0 && <details className="lineage" open={activeStage === 'evolve'}><summary>Immutable lineage ({edges.length} edges)</summary><ul>{edges.map((edge) => <li key={`${edge.child_version_id}:${edge.parent_version_id}`}>{ideas.find((idea) => idea.id === edge.parent_version_id)?.card.name || 'Original version'} to {ideas.find((idea) => idea.id === edge.child_version_id)?.card.name || 'Child version'} ({edge.edge_kind})</li>)}</ul></details>}
          </section>
          <aside className="inspector">
            <p className="eyebrow">Selected version</p>
            {selected ? <>
              <h2>{selected.card.name}</h2>
              <p>{selected.card.problem}</p>
              <dl><dt>Beneficiary</dt><dd>{selected.card.target_user}</dd><dt>Mechanism</dt><dd>{selected.card.mechanism}</dd><dt>Why this direction</dt><dd>{selected.card.underexplored_insight}</dd><dt>Demo moment</dt><dd>{selected.card.demo_moment}</dd><dt>Evidence</dt><dd>{evidence?.coverage || selected.card.evidence_status}. {evidence?.claims.length ? `${evidence.claims.length} claim records.` : 'No external sources attached.'}</dd><dt>Version</dt><dd>{selected.id.slice(0, 8)} (immutable)</dd></dl>
              <label className="compare-picker">Second version for comparison or combination<select aria-label="Second idea" value={compared?.id || ''} onChange={(event) => setCompareId(event.target.value)}><option value="">Choose a distinct version</option>{ideas.filter((idea) => idea.id !== selected.id).map((idea) => <option key={idea.id} value={idea.id}>{idea.card.name} ({idea.strategy.replaceAll('_', ' ')})</option>)}</select></label>
              <div className="action-stack">{actionCommands.map((action) => <button disabled={busy || Boolean(activeJob)} key={action.command} onClick={() => void runAction(action.command)} type="button">{action.label}</button>)}<button disabled={busy || Boolean(activeJob) || !compared} onClick={() => void combineSelected()} type="button">Combine selected versions</button><button className="primary" disabled={busy || Boolean(activeJob)} onClick={() => void createBlueprint()} type="button">Create blueprint</button></div>
              <p className="action-note">Branching keeps the parent. Challenge records critique. Combining creates a child with two parents. Pin and reject change only workspace decisions.</p>
              {compared && <button className="compare-link" onClick={() => setActiveStage('converge')} type="button">Compare {selected.card.name} with {compared.card.name}</button>}
              {critique && <div className="critique"><h3>Critique</h3>{Object.entries(critique).map(([key, values]) => <div key={key}><strong>{key.replaceAll('_', ' ')}</strong>{values.map((value) => <p key={value}>{value}</p>)}</div>)}</div>}
              {blueprintId && blueprintIdeaId === selected.id && <button className="compare-link" onClick={() => setActiveStage('blueprint')} type="button">Review stored blueprint</button>}
            </> : <p>Select an idea to inspect it.</p>}
          </aside>
        </section>
      )}
    </main>
  );
}
