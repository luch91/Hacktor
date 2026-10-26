# ADR-000: Keep M0 remote changes disabled

**Status:** Accepted for M0

## Context

The workspace began empty. The owner identified `luch91` as the authorized GitHub account, but cached GitHub authentication was invalid and no exact remote repository existed. Cloudflare account authorization and resource inventory were not yet verified.

## Decision

Build and test the complete local M0 foundation. Keep remote resource identifiers as explicit placeholders, keep source connectors disabled, and use manual environment-gated deployment workflows. Do not create a GitHub repository, Cloudflare resource, route, DNS record, or deployment until its account and target are verified.

## Consequences

Local acceptance evidence can proceed. Remote workflow status and deployment status remain unknown and therefore have no README badges. The first staging action requires a separate authorization decision after resource inventory.
