# 08. Reverse Prompt — 점검회차/일정 관리

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
점검회차/일정 관리

기능 설명:
점검회차/일정 관리는 프로젝트의 공사기간, 계약기간, 점검주기, 총 점검회차, 발주처별 보고서 제출 조건을 기준으로 공사안전보건대장 이행점검 일정을 생성하고 관리하는 기능이다.

업무 맥락:
- 점검회차는 Project에 속한다.
- 점검회차는 Contract의 점검횟수, 계약기간, 지급조건 milestone과 연결될 수 있다.
- 발주처가 여러 개인 경우 회차마다 발주처별 보고서 업무가 생성되어야 한다.
- 같은 회차라도 삼성문화재단 보고서와 삼성생명공익재단 보고서가 별도 생성될 수 있다.
- 점검회차는 체크리스트, 지적사항, 사진대지, 보고서 자동화, 메일 제출의 기준키다.
- 공사일정 도면이나 첨부자료는 Project 또는 InspectionRound에 연결될 수 있다.
- 일정 변경은 이력을 남겨야 한다.

입력:
{
  "featureName": "점검회차/일정 관리",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "mailRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `inspection.schedule.management`로 설정한다.
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
    - 현장점검 체크리스트
    - 보고서 자동화
    - 지적사항/사진대지
    - 산업안전보건관리비
    - 웹하드
    - 메일함
    - 결재/제출
    - 대시보드

출력 JSON:
{
  "featureId": "inspection.schedule.management",
  "featureName": "점검회차/일정 관리",
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
- /projects/[projectId]/inspections
- /projects/[projectId]/inspections/schedule
- /projects/[projectId]/inspections/new
- /inspections/[inspectionRoundId]
- /inspections/[inspectionRoundId]/edit
- /inspections/[inspectionRoundId]/tasks
- /inspections/[inspectionRoundId]/owner-reports
- /inspections/[inspectionRoundId]/attachments
- /calendar/inspections

반드시 포함할 models:
- InspectionSchedule
- InspectionRound
- InspectionOwnerReportTask
- InspectionTask
- WorkScheduleAttachment
- InspectionRescheduleLog
- InspectionRoundMilestone
- Project
- Contract
- ProjectParty
- FileAsset
- AuditLog

반드시 포함할 prompts:
- inspection-schedule-generation
- inspection-schedule implementation prompt
- inspection-schedule design prompt

반드시 포함할 tests:
- test_inspection_schedule_preview_success
- test_inspection_schedule_preview_does_not_persist
- test_inspection_schedule_generate_10_rounds
- test_inspection_round_no_unique_per_project
- test_inspection_round_document_no_generation
- test_inspection_schedule_generates_owner_report_tasks
- test_owner_report_task_created_only_for_separate_report_owner
- test_inspection_task_defaults_created
- test_inspection_reschedule_creates_log
- test_round_submitted_requires_all_owner_reports_submitted
- test_round_closed_requires_dependencies
- test_work_schedule_attachment_linked_to_round
- test_calendar_returns_inspection_rounds
- test_milestone_labels_are_exposed

주의:
- InspectionRound는 Project 없이 생성될 수 없다.
- 예정월, 예정일, 실제 점검일을 혼동하지 않는다.
- 발주처별 보고서 업무는 InspectionRound와 ownerPartyId를 모두 가져야 한다.
- 회차 상태와 발주처별 보고서 상태를 혼동하지 않는다.
- 일정 미리보기는 저장하지 않는다.
- 일정 변경은 반드시 InspectionRescheduleLog를 남긴다.
- 문서번호는 자동 생성하되 사용자가 수정할 수 있어야 한다.
- 점검회차는 체크리스트, 지적사항, 사진대지, 보고서 자동화의 핵심 연결키다.
```
