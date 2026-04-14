# Admin AIDLC Batch 4: Headquarters / Sites / Site Main Data Structure

## Goal

Expand the `/admin?section=headquarters` drilldown so business registration data, site contract data,
and site-main management context can be entered and reviewed without leaving broken gaps between
`사업장 목록 -> 현장 목록 -> 현장 메인`.

## Transcript Signals

- 2026-04-10 voice notes highlighted missing `계약유형`, `현장소장/현장대리인 메일 기준`, `회차 단가`,
  `20억 이상/고위험` visibility, and a stronger site-main management view.
- The same notes also called out that headquarter/site records need more complete registration and
  contact data before downstream reporting and dispatch workflows are reliable.

## Scope

- `features/admin/sections/headquarters/**`
- `features/admin/sections/sites/**`
- `features/admin/sections/AdminSectionShared.module.css`
- `tests/client/admin/admin-sites.spec.ts`
- `tests/client/fixtures/erpSmokeHarness.ts`
- `scripts/smoke-real-client/admin-sections/sites.ts`
- `tests/client/featureContracts.ts`
- `tooling/internal/smokeClient_impl.ts`

## Design Inputs

- Local baseline: `docs/design-guidelines.md`
  - keep summary cards to 3~4
  - keep list actions in the section header
  - prefer table/list blocks over card sprawl for repeated ERP records
  - remove repeated explanatory copy and duplicated field display
- External ERP pattern references checked during the refinement:
  - SAP Fiori `List Report` and `Object Page`
  - Odoo `List` / `Form` view split
  - ERPNext `Desk / Workspace` shortcut pattern

## Contract Pack

### Feature contracts

- `admin-sites`

### Mocked smoke

- `tests/client/admin/admin-sites.spec.ts`

### Real smoke

- `npm run smoke:real:admin -- --sections sites`

## Implementation Record

### Expected outputs

- Business edit/create captures management/opening numbers, registration numbers, contact person,
  address, and memo.
- Site edit/create captures contract type/status, manager phone, site code, management number, and
  memo alongside the existing revenue fields.
- Selected headquarter view shows a summary panel before the site list.
- Selected site view shows an admin management summary with quick edit before the ERP site hub.

### Actual results

- Headquarter modal now groups identification and contact data into two sections and the table/export
  show richer registration/contact context.
- Headquarter list now adds a compact summary strip and removes duplicated address display from the
  row so the table behaves more like an ERP comparison list.
- Site modal now groups `기본 정보`, `연락 및 발주처 정보`, `계약 및 단가`, `운영 메모` and adds
  `현장코드`, `현장관리번호`, `현장소장 연락처`, `계약유형`, `계약상태`, `운영 메모`.
- Site list search/export now include the new code/contact/contract fields, trims repeated row
  metadata, removes misleading headquarter fallbacks, and keeps the selected business context above
  the table.
- Site main now follows a clearer `back/context -> summary -> detail + shortcut rail` structure so
  business context, contract state, dispatch contact data, missing data chips, and admin quick
  links appear before the ERP report hub without repeating the same values in multiple cards.
- Editor modals dropped repeated “current selection” and section-description copy unless the hint
  directly affects user input, such as derived per-visit pricing or dispatch email use.
- Headquarter save flow now validates field length and duplicate management/opening numbers before
  sending `PATCH /headquarters/:id`, and the client upgrades opaque upstream 500 messages into a
  more actionable admin hint.
- Site save flow now validates visible `site_code` duplicates and key field lengths before sending
  `PATCH /sites/:id`, so obvious collisions are blocked in the admin UI first.
- Investigation also found a semantic mismatch risk around `site_code`: local Excel import still
  maps `headquarter_opening_number -> site_code`, and downstream doc review still describes
  `site_code` as the source for `사업장개시번호`.
- Server admin CRUD now removes the legacy mirroring path that used to overwrite
  `sites.management_number/site_code` from `headquarters.management_number/opening_number` during
  `POST/PATCH /sites` and `PATCH /headquarters`.
