# 08. Reverse Prompt — 결재/서명/제출

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
결재/서명/제출

기능 설명:
결재/서명/제출은 문서가 초안에서 내부 검토, 기술사 확인, 서명/날인, 최종본 패키징, 발주처별 제출, 제출 확인, 보관 상태로 이동하는 과정을 관리하는 기능이다.

업무 맥락:
- 결재는 Project와 DocumentInstance에 연결된다.
- 발주처별 보고서는 ownerPartyId 기준으로 제출 이력이 분리되어야 한다.
- 제출 전에는 결재 완료, 서명/날인 완료, 최종본 파일, 첨부파일, 수신자, 메일 초안을 검증해야 한다.
- 제출은 MailThread/MailMessage 또는 manual record와 연결된다.
- 최종본, 날인본, 제출본은 FileAsset과 웹하드 폴더에 연결되어야 한다.
- 반려 또는 수정 요청은 문서 상태와 결재 이력에 남아야 한다.
- 제출 확인 또는 보완 요청은 Submission 상태로 관리한다.

입력:
{
  "featureName": "결재/서명/제출",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "mailRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `approval.signature.submission`으로 설정한다.
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
    - 안전관리계획서
    - 안전보건대장
    - 웹하드
    - 메일함
    - 관리자/템플릿
    - 대시보드

출력 JSON:
{
  "featureId": "approval.signature.submission",
  "featureName": "결재/서명/제출",
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
- /approvals
- /approvals/inbox
- /approvals/requested
- /approvals/[approvalWorkflowId]
- /documents/[documentId]/approval
- /documents/[documentId]/signing
- /documents/[documentId]/submission
- /documents/[documentId]/submission/new
- /projects/[projectId]/submissions
- /submissions/[submissionId]
- /submissions/[submissionId]/confirmation
- /admin/approval-templates
- /admin/signature-assets

반드시 포함할 models:
- ApprovalWorkflow
- ApprovalStep
- ApprovalComment
- ApprovalTemplate
- SignatureAsset
- SignatureTask
- FinalDocumentPackage
- Submission
- SubmissionAttachment
- SubmissionRecipient
- SubmissionValidationWarning
- SubmissionStatusEvent
- DocumentInstance
- FileAsset
- MailThread
- MailMessage
- ProjectParty
- AuditLog

반드시 포함할 prompts:
- approval-submission-readiness
- approval-signature-submission implementation prompt
- approval-signature-submission design prompt

반드시 포함할 tests:
- test_approval_workflow_create_success
- test_approval_workflow_requires_document_project_match
- test_approval_step_approve_moves_next_step
- test_approval_step_reject_blocks_submission
- test_approval_request_changes_updates_document_status
- test_approval_workflow_completed_when_required_steps_approved
- test_signature_task_create_success
- test_signature_task_complete_requires_signed_file_when_upload_type
- test_signature_task_waive_requires_reason
- test_submission_readiness_detects_missing_approval
- test_submission_readiness_detects_missing_signature
- test_submission_package_create_success
- test_submission_package_validate_requires_main_file
- test_submission_mail_send_creates_mail_message
- test_submission_mail_send_updates_document_status
- test_submission_manual_submit_success
- test_submission_owner_party_must_be_owner
- test_submission_confirm_owner_receipt
- test_submission_revision_request_updates_status
- test_submission_archives_final_package
- test_submission_creates_audit_log

주의:
- 결재 미완료 문서는 제출 가능 상태가 아니다.
- 반려 또는 수정요청이 남아 있으면 제출을 차단한다.
- 서명/날인이 필요한 문서에서 signedFileId가 없으면 제출을 차단한다.
- 발주처별 제출 문서는 ownerPartyId가 일치해야 한다.
- 메일 제출은 MailMessage와 Submission을 함께 갱신해야 한다.
- 수동 제출은 submittedAt과 증빙 정보를 남겨야 한다.
- 최종본과 날인본, 제출본을 혼동하지 않는다.
- 업무상 서명/날인 확인을 법적 전자서명 완료로 표현하지 않는다.
```
