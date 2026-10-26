# Proposed M2 acceptance criteria

Status: proposed gate, subject to owner approval before M2 implementation. M1 local acceptance at `983b8410c1f8c4980790d7ea287c1294de0456e6` is the regression baseline. Passing this gate would support an M2 engineering review, not an automatic production release.

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

Use at least 24 previously unseen briefs from at least six domains, including short, ambiguous, and technically constrained briefs. Compare Hacktor and a generic LLM baseline under the same input information and predeclared budget. At least three blinded reviewers score each paired slate with the rubric in [MODEL_EVALUATION_PLAN.md](../ai/MODEL_EVALUATION_PLAN.md). Publish the full distribution, not only an average.

Before execution, the owner must approve numeric thresholds. The proposed starting thresholds are: zero critical hard-constraint violations among accepted cards; zero fabricated sources or originality percentages; at least 90% valid nine-card slates before any manual repair; and a positive paired human preference for Hacktor on mechanism diversity and challenge relevance with a reported uncertainty interval. If the interval includes no advantage, the quality claim is not accepted even if examples look polished.

These are proposed gates, not results or promises. The evaluation must report reviewer disagreement, exclusions, all failed model attempts, provider latency, and actual token and dollar usage. It must not treat title or wording differences as evidence of originality.

## Engineering and release gates

1. A fresh locked install passes build, strict TypeScript, migrations, unit, integration, contract drift, secret, no-em-dash, and responsive UI checks in GitHub Actions at the exact review SHA.
2. Mock-provider and mock-source suites cover 401, 403, 429, timeout, malformed JSON, schema drift, partial data, duplicate delivery, expired leases, and uncertain paid invocations.
3. Any authorized live test uses approved credentials and a recorded budget. The report separates mock results from paid live results.
4. The gate report lists every active source, its permission record, observation limits, and attribution. Disabled sources remain visibly disabled.
5. A staging or production release requires its own explicit owner approval after the engineering gate. No acceptance criterion here authorizes deployment, DNS changes, paid use, source activation, or a merge.
