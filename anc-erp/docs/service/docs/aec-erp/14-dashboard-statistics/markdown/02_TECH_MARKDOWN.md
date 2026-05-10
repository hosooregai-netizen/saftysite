# 02. Tech Markdown — 대시보드/통계

## 1. Frontend Routes

```text
/dashboard
/dashboard/my-work
/dashboard/projects
/dashboard/inspections
/dashboard/reports
/dashboard/findings
/dashboard/safety-costs
/dashboard/approvals
/dashboard/files-mails
/dashboard/statistics
/dashboard/alerts
/dashboard/settings
/projects/[projectId]/dashboard
```

## 2. Frontend Components

```text
DashboardHomePage
MyWorkDashboardPage
ProjectDashboardPage
StatisticsPage
AlertCenterPage

DashboardShell
DashboardWidgetGrid
DashboardWidgetCard
TodayInspectionCard
UpcomingInspectionList
ReportDueCard
OwnerReportStatusMatrix
OpenFindingCard
FindingAgingChart
CorrectiveActionQueue
SafetyCostUsageCard
ApprovalQueueCard
SubmissionStatusCard
MailFileActivityCard
ProjectHealthTable
ProjectRiskHeatmap
MonthlyInspectionChart
MonthlySubmissionChart
RiskTypeDistributionChart
SafetyCostUsageChart
DashboardInsightPanel
AlertRuleTable
WidgetSettingsPanel
```

## 3. Backend APIs

### Overview

```text
GET /api/v1/dashboard/overview
GET /api/v1/dashboard/my-work
GET /api/v1/projects/{projectId}/dashboard
```

### Widgets

```text
GET   /api/v1/dashboard/widgets
POST  /api/v1/dashboard/widgets
PATCH /api/v1/dashboard/widgets/{widgetId}
DELETE /api/v1/dashboard/widgets/{widgetId}
POST  /api/v1/dashboard/widgets/reorder
```

### Metrics

```text
GET /api/v1/dashboard/metrics/project-health
GET /api/v1/dashboard/metrics/inspection-status
GET /api/v1/dashboard/metrics/report-status
GET /api/v1/dashboard/metrics/finding-aging
GET /api/v1/dashboard/metrics/safety-cost-usage
GET /api/v1/dashboard/metrics/approval-queue
GET /api/v1/dashboard/metrics/mail-file-activity
GET /api/v1/dashboard/metrics/submission-status
```

### Statistics

```text
GET /api/v1/dashboard/statistics/monthly-inspections
GET /api/v1/dashboard/statistics/monthly-submissions
GET /api/v1/dashboard/statistics/risk-types
GET /api/v1/dashboard/statistics/finding-resolution-time
GET /api/v1/dashboard/statistics/owner-submission-lag
GET /api/v1/dashboard/statistics/safety-cost-distribution
GET /api/v1/dashboard/statistics/export-summary
```

### Alerts

```text
GET   /api/v1/dashboard/alerts
POST  /api/v1/dashboard/alerts/refresh
PATCH /api/v1/dashboard/alerts/{alertId}/acknowledge
PATCH /api/v1/dashboard/alerts/{alertId}/dismiss
GET   /api/v1/dashboard/alert-rules
POST  /api/v1/dashboard/alert-rules
PATCH /api/v1/dashboard/alert-rules/{alertRuleId}
```

### AI Insight

```text
POST /api/v1/dashboard/insights/summary
POST /api/v1/dashboard/insights/project-risk
POST /api/v1/dashboard/insights/weekly-briefing
```

## 4. Data Models

### DashboardWidget

```ts
type DashboardWidgetType =
  | 'today_inspections'
  | 'upcoming_inspections'
  | 'report_due'
  | 'open_findings'
  | 'finding_aging'
  | 'safety_cost_usage'
  | 'approval_queue'
  | 'submission_status'
  | 'mail_file_activity'
  | 'project_health'
  | 'risk_heatmap'
  | 'custom_statistic'

type DashboardWidget = {
  id: string
  userId?: string
  organizationId?: string
  type: DashboardWidgetType
  title: string
  size: 'small' | 'medium' | 'large' | 'wide'
  position: { x: number; y: number; w: number; h: number }
  filters: DashboardFilter
  visible: boolean
  createdAt: string
  updatedAt: string
}
```

### DashboardSnapshot

```ts
type DashboardSnapshot = {
  id: string
  scope: 'global' | 'user' | 'project'
  projectId?: string
  userId?: string
  basisDate: string
  metrics: DashboardMetric[]
  alerts: DashboardAlert[]
  generatedAt: string
}
```

### DashboardMetric

```ts
type DashboardMetric = {
  key: string
  label: string
  value: number | string
  unit?: string
  trend?: 'up' | 'down' | 'flat'
  severity?: 'normal' | 'info' | 'warning' | 'danger'
  sourceModel: string
  calculationNote: string
}
```

### ProjectHealthMetric

