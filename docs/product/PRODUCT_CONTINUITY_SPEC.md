# Product continuity specification

Baseline: `f2d11d00b142fb931ac243412ab14f77c3ec72ba` on `feat/m2-product-workflow`.

One valid guest capability owns one active workspace. The browser remembers its session ID, selected idea and stage. The server supplies context, draft, ideas, lineage, jobs, Map hypotheses and blueprint history. Reading a stage does not change its backend status.

## Return sequence

1. Read the remembered session through the current guest capability.
2. Read its owner-scoped draft, ideas, active jobs, stored blueprints and opportunity hypotheses.
3. Use the draft only while context is unconfirmed and its base revision matches the session revision.
4. Restore a selected idea only if it remains in the returned version list.
5. Resume polling an unfinished server job without submitting another one.
6. Show expired or missing access on the landing screen without exposing saved private content.

The home screen offers continuation of the current workspace. Creating another guest session replaces browser access to the prior guest identity. A multi-workspace dashboard requires an owner identity and capability model that this milestone does not introduce.

## Data boundaries

The original user-authored idea remains in `ideation_sessions.original_idea_text`. Draft and confirmed interpretation live separately. Idea versions and blueprints remain immutable. No connector, external research or live inference is enabled.
