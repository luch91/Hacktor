# M2A evaluation preregistration and readiness

Status: protocol proposed for owner approval before any model output or reviewer score is viewed. This document audits definitions in [MODEL_EVALUATION_PLAN.md](MODEL_EVALUATION_PLAN.md) and preserves every proposed numeric threshold in [M2_ACCEPTANCE_CRITERIA.md](../milestones/M2_ACCEPTANCE_CRITERIA.md). It reports no evaluation results.

## Freeze manifest and sampling

Pre-register 48 previously unseen, permissioned briefs from at least eight domains, with domain, entry path, hard-constraint IDs, expected available inputs and SHA-256 hashes. Freeze one exact provider model ID, generation settings, Hacktor prompt versions, generic baseline prompt, schema versions, model price schedule, attempt policy, randomized arm order, reviewer packet generator and analysis code hash. Neither arm sees the other's output. Both arms receive the same brief and authorized facts and have comparable total token and time reservations. The baseline requests nine ideas without Hacktor's named strategy instructions. Do not use the M2B public sample fixtures as licensed research evidence or as holdout quality results.

Use one primary attempt per arm per brief, with at most one bounded retry under the same predeclared eligibility rule. There are 96 first attempts and up to 96 retries, or 192 billable slate attempts at maximum exposure. Record failures, timeouts, refusals, invalid outputs, retries, actual tokens, latency and cost for both arms. Every assigned brief remains in the outcome denominator. A provider swap requires a new frozen campaign; no within-pair silent fallback.

## Reviewer packet and instructions

Three independent reviewers receive the same neutral slate format, randomized order and opaque arm labels. Strip provider, product, strategy labels, formatting signatures and marketing language while retaining concrete problem, beneficiary, mechanism, constraints, dependencies, MVP, demo and uncertainty. Reviewers cannot see paired arm identity or each other's scores before submission. They score each slate 0 to 4 for problem originality, mechanism diversity, challenge relevance, feasibility, hard-constraint compliance, judging fit, demonstrability and assumptions. For each claimed high originality card they must name its distinct problem, beneficiary and mechanism. They flag near duplicates, generic dashboard/chatbot substitutions, unavailable datasets, invented dependencies, critical rule violations and unsupported research claims. Reviewers also choose Hacktor, baseline or tie for build potential and give a brief causal reason. Preserve all independent scores and later adjudication separately.

Reviewers assess problem originality relative to their knowledge and the provided brief, not global novelty. No unavailable historical corpus is silently treated as searched. Calibrate the rubric on examples outside the holdout set, then freeze anchors. Disclose reviewer conflicts, unavailable rubric items and inter-rater agreement. A reviewer may mark a field unassessable; the analysis script must retain that state and report its count, not impute a favorable score.

## Denominators and proposed pass rules

| Measure | Frozen unit, denominator and pass rule |
| --- | --- |
| First-attempt schema validity | Exactly 48 Hacktor first attempts. Pass at least 46 with nine parseable schema-valid cards covering all nine strategies. A missing card or refusal is invalid. |
| Final failure | Exactly 48 assigned Hacktor briefs. Pass at most two without a valid nine-card slate after the permitted retry. A budget block or unresolved external call is a failure. |
| Constraint IDs | Every accepted card must list all applicable mandatory IDs. A copied ID alone does not establish semantic compliance. |
| Critical constraint violations | Zero among accepted cards. A critical violation blocks acceptance and is counted in the failed attempt record. |
| Semantic constraint compliance | Denominator: every parseable generated card in every Hacktor attempt to which at least one mandatory constraint applies, including invalid slates and retries. Numerator: cards rated compliant with all applicable mandatory constraints under blinded review. Pass at least 99%. Missing cards remain schema failures and are reported separately, because their semantic content does not exist. Report numerator and denominator. |
| Meaningful originality | Exactly 48 assigned briefs. At least 34 must contain at least three Hacktor cards each rated 3 or 4 by at least two reviewers, with a reviewer-named distinct problem, beneficiary and mechanism. Rewording alone fails. A missing slate contributes zero qualifying cards. |
| Paired quality | Exactly 48 brief-level pairs. Average the three reviewer slate scores per dimension for each arm, then subtract baseline from Hacktor. Invalid or absent slate scores zero for the affected arm. Pass a mean advantage at least 0.5 on both mechanism diversity and challenge relevance and a positive lower bound on each 95% paired brief bootstrap interval. Report ties and per-domain values. |
| Blinded preference | Exactly 48 paired briefs, majority of three reviewers per brief. Invalid Hacktor slate is a loss; if both arms fail, count a tie and disclose both failures. Pass at least 32 Hacktor wins, at most eight ties and a two-sided Wilson 95% lower bound for wins divided by 48 above 0.50. At 32 wins the lower bound is approximately 0.525. |
| Evidence honesty | Audit every generated slate and export. Pass zero fabricated citations, unsupported originality percentages or unlabeled fixture outputs. |

Use 10,000 paired bootstrap resamples of briefs with a fixed recorded seed for each mean difference. Report the seed, interval method and raw paired outcomes. Both co-primary dimensions must pass; do not present a family-wise error claim from separate 95% intervals. The 32-win count is stricter than the Wilson condition alone. No threshold can be changed after observing holdout results. If data are missing, report the rule applied and an intention-to-evaluate result over all 48 briefs.

## Before the evaluation may run

The owner must approve the thresholds, corpus rights, exact model and provider privacy terms, prompts, maximum 192 attempt exposure, reviewer access, caps and credential channel. A mock endpoint may test pipeline mechanics but does not satisfy creativity, relevance or originality gates. A small separately approved live pilot uses non-holdout briefs and cannot tune on holdout outcomes. Freeze the manifest after pilot fixes and before campaign outputs. Publish aggregate results, all failures and costs, reviewer disagreement, domain strata and uncertainty intervals, with private briefs redacted or access controlled.
