# Reverse Spec - Quarterly Report Composition Flow

## Purpose

- Recover the quarterly summary report authoring flow used by site workers and admins.
- Preserve report loading, source-report selection and recalculation, site snapshot editing, implementation/stat aggregation, OPS asset rendering, autosave, and document export.

## Source of Truth

- page screen: [features/site-reports/quarterly-report/QuarterlyReportPageScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/QuarterlyReportPageScreen.tsx)
- page state: [features/site-reports/quarterly-report/useQuarterlyReportPageState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/useQuarterlyReportPageState.ts)
- editor shell: [features/site-reports/quarterly-report/QuarterlyReportEditor.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/QuarterlyReportEditor.tsx)
- editor controller: [features/site-reports/quarterly-report/useQuarterlyReportEditor.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/useQuarterlyReportEditor.ts)
- source sync: [features/site-reports/quarterly-report/useQuarterlySourceSync.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/useQuarterlySourceSync.ts), [features/site-reports/quarterly-report/quarterlySourceSyncHelpers.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/quarterlySourceSyncHelpers.ts)
- report helpers: [features/site-reports/quarterly-report/quarterlyReportHelpers.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/quarterlyReportHelpers.ts)
- document actions: [features/site-reports/quarterly-report/useQuarterlyDocumentActions.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/useQuarterlyDocumentActions.ts)
- save mutations: [hooks/useSiteOperationalReportMutations.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/hooks/useSiteOperationalReportMutations.ts)
- OPS asset loader: [features/site-reports/quarterly-report/useQuarterlyOpsAssets.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/quarterly-report/useQuarterlyOpsAssets.ts)
- mobile counterpart: [features/mobile/components/MobileQuarterlyReportScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/components/MobileQuarterlyReportScreen.tsx), [features/mobile/quarterly-report/useMobileQuarterlyReportScreenState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/quarterly-report/useMobileQuarterlyReportScreenState.ts)
- document model helpers: [lib/erpReports/quarterly.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/erpReports/quarterly.ts), [lib/erpReports/shared.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/erpReports/shared.ts)

## Feature Goal

Users must be able to:

- open a quarterly report route for one site and quarter
- hydrate an existing report if it already exists
- create a new draft when the route key does not resolve to an existing report
- choose which technical-guidance reports feed the quarterly summary
- recalculate implementation rows, stats, future plans, and major measures from selected source reports
- edit site snapshot and document info fields
- save continuously and export HWPX/PDF
- use a mobile presentation layer over the same core business rules

## User Role

- primary user: assigned field worker
- secondary user: admin/controller opening the same site report flow
- preconditions:
  - authenticated safety token
  - route resolves to an accessible site

## Entry and Scope

- web route:
  - `/sites/[siteKey]/quarterly/[quarterKey]`
- mobile route:
  - `/mobile/sites/[siteKey]/quarterly/[quarterKey]`

Route semantics:

- `siteKey` identifies the site
- `quarterKey` doubles as:
  - report lookup key
  - fallback draft id for a newly created report

Out of scope:

- quarterly report list/create dialog
- admin mail dispatch workflow after report completion
- HWPX/PDF server template internals

## Data Contracts

### Main entity

`QuarterlySummaryReport`

Fields that matter to reconstruction:

- identity:
  - `id`
  - `reportKind`
  - `title`
- quarter/period:
  - `quarterKey`
  - `year`
  - `quarter`
  - `periodStartDate`
  - `periodEndDate`
- provenance:
  - `generatedFromSessionIds`
  - `lastCalculatedAt`
- document info:
  - `drafter`
  - `reviewer`
  - `approver`
  - `updatedAt`
- site snapshot:
  - `siteSnapshot.*`
- derived content:
  - `implementationRows`
  - `accidentStats`
  - `causativeStats`
  - `futurePlans`
  - `majorMeasures`
- OPS content:
  - `opsAssetId`
  - `opsAssetTitle`
  - `opsAssetDescription`
  - `opsAssetPreviewUrl`

### Read APIs

- report lookup:
  - `fetchSafetyReportByKey(token, reportKey)`
- quarterly source seed:
  - `fetchQuarterlySummarySeed(token, siteId, { periodStartDate, periodEndDate, selectedReportKeys, explicitSelection })`
- local fallback source material:
  - `ensureSiteReportsLoaded(siteId)`
  - `getSessionsBySiteId(siteId)`

### Write APIs

- save:
  - `upsertSafetyReport(token, buildQuarterlySummaryUpsertInput(report, site))`
- delete exists elsewhere but is outside this composition document

### Output APIs

- HWPX download by report key
- PDF download by report key with HWPX fallback

Document export rule:

- export always persists the latest draft before generating output

## Caching and Persistence

- page state first tries to fetch a report by exact `reportKey`
- if lookup returns 404:
  - treat route as a new draft
  - do not block the page
- after save, operational report index is forcibly refreshed for the current site/user
- quarterly source seed has a local fallback path when upstream seed API returns:
  - `404`
  - `405`
  - `501`
- editor autosave relies on a draft fingerprint
- autosave must pause while:
  - report save is already in progress
  - source report recalculation is loading
- mobile OPS assets use session-scoped content-item cache when available

## State Model

### Page state

- `existingReport`
- `existingReportLoading`
- `existingReportError`
- `currentSite`
- `isAdminView`
- `backHref`
- `initialDraft`

### Editor state

