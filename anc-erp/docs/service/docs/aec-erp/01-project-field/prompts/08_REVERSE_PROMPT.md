# 08. Reverse Prompt — 프로젝트/현장 원장 관리

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
프로젝트/현장 원장 관리

기능 설명:
프로젝트/현장 원장은 공사개요, 현장주소, 발주처, 시공사, 엔지니어링사, 담당자, 공사금액, 공사기간, 공정율, 점검주기, 총 점검회차, 발주처별 보고서 제출 여부를 관리하는 기준 데이터 기능이다.

업무 맥락:
- 계약서, 총괄현황, 보고서, 점검표, 사진대지, 제출 메일은 모두 Project 데이터를 사용한다.
- 발주처가 여러 개인 경우 ProjectParty로 분리한다.
- 같은 프로젝트라도 발주처별 보고서가 따로 생성될 수 있다.
- 시공사와 A&C 담당자는 연락망에 사용된다.
- 공사기간과 점검주기는 점검회차 생성에 사용된다.
- 담당자 이메일은 보고서 제출 메일과 조치요청 메일에 사용된다.
- 프로젝트 정보 변경은 하위 문서와 웹하드 폴더, 제출 이력에 영향을 줄 수 있다.

입력:
{
  "featureName": "프로젝트/현장 원장 관리",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `project.field.registry`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 계약/견적
    - 점검회차
    - 보고서 자동화
    - 체크리스트
    - 지적사항/조치현황
    - 웹하드
    - 메일함
    - 결재/제출

출력 JSON:
{
  "featureId": "project.field.registry",
  "featureName": "프로젝트/현장 원장 관리",
  "priority": "P0",
  "routes": [
    "/projects",
    "/projects/new",
    "/projects/[projectId]",
    "/projects/[projectId]/overview",
    "/projects/[projectId]/parties",
    "/projects/[projectId]/contacts",
    "/projects/[projectId]/requirements",
    "/projects/[projectId]/related",
    "/projects/[projectId]/history",
    "/projects/[projectId]/settings"
  ],
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

반드시 포함할 models:
- Project
- Organization
- ProjectParty
- Contact
- ProjectRequirementStatus
- ProjectActivityLog
- ProjectExtractionResult

반드시 포함할 prompts:
- project-info-extraction
- project-field implementation prompt
- project-field design prompt

반드시 포함할 tests:
- test_project_create_success
- test_project_requires_project_name
- test_project_update_success
- test_project_progress_rate_range
- test_project_date_range_validation
- test_project_total_inspection_rounds_non_negative
- test_project_party_multiple_owners
- test_project_party_owner_requires_separate_report
- test_contact_create_success
- test_project_requirements_for_safety_report
- test_project_activity_log_created_on_update
- test_project_extraction_preview_does_not_apply_without_confirmation

주의:
- 발주처는 Organization이지만 프로젝트 안에서의 역할은 ProjectParty로 표현해야 한다.
- 발주처별 보고서가 필요한 경우 requiresSeparateReport가 true여야 한다.
- 공사금액 총액과 발주처별 분담금액을 혼동하지 않는다.
- projectId는 이후 모든 모듈의 필수 연결키다.
- AI 추출 결과는 바로 저장하지 말고 사용자 확인 후 적용한다.
- Project 삭제는 하위 문서가 있으면 archive 처리한다.
- 웹하드 폴더명은 projectId 기반으로 연결하고 displayName만 프로젝트명을 따라간다.
```
