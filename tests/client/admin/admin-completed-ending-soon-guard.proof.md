# Admin Completed Ending Soon Guard Proof

## Expected

- Completed contract sites are excluded from current admin management scopes.
- Completed imported schedules are not reopened as planned schedules.
- Lint and diff checks pass for the touched admin control-center and import files.

## Validation

- `git diff --check`
- `npx eslint features/admin/lib/control-center-model/overviewModel.ts features/admin/lib/control-center-model/overviewPolicies.ts features/admin/lib/control-center-model/overviewPolicies.test.ts lib/admin/lifecycleStatus.ts server/excelImport/importedSchedules.ts server/excelImport/importedSchedules.test.ts features/admin/lib/buildAdminOverviewModel.ts`
- `npx tsx features/admin/lib/control-center-model/overviewPolicies.test.ts`
- `npx tsx server/excelImport/importedSchedules.test.ts`

## Result

- All commands passed locally before commit.