- `draft`
- `notice`
- `documentError`
- `documentInfoOpen`
- `titleEditorOpen`
- `titleDraft`
- `sourceModalOpen`

### Source sync state

- `sourceReports`
- `sourceReportsLoading`
- `sourceReportsError`
- `selectedSourceReportKeys`

### OPS asset state

- `opsLoading`
- `opsError`

### Derived state

- `draftFingerprint`
- `availableSourceReports`
- `selectedSourceSet`
- `hasPendingSelectionChanges`
- `autoMatchedOpsAsset`
- `selectedQuarter`

## Business Rules

### Existing-report resolution rule

- if fetched report maps to a quarterly report for a different site:
  - ignore it
  - treat as no existing report for this page

### Draft-creation rule

- if no existing report is found:
  - create draft from `createQuarterlySummaryDraft(currentSite, drafterName)`
  - force `id = reportKey`

### Source-period validity rule

- if either period date is missing or start date is after end date:
  - source report list becomes empty
  - selected source keys become empty
  - recalculation is skipped

### Quarter-change rule

- changing quarter recalculates:
  - `periodStartDate`
  - `periodEndDate`
  - `quarterKey`
  - `year`
  - `quarter`
- title is auto-synced only when current title is blank or still equals the auto-generated title for the current period

### Source-selection rule

- on fresh draft with no explicit selection:
  - all source sessions in the target period are selected by default
- on existing report or explicit reselection:
  - only the chosen report keys are applied

### Source-application result

Applying source selection must regenerate:

- `generatedFromSessionIds`
- `implementationRows`
- `accidentStats`
- `causativeStats`
- `futurePlans`
- `majorMeasures`
- `lastCalculatedAt`

Notice text:

- when selected count > 0:
  - `선택한 지도 보고서 {count}건을 반영했습니다.`
- when empty:
  - `선택한 지도 보고서가 없습니다.`

### Sort rule for source reports

- source reports are displayed newest first by `guidance_date`

### OPS asset rule

- OPS assets are loaded from content items where `content_type === 'campaign_template'`
- desktop auto-matches an OPS asset once assets are loaded and there is no equivalent asset already applied
- if no OPS asset is available:
  - section shows a non-blocking empty state

### Save/export rules

- save uses `buildQuarterlySummaryUpsertInput(...)`
- HWPX/PDF export must:
  1. refresh `updatedAt`
  2. save the draft
  3. request document binary by report key
- PDF export may fall back to HWPX and show:
  - `PDF 변환에 실패해 HWPX로 다운로드했습니다.`

## UI Composition

### Web composition shell

- worker/admin shell wrapper
- back control to quarterly list
- title from current draft
- `QuarterlyReportEditor`

### Web editor sections

- summary toolbar
- summary cards
- source selection section
- source selection modal
- site snapshot section
- stats section
- implementation section
- future plans section
- OPS section
- document info modal
- title editor modal

### Mobile composition shell

- `MobileShell`
- summary section with save/export/step navigation
- step-based content area
- source modal
- document info modal

## Interaction Flows

### Initial open

1. resolve auth and site
2. fetch report by route key
3. if found and matching current site, map into quarterly report
4. otherwise create a new draft with the route key as draft id
5. load source reports for the current period
6. auto-apply OPS asset when available

### Recalculate source reports

1. user changes period, quarter, or explicit source selection
2. validate period bounds
3. try upstream quarterly seed API
4. if seed API is unsupported, fall back to local site sessions
5. apply regenerated quarterly draft sections
6. update source notices and selected-source state

### Manual editing

1. user edits site snapshot, title, implementation rows, future plans, or document-info fields
2. update local draft only
3. autosave later persists if fingerprint changed

### Save

1. user taps save or autosave fires
2. upsert report payload to safety API
3. refresh operational report index cache

### Export

1. user requests HWPX or PDF
2. persist latest draft first
3. fetch report document by report key
4. save downloaded file locally

## Error Handling

- expired token:
  - `로그인이 만료되었습니다. 다시 로그인해 주세요.`
- report lookup failure:
  - `getQuarterlyPageErrorMessage(...)`
- source seed load failure:
  - surface seed-load error but keep editor mounted
- OPS asset load failure:
  - non-blocking OPS banner error
- save failure:
  - error stored in `useSiteOperationalReportMutations`
- document export failure:
  - `documentError` banner/message without discarding draft

## Non-Obvious Constraints

- route `quarterKey` is not only a period identifier; it is also the persisted report key for new drafts
- source recalculation is not a cosmetic helper; it is the primary way implementation rows and summary statistics are rebuilt
- local fallback from session cache is part of intended behavior, not just a dev shortcut
- desktop and mobile use different presentation shells but must preserve the same underlying quarterly draft rules
- export correctness depends on saving first, so “download without persistence” is a behavior regression

## Recovery Checklist

- [ ] quarterly route opens existing report or creates draft from route key
- [ ] invalid periods clear source state instead of crashing
- [ ] source-report selection recalculates derived quarterly sections
- [ ] quarter change updates period and conditional auto-title behavior
- [ ] save refreshes operational report index
- [ ] OPS asset auto-match still works when content items load
- [ ] HWPX/PDF export saves latest draft first
- [ ] mobile shell follows the same draft and source-selection rules

## Verification

- targeted typecheck
- one manual web pass:
  - open existing quarterly report
  - change selected source reports
  - save
  - export PDF/HWPX
- one manual mobile pass:
  - open quarterly report
  - change one editable field
  - save
