# Batch 14: Overview Report Navigation

## Summary

- Fixed admin overview unsent-report rows so they keep the correct report-type filter when routing to the reports section.
- Preferred locally derived overview links for unsent-report and priority-quarterly rows when upstream overview payloads provide stale or incorrect href values.

## Changed Files

- `features/admin/lib/control-center-model/overviewModel.ts`
- `features/admin/sections/overview/useAdminOverviewSectionState.ts`

## Validation

- `npx tsc --noEmit`
- `./node_modules/.bin/eslint.cmd --max-warnings=0 features/admin/lib/control-center-model/overviewModel.ts features/admin/sections/overview/useAdminOverviewSectionState.ts`
