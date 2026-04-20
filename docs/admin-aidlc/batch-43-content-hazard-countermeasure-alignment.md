# Batch 43: Content Hazard Countermeasure Alignment

## Why
- the `hazard_countermeasure_catalog` content type is edited as structured hazard/countermeasure data, but the admin content modal still exposed the generic body textarea
- the admin copy still described the field as `안전대책` even though the catalog data is stored and matched as `관리대책`, then reused by downstream doc8 and quarterly flows as the safety-measure text
- some catalog payloads arrive with `safetyMeasure` or `safety_measure`, so the shared reader needed to accept those aliases without dropping the management-measure value

## What changed
- `features/admin/sections/content/ContentItemsSection.tsx` now hides the duplicate freeform body textarea for `hazard_countermeasure_catalog`, matching the existing structured content types
- `lib/admin/adminShared.ts` now labels the field as `관리대책` and clarifies that the same value is reused as the safety-measure copy on the writing screens
- `lib/hazardCountermeasureCatalog.ts` now reads `safetyMeasure` and `safety_measure` as aliases for the catalog management-measure field

## Proof
- `tests/client/admin/admin-content-paging-and-delete-copy.md`

## Validation
- `npx tsc --noEmit --pretty false`
- `npm run aidlc:audit:admin`

## Residual
- the admin smoke pack still protects content entry through the shared `admin-control-center` contract; there is not yet a dedicated mocked smoke that opens the hazard-countermeasure modal
