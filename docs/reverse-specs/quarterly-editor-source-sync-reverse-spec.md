# Reverse Spec - Quarterly Editor Source Sync

## Recovery Slice

- Recovery Slice ID: `quarterly-editor-source-sync`
- Top-level contract: `quarterly-report`
- Reverse spec status: `done`

## Purpose

- Recover the quarterly editor slice that resolves an existing report or draft, loads source reports, and reapplies quarterly summary seed data when the period or selection changes.
- Preserve the distinction between list/create entry and in-editor source synchronization.

## Source of Truth

- page state: [features/site-reports/quarterly-report/useQuarterlyReportPageState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/useQuarterlyReportPageState.ts)
- editor shell: [features/site-reports/quarterly-report/QuarterlyReportEditor.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/QuarterlyReportEditor.tsx)
- editor controller: [features/site-reports/quarterly-report/useQuarterlyReportEditor.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/useQuarterlyReportEditor.ts)
- source sync: [features/site-reports/quarterly-report/useQuarterlySourceSync.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/useQuarterlySourceSync.ts), [features/site-reports/quarterly-report/quarterlySourceSyncHelpers.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/quarterlySourceSyncHelpers.ts)
- source selection UI: [features/site-reports/quarterly-report/QuarterlySourceSelectionModal.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/QuarterlySourceSelectionModal.tsx)
- mobile counterpart: [features/mobile/components/MobileQuarterlyReportScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/components/MobileQuarterlyReportScreen.tsx), [features/mobile/quarterly-report/useMobileQuarterlyReportScreenState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/quarterly-report/useMobileQuarterlyReportScreenState.ts)

## Feature Goal

Users must be able to:

- open a quarterly editor route
- hydrate an existing report when it exists
- create a recoverable draft when report lookup returns 404
- see candidate source reports for the current period
- change quarter, period, or explicit source selection and regenerate the derived quarterly summary sections

## User Role

- primary user: assigned field worker
- secondary user: admin/controller on the same site report route

## Entry and Scope

- web route:
  - `/sites/[siteKey]/quarterly/[quarterKey]`
- mobile route:
  - `/mobile/sites/[siteKey]/quarterly/[quarterKey]`
- export/download behavior is a separate recovery slice

## Data Contracts

### Report lookup

- `fetchSafetyReportByKey(token, reportKey)`
- 404 is treated as “start from a new draft”

### Source seed

- preferred:
  - `loadQuarterlySourceSeed(...)`
- fallback input sources:
  - `ensureSiteReportsLoaded(siteId)`
  - `getSessionsBySiteId(siteId)`

### Derived report fields rewritten by source sync

- `generatedFromSessionIds`
- `implementationRows`
- `accidentStats`
- `causativeStats`
- `futurePlans`
- `majorMeasures`
- `lastCalculatedAt`

## Caching and Persistence

- page state clears existing report when auth/site are not ready
- new draft uses deterministic route id when no existing report is found
- source sync can apply an optimistic draft while the new seed is loading
- failed optimistic source sync must roll the draft, selected source keys, and source report list back

## State Model

### Page state

- `existingReport`
- `existingReportLoading`
- `existingReportError`
- `currentSite`
- `initialDraft`

### Source sync state

- `sourceReports`
- `sourceReportsLoading`
- `sourceReportsError`
- `selectedSourceReportKeys`

### Derived state

- `availableSourceReports`
- `selectedSourceSet`
- `hasPendingSelectionChanges`

## Business Rules

### Existing-report resolution

- if fetched report belongs to another site:
  - ignore it
  - build a new draft for the current route instead

### 404 draft rule

- a 404 report lookup is not fatal
- the page creates a new quarterly draft and forces `id = reportKey`

### Invalid-period rule

- if either period date is missing or inverted:
  - source reports clear
  - selected source keys clear
  - recalculation stops

### Source-application rule

- applying source selection or quarter change must regenerate the derived quarterly sections through seed application
- selection notice is derived from the number of selected reports

### Optimistic sync rule

- period/quarter changes may apply an optimistic draft immediately
- on seed-load failure:
  - previous draft
  - previous source report list
  - previous selection
  must all be restored

## UI Composition

- report page shell
- editor shell
- source selection section
- source selection modal
- mobile wrapper over the same core editor/source sync rules

## Interaction Flows

### Open route

1. resolve site and auth state
2. attempt report lookup
3. if found, hydrate the existing report
4. if 404, build a new route-key draft
5. load source reports for the current period

### Change quarter or source selection

1. user changes quarter or toggles source reports
2. client loads the next seed
3. derived quarterly sections are rebuilt from the new seed
4. selection notice and draft state update together

## Error Handling

- lookup 404 is non-fatal
- other lookup failures surface through the page error state
- source-sync failures keep the editor mounted and surface a page-level error message
- failed optimistic sync restores previous state instead of leaving a partial draft

## Recovery Checklist

- [ ] report lookup 404 creates a usable draft instead of blocking the route
- [ ] invalid periods clear source reports instead of applying stale data
- [ ] source selection rebuilds derived quarterly sections
- [ ] failed optimistic source sync restores the previous draft and selection
