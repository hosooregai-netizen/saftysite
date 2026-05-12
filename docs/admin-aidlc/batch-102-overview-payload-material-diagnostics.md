# Batch 102: Overview Payload And Material Diagnostics

## Scope

- `app/api/admin/dashboard/overview/route.ts`
- `server/admin/upstreamMappers.ts`
- `server/admin/overviewRouteCache.ts`
- `server/admin/safetyApiServer.ts`
- `server/admin/exportSheets.ts`
- `features/admin/lib/control-center-model/overviewModel.ts`
- `features/admin/sections/overview/useAdminOverviewSectionState.ts`
- `features/admin/sections/overview/OverviewMaterialGapSection.tsx`
- `types/admin.ts`
- `types/backend.ts`

## Change

- Overview payload rows are capped by default while preserving total counts for alerts and completion rows.
- Full row delivery is kept explicit through the overview full-row option used by export flows.
- Material diagnostics remain available in mapped data, but the overview shortage table no longer renders raw/distinct/counted debug text.
- Route cache and stale-source handling keep response metadata explicit.

## Validation

- `python -m pytest` in `back`
- `npx tsc --noEmit`
- `npx tsx app/api/admin/dashboard/overview/route.test.ts`
- `npx tsx features/admin/sections/overview/useAdminOverviewSectionState.test.ts`
- `npx tsx server/admin/overviewPolicyOverlay.test.ts`
- `npx tsx server/admin/overviewRouteCache.test.ts`
- `npx tsx features/admin/lib/control-center-model/overviewModel.test.ts`
- `npx eslint` on the changed admin TypeScript and TSX files