- Startup backfill now remains one-way for missing headquarter numbers only: it can fill
  `headquarters.management_number/opening_number` from older site data, but it no longer mirrors
  headquarter numbers back into every child site document.
- Admin site search/export now reads headquarter business numbers from `headquarter_detail` only,
  so the admin drilldown no longer treats `site.management_number/site_code` as fallback business
  registration fields.
- Updated mocked fixtures and admin smoke so the contract protects:
  - business create/edit
  - site create/edit with contract type/status and manager phone
  - site-main quick edit path
  - assignment modal entry after the new flow

## Validation Commands

```bash
npx eslint features/admin/sections/headquarters/HeadquarterEditorModal.tsx \
  features/admin/sections/headquarters/HeadquarterSummaryPanel.tsx \
  features/admin/sections/headquarters/HeadquartersSection.tsx \
  features/admin/sections/headquarters/HeadquartersTable.tsx \
  features/admin/sections/headquarters/SiteManagementMainPanel.tsx \
  features/admin/sections/headquarters/useHeadquartersSectionState.ts \
  features/admin/sections/sites/SiteEditorModal.tsx \
  features/admin/sections/sites/siteSectionHelpers.ts \
  features/admin/sections/sites/SitesSection.tsx \
  features/admin/sections/sites/SitesTable.tsx \
  features/admin/sections/sites/useSitesSectionState.ts \
  tests/client/admin/admin-sites.spec.ts \
  tests/client/featureContracts.ts \
  tests/client/fixtures/erpSmokeHarness.ts \
  scripts/smoke-real-client/admin-sections/sites.ts \
  tooling/internal/smokeClient_impl.ts

npx tsc --noEmit --pretty false
npm run aidlc:audit:admin
npm run test:client:smoke -- admin-sites
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run smoke:real:admin -- --sections sites
git diff --check
```

## Validation Run

- `npx eslint ...`
  - passed
- live upstream OpenAPI check (`http://52.64.85.49:8011/openapi.json`)
  - confirmed `HeadquarterCreate` and `HeadquarterUpdate` do declare the expanded headquarter
    fields, so the observed live `PATCH /headquarters/:id` 500 is likely an upstream runtime/data
    issue rather than a missing request schema field
  - confirmed `SiteCreate` and `SiteUpdate` still expose `site_code`, so the observed live
    `PATCH /sites/:id` `409` points more toward duplicate live data, hidden deleted rows, a
    repository self-conflict on update, or a semantic mismatch between `site_code` and
    `사업장개시번호`
- `npx tsc --noEmit --pretty false`
  - passed
- `npm run aidlc:audit:admin`
  - passed as advisory audit
  - existing WARN/HARD oversized admin files remain
  - touched files still over preferred size include `SiteEditorModal.tsx`, `SitesTable.tsx`,
    `siteSectionHelpers.ts`, `useSitesSectionState.ts`, `HeadquartersTable.tsx`,
    `SiteManagementMainPanel.tsx`
- `npm run test:client:smoke -- admin-sites`
  - passed against mocked harness at `http://127.0.0.1:3100`
- planned server regression checks after the semantic fix
  - verify live `sites` indexes no longer retain a legacy unique `site_code`
  - verify closed sites are included when investigating duplicate `site_code`
  - verify business-number edits no longer rewrite child site numbers
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run smoke:real:admin -- --sections sites`
  - blocked in this environment
  - exact blocker: `Missing smoke seed. Provide SMOKE_SEED_PATH (/tmp/safety-e2e-seed.json) or LIVE_SAFETY_EMAIL/LIVE_SAFETY_PASSWORD.`
- `git diff --check`
  - passed

## Residual Debt

- `features/admin/sections/sites/SiteEditorModal.tsx` is now carrying four visual sections and
  should be split into smaller modal section components in a later pass.
- `SitesTable.tsx`, `siteSectionHelpers.ts`, and `useSitesSectionState.ts` continue to carry broad
  site-management responsibility and remain AIDLC split candidates.
- Real admin smoke still needs seeded credentials or a local smoke seed file before this batch can
  be closed with integrated `/admin` verification.
