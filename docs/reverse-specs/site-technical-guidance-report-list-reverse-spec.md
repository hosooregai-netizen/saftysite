# Reverse Spec - Site Technical Guidance Report List and Creation Flow

## Purpose

- Recover the site-level technical-guidance report list used to browse, create, open, and archive inspection sessions.
- Preserve shared filtering/sorting, technical-guidance seed creation, and the mobile/web list shells that sit above the same report-index model.

## Source of Truth

- shared list state: [features/site-reports/hooks/useSiteReportListState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/hooks/useSiteReportListState.ts)
- report-index loader: [features/site-reports/report-list/useSiteReportIndexLoader.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/report-list/useSiteReportIndexLoader.ts)
- create dialog helper: [features/site-reports/report-list/useSiteReportCreateDialog.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/report-list/useSiteReportCreateDialog.ts)
- web quarterly-adjacent shell that uses the list model: [features/site-reports/components/SiteReportListPanel.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/components/SiteReportListPanel.tsx)
- mobile list shell: [features/mobile/components/MobileSiteReportsScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/components/MobileSiteReportsScreen.tsx)
- mobile controller: [features/mobile/report-list/useMobileSiteReportsScreenState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/report-list/useMobileSiteReportsScreenState.ts)
- list helpers/types: [features/site-reports/report-list/reportListHelpers.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/report-list/reportListHelpers.ts), [features/site-reports/report-list/types.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/report-list/types.ts)
- shared inspection-session store entry points: [hooks/useInspectionSessions.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/hooks/useInspectionSessions.ts)
- seed API usage: [lib/safetyApi.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/safetyApi.ts)

## Feature Goal

Users must be able to:

- load one site’s technical-guidance report index
- search and sort saved reports
- create a new technical-guidance session using upstream seed data
- open the created report immediately in web or mobile
- archive/delete a report when the current user has permission

## User Role

- primary user: assigned field worker
- secondary user: admin/controller browsing the same site reports
- preconditions:
  - authenticated inspection-session context
  - accessible site route

## Entry and Scope

- mobile route:
  - `/mobile/sites/[siteKey]` report tab / reports screen
- web usage:
  - site report list panels and site-level report list surfaces
- build target may override report href:
  - mobile uses `buildMobileSessionHref`
  - default web uses `/sessions/${reportKey}`

Out of scope:

- quarterly and bad-workplace derived report lists
- report editing once a session is opened
- admin global reports table

## Data Contracts

### Main entity

`InspectionReportListItem`

Fields expected by the list layer:

- `reportKey`
- `reportTitle`
- `visitDate`
- `visitRound`
- `dispatchCompleted`
- `dispatchCompletedAt`
- `lastAutosavedAt`
- `updatedAt`
- `meta.*`

### Read APIs / store contracts

- shared store contract:
  - `ensureSiteReportIndexLoaded(siteId, { force? })`
  - `getReportIndexBySiteId(siteId)`

Report-index state shape:

- `status`
- `items`
- `error`

### Create seed API

- `fetchTechnicalGuidanceSeed(token, currentSite.id)`

Seed fields used by creation:

- `next_visit_round`
- `open_followups`
- `projection_version`
- `previous_authoritative_report`
- `cumulative_accident_entries`
- `cumulative_agent_entries`

### Mutation/store writes

- create:
  - `createSession(currentSite, seed-derived payload)`
- delete:
  - `deleteSession(reportKey)`

## Caching and Persistence

- site report list relies on the shared store’s site report index
- `useSiteReportIndexLoader` guards repeated loads via `hasAttemptedLoadRef`
- changing site resets the attempted-load flag
- force reload explicitly calls `ensureSiteReportIndexLoaded(siteId, { force: true })`
- creation writes a local session immediately and pushes route without waiting for a separate index refresh

## State Model

### Shared list state

- `reportQuery`
- `reportSortMode`
- `dispatchFilter`
- `currentSite`

### Derived shared state

- `reportIndexStatus`
- `reportIndexError`
- `reportItems`
- `nextReportNumber`
- `assignedUserDisplay`
- `filteredReportItems`
- `canCreateReport`

