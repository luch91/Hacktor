# Blueprint history contract

The existing `blueprints` table and `idx_blueprints_idea` index remain authoritative. The milestone adds owner-scoped reads:

- `GET /api/v1/sessions/{id}/blueprints`: latest 100 artifacts across that session.
- `GET /api/v1/ideas/{id}/blueprints`: latest 100 artifacts for the exact immutable idea version.
- `GET /api/v1/blueprints/{id}`: one artifact, including its Markdown.
- Existing `GET /api/v1/blueprints/{id}/export.md`: unchanged export behavior.

Ordering is by creation time descending, then row insertion order. Each summary includes artifact ID, idea version ID, blueprint version, review-required flag and creation time. The UI filters history to the selected version, reopens a stored artifact by ID, and checks its returned idea version before display. New generations insert new rows and never replace old artifacts.

Reads join the blueprint through idea version and active session to the current guest owner. Unknown, cross-owner and deleting-session artifacts return 404. An expired capability returns 401 before querying private content.
