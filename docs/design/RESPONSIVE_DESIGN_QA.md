# Gate 1 responsive design QA

Actual Worker-backed captures were made with Chromium 141 and a local D1 database in deterministic mode. The graph uses a three-column initial direction layout. Nine nodes have no intersecting bounding boxes in the recorded 1440px run; the selected branch and combination scroll into view within the map. Parent links are exposed in the inspector even when a parent is outside the current graph viewport.

| Width | Theme and view | Result |
| --- | --- | --- |
| 320 | Dark landing and Studio | Browser tests pass page-width assertions; internal map scrolls independently; Explore / Inspect remain available |
| 390 | Dark landing | Actual full-page capture available |
| 768 | Dark Studio | Actual full-page capture available; stage navigation and inspector reflow |
| 1024 | Dark Studio | CSS intermediate zone; direct screenshot still pending |
| 1365 | Dark Studio | CSS three-zone layout; direct screenshot still pending |
| 1440 | Dark and light landing, dark Studio | Actual full-page captures and node geometry recorded |

Light mode is captured on desktop. Full theme-by-width screenshots and touch gesture review at every specified width remain open for owner visual assessment. The graph's wide surface is deliberately internally scrollable. A List view offers the complete versions and same selection without horizontal exploration. The 2200px overview capture reveals the whole graph at once for relationship audit; it is evidence, not the default viewport.

The initial 320px landing overflowed by 6px due to theme labels in the header. The header spacing was corrected; both compact overflow tests now pass. Reduced motion disables the orbital animation by name, and the browser test checks that property.
