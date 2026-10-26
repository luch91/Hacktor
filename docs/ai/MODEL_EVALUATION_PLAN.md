# M2 model evaluation plan

Status: proposal. No paid model call is authorized. This plan evaluates idea quality rather than the fluency of descriptions.

This is the M2A evaluation only. M2B research coverage has a separate gate. The numeric thresholds proposed for owner approval are in [M2_ACCEPTANCE_CRITERIA.md](../milestones/M2_ACCEPTANCE_CRITERIA.md); they are not observed results.

## Questions and comparison

Primary question: does Hacktor's eight-stage, nine-strategy process produce more useful and substantively diverse hackathon concepts than a generic LLM request given the same brief, constraints, and time or token budget? Secondary questions cover constraint compliance, feasibility, judging fit, demonstrability, uncertainty disclosure, latency, failure rate, and cost.

Use the same approved model version for the Hacktor and generic-prompt arms where possible. A second model can be a sensitivity check only after approval. Freeze provider, model, prompt versions, temperature or sampling configuration, schemas, and cost assumptions before generating the holdout set. The generic prompt may ask for nine hackathon ideas but cannot see Hacktor's strategy definitions or outputs. Neither arm may use external research unless both receive the same approved records.

## Brief set

- At least 48 unfamiliar briefs from at least eight domains, such as climate, health, education, agriculture, accessibility, civic infrastructure, finance, and developer tools. Do not select briefs after seeing model results.
- Include organizer-style long briefs, sparse idea-first inputs, conflicting requirements, low-connectivity and privacy constraints, limited build time, and cases where source evidence is unavailable.
- Hold out evaluation briefs and any comparable-project labels from prompt tuning. Store a corpus version, brief hash, domain, source or author permission, and hard-constraint annotations.
- Remove private identifiers and confidential challenge material unless a separate prompt-data policy authorizes them.

## Generation protocol

1. Pre-register 48 briefs, their hard constraints, both prompts, one model version, the scoring rubric, exclusions, and analysis code before model output is seen. Run schema and budget preflight. Randomize arm order per brief, use independent session state, and record every attempted generation, including failures and retries.
2. Run each arm once under the approved budget. Permit at most one bounded retry under the same predeclared rule for both arms; include its cost and output. No manual repair counts as success.
3. Validate each card structurally. Record nine-strategy coverage for Hacktor, problem and mechanism diversity, hard-constraint IDs, and violations. Invalid output is a failure, not a manually repaired success.
4. Strip product labels, model labels, strategy names, and formatting cues from the review packet while preserving factual content. Randomize slate order. Retain stable hidden IDs for audit.
5. Keep deterministic fixtures out of the live evaluation. Mock endpoints validate plumbing only and never count as real-model quality evidence.

## Human rubric

At least three reviewers score each slate independently on a 0 to 4 anchored scale. A reviewer must identify the concrete problem, beneficiary, mechanism, and build demonstration before awarding a high score.

| Dimension | Low score | High score |
| --- | --- | --- |
| Problem originality | Repeats a familiar problem framing or shifts only wording. | Identifies a distinct neglected problem or causal bottleneck. |
| Mechanism diversity | Cards share the same underlying product operation. | Cards use genuinely different technical or social mechanisms. |
| Challenge relevance | Weak fit to the actual brief or beneficiary. | Direct fit to stated objective and participant context. |
| Technical feasibility | Requires unavailable data, unbounded scope, or implausible integration. | Build path is plausible within hackathon constraints. |
| Hard-constraint compliance | Violates a mandatory rule or ignores it. | Explains how the mechanism satisfies every mandatory rule. |
| Judging alignment | No credible connection to criteria or event rules. | Clear relevance to verified judging criteria, or uncertainty is disclosed if criteria are unavailable. |
| Demonstrability | Only a concept statement. | Specific observable before and after demo with attainable inputs. |
| Assumptions and uncertainty | Claims evidence or novelty without support. | Names key assumptions, tests, unknowns, and evidence gaps. |

Reviewers also choose the better slate per brief for overall build potential, can select a tie, and provide a short causal explanation. They flag near-duplicate ideas within a slate. A different title or writing style does not earn originality credit. Any claimed external match must be separately assessed under the [source plan](../research/SOURCE_INTEGRATION_PLAN.md).

## Analysis and decision

- Pre-register the primary paired comparisons: mechanism diversity and challenge relevance. Report per-brief differences, median and mean, a brief-level bootstrap interval, win/tie/loss counts, and reviewer disagreement. Briefs are the sampling unit, not individual cards.
- Use 10,000 resamples of the 48 paired briefs with a fixed recorded random seed for 95% percentile intervals. Report Wilson 95% intervals for wins among all assigned briefs; a failed Hacktor slate is a loss. Report ties separately and retain all assigned briefs in denominators.
- Apply the proposed thresholds without post-hoc changes: at least 46 of 48 valid first attempts, at most 2 of 48 final failures, zero critical accepted-card constraint violations, at least 99% semantic constraint compliance across all generated cards, 34 of 48 briefs with three meaningfully original Hacktor cards, paired mean advantages of 0.5 points with intervals above zero, at least 32 of 48 blinded wins, at most 8 ties, and a Wilson win lower bound above 0.50. Reviewers must name the distinct problem, mechanism, and beneficiary for originality credit.
- Report inter-rater agreement and adjudicate large disagreements without overwriting original scores. Break out results by domain and hard-constraint type; do not hide weak strata behind an aggregate.
- Report failure and invalid-output rates, critical constraint violations, hallucinated citations, latency, input and output tokens, and cost per accepted slate. Include all retries.
- Treat observed project overlap as corpus-dependent. Report corpus coverage, search method, reviewed matches, and unknowns. Do not call unmatched ideas original by default.
- A positive result requires the owner-approved criteria in [M2_ACCEPTANCE_CRITERIA.md](../milestones/M2_ACCEPTANCE_CRITERIA.md). If the paired interval includes no advantage, report inconclusive quality even when selected examples are strong.
- Publish all 48 paired outcomes, domain and constraint strata, disagreement, reviewer adjudications without replacing original scores, first-attempt schema validity, final failure rate, and actual input and output tokens. Keep reviewer hours and model spend separate. Do not interpret a small stratum or inaccessible historical corpus as proof of global originality.

## Safeguards and approvals

Reviewers must disclose conflicts and avoid viewing arm labels. The owner must approve model/provider, prompt-data use, reviewer access, corpus rights, numeric thresholds, sample size, and total spending before any paid evaluation. Archive redacted prompts, versions, scoring sheets, exclusions, and aggregate results for reproducibility. Keep raw private builder content out of public artifacts.
