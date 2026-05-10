from copy import deepcopy

from server.app.domain.models import (
    ApprovalComment,
    ApprovalStep,
    ApprovalTemplate,
    ApprovalTemplateStep,
    ApprovalWorkflow,
    AuditLog,
    FinalDocumentPackage,
    SignatureAsset,
    SignatureTask,
    Submission,
    SubmissionAttachment,
    SubmissionRecipient,
    SubmissionStatusEvent,
)
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.mail_repository import MailRepository
from server.app.repositories.project_repository import ProjectRepository
from server.app.repositories.safety_report_repository import SafetyReportRepository


class ApprovalRepository:
    def __init__(
        self,
        project_repository: ProjectRepository,
        inspection_repository: InspectionRepository,
        safety_report_repository: SafetyReportRepository,
        mail_repository: MailRepository,
    ) -> None:
        self.project_repository = project_repository
        self.inspection_repository = inspection_repository
        self.safety_report_repository = safety_report_repository
        self.mail_repository = mail_repository
        self.workflows: dict[str, ApprovalWorkflow] = {}
        self.steps: dict[str, list[ApprovalStep]] = {}
        self.comments: dict[str, list[ApprovalComment]] = {}
        self.templates: dict[str, ApprovalTemplate] = {}
        self.template_steps: dict[str, list[ApprovalTemplateStep]] = {}
        self.signature_assets: dict[str, SignatureAsset] = {}
        self.signature_tasks: dict[str, list[SignatureTask]] = {}
        self.packages: dict[str, FinalDocumentPackage] = {}
        self.submissions: dict[str, Submission] = {}
        self.submission_attachments: dict[str, list[SubmissionAttachment]] = {}
        self.submission_recipients: dict[str, list[SubmissionRecipient]] = {}
        self.submission_events: dict[str, list[SubmissionStatusEvent]] = {}
        self.audit_logs: dict[str, list[AuditLog]] = {}
        self._seed()

    def _seed(self) -> None:
        document = self.safety_report_repository.get_document("doc-sample-001")
        if not document:
            return
        now = "2026-05-10T11:30:00+09:00"
        template = ApprovalTemplate(
            id="approval-template-safety-report-001",
            name="보고서 결재 기본선",
            documentType=document.documentType,
            status="published",
            createdAt=now,
            updatedAt=now,
        )
        self.save_template(template)
        self.template_steps[template.id] = [
            ApprovalTemplateStep(
                id="approval-template-step-001",
                templateId=template.id,
                stepOrder=1,
                role="internal_review",
                required=True,
                defaultAssigneeLabel="기술지도팀",
            ),
            ApprovalTemplateStep(
                id="approval-template-step-002",
                templateId=template.id,
                stepOrder=2,
                role="chief_engineer_review",
                required=True,
                defaultAssigneeLabel="책임기술사",
            ),
            ApprovalTemplateStep(
                id="approval-template-step-003",
                templateId=template.id,
                stepOrder=3,
                role="submission_gate",
                required=False,
                defaultAssigneeLabel="PM",
            ),
        ]
        workflow = ApprovalWorkflow(
            id="approval-workflow-sample-001",
            documentId=document.id,
            projectId=document.projectId,
            inspectionRoundId=document.inspectionRoundId,
            ownerPartyId=document.ownerPartyId,
            title=f"{document.title} 결재",
            status="requested",
            templateId=template.id,
            currentStepOrder=1,
            requestedBy="user-engineer-001",
            requestedAt=now,
            createdAt=now,
            updatedAt=now,
        )
        self.save_workflow(workflow)
        self.steps[workflow.id] = [
            ApprovalStep(
                id="approval-step-sample-001",
                workflowId=workflow.id,
                stepOrder=1,
                role="internal_review",
                assigneeLabel="기술지도팀",
                status="current",
                required=True,
                createdAt=now,
                updatedAt=now,
            ),
            ApprovalStep(
                id="approval-step-sample-002",
                workflowId=workflow.id,
                stepOrder=2,
                role="chief_engineer_review",
                assigneeLabel="책임기술사",
                status="pending",
                required=True,
                createdAt=now,
                updatedAt=now,
            ),
            ApprovalStep(
                id="approval-step-sample-003",
                workflowId=workflow.id,
                stepOrder=3,
                role="submission_gate",
                assigneeLabel="PM",
                status="pending",
                required=False,
                createdAt=now,
                updatedAt=now,
            ),
        ]
        self.comments[workflow.id] = [
            ApprovalComment(
                id="approval-comment-sample-001",
                workflowId=workflow.id,
                stepId="approval-step-sample-001",
                authorUserId="user-engineer-001",
                body="문서 초안 확인 후 결재 요청 대기 중입니다.",
                createdAt=now,
            )
        ]
        self.save_signature_asset(
            SignatureAsset(
                id="signature-asset-sample-001",
                label="A&C 직인",
                assetType="seal",
                fileId="file-signature-asset-001",
                status="active",
                createdAt=now,
                updatedAt=now,
            )
        )
        self.save_signature_asset(
            SignatureAsset(
                id="signature-asset-sample-002",
                label="책임기술사 서명",
                assetType="signature",
                fileId="file-signature-asset-002",
                status="active",
                createdAt=now,
                updatedAt=now,
            )
        )
        self.signature_tasks[document.id] = [
            SignatureTask(
                id="signature-task-sample-001",
                documentId=document.id,
                projectId=document.projectId,
                ownerPartyId=document.ownerPartyId,
                taskType="seal_review",
                title="날인 여부 검토",
                status="pending",
                required=False,
                signatureAssetId="signature-asset-sample-001",
                createdAt=now,
                updatedAt=now,
            ),
            SignatureTask(
                id="signature-task-sample-002",
                documentId=document.id,
                projectId=document.projectId,
                ownerPartyId=document.ownerPartyId,
                taskType="signed_file_upload",
                title="서명/날인 반영본 업로드",
                status="pending",
                required=True,
                signatureAssetId="signature-asset-sample-002",
                createdAt=now,
                updatedAt=now,
            ),
        ]

    def get_document(self, document_id: str):
        return self.safety_report_repository.get_document(document_id)

    def save_workflow(self, workflow: ApprovalWorkflow) -> ApprovalWorkflow:
        self.workflows[workflow.id] = deepcopy(workflow)
        return deepcopy(workflow)

    def list_workflows(self, project_id: str | None = None) -> list[ApprovalWorkflow]:
        rows = [deepcopy(item) for item in self.workflows.values()]
        if project_id:
            rows = [item for item in rows if item.projectId == project_id]
        return sorted(rows, key=lambda item: item.updatedAt, reverse=True)

    def get_workflow(self, workflow_id: str) -> ApprovalWorkflow | None:
        item = self.workflows.get(workflow_id)
        return deepcopy(item) if item else None

    def get_workflow_by_document(self, document_id: str) -> ApprovalWorkflow | None:
        for item in self.workflows.values():
            if item.documentId == document_id and item.status != "cancelled":
                return deepcopy(item)
        return None

    def delete_workflow(self, workflow_id: str) -> None:
        workflow = self.workflows.pop(workflow_id, None)
        if not workflow:
            return
        self.steps.pop(workflow_id, None)
        self.comments.pop(workflow_id, None)

    def list_steps(self, workflow_id: str) -> list[ApprovalStep]:
        return deepcopy(self.steps.get(workflow_id, []))

    def save_steps(self, workflow_id: str, steps: list[ApprovalStep]) -> list[ApprovalStep]:
        self.steps[workflow_id] = deepcopy(steps)
        return deepcopy(steps)

    def get_step(self, step_id: str) -> ApprovalStep | None:
        for rows in self.steps.values():
            for item in rows:
                if item.id == step_id:
                    return deepcopy(item)
        return None

    def list_comments(self, workflow_id: str) -> list[ApprovalComment]:
        return deepcopy(self.comments.get(workflow_id, []))

    def save_comment(self, comment: ApprovalComment) -> ApprovalComment:
        self.comments.setdefault(comment.workflowId, []).append(deepcopy(comment))
        return deepcopy(comment)

    def list_templates(self) -> list[ApprovalTemplate]:
        return sorted([deepcopy(item) for item in self.templates.values()], key=lambda item: item.name)

    def get_template(self, template_id: str) -> ApprovalTemplate | None:
        item = self.templates.get(template_id)
        return deepcopy(item) if item else None

    def save_template(self, template: ApprovalTemplate) -> ApprovalTemplate:
        self.templates[template.id] = deepcopy(template)
        return deepcopy(template)

    def delete_template(self, template_id: str) -> None:
        self.templates.pop(template_id, None)
        self.template_steps.pop(template_id, None)

    def list_template_steps(self, template_id: str) -> list[ApprovalTemplateStep]:
        return deepcopy(self.template_steps.get(template_id, []))

    def save_template_steps(self, template_id: str, steps: list[ApprovalTemplateStep]) -> list[ApprovalTemplateStep]:
        self.template_steps[template_id] = deepcopy(steps)
        return deepcopy(steps)

    def list_signature_assets(self) -> list[SignatureAsset]:
        return sorted([deepcopy(item) for item in self.signature_assets.values()], key=lambda item: item.label)

    def get_signature_asset(self, asset_id: str) -> SignatureAsset | None:
        item = self.signature_assets.get(asset_id)
        return deepcopy(item) if item else None

    def save_signature_asset(self, asset: SignatureAsset) -> SignatureAsset:
        self.signature_assets[asset.id] = deepcopy(asset)
        return deepcopy(asset)

    def delete_signature_asset(self, asset_id: str) -> None:
        self.signature_assets.pop(asset_id, None)

    def list_signature_tasks(self, document_id: str) -> list[SignatureTask]:
        return deepcopy(self.signature_tasks.get(document_id, []))

    def save_signature_tasks(self, document_id: str, tasks: list[SignatureTask]) -> list[SignatureTask]:
        self.signature_tasks[document_id] = deepcopy(tasks)
        return deepcopy(tasks)

    def get_signature_task(self, task_id: str) -> SignatureTask | None:
        for rows in self.signature_tasks.values():
            for item in rows:
                if item.id == task_id:
                    return deepcopy(item)
        return None

    def save_package(self, package: FinalDocumentPackage) -> FinalDocumentPackage:
        self.packages[package.id] = deepcopy(package)
        return deepcopy(package)

    def get_package(self, package_id: str) -> FinalDocumentPackage | None:
        item = self.packages.get(package_id)
        return deepcopy(item) if item else None

    def get_package_by_document(self, document_id: str) -> FinalDocumentPackage | None:
        for item in self.packages.values():
            if item.documentId == document_id and item.status != "archived":
                return deepcopy(item)
        return None

    def save_submission(self, submission: Submission) -> Submission:
        self.submissions[submission.id] = deepcopy(submission)
        self.safety_report_repository.save_submission(submission)
        return deepcopy(submission)

    def get_submission(self, submission_id: str) -> Submission | None:
        item = self.submissions.get(submission_id)
        return deepcopy(item) if item else None

    def list_submissions(self, project_id: str | None = None) -> list[Submission]:
        rows = [deepcopy(item) for item in self.submissions.values()]
        if project_id:
            rows = [item for item in rows if item.projectId == project_id]
        return sorted(rows, key=lambda item: item.updatedAt or item.createdAt, reverse=True)

    def delete_submission(self, submission_id: str) -> None:
        self.submissions.pop(submission_id, None)
        self.submission_attachments.pop(submission_id, None)
        self.submission_recipients.pop(submission_id, None)
        self.submission_events.pop(submission_id, None)

    def save_submission_attachments(
        self,
        submission_id: str,
        attachments: list[SubmissionAttachment],
    ) -> list[SubmissionAttachment]:
        self.submission_attachments[submission_id] = deepcopy(attachments)
        return deepcopy(attachments)

    def list_submission_attachments(self, submission_id: str) -> list[SubmissionAttachment]:
        return deepcopy(self.submission_attachments.get(submission_id, []))

    def save_submission_recipients(
        self,
        submission_id: str,
        recipients: list[SubmissionRecipient],
    ) -> list[SubmissionRecipient]:
        self.submission_recipients[submission_id] = deepcopy(recipients)
        return deepcopy(recipients)

    def list_submission_recipients(self, submission_id: str) -> list[SubmissionRecipient]:
        return deepcopy(self.submission_recipients.get(submission_id, []))

    def add_submission_event(self, event: SubmissionStatusEvent) -> SubmissionStatusEvent:
        self.submission_events.setdefault(event.submissionId, []).append(deepcopy(event))
        return deepcopy(event)

    def list_submission_events(self, submission_id: str) -> list[SubmissionStatusEvent]:
        return deepcopy(self.submission_events.get(submission_id, []))

    def save_document(self, document):
        return self.safety_report_repository.save_document(document)

    def get_file_asset(self, file_id: str):
        return self.safety_report_repository.get_file_asset(file_id)

    def save_file_asset(self, file_asset):
        return self.safety_report_repository.save_file_asset(file_asset)

    def save_mail_thread(self, thread):
        self.safety_report_repository.save_mail_thread(thread)
        return self.mail_repository.save_thread(thread)

    def save_mail_message(self, message):
        return self.mail_repository.save_message(message)

    def save_audit_log(self, audit_log: AuditLog) -> AuditLog:
        key = f"{audit_log.entityType}:{audit_log.entityId}"
        self.audit_logs.setdefault(key, []).append(deepcopy(audit_log))
        return deepcopy(audit_log)

    def list_audit_logs(self, entity_type: str, entity_id: str) -> list[AuditLog]:
        return deepcopy(self.audit_logs.get(f"{entity_type}:{entity_id}", []))
