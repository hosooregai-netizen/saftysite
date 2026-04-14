# Admin AIDLC Batch 5: K2B Round Schedule Revenue

## Goal

Align K2B Excel import with the real visit-level data shape so admin analytics uses imported
`회차 + 기술지도일 + 점검자` instead of treating each row as a plain site contract row.

## Scope

- `server/excelImport/**`
- `features/admin/lib/control-center-model/analyticsRevenueEvents.ts`
- `lib/excelImport/apiClient.ts`
- `tests/client/featureContracts.ts`

## Contract Pack

### Feature contracts

- `admin-control-center`
- `admin-sites`

### Mocked smoke

- `tests/client/admin/admin-control-center.spec.ts`
- `tests/client/admin/admin-sites.spec.ts`

## Implementation Record

### Expected outputs

- K2B rows are interpreted as per-round visit records.
- Imported visit rows upsert schedule data by `siteId + roundNo`.
- Worker linking prefers `점검자` over `지도원`.
- Analytics actual revenue uses imported schedules as the primary source.

### Actual results

- Added K2B visit-row mappings for `회차`, `기술지도일`, and `완료여부`.
- Local Excel apply now groups repeated rows by logical site, updates site metadata once, then merges
  imported round schedules into the site memo.
- Worker auto-provisioning now prefers `점검자` and only falls back to `지도원` when needed.
- Analytics schedule assignee fallback now prefers `site.inspector_name` before `guidance_officer_name`.
- Client Excel apply result mapping now exposes worker match summary fields consistently.
- Legacy analytics rows without stored schedules now backfill from existing technical guidance reports first,
  then fall back to inferred contract schedules when only contract range data remains.

## Validation Commands

```bash
noglob npx eslint server/excelImport/localImport.ts \
  server/excelImport/workerProvisioning.ts \
  server/excelImport/importedSchedules.ts \
  features/admin/lib/control-center-model/analyticsRevenueEvents.ts \
  lib/excelImport/apiClient.ts \
  tests/client/featureContracts.ts

npx tsc --noEmit --pretty false
npm run aidlc:audit:admin
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 npm run test:client:smoke -- admin-control-center admin-sites
git diff --check
```
