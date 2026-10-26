# M2A candidate model registry

Verified 2026-10-26 UTC by bounded public and authenticated read-only catalog requests and official provider pages. A catalog entry establishes published availability, not successful inference. One OpenRouter paid Qwen compatibility request was later dispatched; its charge is unresolved in the [spend report](../operations/MODEL_BAKEOFF_SPEND_REPORT.md). OpenRouter's [public models API](https://openrouter.ai/docs/api/api-reference/models/get-models) returned HTTP 200 with 466 records; its [per-model endpoints API](https://openrouter.ai/docs/api/api-reference/endpoints/list-endpoints) returned HTTP 200 for sampled models. Together's authenticated `GET https://api.together.xyz/v1/models` returned HTTP 200 and listed both selected paid IDs. Prices are USD per million text tokens, not measured account debits. Recheck before any future paid call.

## OpenRouter

| Requested API model ID | Catalog status | Input / output | Context; max output | Structured output and upstream finding |
| --- | --- | --- | --- | --- |
| `deepseek/deepseek-v4-flash-0731:free` | **Absent** from live catalog; no call attempted. | Unknown | Unknown | Do not substitute the paid `deepseek/deepseek-v4-flash` silently. |
| `qwen/qwen3.8-27b:free` | **Absent** from live catalog; no call attempted. | Unknown | Unknown | No current free endpoint under this exact ID. |
| `qwen/qwen3.5-flash-02-23` | Present, paid | $0.065 / $0.26 | 1,000,000; 65,536 | One sampled upstream, Alibaba, advertises `structured_outputs`. |
| `z-ai/glm-5.3-flash` | Present, paid | Catalog $0.15 / $0.50 | 1,048,576; top endpoint 943,717 | 38 endpoint records with different prices and capabilities. Relace at $0.0413 / $0.0758 does **not** advertise schema support; StreamLake at $0.0435 / $0.145 does. Together and many other endpoints advertise schema support. Pin and price the actual upstream. |
| `qwen/qwen3.8-flash` | Present, paid | $0.15 / $0.47 | 1,000,000; 131,072 | Two Alibaba endpoints sampled; both advertise schema support. Cached input listed at $0.016. |
| `minimax/minimax-m3.1-flash` | Present, paid | Catalog $0.15 / $0.60 | 1,048,576; top endpoint 524,288 | 12 endpoint records. Cheapest sampled schema endpoint, InferenceNet, is $0.10 / $0.55; some other endpoints lack schema support. Together appears as an OpenRouter upstream, but Together's own model page conflicts with its current serverless table. |

OpenRouter's live free catalog offered 17 `:free` IDs during this pass. Two relevant **replacement candidates**, not substitutes for the requested IDs, were `nvidia/nemotron-3-super-120b-a12b:free` with 262,144 context and one free Nvidia endpoint advertising schema support, and `nvidia/nemotron-3.5-super-vl:free` with 1,000,000 context and one such endpoint. Both were $0 input/output in the model and endpoint catalogs. On 2026-10-26 the first returned HTTP 404 from the completion endpoint; the second returned a truncated completion at the 900-token cap and then HTTP 404 with a bounded 1,800-token cap. Neither produced an accepted card. Privacy fit and quality remain unverified. OpenRouter's [pricing page](https://openrouter.ai/pricing) reports 20 free requests per minute and 50 per day for accounts below its credit threshold, with failed attempts counting; account-specific quota remains unverified.

For OpenRouter, the top-level `supported_parameters` is not proof that every upstream enforces JSON Schema. [Structured-output guidance](https://openrouter.ai/docs/guides/features/structured-outputs) requires `response_format` with `json_schema` and `provider.require_parameters:true`; enforcement varies by endpoint. Use a named `provider.only` allowlist and `allow_fallbacks:false`, then check [generation metadata](https://openrouter.ai/docs/api/api-reference/generations/get-generation) for actual `provider_name`, model, tokens and `total_cost`. Default routing or silent model fallback is inappropriate for the bake-off. The [privacy policy](https://openrouter.ai/privacy/) notes upstream providers have differing data practices; synthetic prompts only until a provider-specific privacy decision.

## Together AI

| Requested API model ID | Published serverless status | Input / cached / output | Context | Published structured-output status |
| --- | --- | --- | --- | --- |
| `Qwen/Qwen3.8-Flash` | Listed | $0.15 / not listed / $0.47 | 1,000,000 | Yes |
| `zai-org/GLM-5.3-Flash` | Listed | $0.15 / $0.03 / $0.50 | 1,048,575 | Yes |
| `MiniMaxAI/MiniMax-M3.1-Flash` | Listed in [serverless table](https://docs.together.ai/docs/serverless/models), but [model page](https://www.together.ai/models/minimax-m3-1-flash) still says coming soon. | $0.15 / $0.015 / $0.60 | 1,048,576 | Table says yes; account callability unresolved. |
| `openai/gpt-oss-120b` | Listed | $0.15 / not listed / $0.60 | 131,072 | Yes |
| `deepseek-ai/DeepSeek-V4.1-Flash` | Listed | $0.30 / $0.006 / $1.20 | 1,000,000 | Yes |
| `Prism-ML/Ternary-Bonsai-27B` | Listed **free** | $0 / not listed / $0 | 262,144 | One Idea Card and one nine-card slate passed local structural checks. The slate failed preliminary semantic differentiation review. Server-side schema enforcement remains unproven. |

Together's [structured-output documentation](https://docs.together.ai/docs/inference/chat/structured-outputs) supports `response_format.type=json_schema` for supported models. The current table marks all six candidates as structured-output capable, but no account-backed schema test has occurred. Maximum output tokens, model-specific account quotas and exact reasoning-token billing for these IDs were not established by the public table. Treat reasoning tokens as potentially billable output and reserve for them until provider usage confirms otherwise. Together's [privacy policy](https://www.together.ai/privacy) describes opt-in training and account-level zero-retention settings; the owner's actual settings have not been checked.

## AgentRouter and account state

The owner's observed direct POST to `https://agentrouter.org/v1/chat/completions` with `gpt-5.6-sol` returned `unauthorized_client_error` and `UNAUTHENTICATED`. No supported generic backend client or alternative `.org` endpoint was established. See [compatibility review](../operations/AGENTROUTER_COMPATIBILITY.md). Do not confuse `agentrouter.org` with similarly named `agentrouter.to` developer documentation; their account and endpoint relationship has not been established.

Both keys were supplied through the ignored `.env.model-bakeoff` file after the initial catalog pass. OpenRouter's key was used for one paid Qwen compatibility request that remains unreconciled. No Together paid model was called. OpenRouter's current-key usage counter was reachable during preflight; Together's actual-charge and balance path remains unverified. Quotas and data-retention settings remain unverified.
