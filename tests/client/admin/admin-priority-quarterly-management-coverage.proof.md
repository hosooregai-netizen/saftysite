# Admin Priority Quarterly Management Coverage Proof

## Scope

- Priority quarterly management rows include 2B+ current-quarter sites with missing quarterly reports.
- Elapsed or completed technical-guidance rounds do not remove a site from the current-quarter priority quarterly list.
- Frontend overview state merges backend and fallback priority rows by `siteId + currentQuarterKey` without duplicate rows.
- Comma-formatted project amounts remain eligible for the 2B+ threshold.

## Verification

- Backend targeted proof: `python -m pytest tests/test_admin_analytics.py -k "priority_quarterly or legacy_elapsed_rounds or current_quarter"` passed in `../back`.
- Backend regression proof: `python -m pytest tests/test_admin_analytics.py` passed in `../back` with `62 passed`.
- Frontend unit proof: `npx tsx --test features/admin/sections/overview/useAdminOverviewSectionState.test.ts features/admin/lib/control-center-model/overviewModel.test.ts features/admin/lib/control-center-model/overviewPolicies.test.ts` passed with `18 passed`.
- Static proof: `npx eslint features/admin/sections/overview/useAdminOverviewSectionState.ts features/admin/lib/control-center-model/overviewModel.ts features/admin/lib/control-center-model/overviewPolicies.ts app/api/admin/dashboard/overview/route.ts` passed.

## Expected outcome

- The admin overview "20억 이상 분기보고서 관리" table stays aligned with the active-site current-quarter 2B+ scope.
- A site with no current-quarter quarterly report appears as `missing` / `report_missing` instead of disappearing.
- Backend rows remain authoritative when present, while fallback-only current-quarter rows fill partial upstream payload gaps.
