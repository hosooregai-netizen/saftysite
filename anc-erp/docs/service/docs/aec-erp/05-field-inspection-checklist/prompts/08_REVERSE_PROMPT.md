# 08. Reverse Prompt — 현장점검 체크리스트

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
현장점검 체크리스트

기능 설명:
현장점검 체크리스트는 점검자가 공사안전보건대장 이행점검 현장에서 공통, 건축·토목, 건설기계, 위험성 감소대책, 추가 유해·위험요인 항목을 입력하고, 주의/불량 결과를 지적사항 후보로 전환하며, 사진과 보고서 자동화에 연결하는 기능이다.

업무 맥락:
- ChecklistSession은 Project와 InspectionRound에 속한다.
- ChecklistResult는 보고서의 공사안전보건대장 이행 확인 점검표에 반영된다.
- RiskReductionChecklistItem은 보고서의 유해·위험방지계획에 따른 위험성 감소대책 이행확인에 반영된다.
- AdditionalHazardItem은 추가 유해·위험요인 점검리스트와 사진대지에 반영된다.
- 주의 또는 불량 결과는 FindingCandidate로 생성되어야 한다.
- FindingCandidate는 사용자의 승인 후 Finding으로 전환된다.
- 모바일 현장 입력과 데스크톱 검토 화면을 모두 지원해야 한다.
- 보고서 생성 이후 체크리스트가 변경되면 stale mapping 경고가 필요하다.

출력 JSON:
{
  "featureId": "inspection.checklist.management",
  "featureName": "현장점검 체크리스트",
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
- /projects/[projectId]/checklist-templates
- /projects/[projectId]/inspections/[inspectionRoundId]/checklist
- /inspections/[inspectionRoundId]/checklist
- /inspections/[inspectionRoundId]/checklist/mobile
- /inspections/[inspectionRoundId]/checklist/review
- /checklist-sessions/[sessionId]
- /checklist-sessions/[sessionId]/results
- /checklist-sessions/[sessionId]/finding-candidates
- /checklist-sessions/[sessionId]/photos
- /admin/checklist-templates
- /admin/checklist-templates/[templateId]

반드시 포함할 models:
- ChecklistTemplate
- ChecklistCategory
- ChecklistItem
- ChecklistSession
- ChecklistResult
- FindingCandidate
- RiskReductionChecklistItem
- AdditionalHazardItem
- ChecklistPhoto
- ChecklistMobileDraft
- ChecklistReportMapping
- Project
- InspectionRound
- Finding
- FileAsset
- DocumentInstance
- AuditLog

반드시 포함할 prompts:
- checklist-summary-and-finding-candidate
- field-inspection-checklist implementation prompt
- field-inspection-checklist design prompt

주의:
- ChecklistSession은 Project와 InspectionRound 없이 생성될 수 없다.
- ChecklistResult의 결과값은 표준 enum을 사용해야 한다.
- 주의/불량 항목은 FindingCandidate 생성 대상이다.
- FindingCandidate는 자동으로 Finding 확정되면 안 된다.
- 사진이 없는 항목에 사진이 있다고 표시하지 않는다.
- 보고서 매핑은 체크리스트 결과 변경 시 stale 상태를 표시해야 한다.
- locked 세션은 수정할 수 없다.
- 템플릿 변경은 기존 세션을 훼손하면 안 된다.
```
