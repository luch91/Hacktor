# Responsive design QA status

Target widths: 320, 390, 768, 1024, 1365 and 1440 pixels, in dark and light mode.

CSS rules define a wide editorial two-part hero, a stacked hero at 768 and below, and a compact navigation row. Studio uses three zones on wide screens, a two-zone composition on intermediate screens, and its existing separate Explore / Inspect panels at phone widths. Constellation overflows within a labeled and focusable region, while List reflows into single-column rows.

Rendered viewport inspection remains pending. The local Worker could not start in this execution environment (`uv_interface_addresses` system error), and the Playwright Chromium download produced an invalid archive. No screenshots or page-overflow pass are claimed. Repeat the complete viewport matrix on a host where Wrangler and Chromium run before owner review.
