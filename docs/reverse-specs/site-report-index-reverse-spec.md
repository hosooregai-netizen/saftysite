# Reverse Spec - Site Report Index

## Recovery Slice

- Recovery Slice ID: `site-report-index`
- Top-level contract: `site-report-list`
- Reverse spec status: `done`

## Purpose

- Recover the shared technical-guidance report index used by the site report list on web and mobile.
- Preserve index loading, shared filtering/sorting, and the mobile/web list shells that sit above the same report-index model.

## Source of Truth

- shared list state: [features/site-reports/hooks/useSiteReportListState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/hooks/useSiteReportListState.ts)
- report-index loader: [features/site-reports/report-list/useSiteReportIndexLoader.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/report-list/useSiteReportIndexLoader.ts)
- list helpers/types: [features/site-reports/report-list/reportListHelpers.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/report-list/reportListHelpers.ts), [features/site-reports/report-list/types.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/report-list/types.ts)
- web list shell: [features/site-reports/components/SiteReportListPanel.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/components/SiteReportListPanel.tsx)
- mobile list shell: [features/mobile/components/MobileSiteReportsScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/components/MobileSiteReportsScreen.tsx)
- mobile controller: [features/mobile/report-list/useMobileSiteReportsScreenState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/report-list/useMobileSiteReportsScreenState.ts)

## Feature Goal

Users must be able to:

- load one site’s technical-guidance report index
- search and sort saved reports
- reuse the same filtered index in both web and mobile shells
- force a reload after an error or when the user explicitly refreshes

## User Role

- primary user: assigned field worker
- secondary user: admin/controller browsing the same site reports

## Entry and Scope

- mobile route:
  - `/mobile/sites/[siteKey]/reports`
- web usage:
  - site report list panels and site-level report list surfaces
- create dialog behavior is a separate recovery slice

## Data Contracts

### Main entity

`InspectionReportListItem`

Fields used directly by this slice:

- `reportKey`
- `reportTitle`
- `visitDate`
- `visitRound`
- `dispatchCompleted`
- `dispatchCompletedAt`
- `lastAutosavedAt`
- `updatedAt`
- `meta.*`

### Read/store contract

- `ensureSiteReportIndexLoaded(siteId, { force? })`
- `getReportIndexBySiteId(siteId)`

Report-index state shape:

- `status`
- `items`
- `error`

## Caching and Persistence

- the shared report index is the cache boundary for this slice
- `useSiteReportIndexLoader` guards repeated loads with `hasAttemptedLoadRef`
- changing site resets the attempted-load flag
- force reload explicitly calls `ensureSiteReportIndexLoaded(siteId, { force: true })`

## State Model

### Primary local state

- `reportQuery`
- `reportSortMode`
- `dispatchFilter`
- `currentSite`

### Derived state

- `reportIndexStatus`
- `reportIndexError`
- `reportItems`
- `filteredReportItems`
- `assignedUserDisplay`
- `canCreateReport`

## Business Rules

### Site resolution rule

- list behavior stays disabled until the site route resolves to an accessible site

### Index-load rule

- load once when:
  - site is known
  - auth is ready
  - user is authenticated
- skip duplicate loads while current index status is `loading`
- allow another load after an `error`

### Shared-shell rule

- web and mobile list shells read the same filtered index model
- mobile-specific card layout must not fork the underlying index-loading semantics

## UI Composition

- web list panel
- mobile reports screen
- shared toolbar/search/sort/filter state
- empty state and loading/error surfaces

## Interaction Flows

### Initial load

1. resolve the site route
2. read the current report-index snapshot
3. if the site is ready and no successful load has happened yet, trigger `ensureSiteReportIndexLoaded`
4. render the index state into web or mobile presentation

### Force reload

1. user triggers reload
2. attempted-load guard is explicitly bypassed with `{ force: true }`
3. same site index is replaced once the refreshed response arrives

## Error Handling

- index errors stay attached to the shared report-index state
- list shell remains mounted so the user can retry rather than losing route context

## Recovery Checklist

- [ ] report index loads once per site until an error or explicit force reload
- [ ] web and mobile shells show the same filtered report set
- [ ] error state stays visible without losing route context
- [ ] force reload bypasses the one-shot attempt guard
