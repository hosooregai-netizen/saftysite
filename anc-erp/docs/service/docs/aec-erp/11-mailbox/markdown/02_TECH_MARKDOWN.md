# 02. Tech Markdown — 메일함

## 1. Frontend Routes

```text
/mail
/mail/inbox
/mail/sent
/mail/drafts
/mail/compose
/mail/threads/[threadId]
/mail/messages/[messageId]
/mail/accounts
/mail/settings

/projects/[projectId]/mail
/projects/[projectId]/mail/compose
/inspections/[inspectionRoundId]/mail
/documents/[documentId]/submission-mail
/findings/[findingId]/action-request-mail
/contracts/[contractId]/send-mail
/settings/mail-accounts
/settings/mail-templates
```

## 2. Frontend Components

```text
MailboxShell
MailLeftPane
MailAccountSelector
MailFolderList
ProjectMailFilter
MailSearchBar
MailThreadList
MailMessageListItem
MailDetailPane
MailMessageHeader
MailBodyViewer
MailAttachmentList
MailAttachmentSavePanel
MailProjectLinker
MailEntityLinker
ComposePanel
MailRecipientInput
MailTemplateSelector
MailAIDraftPanel
MailSendChecklist
SubmissionMailComposer
ActionRequestMailComposer
MaterialRequestMailComposer
ScheduleCoordinationMailComposer
ContractEstimateMailComposer
OAuthConnectCard
MailSyncStatusBadge
MailSyncLogPanel
MailSignatureEditor
MailTemplateEditor
```

## 3. Backend APIs

### Mail Accounts

```text
GET    /api/v1/mail/accounts
POST   /api/v1/mail/accounts/guest
GET    /api/v1/mail/accounts/{accountId}
PATCH  /api/v1/mail/accounts/{accountId}
DELETE /api/v1/mail/accounts/{accountId}

POST   /api/v1/mail/oauth/google/start
GET    /api/v1/mail/oauth/google/callback
POST   /api/v1/mail/accounts/{accountId}/disconnect
POST   /api/v1/mail/accounts/{accountId}/sync
GET    /api/v1/mail/accounts/{accountId}/sync-jobs
```

### Threads and Messages

```text
GET   /api/v1/mail/threads
GET   /api/v1/mail/threads/{threadId}
PATCH /api/v1/mail/threads/{threadId}
POST  /api/v1/mail/threads/{threadId}/archive

GET   /api/v1/mail/messages
GET   /api/v1/mail/messages/{messageId}
PATCH /api/v1/mail/messages/{messageId}
POST  /api/v1/mail/messages/{messageId}/mark-read
POST  /api/v1/mail/messages/{messageId}/link-entity
POST  /api/v1/mail/messages/{messageId}/classify
```

### Draft and Send

```text
POST /api/v1/mail/drafts
GET  /api/v1/mail/drafts/{draftId}
PATCH /api/v1/mail/drafts/{draftId}
POST /api/v1/mail/drafts/{draftId}/generate
POST /api/v1/mail/drafts/{draftId}/validate
POST /api/v1/mail/drafts/{draftId}/send
POST /api/v1/mail/send
```

### Attachments

```text
GET  /api/v1/mail/messages/{messageId}/attachments
POST /api/v1/mail/attachments/{attachmentId}/save-to-webhard
POST /api/v1/mail/attachments/save-bulk-to-webhard
POST /api/v1/mail/attachments/{attachmentId}/link-file
```

### Context-specific Drafts

```text
POST /api/v1/documents/{documentId}/submission-mail/draft
POST /api/v1/findings/action-request-mail/draft
POST /api/v1/projects/{projectId}/material-request-mail/draft
POST /api/v1/inspection-rounds/{inspectionRoundId}/schedule-coordination-mail/draft
POST /api/v1/contracts/{contractId}/send-mail/draft
POST /api/v1/estimates/{estimateId}/send-mail/draft
```

### Templates and Signatures

```text
GET    /api/v1/mail/templates
POST   /api/v1/mail/templates
GET    /api/v1/mail/templates/{templateId}
PATCH  /api/v1/mail/templates/{templateId}
DELETE /api/v1/mail/templates/{templateId}

GET   /api/v1/mail/signatures
POST  /api/v1/mail/signatures
PATCH /api/v1/mail/signatures/{signatureId}
```

