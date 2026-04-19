# Batch 28. Admin Session Cache Revisit Stability

## Why
- the admin analytics section now keeps cache-backed lookups and per-request analytics state separate so a fresh cached payload can be reused without immediately replacing the visible state
- the admin users section now resolves list responses by request key so returning to the section can reuse the fresh cached page before a new fetch is needed
- both changes are meant to reduce avoidable refetches and UI flicker when an operator revisits the same admin section during the same browser session

## What changed
- `features/admin/sections/analytics/useAnalyticsSectionState.ts`
  - reads lookup cache through a memoized cache envelope instead of mutating visible lookup state from a fresh-cache effect
  - keeps resolved analytics state scoped to the active request key and prefers a fresh cached payload when revisiting the same filter set
  - derives the selected chart year from the active analytics payload so cached data and the visible slice stay aligned
- `features/admin/sections/users/useUsersSectionState.ts`
  - replaces direct `rows` and `total` state with a resolved response keyed by the active request
  - reuses a fresh cached list response on section revisit and refreshes the matching cache entry after manual reloads
- mocked admin users smoke now proves that revisiting the `users` section within the same session does not trigger an extra list request before an explicit submit

## Proof
- `tests/client/admin/admin-users.spec.ts`
