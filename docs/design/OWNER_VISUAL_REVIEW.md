# Gate 1 owner visual review

Status: PENDING OWNER REVIEW. This branch is a proposed visual slice, not an approved design system. Do not propagate it across intake and the remaining stages, merge, or deploy before explicit visual sign-off.

Review the actual running landing in both themes and Studio with a generated nine-direction slate, then inspect List selection, a branch, a two-parent combination, the inspector, and phone/tablet reflow. The following evidence is still required: full-resolution actual screenshots, baseline comparison at matching viewports, a short interaction recording, and reduced-motion/keyboard checks. The local browser environment prevented capture in this run; this is an open gate item.

Local setup: `pnpm install --frozen-lockfile`, `pnpm --filter @hacktor/web exec wrangler d1 migrations apply DB --local`, `pnpm --filter @hacktor/web exec wrangler dev --port 8791 --local`. Open `http://127.0.0.1:8791`. Run `pnpm verify` and `HACKTOR_FRESH_SERVER=1 pnpm test:ui` on a machine with working local Worker networking and Chromium.

Decision options: approve the rendered direction for Gate 2, request revisions to Gate 1, or reject it. An engineering pass alone cannot approve the visuals.
