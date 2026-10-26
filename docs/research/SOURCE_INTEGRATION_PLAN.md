# M2 source integration plan

Status: architecture and access proposal only. Every automated connector is disabled. No API key, external read, scraper, or production resource is authorized by this plan.

This is the M2B workstream with its own approval and acceptance gate. M2A live inference and idea evaluation do not depend on activating these connectors.

## Brabble source coverage and contract risk, checked 2026-10-26

[Brabble's developer page](https://brabble.ai/developers) describes an index of open student competitions and hackathons, primarily in India, served from an hourly snapshot. The [API reference](https://brabble.ai/docs) exposes `GET /api/listings` with 12 city filter values: Delhi NCR, Indore, Hyderabad, Pune, Ahmedabad, Bhopal, Bengaluru, Mumbai, Chennai, Kolkata, Jaipur, and Lucknow. That city filter excludes online listings. An unfiltered feed may include online events or events on global platforms, but neither a worldwide geographic inventory nor historic project coverage can be inferred. The API returns open listings with future deadlines, so it is suitable for discovery leads, not a historical originality corpus. Organizer pages remain authoritative for rules and dates.

The published pages disagree in ways that affect a client contract. The [API reference](https://brabble.ai/docs) says a key is required, invalid `limit` falls back to 50, `offset` is clamped at 10000, and 429 does not guarantee `Retry-After`. The [developer guide](https://brabble.ai/developers) says invalid `limit` returns 400, permits a larger `offset` ceiling, and describes retry headers. The [FAQ](https://brabble.ai/faq) says the JSON API needs no key. Treat these as unresolved documentation discrepancies. Before any authorized connector implementation, confirm the current machine-readable spec and terms with the provider, obtain an approved key if required, and run a bounded contract test in the approved environment. Record actual pagination, error, retry, attribution, coverage, and rate behavior. No live API request or connector activation was performed for this planning update.

## Permission gate for each source

Before writing an active connector, record the source owner, authorized access method, current terms and license, allowed fields and reuse, attribution text, refresh cadence, rate and daily request ceilings, credential owner and storage, retention and deletion policy, expected coverage, and a kill switch. Record the approval date and reviewer in `source_connectors`. A public page is not permission for automated collection. If any item is unresolved, keep that connector disabled and mark its coverage unavailable.

The ingestion Worker remains inert by default. A connector must use an allowlisted host and documented API or approved feed. Validate response schema and URL targets, obey cache and rate headers, bound pages and bytes, sanitize hostile text, and never follow instructions embedded in source content. Use staging fixtures before any authorized live call. A 401, 403, changed schema, or disputed access basis pauses that connector.

## Proposed sources and dependencies

| Source | Proposed role | Access dependency | Current planning state |
| --- | --- | --- | --- |
| Brabble | Discover open hackathons and link builders to organizer pages. | Owner-held API key, current contract verification, required attribution, cache and rate policy. [Brabble API reference](https://brabble.ai/docs) describes `GET /api/listings`, key authentication, `refreshedAt`, and attribution. Its [developer page](https://brabble.ai/developers) and reference currently differ on some pagination and 429 details, so verify live documentation and contract fixtures immediately before implementation. | Disabled. Discovery listings do not prove official event rules. |
| GitHub | Search public comparable repositories and record observed overlap. | Approved GitHub App or other least-privilege credential, query policy, license and snippet policy, attribution, retention, and abuse-budget review. [GitHub REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) identify stricter search limits and rate headers; [repository endpoints](https://docs.github.com/en/rest/repos/repos) provide metadata. | Disabled. Repository similarity is a lead, not proof that a hackathon idea already exists. |
| Official organizer briefs | Capture rules, theme, technical requirements, judging criteria, deadlines, and source revision. | Organizer-owned URL or owner-supplied document with permission for the intended use, revision and expiry check, and human confirmation before applying hard constraints. | Manual user-provided information may remain labeled as such; automated fetching is disabled. |
| Lablab.ai historical projects | Compare against past submissions where permitted. | Verify whether an official API, export, license, or written access grant exists. Confirm attribution, allowed retention, and request budget. | Disabled, access method unverified. Do not scrape. |
| ETHGlobal historical projects | Compare against past submissions where permitted. | Verify official API or approved dataset and terms, reuse, attribution, and rate rules. | Disabled, access method unverified. Do not scrape. |
| Other sources | Add only after the same permission review. | Source-specific owner approval. | Out of scope until approved. |

Brabble is an aggregation source for discovery. Treat organizer pages as the authority for final participation rules and judging criteria. Store both links when appropriate and expose staleness rather than silently promoting an aggregator value to a verified organizer rule.

## Record and evidence model

Use the existing `source_connectors`, `source_records`, `event_snapshots`, `research_claims`, and `scorecards` tables as the starting schema. Any new migration needs contract review. Each proposed record should carry: connector ID, canonical URL, external ID, publisher, record kind, fetched time, source-published or updated time if provided, content hash, allowed excerpt or normalized fields, attribution requirement, permission record ID, and source status. Keep raw private content and credentials out of logs.

A research claim points to a specific idea version and a specific source record. Its status is one of observed and supported, hypothesis, stale, or source unavailable. Conflicting sources remain separate. A claim cannot become verified because a model summarized it. Exported blueprints include source manifests and coverage limitations. User-authored original ideas are never rewritten by research.

## Originality assessment

1. Extract the idea's problem, beneficiary, mechanism, setting, and technical dependencies without treating names as identity keys.
2. Search only approved, accessible project corpora with a bounded, logged query plan. Preserve the query, time, corpus version, result count, and errors.
3. Create candidate matches with exact source IDs. Compare problem and mechanism separately. Require a human-readable explanation of the overlap and differences before labeling a match.
4. Record the observed sample count, platforms covered, time range, and unavailable sources. A zero-result search with poor coverage means `insufficient_evidence`, not unique.
5. Present observed similarities, assessed relevance, hypotheses, and unknowns separately. Never fabricate citations, claim global novelty, or publish an unsupported originality percentage.

## Tests, failure modes, and activation gate

Contract fixtures should cover empty pages, duplicate listings, changed fields, missing attribution, noncanonical links, 401 and 403, 429 with and without retry information, 5xx, timeouts, stale organizer data, conflicting dates, malicious prompt text, and takedown or deletion requests. Integration tests must show that one failed connector does not erase prior evidence or claim verified coverage. Rate-limit tests must stop requests before the approved budget is exceeded.

Activation is per connector, not a global M2 switch. The owner must approve access, terms, attribution, retention, credential handling, rate ceiling, and allowed environment. A separate release approval is required before staging or production deployment. No Lablab.ai or ETHGlobal automated access is assumed in the M2 gate.
