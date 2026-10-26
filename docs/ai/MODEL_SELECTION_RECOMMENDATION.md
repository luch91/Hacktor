# M2A model selection recommendation

Status: no model-selection decision. The free screen contains one valid Idea Card and one structurally valid but semantically repetitive slate. One paid OpenRouter Qwen compatibility request is unreconciled; no paid output is accepted. No independent reviewer scores exist. The proposed weighted ranking cannot be scored honestly yet. The [pilot protocol](MODEL_BAKEOFF_PROTOCOL.md) reserves 30% for originality and meaningful differentiation, 25% for feasibility and relevance, 20% for hard constraints, 15% for reliability and structure, and 10% for accepted-slate cost and latency.

| Role | Provisional candidate | Basis | Decision status |
| --- | --- | --- | --- |
| Free development model | Together `Prism-ML/Ternary-Bonsai-27B` | Account-backed Idea Card and slate at a published $0 rate | Schema compatibility observed; slate semantic quality weak in preliminary review |
| Low-cost paid screen | OpenRouter `qwen/qwen3.5-flash-02-23` with Alibaba upstream | Current $0.065 input and $0.26 output per million; schema advertised | One dispatched compatibility call is unreconciled; completion quality untested |
| Reasoning and constraint screen | OpenRouter `z-ai/glm-5.3-flash` with StreamLake upstream | Current $0.0435 input and $0.145 output per million; schema advertised | Account usage endpoint reachable; completion quality untested |
| Independent provider fallback candidates | Together `Qwen/Qwen3.8-Flash` and `openai/gpt-oss-120b` | Authenticated catalog lists both exact IDs | Paid testing blocked until actual charges can be reconciled |

No best overall production model, cheapest acceptable slate model or best critique model can be named from the current data. Ternary Bonsai demonstrated slate callability but insufficient semantic differentiation in preliminary review. OpenRouter free alternatives have not yielded an accepted card. AgentRouter `.org` remains blocked for an ordinary application client. Do not infer model capability or production reliability from catalog inclusion.

The initial implementation should keep a single explicit model per job and no silent fallback. Mixed stage routing remains a hypothesis until a paired comparison shows a lower cost per accepted slate without quality loss. Preserve the formal 48-brief evaluation and its predeclared thresholds after a pilot configuration is frozen.
