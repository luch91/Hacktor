# Proposed M2 acceptance criteria

Status: proposed gate, subject to owner approval before M2 implementation. M1 local acceptance at `983b8410c1f8c4980790d7ea287c1294de0456e6` is the regression baseline. Passing this gate would support an M2 engineering review, not an automatic production release.

## Independent package gates and proposed numeric thresholds

M2A covers live inference and idea quality. M2B covers approved research intelligence. Each receives an independent review SHA, CI run, gate report, and owner decision. M2A does not require an active source connector. M2B does not inherit source permission from M2A. These thresholds require explicit owner approval before implementation or paid evaluation.

The M2A sample is 48 unseen briefs across at least eight domains, with nine cards per slate, three blinded reviewers, and the same approved model for the Hacktor and generic arms. Count every assigned brief and failed attempt. At most one bounded retry is permitted per arm.

| M2A measure | Proposed threshold | Counting rule |
| --- | --- | --- |
| First-attempt schema validity | At least 46 of 48 Hacktor first attempts yield a structurally valid nine-card slate with all nine strategies. | No manual repair or retry credit. |
| Final failure rate | At most 2 of 48 Hacktor briefs lack a valid slate after the permitted retry. | Timeout, malformed output, missing strategy, and budget block count as failures. |
| Hard constraints | Every accepted card carries every applicable hard-constraint ID; zero critical semantic violations among accepted cards; at least 99% of all generated cards pass blinded semantic review. | Invalid attempts remain in the denominator. |
| Meaningful originality | At least 34 of 48 briefs contain at least three Hacktor cards rated 3 or 4 on problem originality by two of three reviewers and differentiated by problem, mechanism, and beneficiary. | Wording, title, or strategy label alone does not qualify. |
| Paired quality | Mean Hacktor advantage of at least 0.5 point on each 0 to 4 scale for mechanism diversity and challenge relevance. | Each 95% brief-level bootstrap interval for paired mean difference has a lower bound above zero. |
| Blinded preference | Hacktor wins at least 32 of 48 paired briefs; ties at most 8. | Three-reviewer majority per brief; 95% Wilson lower bound for Hacktor wins among all 48 exceeds 0.50. Failed Hacktor slates count as losses. |
| Evidence honesty | Zero fabricated citations, unsupported originality percentages, or unlabeled deterministic fixtures. | Audit all evaluation claims and exports. |

The M2B gate requires 100% of active connectors to have dated owner approval for access, terms, attribution, retention, rate ceiling, credentials, and kill switch. Every verified research claim must link to an accessible approved record and exact idea version; zero fabricated or dangling citations are allowed. Every displayed source-backed claim must carry required attribution and observation time. Every comparison must state platform, geography, time range, query count, unavailable sources, and failures. All tested 401, 403, 429, timeout, schema drift, takedown, and partial-coverage cases must stop or degrade to an explicitly labeled state without promoting claims to verified. Brabble is discovery-only and is not mandatory for the M2B gate.

## Entry conditions

- Owner approves M2 scope, evaluation rubric and thresholds, provider choice, prompt-data policy, and maximum spending.
- Every connector proposed for activation has a separate recorded approval for access, terms, attribution, retention, rate limits, and credentials. Unapproved connectors remain disabled.
- Secrets are delivered through an approved secret channel and are absent from commits, logs, screenshots, fixtures, and exported content.

## Functional acceptance

| Area | Proposed pass condition | Evidence required |
| --- | --- | --- |
| Deep Ideation workflow | All eight canonical stages retain distinct state and appropriate builder controls. Research, Converge, and Blueprint do not claim completion without their required inputs. | API and UI journeys for both entry paths, stage transitions, interruption, and resume. |
| Live generation | A configured provider creates schema-valid, challenge-specific cards across all nine named strategies. Problems, mechanisms, beneficiaries, and demo paths show substantive differences. | Recorded prompt and model versions, redacted stage traces, automated structural checks, blinded human review. |
| Constraints | Every persisted card carries all hard-constraint IDs and passes a semantic compliance review. A violation blocks persistence and is counted as a failed generation. | Holdout briefs with conflicting, privacy, offline, accessibility, and technical constraints. |
| Mode honesty | Missing credentials, model, quota, or live configuration yield structured blocked errors. A live job never returns deterministic test cards. | Negative integration tests and UI status assertions. |
| Immutable evolution | Parent cards stay byte-for-byte unchanged. Branches have one parent, combines have two, and repeat actions never duplicate versions or edges. | Database and race-condition regression tests. |
| Research | Every verified claim links to an approved, accessible record and carries observation time and source coverage. Unknown and unverified claims remain labeled. | Source contract tests, claim audit, invalid citation and stale-source tests. |
| Originality assessment | Results explain observed overlap and research coverage without unsupported novelty percentages or fabricated citations. A low-coverage search cannot imply that no similar project exists. | Human audit of matched and unmatched examples, source manifests, exports. |
| Blueprint | Every blueprint names its immutable idea version, MVP scope, implementation steps, risks, assumptions, demo plan, and evidence limits. | Version-link tests and review of exported Markdown. |
| Security and cost | Owner isolation, CSRF, idempotency, lease fencing, spending caps, rate handling, logging redaction, source kill switches, and no U+2014 enforcement remain active. | Full security suite, budget stress tests, secret scan, typography scan, and rollback drills. |

## Proposed quality evaluation gate

Use at least 48 previously unseen briefs from at least eight domains, including short, ambiguous, and technically constrained briefs. Compare Hacktor and a generic LLM baseline under the same input information and predeclared budget. At least three blinded reviewers score each paired slate with the rubric in [MODEL_EVALUATION_PLAN.md](../ai/MODEL_EVALUATION_PLAN.md). Publish the full distribution, not only an average.

Before execution, the owner must approve the numeric M2A thresholds above. If either paired interval includes no advantage, the quality claim is not accepted even if examples look polished.

These are proposed gates, not results or promises. The evaluation must report reviewer disagreement, exclusions, all failed model attempts, provider latency, and actual token and dollar usage. It must not treat title or wording differences as evidence of originality.

## Engineering and release gates

1. A fresh locked install passes build, strict TypeScript, migrations, unit, integration, contract drift, secret, no-em-dash, and responsive UI checks in GitHub Actions at the exact review SHA.
2. Mock-provider and mock-source suites cover 401, 403, 429, timeout, malformed JSON, schema drift, partial data, duplicate delivery, expired leases, and uncertain paid invocations.
3. Any authorized live test uses approved credentials and a recorded budget. The report separates mock results from paid live results.
4. The gate report lists every active source, its permission record, observation limits, and attribution. Disabled sources remain visibly disabled.
5. A staging or production release requires its own explicit owner approval after the engineering gate. No acceptance criterion here authorizes deployment, DNS changes, paid use, source activation, or a merge.
