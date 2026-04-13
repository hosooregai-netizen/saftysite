# Admin AIDLC Batch 2: Control Center / Overview / Analytics

## Goal

Lock the admin control-center axis around one batch so overview and analytics can keep evolving
without falling back into a single monolith.

This batch keeps the existing `admin-control-center` umbrella contract and strengthens the
contract pack around:

- `buildAdminControlCenterModel`
- `AdminOverviewSection`
- `AnalyticsSection`

## Scope

### Split boundaries

- `features/admin/lib/control-center-model/**`
- `features/admin/sections/overview/**`
- `features/admin/sections/analytics/**`
- `tests/client/admin/admin-control-center.spec.ts`
- `tests/client/fixtures/adminSmokeHarness.ts`
- `scripts/smoke-real-client/admin-sections/control-center.ts`
- `docs/admin-aidlc/batch-02-control-center-overview-analytics.md`

### Protected user flows

- `/admin?section=overview` still shows KPI cards, site status, dispatch management, and export entry.
- `/admin?section=analytics` still shows summary KPIs, trend chart, contribution tables, period filter, and export entry.
- `admin-control-center` remains one umbrella contract because the shared control-center model feeds both surfaces.

## Contract Pack

### Feature contract

- `admin-control-center`

### Mocked smoke

- `tests/client/admin/admin-control-center.spec.ts`

### Real smoke

- `npm run smoke:real:admin -- --sections control-center`

## Implementation Record

### Expected outputs

- `buildAdminControlCenterModel.ts` stays as a thin facade while the internal control-center model
  is split into overview, analytics, export, date, enrichment, and aggregation modules.
- `AdminOverviewSection.tsx` becomes a shell with state, KPI/visual, dispatch queue, and material gap
  sections split out.
- `AnalyticsSection.tsx` becomes a shell with state, header, summary, chart, and detail sections split out.
- `admin-control-center` contract explicitly protects overview/analytics tab flow, period switching,
  and export entry.

### Actual results

- `features/admin/lib/buildAdminControlCenterModel.ts` remains a thin public facade and now points to
  a clearer internal module boundary under `features/admin/lib/control-center-model/`.
- Control-center internals were decomposed into focused modules including:
  - `dates.ts`
  - `rowEnrichment.ts`
  - `quarterlyMaterials.ts`
  - `overviewSummary.ts`
  - `overviewModel.ts`
  - `overviewExport.ts`
  - `analyticsSupport.ts`
  - `analyticsContractRows.ts`
  - `analyticsSummary.ts`
  - `analyticsModel.ts`
  - `analyticsExport.ts`
- `AdminOverviewSection.tsx` was reduced to a shell and split into:
  - `useAdminOverviewSectionState.ts`
  - `OverviewVisualCards.tsx`
  - `OverviewDispatchQueueTable.tsx`
  - `OverviewUnsentReportsSection.tsx`
  - `OverviewMaterialGapSection.tsx`
  - `overviewSectionHelpers.ts`
- `AnalyticsSection.tsx` was reduced to a shell and split into:
  - `useAnalyticsSectionState.ts`
  - `AnalyticsSectionHeader.tsx`
  - `AnalyticsSummarySection.tsx`
  - `AnalyticsCharts.tsx`
  - `AnalyticsTrendCard.tsx`
  - `AnalyticsContributionCards.tsx`
  - `AnalyticsDetailSection.tsx`
  - `AnalyticsEmployeeTable.tsx`
  - `AnalyticsSiteRevenueTable.tsx`
  - `analyticsSectionHelpers.ts`
- `admin-control-center` contract was strengthened to require:
  - overview markers
  - analytics markers
  - period switching
  - export entry
- `ARCHITECTURE.md`, `skills/aidlc-contract-pack/SKILL.md`, and
  `skills/admin-contract-pack/SKILL.md` were updated so control-center work explicitly updates
  the batch record, contract, and smoke layers together.

## Validation Commands

```bash
npx eslint features/admin/lib/buildAdminControlCenterModel.ts \
  features/admin/lib/control-center-model/*.ts \
  features/admin/sections/overview/*.ts \
  features/admin/sections/overview/*.tsx \
  features/admin/sections/analytics/*.ts \
  features/admin/sections/analytics/*.tsx \
  tests/client/admin/admin-control-center.spec.ts \
  tests/client/fixtures/adminSmokeHarness.ts \
  tests/client/featureContracts.ts \
  scripts/smoke-real-client/admin-sections/control-center.ts

npx tsc --noEmit --pretty false
npm run aidlc:audit:admin
npm run test:client:smoke -- admin-control-center
npm run smoke:real:admin -- --sections control-center
git diff --check
```

## Validation Run

- `npx eslint features/admin/lib/buildAdminControlCenterModel.ts features/admin/lib/control-center-model/*.ts features/admin/sections/overview/*.ts features/admin/sections/overview/*.tsx features/admin/sections/analytics/*.ts features/admin/sections/analytics/*.tsx tests/client/admin/admin-control-center.spec.ts tests/client/fixtures/adminSmokeHarness.ts tests/client/featureContracts.ts scripts/smoke-real-client/admin-sections/control-center.ts`
  - passed
- `npx tsc --noEmit --pretty false`
  - passed
- `npm run aidlc:audit:admin`
  - passed as advisory audit
  - this batch removed `AdminOverviewSection.tsx`, `AnalyticsSection.tsx`, and the old
    control-center shared monolith from the `HARD` list
- `npm run test:client:smoke -- admin-control-center`
  - passed against local app at `http://127.0.0.1:3211`
- `npm run smoke:real:admin -- --sections control-center`
  - blocked in this environment
  - exact blocker: `Missing smoke seed. Provide SMOKE_SEED_PATH (/tmp/safety-e2e-seed.json) or LIVE_SAFETY_EMAIL/LIVE_SAFETY_PASSWORD.`
- `git diff --check`
  - passed

## Residual Debt

- Current follow-up candidates inside admin:
  - `features/admin/components/SortableHeaderCell.tsx`
  - `features/admin/sections/content/ContentItemsSection.tsx`
  - `features/admin/sections/reports/useReportsSectionState.ts`
  - `features/admin/sections/sites/useSitesSectionState.ts`
  - `features/admin/sections/schedules/SchedulesSection.tsx`
- Secondary control-center cleanup candidates:
  - `features/admin/lib/control-center-model/analyticsSupport.ts`
  - `features/admin/lib/control-center-model/rowEnrichment.ts`
  - `features/admin/sections/overview/useAdminOverviewSectionState.ts`
