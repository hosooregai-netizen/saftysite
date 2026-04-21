# Reverse Spec - Quarterly Report List And Create Flow

## Recovery Slice

- Recovery Slice ID: `quarterly-list-create`
- Top-level contract: `quarterly-report`
- Reverse spec status: `done`

## Purpose

- Recover the quarterly report list and create flow that leads into the quarterly editor.
- Preserve period defaults, local-seed fallback, and the direct handoff from list/create into the newly created quarterly report.

## Source of Truth

- web list shell: [features/site-reports/components/SiteQuarterlyReportsScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/components/SiteQuarterlyReportsScreen.tsx)
- shared list/create files: [features/site-reports/quarterly-list/SiteQuarterlyReportsFrame.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-list/SiteQuarterlyReportsFrame.tsx), [features/site-reports/quarterly-list/QuarterlyReportCreateDialog.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-list/QuarterlyReportCreateDialog.tsx), [features/site-reports/quarterly-list/useQuarterlyCreateDialog.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-list/useQuarterlyCreateDialog.ts)
- helper logic: [features/site-reports/quarterly-list/quarterlyListHelpers.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-list/quarterlyListHelpers.ts)
- mobile counterpart: [features/mobile/components/MobileSiteQuarterlyReportsScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/components/MobileSiteQuarterlyReportsScreen.tsx)

## Feature Goal

Users must be able to:

- browse one site’s quarterly reports
- open the quarterly create dialog
- choose a valid quarter/date range and title
- create a quarterly draft using upstream seed data or an approved local fallback
- land directly in the new quarterly report

## User Role

- primary user: assigned field worker
- secondary user: admin/controller using the same site-level quarterly flow

## Entry and Scope

- web route:
  - `/sites/[siteKey]/quarterly`
- mobile route:
  - `/mobile/sites/[siteKey]/quarterly`
- editor hydration and source recalculation are separate recovery slices

## Data Contracts

### Create form

- `title`
- `periodStartDate`
- `periodEndDate`

### Seed loading

- preferred:
  - `fetchQuarterlySummarySeed(token, siteId, { periodStartDate, periodEndDate })`
- fallback:
  - `buildLocalQuarterlySummarySeed(...)`

## Caching and Persistence

- create dialog is local UI state only
- fallback path may call `ensureSiteReportsLoaded(siteId)` before building local seed
- successful create persists the new draft before route handoff

## State Model

### Primary local state

- `createForm`
- `hasEditedCreateTitle`
- `createDialogError`
- `isCreateDialogOpen`
- `isCreatingReport`

### Derived state

- `createQuarterSelection`
- `isCreateRangeInvalid`
- `isCreateDisabled`

## Business Rules

### Open rule

- dialog only opens when `currentSite` exists and the create flow is not already busy

### Validation rules

- create is blocked unless:
  - site exists
  - title is non-empty
  - both period dates exist
  - start date is not after end date

Validation messages:

- `제목과 기간을 입력해 주세요.`
- `기간을 다시 확인해 주세요.`

### Seed fallback rule

- upstream seed is preferred
- local fallback is allowed only when `shouldUseLocalQuarterlySeedFallback(error)` says the upstream failure is acceptable

### Success rule

- successful create closes and resets the dialog
- `onCreated(nextDraft)` runs so the outer flow can navigate into the new report

## UI Composition

- quarterly report list
- create dialog
- quarter selector
- date range inputs
- title input
- create/cancel actions

## Interaction Flows

### Create

1. user opens the quarterly create dialog
2. user confirms quarter, dates, and title
3. client builds a draft shell and resolves the seed
4. draft is saved
5. list flow opens the newly created quarterly report

## Error Handling

- create failures stay in the dialog as `createDialogError`
- local fallback only runs for approved upstream failures, not as a blanket retry strategy

## Recovery Checklist

- [ ] create dialog blocks incomplete or inverted ranges
- [ ] upstream seed is tried before local fallback
- [ ] local fallback only runs for approved upstream failures
- [ ] successful create closes the dialog and opens the new report
