# Draft persistence contract

Migration `0006_m2_product_continuity.sql` adds `session_context_drafts`, keyed by session ID. It stores the unconfirmed context JSON, its base session revision, an independent draft revision and update time. Cascading session deletion removes the draft. The confirmed context stays in `ideation_sessions.context_json` until explicit confirmation.

`GET /api/v1/sessions/{id}/draft` returns `{ draft, context_revision }`, where draft may be null. `PUT` requires the existing guest capability, matching CSRF token, a complete unconfirmed context, `base_context_revision` and `If-Match`. `If-Match: 0` creates the first draft. Later values must match the current draft revision. Successful writes increment it. Stale writes return `409 draft_revision_conflict`; a changed confirmed base returns `409 draft_base_conflict`. `DELETE` discards only the supplied revision.

The client waits 600 ms after editing, serializes saves, and tracks unsaved, saving, saved, failed and conflicting states. A newer local edit made during a pending response is saved after that response. A conflict gives the builder two explicit choices: load the saved version or replace it after reading its current revision. Failed saves leave edits visible with a retry control.

Confirmation uses the existing `PATCH /sessions/{id}/context` revision precondition. Its guarded session update and draft deletion share one D1 transaction. A stale confirmer cannot commit. A late autosave cannot recreate a draft after confirmation because the draft write checks that review is still required. The original idea column is never updated.

Draft survival depends on the same valid guest capability. This contract does not provide cross-device identity or recovery after capability expiry.
