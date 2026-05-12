# Batch 99: Quarterly Material Current Quarter Scope

## Scope

- `app/api/admin/dashboard/overview/route.test.ts`
- `features/admin/lib/control-center-model/overviewModel.ts`
- `features/admin/lib/control-center-model/overviewModel.test.ts`
- `features/admin/lib/control-center-model/quarterlyMaterials.ts`
- `lib/admin/siteContractProfile.ts`
- `server/admin/upstreamMappers.ts`

## Change

- Scoped the admin overview education/measurement material summary to active sites that overlap the current quarter, including non-priority project amounts.
- Aligned frontend report payload material aggregation with backend quarter precedence: visit date, payload guidance date, meta guidance/report date, then updated date.
- Counted distinct education/measurement material records by substantive fields such as URL, photo, id, location, measured value, and content while still deduping exact duplicates.
- Preserved backend quarterly material summary totals in the upstream mapper instead of reducing them to priority quarterly rows.
- Added direct `quarterly_material_tracking` / `quarterlyMaterialTracking` fallback parsing when memo tracking is missing for a quarter.

## Validation

- `npx tsx --test app/api/admin/dashboard/overview/route.test.ts features/admin/lib/control-center-model/overviewModel.test.ts`
- `npx eslint server/admin/upstreamMappers.ts features/admin/lib/control-center-model/quarterlyMaterials.ts features/admin/sections/overview/OverviewMaterialGapSection.tsx`
- `npx eslint lib/admin/siteContractProfile.ts features/admin/lib/control-center-model/overviewModel.ts features/admin/lib/control-center-model/overviewModel.test.ts`
