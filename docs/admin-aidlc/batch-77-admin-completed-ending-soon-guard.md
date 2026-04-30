# Batch 77: Admin Completed Ending Soon Guard

## Scope

- Admin control-center overview lifecycle filtering.
- Client-side fallback overview models.
- Local Excel schedule import merge behavior.

## What Changed

- Normalize `contract_status=completed` sites as closed in the shared admin
  lifecycle helper.
- Use normalized lifecycle status when building active-site overview data so
  completed contract sites do not leak into ending-soon or active-site widgets.
- Keep imported completed schedules terminal when local Excel/K2B schedule data
  is merged.

## Proof

- `git diff --check`
- `npx eslint features/admin/lib/control-center-model/overviewModel.ts features/admin/lib/control-center-model/overviewPolicies.ts features/admin/lib/control-center-model/overviewPolicies.test.ts lib/admin/lifecycleStatus.ts server/excelImport/importedSchedules.ts server/excelImport/importedSchedules.test.ts features/admin/lib/buildAdminOverviewModel.ts`
- `npx tsx features/admin/lib/control-center-model/overviewPolicies.test.ts`
- `npx tsx server/excelImport/importedSchedules.test.ts`
