# Admin Material Stale Summary Scope Proof

- Reproduced the dashboard state where upstream material rows are current-quarter scoped, but the donut summary still reports 28 total sites with 27 complete sites.
- Verified that the merge now treats matching row payloads with differing summary totals as stale summary scope and uses the fallback current-quarter summary.

Proof:
- `npx.cmd tsx --test features/admin/sections/overview/useAdminOverviewSectionState.test.ts`
- `npx.cmd tsx --test features/admin/lib/control-center-model/overviewModel.test.ts`
