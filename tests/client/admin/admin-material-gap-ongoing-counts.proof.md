# Admin Material Gap Ongoing Counts Proof

- Verified ended current-quarter active-status sites stay out of the material summary fallback scope.
- Verified same-instrument measurement rows with distinct ids count as separate materials.
- Verified backend material diagnostics remain preserved by the route mapper while the visible overview material gap table renders only numeric status values.

Proof:
- `npx tsx --test app/api/admin/dashboard/overview/route.test.ts features/admin/lib/control-center-model/overviewModel.test.ts`
- `npx eslint features/admin/lib/control-center-model/quarterlyMaterials.ts features/admin/sections/overview/OverviewMaterialGapSection.tsx features/admin/lib/control-center-model/overviewModel.test.ts`
