# Hacktor engineering rules

## Current authorization boundary

- Implement only the active milestone. M0 is the current milestone.
- Keep remote deployments, production resources, DNS, custom domains, and merges disabled until the owner explicitly authorizes them.
- The authorized GitHub owner is `luch91`. Authentication and the exact repository name still require verification before the first push.

## Product invariants

- The Deep Ideation Studio is the core product.
- Preserve all eight stages: understand, map, diverge, interrogate, evolve, research, converge, and blueprint.
- Preserve immutable idea versions and explicit lineage. A combine operation has two parent edges.
- Keep user-authored original ideas unchanged.
- Never invent source evidence, novelty percentages, deployment status, or test results.
- Source connectors are disabled until their recorded permissions and credentials are verified.

## Engineering invariants

- U+2014 is forbidden in tracked text, generated assets, runtime AI output, and exports.
- Use strict TypeScript, versioned `/api/v1` routes, snake_case payloads, and structured data or error envelopes.
- Scope private reads and writes by owner on the server.
- Keep local, staging, and production Cloudflare resources separate.
- Run the M0 gate commands and record their actual results before requesting review.
