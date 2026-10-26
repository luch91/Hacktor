# M2 cost and risk plan

Status: proposal only. No paid credential, spend budget, deployment, or source access is authorized.

## Budget model and controls

The owner must approve a provider price schedule, model version, per-stage token ceilings, per-job dollar ceiling, per-owner daily ceiling, evaluation campaign ceiling, and an absolute project ceiling before any live call. Store the approved schedule version with every run. Estimate maximum input and output cost before claiming a live job. Reserve its maximum expected amount before invocation, settle from provider-reported usage after a validated response, and alert on variance. Preserve the M1 usage ledger and lease fencing.

For a model with separate input and output rates, estimate `input_token_cap * input_rate + output_token_cap * output_rate` using the provider's billing units. Include expected retries in the campaign forecast. If the provider does not expose reliable usage, use the stricter preflight maximum until reconciliation. No stage may exceed the remaining job or aggregate cap. Price changes require a new schedule and owner review; this plan contains no current price assumption.

| Control | Proposed behavior |
| --- | --- |
| Mode gate | `disabled`, `deterministic`, and `live` remain explicit. Missing model, credential, approved cap, or price schedule blocks live processing. |
| Stage budget | Understand, Map, Diverge, and later model stages each have a maximum input size, output tokens, attempts, and timeout. Diverge receives a larger but bounded output budget. |
| Owner and project budgets | Atomic reservations enforce per-job, per-owner daily, and aggregate campaign caps. A dashboard reports reserved, settled, and unresolved exposure. |
| Ambiguous invocation | A timeout or worker interruption after dispatch can be billable. Mark it `outcome_unknown`, retain the reservation, and require reconciliation or owner review before retry. Never substitute deterministic cards. |
| Kill switch | Disable live jobs and every source connector independently without deleting immutable sessions or evidence. |
| Abuse limits | Preserve owner-scoped active and hourly limits, CSRF, idempotency, Queue bounds, lease fencing, and structured backoff. |

## Planning scenarios

Before implementation, produce a spreadsheet or reviewed calculation for a single job, a 24-brief paired evaluation, and a bounded pilot. Each scenario must list stage input and output caps, expected retry rate, unit prices, peak concurrent jobs, reserved maximum, expected settled cost, and the stop threshold. The evaluation plan must include failed and invalid outputs in the cost denominator. Owner approval applies to a numeric ceiling and expiry period, not merely to possession of a credential.

## Risk register

| Risk | Failure signal | Mitigation and test |
| --- | --- | --- |
| Runaway or duplicate billing | Reservations rise faster than completed jobs; repeated provider IDs. | Idempotent job claims, per-stage invocation IDs, hard caps, ledger reconciliation, stop on uncertain calls, duplicate-delivery tests. |
| Private brief leakage | Prompt or log includes personal or confidential material beyond policy. | Data minimization, redaction, least-privilege secret storage, retention limits, reviewer access control, log and export tests. |
| Provider outage or schema drift | Timeouts, 5xx, malformed JSON, invalid token usage. | Explicit blocked or retry state, bounded attempts, schema validation before persistence, circuit breaker, mock fault tests. |
| Constraint or safety failure | Card violates a mandatory rule or gives unsupported high-stakes advice. | Hard-constraint validation, human review for sensitive domains, fail closed, record the violation in evaluation. |
| Fabricated research | Citation lacks an approved source record or implies full coverage. | Source ID foreign keys, citation audits, coverage labels, export tests, no novelty percentage. |
| Source access or license breach | Terms change, key revoked, attribution missing, or takedown request. | Per-connector permission register, kill switch, bounded retention, attribution tests, prompt pause and deletion workflow. |
| Prompt injection in external records | Source text instructs the model to ignore rules or reveal secrets. | Treat sources as data, isolate system instructions, allowlist tools, strip executable content, adversarial fixture tests. |
| Security regression | Cross-owner read, CSRF bypass, leaked token, duplicate action. | Preserve M1 owner-scoped API, secret scan, lease and idempotency race tests, access reviews. |
| CI or staging drift | Local tests pass while environment differs. | Frozen lockfile, migration replay, explicit environment names, mock and authorized staging gates. |

## Review rhythm and owner approvals

Before any paid test, the owner approves provider and model, input-data policy, secret delivery method, prices, caps, campaign size, and kill-switch owner. Before any connector activation, the owner approves its source-specific access and retention record. Before any deployment, the owner separately approves Cloudflare resources and environment. A weekly pilot review should compare reserved and settled usage, failed generations, source requests, reviewer findings, and incidents against approved limits. Crossing a hard cap stops new work automatically and requires a new explicit approval.
