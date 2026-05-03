# Site Period Status Dashboard Summary Proof

- Static proof: `npx eslint features/admin/lib/control-center-model/overviewSummary.ts features/admin/lib/control-center-model/overviewModel.ts server/admin/overviewPolicyOverlay.ts server/admin/overviewPolicyOverlay.test.ts app/api/admin/dashboard/overview/route.ts app/api/admin/dashboard/overview/route.test.ts lib/admin/lifecycleStatus.ts lib/admin/lifecycleStatus.test.ts features/admin/lib/control-center-model/overviewPolicies.ts features/admin/lib/control-center-model/overviewPolicies.test.ts scripts/completeExpiredPlannedSites.ts`
- Unit proof: `npx tsx server/admin/overviewPolicyOverlay.test.ts`
- Route proof: `npx tsx app/api/admin/dashboard/overview/route.test.ts`
- Lifecycle proof: `npx tsx lib/admin/lifecycleStatus.test.ts`
- Overview policy proof: `npx tsx features/admin/lib/control-center-model/overviewPolicies.test.ts`
- Live data dry-run proof: `npm run sites:complete-expired -- --today 2026-05-04 --limit 200` returned `fetched=142`, `candidates=0`, `activate=0`, and `close=0`.
- Live all-sites count proof: active and inactive site status check returned `total=3275 planned=0`.

The admin overview status contract now presents managed sites as `진행중`, `중지`, and `종료예정`; imported legacy `planned` values are normalized by period before they can dominate the dashboard summary.
