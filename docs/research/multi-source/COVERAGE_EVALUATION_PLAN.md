# Coverage and quality evaluation plan

Status: proposed measurement protocol. No live corpus was collected, so this document reports no coverage percentages. Measurements must identify the source permission version, time window, geography, domain taxonomy, and review sample.

## Measurement unit and manifest

Create an immutable manifest per approved collection or search: source IDs and permission versions, declared scope, query hashes, cursor or page range, request and result counts, rate-limit observations, errors, observation times, canonical-entity count, inaccessible sources, and reviewer or model versions. Define the eligible universe from organizer-approved rosters or another explicitly scoped reference set. Do not use the number of web pages found as a global denominator.

| Indicator | Numerator / denominator | Method and reporting rule |
| --- | --- | --- |
| Geographic coverage | Eligible canonical events with a verified location or remote eligibility in region / all eligible canonical events in the declared reference set for that region. | Report country, region, remote status, unknown geography, and source mix separately. No worldwide rate without a worldwide reference set. |
| Domain coverage | Eligible events with a reviewed domain tag / eligible events in the declared set; also report count by domain. | Multi-label taxonomy, human audit of sampled tags, unknown bucket. |
| Independent event sourcing | Canonical events supported by at least two independently operated publishers / eligible canonical events. | Two aggregators repeating the same organizer record count as one underlying origin plus two observations, not two independent confirmations. |
| Official brief availability | Events with a current organizer-confirmed snapshot and revision date / eligible events. | Report missing rules, judging rubric, hard constraints, and deadline as separate field-completeness rates. |
| Historical project coverage | Authorized submission records linked to an eligible event / submissions in an organizer-approved roster for that event. | Report by source, event, year, region, project visibility, and unknown roster denominator. If no roster exists, report only observed counts. |
| Event deduplication precision | Correct proposed event merges / all reviewed proposed merges. | Stratified human-labeled pairs, including same-name distinct events and renamed recurring events. |
| Event deduplication recall | Correct same-event pairs merged / all labeled same-event pairs in the test set. | Separate candidate generation from merge decision. |
| Freshness | Records within source-specific approved freshness interval / all active records with a valid observation time. | Publish interval, median and p95 age, and stale-record rate by source. |
| Provenance validity | Audited verified claims with accessible approved source snapshot, field path, attribution, and idea version / all audited verified claims. | Sample all high-impact claims and a random sample of others; publish sampling frame and failures. |
| Comparable-project retrieval precision at 10 | Human-rated substantively relevant matches among top 10 / all reviewed top-10 matches. | Rate problem, beneficiary, mechanism, technical and context overlap separately. |
| Comparable-project retrieval recall at 10 | Known relevant projects retrieved in top 10 / all relevant projects in a licensed labeled set. | State corpus limit; do not extrapolate to unseen platforms. |
| Unsupported-claim rate | Claims lacking evidence sufficient for displayed status / all audited research claims. | Count fabricated citation, invalid award, overclaimed coverage, and unsupported originality separately. |
| API error and cost | Failed authorized requests / all authorized requests; settled USD and requests / accepted normalized record. | Break out 401, 403, 429, timeout, schema drift, retries, and source fees. Unknown fees remain unknown. |
| Permission compliance | Collections with valid permission, purpose, scope, rate and retention at request time / all attempted collections. | Target 100%; a failed preflight is logged but performs no external read. |

Each metric reports `numerator`, `denominator`, percentage when defined, source and period, missing-data count, and a suitable uncertainty interval for sampled review. Zero observations with no eligible reference set produce `not_measurable`, not 0% or 100% coverage.

## Proposed acceptance targets for owner review

For a first authorized pilot, propose 100% permission compliance and provenance validity for claims labeled verified, zero fabricated citations or unsupported originality percentages, at least 95% precision and 90% recall on a human-labeled event deduplication set, and at least 80% precision at 10 for comparable-project candidates in the licensed pilot corpus. Report recall at 10 with its interval before choosing a target, because achievable recall depends on corpus rights and labeled set size. These are planning thresholds, not test results or a claim of global coverage. No source-specific geographic or project count target is proposed until a reference roster is available.

## Fixtures and audit procedure

Use synthetic and authorized records to cover: two aggregators linking the same organizer event; annual events with the same name; wrong or stale deadline; online event excluded by city filter; organizer rule revision; one project submitted to two events; GitHub fork mistaken for submission; false award label; deleted project; 429 without retry header; partial pagination; prompt injection in description; and a corpus with known missing projects. Reviewers label event identity and substantive project overlap independently. Hold out a test set from rule tuning. Re-run after every connector contract or normalization change. Publish confusion matrices, per-source errors, exclusions, and source suspension outcomes.

Freshness, retention and revocation tests must include caches, embeddings, exports, and backups. A connector stopped for expired permission must make zero external requests; research based on its records becomes stale or unavailable according to the approved retention rule. The ingestion Worker remains disabled until a separate implementation and source activation decision.
