# 04. Codex Implementation Prompt — 메일함

## Prompt

```text
You are implementing the Mailbox module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module integrates the apps-style 3-pane mailbox shell with project communication, report submission, action request mails, material request mails, schedule coordination, contract/estimate send mails, attachment save-to-webhard, and submission history.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- Mail MVP: guest draft mode and mock mail provider
- Mail V1: Google OAuth/Gmail adapter behind provider interface
- API namespace: /api/v1

Implement only the Mailbox module.

Existing concepts:
- Project
- Organization
- ProjectParty
- Contact
- InspectionRound
- InspectionOwnerReportTask
- DocumentInstance
- FileAsset
- Folder
- Finding
- CorrectiveAction
- Contract
- Estimate
- Submission
- AuditLog

Required backend models:
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
- MailProviderEvent

Required backend APIs:

Mail Accounts:
- GET /api/v1/mail/accounts
- POST /api/v1/mail/accounts/guest
- GET /api/v1/mail/accounts/{accountId}
- PATCH /api/v1/mail/accounts/{accountId}
- DELETE /api/v1/mail/accounts/{accountId}
- POST /api/v1/mail/oauth/google/start
- GET /api/v1/mail/oauth/google/callback
- POST /api/v1/mail/accounts/{accountId}/disconnect
- POST /api/v1/mail/accounts/{accountId}/sync
- GET /api/v1/mail/accounts/{accountId}/sync-jobs

Threads and Messages:
- GET /api/v1/mail/threads
- GET /api/v1/mail/threads/{threadId}
- PATCH /api/v1/mail/threads/{threadId}
- POST /api/v1/mail/threads/{threadId}/archive
- GET /api/v1/mail/messages
- GET /api/v1/mail/messages/{messageId}
- PATCH /api/v1/mail/messages/{messageId}
- POST /api/v1/mail/messages/{messageId}/mark-read
- POST /api/v1/mail/messages/{messageId}/link-entity
- POST /api/v1/mail/messages/{messageId}/classify

Draft and Send:
- POST /api/v1/mail/drafts
- GET /api/v1/mail/drafts/{draftId}
- PATCH /api/v1/mail/drafts/{draftId}
- POST /api/v1/mail/drafts/{draftId}/generate
- POST /api/v1/mail/drafts/{draftId}/validate
- POST /api/v1/mail/drafts/{draftId}/send
- POST /api/v1/mail/send

Attachments:
- GET /api/v1/mail/messages/{messageId}/attachments
- POST /api/v1/mail/attachments/{attachmentId}/save-to-webhard
- POST /api/v1/mail/attachments/save-bulk-to-webhard
- POST /api/v1/mail/attachments/{attachmentId}/link-file

Context-specific Drafts:
- POST /api/v1/documents/{documentId}/submission-mail/draft
- POST /api/v1/findings/action-request-mail/draft
- POST /api/v1/projects/{projectId}/material-request-mail/draft
- POST /api/v1/inspection-rounds/{inspectionRoundId}/schedule-coordination-mail/draft
- POST /api/v1/contracts/{contractId}/send-mail/draft
- POST /api/v1/estimates/{estimateId}/send-mail/draft

Templates and Signatures:
- GET /api/v1/mail/templates
- POST /api/v1/mail/templates
- GET /api/v1/mail/templates/{templateId}
- PATCH /api/v1/mail/templates/{templateId}
- DELETE /api/v1/mail/templates/{templateId}
- GET /api/v1/mail/signatures
- POST /api/v1/mail/signatures
- PATCH /api/v1/mail/signatures/{signatureId}

Required frontend routes:
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

Required frontend components:
- MailboxShell
- MailLeftPane
- MailAccountSelector
- MailFolderList
- ProjectMailFilter
- MailSearchBar
- MailThreadList
- MailMessageListItem
- MailDetailPane
- MailBodyViewer
- MailAttachmentList
- MailAttachmentSavePanel
- MailProjectLinker
- MailEntityLinker
- ComposePanel
- MailRecipientInput
- MailTemplateSelector
- MailAIDraftPanel
- MailSendChecklist
- SubmissionMailComposer
- ActionRequestMailComposer
- MaterialRequestMailComposer
- ScheduleCoordinationMailComposer
- ContractEstimateMailComposer
- OAuthConnectCard
- MailSyncStatusBadge
- MailSyncLogPanel
- MailSignatureEditor
- MailTemplateEditor

Business requirements:
1. Mailbox must support guest draft mode without OAuth.
2. Connected OAuth mode must use a MailProvider adapter interface.
3. Mail messages can link to Project, InspectionRound, DocumentInstance, Finding, CorrectiveAction, Contract, Estimate, FileAsset, and Submission.
4. Mail classification must produce suggested links, but user confirmation is required.
5. Report submission mail draft requires DocumentInstance and exported FileAsset.
6. Sending report submission mail must create or update Submission.
7. Sending report submission mail must update DocumentInstance.status and OwnerReportTask.status to submitted.
8. Action request mail draft requires at least one Finding.
9. Sending action request mail must update Finding.status to action_requested.
10. Attachments can be saved to Webhard as FileAsset and linked back to MailAttachment.
11. Duplicate attachment filenames should create FileVersion or use rename policy.
12. AI-generated mail drafts are draft only and require user review before send.
13. All send, sync, attachment-save, and link actions should create AuditLog.

Seed data:
- Create a guest mail account.
- Create mail templates for report_submission, action_request, material_request, schedule_coordination, contract_estimate, safety_cost_request.
- Create demo report submission draft for Leeum elevator replacement project, round 1, Samsung Cultural Foundation.
- Create demo action request draft for findings in round 1.

Validation:
1. subject is required.
2. at least one recipient is required.
3. report_submission requires documentId and attachmentFileIds.
4. action_request requires findingIds.
5. guest mode cannot call provider send; it can export/copy draft only.
6. attachment save-to-webhard requires projectId and folderId.
7. submitted status requires MailMessage or manual submission record.

Tests:
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

Deliverables:
- Backend models and repositories
- Mail provider interface and mock provider
- Backend API routes and services
- Mail classification service
- Mail draft generation service
- Attachment save-to-webhard service
- Submission integration service
- Frontend mailbox 3-pane shell
- Compose and context-specific mail pages
- API client functions
- Type definitions
- Tests
- README note for this module
```
