# M2A model bake-off results

Status: expanded free compatibility screen and stopped paid compatibility attempt, 2026-10-26 UTC. The six-brief paid quality bake-off has not run. One paid OpenRouter Qwen request was dispatched but its charge could not be reconciled. No paid output is accepted; no semantically accepted nine-card slate or independent reviewer score exists. See the frozen [pilot protocol](MODEL_BAKEOFF_PROTOCOL.md), [candidate registry](MODEL_CANDIDATE_REGISTRY.md), and [spend report](../operations/MODEL_BAKEOFF_SPEND_REPORT.md).

| Attempt | Published price check | Observed result | Accepted | Usage and cost evidence |
| --- | --- | --- | --- | --- |
| OpenRouter `nvidia/nemotron-3-super-120b-a12b:free`, Nvidia upstream, synthetic Idea Card | Public model and Nvidia endpoint both $0 input and output, schema advertised | Completion returned HTTP 404, classified `model_unavailable` | No | No usage or debit returned; account balance not inspected |
| Together `Prism-ML/Ternary-Bonsai-27B`, synthetic Idea Card | Official model page $0; ID present in authenticated model catalog | Completion returned a JSON Idea Card passing local structure and lexical constraint checks | Yes, for this one-card compatibility screen only | 188 input tokens, 241 output tokens, 4,014 ms; provider cost absent; published price $0; generation ID `a50b916f0810970a-b82149d7` |
| OpenRouter `nvidia/nemotron-3.5-super-vl:free`, Nvidia upstream, synthetic Idea Card | Public model and Nvidia endpoint both $0 input and output, schema advertised | Completion ended with `finish_reason=length` at 900-token cap, classified `truncated_output` | No | Response rejected before usage accounting; account balance not inspected |
| OpenRouter `nvidia/nemotron-3.5-super-vl:free`, Nvidia upstream, 1,800-token cap | Public model and Nvidia endpoint still showed $0 | Completion returned HTTP 404 | No | No usage record or debit observed |
| Together Ternary Bonsai, flood-water nine-card slate | Authenticated catalog and official page still showed $0 | Timed out after the original 30-second cap; outcome unknown | No | No response usage or provider debit available |
| Together Ternary Bonsai, farm-input nine-card slate | Authenticated catalog and official page still showed $0 | Returned nine structurally valid cards in 51,527 ms | Structurally yes; semantically no in preliminary single-reviewer inspection | 150 input and 3,564 output tokens; no provider-reported cost; generation ID `a50bd8e1288a8ed2-62a5d2a5` |

The one accepted response does not establish server-side schema enforcement, nine-strategy differentiation, originality, feasibility or production suitability. The raw synthetic response is stored under ignored `evaluation/model-bakeoff/output/` and is deliberately absent from source control. The local validator checks required fields and obvious prohibited phrases; a human must review actual compliance.

## Screen metrics

Six free completion attempts; one locally valid card and one structurally valid nine-card slate; zero semantically accepted slates; one paid compatibility call with unreconciled charge; zero actual provider charges verified. The farm slate repeated the same smallholder beneficiary across all nine cards and reused scheduling, manual logging and shared-device mechanisms. It also suggested additional soil-measurement inputs despite a no-sensor-feed brief. This is a preliminary single-reviewer observation, not blinded scoring. Independent reviewer ratings remain pending. OpenRouter's failed attempts may consume free-request quota. No paid model has an accepted completion. Cost per accepted slate is undefined. No quality ranking can be made.

## Pending

- Obtain two independent blinded semantic reviews of the Together slate and any paid outputs before scoring or declaring an accepted slate.
- Investigate OpenRouter 404 through documented support or catalog changes and repeat a bounded free probe only if an exact currently free endpoint remains advertised. A higher output cap could resolve the truncation, but it has not been tested.
- Verify balances and usage accounting without exposing keys. Record provider debit before any cost-efficiency claim.
- The owner approved a $1 maximum pilot. Keep paid dispatch disabled until every safeguard and billing precondition passes. Keep the 48 formal evaluation briefs unused.
