# Platform Primitive: Work Item Collection Shell

Module ID: `platform-work-item.collection-shell`

## Purpose

Provide a standard list/index shell for work items that need loading, filtering, sorting, empty
state, and action affordances.

## User Roles

- worker or coordinator browsing a list of work items
- admin or supervisor narrowing a queue with filters
- composition builder reusing a common collection shell

## Entry Conditions

Enter when a product needs an index screen for report-like records with shared list behavior.

## State Model

Owns collection loading state, query/filter state, sort state, empty state, and selected row intent.
It does not own industry-specific record semantics.

## User Journeys

1. Load collection with route-derived context.
2. Apply filters or sorting without losing the dominant list state.
3. Open a row or secondary action from the collection shell.

## API Contracts

- `GET /api/safety/reports/site/{siteId}/full?limit=50`
  - request: authenticated proxy request with site id, limit, and optional list queries
  - response: report list payload whose rows are normalized into the shared collection shell

## Server Touchpoints

- `app/api/safety/[...path]/route.ts`
- external upstream `FastAPI /api/v1/reports/site/{siteId}/full`

## Performance Guardrails

- Collection shell list fetch
  - target: <= 8000ms, <= 3000000 bytes
  - cache: one-shot client index cache per site with explicit force reload
  - invalidation: site switch, explicit reload, successful work-item create/update/delete

## Invariants

- Filtering and sorting act on normalized list items, not raw payloads.
- Empty/loading/error states remain distinct.
- Query state survives compatible refreshes and route re-entry.

## Failure Modes

- loader fails before first data: show scoped error shell
- loader fails after data existed: preserve visible list and surface retry affordance
- malformed rows: skip or mark invalid rows without crashing the collection shell

## Industry Variability

Allowed override points:

- `collection.columns`
- `collection.defaultFilters`
- `collection.rowActions`

## Composition Examples

- `work-item.index-and-filter` composes this primitive for technical-guidance report lists.
- Other ERP domains can reuse it for inspection queues, shipment tasks, or case intake lists.

## Non-portable Areas

Industry-specific row labels, document kinds, and navigation targets stay above this primitive.
