# 08. Reverse Prompt — 메일함

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
메일함

기능 설명:
메일함은 A&C 기술사 ERP 안에서 프로젝트별 업무 메일을 관리하고, 발주처별 보고서 제출, 시공사 조치요청, 자료요청, 일정협의, 계약/견적 발송, 첨부파일 웹하드 저장, 제출 이력 연결을 수행하는 3-pane 업무 메일 기능이다.

업무 맥락:
- 메일은 Project와 연결될 수 있다.
- 메일은 InspectionRound, DocumentInstance, Finding, Contract, Estimate, SafetyCostUsage, FileAsset, Submission과 연결될 수 있다.
- 보고서 제출 메일은 DocumentInstance.exportedFileId를 첨부하고 Submission을 생성해야 한다.
- 조치요청 메일은 Finding 목록과 지적사진을 포함하고 발송 후 Finding.status를 action_requested로 변경할 수 있다.
- 첨부파일은 웹하드에 저장되고 FileAsset으로 연결되어야 한다.
- OAuth 미연결 상태에서는 guest draft mode로 초안 작성만 지원한다.
- OAuth 연결 상태에서는 sync/send를 provider adapter로 처리한다.
- AI 초안은 사용자가 검토해야 하며 자동 발송되면 안 된다.

입력:
{
  "featureName": "메일함",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "oauthRequirements": [],
  "submissionRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `mailbox.project_communication`으로 설정한다.
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
    - 지적사항/조치현황
    - 산업안전보건관리비
    - 웹하드
    - 결재/제출
    - 관리자/템플릿
    - 대시보드

출력 JSON:
{
  "featureId": "mailbox.project_communication",
  "featureName": "메일함",
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
- /mail
- /mail/inbox
- /mail/sent
- /mail/drafts
- /mail/compose
- /mail/threads/[threadId]
- /mail/messages/[messageId]
- /mail/accounts
- /mail/settings
- /projects/[projectId]/mail
- /projects/[projectId]/mail/compose
- /inspections/[inspectionRoundId]/mail
- /documents/[documentId]/submission-mail
- /findings/[findingId]/action-request-mail
- /contracts/[contractId]/send-mail
- /settings/mail-accounts
- /settings/mail-templates

반드시 포함할 models:
- MailAccount
- MailThread
- MailMessage
- MailAddress
- MailAttachment
- MailDraft
- MailEntityLink
- MailTemplate
- MailSignature
- MailSyncJob
- Project
- Contact
- DocumentInstance
- FileAsset
- Finding
- Submission
- AuditLog

반드시 포함할 prompts:
- mail-draft-and-classification
- mailbox implementation prompt
- mailbox design prompt

반드시 포함할 tests:
- test_mail_account_guest_create
- test_mail_oauth_start_returns_auth_url
- test_mail_sync_creates_threads_and_messages
- test_mail_project_classification_by_subject
- test_mail_project_classification_by_contact_email
- test_mail_draft_create_report_submission
- test_mail_draft_report_submission_requires_exported_file
- test_mail_draft_action_request_requires_findings
- test_mail_draft_validate_recipients
- test_mail_send_connected_mode_success
- test_mail_send_guest_mode_blocked_or_copy_only
- test_mail_attachment_save_to_webhard
- test_mail_attachment_duplicate_creates_file_version
- test_report_submission_mail_creates_submission
- test_report_submission_mail_updates_document_status
- test_action_request_mail_updates_finding_status
- test_mail_message_link_entity_confirmed
- test_mail_template_variable_mapping

주의:
- 메일은 Project 없이도 존재할 수 있지만, 업무 메일은 가능한 projectId 연결을 추천해야 한다.
- 추천 연결은 자동 확정하지 말고 사용자가 확인해야 한다.
- 보고서 제출 메일은 최종본 FileAsset 없이는 발송하면 안 된다.
- guest mode에서는 실제 발송을 수행하지 않는다.
- 첨부파일 웹하드 저장은 MailAttachment와 FileAsset을 양방향 연결해야 한다.
- AI가 존재하지 않는 첨부파일이나 수신자를 만들지 않도록 한다.
- 발주처별 문서와 수신자가 서로 맞는지 ownerPartyId를 검증해야 한다.
- 발송/동기화/첨부 저장/제출 이력 생성은 AuditLog를 남겨야 한다.
```