## 4. Data Models

### MailAccount

```ts
type MailProvider = 'guest' | 'google' | 'manual_smtp' | 'mock'

type MailAccountStatus =
  | 'guest'
  | 'connected'
  | 'sync_error'
  | 'disconnected'

type MailAccount = {
  id: string
  provider: MailProvider
  email?: string
  displayName?: string
  status: MailAccountStatus
  oauthTokenRef?: string
  lastSyncedAt?: string
  defaultSignatureId?: string
  createdAt: string
  updatedAt: string
}
```

### MailThread

```ts
type MailThreadStatus = 'active' | 'archived' | 'muted'

type MailThread = {
  id: string
  accountId: string
  providerThreadId?: string
  projectId?: string
  subject: string
  participants: string[]
  lastMessageAt?: string
  status: MailThreadStatus
  linkedEntityRefs: MailEntityLink[]
  createdAt: string
  updatedAt: string
}
```

### MailMessage

```ts
type MailMessageDirection = 'inbound' | 'outbound'

type MailMessageStatus =
  | 'received'
  | 'draft'
  | 'queued'
  | 'sent'
  | 'failed'
  | 'archived'

type MailMessage = {
  id: string
  accountId: string
  threadId?: string
  providerMessageId?: string
  projectId?: string
  direction: MailMessageDirection
  status: MailMessageStatus
  from: MailAddress
  to: MailAddress[]
  cc: MailAddress[]
  bcc: MailAddress[]
  subject: string
  bodyText?: string
  bodyHtml?: string
  sentAt?: string
  receivedAt?: string
  attachments: MailAttachment[]
  linkedEntityRefs: MailEntityLink[]
  createdAt: string
  updatedAt: string
}

type MailAddress = {
  name?: string
  email: string
  contactId?: string
  organizationId?: string
}
```

### MailAttachment

```ts
type MailAttachment = {
  id: string
  messageId: string
  fileName: string
  contentType?: string
  size?: number
  providerAttachmentId?: string
  tempObjectKey?: string
  savedFileId?: string
  saveStatus: 'not_saved' | 'saving' | 'saved' | 'failed'
  recommendedFolderId?: string
  recommendedTags: string[]
}
```

### MailDraft

```ts
type MailPurpose =
  | 'report_submission'
  | 'action_request'
  | 'material_request'
  | 'schedule_coordination'
  | 'contract_estimate'
  | 'safety_cost_request'
  | 'approval_request'
  | 'general_reply'

type MailDraft = {
  id: string
  accountId?: string
  purpose: MailPurpose
  projectId?: string
  inspectionRoundId?: string
  ownerPartyId?: string
  documentId?: string
  findingIds: string[]
  submissionId?: string
  subject: string
  bodyText: string
  bodyHtml?: string
  to: MailAddress[]
  cc: MailAddress[]
  bcc: MailAddress[]
  attachmentFileIds: string[]
  generatedByAi: boolean
  validationWarnings: MailWarning[]
  status: 'draft' | 'validated' | 'sent' | 'cancelled'
  createdAt: string
  updatedAt: string
}
```

### MailEntityLink

```ts
type MailEntityType =
  | 'project'
  | 'inspection_round'
  | 'document_instance'
  | 'finding'
  | 'corrective_action'
  | 'safety_cost_usage'
  | 'contract'
  | 'estimate'
  | 'file_asset'
  | 'submission'

type MailLinkStatus = 'suggested' | 'confirmed' | 'rejected'

type MailEntityLink = {
  id: string
  mailThreadId?: string
  mailMessageId?: string
  entityType: MailEntityType
  entityId: string
  status: MailLinkStatus
  confidence?: number
  reason?: string
  createdAt: string
  confirmedAt?: string
}
```

### Submission

```ts
type Submission = {
  id: string
  projectId: string
  inspectionRoundId?: string
  ownerPartyId?: string
  documentId: string
  submittedFileIds: string[]
  mailMessageId?: string
  recipientEmails: string[]
  submittedAt?: string
  status: 'draft' | 'submitted' | 'confirmed' | 'rejected'
  createdAt: string
  updatedAt: string
}
```

## 5. Validation Rules

### MailDraft

