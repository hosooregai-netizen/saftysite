# Admin AIDLC Batch 84: Site Period Status Dashboard Summary

## Scope

- Reconcile imported ERP site lifecycle data from contract/project periods.
- Keep the admin overview status summary limited to active, paused, and ending-soon buckets.
- Remove planned sites from the managed-site overview display so legacy imports cannot dominate the dashboard.

## Changed Paths

- `scripts/completeExpiredPlannedSites.ts`
- `lib/admin/lifecycleStatus.ts`
- `app/api/admin/dashboard/overview/route.ts`
- `server/admin/overviewPolicyOverlay.ts`
- `features/admin/lib/control-center-model/overviewSummary.ts`
- `features/admin/lib/control-center-model/overviewModel.ts`
- `features/admin/lib/control-center-model/overviewPolicies.ts`
- `features/admin/lib/control-center-model/analyticsModel.ts`

## Contract

- Site period normalization prefers `contract_end_date` over `project_end_date`.
- Expired sites normalize to `closed`; in-period planned sites normalize to `active`.
- Paused, completed, and deleted states remain explicit and are not reopened by period logic.
- Admin overview managed-site summary exposes exactly:
  - `active` / `진행중`
  - `paused` / `중지`
  - `ending_soon` / `종료예정`
- Ending-soon sites are active sites whose resolved end date is within 14 days.

## Proof

- `npx eslint features/admin/lib/control-center-model/overviewSummary.ts features/admin/lib/control-center-model/overviewModel.ts server/admin/overviewPolicyOverlay.ts server/admin/overviewPolicyOverlay.test.ts app/api/admin/dashboard/overview/route.ts app/api/admin/dashboard/overview/route.test.ts lib/admin/lifecycleStatus.ts lib/admin/lifecycleStatus.test.ts features/admin/lib/control-center-model/overviewPolicies.ts features/admin/lib/control-center-model/overviewPolicies.test.ts scripts/completeExpiredPlannedSites.ts`
- `npx tsx server/admin/overviewPolicyOverlay.test.ts`
- `npx tsx app/api/admin/dashboard/overview/route.test.ts`
- `npx tsx lib/admin/lifecycleStatus.test.ts`
- `npx tsx features/admin/lib/control-center-model/overviewPolicies.test.ts`
- `npm run sites:complete-expired -- --today 2026-05-04 --limit 200`

Live dry-run after applying the data fix returned `fetched=142` and `candidates=0`; an additional all-sites API check returned `total=3275 planned=0`.
