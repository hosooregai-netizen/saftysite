# 08. Reverse Prompt — 대시보드/통계

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
대시보드/통계

기능 설명:
대시보드/통계는 프로젝트, 계약, 점검회차, 체크리스트, 지적사항, 조치현황, 사진대지, 산업안전보건관리비, 문서 자동화, 웹하드, 메일함, 결재/제출 데이터를 집계하여 오늘 업무, 지연 위험, 발주처별 제출 현황, 프로젝트별 리스크, 월별 통계를 보여주는 기능이다.

업무 맥락:
- 대시보드는 원본 업무 데이터를 수정하지 않는다.
- 모든 지표는 접근 권한이 있는 Project 기준으로 제한된다.
- 발주처별 지표는 ownerPartyId 기준으로 계산한다.
- 회차별 지표는 inspectionRoundId 기준으로 계산한다.
- 보고서 제출 상태는 InspectionOwnerReportTask, DocumentInstance, Submission을 함께 본다.
- 미조치 지적사항은 Finding과 CorrectiveAction 상태를 기준으로 계산한다.
- AI 인사이트는 입력된 metric과 alert만 요약하고 수치를 만들지 않는다.

입력:
{
  "featureName": "대시보드/통계",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "permissionRequirements": [],
  "statisticsRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `dashboard.statistics`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 계약/견적
    - 점검회차/일정
    - 공사안전보건대장 이행확인 보고서 자동화
    - 현장점검 체크리스트
    - 지적사항/조치현황/사진대지
    - 산업안전보건관리비
    - 안전관리계획서
    - 안전보건대장
    - 웹하드
    - 메일함
    - 결재/서명/제출
    - 관리자/템플릿/프롬프트

출력 JSON:
{
  "featureId": "dashboard.statistics",
  "featureName": "대시보드/통계",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
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

반드시 포함할 models:
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
- Project
- InspectionRound
- InspectionOwnerReportTask
- Finding
- CorrectiveAction
- SafetyCostUsage
- DocumentInstance
- ApprovalWorkflow
- Submission
- FileAsset
- MailThread

반드시 포함할 prompts:
- dashboard-insight-summary
- dashboard-statistics implementation prompt
- dashboard-statistics design prompt

반드시 포함할 tests:
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

주의:
- 대시보드는 원본 업무 상태를 직접 변경하지 않는다.
- 권한 없는 프로젝트 데이터가 노출되면 안 된다.
- 발주처별 데이터는 ownerPartyId 없이 집계하지 않는다.
- 완료/closed/verified 지적사항을 미조치로 계산하지 않는다.
- 제출완료와 최종본 생성완료를 혼동하지 않는다.
- AI가 통계 수치를 만들거나 추정하면 안 된다.
- 통계 기준일과 기간을 반드시 표시해야 한다.
```
