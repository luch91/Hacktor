# Hacktor

[![CI](https://github.com/luch91/Hacktor/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/luch91/Hacktor/actions/workflows/ci.yml)

Hacktor is a Deep Ideation Studio for builders who want differentiated, evidence-aware, build-ready hackathon concepts. Milestone M1 is implemented on the isolated `feat/m1-deep-ideation` branch for review.

The CI badge reflects the real `CI` workflow on `main`. No deployment, coverage, release, or license badge is shown because those states do not yet exist or have not been verified.

## Current status

- Milestone: M1 Core Deep Ideation Studio, pending gate review
- Runtime: responsive React Studio plus a same-origin Cloudflare Worker API
- Data: private guest sessions, immutable idea lineage, stage checkpoints, jobs, evidence, scorecards, and blueprints in local D1
- Async boundary: transactional outbox, Queue producer and consumer, bounded retry, idempotency, usage limits, and DLQ configuration
- Ingestion: Cron Worker present with every external connector disabled
- Remote deployment: not performed
- Local inference: deterministic test adapter, labeled in the interface and job records
- Live inference: adapter implemented but blocked pending an approved credential and budget
- Live source access: not implemented

The interface never presents deterministic output as live AI or hypotheses as verified research.

## Product invariants

The implementation preserves the eight-stage workflow:

1. Understand
2. Map
3. Diverge
4. Interrogate
5. Evolve
6. Research
7. Converge
8. Blueprint

M1 implements all nine idea-generation strategies, immutable branches, two-parent combination, critiques that do not rewrite ideas, explicit evidence coverage, and Markdown blueprints bound to exact idea versions. Automated source research remains disabled and is shown as blocked in the workflow.

## Local setup

Requirements:

- Node.js 22 or newer
- pnpm 11.25.0
- Python 3 with SQLite support

Install and verify:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm verify
```

Start the Vite interface:

```sh
pnpm dev
```

Run the application Worker locally after building static assets:

```sh
pnpm --filter @hacktor/web build
pnpm --filter @hacktor/web exec wrangler d1 migrations apply DB --local
pnpm --filter @hacktor/web exec wrangler dev
```

The health route is `GET /api/v1/health` and returns a structured `{data}` envelope. Local product jobs use `deterministic_test_adapter`; this is test behavior, not live inference.

Run responsive browser journeys at 320px, 390px, 768px, and desktop widths:

```sh
pnpm exec playwright install chromium
pnpm test:ui
```

Verified visual evidence is stored at [desktop Studio](docs/evidence/m1-desktop-studio.png) and [mobile Studio](docs/evidence/m1-mobile-studio.png).

## Repository map

- `apps/web`: React SPA and same-origin API Worker
- `workers/ai-consumer`: durable stage processor with deterministic and credential-gated provider boundaries
- `workers/ingestion`: disabled-by-default scheduled connector boundary
- `packages/contracts`: shared API and Idea Card contracts
- `packages/ideation`: canonical stage and strategy vocabulary
- `packages/providers`: provider-neutral stage interface
- `packages/ui`: dark, light, and system theme tokens
- `database/migrations`: forward-only D1 baseline
- `api` and `schemas`: versioned canonical contracts
- `tests`: unit, contract, and integration checks
- `docs`: architecture, permissions, operations, and gate evidence

## Environment and deployment boundary

Local, staging, and production binding names are separate. Placeholder D1 identifiers deliberately prevent a remote deployment from being treated as ready. Before the first staging deploy, the owner must provision separate D1 databases and Queues, replace placeholders, configure Cloudflare secrets, and enable the protected staging environment.

Production deployment is a manual GitHub Actions workflow with an explicit confirmation input and protected environment. It must remain disabled until a staging smoke test and owner approval exist. No custom domain is configured.

## Source and privacy boundary

All automated source connectors are disabled. Brabble and GitHub are the first approved implementation candidates, but credentials and live access are not part of M0. Devpost, DoraHacks, TAIKAI, and other sources remain disabled without recorded authorization.

Private content is accepted only after issuing an opaque guest capability. The server stores its hash, scopes every private read and write by the authenticated owner, enforces expiry and anti-CSRF checks, and denies cross-owner access by default.

## Typography policy

U+2014 is forbidden in repository text and generated output. `pnpm typography:check` scans source, documentation, configuration, built text assets, and export fixtures. The regression test constructs the forbidden code point at runtime so the repository itself remains clean.

## Ownership

The authorized GitHub repository is `luch91/Hacktor`. The authorized Cloudflare account is `Judithorluchee@gmail.com's Account`. Account authorization does not itself authorize provisioning, deployment, DNS changes, or production release.
