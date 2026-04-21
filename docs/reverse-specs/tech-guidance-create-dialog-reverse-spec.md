# Reverse Spec - Technical Guidance Create Dialog

## Recovery Slice

- Recovery Slice ID: `tech-guidance-create-dialog`
- Top-level contract: `site-report-list`
- Reverse spec status: `done`

## Purpose

- Recover the technical-guidance report create dialog that sits on top of the shared site report list.
- Preserve default date/title suggestions, validation, and direct navigation into the newly created report.

## Source of Truth

- create dialog state: [features/site-reports/report-list/useSiteReportCreateDialog.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/report-list/useSiteReportCreateDialog.ts)
- dialog UI: [features/site-reports/report-list/SiteReportCreateDialog.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/report-list/SiteReportCreateDialog.tsx)

## Feature Goal

Users must be able to:

- open the create dialog from the site report list
- accept the default date/title or replace them
- submit a valid technical-guidance report draft
- land directly in the newly created report after success

## User Role

- primary user: assigned field worker
- secondary user: admin/controller with the same site-report access

## Entry and Scope

- this slice begins when the user taps the “create report” action inside the site report list
- upstream seed fetch and session creation happen behind `createReport(...)`
- list/index loading is a separate recovery slice

## Data Contracts

### Create form state

- `reportDate`
- `reportTitle`

### Create input

- `createReport({ reportDate, reportTitle })`

## Caching and Persistence

- dialog state is local only
- default date is today at dialog-open time
- successful creation closes the dialog and leaves persistence to the surrounding create flow

## State Model

### Primary local state

- `createError`
- `createForm`
- `hasEditedCreateTitle`
- `isCreateDialogOpen`
- `isCreatingReport`

## Business Rules

### Open rule

- dialog only opens when `canCreateReport` is true
- opening pre-fills:
  - `reportDate = today`
  - `reportTitle = getCreateReportTitleSuggestion(today)`

### Title auto-sync rule

- changing the report date updates the title suggestion only until the user manually edits the title

### Validation rules

Submit is blocked unless:

- `reportDate` is present
- `reportTitle` is present

Validation messages:

- `지도일을 입력해 주세요.`
- `제목을 입력해 주세요.`

### Success rule

- successful create closes the dialog
- dialog state resets
- surrounding flow routes to the newly created report

## UI Composition

- create button
- modal dialog
- date input
- title input
- error copy
- create / cancel actions

## Interaction Flows

### Open

1. user opens the create dialog
2. form is seeded with today’s date and suggested title

### Submit

1. user edits or accepts date/title
2. dialog validates required fields
3. `createReport(...)` is awaited
4. on success, the dialog closes and resets

## Error Handling

- create errors stay inside the dialog
- dialog remains open on failure so the user can retry without re-entering the whole form

## Recovery Checklist

- [ ] dialog opens with today’s date and a suggested title
- [ ] title auto-sync stops after manual title edits
- [ ] required-field validation blocks empty submit
- [ ] successful create closes and resets the dialog
