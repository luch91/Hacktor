# M1 architecture and permissions inventory

## Runtime topology

`hacktor-web` serves Vite-built React assets and routes `/api/*` through the same-origin Worker. Versioned routes implement brief parsing, private sessions, optimistic context confirmation, durable jobs, immutable idea actions, evidence reads, validation, blueprints, and Markdown export.

`hacktor-ai-consumer` receives only a job identifier and schema version. Local processing uses the deterministic test adapter. Staging and production processing remain disabled. The consumer claims durable jobs, checkpoints stages, records provider metadata and zero-cost fixture usage, bounds retries, and lets exhausted messages reach the environment-specific DLQ.

`hacktor-ingestion` has a Cron trigger but performs no network requests. Every connector remains disabled until its access evidence, credential, rate policy, retention policy, attribution, and kill switch are reviewed.

## Environment separation

Local, staging, and production use distinct Worker names, database names, queue names, DLQ names, and environment variables. Placeholder D1 UUIDs are deliberate deployment blockers. They must be replaced only after the corresponding remote resource is verified in the authorized Cloudflare account.

## Contract boundary

The source handoff's OpenAPI document, Idea Card JSON schema, and D1 migration are imported without semantic edits. SHA-256 locks make changes explicit. Shared TypeScript contracts preserve snake_case payloads, the nine strategy names, error envelopes, and the queue payload rule.

## Privacy and job boundary

Guest capabilities use cryptographically random opaque values. Only SHA-256 hashes are stored. Cookies are HttpOnly, Secure, and SameSite Strict where appropriate, mutating routes require a matching CSRF token, and all private queries join or filter through the authenticated guest owner. Jobs use request hashes, owner-scoped idempotency keys, active and hourly limits, a transactional outbox, five-minute dispatch, bounded attempts, leases, and structured recoverable failures.

The eight stages are stored in `session_stage_runs`. Stages that require a builder decision, approved research source, validation, or selected version remain visibly blocked until that operation occurs. This prevents a deterministic local fixture from implying unsupported research or convergence.

## Inference boundary

The provider package includes a deterministic adapter for tests and a credential-gated JSON inference adapter with timeouts, structured envelopes, recursive typography normalization, and explicit provider, model, prompt-version, and usage metadata. No live provider credential or budget is configured. User content is passed as structured stage input. Automated source connectors remain disabled.

## Cloudflare account state

Wrangler 4.129.0 OAuth authentication is verified for `Judithorluchee@gmail.com's Account`, account ID `0a8fd0acd086e68c9b558159fac0d7a8`. Credentials are encrypted at rest through Windows Credential Manager. No resource inventory, provisioning, route, Worker upload, database mutation, Queue mutation, DNS update, or domain action is authorized by M0 implementation alone.

## GitHub state

The authorized owner is `luch91`. The private `luch91/Hacktor` repository, `main` branch, and GitHub Actions CI are verified. Deployment workflows remain manual and disabled by their production safeguards.
