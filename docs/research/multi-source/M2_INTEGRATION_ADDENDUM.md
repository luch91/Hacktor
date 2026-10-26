# M2 integration addendum for owner review

Status: independent recommendations from worktree `docs/m2-multi-source-intelligence`. Do not copy these into the five M2 planning documents until the concurrent planning task is complete and the owner approves reconciliation. No runtime code, migration, connector, credential, paid call, Cloudflare resource, or deployment is included.

## Exact proposed changes to the five M2 plans

| Existing document | Proposed edit after reconciliation |
| --- | --- |
| `docs/milestones/M2_IMPLEMENTATION_PLAN.md` | Make the four source intelligence layers explicit within M2B. Add a first-class historical-project corpus and licensed event-to-project evidence links. Replace any implied Brabble-first ordering with source-by-source permission and role-based sequencing. Keep M2A independent of source activation. |
| `docs/milestones/M2_ACCEPTANCE_CRITERIA.md` | Add M2B evidence for source permission compliance, official-brief provenance, project-event link precision, deduplication, freshness, query coverage, valid citations, and unsupported-claim rate. Require every source claim to cite an approved snapshot and exact idea version. No global novelty percentage. |
| `docs/ai/MODEL_EVALUATION_PLAN.md` | Keep the 48-brief M2A quality comparison separate from M2B source coverage. If approved historical records are later supplied to either arm, give both arms the same records and report corpus scope. Do not call unmatched ideas original. |
| `docs/research/SOURCE_INTEGRATION_PLAN.md` | Link this addendum's ecosystem table and four-layer architecture. Expand proposed sources to Devpost, DoraHacks, Devfolio, TAIKAI, MLH, HackerEarth, Cerebral Valley, HackList, and HackRep. Record each access class and blocker. Treat Brabble as a discovery lead source with Indian city-filter limits and documentation conflicts. Prioritize ETHGlobal and lablab.ai access negotiations for historical depth. |
| `docs/operations/M2_COST_AND_RISK_PLAN.md` | Add source licensing, API requests, storage and indexing, reviewer labor, deletions, and maintenance as separate M2B costs. Keep unknown license fees unknown. Budget per connector and per campaign; stop on permission expiry, rate cap, 401/403, schema drift, or takedown. |

The 2026-10-26 bounded findings in [ACCESS_PROBE_RESULTS.md](ACCESS_PROBE_RESULTS.md) and [HACKLIST_MCP_POC.md](HACKLIST_MCP_POC.md) sharpen the proposed edits: HackList's public feed and community MCP work, but data rights and official ownership remain pending; Brabble's RSS works and its published terms permit limited attributed commercial row reuse, while its keyed API returned 401 without a key; Devpost returned 403 and its published terms bar crawling; Devfolio, ETHGlobal and lablab.ai exposed representative public historical projects, but commercial corpus rights remain pending. The main plans should carry two independent access and authorization statuses, not one restricted/available label. The [phase closure](M2B_PHASE_CLOSURE.md) lists the source-specific owner decisions.

## Decisions that may conflict with current planning

1. The current M2 implementation order speaks of beginning connector work with the least ambiguous approved access path. This addendum recommends choosing the first pilot by both permission and historical intelligence value, preferably an organizer-authorized event and project export. Brabble is useful for discovery but does not satisfy historical originality needs. The owner should select the pilot after seeing permission and sample quality.
2. The existing source plan names Brabble, GitHub, organizer briefs, lablab.ai and ETHGlobal, while this assessment adds nine other ecosystems. Adding names to the plan does not authorize access or expand M2B implementation scope. The owner must decide whether to approve a narrow first wave and leave the rest as a research backlog.
3. The current `public_projects` schema allows one source record and one event per row. This addendum proposes separate versioned observations and many-to-many project-event links. This requires contract and migration review after M2B approval; no M1 schema or contract is changed here.
4. The current gate calls for 100% provenance of verified claims. That remains appropriate, but source coverage itself has no global denominator. The owner should approve scoped pilot coverage targets only after obtaining an organizer roster or licensed corpus manifest.

## Recommended integration sequence

Review and approve the source permission template; obtain one organizer-authorized event and project sample; test canonical event and project identities with the [bounded public fixtures](fixtures/public-sample.json); agree on D1 migration and API contract changes; evaluate GitHub repository linkage under its API and license policy; negotiate ETHGlobal, lablab.ai and Devfolio historical access; consider Brabble discovery under its limited published row-use conditions; resolve HackList's ownership and data reuse before any connector; then run the M2B coverage and provenance gate. Each connector requires its own activation decision. PR #1 stays draft and unmerged until its separate owner decision.

## Owner decisions required

Approve which source agreements to seek, allowed commercial use and retention, any organizer export pilot, historical corpus scope, M2B schema and metric thresholds, source budget, and eventual connector activation. Approve any integration of these addenda into the main M2 documents separately. No decision here implies permission for M2 code, paid inference, merge, or deployment.
