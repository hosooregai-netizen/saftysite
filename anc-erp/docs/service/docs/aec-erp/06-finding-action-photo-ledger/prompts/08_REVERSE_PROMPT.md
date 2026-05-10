# 08. Reverse Prompt — 지적사항/조치현황/사진대지

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
지적사항/조치현황/사진대지

기능 설명:
지적사항/조치현황/사진대지는 현장점검 체크리스트의 주의·불량 항목 또는 추가 유해·위험요인에서 생성된 지적사항을 조치요청, 시공사 조치현황, 조치사진, 기술사 확인, 사진대지, 보고서 반영으로 연결하는 기능이다.

업무 맥락:
- Finding은 Project와 InspectionRound에 속한다.
- Finding은 ownerPartyId를 가질 수 있다.
- Finding은 ChecklistResult, AdditionalHazardItem, RiskReductionChecklistItem에서 생성될 수 있다.
- CorrectiveAction은 Finding에 속한다.
- EvidencePhoto는 Finding 또는 CorrectiveAction에 연결된다.
- PhotoLedger는 InspectionRound와 ownerPartyId 기준으로 생성된다.
- PhotoLedgerEntry는 지적사진과 조치사진을 매칭한다.
- 사진대지는 공사안전보건대장 이행확인 보고서의 photo_ledger section에 동기화된다.
- 조치요청은 메일함과 연결될 수 있다.
- 사진 원본은 웹하드 FileAsset과 연결되어야 한다.
- 사진 마크업은 원본을 훼손하지 않고 overlay metadata로 저장한다.

입력:
{
  "featureName": "지적사항/조치현황/사진대지",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "mailRequirements": [],
  "reportRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `finding.action.photo_ledger`로 설정한다.
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
    - 점검회차/일정
    - 현장점검 체크리스트
    - 공사안전보건대장 이행확인 보고서 자동화
    - 산업안전보건관리비
    - 웹하드
    - 메일함
    - 결재/제출
    - 관리자/템플릿

출력 JSON:
{
  "featureId": "finding.action.photo_ledger",
  "featureName": "지적사항/조치현황/사진대지",
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
- /projects/[projectId]/findings
- /projects/[projectId]/findings/new
- /inspections/[inspectionRoundId]/findings
- /inspections/[inspectionRoundId]/findings/new
- /findings/[findingId]
- /findings/[findingId]/edit
- /findings/[findingId]/actions
- /findings/[findingId]/photos
- /findings/[findingId]/verify
- /inspections/[inspectionRoundId]/photo-ledger
- /inspections/[inspectionRoundId]/photo-ledger/new
- /photo-ledgers/[photoLedgerId]
- /photo-ledgers/[photoLedgerId]/edit
- /photo-ledgers/[photoLedgerId]/preview
- /photo-ledgers/[photoLedgerId]/export

반드시 포함할 models:
- Finding
- CorrectiveAction
- EvidencePhoto
- PhotoMarkupInfo
- PhotoMarkupShape
- PhotoLedger
- PhotoLedgerEntry
- PhotoLedgerWarning
- FindingTimelineEvent
- ActionRequestMailDraft
- Project
- ProjectParty
- InspectionRound
- ChecklistResult
- FindingCandidate
- FileAsset
- DocumentInstance
- MailThread
- AuditLog

반드시 포함할 prompts:
- finding-action-photo-ledger
- finding-action-photo-ledger implementation prompt
- finding-action-photo-ledger design prompt

반드시 포함할 tests:
- test_finding_create_success
- test_finding_requires_project_and_round
- test_finding_owner_party_must_be_owner
- test_finding_from_checklist_candidate
- test_finding_prevent_duplicate_source
- test_finding_request_action_changes_status
- test_corrective_action_submit_success
- test_corrective_action_verify_success
- test_corrective_action_reject_requires_reason
- test_finding_close_requires_verified_action
- test_evidence_photo_upload_link_finding
- test_evidence_photo_markup_saved
- test_photo_ledger_create_success
- test_photo_ledger_generate_entries_from_findings
- test_photo_ledger_warns_missing_action_photo
- test_photo_ledger_warns_unverified_action
- test_photo_ledger_owner_filter
- test_photo_ledger_reorder_entries
- test_photo_ledger_export_uses_confirmed_entries
- test_photo_ledger_sync_to_safety_report
- test_action_request_mail_draft_includes_findings

주의:
- Finding은 Project와 InspectionRound 없이 생성될 수 없다.
- ownerPartyId가 있으면 owner ProjectParty인지 검증해야 한다.
- 지적사진과 조치사진은 구분되어야 한다.
- 조치 미확인 상태를 완료로 표시하면 안 된다.
- 원본 사진을 수정하지 말고 markupInfo overlay를 저장해야 한다.
- 발주처별 사진대지가 섞이면 owner_mismatch danger warning을 표시해야 한다.
- 사진대지 export는 confirmed entry 기준으로 수행되어야 한다.
- 보고서 동기화 후 DocumentVersion을 생성해야 한다.
- 조치요청 메일은 선택된 Finding과 dueDate, requiredAction, 사진을 포함해야 한다.
```
