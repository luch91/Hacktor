# M2 implementation proposal

Status: proposal for owner approval. No M2 implementation, deployment, connector activation, or paid inference is authorized by this document.

## Refined package boundaries and independent gates

M2A covers live inference through the existing provider abstraction and blinded idea-quality evaluation. It has its own acceptance gate in [M2_ACCEPTANCE_CRITERIA.md](M2_ACCEPTANCE_CRITERIA.md). Research at this gate uses only builder-provided or otherwise authorized static material; automated connectors are unnecessary for M2A acceptance.

M2B covers individually approved research sources, coverage-aware comparable-project assessment, attributed records, and version-bound research exports. It has a separate acceptance gate. M2A acceptance does not activate sources or authorize M2B. Both gates preserve the exact accepted M1 commit `983b8410c1f8c4980790d7ea287c1294de0456e6` as the regression baseline.

The order below is a proposal after owner approval, with steps 1 to 3 assigned to M2A and steps 4 to 5 assigned to M2B. Step 6 applies separately at each package gate. The evaluation corpus target is 48 unseen briefs across at least eight domains, as specified in the revised evaluation plan.

## Branch and merge recommendation

Keep PR #1 draft and unmerged for this planning review. After separate owner approval to merge it, preserve the accepted M1 SHA with an immutable acceptance tag, record the merge SHA, and branch `feat/m2a-live-ideation` from the reviewed `main`. Give M2A its own draft PR and gate. Branch `feat/m2b-research` from a reviewed `main` baseline with its own PR, source approvals, and gate. If M2B depends on an M2A contract, merge that reviewed contract first or cherry-pick only its isolated commit and tests. Avoid stacking all M2B implementation on an unaccepted M2A branch. This paragraph recommends a strategy; it does not authorize a tag, branch, or merge now.

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
| 1 | Build prompt contracts and offline evaluation corpus for M2A | At least 48 unfamiliar briefs across eight domains, hard-constraint cases, and blinded human rubric in [model evaluation plan](../ai/MODEL_EVALUATION_PLAN.md). |
| 2 | Implement live adapter and stage orchestration behind disabled feature flags | Mock endpoint, malformed response, timeout, 429, budget, retry, and no-fallback tests pass. Paid calls require a separate owner approval. |
| 3 | Run a bounded, separately approved M2A model evaluation and gate | Paired generic baseline and Hacktor outputs are blind-reviewed. Publish raw counts, uncertainty intervals, disagreements, cost, and failure cases. No creativity claim from wording alone. |
| 4 | Begin M2B with one individually approved connector or authorized corpus | Per-source approval record, contract fixture, attribution and retention checks, rate controls, kill switch, and source-specific tests pass before activation. Brabble is not a required first connector. |
| 5 | Implement evidence-aware comparison and blueprint updates | Exact source links, coverage states, version linkage, and unknowns survive retries and exports. |
| 6 | Run each package's local and CI gate, then request its separate review | Contract, security, migration, concurrency, accessibility, responsive UI, and package-specific evidence meet [M2 acceptance criteria](M2_ACCEPTANCE_CRITERIA.md). Any staging resource or deployment remains a separate approval. |

## Test and failure strategy

- Unit tests: prompt input shaping, hard constraints, strategy coverage, schema validation, source normalization, citation linkage, and U+2014 removal.
- Integration tests: mock provider success and failures; one approved-source mock at a time; rate-limit headers; retries; duplicate Queue delivery; lease loss during persistence; partial research coverage; invalid or stale records.
- End-to-end tests: both entry paths, nine strategy outputs, critique, branch and combine lineage, research disclosure, comparisons, and version-bound blueprint on desktop and compact widths.
- Evaluation: holdout briefs and blinded human review as specified in the evaluation plan. Record every failed generation and all model costs, not only successful examples.
- Failure states: credential absent, model unavailable, malformed output, hard-constraint violation, quota exhaustion, ambiguous paid invocation, source 401 or 429, changed source schema, stale organizer brief, prompt injection, and partially covered comparison. Each state must produce a structured, recoverable or explicitly blocked status without fixture substitution.

## Required owner decisions

Approve the M2 implementation scope and gate thresholds; choose the model provider and approved prompt-data policy; set per-job and aggregate token and dollar caps; authorize any paid evaluation calls; approve each source's access method, terms, attribution, retention, rate budget, and credentials; authorize staging resources or deployments separately; and later decide on merging PR #1. None of these decisions is implied by M1 local acceptance.
