# M2A implementation sequence and engineering gates

Status: proposed order after explicit owner authorization. No step is authorized by this planning document. Work from a reviewed mainline after the M1 merge decision in the [release and branch strategy](../operations/M2_RELEASE_AND_BRANCH_STRATEGY.md). Keep all live flags disabled and all source connectors off until separately approved.

| Step | Deliverable | Dependency and measurable exit |
| --- | --- | --- |
| 0. Owner gate | Approve M2A scope, primary/fallback provider, privacy policy, numeric budget and evaluation thresholds. | Record owner decisions in [decision sheet](../operations/M2A_PROVIDER_AND_BUDGET_DECISIONS.md). No credential or paid call before this gate. |
| 1. Freeze inputs | Versioned prompt and schema manifests, 48 unseen briefs from eight domains, generic control prompt, reviewer instructions and analysis script. | Brief and prompt hashes recorded before generation; permissions and hard constraints annotated; [evaluation readiness](../ai/M2A_EVALUATION_READINESS.md) signed off. |
| 2. Provider wire contract | Vendor-specific adapter behind existing `InferenceProvider`; explicit modes, model allowlist, strict structured output and usage mapping. | Mock endpoint records exact request, model ID and schema; success, refusal, 400, 401, 429, 5xx, timeout, malformed JSON and missing usage tests pass. No fixture fallback. |
| 3. Ledger and job recovery | Reviewed D1 migration for invocation attempts, price versions, atomic reservations and reconciliation. Preserve M1 Queue lease fence. | Duplicate delivery, stale worker, expired lease, response loss and concurrent reservation tests show one durable artifact set and no double settlement. Unknown external outcome blocks automatic paid replay. |
| 4. Stage orchestration | Understand, Map, Diverge and Interrogate prompts; builder-controlled Evolve; evidence-limited Research; Converge and Blueprint. | Nine strategy cards for three unrelated mock briefs, semantic differentiation screening, mandatory-rule checks, immutable lineage, version-bound blueprints and explicit blocked states. |
| 5. Studio integration | Both entry paths, stage progress and resumption, critique and builder actions, honest inference and evidence labels, dark/light/system and accessible compact layouts. | Desktop and mobile journeys pass; owner isolation, CSRF, rate, privacy and U+2014 checks remain active. |
| 6. Bounded live pilot | Only after separate credential and spending approval, run a small predeclared smoke set outside the holdout corpus. | Record real provider model IDs, usage, latency, cost, schema validity and faults. Mock results never count as real-model quality. |
| 7. Frozen 48-brief evaluation | Pair Hacktor with a generic baseline using the same approved model and comparable budget. | Three blinded reviewers, all attempts and failures, bootstrap and Wilson intervals, cost, latency and disagreement published. Apply preapproved thresholds without post-result changes. |
| 8. Engineering gate | Fresh locked install, `pnpm verify`, migration replay, full CI and four responsive journeys on exact review SHA. | Draft M2A PR with gate report, privacy/cost ledger evidence and owner review. No automatic merge, staging or production release. |

## Dependency rules

- M2A can reach its evaluation gate with builder-provided or authorized static briefs and no activated discovery or historical connector. M2B permission delays cannot silently change M2A quality claims.
- Any proposed schema or API change must preserve `/api/v1` snake_case envelopes and M1 immutable records. Backfills must be reversible in a local test and cannot erase provenance or reservations.
- Differentiation tests must inspect actual problems, beneficiaries, mechanisms and build paths. Nine strategy labels alone do not pass.
- Retry tests distinguish failures known to occur before dispatch from uncertain provider outcomes after dispatch. Maintain an exposure ledger even when a worker loses its lease.
- A fallback model requires explicit configuration, its own price schedule, the same privacy approval and a documented run-level decision. It must never silently replace the primary in a frozen evaluation pair.

The authorized implementation scope ends at a local engineering gate and reviewable draft PR. A separate owner decision controls PR merge, paid campaign, M2B connector work, Cloudflare resources and deployment.
