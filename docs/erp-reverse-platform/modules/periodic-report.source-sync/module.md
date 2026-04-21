# Business Module: Periodic Report Source Sync

Module ID: `periodic-report.source-sync`

## Purpose

Synchronize a periodic-report editor with source documents, previous reports, and recalculated
derived content while keeping the dominant editor state stable.

## User Roles

- editor user composing a periodic report
- reviewer who expects reused source material to stay traceable

## Entry Conditions

Enter when a periodic-report editor needs to resolve source records or reuse the most relevant prior
report before editing.

## State Model

Owns source selection state, existing-report resolution, recalculation intent, and synchronized editor
draft hydration.

## User Journeys

1. Enter the periodic-report editor.
2. Resolve candidate source reports or prior report artifacts.
3. Select or confirm a source.
4. Recalculate the derived report content inside the editor.

## API Contracts

- `GET /api/safety/reports/by-key/{reportKey}`
  - request: authenticated proxy request with `reportKey`
  - response: existing report payload or 404, which is interpreted as draft creation seed
- `GET /api/safety/reports/site/{siteId}/quarterly-summary-seed`
  - request: authenticated proxy request with site id, quarter range, and selected source keys
  - response: recalculated quarterly summary seed used to rewrite derived report sections

## Server Touchpoints

- `app/api/safety/[...path]/route.ts`
- external upstream `FastAPI /api/v1/reports/by-key/{reportKey}`
- external upstream `FastAPI /api/v1/reports/site/{siteId}/quarterly-summary-seed`

## Performance Guardrails

- Quarterly report lookup
  - target: <= 2500ms, <= 1500000 bytes
  - cache: editor bootstraps from existing report when available and keeps draft on 404
  - invalidation: route-key change, save of the same report, auth or site context reset
- Quarterly summary seed recalculation
  - target: <= 5000ms, <= 2000000 bytes
  - cache: no long-lived cache; optimistic editor state may bridge the reload
  - invalidation: quarter change, selected source change, explicit source refresh

## Invariants

- Source selection and editor hydration stay synchronized.
- Recalculation uses normalized source data rather than piecemeal field patches.
- Existing-report reuse does not silently discard local draft intent.

## Failure Modes

- source lookup fails: editor remains available with explicit retry path
- source recalculation fails: preserve the prior draft state
- prior artifact missing: degrade to manual source selection rather than crash

## Industry Variability

Allowed changes are report period labels, source precedence rules, and field mapping policies.

## Composition Examples

- Quarterly reporting in construction-safety
- Monthly compliance summaries in logistics
- Shift-based audit summaries in manufacturing

## Non-portable Areas

Exact report schema and legal narrative sections remain industry-specific.
