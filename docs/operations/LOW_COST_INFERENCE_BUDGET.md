# Low-cost M2A inference pilot budget

Status: owner approved a maximum $1 paid inference pilot on 2026-10-26. Actual paid spend remains $0 as of this ledger preflight. Published prices were rechecked on 2026-10-26 UTC in the [candidate registry](../ai/MODEL_CANDIDATE_REGISTRY.md). They are estimates, not account debits. Promotional credits count as paid exposure.

## Proposed limits

| Limit | Proposed ceiling |
| --- | ---: |
| Aggregate paid pilot hard stop | $1.00 |
| Per provider | $0.60 |
| Per exact model and upstream | $0.20 |
| Per synthetic brief across paid candidates | $0.20 |
| Per paid request reservation | $0.02 |
| Paid completion requests, including retries | 40 |
| Automatic retries after dispatched POST | 0 |
| Authorized paid requests before safeguards pass | 0 |

For an illustrative upper bound, 2,500 input and 6,000 output tokens at the most expensive screened Together rate of $0.30 and $1.20 per million would cost about $0.00795 before any extra reasoning or provider-specific charges. A $0.02 reservation per request gives room for uncertainty; 40 reservations total $0.80. This worksheet is not permission to send requests. If live prices or actual credit deductions exceed the reserved amount, stop and seek a new decision. Require an account balance snapshot before and after each bounded batch, with only amounts in reports. Never record credentials.

The local SQLite ledger in `evaluation/model-bakeoff/ledger.mjs` now uses an immediate transaction for each reservation. It records the request hash, pinned upstream, brief, prompt and schema versions, estimated and reserved costs, dispatch and billing evidence. A second active attempt is blocked. Reserved exposure is twice the catalog token estimate. Dispatched timeouts retain exposure and are never retried automatically. Reconciliation requires provider generation cost to match per-key usage movement within two microdollars. Billing conflicts, missing usage, unverified routes and catalog price increases stop subsequent paid calls. The ignored database is local and does not enter CI artifacts.

OpenRouter offers [generation metadata](https://openrouter.ai/docs/api/api-reference/generations/get-generation) and the documented [current-key usage endpoint](https://openrouter.ai/docs/api/api-reference/api-keys/get-current-key), and the owner's key returned both a valid usage counter and access to model catalogs. Together's authenticated model catalog is reachable, but no documented account balance or per-request actual-charge path has been verified. Together paid candidates remain excluded until this is resolved. Synthetic prompts avoid private user data; upstream privacy settings are not approved for production.

The pilot must use only six synthetic non-holdout briefs. The later 48-brief campaign needs a separate owner-approved ceiling, provider privacy decision, reviewer access plan and hard stop. Nothing here authorizes production inference.
