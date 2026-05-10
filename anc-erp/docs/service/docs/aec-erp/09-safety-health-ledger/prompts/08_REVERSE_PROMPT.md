# 08. Reverse Prompt — 안전보건대장 자동화

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
안전보건대장 자동화

기능 설명:
안전보건대장 자동화는 프로젝트 전체 기간 동안 유해·위험요인, 위험성 감소대책, 점검 이력, 지적사항 이력, 조치 완료 이력, 산업안전보건관리비 확인 이력, 첨부문서를 누적 관리하고 대장 문서로 export하는 기능이다.

업무 맥락:
- 안전보건대장은 Project에 속한다.
- 회차별 이행확인 보고서와 달리 프로젝트 전체 누적 대장이다.
- 안전관리계획서의 공종별 위험요인과 감소대책을 초기 데이터로 가져올 수 있다.
- 점검회차, 체크리스트, 지적사항, 조치현황, 산업안전보건관리비를 누적 이력으로 반영한다.
- 같은 위험요인이 반복되면 반복/재발 위험요인으로 표시한다.
- 조치 완료 이력은 verified CorrectiveAction만 완료로 표현한다.
- export는 최신 저장 snapshot 기준으로 수행한다.
- export 파일은 FileAsset과 웹하드 위치를 가져야 한다.

입력:
{
  "featureName": "안전보건대장 자동화",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `safety_health_ledger.automation`으로 설정한다.
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
    - 안전관리계획서
    - 점검회차/일정
    - 현장점검 체크리스트
    - 지적사항/조치현황
    - 사진대지
    - 산업안전보건관리비
    - 이행확인 보고서
    - 웹하드
    - 결재/제출
    - 관리자/템플릿

출력 JSON:
{
  "featureId": "safety_health_ledger.automation",
  "featureName": "안전보건대장 자동화",
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
- /projects/[projectId]/safety-health-ledgers
- /projects/[projectId]/safety-health-ledgers/new
- /safety-health-ledgers/[ledgerId]
- /safety-health-ledgers/[ledgerId]/edit
- /safety-health-ledgers/[ledgerId]/risks
- /safety-health-ledgers/[ledgerId]/measures
- /safety-health-ledgers/[ledgerId]/inspections
- /safety-health-ledgers/[ledgerId]/findings
- /safety-health-ledgers/[ledgerId]/safety-costs
- /safety-health-ledgers/[ledgerId]/attachments
- /safety-health-ledgers/[ledgerId]/preview
- /safety-health-ledgers/[ledgerId]/export
- /safety-health-ledgers/[ledgerId]/versions

반드시 포함할 models:
- SafetyHealthLedger
- SafetyHealthLedgerSnapshot
- LedgerMeta
- SafetyHealthLedgerSection
- LedgerRiskItem
- LedgerRiskReductionMeasure
- LedgerInspectionHistory
- LedgerFindingHistory
- LedgerSafetyCostHistory
- LedgerAttachment
- SafetyHealthLedgerVersion
- LedgerMissingField
- LedgerReviewWarning
- LedgerSourceLink
- Project
- SafetyManagementPlan
- InspectionRound
- ChecklistSession
- Finding
- CorrectiveAction
- SafetyCostUsage
- FileAsset
- AuditLog

반드시 포함할 prompts:
- safety-health-ledger-generation
- safety-health-ledger implementation prompt
- safety-health-ledger design prompt

반드시 포함할 tests:
- test_safety_health_ledger_create_success
- test_safety_health_ledger_prevents_duplicate_active_ledger
- test_safety_health_ledger_imports_risks_from_safety_management_plan
- test_ledger_risk_requires_hazard_description
- test_ledger_syncs_inspection_history
- test_ledger_syncs_finding_action_history
- test_ledger_syncs_safety_cost_history
- test_ledger_detects_repeated_risks
- test_ledger_version_created_on_sync
- test_ledger_export_blocked_when_required_missing
- test_ledger_export_uses_latest_saved_snapshot
- test_ledger_export_creates_file_asset
- test_ledger_attachment_links_file_asset
- test_ledger_stale_source_warning_created

주의:
- 안전보건대장은 회차별 보고서가 아니라 프로젝트 단위 누적 대장이다.
- projectId 없이 생성될 수 없다.
- 원본 데이터와 연결되는 항목은 sourceLinks를 유지해야 한다.
- 조치가 verified되지 않은 항목을 완료로 표현하지 않는다.
- 반복 위험요인 탐지는 사용자를 위한 경고이며 임의로 위험을 확정하지 않는다.
- AI 초안은 draft 상태로만 저장한다.
- export는 최신 저장 snapshot 기준이어야 한다.
```
