# 08. Reverse Prompt — 산업안전보건관리비 사용내용 확인

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
산업안전보건관리비 사용내용 확인

기능 설명:
산업안전보건관리비 사용내용 확인은 점검회차와 발주처별로 계상금액, 사용금액, 사용률, 기준월, 관련근거, 적정성 의견, 증빙파일을 관리하고 공사안전보건대장 이행확인 보고서에 반영하는 기능이다.

업무 맥락:
- SafetyCostUsage는 Project, InspectionRound, ownerPartyId에 속한다.
- 같은 점검회차라도 삼성문화재단과 삼성생명공익재단의 계상금액/사용금액/사용률이 다를 수 있다.
- 사용률은 시스템이 계산한다.
- 증빙파일은 FileAsset과 연결된다.
- 적정성 의견은 AI가 초안을 작성할 수 있지만 사용자 확정이 필요하다.
- 보고서에는 산업안전보건관리비 사용 내용 확인 섹션, 공사개요 총평, 이행여부 확인서 예산관리 문구로 반영된다.
- 보고서 export 전에는 확정 여부, 관련근거, 증빙파일 누락을 검증해야 한다.

입력:
{
  "featureName": "산업안전보건관리비 사용내용 확인",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "reportRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `safety_cost.usage_confirmation`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.

출력 JSON:
{
  "featureId": "safety_cost.usage_confirmation",
  "featureName": "산업안전보건관리비 사용내용 확인",
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
- /projects/[projectId]/safety-costs
- /projects/[projectId]/safety-costs/owner-matrix
- /inspections/[inspectionRoundId]/safety-costs
- /inspections/[inspectionRoundId]/safety-costs/new
- /safety-costs/[usageId]
- /safety-costs/[usageId]/edit
- /safety-costs/[usageId]/evidence
- /safety-costs/[usageId]/review
- /safety-costs/[usageId]/preview
- /safety-costs/[usageId]/history
- /documents/safety-reports/[documentId]/safety-cost-usage

반드시 포함할 models:
- SafetyCostUsage
- SafetyCostEvidence
- SafetyCostReview
- SafetyCostHistoryEvent
- SafetyCostValidationWarning
- SafetyCostReportMapping
- Project
- ProjectParty
- InspectionRound
- DocumentInstance
- FileAsset
- AuditLog

반드시 포함할 prompts:
- safety-cost-usage-comment
- safety-cost-usage implementation prompt
- safety-cost-usage design prompt

반드시 포함할 tests:
- test_safety_cost_create_success
- test_safety_cost_requires_project_round_owner
- test_safety_cost_owner_party_must_be_owner
- test_safety_cost_calculates_used_rate
- test_safety_cost_rate_mismatch_warning
- test_safety_cost_used_amount_exceeds_calculated_amount_warning
- test_safety_cost_requires_basis_for_confirm
- test_safety_cost_evidence_upload_link_file
- test_safety_cost_generate_comment
- test_safety_cost_review_create_success
- test_safety_cost_confirm_success
- test_safety_cost_confirm_blocked_without_evidence
- test_safety_cost_sync_to_report_updates_sections
- test_safety_cost_history_created_on_amount_update
- test_safety_cost_owner_matrix_returns_all_owners
- test_safety_cost_report_export_missing_warning

주의:
- SafetyCostUsage는 Project와 InspectionRound와 ownerPartyId 없이 생성될 수 없다.
- ownerPartyId는 발주처 ProjectParty여야 한다.
- 사용률은 사용자가 아니라 시스템 계산값을 기준으로 한다.
- AI 적정성 의견은 draft이고 사용자 확정이 필요하다.
- 증빙파일이 없으면 확정 또는 export 전 warning을 표시해야 한다.
- 발주처별 금액이 섞이면 danger warning이다.
- 보고서 동기화 시 project_summary와 implementation_confirmation도 함께 갱신한다.
```
