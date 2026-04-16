# Reverse Spec - Admin Reports List And Review Flow

## Purpose

- Recover the `/admin` all-reports surface used by controllers to search, sort, review, dispatch, export, and open reports.
- Preserve both table behavior and modal workflows for quality review and quarterly-report dispatch handling.

## Source of Truth

- main section: [features/admin/sections/reports/ReportsSection.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/reports/ReportsSection.tsx)
- section state: [features/admin/sections/reports/useReportsSectionState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/reports/useReportsSectionState.ts)
- table: [features/admin/sections/reports/ReportsTable.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/reports/ReportsTable.tsx)
- review dialog: [features/admin/sections/reports/ReportsReviewDialog.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/reports/ReportsReviewDialog.tsx)
- dispatch dialog: [features/admin/sections/reports/ReportsDispatchDialog.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/reports/ReportsDispatchDialog.tsx)
- dispatch actions: [features/admin/sections/reports/useReportDispatchActions.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/reports/useReportDispatchActions.ts)
- document actions: [features/admin/sections/reports/useReportDocumentActions.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/reports/useReportDocumentActions.ts)
- filters/helpers: [features/admin/sections/reports/reportsSectionFilters.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/reports/reportsSectionFilters.ts)
- API client: [lib/admin/apiClient.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/admin/apiClient.ts)
- export client: [lib/admin/exportClient.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/admin/exportClient.ts)
- row mapping helpers: [lib/admin/controllerReports.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/admin/controllerReports.ts)

## Feature Goal

Controllers must be able to:

- browse all reports in one table
- search and filter by site, headquarter, assignee, report type, date range, and quality status
- sort and paginate the list
- open the report in the correct editor/viewer
- record quality review state and owner
- record or toggle dispatch state
- send dispatch SMS from the quarterly-report dispatch modal
- export a single report as HWPX/PDF
- export the current list as Excel

## User Role

- primary user: admin/controller
- preconditions:
  - authenticated safety admin user
  - inspection-session provider is mounted so technical-guidance exports can hydrate sessions when needed

## Entry and Scope

- this is an `/admin` section, not a standalone page
- initial state can be seeded from search params:
  - `query`
  - `reportType`
  - `headquarterId`
  - `siteId`
  - `assigneeUserId`
  - `qualityStatus`
  - `dateFrom`
  - `dateTo`
  - `overviewPreset`
- special overview presets:
  - `badWorkplaceOverdue`
  - `issueBundle`
  - `siteOverdueBundle`

## Data Contracts

### Main row entity

`ControllerReportRow`

Fields used directly by this feature:

- identity:
  - `reportKey`
  - `routeParam`
- type and labels:
  - `reportType`
  - `reportTitle`
  - `periodLabel`
- location:
  - `siteId`
  - `siteName`
  - `headquarterId`
  - `headquarterName`
- assignee/review:
  - `assigneeUserId`
  - `assigneeName`
  - `checkerUserId`
  - `qualityStatus`
  - `controllerReview`
- dispatch:
  - `dispatch`
  - `dispatchStatus`
  - `dispatchSignal`
  - `deadlineDate`
- lifecycle:
  - `status`
  - `workflowStatus`
  - `lifecycleStatus`
- dates:
  - `visitDate`
  - `updatedAt`
- document metadata:
  - `originalPdfAvailable`
  - `originalPdfDownloadPath`

### Read APIs

- `GET /api/admin/reports`
  - supported filters:
    - `assignee_user_id`
    - `date_from`
    - `date_to`
    - `headquarter_id`
    - `limit`
    - `offset`
    - `quality_status`
    - `query`
    - `report_type`
    - `site_id`
    - `sort_by`
    - `sort_dir`
    - `status`
  - response:
    - `rows: ControllerReportRow[]`
    - `total`
    - `limit`
    - `offset`

- `GET /api/admin/directory/lookups`
  - response:
    - headquarters
    - sites
    - users

### Write APIs

- `PATCH /api/admin/reports/:reportKey/review`
  - payload:
    - `checkedAt`
    - `checkerUserId`
    - `note`
    - `ownerUserId`
    - `qualityStatus`

- `PATCH /api/admin/reports/:reportKey/dispatch`
  - payload: full `ReportDispatchMeta`

- `POST /api/admin/reports/:reportKey/dispatch-events`
  - additional dispatch event history, though the main section currently updates dispatch via `PATCH`

### Export and document APIs

- `POST /api/admin/exports/reports`
  - used first for server-driven list export
- fallback `exportAdminWorkbook('reports', sheets)` if server export fails

- technical guidance single-report export:
  - browser generation first using hydrated inspection session
  - then server HWPX/PDF endpoints
  - finally browser HWPX fallback if PDF conversion fails

- quarterly single-report export:
  - server HWPX or PDF-with-fallback

- bad workplace single-report export:
  - server HWPX or PDF-with-fallback

## Caching Rules

- directory lookups are cached in admin session cache under `directory-lookups`
- report list cache key is the JSON-stringified combination of:
  - `assigneeFilter`
  - `dateFrom`
  - `dateTo`
  - trimmed deferred query
  - `headquarterFilter`
  - `offset`
  - `overviewPreset`
  - `qualityFilter`
  - `reportType`
  - `siteFilter`
  - `sort`
- cached value stores:
  - `rows`
  - `total`

