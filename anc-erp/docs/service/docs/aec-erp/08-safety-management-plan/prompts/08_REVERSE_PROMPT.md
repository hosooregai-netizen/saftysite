# 08. Reverse Prompt — 안전관리계획서 자동화

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
안전관리계획서 자동화

기능 설명:
안전관리계획서 자동화는 프로젝트 원장, 계약, 발주처/시공사/담당자, 공정표, 작업공법, 위험요인, 감소대책, 안전관리조직, 비상연락망, 교육계획, 점검계획, 첨부자료를 기반으로 안전관리계획서 초안을 생성하고 A4 미리보기와 PDF/HWPX export를 제공하는 기능이다.

업무 맥락:
- 안전관리계획서는 기본적으로 Project 단위 문서다.
- 필요 시 Contract와 연결된다.
- 필요 시 InspectionRound에 개정본 또는 보완본으로 연결될 수 있다.
- 공종별 위험요인과 감소대책은 현장점검 체크리스트와 안전보건대장의 원천 데이터가 된다.
- AI 초안은 최종본이 아니며 사용자가 검토·확정해야 한다.
- 법령/표준 문구는 등록된 템플릿 문구만 사용해야 한다.
- export는 최신 저장 snapshot 기준으로 수행되어야 한다.
- export 파일은 웹하드 FileAsset으로 저장되어야 한다.

입력:
{
  "featureName": "안전관리계획서 자동화",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `safety_management_plan.automation`으로 설정한다.
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
    - 안전보건대장
    - 웹하드
    - 메일함
    - 결재/제출
    - 관리자/템플릿

출력 JSON:
{
  "featureId": "safety_management_plan.automation",
  "featureName": "안전관리계획서 자동화",
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
- /projects/[projectId]/safety-management-plans
- /projects/[projectId]/safety-management-plans/new
- /safety-management-plans/[planId]
- /safety-management-plans/[planId]/edit
- /safety-management-plans/[planId]/preview
- /safety-management-plans/[planId]/sections
- /safety-management-plans/[planId]/risks
- /safety-management-plans/[planId]/organization
- /safety-management-plans/[planId]/education
- /safety-management-plans/[planId]/emergency
- /safety-management-plans/[planId]/attachments
- /safety-management-plans/[planId]/export

반드시 포함할 models:
- SafetyManagementPlan
- SafetyManagementProjectSnapshot
- SafetyManagementPlanSection
- SafetyManagementPlanVersion
- SafetyManagementWorkType
- SafetyManagementRiskItem
- SafetyOrganizationPlan
- SafetyEducationPlan
- SafetyEmergencyPlan
- SafetyInspectionPlan
- SafetyManagementPlanAttachment
- SafetyManagementExportJob
- Project
- ProjectParty
- Contact
- Contract
- FileAsset
- AuditLog

반드시 포함할 prompts:
- safety-management-plan-generation
- safety-management-plan implementation prompt
- safety-management-plan design prompt

반드시 포함할 tests:
- test_safety_management_plan_create_success
- test_safety_management_plan_requires_project_and_template
- test_safety_management_plan_prevents_duplicate_active_without_revision
- test_safety_management_plan_loads_project_snapshot
- test_safety_management_plan_work_type_create_success
- test_safety_management_plan_risk_item_requires_hazard_and_measure
- test_safety_management_plan_generate_risks_from_work_types
- test_safety_management_plan_import_risks_from_checklist
- test_safety_management_plan_missing_required_fields
- test_safety_management_plan_section_regenerate_ai_draft
- test_safety_management_plan_export_blocked_when_required_missing
- test_safety_management_plan_export_uses_latest_saved_snapshot
- test_safety_management_plan_export_creates_file_asset
- test_safety_management_plan_refresh_linked_data_sets_stale
- test_safety_management_plan_version_created_on_save

주의:
- 안전관리계획서는 Project 없이 생성될 수 없다.
- 원본 템플릿이 없는 경우 일반 목차를 최종 템플릿으로 확정하지 않는다.
- AI가 법령 문구를 임의 생성하지 못하게 한다.
- 공종별 위험요인과 감소대책은 구조화된 RiskItem으로 저장한다.
- 첨부자료가 없는 경우 첨부된 것처럼 표시하지 않는다.
- export는 최신 저장 snapshot 기준이어야 한다.
- export 파일은 FileAsset과 웹하드 위치를 가져야 한다.
```
