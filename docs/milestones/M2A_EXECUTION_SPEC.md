# M2A live ideation execution specification

Status: implementation-ready proposal for owner approval, dated 2026-10-26. No runtime work, credential, paid call or deployment is authorized. M1 accepted engineering baseline: `983b8410c1f8c4980790d7ea287c1294de0456e6`. M2A is independent of the accepted [M2B feasibility closure](../gates/M2B_PLANNING_ACCEPTANCE.md).

## Product and system boundary

Keep both hackathon-first and idea-first entry paths, all eight canonical stages, the nine strategies in `packages/ideation/src/index.ts`, immutable user-authored originals and idea versions, one-parent branches, two-parent combines, owner-scoped reads and writes, and version-bound blueprints. M1 deterministic mode remains explicitly labeled for tests. A live request must fail with a structured blocked or retry state when a real provider is unavailable. Source ingestion stays disabled; Research can analyze only builder-supplied, clearly labeled material or future separately approved records.

The existing `InferenceProvider.runStage` in `packages/providers/src/index.ts` is the seam. Its `JsonInferenceProvider` sends `{model,request}` to a generic endpoint; it is not an OpenAI, Anthropic or Google API adapter. The M1 consumer currently uses a single price per 1,000 combined tokens and estimates inputs from string length. M2A must add a vendor-specific wire adapter, official usage mapping, separate input and output pricing, preflight token caps, and atomic reservation accounting without weakening the existing Queue claim, lease fence, `generation_runs` uniqueness, or `usage_ledger` idempotency. The [provider decision sheet](../operations/M2A_PROVIDER_AND_BUDGET_DECISIONS.md) identifies candidate models and caps.

## Required boundaries and records

1. A versioned model registry maps `provider_id`, exact `model_id`, allowed API endpoint, structured-output capability, context and output caps, timeout, rate and price schedule version. Reject unknown model or schedule. Configuration chooses `disabled`, `deterministic`, or `live` explicitly. A live job cannot call the fixture adapter.
2. A prompt registry maps each stage to `prompt_version`, `output_schema_version`, allowed context fields, maximum input and output tokens, and error policy. Freeze the effective prompt hash, model, strategy-library hash and schema with each attempt. Follow [stage contracts](../ai/M2A_PROMPT_AND_STAGE_CONTRACTS.md).
3. Persist an invocation record before network dispatch with unique `(job_id,stage,attempt_index)` and an opaque invocation key. Record `reserved`, `dispatching`, `succeeded`, `failed_before_dispatch`, or `outcome_unknown`, provider request/response IDs when returned, hashes, timestamps, usage and price version. Do not log raw secrets or unrestricted private prompts. A response schema migration must preserve existing `/api/v1` snake_case envelopes.
4. Reserve the maximum input and output exposure atomically against stage, job, owner-day, campaign and project caps before dispatch. Count outstanding reservations. Settle from provider-reported usage, recording input, cached input if applicable, output and billed reasoning tokens separately. A stale or missing usage report leaves the reservation unresolved, not zero-cost.
5. Invoke with a bounded timeout. Retry only documented transient pre-dispatch failures or explicitly safe provider responses under the same attempt policy. A timeout after dispatch, lost response, or worker interruption becomes `outcome_unknown`; do not automatically send a second billable request until provider reconciliation or authorized manual resolution. Reclaiming a Queue lease must not replay the external call simply because stage persistence is absent.
6. Validate the complete provider envelope, refusal state, usage, strict output schema, strategy coverage, hard-constraint IDs, prohibited typography, and semantic guard checks before persistence. Treat schema-constrained provider output as a first layer, not a replacement for server validation. The transaction that writes stage artifacts, lineage, usage settlement and job progress must fence the active lease and abort on a zero-row guard. Duplicate delivery or a stale worker commits no artifacts.
7. Preserve every failed attempt and its budget exposure. Client responses use structured errors with retryability and reason codes such as `provider_unavailable`, `quota_blocked`, `output_invalid`, `constraint_violation`, `outcome_unknown`, and `lease_lost`. No error path returns deterministic examples as live output.

Propose a reviewed D1 migration for invocation attempts, versioned price schedules, atomic budget counters/reservations, and stage input/output hashes. Extend `generation_runs` and `usage_ledger` without rewriting M1 history. Do not create the migration under this documentation handoff. The API contract review must account for private owner scope, job polling, blocked states and cancellation before implementation.

## Eight-stage orchestration

| Stage | Executor and required input | Durable result and stop condition |
| --- | --- | --- |
| Understand | Model interprets a user-authored brief or original idea, builder capabilities, time, rules and unknowns. | Versioned interpretation; preserve original bytes. Stop on missing mandatory context. |
| Map | Model proposes distinct opportunity areas from the interpretation and confirmed challenge requirements. | Areas, participant groups and explicit hypotheses. Unverified rules stay labeled. |
| Diverge | Model generates one card for each canonical strategy, using hard constraints and the map. | Exactly nine schema-valid cards with substantive differences in problem, beneficiary or mechanism. Reject whole invalid slate before persistence. |
| Interrogate | Model critiques a selected immutable version against requirements, feasibility, data availability, judging and counterexamples. | Version-bound critique and proposed tests; no claim of verified research. |
| Evolve | Builder selects branch, challenge, refine, reject, pin, alternative space or combine; model may propose a child for permitted actions. | Parent(s) and child commit atomically. Original remains unchanged. Combine has exactly two parent edges. |
| Research | Evidence-dependent, with builder review. No automated source reads in M2A. | Claim ledger separating verified owner-supplied facts, hypotheses and unknowns. Block unsupported citation or novelty claim. |
| Converge | Builder selects candidates; model may compare selected versions, critiques, known criteria and evidence gaps. | Transparent comparison and decision rationale. Missing judging criteria or corpus coverage remain unknown. |
| Blueprint | Model composes an actionable MVP plan for the exact selected immutable idea version, then builder reviews. | Version-bound scope, architecture, tasks, demo, risks, assumptions and evidence limits. No invented dependency or dataset. |

The [prompt and stage contracts](../ai/M2A_PROMPT_AND_STAGE_CONTRACTS.md) define schemas and controls in detail. The product is a guided Studio, not a generic conversation transcript.

## Substantive differentiation gate

For every pair of cards, normalize and compare problem, beneficiary, causal mechanism, operating assumption and implementation path. Require a human-reviewable distinction in at least one causal dimension, and a slate-level spread across problems, mechanisms and beneficiaries. Reject a slate when its only differences are title, wording, cosmetic strategy label or UI shell. Reject generic dashboard or chatbot substitutions without a challenge-specific causal mechanism. Reject unbuildable concepts, unavailable datasets or dependencies, unsupported originality claims, mandatory-rule violations and polished descriptions without a demonstrable MVP. Automated semantic checks are screening signals; blinded human evaluation determines quality claims.

## Completion evidence after authorization

Implement in the [build sequence](M2A_BUILD_SEQUENCE.md). The gate requires mock endpoint contract tests, budget and concurrency faults, failure-state API tests, both Studio entry paths, immutable lineage regression, no U+2014 scan, clean CI, and the owner-approved [48-brief evaluation](../ai/M2A_EVALUATION_READINESS.md). A mock endpoint proves plumbing only. The owner must separately approve a provider, privacy policy, caps, paid evaluation and any later deployment.