## State Model

### Primary local state

- filters:
  - `query`
  - `reportType`
  - `headquarterFilter`
  - `siteFilter`
  - `assigneeFilter`
  - `qualityFilter`
  - `dateFrom`
  - `dateTo`
- list state:
  - `rows`
  - `total`
  - `offset`
  - `sort`
  - `selectedKeys`
- modal state:
  - `reviewRow`
  - `reviewForm`
  - `dispatchRow`
  - `dispatchSite`
  - `dispatchSmsPhone`
  - `dispatchSmsMessage`
  - `dispatchSmsSending`
  - `smsProviderStatuses`
- shared UI state:
  - `loading`
  - `notice`
  - `error`
  - `directoryLookups`

### Derived state

- `overviewPreset`
- `deferredQuery`
- `reportCacheKey`
- `selectedRows`
- `users`, `headquarterOptions`, `siteOptions`, `assigneeOptions`
- `activeFilterCount`
- `dispatchSignal` and deadline-derived states per row

## Business Rules

### Preset filtering

- `badWorkplaceOverdue`
  - keep only overdue bad-workplace rows
- `issueBundle`
  - keep rows with `qualityStatus === 'issue'` or overdue dispatch conditions
- `siteOverdueBundle`
  - keep rows that are overdue from overview perspective

### Dispatch-state resolution

- quarterly reports derive a dispatch signal from visit/update date and sent/manual_checked state
- technical guidance reports only show sent vs unsent
- bad workplace rows use month-based overdue logic

### Selection and bulk actions

- bulk bar appears only when one or more rows are selected
- bulk actions:
  - review ok
  - review issue
  - assign current user as review owner
  - mark quarterly reports as manually sent
- bulk manual dispatch applies only to selected `quarterly_report` rows

### Review modal rules

- modal opens from row action
- fields:
  - quality status
  - owner user id
  - note
- save writes a full review patch and reloads rows

### Dispatch dialog rules

- only meaningful for quarterly reports
- primary action:
  - `관제 수동 완료 처리`
- dialog must display:
  - dispatch signal and deadline
  - recipient email baseline
  - dispatch state/method
  - actual dispatch timestamp and recipient
  - manual check timestamp and checker
  - read status
  - reply status
  - SMS provider statuses
  - dispatch history table

### SMS rules

- SMS send button disabled if:
  - currently sending
  - phone blank
  - message blank
  - any provider reports `sendEnabled === false`

### Report-open rules

- row click opens the report
- report-open destination must be chosen by `buildControllerReportOpenHref(row)`
- photos action must preserve return navigation context

### Single-report export rules

- technical guidance:
  - try browser HWPX/PDF generation first if session can hydrate
  - if browser generation fails, try server generation
  - if server generation fails, fall back to browser HWPX
- quarterly/bad workplace:
  - use server endpoints directly
- if PDF conversion fails but HWPX succeeds:
  - save HWPX and show fallback notice

## UI Composition

### Main header

- title: `전체 보고서`
- search input
- filter menu
- list Excel export button

### Main table columns

- select checkbox
- report type
- report title
- site
- assignee
- quality check
- base date
- updated date
- action menu

### Review dialog

- modal title: `보고서 품질 체크`
- fields:
  - quality status
  - owner
  - note

### Dispatch dialog

- modal title: `분기 보고서 발송 이력`
- summary status block
- dispatch info grid
- SMS inputs
- history table

## Interaction Flows

### Initial load

1. read URL-seeded filters
2. hydrate directory lookups from cache if present
3. hydrate report list from request-specific cache if present
4. fetch fresh rows
5. apply overview preset filtering if requested
6. cache the resulting row set

### Open report

1. user clicks row or `열기`
2. compute destination by report type
3. navigate into report editor or open flow

### Save review

1. open review modal for a row
2. edit quality state, owner, note
3. patch review API
4. close modal
5. refetch rows
6. show notice

### Toggle dispatch

1. user picks `발송으로 변경` or `미발송으로 변경`
2. build toggled dispatch payload
3. patch dispatch API
4. optimistically reapply row using returned report
5. show notice

### Send SMS

1. user opens dispatch dialog
2. load SMS provider statuses
3. set phone/message
4. send SMS
5. close dialog on success
6. refetch rows
7. show provider result notice

## Error Handling

- list fetch errors show section banner
- lookup fetch errors log to console only
- export/report document errors show section banner
- aborted list fetches must not overwrite later requests
- auth failures must still route through shared auth expiration behavior

## Non-Obvious Constraints

- overview presets are applied client-side after the base `/reports` fetch
- list export prefers server export but falls back to client-built workbook
- technical-guidance export behavior depends on inspection-session hydration and may bridge admin and ERP state
- `originalPdfAvailable` and `originalPdfDownloadPath` appear as action-menu options and should not be dropped

## Recovery Checklist

- [ ] filters and search load the expected row subset
- [ ] overview presets narrow rows correctly
- [ ] row click opens the right report destination
- [ ] review modal saves and reloads row state
- [ ] quarterly dispatch dialog shows history and SMS controls
- [ ] bulk actions apply only to selected rows
- [ ] single-report export works for all three report types
- [ ] list export works via server path or client fallback

## Verification

- admin reports smoke
- targeted typecheck
- document export sanity checks for technical guidance, quarterly, and bad workplace
