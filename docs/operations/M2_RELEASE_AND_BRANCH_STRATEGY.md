# M2 release and branch strategy

Status: proposed Git workflow, not merge, deployment or implementation authorization. The M1 acceptance commit is `983b8410c1f8c4980790d7ea287c1294de0456e6`. [PR #1](https://github.com/luch91/Hacktor/pull/1) currently carries later M2 planning at `e1d3edfc306d4631601223a4deece4c2c10cd3e9` and remains a distinct draft review boundary. M2B technical validation is traceable to commit `2b488bfec942cc4162fa70f992b91842b36f4e92` and [its CI run](https://github.com/luch91/Hacktor/actions/runs/40323658481).

## Proposed sequence requiring owner decisions

1. Review PR #1, distinguishing the accepted M1 implementation SHA from later documentation commits. Explicitly approve or decline its merge. Record the exact reviewed head and resulting merge SHA if approved; retain the accepted M1 SHA in the gate report. Do not imply the M1 acceptance automatically authorizes a merge.
2. Review this isolated documentation branch and its M2B traceability. Rebase or merge the approved documents onto the reviewed mainline only after the PR #1 decision, resolving documentation conflicts by owner review rather than overwriting source-validation evidence. Record the M2B source-validation commit in the final documentation history or acceptance record.
3. After separate M2A implementation authorization, create `feat/m2a-live-ideation` from that reviewed mainline. Open its own draft PR. Limit it to live inference, stage orchestration, evaluation instrumentation and required local schema/API changes. Keep credentials and paid calls behind separate approval.
4. Keep any future M2B connector implementation on `feat/m2b-research` from a reviewed mainline, with a separate draft PR, each source's permission record, and its own engineering gate. M2A must not wait for a provider reply about HackList or another source.
5. Require exact-SHA CI, owner-scoped and lease-fence regressions, no U+2014 scan, migration review, cost/privacy evidence and the package-specific gate report before any implementation PR moves out of draft. Merge, staging, production, DNS and Cloudflare resources each need explicit later authorization.

Avoid cherry-picking runtime changes from an unaccepted branch. If M2B later needs an M2A contract, land the reviewed contract with tests first or carry one isolated reviewed commit and document its dependency. Keep accepted M1 behavior reproducible; never rewrite its SHA or describe a new merge as the accepted M1 commit.

## Rollback and release evidence

The M2A feature flag defaults to disabled outside explicit local test mode. A production launch plan must identify the model kill-switch owner, budget halt, Queue drain and outstanding-invocation reconciliation, data deletion path and rollback SHA before deployment approval. The M2B ingestion Worker remains disabled. README badges may only reflect a real workflow and its actual result; no production or live-model badge is justified by planning CI.
