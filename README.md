# Hacktor

[![CI](https://github.com/luch91/Hacktor/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/luch91/Hacktor/actions/workflows/ci.yml)

Hacktor is a Deep Ideation Studio for builders who want differentiated, evidence-aware, build-ready hackathon concepts. This repository currently contains the Milestone M0 foundation only.

The CI badge reflects the real `CI` workflow on `main`. No deployment, coverage, release, or license badge is shown because those states do not yet exist or have not been verified.

## Current status

- Milestone: M0 repository and infrastructure foundation
- Runtime: React static assets plus a same-origin Cloudflare Worker API
- Data: canonical D1 baseline imported and tested locally
- Async boundary: Queue producer, consumer, bounded retry, and DLQ configuration scaffolded
- Ingestion: Cron Worker present with every external connector disabled
- Remote deployment: not performed
- Live inference: not implemented
- Live source access: not implemented

The interface labels itself as a foundation preview. It does not present fixture output as live AI or research.

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

The planned production workflow also preserves nine idea-generation strategies, immutable branches, critiques that do not rewrite ideas, evidence-aware validation, and blueprints bound to exact idea versions. Those product behaviors belong to later gated milestones and are not claimed as implemented here.

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
pnpm --filter @hacktor/web exec wrangler dev
```

The health route is `GET /api/v1/health` and returns a structured `{data}` envelope.

## Repository map

- `apps/web`: React SPA and same-origin API Worker
- `workers/ai-consumer`: queue boundary and idempotent fixture processor
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

Private user content is not accepted by this M0 shell. Later milestones must enforce owner scope, secure guest capabilities, anti-CSRF controls, and private-by-default storage before accepting it.

## Typography policy

U+2014 is forbidden in repository text and generated output. `pnpm typography:check` scans source, documentation, configuration, built text assets, and export fixtures. The regression test constructs the forbidden code point at runtime so the repository itself remains clean.

## Ownership

The authorized GitHub account is `luch91`. The exact remote repository and valid GitHub authentication still need verification before the first push. Cloudflare authorization does not itself authorize provisioning, deployment, DNS changes, or production release.
