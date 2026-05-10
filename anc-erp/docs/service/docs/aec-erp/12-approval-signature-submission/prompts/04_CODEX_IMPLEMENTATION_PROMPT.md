# 04. Codex Implementation Prompt — 결재/서명/제출

## Prompt

```text
You are implementing the Approval, Signature, and Submission module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module manages document approval workflows, approval steps, comments, signatures/seals, signed file uploads, final document packages, submission readiness, mail/manual submissions, owner confirmations, revision requests, and archive status.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Approval, Signature, and Submission module.

Existing concepts:
- Project
- ProjectParty
- Contact
- DocumentInstance
- DocumentVersion
- FileAsset
- Folder
- ShareLink
- MailThread
- MailMessage
- MailDraft
- InspectionRound
- InspectionOwnerReportTask
- Contract
- SafetyManagementPlan
- SafetyHealthLedger
- AuditLog

Required backend models:
- ApprovalWorkflow
- ApprovalStep
- ApprovalComment
- ApprovalTemplate
- ApprovalTemplateStep
- SignatureAsset
- SignatureTask
- FinalDocumentPackage
- Submission
- SubmissionAttachment
- SubmissionRecipient
- SubmissionValidationWarning
- SubmissionStatusEvent

Required backend APIs:

Approval Workflows:
- GET /api/v1/approvals
- GET /api/v1/approvals/inbox
- POST /api/v1/approval-workflows
- GET /api/v1/approval-workflows/{workflowId}
- PATCH /api/v1/approval-workflows/{workflowId}
- DELETE /api/v1/approval-workflows/{workflowId}
- POST /api/v1/documents/{documentId}/approval/request
- GET /api/v1/documents/{documentId}/approval
- POST /api/v1/approval-workflows/{workflowId}/cancel
- POST /api/v1/approval-workflows/{workflowId}/restart

Approval Steps:
- GET /api/v1/approval-workflows/{workflowId}/steps
- POST /api/v1/approval-workflows/{workflowId}/steps
- PATCH /api/v1/approval-steps/{stepId}
- POST /api/v1/approval-steps/{stepId}/approve
- POST /api/v1/approval-steps/{stepId}/reject
- POST /api/v1/approval-steps/{stepId}/request-changes
- POST /api/v1/approval-steps/{stepId}/delegate
- POST /api/v1/approval-steps/{stepId}/skip

Signature:
- GET /api/v1/signature-assets
- POST /api/v1/signature-assets
- GET /api/v1/signature-assets/{assetId}
- PATCH /api/v1/signature-assets/{assetId}
- DELETE /api/v1/signature-assets/{assetId}
- GET /api/v1/documents/{documentId}/signature-tasks
- POST /api/v1/documents/{documentId}/signature-tasks
- PATCH /api/v1/signature-tasks/{taskId}
- POST /api/v1/signature-tasks/{taskId}/complete
- POST /api/v1/signature-tasks/{taskId}/waive
- POST /api/v1/documents/{documentId}/signed-files/upload

Submission Packages:
- GET /api/v1/documents/{documentId}/submission-readiness
- POST /api/v1/documents/{documentId}/submission-packages
- GET /api/v1/submission-packages/{packageId}
- PATCH /api/v1/submission-packages/{packageId}
- POST /api/v1/submission-packages/{packageId}/validate
- POST /api/v1/submission-packages/{packageId}/finalize

Submissions:
- GET /api/v1/projects/{projectId}/submissions
- POST /api/v1/projects/{projectId}/submissions
- GET /api/v1/submissions/{submissionId}
- PATCH /api/v1/submissions/{submissionId}
- DELETE /api/v1/submissions/{submissionId}
- POST /api/v1/submissions/{submissionId}/send-mail
- POST /api/v1/submissions/{submissionId}/mark-manual-submitted
- POST /api/v1/submissions/{submissionId}/confirm-owner-receipt
- POST /api/v1/submissions/{submissionId}/request-revision
- POST /api/v1/submissions/{submissionId}/resubmit
- POST /api/v1/submissions/{submissionId}/archive

Templates:
- GET /api/v1/approval-templates
- POST /api/v1/approval-templates
- GET /api/v1/approval-templates/{templateId}
- PATCH /api/v1/approval-templates/{templateId}
- DELETE /api/v1/approval-templates/{templateId}
- POST /api/v1/approval-templates/{templateId}/publish

Required frontend routes:
- /approvals
- /approvals/inbox
- /approvals/requested
- /approvals/[approvalWorkflowId]
- /documents/[documentId]/approval
- /documents/[documentId]/signing
- /documents/[documentId]/submission
- /documents/[documentId]/submission/new
- /projects/[projectId]/submissions
- /projects/[projectId]/submissions/new
- /submissions/[submissionId]
- /submissions/[submissionId]/edit
- /submissions/[submissionId]/confirmation
- /admin/approval-templates
- /admin/approval-templates/[templateId]
- /admin/signature-assets
- /admin/signature-assets/[assetId]

Required frontend components:
- ApprovalWorkflowTable
- ApprovalWorkflowCard
- ApprovalStatusBadge
- ApprovalStepper
- ApprovalStepCard
- ApprovalActionPanel
- ApprovalCommentThread
- ApprovalRequestModal
- ApprovalRejectModal
- ChangeRequestPanel
- ApprovalHistoryTimeline
- SignatureRequirementPanel
- SignatureTaskTable
- SignatureTaskCard
- SignatureAssetPicker
- SealAssetPicker
- SignedFileUploader
- SigningStatusBadge
- SubmissionReadinessPanel
- SubmissionPackageBuilder
- SubmissionAttachmentTable
- SubmissionRecipientTable
- SubmissionChannelSelector
- SubmissionMailDraftPanel
- SubmissionChecklist
- SubmissionHistoryTimeline
- OwnerSubmissionMatrix
- SubmissionStatusBadge
- WebhardFinalFileCard
- MailSubmissionLinkCard

Business requirements:
1. ApprovalWorkflow must belong to a Project.
2. Document approval workflows must reference DocumentInstance.
3. Required approval steps must be approved before workflow can complete.
4. Reject or request_changes must block submission readiness.
5. SignatureTask can be required by document type or approval result.
6. signed_file_upload SignatureTask requires signedFileId.
7. FinalDocumentPackage must include mainFileId.
8. Submission readiness must check approval, signature, main file, recipients, attachments, stale document warnings, and ownerParty mismatch.
9. Owner-specific documents must submit with matching ownerPartyId.
10. Mail submission must create or link MailMessage/MailThread.
11. Manual submission must record submittedAt and external reference or memo.
12. Submission success updates DocumentInstance.status and linked OwnerReportTask when present.
13. Revision request updates Submission and DocumentInstance status.
14. Archive status locks final package unless admin reopens.
15. All state transitions create AuditLog.

Validation:
1. projectId is required.
2. documentId must belong to projectId.
3. ownerPartyId must be an owner ProjectParty when present.
4. approving user must match step approver or role.
5. required ApprovalStep cannot be skipped without permission.
6. signature waive requires waivedReason.
7. FinalDocumentPackage mainFileId must exist as FileAsset.
8. send-mail requires recipients and attachment list.
9. mark-manual-submitted requires submittedAt.
10. confirmed owner receipt requires confirmation memo or confirmation contact.

Seed data:
Create a default approval template for safety health ledger inspection report:
- Step 1: 문서 작성자 작성 완료
- Step 2: 점검 담당자 검토
- Step 3: 건설안전기술사 최종 확인
- Step 4: 제출 담당자 제출 처리

Create default submission package types:
- safety_report_owner_submission
- safety_management_plan_submission
- safety_health_ledger_submission
- contract_signed_submission

Tests:
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

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Approval workflow service
- Signature task service
- Submission readiness service
- Submission package service
- Mail submission adapter integration
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```
