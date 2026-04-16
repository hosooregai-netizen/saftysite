# Reverse Spec - Bad Workplace Report Composition Flow

## Purpose

- Recover the bad-workplace notification/report authoring flow built on top of one site’s technical-guidance sessions.
- Preserve source-session selection, source-mode switching, site snapshot editing, violation editing, save, and document export across web and mobile shells.

## Source of Truth

- web page shell: [features/site-reports/bad-workplace/BadWorkplaceReportPageScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/bad-workplace/BadWorkplaceReportPageScreen.tsx)
- page state: [features/site-reports/bad-workplace/useBadWorkplaceReportPageState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/bad-workplace/useBadWorkplaceReportPageState.ts)
- editor shell: [features/site-reports/bad-workplace/BadWorkplaceReportEditor.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/bad-workplace/BadWorkplaceReportEditor.tsx)
- editor controller: [features/site-reports/bad-workplace/useBadWorkplaceReportEditor.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/bad-workplace/useBadWorkplaceReportEditor.ts)
- domain helpers: [lib/erpReports/badWorkplace.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/erpReports/badWorkplace.ts)
- page helpers: [features/site-reports/bad-workplace/badWorkplaceHelpers.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/site-reports/bad-workplace/badWorkplaceHelpers.ts)
- shared save mutations: [hooks/useSiteOperationalReportMutations.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/hooks/useSiteOperationalReportMutations.ts)
- mobile shell: [features/mobile/components/MobileBadWorkplaceReportScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/components/MobileBadWorkplaceReportScreen.tsx)
- mobile controller: [features/mobile/bad-workplace/useMobileBadWorkplaceScreenState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/bad-workplace/useMobileBadWorkplaceScreenState.ts)
- document APIs: [lib/api.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/api.ts), [app/api/documents/bad-workplace/hwpx/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/documents/bad-workplace/hwpx/route.ts), [app/api/documents/bad-workplace/pdf/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/documents/bad-workplace/pdf/route.ts)

## Feature Goal

Users must be able to:

- open one site/month bad-workplace report route
- load an existing report if it exists for the current user/site/month
- create a fresh draft if not found
- choose which technical-guidance session acts as the source report
- switch between “previous unresolved” and “current new hazard” source modes
- edit site/receiver/notification details and per-violation fields
- save the draft and export it as HWPX, with mobile and web following the same core rules

## User Role

- primary user: assigned field worker
- secondary user: admin/controller opening the same site report
- preconditions:
  - authenticated safety token
  - route resolves to an accessible site
  - at least zero or more source technical-guidance sessions for that site

## Entry and Scope

- web route:
  - `/sites/[siteKey]/bad-workplace/[reportMonth]`
- mobile route:
  - `/mobile/sites/[siteKey]/bad-workplace/[reportMonth]`

Route semantics:

- `siteKey` identifies the site
- `reportMonth` is `YYYY-MM`
- persisted report id is derived from:
  - site id
  - report month
  - current reporter user id

Out of scope:

- bad-workplace list/index cards on the site hub
- admin dispatch follow-up after the report is completed
- HWPX/PDF template rendering internals

## Data Contracts

### Main entity

`BadWorkplaceReport`

Fields required for reconstruction:

- identity:
  - `id`
  - `siteId`
  - `title`
  - `reportKind`
  - `reportMonth`
- workflow:
  - `status`
  - `dispatchCompleted`
  - `controllerReview`
- source linkage:
  - `sourceMode`
  - `sourceSessionId`
  - `sourceFindingIds`
- summary fields:
  - `guidanceDate`
  - `confirmationDate`
  - `progressRate`
  - `implementationCount`
- people/dispatch fields:
  - `reporterUserId`
  - `reporterName`
  - `receiverName`
  - `assigneeContact`
  - `agencyName`
  - `agencyRepresentative`
  - `notificationDate`
  - `attachmentDescription`
- snapshot:
  - `siteSnapshot.*`
- detailed content:
  - `violations`
- persistence:
  - `updatedAt`

### Violation entity

Each violation row must preserve:

- `id`
- `sourceFindingId`
- `legalReference`
- `hazardFactor`
- `improvementMeasure`
- `guidanceDate`
- `nonCompliance`
- `confirmationDate`
- `accidentType`
- `causativeAgentKey`

### Read API

- report lookup:
  - `fetchSafetyReportByKey(token, reportKey)`

Lookup behavior:

- 404 means “no existing report yet” and is not treated as a fatal error

### Write API

- save:
  - `upsertSafetyReport(token, buildBadWorkplaceUpsertInput(report, site))`

### Output APIs

- HWPX download by report key
- PDF download by report key with fallback helper available on mobile

## Caching and Persistence

- page resolves current site from shared inspection-session store
- source sessions come from shared site session list
- page state refetches existing report whenever:
  - auth becomes ready
  - current site changes
  - current user changes
  - report key changes
- successful save refreshes site operational index cache
- editor mutations are local until save/export

## State Model

### Page state

- `existingReport`
- `existingReportLoading`
- `existingReportError`
- `currentSite`
- `siteSessions`
- `isAdminView`
- `backHref`
- `backLabel`
- `reportKey`
- `initialDraft`

