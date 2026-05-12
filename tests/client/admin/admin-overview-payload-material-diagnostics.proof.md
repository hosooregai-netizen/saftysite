# Admin Overview Payload And Material Diagnostics Proof

## Scope

- Overview route, cache, mapper, export, model, state, and material shortage rendering changes.
- Backend overview response changes are covered by the backend test suite in the paired backend commit.

## Validation

- `python -m pytest` in `back` passed 361 tests.
- `npx tsc --noEmit` passed.
- `npx tsx app/api/admin/dashboard/overview/route.test.ts` passed 7 tests.
- `npx tsx features/admin/sections/overview/useAdminOverviewSectionState.test.ts` passed 4 tests.
- `npx tsx server/admin/overviewPolicyOverlay.test.ts` passed 3 tests.
- `npx tsx server/admin/overviewRouteCache.test.ts` passed 1 test.
- `npx tsx features/admin/lib/control-center-model/overviewModel.test.ts` passed 2 tests.
- `npx eslint` on the changed admin TypeScript and TSX files passed.
