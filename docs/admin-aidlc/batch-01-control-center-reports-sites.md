# Admin AIDLC Batch 1: Control Center Model + Reports + Sites

## Goal

Lock the first admin AIDLC batch around the three highest-value refactors:

- `buildAdminControlCenterModel`
- `ReportsSection`
- `SitesSection`

This batch uses one contract pack so spec, validation, and record stay together.

## Scope

### Split boundaries

- `features/admin/lib/control-center-model/**`
- `features/admin/sections/reports/**`
- `features/admin/sections/sites/**`
- `tests/client/admin/**`
- `tests/client/fixtures/adminSmokeHarness.ts`
- `scripts/smoke-real-client/admin-sections/**`
- `scripts/smokeRealAdmin.ts`

### Protected user flows

- `/admin?section=overview` and `/admin?section=analytics` still render core overview and analytics markers.
- `/admin?section=reports` still supports list load, quality review save, and dispatch history editing.
- `/admin?section=headquarters` still supports site list load, filtering, site edit/create, and assignment modal entry.

## Contract Pack

### Feature contracts

- `admin-control-center`
- `admin-reports`
- `admin-sites`

### Mocked smoke

- `tests/client/admin/admin-control-center.spec.ts`
- `tests/client/admin/admin-reports.spec.ts`
- `tests/client/admin/admin-sites.spec.ts`

### Real smoke

- `npm run smoke:real:admin -- --sections control-center,reports,sites`

## Validation Commands

```bash
npx eslint features/admin/components/AdminDashboardSectionContent.tsx \
  features/admin/lib/buildAdminControlCenterModel.ts \
  features/admin/lib/control-center-model/*.ts \
  features/admin/sections/reports/*.ts \
  features/admin/sections/reports/*.tsx \
  features/admin/sections/sites/*.ts \
  features/admin/sections/sites/*.tsx \
  tests/client/admin/*.ts \
  tests/client/fixtures/adminSmokeHarness.ts \
  tests/client/featureContracts.ts \
  tests/client/runSmoke.ts \
  scripts/smoke-real-client/admin-flow.ts \
  scripts/smoke-real-client/admin-sections/*.ts \
  scripts/smokeRealAdmin.ts

npx tsc --noEmit --pretty false
npm run aidlc:audit:admin
npm run test:client:smoke -- admin-control-center admin-reports admin-sites
npm run smoke:real:admin -- --sections control-center,reports,sites
git diff --check
```

## Implementation Record

### Expected outputs

- `buildAdminControlCenterModel.ts` becomes a thin public facade.
- `ReportsSection.tsx` becomes a shell with state, filters, table, and dialogs split out.
- `SitesSection.tsx` becomes a shell with state, filter menu, table, and editor modal split out.
- Admin AIDLC gets its own audit scope without changing the ERP default scope.

### Actual results

- `buildAdminControlCenterModel.ts` is now a thin public facade and the new
  `features/admin/lib/control-center-model/` folder is the contract boundary for
  overview/analytics builders and export helpers.
- `ReportsSection.tsx` was reduced to a shell and split into:
  `useReportsSectionState.ts`, `reportsSectionFilters.ts`,
  `ReportsFilterMenu.tsx`, `ReportsTable.tsx`, `ReportsReviewDialog.tsx`,
  `ReportsDispatchDialog.tsx`, `useReportDocumentActions.ts`,
  `useReportDispatchActions.ts`, and `reportsSectionTypes.ts`.
- `SitesSection.tsx` was reduced to a shell and split into:
  `useSitesSectionState.ts`, `siteSectionHelpers.ts`, `SitesFilterMenu.tsx`,
  `SitesTable.tsx`, and `SiteEditorModal.tsx`.
- Admin contract pack landed:
  - feature contracts: `admin-control-center`, `admin-reports`, `admin-sites`
  - mocked smoke: `tests/client/admin/admin-control-center.spec.ts`,
    `tests/client/admin/admin-reports.spec.ts`,
    `tests/client/admin/admin-sites.spec.ts`
  - real smoke entry: `npm run smoke:real:admin -- --sections control-center,reports,sites`
- Admin audit scope landed without changing the ERP default scope:
  - `npm run aidlc:audit` still targets ERP
  - `npm run aidlc:audit:admin` targets admin paths

### Validation run

- `npx eslint features/admin/components/AdminDashboardSectionContent.tsx features/admin/lib/buildAdminControlCenterModel.ts features/admin/lib/control-center-model/*.ts features/admin/sections/reports/*.ts features/admin/sections/reports/*.tsx features/admin/sections/sites/*.ts features/admin/sections/sites/*.tsx tests/client/admin/*.ts tests/client/fixtures/adminSmokeHarness.ts tests/client/fixtures/erpSmokeHarness.ts tests/client/featureContracts.ts tests/client/runSmoke.ts scripts/aidlcAudit.mjs scripts/smoke-real-client/config.ts scripts/smoke-real-client/admin-flow.ts scripts/smoke-real-client/admin-sections/*.ts scripts/smokeRealAdmin.ts`
  - passed
- `npx tsc --noEmit --pretty false`
  - passed
- `npm run aidlc:audit:admin`
  - passed as advisory audit
  - residual debt remains in legacy admin files, including
    `features/admin/lib/control-center-model/shared.ts`,
    `features/admin/sections/overview/AdminOverviewSection.tsx`,
    `features/admin/sections/analytics/AnalyticsSection.tsx`,
    `features/admin/sections/content/ContentItemsSection.tsx`
- `npm run test:client:smoke -- admin-control-center admin-reports admin-sites`
  - passed
- `npm run smoke:real:admin -- --sections control-center,reports,sites`
  - blocked in this environment because `SMOKE_SEED_PATH` and
    `LIVE_SAFETY_EMAIL/LIVE_SAFETY_PASSWORD` were not configured
  - config fallback was added so the script now fails with an explicit setup error
- `git diff --check`
  - passed

## Residual Debt

- Follow-up admin candidates after this batch:
  - `features/admin/lib/control-center-model/shared.ts`
  - `features/admin/sections/overview/AdminOverviewSection.tsx`
  - `features/admin/sections/analytics/AnalyticsSection.tsx`
  - `features/admin/sections/content/ContentItemsSection.tsx`
  - `features/admin/sections/schedules/SchedulesSection.tsx`
