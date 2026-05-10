# 07. Reverse Map — 결재/서명/제출

## 1. Feature

```yaml
featureId: approval.signature.submission
featureName: 결재/서명/제출
priority: P1
module: approval-signature-submission
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 결재 목록 | `/approvals` | 전체 결재 목록 |
| 내 결재함 | `/approvals/inbox` | 나에게 배정된 결재 |
| 내가 요청한 결재 | `/approvals/requested` | 요청자가 생성한 결재 |
| 결재 상세 | `/approvals/[approvalWorkflowId]` | 결재 단계/의견/액션 |
| 문서 결재 | `/documents/[documentId]/approval` | 특정 문서 결재 상태 |
| 문서 서명/날인 | `/documents/[documentId]/signing` | 서명/날인 필요 항목 관리 |
| 문서 제출 | `/documents/[documentId]/submission` | 제출 준비도, 패키지, 메일 |
| 제출 생성 | `/documents/[documentId]/submission/new` | 신규 제출 이력 생성 |
| 프로젝트 제출 이력 | `/projects/[projectId]/submissions` | 프로젝트 전체 제출 이력 |
| 제출 상세 | `/submissions/[submissionId]` | 제출 파일/메일/확인 이력 |
| 발주처 확인 | `/submissions/[submissionId]/confirmation` | 확인/보완요청/재제출 |
| 결재 템플릿 | `/admin/approval-templates` | 문서 유형별 결재선 관리 |
| 서명 자산 | `/admin/signature-assets` | 서명/직인/날인 자산 관리 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/approvals/inbox` | ApprovalWorkflowTable, ApprovalStatusBadge, ApprovalFilterBar |
| `/approvals/[approvalWorkflowId]` | ApprovalStepper, ApprovalStepCard, ApprovalActionPanel, ApprovalCommentThread |
| `/documents/[documentId]/approval` | ApprovalWorkflowCard, DocumentVersionCard, ChangeRequestPanel |
| `/documents/[documentId]/signing` | SignatureRequirementPanel, SignatureTaskTable, SignedFileUploader |
| `/documents/[documentId]/submission` | SubmissionReadinessPanel, SubmissionPackageBuilder, SubmissionMailDraftPanel |
| `/projects/[projectId]/submissions` | SubmissionHistoryTable, OwnerSubmissionMatrix, SubmissionStatusBadge |
| `/submissions/[submissionId]` | SubmissionDetailCard, WebhardFinalFileCard, MailSubmissionLinkCard |
| `/admin/approval-templates` | ApprovalTemplateTable, ApprovalTemplateEditor |
| `/admin/signature-assets` | SignatureAssetTable, SignatureAssetPicker, SealAssetPicker |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| ApprovalWorkflowTable | GET `/api/v1/approvals`, GET `/api/v1/approvals/inbox` |
| ApprovalRequestModal | POST `/api/v1/documents/{documentId}/approval/request` |
| ApprovalStepper | GET `/api/v1/approval-workflows/{workflowId}/steps` |
| ApprovalActionPanel | POST `/api/v1/approval-steps/{stepId}/approve`, `/reject`, `/request-changes` |
| ApprovalCommentThread | GET `/api/v1/approval-workflows/{workflowId}` |
| SignatureRequirementPanel | GET `/api/v1/documents/{documentId}/signature-tasks` |
| SignedFileUploader | POST `/api/v1/documents/{documentId}/signed-files/upload` |
| SignatureTaskCard | POST `/api/v1/signature-tasks/{taskId}/complete` |
| SubmissionReadinessPanel | GET `/api/v1/documents/{documentId}/submission-readiness` |
| SubmissionPackageBuilder | POST `/api/v1/documents/{documentId}/submission-packages` |
| SubmissionChecklist | POST `/api/v1/submission-packages/{packageId}/validate` |
| SubmissionMailDraftPanel | POST `/api/v1/submissions/{submissionId}/send-mail` |
| SubmissionHistoryTimeline | GET `/api/v1/submissions/{submissionId}` |
| OwnerSubmissionMatrix | GET `/api/v1/projects/{projectId}/submissions` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| POST `/approval-workflows` | ApprovalWorkflow, ApprovalStep |
| POST `/documents/{documentId}/approval/request` | DocumentInstance, ApprovalWorkflow, ApprovalTemplate |
| POST `/approval-steps/{stepId}/approve` | ApprovalStep, ApprovalWorkflow, ApprovalComment, AuditLog |
| POST `/approval-steps/{stepId}/request-changes` | ApprovalStep, ApprovalComment, DocumentInstance |
| POST `/signature-tasks/{taskId}/complete` | SignatureTask, SignatureAsset, FileAsset |
| POST `/documents/{documentId}/signed-files/upload` | SignatureTask, FileAsset, DocumentInstance |
| GET `/documents/{documentId}/submission-readiness` | DocumentInstance, ApprovalWorkflow, SignatureTask, FinalDocumentPackage |
| POST `/submission-packages/{packageId}/validate` | FinalDocumentPackage, SubmissionValidationWarning |
| POST `/submissions/{submissionId}/send-mail` | Submission, MailMessage, MailThread, SubmissionAttachment |
| POST `/submissions/{submissionId}/mark-manual-submitted` | Submission, FileAsset, AuditLog |
| POST `/submissions/{submissionId}/confirm-owner-receipt` | Submission, ProjectParty, Contact |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| ApprovalWorkflow | approval-submission-readiness |
| ApprovalStep | approval-submission-readiness |
| SignatureTask | approval-submission-readiness |
| FinalDocumentPackage | approval-submission-readiness |
| Submission | approval-submission-readiness |
| SubmissionAttachment | approval-submission-readiness |
| MailDraft | approval-submission-readiness |
| DocumentInstance | approval-submission-readiness |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 결재 생성 | test_approval_workflow_create_success |
| 문서-프로젝트 검증 | test_approval_workflow_requires_document_project_match |
| 단계 승인 | test_approval_step_approve_moves_next_step |
| 반려 차단 | test_approval_step_reject_blocks_submission |
| 수정요청 | test_approval_request_changes_updates_document_status |
| 결재 완료 | test_approval_workflow_completed_when_required_steps_approved |
| 서명 태스크 | test_signature_task_create_success |
| 서명본 필수 | test_signature_task_complete_requires_signed_file_when_upload_type |
| waive 사유 | test_signature_task_waive_requires_reason |
| 제출 준비 결재 누락 | test_submission_readiness_detects_missing_approval |
| 제출 준비 서명 누락 | test_submission_readiness_detects_missing_signature |
| 제출 패키지 | test_submission_package_create_success |
| 메인 파일 검증 | test_submission_package_validate_requires_main_file |
| 메일 제출 | test_submission_mail_send_creates_mail_message |
| 문서 상태 갱신 | test_submission_mail_send_updates_document_status |
| 수동 제출 | test_submission_manual_submit_success |
| 발주처 검증 | test_submission_owner_party_must_be_owner |
| 발주처 확인 | test_submission_confirm_owner_receipt |
| 보완 요청 | test_submission_revision_request_updates_status |
| 보관 | test_submission_archives_final_package |
| 감사로그 | test_submission_creates_audit_log |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ownerPartyId, recipient contacts |
| 계약/견적 | 계약서 검토, 날인본, 견적 발송 이력 |
| 점검회차/일정 | ownerReportTask, 회차별 제출 상태 |
| 이행확인 보고서 | DocumentInstance 승인, export, 제출 |
| 안전관리계획서 | 계획서 검토/확정/제출 |
| 안전보건대장 | 대장 확정/보관/제출 |
| 사진대지 | 보고서 첨부, 별도 제출 |
| 웹하드 | 최종본/날인본/제출본 FileAsset |
| 메일함 | 제출 메일, 회신, MailThread |
| 관리자 | 결재 템플릿, 서명 자산, 권한 |
| 대시보드 | 결재 대기, 제출 예정, 반려/보완요청 |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 초안과 최종본 혼동 | DocumentInstance.status와 FileAsset tag 분리 |
| 결재 미완료 문서 제출 | SubmissionReadiness blocked 처리 |
| 서명/날인 누락 | SignatureTask required 검증 |
| 발주처별 제출 파일 혼동 | ownerPartyId + documentId + finalFileId 검증 |
| 메일 발송 후 제출 이력 누락 | send-mail API에서 Submission과 MailThread 동시 갱신 |
| 수동 제출 증빙 부족 | submittedAt, externalReference, confirmationMemo 권장 |
| 보완 요청 후 기존 제출본 혼동 | resubmission version과 revision_requested 상태 관리 |
| 법적 전자서명 오해 | UI와 문구에서 업무상 서명/날인 확인으로 표시 |
