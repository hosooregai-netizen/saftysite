# Batch 15: Overview Dashboard Policy Split

## Summary

- Kept report archive behavior (`전체 보고서`) independent from dashboard management behavior (`관리 대시보드`).
- Split overview policy evaluation so dashboard sections use scoped management windows instead of broad historical rows.
- Applied a server-side overview policy overlay path so stale upstream overview payloads do not repopulate old dispatch-delay rows.
- Aligned unsent summary and dispatch-management list derivation to the same scoped dispatch rows.
- Narrowed priority-quarterly exposure toward current-year/current-management context while allowing an empty state path.

## Changed Files

- `app/api/admin/dashboard/overview/route.ts`
- `features/admin/lib/control-center-model/overviewModel.ts`
- `features/admin/lib/control-center-model/overviewPolicies.ts`
- `features/admin/lib/control-center-model/overviewSummary.ts`
- `features/admin/sections/overview/useAdminOverviewSectionState.ts`
- `server/admin/overviewPolicyOverlay.ts`
- `scripts/smoke-real-client/admin-sections/control-center.ts`

## Validation

- `npx tsc --noEmit`
- `npm run aidlc:audit:admin`