### Web editor state

- `draft`
- `documentError`
- `isGeneratingHwpx`
- `notice`
- `sourceModalOpen`

### Mobile state

- `documentInfoOpen`
- `sourceModalOpen`
- `documentError`
- `draft`
- `notice`

### Derived state

- `selectedSession`
- `sourceModeLabel`

## Business Rules

### Existing-report resolution

- if the fetched report maps to a bad-workplace report for another site:
  - ignore it
  - treat as missing for this page

### Draft id rule

- report id for new drafts is deterministic:
  - `buildBadWorkplaceReportKey(site.id, reportMonth, reporter.id || 'anonymous')`

### Source session ordering

- candidate source sessions are sorted newest first by guidance date/update time
- default source session for a new draft is the newest available technical-guidance session

### Source mode rules

Allowed source modes:

- `previous_unresolved`
- `current_new_hazard`

Display labels:

- `previous_unresolved` => `이전 지적사항 미이행`
- `current_new_hazard` => `당회차 신규 위험`

Mode switching must regenerate violations from the current selected session.

### Violation generation rules

Violation rows are built from meaningful `document7Findings`.

Source behavior:

- if source mode is `current_new_hazard`:
  - non-compliance text becomes a fixed “current new hazard” message
- if source mode is `previous_unresolved`:
  - follow-up status/result is used when available
  - unresolved/pending outcomes generate non-compliance text

Violation defaults pull from:

- doc7 finding fields
- matching doc4 follow-up for the same `sourceFindingId`

### Site snapshot sync rules

- site snapshot starts from `site.adminSiteSnapshot`
- when existing report exists:
  - non-empty persisted snapshot fields override current snapshot defaults
- changing `siteManagerName` also updates `receiverName`

### Reporter/contact rules

- reporter name prefers:
  - selected session drafter
  - current user
  - site assignee name
- assignee contact is only auto-kept when reporter identity still matches the source drafter

### Legacy normalization rules

- agency name fallback normalizes legacy placeholders to:
  - `한국종합안전`
- agency representative fallback normalizes legacy/default placeholders to:
  - `장정규`

### Save/export rules

- save refreshes `updatedAt`
- HWPX export must:
  1. refresh `updatedAt`
  2. save latest draft
  3. request HWPX by report key
- mobile PDF export may use PDF endpoint with fallback path

## UI Composition

### Web shell

- worker/admin shell wrapper
- back control
- page title from draft title
- `BadWorkplaceReportEditor`

### Web editor sections

- summary toolbar
- source selection section
- source selection modal
- site snapshot section
- violations section

### Mobile shell

- `MobileShell`
- summary section with save/export/document-info actions
- source section
- site info section
- notification section
- violations section
- source modal
- document info modal

## Interaction Flows

### Initial open

1. resolve auth, current site, and site sessions
2. derive deterministic report key from site/month/user
3. fetch existing report by key
4. if not found, build new draft from latest source session
5. render web or mobile shell around the same draft rules

### Change source session

1. user opens source modal
2. picks one technical-guidance session
3. regenerate report through `syncBadWorkplaceReportSource(...)`
4. update notice and close modal

### Change source mode

1. user toggles source mode
2. regenerate report from currently selected session and current finding selection
3. show mode-specific notice

### Manual editing

1. user edits snapshot, notification, or violation fields
2. patch only the targeted local draft fields
3. preserve all untouched generated content

### Save

1. user taps save
2. stamp `updatedAt`
3. upsert report via operational-report mutation helper
4. refresh operational report index
5. show success notice

### Export

1. user taps HWPX or PDF action
2. save latest draft first
3. fetch generated document by report key
4. save file locally

## Error Handling

- expired login:
  - `로그인이 만료되었습니다. 다시 로그인해 주세요.`
- page load failure:
  - `getBadWorkplacePageErrorMessage(...)`
- save failure bubbles through shared operational mutation error state
- document generation failure is stored as `documentError`
- mobile save wrapper converts save failure into user-facing `loadError` message

## Non-Obvious Constraints

- this flow is not free-form; most of the meaningful content is regenerated from one selected source session
- report key is user-specific because reporter id participates in key generation
- source mode changes are destructive recalculations of the violation list, not cosmetic flags
- receiver name is coupled to site manager name edits
- web and mobile differ in presentation, but the same bad-workplace source-sync rules must stay identical

## Recovery Checklist

- [ ] route resolves current site and deterministic report key
- [ ] existing report loads, 404 fallback creates new draft
- [ ] newest technical-guidance session becomes the default source when available
- [ ] source session and source mode both regenerate violations
- [ ] site manager edit updates receiver name
- [ ] save refreshes operational index
- [ ] HWPX/PDF export saves latest draft first
- [ ] mobile shell preserves the same source/draft behavior as web

## Verification

- targeted typecheck
- one web pass:
  - open report
  - switch source mode
  - switch source session
  - edit one violation
  - save and download HWPX
- one mobile pass:
  - open report
  - edit snapshot field
  - save
