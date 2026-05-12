# 08 REVERSE PROMPT — 공사안전보건대장 이행확인 보고서 묶음

Implement `공사안전보건대장 이행확인 보고서 묶음`.

## Trace

- Route: `/safety-health-ledger-reports/[bundleId]`
- Component: `ReportBundleHeader`
- API: `GET /api/v1/safety-health-ledger-report-bundles/{bundleId}`
- Models: `SafetyHealthLedgerReportBundle, DocumentBundle`
- Prompt: `safety-report-bundle-planner`
- Tests: `report_bundle_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
