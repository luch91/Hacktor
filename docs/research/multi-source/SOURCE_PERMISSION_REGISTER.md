# Source access and usage permission register

Checked 2026-10-26. Technical access answers whether a bounded public request worked. Authorization answers whether the proposed commercial ingestion, retention, comparison and display are permitted. Public visibility alone does not resolve the latter. This register does not activate any connector.

| Source | Technical access | Proposed-use authorization | Basis and next permission action |
| --- | --- | --- | --- |
| HackList | Working public JSON feed and community MCP | Written authorization pending | [MCP repository](https://github.com/mrfomoweb3/hacklist-mcp) licenses code under MIT, not listing data. Confirm official MCP ownership, reuse, attribution, retention, rate limits and fallback crawling with Beni/HackList. |
| Brabble | Working public RSS; keyed API returns 401 without key | Limited permission | [Developer terms](https://brabble.ai/developers) permit commercial row reuse with source credit and links, prohibit an unattributed full mirror and require organizer linking. Obtain key and confirm caching/retention, geographic scope and API documentation conflicts before activation. |
| Devpost | Direct event and project pages challenged with 403 | Prohibited by documented conditions for crawling; licensed feed pending | [Terms](https://info.devpost.com/legal/terms-of-service) restrict manual and automated crawlers/scrapers. Seek a licensed feed or written partnership; do not evade challenge. |
| DoraHacks | Public directory pages 200; project fields not validated | Terms unresolved | Confirm BUIDL and bounty reuse, public visibility, attribution and approved API/export with platform. [Organizer settings](https://dashboard.dorahacks.io/hackathon/%24demo/settings/general) show Build visibility can be controlled. |
| Devfolio | Public event and project pages 200 | Written authorization pending for corpus use | [Organizer project CSV guide](https://guide.devfolio.co/docs/guide/organizer-dashboard/projects-tab) provides an authorized export path for an organizer's own event. Seek organizer or platform rights for a scoped sample and retention. |
| ETHGlobal | Public showcase and event-linked project 200 | Written authorization pending | Seek approved historical export or written reuse terms for project descriptions, awards and repositories. Public page access alone does not grant corpus rights. |
| lablab.ai | Public apps and event-linked project 200 | Written authorization pending | Seek application corpus permission, attribution, award status and retention terms. Public visibility is insufficient for automated commercial extraction. |
| TAIKAI | Public project showcase page 200; rendered cards inconclusive | Terms unresolved | [FAQ](https://taikai.network/faq) notes access controls for some projects. Seek promoter/platform-approved export and exclude nonpublic projects. |
| MLH | Public season event directory 200 | Terms unresolved | Ask for event feed or permission for discovery metadata; verify organizer links and any attribution requirements. |
| HackerEarth | Public challenges directory 200 | Terms unresolved | Ask for a hackathon-specific feed or license; its Recruit API is unrelated. |
| Cerebral Valley | Public AI event directory 200 | Terms unresolved | Ask for approved event feed, reuse and attribution terms. |
| Encode Club | Public JavaScript site 200; programme records inconclusive | Terms unresolved | Ask organizer for official brief and programme reuse scope. |
| GitHub | Official documented API; no new corpus probe in this pass | Limited permission by API terms and repository license | Use [REST API](https://docs.github.com/en/rest) under its rate and privacy terms; review each repository's license before content reuse. A repository is not proof of event participation. |
| HackRep | Public research dataset page; no new download in this pass | Written authorization pending | Review dataset license and underlying repository rights before ingesting records. |
| Official organizers | Public event pages vary | Event-specific permission | Obtain organizer-confirmed rules snapshot, revisions and reuse conditions per event. |

Pending replies and negotiations are independent follow-up work. A nonresponsive provider remains permission pending or terms unresolved, not technically blocked. Every production connector requires a recorded access method, permitted use, attribution, retention, rate limit, credential handling and revocation procedure before activation.
