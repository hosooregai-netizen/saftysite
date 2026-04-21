# Platform Primitive: Dashboard Snapshot Cache

Module ID: `platform-dashboard.snapshot-cache`

## Purpose

Provide a reusable dashboard snapshot lifecycle for first paint, background refresh, and section-level
fallback merging.

## User Roles

- operator who needs a fast first paint
- admin/controller reviewing queue or analytics summaries
- composition builder who wants a standard dashboard cache primitive

## Entry Conditions

Enter when a dashboard shell mounts and needs cached data before remote refresh completes.

## State Model

The primitive owns snapshot bootstrap, stale-while-refresh behavior, and section-level merge policy.
It does not own the business meaning of rows or cards.

## User Journeys

1. Mount dashboard shell with cached snapshot.
2. Render the last known compatible snapshot immediately.
3. Refresh the remote data in place.
4. Merge section-level results without wiping unrelated visible sections.

## API Contracts

- `GET /api/admin/dashboard/overview`
  - request: admin-authenticated request with optional cached session context
  - response: overview sections, queue cards, summary counts, export-visible rows
- `GET /api/admin/dashboard/analytics?period=month`
  - request: admin-authenticated request with `period` query
  - response: analytics summary snapshot with normalized KPI cards and basis-period metadata

## Server Touchpoints

- `app/api/admin/dashboard/overview/route.ts`
- `app/api/admin/dashboard/overview/routeFallbacks.ts`
- `server/admin/overviewPolicyOverlay.ts`
- `server/admin/overviewRouteCache.ts`
- `app/api/admin/dashboard/analytics/route.ts`
- `server/admin/analyticsSnapshot.ts`

## Performance Guardrails

- Admin overview snapshot
  - target: <= 7000ms, <= 2500000 bytes
  - cache: admin session cache plus route-level snapshot reuse for first paint
  - invalidation: report/site/assignment mutations that change overview counts
- Admin analytics summary snapshot
  - target: <= 1500ms, <= 1000000 bytes
  - cache: independent analytics summary snapshot keyed by period
  - invalidation: analytics refresh action and upstream safety mutations that affect aggregates

## Invariants

- First paint may use cache, but the shell must converge to the latest compatible remote snapshot.
- Refresh should not blank the shell if a compatible snapshot already exists.
- Merge behavior is section-aware, not all-or-nothing.

## Failure Modes

- remote refresh fails: keep the previous compatible snapshot visible
- one section fails: preserve other sections and surface scoped error state
- export or downstream consumers must read normalized snapshot state, not raw payload fragments

## Industry Variability

Allowed override points:

- `dashboard.queueDefinitions`
- `dashboard.defaultFilters`
- `dashboard.exportColumns`

## Composition Examples

- `operations-dashboard.queue-overview` uses this primitive for queue cards and exports.
- `operations-dashboard.analytics` uses this primitive for summary/detail persistence during refresh.

## Non-portable Areas

Exact upstream payload shapes are not portable. Those belong in adapters, not in this primitive.
