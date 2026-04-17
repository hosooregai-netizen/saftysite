# Reverse Spec - Intake And Case Dashboard

## Purpose

- Recover the `/appraisal?section=overview` dashboard used by intake coordinators, operations managers, and appraisal-firm admins.
- Preserve the overview-first workflow where incoming orders, due-risk cases, review backlog, delivery aging, and invoice aging are visible without opening each case.

## Source Mapping

- Base shell pattern:
  - [../reverse-specs/admin-overview-dashboard-reverse-spec.md](../reverse-specs/admin-overview-dashboard-reverse-spec.md)
- Supporting list and queue pattern:
  - [../reverse-specs/admin-reports-list-and-review-reverse-spec.md](../reverse-specs/admin-reports-list-and-review-reverse-spec.md)
- Renamed entities:
  - `site` -> `AppraisalCase`
  - `report dispatch` -> delivery and receipt
  - `unsent report aging` -> review, delivery, and invoice aging
- Removed semantics:
  - quarterly summary
  - bad workplace
  - education and measurement stock
  - K2B-specific gaps
- New appraisal-only logic:
  - intake queue
  - approval-ready queue
  - delivery and receipt aging
  - invoice and settlement aging

## Feature Goal

Users must be able to:

- see v1 appraisal operations health at a glance
- drill into stage counts by shared case lifecycle
- review due-risk, review-pending, delivery-aging, and invoice-aging cases
- inspect workload by appraiser and reviewer
- refresh the dashboard and export the visible model

## User Role

- primary user: intake coordinator or operations admin
- secondary user: reviewer or partner-level approver
- preconditions:
  - authenticated appraisal ERP admin session
  - access to case, report, delivery, and invoice rollups

## Entry and Scope

- route: `/appraisal?section=overview`
- optional search params:
  - `preset`
  - `dateFrom`
  - `dateTo`
  - `assignedAppraiserId`
  - `clientId`
- out of scope:
  - case editing
  - report drafting
  - invoice mutation forms

## Data Contracts

### Main entities

`AppraisalOverviewResponse`

- `stageSummary`
- `dueSoonRows`
- `reviewPendingRows`
- `deliveryAgingRows`
- `invoiceAgingRows`
- `appraiserLoadRows`
- `refreshedAt`

`OverviewCaseRow`

- `caseKey`
- `caseNo`
- `orderNo`
- `clientName`
- `purpose`
- `baseDate`
- `dueDate`
- `status`
- `assignedAppraiserName`
- `reviewerName`
- `activeReportKey`
- `deliveryStatus`
- `invoiceStatus`
- `href`

### Read APIs

- `GET /api/appraisal/dashboard/overview`
  - filters:
    - `date_from`
    - `date_to`
    - `assigned_appraiser_id`
    - `client_id`
    - `preset`
  - response:
    - `stageSummary`
    - `dueSoonRows`
    - `reviewPendingRows`
    - `deliveryAgingRows`
    - `invoiceAgingRows`
    - `appraiserLoadRows`
    - `refreshedAt`

### Write APIs

- no direct mutations on this screen
- drilldowns route users to case or report surfaces for actual changes

### Output or download APIs

- dashboard export uses the currently normalized overview model
- server workbook generation is optional
- client workbook fallback must preserve currently visible sorting and presets

## Caching and Persistence

- session cache key: `appraisal-overview:${currentUserId}:${filterSignature}`
- TTL: `5 minutes`
- if cache is fresh:
  - render cached response immediately
  - avoid immediate refetch
- manual refresh always bypasses cache

## State Model

### Primary local state

- `overviewResponse`
- `error`
- `isRefreshing`
- `lastSyncedAt`
- `preset`
- `dateFrom`
- `dateTo`
- `assignedAppraiserId`
- `clientId`
- `dueSort`
- `reviewSort`

### Derived state

- `filterSignature`
- `stageCards`
- `visibleDueSoonRows`
- `visibleReviewPendingRows`
- `visibleDeliveryAgingRows`
- `visibleInvoiceAgingRows`
- `visibleAppraiserLoadRows`
- `selectedPresetLabel`

## Business Rules

### Identifier rules

- rows must display both `caseNo` and `orderNo`
- drilldown always uses `caseKey` or `reportKey`, never a display title

### Domain rules

- stage cards derive only from the shared `AppraisalCase.status` vocabulary in [domain-model.md](./domain-model.md)
- `dueSoonRows` include cases in:
  - `assigned`
  - `scheduled`
  - `inspecting`
  - `drafting`
  - `in_review`
- `reviewPendingRows` include active reports in:
  - `review_requested`
  - `revision_requested`
- `deliveryAgingRows` include approved reports not yet `received`
- `invoiceAgingRows` include delivered cases where invoice status is not `settled` or `written_off`
- delivery and invoice aging must never show a case as completed before report approval

### Display rules

- overdue badge priority:
  - due date passed
  - delivery aging
  - invoice aging
- case purpose and due date are always visible in queue rows
- empty tables must still show count `0` and a non-blocking empty state

## UI Composition

### Main sections

- overview header with refresh and export actions
- case-stage KPI cards
- due-soon table
- review-pending table
- delivery-aging table
- invoice-aging table
- appraiser workload summary

### Modal and overlay structure

- no mandatory edit modal
- optional preset filter drawer for mobile-width layouts later

## Interaction Flows

### Initial load

1. read search params
2. hydrate from session cache if available
3. fetch overview response if cache is stale or missing
4. normalize queue rows and stage counts
5. render cards and aging tables

### Drilldown flow

1. user clicks a KPI card or row
2. dashboard applies or preserves a preset
3. route to:
  - `/appraisal?section=cases`
  - `/appraisal?section=reports`
  - `/appraisal/cases/[caseKey]`
  - `/appraisal/reports/[reportKey]`

### Refresh flow

1. user presses refresh
2. dashboard fetch bypasses cache
3. session cache is replaced
4. `lastSyncedAt` updates
5. all derived sections rerender

## Error Handling

- fetch errors show an inline state banner and keep the last good cached model if present
- an empty overview response must not crash the screen
- export failure falls back to client workbook generation where possible

## Non-Obvious Implementation Notes

- The dashboard is the vocabulary anchor for shared case status labels.
- Review, delivery, and finance counters must be computed from the same normalized case model used elsewhere.
- The screen is overview-only; case changes belong to the downstream surfaces.

## Recovery Checklist

- [ ] Overview route renders with shared section shell
- [ ] Stage cards use the shared case-status vocabulary
- [ ] Due, review, delivery, and invoice aging tables render independently
- [ ] Cache and manual refresh both work
- [ ] Drilldown links use stable identifiers
- [ ] Delivery and invoice completion never bypass approval rules

## Verification

- targeted type and schema check for overview response normalization
- smoke flow: open overview, refresh, drill into one case, return to cached overview
- consistency check against `domain-model.md` and `api-contracts.md`

