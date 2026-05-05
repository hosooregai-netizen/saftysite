# Admin Quarterly Material Current Quarter Scope Proof

- The overview fallback model now counts education/measurement material status only for active 20억 이상 sites whose project or contract period overlaps the current quarter.
- Regression coverage lives in `features/admin/lib/control-center-model/overviewModel.test.ts` and verifies that an out-of-quarter 20억 이상 site and an in-quarter low-value site are excluded from the material donut total.

Proof:
- `node --import tsx --test features/admin/lib/control-center-model/overviewModel.test.ts`
- `node --import tsx --test features/admin/lib/control-center-model/overviewPolicies.test.ts`
- `npm run lint`
- `npm run test`
