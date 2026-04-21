# Business Module: Work Item Index And Filter

Module ID: `work-item.index-and-filter`

## Purpose

Provide an index screen for report-like work items with normalized list loading, filtering, sorting,
and route handoff into the next workflow.

## User Roles

- worker or coordinator browsing outstanding work items
- admin who needs a normalized work index across sites or organizations

## Entry Conditions

Enter from a site or organization hub that needs an index of reusable work items.

## State Model

Builds on `platform-work-item.collection-shell` and adds report-specific route resolution, item
badges, and entry-point affordances.

## User Journeys

1. Open the work-item index.
2. Filter or sort the work-item rows.
3. Open an existing item or branch into create flow.

## API Contracts

- `GET /api/safety/reports/site/{siteId}/full?limit=50`
  - request: authenticated proxy request with site id and list query parameters
  - response: report rows normalized into the work-item index model used by both web and mobile shells

## Server Touchpoints

- `app/api/safety/[...path]/route.ts`
- external upstream `FastAPI /api/v1/reports/site/{siteId}/full`

## Performance Guardrails

- Work-item index list fetch
  - target: <= 8000ms, <= 3000000 bytes
  - cache: shared site report index cache with force-reload escape hatch
  - invalidation: site switch, explicit reload, successful create/update on the same site

## Invariants

- The same normalized row model drives list rendering, empty state, and navigation intent.
- Filtering and sorting do not lose route-derived context.
- List fallback rules stay consistent between desktop and compatible mobile shells.

## Failure Modes

- route context is incomplete: surface fallback resolution rather than crashing
- one item row is malformed: keep the list usable and isolate the bad row
- data refresh fails after first load: preserve the last visible index

## Industry Variability

Allowed changes are row badges, column sets, and creation entry labels. The list/filter state model
should remain the same across industries.

## Composition Examples

- Technical-guidance reports in construction-safety
- Audit tasks in manufacturing
- Case intake queues in healthcare operations

## Non-portable Areas

Specific report kind names and site terminology are industry-pack concerns.
