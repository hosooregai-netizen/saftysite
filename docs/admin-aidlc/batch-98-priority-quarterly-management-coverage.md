# Admin AIDLC Batch 98: Priority Quarterly Management Coverage

## Scope

- `app/api/admin/dashboard/overview/routeFallbacks.ts`
- `features/admin/lib/control-center-model/overviewModel.ts`
- `features/admin/lib/control-center-model/overviewPolicies.ts`
- `features/admin/sections/overview/useAdminOverviewSectionState.ts`
- `server/admin/upstreamMappers.ts`
- `tests/client/admin/admin-priority-quarterly-management-coverage.proof.md`

## Change

- Kept current-quarter 2B+ sites in the priority quarterly management list even when only elapsed technical-guidance rounds look complete.
- Matched backend and frontend fallback scope around explicit `closed`/`deleted` status, current-quarter project or contract overlap, and numeric or comma-formatted project amounts.
- Merged upstream and fallback priority quarterly rows by `siteId + currentQuarterKey`, preferring upstream rows and preventing duplicates.

## Validation

- `python -m pytest tests/test_admin_analytics.py -k "priority_quarterly or legacy_elapsed_rounds or current_quarter"` in `../back`
- `python -m pytest tests/test_admin_analytics.py` in `../back`
- `npx tsx --test features/admin/sections/overview/useAdminOverviewSectionState.test.ts features/admin/lib/control-center-model/overviewModel.test.ts features/admin/lib/control-center-model/overviewPolicies.test.ts`
- `npx eslint features/admin/sections/overview/useAdminOverviewSectionState.ts features/admin/lib/control-center-model/overviewModel.ts features/admin/lib/control-center-model/overviewPolicies.ts app/api/admin/dashboard/overview/route.ts`

## Notes

- Local live endpoint probes for `localhost:8000/admin/dashboard/overview?include_full_rows=true` and `localhost:3000/api/admin/dashboard/overview` were blocked because neither local server was listening.
