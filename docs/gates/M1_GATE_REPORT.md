# M1 gate report

## Recommendation

CONDITIONAL GO for review. Do not merge to `main` and do not begin M2.

## Final reliability gate, 2026-10-26

Action side effects, lineage edges, stage records, and idempotency completion now commit in one D1 batch. The final guarded idempotency update must affect one row. A database check constraint converts a zero-row update into a batch error and rolls back all preceding writes. New reservations use `INSERT OR IGNORE` so simultaneous first requests converge on one owner. A previously committed action with a missing response can still be reconstructed from its immutable action record.

Job stage writes and budget reservations now share a batch with a guarded lease update. The same check constraint rolls back cards, claims, runs, ledger entries, scorecards, or blueprints when the guard affects zero rows. Job failure and completion updates also require an unexpired lease. This relies on [Cloudflare D1 batch transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch), whose documented behavior is to execute statements sequentially and roll back the batch when one fails.

| Reliability check | Evidence |
| --- | --- |
| Action races | Dedicated SQLite integration tests expire a lease before commit, resume a slow combine executor after another acquires the lease, issue simultaneous reclaim requests, repeat a research request, and repair an action committed without its response. Counts remain one action, one claim, one child version, and exactly two combine edges where applicable. |
| Job races | Dedicated tests expire the lease between validation and persistence, run competing consumers, redeliver a completed Queue message, interrupt persistence, and recover blueprint creation. Stale batches write zero cards, claims, or blueprints. A valid retry creates one complete result. |
| Local gates | `pnpm verify` passed with 26 tests in 8 files, 36 schema objects across 5 migrations, TypeScript, contract drift, secret scan, build, and no U+2014 enforcement. |
| Responsive Studio | `HACKTOR_FRESH_SERVER=1 pnpm test:ui` passed all 4 desktop and mobile journeys against a newly built Worker and migrated local D1. |

These are local SQLite and local Worker race tests. No production resource was changed. Live-provider credentials and spending authorization remain separate owner decisions.

## Review remediation, 2026-10-26

The review findings at `d388002a329b4f15b4e952889e7dd68dd5e65b04` were addressed on the feature branch. The deterministic generator is explicitly a test adapter and derives its problems, mechanisms, beneficiaries, demo paths, and constraints from a challenge profile. Regression coverage uses unrelated climate, clinical care, and rural education briefs and compares problem, mechanism, and beneficiary sets across the slates. These are deterministic examples for local development, not live AI output or verified research.

The AI consumer now selects deterministic or live mode explicitly. The live mode calls the JSON inference provider, validates the nine-card result before persistence, tracks stage usage, reserves estimated per-stage token and dollar budgets, and blocks execution without a credential, model, and approved spending limits. A mocked HTTP endpoint exercised the live integration without a paid credential. Staging and production inference remain disabled in Wrangler configuration.

Jobs now use an atomic claim with a lease token, checkpoint stages in transactional D1 batches, and recover expired leases. A duplicate delivery cannot claim a completed job. Incomplete idea-action idempotency rows now retain an action ID for response reconstruction; expired uncommitted rows can be reclaimed. Legacy incomplete rows require review.

| Remediation check | Local result |
| --- | --- |
| `pnpm verify` | PASS, exit code 0. Formatting, lint, strict TypeScript, 19 tests in 7 files, 4 forward migrations, contract drift, secret scan, builds, and no U+2014 check passed. |
| Challenge briefs | PASS, three unrelated brief regressions; each slate has nine distinct problems and mechanisms and at least three beneficiaries. |
| Two recorded slates | PASS, [climate and medication safety deterministic slates](../evidence/m1-differentiated-slates.json) include all nine strategies and their actual problem, mechanism, and beneficiary text. These are local test output. |
| Queue recovery | PASS, tests cover competing claims, expired lease reclaim, duplicate delivery, and interruption before transactional card persistence. |
| Mock live provider | PASS, three recorded JSON provider stage runs and three usage reservations; no paid provider call. |
| Missing live authorization | PASS, job enters `blocked_quota` with zero persisted ideas. |
| Fresh local browser journeys | PASS, 4 Playwright tests across desktop, 390px mobile, 320px mobile, and 768px tablet using a newly built Worker and migrated local D1. The first run reused an old server and failed; the fresh-server rerun passed. |
| Clean clone | PASS, `pnpm install --frozen-lockfile` installed 86 packages from the committed lockfile; `pnpm verify` passed from the fresh clone of `75ca4e0`. |
| GitHub Actions | PASS for `75ca4e0fb227393e198ea7e1335a69628114299a`, including locked install, verification, Chromium setup, and responsive journeys. [Run 40295547550](https://github.com/luch91/Hacktor/actions/runs/40295547550). |
| Final code CI | PASS for `cdbd90ec07dd2f0844af46d8386e99a6c39219cd`, including locked install, `pnpm verify`, browser setup, and 4 responsive journeys. [Run 40296046757](https://github.com/luch91/Hacktor/actions/runs/40296046757). |

The current integration tests do not prove behavior against remote Cloudflare D1 or a paid model. A live invocation interrupted after its budget reservation is deliberately stopped for manual review because its external outcome cannot be inferred safely.

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
| GitHub Actions CI | PASS for SHA `aa0b7823122e10760331ee1035c472230ec62dd4`; locked install, M1 verification, Chromium install, and responsive journeys all succeeded. [Run 40287692944](https://github.com/luch91/Hacktor/actions/runs/40287692944) |

Draft pull request: [luch91/Hacktor#1](https://github.com/luch91/Hacktor/pull/1).

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
