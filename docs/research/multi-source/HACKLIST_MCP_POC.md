# HackList MCP read-only proof of concept

Observed 2026-10-26 UTC. Scope: a small serial sample, no credential, no bulk page crawl. Endpoint: `https://hacklist-mcp.samuelsuccess234.workers.dev/mcp`. Implementation: `https://github.com/mrfomoweb3/hacklist-mcp`. Original structured feed: `https://hacklist.io/api/opportunities`.

| Request | HTTP | Latency | Observed result |
| --- | ---: | ---: | --- |
| GET `/` | 200 | 1687 ms | `hacklist-mcp 0.2.0`; identifies POST `/mcp`. |
| GET `/healthz` | 200 | 697 ms | `ok:true`, version `0.2.0`. |
| JSON-RPC `initialize` | 200 | 731 ms | Protocol `2025-03-26`, server `hacklist-mcp` version `0.2.0`, tools capability. |
| `tools/list` | 200 | 1179 ms | Eight tools: `search_opportunities`, `get_opportunity`, `best_opportunities`, `whats_new`, `closing_soon`, `hacklist_overview`, `search`, `fetch`. |
| `hacklist_overview` | 200 | 1174 ms | `data_source:feed`; `data_as_of:2026-10-26T12:19:50.214Z`; 88 loaded, 80 after duplicate collapse; reported `duplicate_groups:16`. |
| `search_opportunities`, AI | 200 | 635 ms | 33 matches, first OpenCV AI Competition. |
| `search_opportunities`, Web3 | 200 | 756 ms | 16 matches, first HackMeridian 2026. |
| `search_opportunities`, online | 200 | 906 ms | 40 matches. |
| `search_opportunities`, closing within 14 days | 200 | 785 ms | 21 matches. |
| `get_opportunity`, OpenCV ID | 200 | 767 ms | 28 keys, including organizer, deadline, apply link, category, description, eligibility, posted date and duplicate IDs. |
| `get_opportunity`, HackMeridian ID | 200 | 712 ms | 27 keys. |
| `whats_new`, 7 days | 200 | 650 ms | 11 matches; sample posted 2026-10-25. |
| `closing_soon`, 7 days | 200 | 780 ms | 23 matches; sample HackMeridian. |
| `get_opportunity`, nonexistent UUID | 200 | 1295 ms | JSON-RPC result `isError:true`, explicit no-match message. |
| `search_opportunities`, unmatched string | 200 | 653 ms | `total_matches:0`, no error. |

The direct feed returned HTTP 200 JSON. An initial response reported 95 items in 2868 ms. A later response reported 88 items, `generated_at:2026-10-26T12:19:50.214Z`. The discrepancy is an observed snapshot or cache variation, so the count must be treated as a timestamped observation, not a stable total. A third small fetch returned HTTP 200. The overview explicitly reported `feed`, so the page fallback did not occur in these successful MCP calls.

The [client source](https://github.com/mrfomoweb3/hacklist-mcp/blob/main/src/client.ts) shows a consequential fallback: if the feed is unavailable, it can read the homepage, sitemap and as many as 260 detail pages. Production use must disable or separately authorize this behavior and apply a strict request cap. The proof of concept did not request `include_closed` or `refresh`. The [Worker source](https://github.com/mrfomoweb3/hacklist-mcp/blob/main/src/worker.ts) exposes the health and stateless MCP routes; the [tool source](https://github.com/mrfomoweb3/hacklist-mcp/blob/main/src/tools.ts) defines duplicate handling and error behavior.

## Field and original-page comparison

The [OpenCV AI Competition HackList listing](https://hacklist.io/hackathon/cba14ac7-5b2f-4114-af48-e80d06556253) and [HackMeridian listing](https://hacklist.io/hackathon/530479b9-afbb-4c92-9c71-ce38f6dcab97) showed the same title, organizer, category, format, deadline, summary and outbound application link as the corresponding MCP records. The pages did not independently establish a structured eligibility decision, prize breakdown or last-update timestamp. OpenCV's MCP record had `last_updated_on_hacklist:null`, `team_size:null`, `region_locked:null` and empty `prize_notes`. Its prize text mixed cash and AWS credits while `prize_is_cash:true`; consumers must retain the source text and avoid claiming the full amount is cash. A HackList `Verified` display label is not organizer verification.

The overview reported 88 loaded and 80 after duplicate collapse. The OpenCV record named another listing ID as duplicate. `duplicate_groups:16` is the tool's field name; it must not be interpreted as 16 independently confirmed duplicate clusters without inspecting the algorithm. One PowerShell JSON parser failed on case-variant `Both` and `BOTH` keys; parsing as a case-sensitive hashtable succeeded. This is a client compatibility issue, not an HTTP failure.

## Decision

Technical status: **working public API or feed**, with a live working community MCP. Integration authorization: **written authorization pending** for HackList data storage, transformation and commercial display. The MCP repository's MIT license applies to its code, not automatically to HackList's listings. Official MCP ownership and data reuse are pending Beni's reply. This pending decision is independent of the technical feasibility finding and does not block closure of this planning phase.
