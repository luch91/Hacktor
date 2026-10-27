# Product experience acceptance

## Local verification, 2026-10-27

- `pnpm install --frozen-lockfile`: passed.
- `pnpm verify`: passed. Includes 26 Vitest tests, five forward migrations with 36 schema objects, contract drift, secret scan, strict TypeScript, build dry runs and no-em-dash scan.
- `pnpm test:ui`: five Playwright journeys passed against the local Worker and D1. These cover both entry paths, an interrupted review, an interrupted job response with one submission, explicit comparison, two-parent lineage, blueprint review and export presence, research disclosure and four widths.
- The first evidence capture run had three passes and one mobile screenshot timeout at the 45-second test limit. Switching compact captures to viewport screenshots and setting a 90-second journey limit resolved it. The final run passed five of five in 33.7 seconds.

## Visual evidence

| Width | Actual application captures |
| --- | --- |
| 1440 | [Landing](../evidence/m2-desktop-landing.png), [Studio](../evidence/m2-desktop-studio.png), [comparison](../evidence/m2-desktop-comparison.png), [lineage](../evidence/m2-desktop-lineage.png), [blueprint](../evidence/m2-desktop-blueprint.png) |
| 768 | [Landing](../evidence/m2-tablet-landing.png), [Studio](../evidence/m2-tablet-studio.png) |
| 390 | [Landing](../evidence/m2-mobile-landing.png), [Studio](../evidence/m2-mobile-studio.png), [inspector](../evidence/m2-mobile-inspector.png) |
| 320 | [Landing](../evidence/m2-mobile-320-landing.png), [Studio](../evidence/m2-mobile-320-studio.png) |

The browser suite checks page-level horizontal overflow at the compact widths. Controls have visible keyboard focus and the mobile inspector is independently reachable. A full manual WCAG audit has not been performed.

## Local walkthrough

From the repository root, run `pnpm install --frozen-lockfile`, then `pnpm test:ui` to launch the Worker, run the journeys and shut it down. For interactive use, run `pnpm --filter @hacktor/web build`, apply the local D1 migrations with `pnpm --filter @hacktor/web exec wrangler d1 migrations apply DB --local`, then run `pnpm --filter @hacktor/web exec wrangler dev --port 8787 --local` and open `http://127.0.0.1:8787`.

Choose either entry path, review and confirm the working context, generate the deterministic slate, inspect a version, choose an explicit second version, challenge or combine, then create and review the bound blueprint. On mobile, use Explore ideas and Inspect and act to switch tasks.

## Gate recommendation

GO for local product-experience review. Review drafts are scoped to the same browser tab, stored blueprint history is not yet navigable after refresh, and Map lacks a dedicated persisted opportunity artifact. These are next milestone contract decisions. This result does not establish live model quality, verified external research, production readiness or deployment authorization.

Live model quality, authorized external research, production release and multi-workspace accounts are outside this gate. A local pass does not approve external users or deployment.
