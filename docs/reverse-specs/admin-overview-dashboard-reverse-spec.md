# Reverse Spec - Admin Overview Dashboard

## Purpose

- Recover the `/admin` controller overview dashboard that summarizes site status, quarterly material readiness, dispatch aging, and operational follow-up tables.
- Preserve the hybrid model where the server overview response is preferred but local fallback model generation still protects rendering.

## Source of Truth

- main section: [features/admin/sections/overview/AdminOverviewSection.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/overview/AdminOverviewSection.tsx)
- state hook: [features/admin/sections/overview/useAdminOverviewSectionState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/overview/useAdminOverviewSectionState.ts)
- KPI cards: [features/admin/sections/overview/OverviewVisualCards.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/overview/OverviewVisualCards.tsx)
- unsent table: [features/admin/sections/overview/OverviewUnsentReportsSection.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/overview/OverviewUnsentReportsSection.tsx)
- material gap table: [features/admin/sections/overview/OverviewMaterialGapSection.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/overview/OverviewMaterialGapSection.tsx)
- control-center model builders:
  - [features/admin/lib/buildAdminControlCenterModel.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/lib/buildAdminControlCenterModel.ts)
  - `overviewModel`
  - `overviewExport`
- admin API client: [lib/admin/apiClient.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/admin/apiClient.ts)
- export client: [lib/admin/exportClient.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/admin/exportClient.ts)

## Feature Goal

Controllers must be able to:

- see high-level operational health at a glance
- drill into site-status, material-gap, and dispatch-aging buckets
- review prioritized quarterly-management and contract-ending-soon rows
- export the overview dataset as Excel
- refresh overview data without leaving the page

## User Role

- primary user: admin/controller
- preconditions:
  - authenticated admin session
  - dashboard shell provides `ControllerDashboardData` and report list fallback inputs

## Entry and Scope

- this is the `/admin` overview section
- props required at mount:
  - `currentUserId`
  - `data: ControllerDashboardData`
  - `reports: SafetyReportListItem[]`
  - optional `onUpdateSiteDispatchPolicy`

## Data Contracts

### Primary response

- `GET /api/admin/dashboard/overview`
- preferred response type: `SafetyAdminOverviewResponse`

Important response groups used by the screen:

- `siteStatusSummary`
- `quarterlyMaterialSummary`
- `deadlineSignalSummary`
- `unsentReportRows`
- `priorityQuarterlyManagementRows`
- `endingSoonRows`

### Fallback model

- local fallback is built from:
  - `ControllerDashboardData`
  - report list input
- builder:
  - `buildAdminOverviewModel(data, reports)`

This fallback is used when remote overview data is absent or partially malformed.

### Export

- overview export uses `exportAdminWorkbook('overview', getOverviewExportSheets(model))`
- export model is assembled from the currently normalized and sorted visible rows

## Caching Rules

- overview response is cached under admin session cache key `overview`
- cache is scoped by `currentUserId`
- if cached value exists:
  - render it immediately
  - use it as the initial `lastSyncedAt`
- if cache is fresh:
  - skip immediate remote refresh

## State Model

### Primary local state

- `overviewResponse`
- `error`
- `isRefreshing`
- `policyUpdatingSiteId`
- `lastSyncedAt`
- `materialSort`
- `materialPage`
- `unsentSort`
- `unsentPage`

### Derived state

- `fallbackOverview`
- `overview`
- `normalizedUnsentReportRows`
- `normalizedPriorityQuarterlyManagementRows`
- `visibleMaterialRows`
- `visibleMaterialQuarterLabel`
- `visibleUnsentReportRows`
- `sortedMaterialRows`
- `sortedUnsentReportRows`
- `materialTotalPages`
- `currentMaterialPage`
- `pagedMaterialRows`
- `unsentTotalPages`
- `currentUnsentPage`
- `pagedUnsentReportRows`

## Business Rules

### Remote vs fallback merge

- remote overview wins when its section is present and valid
- fallback overview fills gaps when a remote substructure is empty or malformed
- this rule is applied per section, not all-or-nothing

### Current-year selection rule

- material-gap and unsent-report tables prefer rows for the current year
- if no current-year rows exist, use the latest available row set

### Material-gap sorting

Supported keys:

- `siteName`
- `headquarterName`
- `educationMissing`
- `measurementMissing`
- `missingTotal`

Default:

- `missingTotal desc`

### Unsent-report sorting

Supported keys:

- `siteName`
- `headquarterName`
- `reportTitle`
- `assigneeName`
- `visitDate`
- `unsentDays`

Default:

- `unsentDays desc`

### Pagination

- overview table page size uses shared helper constant
- both material-gap and unsent-report tables paginate client-side after normalization and sorting

### Refresh rules

- refresh sets `isRefreshing=true`
- uses server overview API
- on success:
  - cache response
  - update `overviewResponse`
  - reset `lastSyncedAt`

### Export rules

- export uses the currently derived overview model, not raw server payload
- exported material rows must respect current sorting
- exported unsent rows must respect current sorting

## UI Composition

### Section 1: 운영 개요

- title: `운영 개요`
- sync timestamp
- refresh button
- Excel export button
- error banner
- visual KPI card row

### KPI cards

- donut card: `현장 상태`
- donut card: `교육/계측 자료 충족 상태`
- segmented bar card: `미발송 경과 현황`

Each KPI entry must be drillable via `href`.

### Section 2: 발송 관리 대상

Columns:

- 현장
- 보고서
- 지도요원
- 지도 실시일
- 미발송 경과
- 상태

Rows are clickable and navigate to `row.href`.

### Section 3: 우선 관리 분기 현황

- rendered by `OverviewPriorityQuarterlyManagementSection`
- should remain sourced from normalized priority-quarterly rows

### Section 4: 종료 임박 현장

- rendered by `OverviewEndingSoonSection`

### Section 5: 교육/계측 자료 부족 현장

Columns:

- 현장
- 사업장
- 교육 부족
- 계측 부족
- 교육 현황
- 계측 현황
- 총 부족

Rows are clickable and navigate to `row.href`.

## Interaction Flows

### Initial load

1. build fallback overview from shell data
2. load cached overview if present
3. if cache is stale or missing, fetch fresh overview from server
4. merge remote sections over fallback sections
5. render cards and tables from derived rows

### Refresh

1. user presses `새로고침`
2. remote overview API is called
3. cache is replaced
4. sync time updates
5. tables and cards rederive from the new response

### Sort and paginate

1. user changes table sort
2. reset page to 1
3. re-sort client-side
4. clamp page to valid range
5. render next slice

### Export

1. build export model from visible/sorted derived rows
2. call workbook export helper
3. save generated workbook

## Error Handling

- refresh error shows section-level banner
- cached or fallback data should still render if remote refresh fails
- malformed remote subsections must fall back gracefully without collapsing the whole page

## Non-Obvious Constraints

- this screen intentionally keeps a local fallback model so the overview can render even when server summary coverage is incomplete
- table rows are narrowed to current-year slices when possible, which means exported/visible subsets are intentionally not always the full raw server row arrays
- card drilldowns depend on `href` integrity from the server or fallback model builder

## Recovery Checklist

- [ ] overview renders from fallback model with no remote payload
- [ ] cached overview renders instantly when present
- [ ] remote refresh replaces stale sections but preserves fallback for missing ones
- [ ] KPI cards remain linkable
- [ ] unsent-report sorting and paging work
- [ ] material-gap sorting and paging work
- [ ] export includes the normalized/sorted rows
- [ ] refresh updates last sync timestamp

## Verification

- admin overview smoke
- targeted typecheck
- export workbook sanity check
