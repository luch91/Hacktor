# M0 architecture and permissions inventory

## Runtime topology

`hacktor-web` serves Vite-built React assets and routes `/api/*` through the same-origin Worker. The M0 API exposes only `/api/v1/health`. The Worker has configuration stubs for D1 and the AI jobs Queue, but no product write route exists yet.

`hacktor-ai-consumer` receives only a job identifier and schema version. Its deployed handler is intentionally disabled in M0 and retries messages so an accidental invocation cannot be mistaken for completed AI work. The configuration limits retries and sends exhausted messages to the environment-specific DLQ.

`hacktor-ingestion` has a Cron trigger but performs no network requests. Every connector remains disabled until its access evidence, credential, rate policy, retention policy, attribution, and kill switch are reviewed.

## Environment separation

Local, staging, and production use distinct Worker names, database names, queue names, DLQ names, and environment variables. Placeholder D1 UUIDs are deliberate deployment blockers. They must be replaced only after the corresponding remote resource is verified in the authorized Cloudflare account.

## Contract boundary

The source handoff's OpenAPI document, Idea Card JSON schema, and D1 migration are imported without semantic edits. SHA-256 locks make changes explicit. Shared TypeScript contracts preserve snake_case payloads, the nine strategy names, error envelopes, and the queue payload rule.

## Cloudflare account state

Wrangler 4.129.0 OAuth authentication is verified for `Judithorluchee@gmail.com's Account`, account ID `0a8fd0acd086e68c9b558159fac0d7a8`. Credentials are encrypted at rest through Windows Credential Manager. No resource inventory, provisioning, route, Worker upload, database mutation, Queue mutation, DNS update, or domain action is authorized by M0 implementation alone.

## GitHub state

The authorized owner is `luch91`. The private `luch91/Hacktor` repository, `main` branch, and GitHub Actions CI are verified. Deployment workflows remain manual and disabled by their production safeguards.
