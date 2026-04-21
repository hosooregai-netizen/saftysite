# Reverse Spec - Admin Analytics Dashboard

## Recovery Slice

- Recovery Slice ID: `admin-analytics-dashboard`
- Top-level contract: `admin-control-center`
- Reverse spec status: `done`

## Purpose

- Recover the `/admin` analytics dashboard that sits under the shared control-center shell.
- Preserve summary loading, basis-month switching, detail-table pagination, and export behavior without tying the slice back to overview-specific queues.

## Source of Truth

- main section: [features/admin/sections/analytics/AnalyticsSection.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/analytics/AnalyticsSection.tsx)
- section state: [features/admin/sections/analytics/useAnalyticsSectionState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/analytics/useAnalyticsSectionState.ts)
- summary and detail helpers: [features/admin/sections/analytics/analyticsSectionHelpers.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/analytics/analyticsSectionHelpers.ts)
- chart shell: [features/admin/sections/analytics/AnalyticsCharts.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/analytics/AnalyticsCharts.tsx)
- detail shell: [features/admin/sections/analytics/AnalyticsDetailSection.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/analytics/AnalyticsDetailSection.tsx)
- control-center model builders: `analyticsModel`, `analyticsSupport`, `analyticsExport`
- admin API client: [lib/admin/apiClient.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/admin/apiClient.ts)
- export client: [lib/admin/exportClient.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/admin/exportClient.ts)

## Feature Goal

Controllers must be able to:

- read summary cards and trend charts for the current analytics scope
- filter by period, user, headquarter, contract type, and submitted query
- switch the basis month without collapsing the whole analytics shell
- inspect employee and site detail tables for the chosen basis month
- export the current analytics view

## User Role

- primary user: admin/controller
- preconditions:
  - authenticated admin session
  - shared admin shell already mounted

## Entry and Scope

- this slice is the `/admin?section=analytics` half of `admin-control-center`
- overview cards and admin photo management are separate recovery slices under the same smoke id

## Data Contracts

### Summary APIs

- `GET /api/admin/dashboard/analytics`
- request fields used by the slice:
  - `period`
  - `query`
  - `headquarter_id`
  - `user_id`
  - `contract_type`

### Detail APIs

- `GET /api/admin/dashboard/analytics/month-detail`
- request fields used by the slice:
  - the same scope filters as summary
  - `basis_month`

### Lookup API

- `GET /api/admin/directory/lookups`
- this slice only reads:
  - headquarters
  - users
  - contractTypes

### Export

- server workbook export is preferred
- analytics export uses the currently normalized analytics model rather than raw response fragments

## Caching and Persistence

- analytics lookups are cached under the admin session cache key `analytics-lookups`
- summary responses are cached per summary request key
- month-detail responses are cached per summary request key plus basis month
- basis-month changes should not invalidate summary-only cache
- when cached data exists:
  - keep rendering it while a compatible refresh is in flight

## State Model

### Primary local state

- `period`
- `query`
- `headquarterId`
- `userId`
- `contractType`
- `basisMonthState`
- `employeeSort`
- `employeePage`
- summary request state
- month-detail request state
- lookup state

### Derived state

- `summaryRequestKey`
- `basisMonth`
- `summaryAnalytics`
- `isSummaryInitialLoading`
- `isSummaryRefreshing`
- `analyticsMonthDetail`
- `isAnalyticsDetailInitialLoading`
- `isAnalyticsDetailRefreshing`
- `scopeChips`
- `pagedEmployeeRows`
- `employeeTotalPages`

## Business Rules

### Summary/detail split

- summary and month-detail are not one combined request lifecycle
- basis-month changes refetch month detail only
- scope changes refetch both summary and month detail

### Cache continuity rule

- when a new request starts and compatible cached data exists:
  - keep the previous visible dataset rendered
  - surface refresh state without collapsing to empty analytics

### Basis-month rule

- chosen basis month must normalize against `availableMonths`
- if the current token is invalid:
  - prefer the current month when available
  - otherwise fall back to the first available month

### Export rule

- export uses the current normalized analytics model
- current filters and basis-month context must already be reflected in the exported data

## UI Composition

- section header and scope filters
- summary cards
- trend chart section with basis-month navigation
- detail section with employee/site views and pagination

## Interaction Flows

### Initial load

1. read cached lookups and cached analytics responses when available
2. render visible cached data immediately when possible
3. refresh lookups, summary, and month detail in the background as needed

### Basis-month switch

1. user changes month from the month input or previous/next buttons
2. client normalizes the target month
3. only month-detail refetches
4. summary cards stay visible

### Scope change

1. user changes period or filter scope
2. summary request key changes
3. summary and month-detail re-resolve against the new scope
4. the previous visible dataset stays mounted until the replacement data is ready

## Error Handling

- lookup fetch failures are logged and do not hard-block the section
- summary and month-detail track separate load errors
- visible cached data should remain rendered whenever the failed request does not invalidate the currently shown model

## Recovery Checklist

- [ ] analytics summary loads for the current admin session
- [ ] basis-month changes refetch month detail without forcing summary reload
- [ ] cached analytics data stays visible during refresh
- [ ] filter chips reflect current scope
- [ ] export remains reachable from the analytics slice
