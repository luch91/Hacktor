# M2A paid bake-off spend report

Report status: pre-dispatch, 2026-10-26 UTC. The owner approved at most $1 aggregate paid exposure, with $0.60 per provider, $0.20 per exact model and upstream, $0.20 per synthetic brief, $0.02 per request and 40 paid requests. No paid completion request has been dispatched yet. Actual spend is $0; unresolved paid exposure is $0; remaining authorized aggregate exposure is $1. These values must be updated from the local ledger after each batch.

## Preflight evidence

- Isolated branch baseline: `1b4f2301e5019d2c86244dc521c1283b4050e212`. PR #1 remains draft and unmerged.
- Six-brief fixture SHA-256: `334808F84262ECAFF3034FFB6A4951419BE20E98D5EBBE333B2FA9A0750FA5A1` before paid output inspection.
- OpenRouter `GET /api/v1/key` returned HTTP 200 with a numeric usage counter and key-limit fields. Values and account identifiers are excluded from this report.
- Together `GET /v1/models` returned HTTP 200 and 269 model records. Catalog access does not establish a charge reconciliation path.
- OpenRouter Qwen3.5 Flash, Alibaba: current endpoint catalog returned HTTP 200, advertised structured output, $0.065 input and $0.26 output per million tokens.
- OpenRouter GLM-5.3 Flash, StreamLake: current endpoint catalog returned HTTP 200, advertised structured output, $0.0435 input and $0.145 output per million tokens.
- Together Qwen3.8 Flash and GPT-OSS 120B: both appeared in the authenticated catalog. Published prices were $0.15/$0.47 and $0.15/$0.60 per million input/output tokens, respectively. No paid callability or billing record has been observed.
- The ledger stores no credentials or private request headers. Mock tests cover atomic limits, unknown billing, route mismatch, pricing drift, missing usage, redaction and disabled paid mode. A successful mock is not a real debit.

## Provider eligibility

OpenRouter has a documented generation-cost record and current-key usage counter. The first paid compatibility request remains conditional on all verification checks passing. Together paid testing is blocked because the available account-model endpoint does not provide an auditable balance movement and no supported charge record has been established. Do not substitute catalog rates for actual charges.

Local `pnpm verify` passed 26 application tests, 20 bake-off tests, five migrations, contract drift, secret scan, build and typography. A separate local Playwright attempt passed the 320-pixel and tablet checks but failed the desktop and mobile Studio journeys after slow local Worker startup and interaction. This is an unresolved preflight gate. No paid request was sent while it remained unresolved. A passing CI run on this commit is also pending.

## Required after execution

Record each dispatched attempt by anonymous ledger ID, model, upstream, brief, task, reserved exposure, provider cost, key-usage movement, final charge, validation result and reconciliation state. Sum actual charges and unresolved reserves by provider, model and brief. Stop if any mismatch persists. Keep detailed local SQLite and synthetic outputs in ignored `evaluation/model-bakeoff/output/`.
