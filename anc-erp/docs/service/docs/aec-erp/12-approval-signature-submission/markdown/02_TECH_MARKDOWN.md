# 02. Tech Markdown — 결재/서명/제출

## 1. Frontend Routes

```text
/approvals
/approvals/inbox
/approvals/requested
/approvals/[approvalWorkflowId]

/documents/[documentId]/approval
/documents/[documentId]/signing
/documents/[documentId]/submission
/documents/[documentId]/submission/new

/projects/[projectId]/submissions
/projects/[projectId]/submissions/new
/submissions/[submissionId]
/submissions/[submissionId]/edit
/submissions/[submissionId]/confirmation

/admin/approval-templates
/admin/approval-templates/[templateId]
/admin/signature-assets
/admin/signature-assets/[assetId]
```

## 2. Frontend Components

```text
ApprovalInboxPage
ApprovalWorkflowDetailPage
DocumentApprovalPage
DocumentSigningPage
DocumentSubmissionPage
SubmissionDetailPage
ApprovalTemplateAdminPage
SignatureAssetAdminPage

ApprovalWorkflowTable
ApprovalWorkflowCard
ApprovalStatusBadge
ApprovalStepper
ApprovalStepCard
ApprovalActionPanel
ApprovalCommentThread
ApprovalRequestModal
ApprovalRejectModal
ChangeRequestPanel
ApprovalHistoryTimeline

SignatureRequirementPanel
SignatureTaskTable
SignatureTaskCard
SignatureAssetPicker
SealAssetPicker
SignedFileUploader
SigningStatusBadge

SubmissionReadinessPanel
SubmissionPackageBuilder
SubmissionAttachmentTable
SubmissionRecipientTable
SubmissionChannelSelector
SubmissionMailDraftPanel
SubmissionChecklist
SubmissionHistoryTimeline
OwnerSubmissionMatrix
SubmissionStatusBadge
WebhardFinalFileCard
MailSubmissionLinkCard
```

## 3. Backend APIs

### Approval Workflows

```text
GET    /api/v1/approvals
GET    /api/v1/approvals/inbox
POST   /api/v1/approval-workflows
GET    /api/v1/approval-workflows/{workflowId}
PATCH  /api/v1/approval-workflows/{workflowId}
DELETE /api/v1/approval-workflows/{workflowId}

POST   /api/v1/documents/{documentId}/approval/request
GET    /api/v1/documents/{documentId}/approval
POST   /api/v1/approval-workflows/{workflowId}/cancel
POST   /api/v1/approval-workflows/{workflowId}/restart
```

### Approval Steps and Actions

```text
GET   /api/v1/approval-workflows/{workflowId}/steps
POST  /api/v1/approval-workflows/{workflowId}/steps
PATCH /api/v1/approval-steps/{stepId}

POST  /api/v1/approval-steps/{stepId}/approve
POST  /api/v1/approval-steps/{stepId}/reject
POST  /api/v1/approval-steps/{stepId}/request-changes
POST  /api/v1/approval-steps/{stepId}/delegate
POST  /api/v1/approval-steps/{stepId}/skip
```

### Signature / Seal

```text
GET    /api/v1/signature-assets
POST   /api/v1/signature-assets
GET    /api/v1/signature-assets/{assetId}
PATCH  /api/v1/signature-assets/{assetId}
DELETE /api/v1/signature-assets/{assetId}

GET    /api/v1/documents/{documentId}/signature-tasks
POST   /api/v1/documents/{documentId}/signature-tasks
PATCH  /api/v1/signature-tasks/{taskId}
POST   /api/v1/signature-tasks/{taskId}/complete
POST   /api/v1/signature-tasks/{taskId}/waive
POST   /api/v1/documents/{documentId}/signed-files/upload
```

### Submission Packages

```text
GET   /api/v1/documents/{documentId}/submission-readiness
POST  /api/v1/documents/{documentId}/submission-packages
GET   /api/v1/submission-packages/{packageId}
PATCH /api/v1/submission-packages/{packageId}
POST  /api/v1/submission-packages/{packageId}/validate
POST  /api/v1/submission-packages/{packageId}/finalize
```

### Submissions

```text
GET    /api/v1/projects/{projectId}/submissions
POST   /api/v1/projects/{projectId}/submissions
GET    /api/v1/submissions/{submissionId}
PATCH  /api/v1/submissions/{submissionId}
DELETE /api/v1/submissions/{submissionId}

POST   /api/v1/submissions/{submissionId}/send-mail
POST   /api/v1/submissions/{submissionId}/mark-manual-submitted
POST   /api/v1/submissions/{submissionId}/confirm-owner-receipt
POST   /api/v1/submissions/{submissionId}/request-revision
POST   /api/v1/submissions/{submissionId}/resubmit
POST   /api/v1/submissions/{submissionId}/archive
```

### Templates

```text
GET    /api/v1/approval-templates
POST   /api/v1/approval-templates
GET    /api/v1/approval-templates/{templateId}
PATCH  /api/v1/approval-templates/{templateId}
DELETE /api/v1/approval-templates/{templateId}
POST   /api/v1/approval-templates/{templateId}/publish
```

