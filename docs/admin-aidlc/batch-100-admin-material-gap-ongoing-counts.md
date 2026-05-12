# Batch 100: Admin Material Gap Ongoing Counts

## Scope

- `features/admin/lib/control-center-model/overviewModel.test.ts`
- `features/admin/lib/control-center-model/quarterlyMaterials.ts`
- `features/admin/sections/overview/OverviewMaterialGapSection.tsx`

## Change

- Kept the overview material summary aligned with ongoing current-quarter active sites by testing ended current-quarter rows out of scope.
- Counted same-instrument measurement rows as distinct when they have substantive row ids or common payload aliases such as photo asset ids, image URLs, location aliases, and measurement value aliases.
- Kept id-only empty measurement rows out of material counts.
- Removed internal material reduction reason text from the visible material gap table while preserving diagnostics in mapped data.

## Validation

- `npx tsx --test app/api/admin/dashboard/overview/route.test.ts features/admin/lib/control-center-model/overviewModel.test.ts`
- `npx eslint features/admin/lib/control-center-model/quarterlyMaterials.ts features/admin/sections/overview/OverviewMaterialGapSection.tsx features/admin/lib/control-center-model/overviewModel.test.ts`
