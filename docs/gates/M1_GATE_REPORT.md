# M1 gate report

## Recommendation

CONDITIONAL GO for review. Do not merge to `main` and do not begin M2.

The local M1 implementation is functional and reproducible. Live inference and automated research remain blocked because no approved model credential, spend budget, or source authorization was supplied. This is represented honestly in the product and stage records.

## Scope and isolation

- Branch: `feat/m1-deep-ideation`
- Baseline: `8f50765086a24d851bfaba8ed9a82bcaf049e19a`
- Remote deployment: not performed
- Cloudflare provisioning, DNS, routes, domains, and production data: unchanged
- Source connectors: disabled
- Merge to `main`: not performed

## Acceptance evidence

| Area | Result | Evidence |
| --- | --- | --- |
| Hackathon-first intake | PASS | Browser journey pastes a brief, reviews parsed user-provided context, confirms revision 1, and generates a local slate. |
| Idea-first intake | PASS | Browser and API journeys preserve the exact original text, including a line break, while context edits remain separate. |
| Private ownership | PASS | Opaque 32-byte capability, server-side SHA-256 hash, seven-day expiry, HttpOnly Secure SameSite Strict session cookie, CSRF cookie and header, owner-scoped SQL. Cross-owner read returned 404. Missing CSRF returned 403. |
| Optimistic concurrency | PASS | Confirmed context advanced revision 1 to 2. A stale `If-Match` returned 409. |
| Eight stages | PASS WITH BLOCKED CAPABILITIES | All canonical stage records are persisted. Unsupported research, convergence, and blueprint stages are marked blocked until the required builder or evidence operation occurs. |
| Nine strategies | PASS | Local job created 9 schema-valid Idea Cards across 9 unique strategies, problems, mechanisms, and target-user descriptions. Unit tests assert the differentiation axes. |
| Critique and evolution | PASS | Critique persisted separately and left the parent unchanged. Branch created one parent edge. Combine created exactly two parent edges. Pin and reject preserve versions and lineage. |
| Action idempotency | PASS | Replaying the same branch request with one key returned the same child version and left the idea count at 10 rather than 11. |
| Durable jobs | PASS | D1 jobs, outbox, five-minute dispatcher, Queue payload with only `job_id` and `schema_version`, bounded attempts, leases, structured failures, polling, active-job limit, and hourly limit implemented. |
| Inference adapters | PASS WITH LIVE BLOCKER | Deterministic adapter is labeled and records provider metadata. JSON inference adapter implements timeout, HTTP failure, JSON envelope checks, and typography normalization. Live credentials and budget are absent. |
| Evidence and validation | PASS WITH SOURCE BLOCKER | Claims distinguish fact and hypothesis. Local validation emits `insufficient_evidence`, zero source sample count, and review-required output. No source or originality percentage is invented. |
| Blueprint | PASS | Blueprint job produced Markdown bound to the exact selected idea version, disclosed evidence coverage, and normalized generated text. |
| Responsive and accessible UI | PASS | Playwright verified keyboard focus, touch operation, dark, light, and system themes, reduced-motion CSS, and 320px, 390px, 768px, and 1440px layouts. |
| No U+2014 | PASS | Repository scanner, provider normalization, API normalization, and export path enforce the rule. |

## Local runtime evidence

Recorded on 2026-10-26 in the local Cloudflare Worker and local D1 environment:

```text
hackathon_first: context_revision=2, job_status=completed, idea_count=9,
strategy_count=9, inference_mode=deterministic_test_adapter

idea_first: original_preserved=true, ideas_after_actions=11,
critique_risk_count=1, branch_parent_count=1, combine_parent_count=2,
pinned=true, blueprint_bound=true, export_has_evidence_disclosure=true

security_and_replay: idempotent_same_result=true, idea_count_after_replay=10,
csrf_denied_status=403, foreign_owner_denied_status=404,
stale_revision_status=409, blueprint_job_status=completed
```

No guest capability or CSRF token was recorded in this report.

## Automated checks

| Command | Result |
| --- | --- |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS, 7 files and 15 tests |
| `pnpm test:db` | PASS, 35 schema objects across 3 forward migrations |
| `pnpm contracts:check` | PASS |
| `pnpm security:secrets` | PASS |
| `pnpm typography:check` | PASS |
| `pnpm verify` | PASS, uninterrupted exit code 0 |
| `pnpm test:ui` | PASS, 4 tests across desktop, mobile 390px, mobile 320px, and tablet 768px in 51.3 seconds |
| Fresh clone `pnpm install --frozen-lockfile` | PASS, 86 packages from the committed lockfile |
| Fresh clone `pnpm verify` | PASS, exit code 0 from commit `796d8e2` |

GitHub Actions and draft pull request evidence are added after the reviewed branch is pushed.

## Visual evidence

- [Desktop Studio](../evidence/m1-desktop-studio.png)
- [Mobile Studio](../evidence/m1-mobile-studio.png)

The desktop capture shows the eight-stage rail, nine-card accessible constellation, selected-version inspector, action controls, and separate critique. The mobile capture shows the 390px touch layout and the same nine-card list without page-level horizontal overflow.

## Remaining blockers

1. Live inference requires an owner-approved provider credential, model, and spend budget.
2. Research validation cannot claim verified external evidence until at least one source connector receives recorded authorization and credentials.
3. Staging and production Cloudflare identifiers remain deliberate placeholders. No deployment is authorized.
4. Final merge requires explicit M1 gate approval.

## Gate decision rationale

The deterministic local product is suitable for code review and demonstrates the required private intake, ideation diversity, immutable evolution, durable persistence, validation disclosure, and blueprint flow. The milestone cannot receive an unconditional GO for live operation while provider and source access remain intentionally unavailable.
