# M2 implementation proposal

Status: proposal for owner approval. No M2 implementation, deployment, connector activation, or paid inference is authorized by this document.

## Baseline and goal

M1 was accepted for local engineering at `983b8410c1f8c4980790d7ea287c1294de0456e6`. Keep that SHA as the comparison baseline. PR #1 stays draft and unmerged until separately approved. M2 should make the Deep Ideation Studio capable of real, challenge-specific generation and evidence-aware comparison while preserving its eight stages, nine strategies, owner scope, immutable idea versions, two-parent combines, and no U+2014 enforcement.

The M1 deterministic slate remains an explicitly labeled test adapter. It must never satisfy a live inference job. Source ingestion remains disabled until each connector passes its own access gate.

## Proposed architecture

1. Extend the existing `InferenceProvider` boundary in `packages/providers` with a provider-specific live adapter selected only by explicit environment configuration. Pin the provider, model identifier, prompt version, output schema version, and pricing schedule on each `generation_runs` record. Reject unknown versions and malformed output before persistence. The existing JSON adapter and Queue job envelope remain the integration seam.
2. Give Understand, Map, Diverge, and Interrogate distinct prompt contracts. Understand extracts the builder's objective and ambiguities; Map proposes opportunity areas; Diverge produces nine strategy-bound candidates; Interrogate attacks assumptions and feasibility. Evolve uses immutable action lineage, Research attaches approved evidence, Converge compares selected versions, and Blueprint composes a version-bound build plan. Human decisions remain explicit at the interaction stages.
3. Persist stage input and output hashes, model and prompt versions, token usage, estimated and settled cost, validation result, and error code with each run. Do not persist raw secrets or unrestricted private prompts in logs. Keep Queue delivery idempotent and lease-fenced. A live request with an uncertain external outcome stops for review instead of silently repeating a potentially billable call.
4. Add a source adapter boundary that maps approved external records into `source_connectors`, `source_records`, and event snapshots. Each record keeps source URL, publisher, fetch time, observed publication time when available, license or access basis, attribution text, content hash, and coverage limits. Research claims reference exact records and exact idea versions.
5. Build an originality assessment from explicit comparable-project observations. Candidate retrieval, match explanation, evidence coverage, and assessor judgment are separate fields. Display observed similarities and unknowns. Do not compute or display an originality percentage without a validated measurement method and separate approval.

### Stage contracts to design

| Stage | Input and expected output | Persistence rule |
| --- | --- | --- |
| Understand | Confirmed brief, builder constraints, and unresolved questions to a structured interpretation. | Keep user text unchanged; identify assumptions. |
| Map | Interpretation to distinct opportunity areas and affected participants. | Record opportunity hypotheses, not verified market facts. |
| Diverge | Opportunity areas, all nine strategy definitions, and hard constraints to nine validated Idea Cards. | Reject missing strategies, constraint IDs, or substantive diversity. |
| Interrogate | Selected immutable version to risks, counterexamples, and tests. | Store critique separately from the card. |
| Evolve | Explicit builder action and parent version IDs to a proposed child card. | Commit one or two parent edges atomically with the new version. |
| Research | Selected version and approved source records to attributed claims and gaps. | No automatic source access without connector approval; preserve source IDs. |
| Converge | Builder-selected versions, critique, evidence coverage, and judging criteria to a comparison. | Mark missing criteria or corpus coverage as unknown. |
| Blueprint | One exact idea version and its vetted evidence to a build plan and demo sequence. | Bind output to that version and retain evidence limits in export. |

Each model-backed stage needs its own versioned prompt, output schema, maximum tokens, failure policy, and adversarial tests. The planner must not turn a blocked human or evidence step into a fabricated completion.

## Implementation order after approval

| Order | Work | Dependency and exit condition |
| --- | --- | --- |
| 0 | Freeze M1 baseline and approve M2 scope, model, privacy policy, and cost caps | Owner decision recorded; no runtime changes before this gate. |
| 1 | Build prompt contracts and offline evaluation corpus | At least 24 unfamiliar briefs across several domains, hard-constraint cases, and blinded human rubric in [model evaluation plan](../ai/MODEL_EVALUATION_PLAN.md). |
| 2 | Implement live adapter and stage orchestration behind disabled feature flags | Mock endpoint, malformed response, timeout, 429, budget, retry, and no-fallback tests pass. Paid calls require a separate owner approval. |
| 3 | Run a bounded, approved model evaluation | Paired generic baseline and Hacktor outputs are blind-reviewed. Publish raw counts, disagreements, cost, and failure cases. No creativity claim from wording alone. |
| 4 | Implement one connector at a time, beginning with the least ambiguous approved access path | Per-source approval record, contract fixture, attribution and retention checks, rate controls, kill switch, and source-specific tests pass before activation. |
| 5 | Implement evidence-aware comparison and blueprint updates | Exact source links, coverage states, version linkage, and unknowns survive retries and exports. |
| 6 | Run full local and isolated staging gates, then request release review | Contract, security, migration, concurrency, accessibility, responsive UI, evaluation, source, and spend evidence meet [M2 acceptance criteria](M2_ACCEPTANCE_CRITERIA.md). Deployment remains a separate approval. |

## Test and failure strategy

- Unit tests: prompt input shaping, hard constraints, strategy coverage, schema validation, source normalization, citation linkage, and U+2014 removal.
- Integration tests: mock provider success and failures; one approved-source mock at a time; rate-limit headers; retries; duplicate Queue delivery; lease loss during persistence; partial research coverage; invalid or stale records.
- End-to-end tests: both entry paths, nine strategy outputs, critique, branch and combine lineage, research disclosure, comparisons, and version-bound blueprint on desktop and compact widths.
- Evaluation: holdout briefs and blinded human review as specified in the evaluation plan. Record every failed generation and all model costs, not only successful examples.
- Failure states: credential absent, model unavailable, malformed output, hard-constraint violation, quota exhaustion, ambiguous paid invocation, source 401 or 429, changed source schema, stale organizer brief, prompt injection, and partially covered comparison. Each state must produce a structured, recoverable or explicitly blocked status without fixture substitution.

## Required owner decisions

Approve the M2 implementation scope and gate thresholds; choose the model provider and approved prompt-data policy; set per-job and aggregate token and dollar caps; authorize any paid evaluation calls; approve each source's access method, terms, attribution, retention, rate budget, and credentials; authorize staging resources or deployments separately; and later decide on merging PR #1. None of these decisions is implied by M1 local acceptance.
