# Admin AIDLC Batch 6: Report / Schedule / Dispatch Sync

## Goal

Align admin reports with the new source-of-truth split:

- schedules own visit planning state
- reports own execution and dispatch state
- sites keep only the latest cached visit summary

This batch keeps admin list/detail UI, analytics backfill, and mocked smoke aligned with that
server-side model.

## Scope

- `app/api/admin/reports/[reportKey]/dispatch/route.ts`
- `features/admin/lib/control-center-model/analyticsRevenueEvents.ts`
- `features/admin/lib/control-center-model/analyticsSourceBackfill.ts`
- `features/admin/sections/reports/**`
- `lib/admin/controllerReports.ts`
- `lib/admin/reportMeta.ts`
- `lib/admin/siteContractProfile.ts`
- `lib/erpReports/mappers.ts`
- `server/admin/automation.ts`
- `server/admin/upstreamMappers.ts`
- `server/excelImport/importedSchedules.ts`
- `tests/client/fixtures/adminSmokeHarness.ts`
- `types/admin.ts`
- `types/backend.ts`

## Contract Pack

### Feature contracts

- `admin-control-center`
- `admin-reports`
- `admin-sites`

### Mocked smoke

- `tests/client/admin/admin-control-center.spec.ts`
- `tests/client/admin/admin-reports.spec.ts`
- `tests/client/admin/admin-sites.spec.ts`

## Implementation Record

### Expected outputs

- Quarterly and bad-workplace reports stop depending on synthetic `visit_date`.
- Admin dispatch editing stores delivery metadata separately from computed overdue/warning signals.
- Schedule rows support `postponed` and expose `actualVisitDate`.
- Mocked admin reads and backfill logic stay consistent with the schedule/report/source split.

### Actual results

- Admin dispatch route now forwards persisted delivery fields:
  - `dispatch_status`
  - `dispatch_method`
  - `dispatched_at`
  - `dispatch_checked_by`
  - `dispatch_checked_at`
- Report list/detail UI now separates:
  - top-level dispatch signal for dashboard meaning
  - nested dispatch delivery metadata for stored send/check state
- Manual dispatch completion from admin reports now records `manual_checked` with history entries
  instead of writing legacy sent-complete timestamps.
- Admin report success toasts and the quarterly dispatch dialog action label now stay aligned with
  the mocked/real smoke contract:
  - `보고서 품질 체크를 저장했습니다.`
  - `분기 보고서 발송 이력`
  - `관제 수동 완료 처리`
  - `분기 보고서 발송 정보를 저장했습니다.`
- Quarterly and bad-workplace upserts now send `visit_date: null`, leaving true period keys in
  `quarterKey/periodStartDate/periodEndDate` and `reportMonth`.
- Schedule parsing/backfill/import helpers now preserve `actualVisitDate` and accept the new
  `postponed` schedule status.
- Mocked admin smoke fixtures now use the new dispatch shape and no longer seed synthetic visit
  dates for quarterly and bad-workplace reports.
- Admin reports now keep a short-lived session cache for the current filter/page key so reopening
  `/admin?section=reports` does not always wait on a cold fetch.
- Legacy technical-guidance rows now try session hydration before navigation and fall back to the
  archived original PDF when the structured report body is still importing.

## Validation Commands

```bash
npx tsc --noEmit --pretty false
npm run lint
npm run aidlc:audit:admin
git diff --check
```

## Validation Run

- `npx tsc --noEmit --pretty false`
  - passed
- `npm run test:client:smoke -- admin-reports`
  - passed after aligning quarterly dispatch dialog/button labels with smoke expectations
- `npm run lint`
  - passed with pre-existing repo warnings outside this batch
- `npm run aidlc:audit:admin`
  - pending at record time; enforced again by commit hook
- `git diff --check`
  - pending at record time

## Residual Debt

- `features/admin/sections/reports/useReportDispatchActions.ts` and
  `features/admin/sections/reports/ReportsDispatchDialog.tsx` still own several UI-specific text and
  formatting concerns and are good split candidates if the dispatch surface grows again.
- `lib/admin/controllerReports.ts` and
  `server/admin/upstreamMappers.ts` now carry both compatibility mapping and new signal logic; once
  the legacy dispatch payload is fully retired, these layers can simplify further.
