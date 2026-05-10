# 07. Reverse Map — 대시보드/통계

## 1. Feature

```yaml
featureId: dashboard.statistics
featureName: 대시보드/통계
priority: P1
module: dashboard-statistics
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 전체 대시보드 | `/dashboard` | 전체 업무/위험/알림 요약 |
| 내 업무 | `/dashboard/my-work` | 사용자별 할 일 |
| 프로젝트 현황 | `/dashboard/projects` | 프로젝트별 위험도 table |
| 점검 현황 | `/dashboard/inspections` | 점검 일정/완료율 |
| 보고서 현황 | `/dashboard/reports` | 발주처별 보고서 상태 |
| 지적사항 현황 | `/dashboard/findings` | 미조치/지연/위험유형 |
| 안전관리비 현황 | `/dashboard/safety-costs` | 사용률/경고/증빙 |
| 결재 현황 | `/dashboard/approvals` | 승인/서명/제출 대기 |
| 파일/메일 활동 | `/dashboard/files-mails` | 최근 웹하드/메일 활동 |
| 통계 | `/dashboard/statistics` | 월별/유형별 통계 |
| 알림 센터 | `/dashboard/alerts` | 알림 확인/처리 |
| 대시보드 설정 | `/dashboard/settings` | widget/alert rule 설정 |
| 프로젝트 대시보드 | `/projects/[projectId]/dashboard` | 단일 프로젝트 종합 현황 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/dashboard` | DashboardWidgetGrid, TodayInspectionCard, ReportDueCard, OpenFindingCard, DashboardInsightPanel |
| `/dashboard/my-work` | MyTaskQueue, UpcomingInspectionList, ApprovalQueueCard |
| `/dashboard/projects` | ProjectHealthTable, ProjectRiskHeatmap |
| `/dashboard/reports` | OwnerReportStatusMatrix, SubmissionStatusCard |
| `/dashboard/findings` | OpenFindingCard, FindingAgingChart, CorrectiveActionQueue |
| `/dashboard/safety-costs` | SafetyCostUsageCard, SafetyCostUsageChart |
| `/dashboard/approvals` | ApprovalQueueCard, SignatureMissingList |
| `/dashboard/files-mails` | MailFileActivityCard, UnclassifiedMailList |
| `/dashboard/statistics` | MonthlyInspectionChart, MonthlySubmissionChart, RiskTypeDistributionChart |
| `/dashboard/alerts` | AlertList, AlertRuleTable |
| `/projects/[projectId]/dashboard` | ProjectDashboardHeader, OwnerReportStatusMatrix, ProjectFindingTable |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| DashboardWidgetGrid | GET `/api/v1/dashboard/widgets` |
| TodayInspectionCard | GET `/api/v1/dashboard/metrics/inspection-status` |
| ReportDueCard | GET `/api/v1/dashboard/metrics/report-status` |
| OpenFindingCard | GET `/api/v1/dashboard/metrics/finding-aging` |
| SafetyCostUsageCard | GET `/api/v1/dashboard/metrics/safety-cost-usage` |
| ApprovalQueueCard | GET `/api/v1/dashboard/metrics/approval-queue` |
| MailFileActivityCard | GET `/api/v1/dashboard/metrics/mail-file-activity` |
| ProjectHealthTable | GET `/api/v1/dashboard/metrics/project-health` |
| MonthlyInspectionChart | GET `/api/v1/dashboard/statistics/monthly-inspections` |
| RiskTypeDistributionChart | GET `/api/v1/dashboard/statistics/risk-types` |
| DashboardInsightPanel | POST `/api/v1/dashboard/insights/summary` |
| AlertList | GET `/api/v1/dashboard/alerts` |
| AlertRuleTable | GET `/api/v1/dashboard/alert-rules` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET `/dashboard/overview` | DashboardSnapshot, DashboardMetric, DashboardAlert |
| GET `/dashboard/my-work` | InspectionTask, ApprovalStep, Finding, MailThread |
| GET `/projects/{projectId}/dashboard` | ProjectHealthMetric, OwnerReportStatusSummary |
| GET `/metrics/project-health` | ProjectHealthMetric |
| GET `/metrics/report-status` | OwnerReportStatusSummary, DocumentInstance, Submission |
| GET `/metrics/finding-aging` | FindingAgingBucket, Finding, CorrectiveAction |
| GET `/metrics/safety-cost-usage` | SafetyCostUsage, StatisticsMetric |
| GET `/metrics/mail-file-activity` | MailThread, MailMessage, FileAsset |
| GET `/statistics/*` | StatisticsMetric |
| GET/POST `/alert-rules` | AlertRule |
| GET/PATCH `/alerts` | DashboardAlert |
| POST `/insights/summary` | DashboardInsightRun, PromptTemplate |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| DashboardSnapshot | dashboard-insight-summary |
| DashboardMetric | dashboard-insight-summary |
| ProjectHealthMetric | dashboard-insight-summary |
| OwnerReportStatusSummary | dashboard-insight-summary |
| FindingAgingBucket | dashboard-insight-summary |
| StatisticsMetric | dashboard-insight-summary |
| DashboardAlert | dashboard-insight-summary |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 전체 대시보드 조회 | test_dashboard_overview_loads |
| 권한 필터 | test_dashboard_respects_project_permission |
| 프로젝트 위험도 | test_project_health_risk_score_calculated |
| 보고서 제출 예정 | test_report_due_card_filters_owner_reports |
| 지적사항 aging | test_finding_aging_excludes_closed_findings |
| 안전관리비 경고 | test_safety_cost_warning_detected |
| 결재 대기 | test_approval_queue_counts_pending_steps |
| 파일/메일 활동 | test_mail_file_activity_counts_recent_items |
| 알림 생성 | test_dashboard_alert_refresh_creates_report_overdue_alert |
| 알림 확인 | test_dashboard_alert_acknowledge |
| 월별 점검 통계 | test_statistics_monthly_inspections |
| 위험유형 통계 | test_statistics_risk_type_distribution |
| AI 인사이트 | test_dashboard_insight_does_not_invent_metrics |
| 프로젝트 matrix | test_project_dashboard_owner_report_matrix |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ProjectHealthMetric |
| 계약/견적 | 계약기간, 지급 milestone, 계약 상태 |
| 점검회차/일정 | InspectionRound, InspectionTask |
| 보고서 자동화 | DocumentInstance, OwnerReportTask |
| 현장점검 체크리스트 | ChecklistSession completion |
| 지적사항/사진대지 | Finding, CorrectiveAction, PhotoLedger |
| 산업안전보건관리비 | SafetyCostUsage warning |
| 안전관리계획서 | plan status, export status |
| 안전보건대장 | ledger status, revision status |
| 웹하드 | FileAsset recent activity |
| 메일함 | MailThread, unclassified mail |
| 결재/제출 | ApprovalWorkflow, SignatureTask, Submission |
| 관리자 | AlertRule, DashboardWidget, PromptTemplate |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 집계 수치와 원본 상태 불일치 | sourceModels와 calculationNote 표시 |
| 권한 없는 프로젝트 노출 | 모든 metric query에서 project permission filter 적용 |
| 발주처별 제출 상태 혼동 | ownerPartyId 기준 matrix 사용 |
| 완료된 지적사항이 미조치 통계에 포함 | closed/verified 제외 규칙 적용 |
| AI가 수치 생성 | dashboard-insight-summary에서 입력 수치만 사용 |
| 대시보드에서 원본 업무 상태 변경 | 대시보드는 바로가기만 제공, 상태 변경은 원본 화면에서 수행 |
| 통계 기준일 불명확 | basisDate와 periodStart/periodEnd 필수 |
