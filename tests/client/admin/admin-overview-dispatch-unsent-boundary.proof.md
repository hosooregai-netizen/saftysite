# Admin Overview Dispatch Unsent Boundary Proof

## Scope

- Overview fallback keeps backend D+15 unsent technical-guidance rows visible.
- Overview fallback and policy tests continue to drop D+16 and processed dispatch rows.
- Admin schedule mutations invalidate overview/report route caches.

## Verification

- `npx tsx --test app/api/admin/dashboard/overview/route.test.ts features/admin/lib/control-center-model/overviewPolicies.test.ts server/admin/adminRouteInvalidation.test.ts`
- `npx eslint app/api/admin/dashboard/overview/routeFallbacks.ts server/admin/upstreamMappers.ts features/admin/lib/control-center-model/overviewPolicies.ts server/admin/adminRouteInvalidation.ts`

## Expected outcome

- The dispatch-management count, deadline summary total, and table rows stay aligned at the D+15/D+16 boundary.
- Schedule updates cannot leave the admin overview using a stale frontend route cache.
