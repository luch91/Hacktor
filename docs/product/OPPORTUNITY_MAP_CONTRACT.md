# Opportunity Map contract

`GET /api/v1/sessions/{id}/opportunities` reads the existing `opportunity_hypotheses` table and authoritative Map stage status. It returns stable hypothesis IDs, problem, beneficiary, working assumption, evidence reference IDs, creation time and `evidence_status: unverified`.

The current deterministic slate processor stores hypotheses from its first three cards. They are local working hypotheses. A completed Map stage does not imply organizer verification or external research. Empty storage produces an explicit empty state. The UI does not interpret reference IDs as verified citations.

The table has no distinct bottleneck field, no generation provenance column and no relation from an idea version to a hypothesis. The UI labels these gaps instead of inventing data. Future Diverge linkage should add a nullable provenance job ID and a separate `idea_opportunity_links` relation, with explicit user or generator selection. Those changes require a later contract and migration review.