## 4. Data Models

### ApprovalWorkflow

```ts
type ApprovalWorkflowStatus =
  | 'draft'
  | 'requested'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'

type ApprovalWorkflow = {
  id: string
  projectId: string
  documentId?: string
  documentType?: string
  ownerPartyId?: string
  workflowType:
    | 'internal_review'
    | 'engineer_approval'
    | 'final_confirmation'
    | 'contract_review'
    | 'submission_approval'
  title: string
  status: ApprovalWorkflowStatus
  requestedBy: string
  requestedAt?: string
  dueDate?: string
  completedAt?: string
  currentStepId?: string
  createdAt: string
  updatedAt: string
}
```

### ApprovalStep

```ts
type ApprovalStepStatus =
  | 'pending'
  | 'active'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'skipped'
  | 'cancelled'

type ApprovalStep = {
  id: string
  workflowId: string
  stepNo: number
  stepName: string
  approverUserId?: string
  approverRole?: 'writer' | 'inspector' | 'engineer' | 'admin' | 'contract_manager'
  status: ApprovalStepStatus
  action?: 'approve' | 'reject' | 'request_changes' | 'delegate' | 'skip'
  comment?: string
  actedBy?: string
  actedAt?: string
  delegatedTo?: string
  required: boolean
  createdAt: string
  updatedAt: string
}
```

### ApprovalComment

```ts
type ApprovalComment = {
  id: string
  workflowId: string
  stepId?: string
  documentId?: string
  sectionKey?: string
  authorId: string
  comment: string
  commentType: 'general' | 'change_request' | 'rejection_reason' | 'approval_note'
  resolved: boolean
  createdAt: string
}
```

### SignatureAsset

```ts
type SignatureAssetType = 'signature' | 'seal' | 'stamp' | 'name_text'

type SignatureAsset = {
  id: string
  ownerUserId?: string
  organizationId?: string
  assetType: SignatureAssetType
  displayName: string
  fileId?: string
  textValue?: string
  active: boolean
  usageScope: 'document' | 'contract' | 'report' | 'all'
  createdAt: string
  updatedAt: string
}
```

### SignatureTask

```ts
type SignatureTaskStatus = 'not_required' | 'pending' | 'completed' | 'waived' | 'rejected'

type SignatureTask = {
  id: string
  projectId: string
  documentId: string
  ownerPartyId?: string
  taskType: 'signature' | 'seal' | 'signed_file_upload' | 'external_confirmation'
  requiredByRole?: 'engineer' | 'representative' | 'owner' | 'contractor' | 'admin'
  requiredByName?: string
  status: SignatureTaskStatus
  signatureAssetId?: string
  signedFileId?: string
  completedBy?: string
  completedAt?: string
  waivedReason?: string
  createdAt: string
  updatedAt: string
}
```

### FinalDocumentPackage

```ts
type FinalDocumentPackageStatus = 'draft' | 'validated' | 'finalized' | 'submitted' | 'archived'

type FinalDocumentPackage = {
  id: string
  projectId: string
  documentId: string
  ownerPartyId?: string
  packageTitle: string
  status: FinalDocumentPackageStatus
  mainFileId: string
  signedFileId?: string
  attachmentFileIds: string[]
  webhardFolderId?: string
  validationWarnings: SubmissionValidationWarning[]
  finalizedAt?: string
  createdAt: string
  updatedAt: string
}
```

### Submission

```ts
type SubmissionChannel = 'mail' | 'manual' | 'webhard_share' | 'external_portal' | 'in_person'

type SubmissionStatus =
  | 'draft'
  | 'ready'
  | 'sent'
  | 'submitted'
  | 'confirmed'
  | 'revision_requested'
  | 'resubmitted'
  | 'archived'
  | 'cancelled'

type Submission = {
  id: string
  projectId: string
  documentId?: string
  packageId?: string
  ownerPartyId?: string
  inspectionRoundId?: string
  channel: SubmissionChannel
  status: SubmissionStatus
  title: string
  recipientOrganizationIds: string[]
  recipientContactIds: string[]
  submittedBy?: string
  submittedAt?: string
  mailThreadId?: string
  mailMessageId?: string
  shareLinkId?: string
  externalReference?: string
  confirmationReceivedAt?: string
  confirmationContactId?: string
  confirmationMemo?: string
  revisionRequestedAt?: string
  revisionReason?: string
  createdAt: string
  updatedAt: string
}
```

### SubmissionAttachment

```ts
type SubmissionAttachment = {
  id: string
  submissionId: string
  fileId: string
  attachmentType: 'main_document' | 'signed_document' | 'evidence' | 'photo_ledger' | 'safety_cost' | 'schedule' | 'other'
  fileName: string
  required: boolean
  included: boolean
  createdAt: string
}
```

### SubmissionValidationWarning

