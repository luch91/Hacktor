# Source priority matrix

Status: planning judgment, not a measured market-share ranking or connector authorization. Scores use the evidence in [SOURCE_ECOSYSTEM_ASSESSMENT.md](SOURCE_ECOSYSTEM_ASSESSMENT.md) checked 2026-10-26. A high value score cannot bypass missing permission. No source is currently build-ready.

## Weighted assessment

Score each factor 0, 1, or 2 for absent/unknown, partial, or strong documented value. Weights total 100: unique discovery `D=15`, historical depth `H=15`, originality value `O=15`, official rules reliability `R=15`, integration feasibility `F=15`, data quality and freshness `Q=10`, lower operational cost `C=7`, and lower maintenance burden `M=8`. Weighted score equals the sum of `factor_score * weight / 2`, out of 100. An unknown is scored zero, not assumed adverse fact. This is a reproducible prioritization hypothesis for owner review; validate with permitted samples before using it as a procurement decision.

| Source | D | H | O | R | F | Q | C | M | Score | Blocking dependency |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Devfolio | 2 | 2 | 2 | 1 | 1 | 1 | 1 | 1 | 72.5 | Organizer-approved CSV or platform license, scope and retention. |
| Devpost | 2 | 2 | 2 | 1 | 0 | 2 | 0 | 0 | 62.5 | Written licensed feed or partnership; published terms bar crawling. |
| ETHGlobal | 1 | 2 | 2 | 1 | 0 | 2 | 0 | 0 | 55 | Authorized historical export, award rights and reuse terms. |
| lablab.ai | 1 | 2 | 2 | 1 | 0 | 2 | 0 | 0 | 55 | Authorized application corpus and reuse agreement. |
| DoraHacks | 1 | 2 | 2 | 1 | 0 | 1 | 0 | 0 | 50 | Platform permission for BUIDL and bounty records. |
| GitHub | 0 | 1 | 2 | 0 | 2 | 1 | 1 | 1 | 50 | App, API and repository-license policy, rate and privacy review. |
| Official organizers | 1 | 0 | 0 | 2 | 1 | 2 | 1 | 1 | 47.5 | Event-specific permission and revision provenance. |
| HackRep | 0 | 2 | 2 | 0 | 1 | 1 | 0 | 0 | 42.5 | Dataset license and underlying repository rights review. |
| Brabble | 2 | 0 | 0 | 0 | 1 | 1 | 2 | 1 | 38.5 | Key, contract conflicts, geography, attribution and reuse review. |
| TAIKAI | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 0 | 35 | Platform or promoter license; restricted projects excluded. |
| MLH | 2 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 27.5 | MLH or event-approved event feed; private participant data excluded. |
| HackerEarth | 1 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 20 | Hackathon content agreement; Recruit API is unrelated. |
| Cerebral Valley | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 12.5 | Documented feed or reuse permission. |
| HackList | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 12.5 | Documented feed or reuse permission. |

Scores reflect current evidence, not intrinsic source quality. Devpost's value is high while feasibility is zero under its current terms. The official-organizer row scores modestly on aggregate coverage but is mandatory for verifying a particular event. Brabble's discovery value does not extend to project originality.

## Role-specific priorities and sequence

| Intelligence role | Priority order to negotiate or pilot | Reason and stop condition |
| --- | --- | --- |
| Hackathon discovery | Organizer-authorized feeds and Devfolio organizer export; then Brabble, MLH, Devpost licensed feed; then regional AI/Web3 indexes. | Seek independent geography and domains. Brabble can be a narrow India-heavy lead source after its contract is resolved. No aggregator confirms rules. |
| Verified challenge requirements | Exact official organizer snapshot first; platform-hosted organizer rules second, with publisher verification. | Block verified status if publisher, revision, or permission cannot be established. |
| Historical project intelligence | Devfolio authorized export, ETHGlobal and lablab.ai licensed corpora, then Devpost or DoraHacks partnerships and HackRep rights review. | ETHGlobal gives event-linked Web3 mechanisms and results; lablab.ai adds AI application and stack patterns. Their value justifies access negotiations, not scraping. |
| Comparable technical implementations | GitHub official API first after rights review, with HackRep as an optional licensed research corpus. | Code can explain implementation but cannot verify event participation or awards. |

Suggested negotiation sequence: secure one organizer-authorized event and project sample; validate source and permission records; obtain a GitHub App and rights policy; seek ETHGlobal and lablab.ai historical exports; resolve Devpost and DoraHacks agreements; then broaden discovery with Brabble and other permitted feeds. Every source has its own gate and can be declined without changing the four-layer architecture. API requests, hosting, storage, model extraction, reviewer labor, licensing fees, and maintenance must be costed after access terms are known; zero in this table means unknown cost evidence, not free operation.
