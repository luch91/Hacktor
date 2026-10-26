# M2A model selection recommendation

Status: provisional shortlist, not a model-selection decision. The completed free compatibility screen contains one valid Idea Card and no evaluated slates. The proposed weighted ranking cannot be scored honestly yet. The [pilot protocol](MODEL_BAKEOFF_PROTOCOL.md) reserves 30% for originality and meaningful differentiation, 25% for feasibility and relevance, 20% for hard constraints, 15% for reliability and structure, and 10% for accepted-slate cost and latency. Every quality dimension remains unmeasured.

| Role | Provisional candidate | Basis | Decision status |
| --- | --- | --- | --- |
| Free development model | Together `Prism-ML/Ternary-Bonsai-27B` | One account-backed structured Idea Card passed local validation under a published $0 rate | Limited compatibility confirmed; slate quality pending |
| Low-cost paid screen | OpenRouter `qwen/qwen3.5-flash-02-23` with Alibaba upstream | Public $0.065 input and $0.26 output per million; schema advertised | Account access and quality untested |
| Stronger reasoning screen | Together `deepseek-ai/DeepSeek-V4.1-Flash` or `openai/gpt-oss-120b` | Catalog presence and published schema support | Account access and quality untested; select one only within approved pilot cap |
| Independent fallback | Together `Qwen/Qwen3.8-Flash` if OpenRouter Qwen wins, or OpenRouter Qwen if Together wins | Distinct routing and billing path | No fallback activated or validated |

No best overall production model, cheapest acceptable slate model or best critique model can be named from the current data. Ternary Bonsai has only demonstrated one-card reachability; OpenRouter free alternatives have not yielded an accepted card. AgentRouter `.org` remains blocked for an ordinary application client. Do not infer model capability or production reliability from catalog inclusion.

The initial implementation should keep a single explicit model per job and no silent fallback. Mixed stage routing remains a hypothesis until a paired comparison shows a lower cost per accepted slate without quality loss. Preserve the formal 48-brief evaluation and its predeclared thresholds after a pilot configuration is frozen.