```ts
type SubmissionValidationWarning = {
  type:
    | 'approval_missing'
    | 'signature_missing'
    | 'final_file_missing'
    | 'recipient_missing'
    | 'attachment_missing'
    | 'stale_document'
    | 'owner_mismatch'
    | 'mail_body_missing'
    | 'webhard_file_missing'
  severity: 'info' | 'warning' | 'danger'
  message: string
  relatedEntityType?: string
  relatedEntityId?: string
}
```

## 5. Validation Rules

### ApprovalWorkflow

- projectId는 필수다.
- documentId가 있는 결재는 해당 문서가 projectId에 속해야 한다.
- required step이 모두 approved되어야 workflow가 approved 또는 completed가 될 수 있다.
- rejected 또는 changes_requested 상태에서는 제출 패키지 finalize를 막는다.

### SignatureTask

- documentId는 필수다.
- required task가 pending이면 submission_ready 상태로 넘어갈 수 없다.
- signed_file_upload 방식은 signedFileId가 필요하다.
- waived 상태는 waivedReason이 필요하다.

### FinalDocumentPackage

- mainFileId는 필수다.
- signedFileId가 필요한 문서 유형은 signedFileId가 없으면 danger warning이다.
- attachmentFileIds의 FileAsset은 존재해야 한다.
- ownerPartyId가 있으면 package의 문서와 파일도 동일 ownerPartyId 기준이어야 한다.

### Submission

- projectId는 필수다.
- channel은 필수다.
- ownerPartyId가 있는 경우 해당 ProjectParty는 owner여야 한다.
- mail 제출은 mailThreadId 또는 send-mail 결과가 필요하다.
- manual 제출은 submittedAt과 externalReference 또는 confirmationMemo를 권장한다.
- submitted 상태는 main document attachment가 필요하다.

## 6. Service Rules

### 결재 요청 생성

```text
1. DocumentInstance 조회
2. Project/ownerPartyId 확인
3. ApprovalTemplate 선택
4. ApprovalWorkflow 생성
5. ApprovalStep 생성
6. 첫 step active 처리
7. Document status = review_requested 또는 in_review
8. AuditLog 생성
```

### 결재 액션 처리

```text
1. step 권한 확인
2. action 저장
3. comment 저장
4. 다음 step active 처리
5. 모든 required step approved이면 workflow approved
6. workflow approved이면 document status를 approved 또는 confirmed로 갱신
7. 반려/수정요청이면 document status = changes_requested
8. AuditLog 생성
```

### 서명/날인 완료

```text
1. SignatureTask 조회
2. 필요한 signatureAsset 또는 signedFile 확인
3. status = completed
4. document 서명 상태 갱신
5. signedFileId가 있으면 FileAsset tag = signed
6. AuditLog 생성
```

### 제출 패키지 구성

```text
1. DocumentInstance 조회
2. 최신 export 파일 확인
3. signedFile 필요 여부 확인
4. 첨부파일 후보 수집
5. Webhard 최종본 폴더 확인
6. FinalDocumentPackage 생성
7. validate 실행
8. validationWarnings 저장
```

### 메일 제출

```text
1. SubmissionPackage validate
2. recipient contacts 확인
3. MailDraft 생성
4. 첨부파일 연결
5. MailMessage 발송 또는 guest draft 생성
6. Submission 생성/갱신
7. DocumentInstance.status = submitted
8. OwnerReportTask.status = submitted
9. FileAsset tag = submitted
10. AuditLog 생성
```

### 수동 제출

```text
1. 제출 채널 manual/external_portal/in_person 선택
2. 제출일, 제출자, 외부 참조 입력
3. 제출 증빙파일 optional 연결
4. Submission.status = submitted
5. 관련 문서/업무 상태 갱신
6. AuditLog 생성
```

## 7. Report / Document Status Mapping

| Source Status | Target |
|---|---|
| ApprovalWorkflow.approved | DocumentInstance.status = confirmed 가능 |
| SignatureTask.completed | DocumentInstance.signingStatus = signed 가능 |
| FinalDocumentPackage.finalized | Submission.status = ready 가능 |
| Submission.submitted | DocumentInstance.status = submitted |
| Submission.confirmed | OwnerReportTask.status = confirmed |
| Submission.revision_requested | DocumentInstance.status = changes_requested |

## 8. Tests

```text
test_approval_workflow_create_success
test_approval_workflow_requires_document_project_match
test_approval_step_approve_moves_next_step
test_approval_step_reject_blocks_submission
test_approval_request_changes_updates_document_status
test_approval_workflow_completed_when_required_steps_approved
test_signature_task_create_success
test_signature_task_complete_requires_signed_file_when_upload_type
test_signature_task_waive_requires_reason
test_submission_readiness_detects_missing_approval
test_submission_readiness_detects_missing_signature
test_submission_package_create_success
test_submission_package_validate_requires_main_file
test_submission_mail_send_creates_mail_message
test_submission_mail_send_updates_document_status
test_submission_manual_submit_success
test_submission_owner_party_must_be_owner
test_submission_confirm_owner_receipt
test_submission_revision_request_updates_status
test_submission_archives_final_package
test_submission_creates_audit_log
```
