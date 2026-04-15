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
- `/admin?section=overview` now also keeps the `20억 이상 분기보고서 관리` list and the `종료 예정 현황` list visible as stable operator queues.
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
  - `OverviewEndingSoonSection.tsx`
  - `OverviewUnsentReportsSection.tsx`
  - `OverviewMaterialGapSection.tsx`
  - `overviewSectionHelpers.ts`
- Overview now exposes a dedicated `종료 예정 현황` queue based on active sites whose
  `contract_end_date` falls within today through 14 days out, with `project_end_date` used as
  the fallback when contract end is absent.
- Overview also restores the backend-backed dispatch management queues to the client response so
  `20억 이상 분기보고서 관리`, `현장대리인 메일 미등록 현장`, and `발송 필요 미해결 현장`
  render from the same overview payload again.
- The `20억 이상 분기보고서 관리` queue was then simplified into a read-only quarterly follow-up
  table: the current quarter now appears beside the title, the row columns focus on `현장`,
  `사업장`, `공사금액`, `최근 지도`, and a single textual `상태`, and the older duplicated
  `현재 분기`, `반영 상태`, `발송 상태`, `예외 상태` chip-heavy presentation was removed.
- The `발송 관리 대상` queue was also tightened into the same calmer overview-table rhythm:
  it now hides the lower-signal `사업장`, `유형`, `기본 수신자`, and `메일 상태` columns so the
  operator only scans `현장`, `보고서`, `담당자`, `지도 실시일`, `미발송 경과`, and `상태`.
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
- Analytics state now keeps the last resolved dataset visible while a new analytics request is in
  flight, so period/filter changes no longer collapse the section to `EMPTY_ANALYTICS`.
- Analytics first paint now reuses the already-loaded admin `reportList` to build an immediate local
  snapshot before the server response returns, improving perceived load time on `/admin?section=analytics`.
- Summary cards, charts, and detail tables now render fixed-height loading placeholders so the
  analytics surface no longer flashes or reflows while the first response is loading.
- Analytics summary KPIs now treat contract-total metrics and 운영 execution metrics as separate
  concepts: top cards show `실행 회차` and `남은 회차` instead of the older `계약 예정 매출` /
  `예정 회차`, while detailed tables still keep contract totals for planning/reference views.
- Analytics revenue aggregation now treats past `technical_guidance` visit dates as practically
  completed even when the ERP workflow is still draft, matching the K2B Excel-style operational
  reality where `기술지도일` is often available before a manual completion action is recorded.
- `AdminScreen.tsx` keeps the admin entry shell lean by showing the login title without the older
  helper description copy, and the `admin-control-center` smoke now explicitly waits for that
  login entry before authenticating.
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
  - current admin residual debt still includes existing oversized files such as
    `SortableHeaderCell.tsx`, `ContentItemsSection.tsx`, `useReportsSectionState.ts`,
    `SchedulesSection.tsx`, and `useSitesSectionState.ts`
- Follow-up control-center verification for the ending-soon and priority-site overview update:
  - `npx tsc --noEmit --pretty false`
    - passed
  - `npm run aidlc:audit:admin`
    - passed as advisory audit
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 npm run test:client:smoke -- admin-control-center`
  - passed against the current workspace app
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