- subject는 필수다.
- to는 최소 1명 이상이어야 한다.
- report_submission 목적이면 documentId와 attachmentFileIds가 필요하다.
- report_submission 목적이면 ownerPartyId 또는 발주처 수신자가 필요하다.
- action_request 목적이면 findingIds가 1개 이상 필요하다.
- material_request 목적이면 요청자료 목록이 필요하다.
- OAuth 미연결 상태에서는 실제 send 대신 copy/export draft만 가능하다.
- 첨부파일이 FileAsset으로 존재하지 않으면 발송 전 warning을 표시한다.

### MailAttachment

- save-to-webhard 시 projectId와 targetFolderId가 필요하다.
- 같은 폴더에 같은 파일명이 있으면 version 생성 또는 rename 정책을 적용한다.
- 저장 완료 후 savedFileId를 기록한다.

### Submission Mail

- 제출본 FileAsset이 있어야 한다.
- DocumentInstance.status가 exported 또는 confirmed 이상이어야 한다.
- 제출 후 DocumentInstance.status, OwnerReportTask.status, Submission.status를 동기화한다.

## 6. Service Rules

### Project Mail Classification

```text
1. subject/body에서 projectName, siteName, documentNo, roundNo 추출
2. sender/recipient 이메일을 Contact와 비교
3. attachment filename을 Webhard classification 규칙과 비교
4. 후보 Project, InspectionRound, DocumentInstance, Finding을 추천
5. confidence와 reason 반환
6. 사용자가 confirmed/rejected 처리
```

### Report Submission Mail Flow

```text
1. DocumentInstance 조회
2. exportedFileId 확인
3. OwnerParty/Contact 조회
4. 제출 메일 템플릿 선택
5. AI 초안 생성
6. 첨부파일 체크
7. 사용자 검토
8. send 또는 guest copy
9. MailMessage 저장
10. Submission 생성/갱신
11. DocumentInstance.status = submitted
12. OwnerReportTask.status = submitted
13. AuditLog 기록
```

### Action Request Mail Flow

```text
1. Finding 목록 선택
2. 책임 조직/담당자 확인
3. 지적사진 FileAsset 확인
4. 조치요청 메일 초안 생성
5. 사용자 검토
6. 발송
7. Finding.status = action_requested
8. MailThread 연결
9. AuditLog 기록
```

### Attachment Save Flow

```text
1. MailAttachment 선택
2. Project/Folder 선택
3. 중복 파일명 확인
4. FileAsset 생성
5. StorageObject 저장
6. MailAttachment.savedFileId 업데이트
7. MailMessage와 FileAsset link 생성
8. FileActivityLog 생성
```

## 7. Seed Mail Templates

### 보고서 제출

```text
제목: [{ownerName}] 제{roundNo}회 {projectName} 공사안전보건대장 이행점검 결과보고서 제출
본문 구성:
- 인사말
- 제출 문서 안내
- 점검일 및 회차
- 첨부파일 목록
- 검토 요청 문구
- 서명
```

### 조치요청

```text
제목: [{projectName}] 제{roundNo}회 점검 지적사항 조치 요청
본문 구성:
- 인사말
- 지적사항 표
- 조치기한
- 첨부사진 안내
- 회신 요청 문구
- 서명
```

### 자료요청

```text
제목: [{projectName}] 공사안전보건대장 이행점검 자료 요청
본문 구성:
- 요청 배경
- 요청자료 목록
- 제출기한
- 제출방법
- 서명
```

## 8. Tests

```text
test_mail_account_guest_create
test_mail_oauth_start_returns_auth_url
test_mail_sync_creates_threads_and_messages
test_mail_project_classification_by_subject
test_mail_project_classification_by_contact_email
test_mail_draft_create_report_submission
test_mail_draft_report_submission_requires_exported_file
test_mail_draft_action_request_requires_findings
test_mail_draft_validate_recipients
test_mail_send_connected_mode_success
test_mail_send_guest_mode_blocked_or_copy_only
test_mail_attachment_save_to_webhard
test_mail_attachment_duplicate_creates_file_version
test_report_submission_mail_creates_submission
test_report_submission_mail_updates_document_status
test_action_request_mail_updates_finding_status
test_mail_message_link_entity_confirmed
test_mail_template_variable_mapping
```
