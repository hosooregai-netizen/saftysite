# 04. Codex Implementation Prompt — 대시보드/통계

## Prompt

```text
You are implementing the Dashboard and Statistics module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module aggregates data from projects, contracts, inspections, checklist sessions, findings, corrective actions, photo ledgers, safety cost usage, documents, approvals, submissions, webhard, and mailbox modules.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Dashboard and Statistics module.

Existing concepts:
- Project
- ProjectParty
- Contract
- InspectionRound
- InspectionOwnerReportTask
- ChecklistSession
- Finding
- CorrectiveAction
- PhotoLedger
- SafetyCostUsage
- SafetyManagementPlan
- SafetyHealthLedger
- DocumentInstance
- ApprovalWorkflow
- SignatureTask
- Submission
- Folder
- FileAsset
- MailThread
- MailMessage
- PromptTemplate
- AdminAuditLog

Required backend models:
- DashboardWidget
- DashboardSnapshot
- DashboardMetric
- ProjectHealthMetric
- OwnerReportStatusSummary
- FindingAgingBucket
- StatisticsMetric
- DashboardAlert
- AlertRule
- DashboardInsightRun

Required backend APIs:

Overview:
- GET /api/v1/dashboard/overview
- GET /api/v1/dashboard/my-work
- GET /api/v1/projects/{projectId}/dashboard

Widgets:
- GET /api/v1/dashboard/widgets
- POST /api/v1/dashboard/widgets
- PATCH /api/v1/dashboard/widgets/{widgetId}
- DELETE /api/v1/dashboard/widgets/{widgetId}
- POST /api/v1/dashboard/widgets/reorder

Metrics:
- GET /api/v1/dashboard/metrics/project-health
- GET /api/v1/dashboard/metrics/inspection-status
- GET /api/v1/dashboard/metrics/report-status
- GET /api/v1/dashboard/metrics/finding-aging
- GET /api/v1/dashboard/metrics/safety-cost-usage
- GET /api/v1/dashboard/metrics/approval-queue
- GET /api/v1/dashboard/metrics/mail-file-activity
- GET /api/v1/dashboard/metrics/submission-status

Statistics:
- GET /api/v1/dashboard/statistics/monthly-inspections
- GET /api/v1/dashboard/statistics/monthly-submissions
- GET /api/v1/dashboard/statistics/risk-types
- GET /api/v1/dashboard/statistics/finding-resolution-time
- GET /api/v1/dashboard/statistics/owner-submission-lag
- GET /api/v1/dashboard/statistics/safety-cost-distribution
- GET /api/v1/dashboard/statistics/export-summary

Alerts:
- GET /api/v1/dashboard/alerts
- POST /api/v1/dashboard/alerts/refresh
- PATCH /api/v1/dashboard/alerts/{alertId}/acknowledge
- PATCH /api/v1/dashboard/alerts/{alertId}/dismiss
- GET /api/v1/dashboard/alert-rules
- POST /api/v1/dashboard/alert-rules
- PATCH /api/v1/dashboard/alert-rules/{alertRuleId}

AI Insight:
- POST /api/v1/dashboard/insights/summary
- POST /api/v1/dashboard/insights/project-risk
- POST /api/v1/dashboard/insights/weekly-briefing

Required frontend routes:
- /dashboard
- /dashboard/my-work
- /dashboard/projects
- /dashboard/inspections
- /dashboard/reports
- /dashboard/findings
- /dashboard/safety-costs
- /dashboard/approvals
- /dashboard/files-mails
- /dashboard/statistics
- /dashboard/alerts
- /dashboard/settings
- /projects/[projectId]/dashboard

Required frontend components:
- DashboardShell
- DashboardWidgetGrid
- DashboardWidgetCard
- TodayInspectionCard
- UpcomingInspectionList
- ReportDueCard
- OwnerReportStatusMatrix
- OpenFindingCard
- FindingAgingChart
- CorrectiveActionQueue
- SafetyCostUsageCard
- ApprovalQueueCard
- SubmissionStatusCard
- MailFileActivityCard
- ProjectHealthTable
- ProjectRiskHeatmap
- MonthlyInspectionChart
- MonthlySubmissionChart
- RiskTypeDistributionChart
- SafetyCostUsageChart
- DashboardInsightPanel
- AlertRuleTable
- WidgetSettingsPanel

Business requirements:
1. Dashboard must aggregate data without mutating source business entities.
2. Dashboard must respect project-level permissions.
3. Overview must show today inspections, upcoming inspections, reports due, open findings, overdue findings, pending approvals, safety cost warnings, and mail/file activity.
4. Project dashboard must show one project's status, owner report matrix, open findings, safety cost, submissions, and recent activities.
5. Alert refresh must create alerts from enabled AlertRules.
6. Finding aging must exclude closed or verified findings.
7. Report due card must filter InspectionOwnerReportTask by status and reportDueDate.
8. Safety cost warnings must detect missing evidence, unconfirmed status, and usedRate mismatch.
9. AI insight must use the service AI prompt `dashboard-insight-summary` and must not invent metrics.
10. Widget layout must be user-configurable.
11. Statistics endpoints must support projectId, ownerPartyId, date range, and status filters.
12. All alert acknowledge/dismiss actions must create AuditLog.

Validation:
1. User can only see accessible projects.
2. projectId filters must be applied to every metric query.
3. ownerPartyId filters must be applied to owner-specific metrics.
4. alert linkedEntityType and linkedEntityId must be valid.
5. DashboardSnapshot basisDate is required.

Tests:
- test_dashboard_overview_loads
- test_dashboard_respects_project_permission
- test_project_health_risk_score_calculated
- test_report_due_card_filters_owner_reports
- test_finding_aging_excludes_closed_findings
- test_safety_cost_warning_detected
- test_approval_queue_counts_pending_steps
- test_mail_file_activity_counts_recent_items
- test_dashboard_alert_refresh_creates_report_overdue_alert
- test_dashboard_alert_acknowledge
- test_statistics_monthly_inspections
- test_statistics_risk_type_distribution
- test_dashboard_insight_does_not_invent_metrics
- test_project_dashboard_owner_report_matrix

Deliverables:
- Backend models and repositories
- Backend aggregation services
- Backend API routes
- Alert rule evaluation service
- Dashboard insight service
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```
