# Historical project intelligence design

Status: research architecture only. No project collection, embeddings, migration, or similarity service is authorized.

## First-class project record

A historical project is a claimed submission with an event relationship supported by an approved source. Store its canonical platform ID and URL, title, event and challenge links, problem, intended beneficiary, core mechanism, operating setting, technologies and dependencies, public repository link if present, demo or submission evidence, observation and publication times, source visibility, source reliability, permission version, and retention deadline. Keep the verbatim permitted excerpt separate from model-derived interpretations. Winner or finalist status is an assertion with an exact organizer or platform result snapshot, never a field inferred from popularity or a GitHub badge.

| Fact | Evidence rule |
| --- | --- |
| Project submitted to event | Platform submission record or organizer results explicitly links both; repository topic alone is insufficient. |
| Track or challenge membership | Explicit track reference in a source snapshot, with uncertainty if names changed. |
| Code implements mechanism | Public repository link plus inspected README or code evidence; project description alone supports only a claimed mechanism. |
| Winner or finalist | Dated organizer or platform result identifying the project and category. |
| Technology use | Source-stated stack or observed dependency, tagged by evidence type and revision. |

## Normalization and entity resolution

1. Preserve every source observation and its external ID, URL, content hash, permission version, and observation time. Never overwrite a prior event or project snapshot.
2. Generate candidate identities from canonical URLs, platform IDs, repository URL normalization, event ID, title, team name when lawful, and dates. Names alone are weak signals.
3. Merge only after deterministic ID match or human-reviewed multi-signal evidence. Retain all source aliases, conflicting descriptions, and a reversible merge decision. A project submitted to multiple events remains one project with multiple sourced submission links when the same artifact is proven.
4. Keep a repository as a distinct entity. Its link to a submission can be `verified`, `candidate`, `rejected`, or `unknown`. A fork or template is not automatically the team's implementation.
5. Exclude private submissions, participant emails, and restricted team data unless a specific permission record permits their processing. Honor takedown across snapshots, embeddings, search results, and exports.

## Comparison against immutable ideas

Represent an idea version and each eligible project as separate facets: `problem`, `beneficiary`, `mechanism`, `technical_implementation`, and `operating_context`. Retrieval may use normalized terms and embeddings as candidate generation, but an explanation must cite observed evidence for each claimed overlap. Score each facet with a rubric and keep the raw evidence, assessor, model version if used, and uncertainty. A title match with different mechanism is a weak candidate. A shared mechanism solving the same problem for the same beneficiary is more substantive even when the descriptions use different words.

Report an evidence matrix rather than a novelty percentage:

| Field | Meaning |
| --- | --- |
| `observed_matches` | Exact project IDs, source snapshots, matched facets, differences, and assessor notes. |
| `query_coverage` | Approved corpora, platform counts, event and time windows, geographic filters, query variants, pagination reached, errors, and source freshness. |
| `unavailable_sources` | High-value platforms without permission or with failed access, plus the effect on interpretation. |
| `assessment_state` | `observed_overlap`, `weak_analogy`, `insufficient_evidence`, or `not_assessed`; never `unique`. |

The model may suggest candidates and hypotheses. A supported research claim requires an accessible, approved record and an exact `idea_versions.id`. The claim remains attached to that immutable version when a builder branches or combines ideas. A new version needs its own assessment or an explicit inherited-evidence review. Combine lineage retains both parents. A zero-result query means no match in the recorded search scope, not that the idea is original.

## Source-specific roles and biases

ETHGlobal's [showcase](https://ethglobal.com/showcase) can connect Web3 projects to events, and lablab.ai's [application gallery](https://lablab.ai/apps) exposes AI-specific problems, mechanisms, and technology combinations. These corpora can reveal repeated patterns that generic event indexes cannot, so both are high differentiation candidates if a licensed access route is obtained. Devfolio's [project guidance](https://guide.devfolio.co/docs/guide/Projects) describes event-linked submissions, while its [organizer CSV export](https://guide.devfolio.co/docs/guide/organizer-dashboard/projects-tab) suggests a narrow permissioned pilot. GitHub's [REST API](https://docs.github.com/en/rest/search/search) adds implementation evidence but cannot verify a submission on its own. [HackRep](https://zenodo.org/records/17572684) offers a large research sample; its collection method, licensing, repository link quality, and geographic bias must be examined before commercial use. No one corpus is a global denominator for originality.

## Validation fixtures

Prepare licensed or synthetic fixture pairs: same title with different mechanisms; different titles for the same problem and mechanism; forked repository mistaken for a new submission; one project entered twice; changed team or project name; falsely claimed prize; stale deleted project; inaccessible demo; organizer and aggregator date conflict; malicious prompt text in a README; and a true no-match with intentionally incomplete corpus. Measure candidate recall and precision with a human-labeled set, and count unsupported claims and mistaken event links separately.
