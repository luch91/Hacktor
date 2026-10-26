# M2A model bake-off results

Status: compatibility screen only, 2026-10-26 UTC. The six-brief quality bake-off has not run. No paid request was made, no nine-card slate was accepted, and no reviewer scores exist. See the frozen [pilot protocol](MODEL_BAKEOFF_PROTOCOL.md) and [candidate registry](MODEL_CANDIDATE_REGISTRY.md).

| Attempt | Published price check | Observed result | Accepted | Usage and cost evidence |
| --- | --- | --- | --- | --- |
| OpenRouter `nvidia/nemotron-3-super-120b-a12b:free`, Nvidia upstream, synthetic Idea Card | Public model and Nvidia endpoint both $0 input and output, schema advertised | Completion returned HTTP 404, classified `model_unavailable` | No | No usage or debit returned; account balance not inspected |
| Together `Prism-ML/Ternary-Bonsai-27B`, synthetic Idea Card | Official model page $0; ID present in authenticated model catalog | Completion returned a JSON Idea Card passing local structure and lexical constraint checks | Yes, for this one-card compatibility screen only | 188 input tokens, 241 output tokens, 4,014 ms; provider cost absent; published price $0; generation ID `a50b916f0810970a-b82149d7` |
| OpenRouter `nvidia/nemotron-3.5-super-vl:free`, Nvidia upstream, synthetic Idea Card | Public model and Nvidia endpoint both $0 input and output, schema advertised | Completion ended with `finish_reason=length` at 900-token cap, classified `truncated_output` | No | Response rejected before usage accounting; account balance not inspected |

The one accepted response does not establish server-side schema enforcement, nine-strategy differentiation, originality, feasibility or production suitability. The raw synthetic response is stored under ignored `evaluation/model-bakeoff/output/` and is deliberately absent from source control. The local validator checks required fields and obvious prohibited phrases; a human must review actual compliance.

## Screen metrics

Three free completion attempts; one locally valid card; zero accepted slates; two failed card attempts; zero paid calls; zero actual provider charges verified. OpenRouter's failed attempts may consume free-request quota. The observed Together request shows account reachability. No paid model has account-backed availability evidence. Cost per accepted slate is undefined because no slate was attempted. Median and p95 latency across candidates are not meaningful with this sample. No quality ranking can be made.

## Pending

- Review the Together response blind for substantive relevance and constraints, then test a nine-card slate on a second synthetic brief within free quota.
- Investigate OpenRouter 404 through documented support or catalog changes and repeat a bounded free probe only if an exact currently free endpoint remains advertised. A higher output cap could resolve the truncation, but it has not been tested.
- Verify balances and usage accounting without exposing keys. Record provider debit before any cost-efficiency claim.
- Obtain a numeric paid pilot authorization before any paid model request. Keep the 48 formal evaluation briefs unused.
