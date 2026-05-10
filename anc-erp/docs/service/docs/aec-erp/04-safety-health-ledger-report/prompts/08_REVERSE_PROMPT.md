# 08. Reverse Prompt — 공사안전보건대장 이행확인 보고서 자동화

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
공사안전보건대장 이행확인 보고서 자동화

기능 설명:
공사안전보건대장 이행확인 보고서 자동화는 프로젝트, 점검회차, 발주처, 점검표, 지적사항, 조치현황, 사진대지, 산업안전보건관리비, 공사일정 첨부자료를 조합하여 발주처별 제출용 보고서를 생성하는 기능이다.

업무 맥락:
- 보고서는 Project에 속한다.
- 보고서는 InspectionRound에 속한다.
- 보고서는 ownerPartyId 기준으로 발주처별 분기된다.
- 같은 제1회 점검이라도 삼성문화재단 보고서와 삼성생명공익재단 보고서가 따로 생성될 수 있다.
- 보고서에는 표지, 공사개요, 점검표, 이행여부 확인서, 위험성 감소대책, 추가 유해·위험요인, 산업안전보건관리비, 사진대지, 공사일정 첨부가 포함된다.
- 점검표 결과, 지적사항, 조치현황, 사진은 원본 데이터와 연결되어야 한다.
- AI 초안은 최종본이 아니며, 사용자가 검토·확정해야 한다.
- export는 최신 저장 snapshot 기준으로 수행되어야 한다.
- export 파일은 웹하드 최종본 폴더에 저장되어야 한다.
- 제출 시 OwnerReportTask, Submission, MailThread와 연결되어야 한다.

입력:
{
  "featureName": "공사안전보건대장 이행확인 보고서 자동화",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "mailRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `document.safety_health_ledger_report`로 설정한다.
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
    - 현장점검 체크리스트
    - 지적사항/조치현황
    - 사진대지
    - 산업안전보건관리비
    - 웹하드
    - 메일함
    - 결재/제출
    - 관리자/템플릿

출력 JSON:
{
  "featureId": "document.safety_health_ledger_report",
  "featureName": "공사안전보건대장 이행확인 보고서 자동화",
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
- /projects/[projectId]/documents/safety-reports
- /projects/[projectId]/documents/safety-reports/new
- /documents/safety-reports/[documentId]
- /documents/safety-reports/[documentId]/edit
- /documents/safety-reports/[documentId]/preview
- /documents/safety-reports/[documentId]/sections
- /documents/safety-reports/[documentId]/variables
- /documents/safety-reports/[documentId]/export
- /documents/safety-reports/[documentId]/submission
- /inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document

반드시 포함할 models:
- DocumentInstance
- SafetyReportSnapshot
- SafetyReportMeta
- SafetyReportSection
- SafetyReportVersion
- MissingField
- ReviewWarning
- SourceLink
- SafetyReportExportJob
- Project
- ProjectParty
- InspectionRound
- InspectionOwnerReportTask
- ChecklistResult
- Finding
- CorrectiveAction
- EvidencePhoto
- SafetyCostUsage
- FileAsset
- Submission
- MailThread

반드시 포함할 prompts:
- safety-report-generation
- safety-health-ledger-report implementation prompt
- safety-health-ledger-report design prompt

반드시 포함할 tests:
- test_safety_report_draft_create_success
- test_safety_report_requires_project_round_owner
- test_safety_report_prevents_duplicate_active_owner_report
- test_safety_report_generates_owner_specific_document
- test_safety_report_missing_required_fields
- test_safety_report_clone_for_owner_replaces_owner_specific_values
- test_safety_report_checklist_results_mapped
- test_safety_report_finding_photo_ledger_mapped
- test_safety_report_safety_cost_rate_calculated
- test_safety_report_export_blocked_when_required_missing
- test_safety_report_export_uses_latest_saved_snapshot
- test_safety_report_export_creates_file_asset
- test_safety_report_links_owner_report_task
- test_safety_report_mark_submitted_updates_owner_report_task
- test_safety_report_refresh_linked_data_detects_stale_source

주의:
- 보고서는 Project 없이 생성될 수 없다.
- 보고서는 InspectionRound 없이 생성될 수 없다.
- 보고서는 ownerPartyId 없이 생성될 수 없다.
- 같은 회차에서 발주처별 보고서를 분리해야 한다.
- 총 공사금액과 발주처별 공사금액을 혼동하지 않는다.
- AI가 법령 문구를 임의 생성하지 못하게 한다.
- 사진대지는 지적사항과 조치현황이 매칭되어야 한다.
- 산업안전보건관리비 사용률은 계산값을 검증해야 한다.
- export는 최신 저장 snapshot 기준이어야 한다.
- export 파일은 FileAsset과 웹하드 위치를 가져야 한다.
- submitted 상태는 Submission 또는 MailThread와 연결되어야 한다.
```
