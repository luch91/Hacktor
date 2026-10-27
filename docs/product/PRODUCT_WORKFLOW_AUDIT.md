# Product workflow audit

Audit target: `feat/m1-deep-ideation` at `e1d3edfc306d4631601223a4deece4c2c10cd3e9`. The local Worker backed application and existing browser journeys are the behavior baseline.

| Confirmed behavior | User impact | Severity | Sprint remedy |
| --- | --- | --- | --- |
| `App.tsx` restored every private session into Studio, even when context was unconfirmed. | Refresh interrupted review. | High | Restore the review screen and preserve its unconfirmed draft in session storage. |
| Generation and blueprint actions read job status once after submission. | Queue latency appeared as missing output. | High | Poll the authoritative job record, retain its ID for refresh, and never submit a replacement while it is active. |
| Comparison and combine used the first different array entry. | Builders could combine the wrong parent. | High | Require an explicit second version and show both chosen directions. |
| Stage rail was a static list and displayed blocked state as a vague review cue. | Builders could not navigate or interpret progress. | Medium | Make stages navigable and show the backend status verbatim. |
| Lineage exposed shortened IDs rather than parent and child names. | Version relationships were hard to read. | Medium | Resolve names from stored ideas and display edge kind. |
| Blueprint exposed only a download link. | Builders could not inspect the artifact before export. | Medium | Fetch and show the stored Markdown for the bound version. |
| Research and evidence coverage appeared mainly in a compact inspector field. | The distinction between hypotheses and verified evidence was weak. | Medium | Add a dedicated research view with source limitations. |

The backend already preserves exact original idea text, scoped access, immutable versions, two-parent edges, CSRF, idempotency and job lease fencing. This sprint leaves those mechanisms in place. A multi-workspace dashboard and live intelligence need new product contracts and permissions.
