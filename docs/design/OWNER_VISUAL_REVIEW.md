# Gate 1 owner visual review

Status: PENDING OWNER REVIEW. Actual rendered evidence exists for the landing and Studio vertical slice. The complete Hacktor reference ZIP and master handoff path are not accessible in this workspace, so comparison with the merged HTML preview remains open. Do not start Gate 2, merge, or deploy before explicit owner sign-off.

## Evidence

The `docs/evidence/m2d/` set contains actual Worker-backed screenshots: `landing-dark.png`, `landing-light.png`, `studio-constellation.png`, `studio-list.png`, `selected-idea-inspector.png`, `evolved-branch.png`, `two-parent-combination.png`, `combination-overview.png`, `mobile-390-landing.png`, `mobile-320-studio.png`, and `tablet-studio.png`. `interaction.webm` records the browser flow. `comparison-xdesign-landing.png` and `comparison-cattleya-mobile.png` place the available original references beside Hacktor captures. These compare direction and hierarchy, not pixel equivalence. `geometry.json` records the nine initial node rectangles.

## Local setup and tests

Run `pnpm install --frozen-lockfile`, `pnpm --filter @hacktor/web build`, and `pnpm --filter @hacktor/web exec wrangler d1 migrations apply DB --local`. On a normal local host, run `pnpm --filter @hacktor/web exec wrangler dev --ip 127.0.0.1 --port 8791 --local`, then open `http://127.0.0.1:8791`. The browser session is local to the host; this URL is not publicly accessible from a different machine.

This execution sandbox reports `uv_interface_addresses` from Node's `os.networkInterfaces()`. A process-local preload that returns the loopback interface allowed Wrangler to run without changing the Worker or provisioning anything. Chromium 141 from the package registry was used as a test executable because Playwright's download endpoint was unavailable. The local Worker-backed browser suite passed 14 tests with 6 intentional skips after repairs. `pnpm verify` must be rerun after the final evidence changes.

GitHub Actions run 40688505449 failed before executing any step: its sole job was completed in three seconds with `steps: []`, `runner_id: 0`, and an empty runner name. Its log endpoint returned a blob 404. That record does not establish a source-code failure. A new CI run at the final head is required.

Owner decision: approve the rendered Gate 1 direction for Gate 2, request visual revisions, or reject it. Passing engineering checks cannot substitute for visual approval.
