# Admin Material Summary Fallback Alignment Proof

- Reproduced the stale-upstream case where the backend summary reports 28 total sites while the fallback current-quarter material gap rows contain 1 site.
- Verified that fallback row restoration now also replaces the material summary total and entries, so the donut and table stay aligned.

Proof:
- `npx.cmd tsx --test features/admin/sections/overview/useAdminOverviewSectionState.test.ts`
- `npx.cmd tsx --test features/admin/lib/control-center-model/overviewModel.test.ts`
