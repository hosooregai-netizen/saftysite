# Batch 101: Material Stale Summary Scope

## Scope

- `features/admin/sections/overview/useAdminOverviewSectionState.ts`
- `features/admin/sections/overview/useAdminOverviewSectionState.test.ts`
- `server/admin/upstreamMappers.ts`
- `app/api/admin/dashboard/overview/route.test.ts`

## Change

- Detect the stale material summary case where upstream `missingSiteRows` already match the current-quarter fallback rows but `entries` and `totalSiteCount` still use the old all-active-site scope.
- Replace the material summary with the fallback summary when the row payloads agree but the summary scope differs, keeping the overview donut aligned with the material gap table.
- Normalize the Next admin overview API response to the mapped priority quarterly management scope, so a stale upstream material summary cannot return `28 total / 1 missing row` to the client.

## Validation

- `npx.cmd tsx --test features/admin/sections/overview/useAdminOverviewSectionState.test.ts`
- `npx.cmd tsx --test app/api/admin/dashboard/overview/route.test.ts`
- `npx.cmd tsx --test features/admin/lib/control-center-model/overviewModel.test.ts`
