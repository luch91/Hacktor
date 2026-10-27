# M2 Product Continuity gate

Status: local implementation and remote CI verified.

Baseline: `f2d11d00b142fb931ac243412ab14f77c3ec72ba`.

## Required evidence

| Gate | Evidence to record |
| --- | --- |
| A, drafts | Local API tests cover creation, revision conflicts, two-tab confirmation, autosave race and cleanup. Worker backed browser tests cover saved, restored, conflicted and delayed saves, including a new browser context with the same valid capability. |
| B, blueprints | API tests cover two artifacts for one version, another version, chronological order, exact read, export, cross-owner, deletion and expiry. Browser test reopens history after refresh and keeps the selected version. |
| C, workspace | Browser tests cover original text, pinned and rejected states, selected version, Map stage and interrupted job with one POST. Active jobs are also listed by the server. |
| D, Map | API tests cover empty, populated, blocked and cross-owner reads. Browser captures show three stored deterministic hypotheses with unverified labeling. |
| E, security | New routes use the existing guest capability and CSRF check. API tests cover stale revisions, owner isolation, expired guest access, deleting sessions, input size and original preservation. Migration test covers draft cascade deletion. |
| F, accessibility | Browser checks cover keyboard focus, form labels, dark and light text contrast, reduced motion and no page overflow at 320 and 768 pixels. A brief theme-switch contrast issue was fixed. Manual screen-reader and zoom checks remain unverified. |
| G, CI | Local `pnpm verify` passed with 33 tests across nine files, six migrations, contract, secret, type and no-em-dash checks. Final Worker backed Playwright run passed 11 applicable journeys, with six expected project skips, at desktop, 768px, 390px and 320px. [GitHub Actions run 40488288696](https://github.com/luch91/Hacktor/actions/runs/40488288696) succeeded for implementation commit `573389169ba1610886df2749748f238482411715`. |

## Visual evidence

- [Saved review draft](../evidence/continuity-desktop-saved-draft.png) and [restored draft](../evidence/continuity-desktop-restored-draft.png).
- [Two-tab conflict](../evidence/continuity-desktop-draft-conflict.png).
- [Stored blueprint reopened after refresh](../evidence/continuity-desktop-blueprint-history.png).
- [Opportunity Map](../evidence/continuity-desktop-map.png).
- [Mobile restored Studio](../evidence/continuity-mobile-restored-studio.png), [320px Map](../evidence/continuity-mobile-320-map.png) and [tablet Map](../evidence/continuity-tablet-map.png).

## Scope and remaining limits

The guest capability supports one browser-owned workspace. It does not support cross-device identity, recovery after expiry or a multi-workspace switcher. Map hypotheses have stable IDs but no stored relation to later idea versions, and bottlenecks are not separate fields. Automated sources and paid inference remain disabled. Accessibility checks are targeted and do not establish full WCAG conformance.

No production release decision is implied by this local gate.

## Recommendation

GO for local Product Continuity acceptance. This recommendation covers deterministic local operation and the listed tests. Cross-device identity, live inference, source intelligence, staging and production require separate authorization.
