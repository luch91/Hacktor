# M2A provider, privacy and budget owner decision sheet

Status: proposed choices, not approval or actual spend. Official provider model and pricing pages checked 2026-10-26. Recheck account availability, prices, model behavior and privacy controls immediately before any credential or paid call. The four candidates are the same as in [M2_COST_AND_RISK_PLAN.md](M2_COST_AND_RISK_PLAN.md). No paid inference has been performed for this decision sheet.

## Provider decision proposed

**Primary: OpenAI `gpt-5.6-terra` through the Responses API.** The [official model page](https://developers.openai.com/api/docs/models/gpt-5.6-terra) lists a 1,050,000-token context window, 128,000 maximum output tokens, structured outputs, and $2 per million input plus $12 per million output text tokens. Use the [strict JSON schema response format](https://developers.openai.com/api/docs/guides/structured-outputs) with a separately validated server schema. Pin the exact model ID and observed response model/version in each attempt. This is a balanced planning choice for differentiated reasoning at a small bounded evaluation cost, not a proven quality win or account-availability claim.

**Fallback candidate: Anthropic `claude-sonnet-5-5`.** Its [official model page](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) lists 1M context, 128K output and $2/$10 per million input/output tokens. Anthropic [structured JSON outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) support this model, with schema limitations. Use a separate adapter, schema compatibility test, privacy review and price schedule. Fallback is an explicit new run decision after a primary failure and owner policy check, never a silent substitution within a frozen paired evaluation or for an uncertain billable invocation.

| Candidate and official source | Exact ID | Input / output USD per 1M | Structured output and planning role |
| --- | --- | --- | --- |
| [OpenAI GPT-5.6 Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra) | `gpt-5.6-terra` | $2.00 / $12.00 | Supported; proposed primary. |
| [OpenAI GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) | `gpt-5.6-luna` | $0.20 / $1.20 | Supported; low-cost option, quality untested. |
| [Anthropic Claude Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) | `claude-sonnet-5-5` | $2.00 / $10.00 | Supported via Anthropic structured outputs; proposed fallback candidate. |
| [Google Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) and [pricing](https://ai.google.dev/gemini-api/docs/pricing) | `gemini-3.5-flash-lite` | $0.30 / $2.50 | Supported; low-cost option, quality untested. |

Model context ceilings exceed Hacktor's proposed per-stage input and output limits and must not become application limits. The documented rates are standard text rates for the stated token range, without cache, batch, long-context, regional, grounding, tool, tax or exchange adjustments. Disable optional web search and other paid tools for this evaluation. Gemini's paid tier says content is not used to improve its products, while its free tier differs; this is not a recommendation to use its free tier for private briefs. Provider quality and output-schema behavior require a non-holdout pilot before the frozen campaign.

## Proposed privacy decision

| Category | Proposed policy requiring owner approval |
| --- | --- |
| Allowed by default | Builder-authored public or nonconfidential challenge text, technical skills, time limits, general beneficiary and rule data, with identifiers minimized. |
| Restricted | Confidential organizer material, trade secrets, private repository contents, personal contact information, minors' data, medical details, payment data or regulated records. Do not send until a specific data-processing and provider policy approves that category. |
| Provider handling | Approve account-specific retention, training, residency, subprocessors and deletion terms for each selected provider. [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data) say API data is not used for training by default and describe abuse-monitoring retention and endpoint-specific application state. For Responses, set `store:false` where appropriate and verify actual account controls. Do not assume a fallback provider has identical terms. |
| Logging and storage | Store model and prompt versions, hashes, redacted errors, usage and cost. Keep raw private prompts and responses out of telemetry. Encrypt any retained evaluation brief content, limit access and define deletion deadlines. |
| Human review | Give the three blinded reviewers the minimum redacted slate and brief context needed; prohibit access to credentials, owner identifiers and unapproved source records. Log access and remove reviewer copies after the approved retention period. |

## Proposed hard cost controls

The planning reservation per full slate is 12,000 input and 8,000 output tokens across model-backed stages. Billed reasoning tokens are included in the output allowance. Suggested stage caps for Terra: Understand 2,000/1,000 tokens and $0.016; Map 2,000/1,000 and $0.016; Diverge 4,000/3,000 and $0.044; Interrogate 2,000/1,000 and $0.016; Converge 1,000/1,000 and $0.014; Blueprint 1,000/1,000 and $0.014. Evolve is builder-driven and Research has no paid source or model allowance in this initial campaign. Totals: 12,000/8,000 and **$0.120 per slate attempt** at the published Terra rates. Split each stage cap into independent input, output and dollar guards. If context or reasoning needs more, stop and seek a revised approval before dispatch.

| Control | Proposed ceiling and rule |
| --- | --- |
| Per stage | The caps above; reserve maximum exposure before dispatch. |
| Per slate job | $0.12 and 20,000 total billed tokens, with 12,000 input and 8,000 output component limits. A retry is a new separately reserved attempt. |
| Per owner per UTC day | $3.00 settled plus outstanding reserved exposure. |
| Evaluation campaign | $25.00 hard stop for provider charges, including both arms and retries. |
| Project-wide M2A pilot and evaluation | $30.00 hard stop. Pilot exposure must fit the $5.00 difference between project and campaign caps, or use a separately approved split. |
| Credential and emergency control | Owner-approved secret store, least privilege, no credential in commits or logs; named owner can disable live inference immediately. Queue workers check the kill switch before each dispatch. |

At 48 briefs and two arms, 96 first attempts cost at most **$11.52** on Terra under these token caps. At one retry per arm for every brief, 192 attempts cost at most **$23.04**, leaving $1.96 under the proposed $25 campaign cap. The original 106-slate worksheet estimate is $12.72 but is not worst-case exposure. The same 192-attempt formula gives $19.968 for Sonnet 5.5, $2.304 for Luna and $4.5312 for Gemini 3.5 Flash-Lite at the listed standard rates. These are token-cap estimates, not actual spend, and exclude provider-specific surcharges or tools. At an illustrative 48 reviewer-hours times $20, human review is $960 separately and is not covered by the inference caps.

Atomic budget reservations count unresolved calls until reconciled. A provider response with verified usage settles the exact rate components; unused reserve is released. A lost response remains `outcome_unknown` with its reservation held. Never charge zero or issue another paid call merely because local persistence failed. Preflight must reject a call when any stage, job, owner-day, campaign or project ceiling lacks headroom. Reprice and seek renewed approval if the provider's rates or account terms change.

## Explicit owner decisions

Approve or revise: primary and fallback model; exact API availability; permitted brief categories and provider privacy controls; prompt and model version policy; each stage, job, owner-day, campaign and project cap; non-holdout pilot and 48-brief paid campaign separately; reviewer access and labor budget; secret delivery and kill-switch owner. An approved model choice alone does not authorize paid calls, source connectors, Cloudflare resources, deployment or a merge.