```ts
type ProjectHealthMetric = {
  projectId: string
  projectName: string
  status: 'normal' | 'watch' | 'warning' | 'danger'
  progressRate?: number
  nextInspectionDate?: string
  openFindingCount: number
  overdueFindingCount: number
  pendingReportCount: number
  overdueReportCount: number
  pendingApprovalCount: number
  safetyCostWarningCount: number
  unclassifiedMailCount: number
  riskScore: number
  updatedAt: string
}
```

### OwnerReportStatusSummary

```ts
type OwnerReportStatusSummary = {
  projectId: string
  inspectionRoundId: string
  roundNo: number
  ownerPartyId: string
  ownerName: string
  documentId?: string
  documentStatus?: string
  exportedFileId?: string
  submissionId?: string
  submittedAt?: string
  status: 'not_started' | 'drafting' | 'review' | 'exported' | 'submitted' | 'confirmed' | 'overdue'
}
```

### FindingAgingBucket

```ts
type FindingAgingBucket = {
  projectId?: string
  ownerPartyId?: string
  riskType?: string
  bucket: '0_7' | '8_14' | '15_30' | '31_plus'
  count: number
  findingIds: string[]
}
```

### StatisticsMetric

```ts
type StatisticsMetric = {
  id: string
  metricKey: string
  label: string
  scope: 'global' | 'project' | 'owner' | 'user'
  projectId?: string
  ownerPartyId?: string
  userId?: string
  periodType: 'day' | 'week' | 'month' | 'quarter' | 'year'
  periodStart: string
  periodEnd: string
  value: number
  unit?: string
  sourceModels: string[]
  calculatedAt: string
}
```

### DashboardAlert

```ts
type DashboardAlertStatus = 'active' | 'acknowledged' | 'dismissed' | 'resolved'

type DashboardAlert = {
  id: string
  alertRuleId: string
  projectId?: string
  inspectionRoundId?: string
  ownerPartyId?: string
  linkedEntityType: string
  linkedEntityId: string
  severity: 'info' | 'warning' | 'danger'
  title: string
  message: string
  status: DashboardAlertStatus
  dueDate?: string
  createdAt: string
  acknowledgedAt?: string
  resolvedAt?: string
}
```

### AlertRule

```ts
type AlertRule = {
  id: string
  key: string
  title: string
  description: string
  enabled: boolean
  severity: 'info' | 'warning' | 'danger'
  conditionType:
    | 'inspection_due'
    | 'checklist_incomplete'
    | 'report_due'
    | 'report_overdue'
    | 'finding_overdue'
    | 'action_verification_needed'
    | 'photo_ledger_missing'
    | 'safety_cost_warning'
    | 'approval_overdue'
    | 'signature_missing'
    | 'mail_unclassified'
  thresholdDays?: number
  createdAt: string
  updatedAt: string
}
```

## 5. Aggregation Rules

### Project Health Risk Score

```text
riskScore =
  overdueReportCount * 25
+ overdueFindingCount * 15
+ pendingApprovalCount * 8
+ safetyCostWarningCount * 8
+ unclassifiedMailCount * 2
+ photoLedgerMissingCount * 10
```

상태 기준:

```text
0~19: normal
20~39: watch
40~69: warning
70+: danger
```

### Finding Aging

계산 기준:

```text
baseDate = Finding.createdAt 또는 action_requestedAt
daysOpen = today - baseDate
closed/verified는 aging 대상에서 제외
```

### Report Due

대상:

```text
InspectionOwnerReportTask.status not in submitted, confirmed
reportDueDate <= today + filterDays
```

### Safety Cost Warning

경고 조건:

```text
calculatedAmount 없음
usedAmount 없음
usedRateInput와 usedRateCalculated 불일치
증빙파일 없음
confirmed 상태 아님
```

## 6. Service Rules

### Dashboard Overview 생성

```text
1. 사용자 권한 확인
2. 접근 가능한 projectId 목록 조회
3. 점검 일정 조회
4. 보고서/제출 상태 조회
5. 지적사항/조치현황 조회
6. 산업안전보건관리비 조회
7. 결재/서명/제출 상태 조회
8. 메일/파일 활동 조회
9. AlertRule 실행
10. DashboardSnapshot 생성 또는 반환
```

### AI Insight 생성

AI는 다음만 수행한다.

- 수치 기반 요약
- 긴급도 정렬
- 누락/지연 업무 설명
- 다음 액션 제안

AI는 다음을 하지 않는다.

- 통계 수치 임의 변경
- 업무 상태 변경
- 조치 완료 판정
- 법령 해석
- 금액/날짜 추정

## 7. Tests

```text
test_dashboard_overview_loads
test_dashboard_respects_project_permission
test_project_health_risk_score_calculated
test_report_due_card_filters_owner_reports
test_finding_aging_excludes_closed_findings
test_safety_cost_warning_detected
test_approval_queue_counts_pending_steps
test_mail_file_activity_counts_recent_items
test_dashboard_alert_refresh_creates_report_overdue_alert
test_dashboard_alert_acknowledge
test_statistics_monthly_inspections
test_statistics_risk_type_distribution
test_dashboard_insight_does_not_invent_metrics
test_project_dashboard_owner_report_matrix
```
