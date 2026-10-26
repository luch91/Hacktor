# M0 local verification runbook

## Install

Use the pinned pnpm version and lockfile.

```sh
corepack enable
pnpm install --frozen-lockfile
```

## Full gate

```sh
pnpm verify
```

This command checks formatting, lint, U+2014, strict types, tests, the SQLite migration, contract hashes, likely committed secrets, production builds, and built text assets.

## D1 local migration through Wrangler

```sh
pnpm --filter @hacktor/web exec wrangler d1 migrations apply hacktor-local --local
```

This operates on local Wrangler state only. Never add `--remote` without selecting and confirming the intended account and environment.

## Worker smoke test

```sh
pnpm --filter @hacktor/web build
pnpm --filter @hacktor/web exec wrangler dev
```

Request `http://localhost:8787/api/v1/health`. Confirm a 200 response with `service`, `status`, `milestone`, and `api_version` inside `data`.

## Remote boundary

Do not run deploy workflows until all placeholder IDs are replaced, remote bindings exist, secrets are stored outside source, a protected GitHub environment is configured, and the owner approves that environment.
