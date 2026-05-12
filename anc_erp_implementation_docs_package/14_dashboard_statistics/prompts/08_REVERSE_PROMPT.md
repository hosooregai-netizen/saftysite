# 08 REVERSE PROMPT — 대시보드/통계

Implement `대시보드/통계`.

## Trace

- Route: `/dashboard`
- Component: `OverviewMetricCard`
- API: `GET /api/v1/dashboard/overview`
- Models: `DashboardMetricSnapshot, DashboardAlert, MetricDrilldownResult`
- Prompt: `dashboard-insight-summary`
- Tests: `dashboard_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
