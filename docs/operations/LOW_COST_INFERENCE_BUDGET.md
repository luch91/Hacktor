# Low-cost M2A inference pilot budget

Status: proposal for owner approval. Approved paid exposure: $0. Actual paid spend: $0. Published prices were checked on 2026-10-26 UTC in the [candidate registry](../ai/MODEL_CANDIDATE_REGISTRY.md). They are estimates, not account debits. Promotional credits count as paid exposure.

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
| Authorized paid requests before owner approval | 0 |

For an illustrative upper bound, 2,500 input and 6,000 output tokens at the most expensive screened Together rate of $0.30 and $1.20 per million would cost about $0.00795 before any extra reasoning or provider-specific charges. A $0.02 reservation per request gives room for uncertainty; 40 reservations total $0.80. This worksheet is not permission to send requests. If live prices or actual credit deductions exceed the reserved amount, stop and seek a new decision. Require an account balance snapshot before and after each bounded batch, with only amounts in reports. Never record credentials.

Before paid mode exists, implement a local ledger that atomically reserves the maximum estimated cost against all ceilings, records request ID, model, upstream, prompt version and quota, then reconciles with provider-reported usage and actual credit movement. Treat timeouts after dispatch as potentially billed. Do not automatically retry an unknown outcome; inspect a provider request record or reconcile balance first. Disable further calls when the ledger, balance or pricing is unavailable. Reasoning tokens count against output reserve unless a documented separate rate applies.

The pilot must use only six synthetic non-holdout briefs. The later 48-brief campaign needs a separate owner-approved ceiling, provider privacy decision, reviewer access plan and hard stop. Nothing here authorizes production inference.
