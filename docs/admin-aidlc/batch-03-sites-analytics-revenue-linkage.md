# Admin AIDLC Batch 3: Sites / Analytics Revenue Linkage

## Goal

Align admin site contract data and control-center analytics so site edits immediately affect planned
revenue, planned rounds, and per-visit revenue calculations without changing the public admin API
shape.

## Scope

- `lib/admin/siteContractProfile.ts`
- `features/admin/lib/control-center-model/**`
- `app/api/admin/dashboard/analytics/route.ts`
- `server/admin/exportSheets.ts`
- `server/admin/automation.ts`
- `features/admin/sections/sites/**`
- `tests/client/admin/admin-control-center.spec.ts`
- `tests/client/admin/admin-sites.spec.ts`
- `tests/client/fixtures/adminSmokeHarness.ts`
- `tests/client/fixtures/erpSmokeHarness.ts`
- `scripts/smoke-real-client/admin-sections/control-center.ts`
- `scripts/smoke-real-client/admin-sections/sites.ts`
- `tests/client/featureContracts.ts`

## Contract Pack

### Feature contracts

- `admin-control-center`
- `admin-sites`

### Mocked smoke

- `tests/client/admin/admin-control-center.spec.ts`
- `tests/client/admin/admin-sites.spec.ts`

### Real smoke

- `npm run smoke:real:admin -- --sections control-center,sites`

## Implementation Record

### Expected outputs

- Revenue resolution uses one shared helper with explicit `per_visit_amount` first, derived
  `total_contract_amount / total_rounds` second, and missing otherwise.
- `/api/admin/dashboard/analytics` and analytics export both use the local normalized admin builder.
- Site edit UX exposes `회차당 단가` and shows when auto-derived pricing is in effect.
- Control-center and sites contract pack both protect the new linkage.

### Actual results

- Added `resolveSiteRevenueProfile()` so analytics, completion checks, and site UI all share the
  same planned revenue / planned rounds / resolved per-visit amount logic.
- Analytics API now rebuilds from `fetchAdminCoreData()` + `fetchAdminReports()` via
  `buildAdminAnalyticsResponse()` instead of trusting upstream analytics aggregation directly.
- Analytics export now uses the same normalized builder path through server export.
- Site edit form now supports `per_visit_amount`, shows derived unit price guidance, and includes
  the resolved unit price in site list/export visibility.
- Admin mocked smoke now covers:
  - site contract edit -> analytics revenue refresh
  - analytics period switch + export
  - site create/edit with `회차당 단가`

## Validation Commands

```bash
npx eslint app/api/admin/dashboard/analytics/route.ts \
  server/admin/exportSheets.ts \
  server/admin/automation.ts \
  lib/admin/siteContractProfile.ts \
  features/admin/lib/control-center-model/analyticsSupport.ts \
  features/admin/lib/control-center-model/analyticsContractRows.ts \
  features/admin/lib/control-center-model/analyticsSummary.ts \
  features/admin/lib/control-center-model/analyticsModel.ts \
  features/admin/sections/analytics/useAnalyticsSectionState.ts \
  features/admin/sections/sites/siteSectionHelpers.ts \
  features/admin/sections/sites/SiteEditorModal.tsx \
  features/admin/sections/sites/SitesTable.tsx \
  features/admin/sections/sites/useSitesSectionState.ts \
  tests/client/fixtures/erpSmokeHarness.ts \
  tests/client/fixtures/adminSmokeHarness.ts \
  tests/client/admin/admin-control-center.spec.ts \
  tests/client/admin/admin-sites.spec.ts \
  tests/client/featureContracts.ts \
  scripts/smoke-real-client/admin-sections/control-center.ts \
  scripts/smoke-real-client/admin-sections/sites.ts

npx tsc --noEmit --pretty false
npm run aidlc:audit:admin
npm run test:client:smoke -- admin-control-center
npm run test:client:smoke -- admin-sites
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run smoke:real:admin -- --sections control-center,sites
git diff --check
```

## Validation Run

- `npx eslint ...`
  - passed
- `npx tsc --noEmit --pretty false`
  - passed
- `npm run aidlc:audit:admin`
  - passed as advisory audit
  - existing WARN/HARD oversized admin files remain, including `analyticsModel.ts`,
    `analyticsSupport.ts`, `SiteEditorModal.tsx`, `SitesTable.tsx`, `siteSectionHelpers.ts`,
    `useSitesSectionState.ts`
- `npm run test:client:smoke -- admin-control-center`
  - passed against local app at `http://127.0.0.1:3100`
- `npm run test:client:smoke -- admin-sites`
  - passed against local app at `http://127.0.0.1:3100`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run smoke:real:admin -- --sections control-center,sites`
  - blocked in this environment
  - exact blocker: `Missing smoke seed. Provide SMOKE_SEED_PATH (/tmp/safety-e2e-seed.json) or LIVE_SAFETY_EMAIL/LIVE_SAFETY_PASSWORD.`
- `git diff --check`
  - passed

## Residual Debt

- `features/admin/lib/control-center-model/analyticsModel.ts` and
  `features/admin/lib/control-center-model/analyticsSupport.ts` are still over the preferred AIDLC
  size target.
- `features/admin/sections/sites/SiteEditorModal.tsx`, `SitesTable.tsx`, `siteSectionHelpers.ts`,
  and `useSitesSectionState.ts` remain split candidates if the site management surface grows again.
