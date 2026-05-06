# Batch 101: Material Stale Summary Scope

## Scope

- `features/admin/sections/overview/useAdminOverviewSectionState.ts`
- `features/admin/sections/overview/useAdminOverviewSectionState.test.ts`

## Change

- Detect the stale material summary case where upstream `missingSiteRows` already match the current-quarter fallback rows but `entries` and `totalSiteCount` still use the old all-active-site scope.
- Replace the material summary with the fallback summary when the row payloads agree but the summary scope differs, keeping the overview donut aligned with the material gap table.

## Validation

- `npx.cmd tsx --test features/admin/sections/overview/useAdminOverviewSectionState.test.ts`
- `npx.cmd tsx --test features/admin/lib/control-center-model/overviewModel.test.ts`
