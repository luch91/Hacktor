# M2A paid bake-off spend report

Report status: stopped after one paid dispatch, 2026-10-26 UTC. The owner approved at most $1 aggregate paid exposure, with $0.60 per provider, $0.20 per exact model and upstream, $0.20 per synthetic brief, $0.02 per request and 40 paid requests. One OpenRouter Qwen compatibility request was dispatched. Actual charge is **unknown**, so actual spend must not be reported as $0. The durable ledger retains $0.000689 of unreconciled exposure. Its conservative remaining aggregate headroom is $0.999311, but further paid dispatch is blocked until the attempt is reconciled. No Together paid request was sent.

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

OpenRouter has a documented generation-cost record and current-key usage counter. The first paid compatibility request passed catalog, credential, budget and CI preflight and was dispatched. Its subsequent metadata or key-usage read failed, so the runner marked it `billing_unavailable` and retained its reservation. The original implementation did not persist the generation ID before attempting those reads, which prevents generation-specific recovery for this attempt. The implementation has been corrected for future requests, but no future paid request is allowed while this attempt is unresolved. The owner may inspect the OpenRouter Activity page for the approximate request time and compare the charge with the reserved amount; this report does not infer a debit from catalog prices. Together paid testing is blocked because the available account-model endpoint does not provide an auditable balance movement and no supported charge record has been established.

Local `pnpm verify` passed 26 application tests, 20 bake-off tests, five migrations, contract drift, secret scan, build and typography. A separate local Playwright attempt passed the 320-pixel and tablet checks but failed the desktop and mobile Studio journeys after slow local Worker startup and interaction. [GitHub Actions run 40393334860](https://github.com/luch91/Hacktor/actions/runs/40393334860) then passed all four responsive journeys and the same verification suite at commit `52e03df`. This cleared the pre-dispatch UI gate for the single attempt.

## Dispatched attempt

| Ledger ID | Provider and model | Brief | State | Reserved exposure | Verified charge |
| --- | --- | --- | --- | ---: | ---: |
| `48932bbc-00b3-4404-83a0-a908c9d1cb94` | OpenRouter `qwen/qwen3.5-flash-02-23`, Alibaba | `flood-water-offline` | Unknown, `billing_unavailable` | $0.000689 | Unknown |

Dispatched requests: 1. Reconciled requests: 0. Spend by provider, model and brief: unknown for this one attempt. Unreconciled exposure by OpenRouter, Qwen3.5 Flash and the flood-water brief: $0.000689 each. No slate or card output from this request is accepted as evidence. The runner made zero automatic retries.

## Required after execution

Record each dispatched attempt by anonymous ledger ID, model, upstream, brief, task, reserved exposure, provider cost, key-usage movement, final charge, validation result and reconciliation state. Sum actual charges and unresolved reserves by provider, model and brief. Stop if any mismatch persists. Keep detailed local SQLite and synthetic outputs in ignored `evaluation/model-bakeoff/output/`.