### Create dialog state

- `createForm`
- `createError`
- `hasEditedCreateTitle`
- `isCreateDialogOpen`
- `isCreatingReport`

### Mobile shell state

- `dialogSessionId`
- `deleteError`
- `isDeletingReport`
- `reportCards`
- `deletingSession`

## Business Rules

### Site resolution rule

- all list behavior is disabled until the site route resolves to an actual accessible site

### Index-load rule

- load report index once when:
  - site is known
  - auth is ready
  - user is authenticated
- skip duplicate loads while current index is already `loading`
- allow another load after an `error`

### Filtering and sorting rules

- query uses deferred text
- filters run through `getFilteredReportItems(...)`
- sort modes are managed by shared list helpers
- dispatch filter narrows rows by send/completion state

### Create dialog rules

- opening create dialog pre-fills:
  - `reportDate = today`
  - `reportTitle = getCreateReportTitleSuggestion(today)`
- changing report date auto-syncs title only until user manually edits the title
- submit is blocked unless:
  - `reportDate` is present
  - `reportTitle` is present

Validation messages:

- `지도일을 입력해 주세요.`
- `제목을 입력해 주세요.`

### Session creation rules

Creating a report must:

1. require current site and loaded report index
2. require auth token
3. fetch technical-guidance seed from upstream
4. choose `reportNumber` from:
   - `seed.next_visit_round`
   - else local `nextReportNumber`
5. create a local inspection session with:
   - metadata:
     - `siteName`
     - `reportDate`
     - `reportTitle`
     - `drafter`
   - `document4FollowUps` seeded from `open_followups`
   - `technicalGuidanceRelations` seeded from cumulative projections

### Navigation rule

- after create, immediately route to the newly created report:
  - mobile => `buildMobileSessionHref(reportKey)`
  - web => default `/sessions/${reportKey}` or supplied override

### Delete rule

- delete dialog only appears when `canArchiveReports` is true
- delete removes the session/report by `reportKey`

## UI Composition

### Web list composition

- site report list panel
- toolbar for query/sort/filter
- create dialog
- delete dialog
- report rows with open/delete actions

### Mobile list composition

- `MobileShell`
- mobile report list section
- create dialog
- delete dialog

Mobile shell labels:

- title = current site name
- back = site home

## Interaction Flows

### Initial load

1. resolve current site from route
2. load site report index through shared loader
3. compute filtered/sorted rows
4. render list shell

### Create new report

1. open create dialog
2. pick report date and title
3. fetch technical-guidance seed
4. create local session with seeded follow-ups and relations
5. navigate directly into the new session editor

### Open existing report

1. user taps one row/card
2. navigate to report href for that environment

### Delete report

1. user opens delete dialog
2. confirm deletion
3. call delete session/report mutation
4. close dialog and refresh local list state through store updates

## Error Handling

- missing auth token during create:
  - `로그인이 만료되었습니다. 다시 로그인해 주세요.`
- seed fetch or create failure bubbles into create dialog error
- report-index load failure stays in `reportIndexError`
- delete failure stays in `deleteError`

## Non-Obvious Constraints

- creation is not blank-form creation; it depends on upstream technical-guidance seed data
- report title suggestion is intentionally coupled to report date until the user takes ownership of the title
- the same shared list state powers both mobile and web-style shells, so filter/sort drift between them is a regression risk
- technical-guidance relations are pre-seeded at creation time, which affects downstream cumulative charts and summaries before the user edits anything

## Recovery Checklist

- [ ] site report index loads exactly once per site unless force reload is requested
- [ ] query/sort/filter produce stable filtered rows
- [ ] create dialog pre-fills date and title correctly
- [ ] technical-guidance seed data is applied to new sessions
- [ ] create immediately navigates to the new report
- [ ] delete remains gated by archive permission
- [ ] mobile and web list shells preserve the same creation rules

## Verification

- targeted typecheck
- one mobile pass:
  - open list
  - create report
  - verify new session opens
  - delete one draft if permitted
- one web/list pass:
  - filter rows
  - open existing report
