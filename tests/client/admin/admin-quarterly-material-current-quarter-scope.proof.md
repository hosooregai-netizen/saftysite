# Admin Quarterly Material Current Quarter Scope Proof

- Verified the overview material summary now uses active current-quarter site scope instead of priority-only scope.
- Verified report payload material aggregation honors guidance dates from payload/meta and counts distinct material URLs, photo URLs, ids, locations, and measured values.
- Verified backend quarterly material summary diagnostics are preserved by the upstream mapper instead of being reduced to priority quarterly rows.
- Verified direct `quarterly_material_tracking` / `quarterlyMaterialTracking` records remain available as fallback when memo tracking is absent for a quarter.

Proof:
- `npx tsx --test app/api/admin/dashboard/overview/route.test.ts features/admin/lib/control-center-model/overviewModel.test.ts`
- `npx eslint server/admin/upstreamMappers.ts features/admin/lib/control-center-model/quarterlyMaterials.ts features/admin/sections/overview/OverviewMaterialGapSection.tsx`
- `npx eslint lib/admin/siteContractProfile.ts features/admin/lib/control-center-model/overviewModel.ts features/admin/lib/control-center-model/overviewModel.test.ts`
