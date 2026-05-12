# Batch 100: Material Summary Fallback Alignment

## Scope

- `features/admin/sections/overview/useAdminOverviewSectionState.ts`
- `features/admin/sections/overview/useAdminOverviewSectionState.test.ts`

## Change

- When the admin overview uses fallback material gap rows, it now uses the fallback material summary as a whole.
- This keeps the education/measurement donut `entries` and `totalSiteCount` aligned with the visible current-quarter gap table.

## Validation

- `npx.cmd tsx --test features/admin/sections/overview/useAdminOverviewSectionState.test.ts`
- `npx.cmd tsx --test features/admin/lib/control-center-model/overviewModel.test.ts`
