# M2B source validation phase closure

Status: **GO for closing bounded planning and feasibility investigation; NO GO for production connector activation.** Reviewed 2026-10-26. This decision is separate from M2A and from M1 production authorization.

## Completed evidence

- [HackList MCP](HACKLIST_MCP_POC.md) initialized, listed eight tools and returned live feed-backed overview, searches, detail records, new and closing events. It returned safe no-match results, showed duplicate collapse and exposed a source snapshot timestamp. Direct feed and listing comparison confirmed bounded technical access. Commercial reuse and community MCP ownership remain pending.
- [Twelve platform probes](ACCESS_PROBE_RESULTS.md) recorded actual HTTP responses, sample fields and limitations. Brabble RSS worked while its no-key API returned 401. Devpost's direct requests returned 403. Other public pages worked to varying degrees; JavaScript rendering limited DoraHacks, TAIKAI and Encode Club field confirmation.
- [Access and permissions](SOURCE_PERMISSION_REGISTER.md) are separate classifications. No platform is called inaccessible solely due to unresolved commercial rights. Devpost's published crawler restriction is explicitly distinguished from its possible licensed-feed path.
- [Normalized public fixtures](fixtures/public-sample.json) illustrate two event records and three historical project records without copied descriptions or claims of official verification.
- The existing [architecture](MULTI_SOURCE_ARCHITECTURE.md), [historical comparison model](HISTORICAL_PROJECT_INTELLIGENCE.md), [priority matrix](SOURCE_PRIORITY_MATRIX.md) and [coverage plan](COVERAGE_EVALUATION_PLAN.md) retain provider-independent boundaries, provenance, source revocation and uncertainty reporting.

## Integration sequence proposed for owner review

1. Official organizer briefs for verified rules and revisions. No aggregator label is sufficient.
2. Discovery pilot with Brabble RSS or keyed API under its documented limited reuse terms, plus HackList feed or MCP only after its data rights and ownership are confirmed. Measure overlap and geographic bias.
3. Historical-project pilot from one authorized Devfolio organizer export or a separately licensed ETHGlobal or lablab.ai sample. These sources offer event-linked project mechanisms, a stronger originality signal than another directory.
4. GitHub official API for comparable implementations, with repository-license and participation-claim controls.
5. Negotiate additional DoraHacks, Devpost, TAIKAI and other feeds independently. A provider's silence does not block the other connectors or M2A.

Architecture uses a source registry, separate discovery, official-brief and project connectors, canonical external IDs, entity resolution, source snapshots, evidence-to-idea-version links, coverage manifests, explicit error states and per-source kill switches. An event listing cannot become an organizer-verified brief automatically. A repository cannot become a verified hackathon submission automatically. No-match searches must disclose coverage and unavailable sources, never claim proof of originality.

## Open decisions and blockers

| Decision | Owner or partner action | Effect |
| --- | --- | --- |
| HackList reuse and MCP ownership | Await Beni/HackList answer on commercial storage, transformation, display, attribution, rate policy and page fallback. | Blocks HackList connector activation only. |
| Brabble keyed API | Owner approval for key and limited-use terms; reconcile FAQ, limit and offset documentation conflicts. | RSS technical validation stands; no active connector. |
| Historical source rights | Devfolio organizer export authorization or ETHGlobal/lablab.ai written sample license. | Blocks corpus ingestion, not architecture or M2A. |
| Devpost | Licensed feed or written partnership. | Published terms and direct 403 prevent crawler route. |
| Other platforms | Resolve source-specific use, attribution, retention and access method. | Each remains independently disabled. |
| Cloud and paid model resources | Separate owner decisions. | Outside this phase. |

No production ingestion, sustained scraping, paid call, Cloudflare change, deployment, PR merge or M2 implementation occurred in this workstream. Existing M1 protections and the U+2014 check remain required. The phase can close with the listed independent permission requests open. M2B implementation remains unauthorized until the owner accepts an explicit plan and grants each source's integration permission.
