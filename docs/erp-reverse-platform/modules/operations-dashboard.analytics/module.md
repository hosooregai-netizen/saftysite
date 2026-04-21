# Business Module: Operations Dashboard Analytics

Module ID: `operations-dashboard.analytics`

## Purpose

Expose summary and detail analytics with basis-period switching while preserving a stable visible
dataset during compatible refreshes.

## User Roles

- operations admin reviewing KPIs
- manager exporting summarized analytics

## Entry Conditions

Enter from a dashboard analytics section where period switching and detail drilling are first-class.

## State Model

Builds on `platform-dashboard.snapshot-cache` and adds summary cards, detail table state, and
selected basis period.

## User Journeys

1. Load analytics summary.
2. Switch basis month or period.
3. Inspect detail rows without resetting the whole analytics shell.
4. Export the normalized analytics view.

## API Contracts

- `GET /api/admin/dashboard/analytics?period=month`
  - request: admin-authenticated request with `period`
  - response: analytics summary cards and period metadata
- `GET /api/admin/dashboard/analytics/month-detail?period=month&basis_month=YYYY-MM`
  - request: admin-authenticated request with `period` and `basis_month`
  - response: month-detail aggregates keyed to the selected basis month
- `GET /api/admin/dashboard/analytics/detail?period=month&basis_month=YYYY-MM&detail_scope=month`
  - request: admin-authenticated request with detail scope query
  - response: normalized detail table rows for the visible analytics table

## Server Touchpoints

- `app/api/admin/dashboard/analytics/route.ts`
- `app/api/admin/dashboard/analytics/month-detail/route.ts`
- `app/api/admin/dashboard/analytics/detail/route.ts`
- `server/admin/analyticsSnapshot.ts`

## Performance Guardrails

- Analytics summary
  - target: <= 1500ms, <= 1000000 bytes
  - cache: summary request cached independently from detail requests
  - invalidation: basis period change that affects summary scope, explicit analytics refresh
- Analytics month detail
  - target: <= 3000ms, <= 2000000 bytes
  - cache: month-detail cache keyed by `basis_month`
  - invalidation: basis month change, explicit detail reload
- Analytics detail table
  - target: <= 3000ms, <= 2000000 bytes
  - cache: detail-table cache keyed by period, basis month, and detail scope
  - invalidation: detail-scope toggle, basis month change, explicit table reload

## Invariants

- Summary and detail requests remain independently cacheable.
- Period switching does not blank the prior compatible dataset during refresh.
- Export consumes normalized analytics data, not raw payload fragments.

## Failure Modes

- detail request fails: keep summary visible and surface scoped detail error
- basis period change fails: restore previous compatible analytics state
- export fails: preserve selected basis period and detail context

## Industry Variability

Allowed changes are KPI cards, period labels, and detail column sets. The summary/detail split and
period-switch lifecycle should remain stable.

## Composition Examples

- Construction-safety pack can show guidance counts and workforce aggregates.
- A hospital ERP could reuse the same module for incident analytics and staffing summaries.

## Non-portable Areas

Metric definitions and some period labels are industry-specific.
