# Admin AIDLC Batch 4: Analytics Schedule / Worker / Snapshot

## Goal

Move admin analytics onto schedule-driven actual revenue, connect Excel-imported guidance officers
to real user and assignment records, and keep analytics/export reads aligned through one server
snapshot path.

## Scope

- `features/admin/lib/control-center-model/**`
- `server/excelImport/**`
- `app/api/excel-imports/apply/route.ts`
- `app/api/admin/dashboard/analytics/**`
- `app/api/safety/[...path]/route.ts`
- `server/admin/analyticsSnapshot.ts`
- `server/admin/exportSheets.ts`
- `server/admin/safetyApiServer.ts`
- `features/admin/sections/excelImport/ExcelImportSection.tsx`
- `tests/client/admin/admin-control-center.spec.ts`
- `tests/client/admin/admin-sites.spec.ts`
- `tests/client/fixtures/adminSmokeHarness.ts`
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

- Actual revenue uses elapsed `plannedDate` schedules first and legacy technical-guidance reports only as fallback.
- Excel apply matches or creates `field_agent` users from `guidance_officer_name` and links site assignments.
- Analytics API and export read the same server snapshot and refresh after relevant writes.

### Actual results

- Added `analyticsRevenueEvents.ts` so summary cards, trend rows, contract rows, employee rows, and
  site revenue rows all read one schedule-first revenue event source.
- Actual revenue KPI labels now reflect `방문 일정 경과 기준`, while planned revenue and planned rounds
  still come from site contract data.
- Excel apply now:
  - loads users and assignments from admin core data
  - matches unique existing users by guidance officer name
  - creates placeholder `field_agent` users when no match exists
  - creates or reactivates assignments for the matched/generated worker
  - returns worker match summary counts in the apply result
- Analytics snapshot caching now lives in `server/admin/analyticsSnapshot.ts`, and refresh is triggered by:
  - admin site/schedule/report routes
  - Excel apply
  - proxied safety writes for users, assignments, headquarters, sites, and report upserts/status writes
- Client-side analytics snapshot refresh after admin mutations is treated as best-effort; if the
  background refresh is unavailable, the forced dashboard reload still updates the visible admin
  data without surfacing a browser console error.
- Mocked admin harness now seeds elapsed schedules into the site memo so control-center smoke protects
  schedule-based revenue instead of report-only revenue.

## Validation Commands

```bash
noglob npx eslint app/api/admin/dashboard/analytics/route.ts \
  app/api/admin/dashboard/analytics/refresh/route.ts \
  'app/api/admin/reports/[reportKey]/dispatch-events/route.ts' \
  'app/api/admin/reports/[reportKey]/dispatch/route.ts' \
  'app/api/admin/reports/[reportKey]/review/route.ts' \
  'app/api/admin/schedules/[scheduleId]/route.ts' \
  'app/api/admin/sites/[siteId]/schedules/generate/route.ts' \
  'app/api/safety/[...path]/route.ts' \
  app/api/excel-imports/apply/route.ts \
  features/admin/hooks/useAdminDashboardState.ts \
  features/admin/lib/control-center-model/analyticsContractRows.ts \
  features/admin/lib/control-center-model/analyticsModel.ts \
  features/admin/lib/control-center-model/analyticsRevenueEvents.ts \
  features/admin/lib/control-center-model/analyticsRevenueRules.ts \
  features/admin/lib/control-center-model/analyticsSummary.ts \
  features/admin/lib/control-center-model/analyticsSupport.ts \
  features/admin/sections/excelImport/ExcelImportSection.tsx \
  lib/admin/apiClient.ts \
  server/admin/analyticsSnapshot.ts \
  server/admin/exportSheets.ts \
  server/admin/safetyApiServer.ts \
  server/excelImport/localImport.ts \
  server/excelImport/workerProvisioning.ts \
  tests/client/admin/admin-control-center.spec.ts \
  tests/client/admin/admin-sites.spec.ts \
  tests/client/fixtures/adminSmokeHarness.ts \
  tests/client/featureContracts.ts \
  tooling/internal/smokeClient_impl.ts \
  types/controller.ts

npx tsc --noEmit --pretty false
npm run aidlc:audit:admin
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 npm run test:client:smoke -- admin-control-center admin-sites
git diff --check
```

## Validation Run

- `noglob npx eslint ...`
  - passed
- `npx tsc --noEmit --pretty false`
  - passed
- `npm run aidlc:audit:admin`
  - pending for this batch
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 npm run test:client:smoke -- admin-control-center admin-sites`
  - passed
- `npm run test:client:smoke -- admin-control-center`
  - passed after mutating a site from headquarters and re-entering analytics without console errors
- `git diff --check`
  - pending for this batch

## Residual Debt

- `features/admin/lib/control-center-model/analyticsModel.ts` is still the densest analytics file and is
  the next split candidate if the schedule/event rules grow again.
- `server/excelImport/localImport.ts` now owns more cross-entity orchestration and should likely split into
  parse/apply/worker-link helpers if import rules expand further.
