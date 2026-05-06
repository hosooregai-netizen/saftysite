# Admin AIDLC Batch 97: Overview Dispatch Unsent Boundary

## Scope

- `app/api/admin/dashboard/overview/route.test.ts`
- `features/admin/lib/control-center-model/overviewPolicies.test.ts`
- `server/admin/adminRouteInvalidation.ts`
- `server/admin/adminRouteInvalidation.test.ts`
- `tests/client/admin/admin-overview-dispatch-unsent-boundary.proof.md`

## Change

- Preserved the D+15 dispatch-management row boundary in upstream overview fallback tests.
- Kept D+16 and processed dispatch rows filtered out by the overview policy tests.
- Ordered dispatch-management rows by overdue age first so the longest-unsent reports appear first.
- Added admin schedule writes to overview/report route cache invalidation so schedule-date changes cannot leave stale dispatch counts.

## Validation

- `npx tsx --test app/api/admin/dashboard/overview/route.test.ts features/admin/lib/control-center-model/overviewPolicies.test.ts server/admin/adminRouteInvalidation.test.ts`
- `npx eslint app/api/admin/dashboard/overview/routeFallbacks.ts server/admin/upstreamMappers.ts features/admin/lib/control-center-model/overviewPolicies.ts server/admin/adminRouteInvalidation.ts`
