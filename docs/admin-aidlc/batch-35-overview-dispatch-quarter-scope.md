# Batch 35: Overview Dispatch Quarter Scope

## Why
- the overview dispatch queue was still inheriting the 20억 priority rule and dispatch-policy default, so technical guidance rows disappeared even when they belonged to the active quarter
- the unsent card, the unsent table, and the fallback preserve path were not all enforcing the same scope or ordering

## What changed
- added a shared current-quarter overlap helper for overview scope using project dates first and contract dates as fallback
- kept the 30-day unsent cap, but changed the default unsent ordering to `mailReady` first and then `unsentDays` descending
- applied the same quarter-key guard to priority quarterly fallback rows and upstream-preserved unsent rows
- added focused tests for quarter scope and dispatch-priority sorting

## Proof
- `npx tsx --test app/api/admin/dashboard/overview/route.test.ts features/admin/lib/control-center-model/overviewPolicies.test.ts`
- `npx eslint app/api/admin/dashboard/overview/routeFallbacks.ts app/api/admin/dashboard/overview/route.test.ts features/admin/lib/control-center-model/overviewPolicies.ts features/admin/lib/control-center-model/overviewModel.ts features/admin/lib/control-center-model/overviewPolicies.test.ts features/admin/sections/overview/useAdminOverviewSectionState.ts server/admin/upstreamMappers.ts`
- `npx tsc --noEmit`
