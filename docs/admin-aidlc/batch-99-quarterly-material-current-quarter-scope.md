# Batch 99: Quarterly Material Current Quarter Scope

## Scope

- `features/admin/lib/control-center-model/overviewModel.ts`
- `features/admin/lib/control-center-model/overviewModel.test.ts`

## Change

- Scoped the admin overview education/measurement material donut fallback to 20억 이상 active sites that overlap the current quarter.
- Kept fallback coverage row counts aligned with the donut total.

## Validation

- `node --import tsx --test features/admin/lib/control-center-model/overviewModel.test.ts`
- `node --import tsx --test features/admin/lib/control-center-model/overviewPolicies.test.ts`
- `npm run lint`
- `npm run test`
