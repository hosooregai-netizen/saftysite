from dataclasses import asdict
from uuid import uuid4

from server.app.domain.models import (
    ApprovalComment,
    ApprovalStep,
    ApprovalTemplate,
    ApprovalTemplateStep,
    ApprovalWorkflow,
    AuditLog,
    FileAsset,
    FinalDocumentPackage,
    MailMessage,
    MailThread,
    ProjectActivityLog,
    SignatureAsset,
    SignatureTask,
    Submission,
    SubmissionAttachment,
    SubmissionRecipient,
    SubmissionStatusEvent,
    SubmissionValidationWarning,
)
from server.app.repositories.approval_repository import ApprovalRepository
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.project_repository import ProjectRepository


class ApprovalNotFoundError(Exception):
    pass


class ApprovalValidationError(Exception):
    pass


class ApprovalService:
    def __init__(
        self,
        repository: ApprovalRepository,
        project_repository: ProjectRepository,
        inspection_repository: InspectionRepository,
    ) -> None:
        self.repository = repository
        self.project_repository = project_repository
        self.inspection_repository = inspection_repository

    def _now(self) -> str:
        return "2026-05-10T12:00:00+09:00"

    def list_approvals(self, scope: str | None = None) -> list[dict]:
        rows = []
        for workflow in self.repository.list_workflows():
            document = self._require_document(workflow.documentId)
            steps = self.repository.list_steps(workflow.id)
            current_step = next((item for item in steps if item.status == "current"), None)
            if scope == "inbox" and workflow.status not in {"requested", "in_review"}:
                continue
            if scope == "requested" and workflow.requestedBy is None:
                continue
            rows.append(
                {
                    "workflow": asdict(workflow),
                    "document": asdict(document),
                    "currentStep": asdict(current_step) if current_step else None,
                    "pendingRequiredCount": len(
                        [item for item in steps if item.required and item.status not in {"approved", "skipped"}]
                    ),
                }
            )
        return rows

    def create_workflow(self, payload: dict) -> dict:
        document = self._require_document(payload["documentId"])
        if document.projectId != payload["projectId"]:
            raise ApprovalValidationError("documentId must belong to projectId")
        template = self._resolve_template(payload.get("templateId"), document.documentType)
        workflow = self._build_workflow(document.id, template.id, payload.get("requestedBy"))
        return self._persist_workflow(workflow, template, "결재 workflow 생성")

    def request_document_approval(self, document_id: str, payload: dict) -> dict:
        document = self._require_document(document_id)
        template = self._resolve_template(payload.get("templateId"), document.documentType)
        existing = self.repository.get_workflow_by_document(document_id)
        workflow = existing or self._build_workflow(document_id, template.id, payload.get("requestedBy"))
        workflow.status = "requested"
        workflow.requestedBy = payload.get("requestedBy") or "user-engineer-001"
        workflow.requestedAt = self._now()
        workflow.updatedAt = self._now()
        result = self._persist_workflow(workflow, template, "문서 결재 요청")
        document.status = "approval_requested"
        document.updatedAt = self._now()
        self.repository.save_document(document)
        result["document"] = asdict(document)
        return result

    def get_document_approval(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        workflow = self.repository.get_workflow_by_document(document_id)
        return {
            "document": asdict(document),
            "workflow": asdict(workflow) if workflow else None,
            "steps": [asdict(item) for item in self.repository.list_steps(workflow.id)] if workflow else [],
            "comments": [asdict(item) for item in self.repository.list_comments(workflow.id)] if workflow else [],
            "auditLogs": [asdict(item) for item in self.repository.list_audit_logs("document_instance", document_id)],
        }

    def get_workflow(self, workflow_id: str) -> dict:
        workflow = self._require_workflow(workflow_id)
        document = self._require_document(workflow.documentId)
        return {
            "workflow": asdict(workflow),
            "document": asdict(document),
            "steps": [asdict(item) for item in self.repository.list_steps(workflow_id)],
            "comments": [asdict(item) for item in self.repository.list_comments(workflow_id)],
            "auditLogs": [asdict(item) for item in self.repository.list_audit_logs("approval_workflow", workflow_id)],
        }

    def update_workflow(self, workflow_id: str, payload: dict) -> dict:
        workflow = self._require_workflow(workflow_id)
        for key, value in payload.items():
            if hasattr(workflow, key) and value is not None:
                setattr(workflow, key, value)
        workflow.updatedAt = self._now()
        stored = self.repository.save_workflow(workflow)
        return self.get_workflow(stored.id)

    def delete_workflow(self, workflow_id: str) -> dict:
        self._require_workflow(workflow_id)
        self.repository.delete_workflow(workflow_id)
        return {"deleted": True, "workflowId": workflow_id}

    def cancel_workflow(self, workflow_id: str) -> dict:
        return self.update_workflow(workflow_id, {"status": "cancelled"})

    def restart_workflow(self, workflow_id: str) -> dict:
        workflow = self._require_workflow(workflow_id)
        steps = self.repository.list_steps(workflow_id)
        for step in steps:
            step.status = "current" if step.stepOrder == 1 else "pending"
            step.actedAt = None
            step.comment = None
            step.updatedAt = self._now()
        self.repository.save_steps(workflow_id, steps)
        workflow.status = "requested"
        workflow.currentStepOrder = 1
        workflow.completedAt = None
        workflow.updatedAt = self._now()
        self.repository.save_workflow(workflow)
        return self.get_workflow(workflow_id)

    def list_steps(self, workflow_id: str) -> list[dict]:
        self._require_workflow(workflow_id)
        return [asdict(item) for item in self.repository.list_steps(workflow_id)]

    def create_step(self, workflow_id: str, payload: dict) -> dict:
        workflow = self._require_workflow(workflow_id)
        steps = self.repository.list_steps(workflow_id)
        step = ApprovalStep(
            id=f"approval-step-{uuid4().hex[:8]}",
            workflowId=workflow_id,
            stepOrder=len(steps) + 1,
            role=payload["role"],
            assigneeUserId=payload.get("assigneeUserId"),
            assigneeLabel=payload.get("assigneeLabel"),
            status="pending",
            required=payload.get("required", True),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        steps.append(step)
        self.repository.save_steps(workflow_id, steps)
        workflow.updatedAt = self._now()
        self.repository.save_workflow(workflow)
        return {"step": asdict(step), "steps": [asdict(item) for item in steps]}

    def update_step(self, step_id: str, payload: dict) -> dict:
        workflow, steps, step = self._locate_step(step_id)
        for item in steps:
            if item.id == step.id:
                for key, value in payload.items():
                    if hasattr(item, key) and value is not None:
                        setattr(item, key, value)
                item.updatedAt = self._now()
                step = item
                break
        self.repository.save_steps(workflow.id, steps)
        return {"step": asdict(step), "steps": [asdict(item) for item in steps]}

    def approve_step(self, step_id: str, payload: dict) -> dict:
        return self._act_step(step_id, "approved", payload)

    def reject_step(self, step_id: str, payload: dict) -> dict:
        return self._act_step(step_id, "rejected", payload)

    def request_changes(self, step_id: str, payload: dict) -> dict:
        return self._act_step(step_id, "changes_requested", payload)

    def delegate_step(self, step_id: str, payload: dict) -> dict:
        return self.update_step(
            step_id,
            {
                "delegatedToUserId": payload.get("delegateToUserId"),
                "status": "delegated",
            },
        )

    def skip_step(self, step_id: str, payload: dict) -> dict:
        return self._act_step(step_id, "skipped", payload)

    def list_signature_assets(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_signature_assets()]

    def create_signature_asset(self, payload: dict) -> dict:
        asset = SignatureAsset(
            id=f"signature-asset-{uuid4().hex[:8]}",
            label=payload["label"],
            assetType=payload["assetType"],
            fileId=payload["fileId"],
            status="active",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        return {"signatureAsset": asdict(self.repository.save_signature_asset(asset))}

    def get_signature_asset(self, asset_id: str) -> dict:
        return {"signatureAsset": asdict(self._require_signature_asset(asset_id))}

    def update_signature_asset(self, asset_id: str, payload: dict) -> dict:
        asset = self._require_signature_asset(asset_id)
        for key, value in payload.items():
            if hasattr(asset, key) and value is not None:
                setattr(asset, key, value)
        asset.updatedAt = self._now()
        return {"signatureAsset": asdict(self.repository.save_signature_asset(asset))}

    def delete_signature_asset(self, asset_id: str) -> dict:
        self._require_signature_asset(asset_id)
        self.repository.delete_signature_asset(asset_id)
        return {"deleted": True, "assetId": asset_id}

    def list_signature_tasks(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        return {"document": asdict(document), "tasks": [asdict(item) for item in self.repository.list_signature_tasks(document_id)]}

    def create_signature_task(self, document_id: str, payload: dict) -> dict:
        document = self._require_document(document_id)
        tasks = self.repository.list_signature_tasks(document_id)
        task = SignatureTask(
            id=f"signature-task-{uuid4().hex[:8]}",
            documentId=document_id,
            projectId=document.projectId,
            ownerPartyId=document.ownerPartyId,
            taskType=payload["taskType"],
            title=payload["title"],
            status="pending",
            required=payload.get("required", True),
            signatureAssetId=payload.get("signatureAssetId"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        tasks.append(task)
        self.repository.save_signature_tasks(document_id, tasks)
        return {"task": asdict(task), "tasks": [asdict(item) for item in tasks]}

    def update_signature_task(self, task_id: str, payload: dict) -> dict:
        document_id, tasks, task = self._locate_signature_task(task_id)
        for item in tasks:
            if item.id == task_id:
                for key, value in payload.items():
                    if hasattr(item, key) and value is not None:
                        setattr(item, key, value)
                item.updatedAt = self._now()
                task = item
                break
        self.repository.save_signature_tasks(document_id, tasks)
        return {"task": asdict(task), "tasks": [asdict(item) for item in tasks]}

    def complete_signature_task(self, task_id: str, payload: dict) -> dict:
        document_id, tasks, task = self._locate_signature_task(task_id)
        if task.taskType == "signed_file_upload" and not (payload.get("signedFileId") or task.signedFileId):
            raise ApprovalValidationError("signedFileId is required for signed_file_upload")
        for item in tasks:
            if item.id == task_id:
                item.signedFileId = payload.get("signedFileId") or item.signedFileId
                item.status = "completed"
                item.completedAt = self._now()
                item.updatedAt = self._now()
                task = item
                break
        self.repository.save_signature_tasks(document_id, tasks)
        return {"task": asdict(task), "tasks": [asdict(item) for item in tasks]}

    def waive_signature_task(self, task_id: str, payload: dict) -> dict:
        if not payload.get("waivedReason"):
            raise ApprovalValidationError("waivedReason is required")
        return self.update_signature_task(task_id, {"status": "waived", "waivedReason": payload["waivedReason"]})

    def upload_signed_file(self, document_id: str, payload: dict) -> dict:
        document = self._require_document(document_id)
        project = self._require_project(document.projectId)
        file_asset = FileAsset(
            id=f"file-asset-signed-{uuid4().hex[:8]}",
            projectId=document.projectId,
            ownerPartyId=document.ownerPartyId,
            inspectionRoundId=document.inspectionRoundId,
            fileName=payload["fileName"],
            fileType=payload.get("fileType") or "application/pdf",
            storagePath=payload.get("storagePath")
            or f"/{project.projectName}/06_승인제출/{document.id}/{payload['fileName']}",
            linkedEntityType="document_instance",
            linkedEntityId=document.id,
            createdAt=self._now(),
            updatedAt=self._now(),
            tags=["signed_file"],
        )
        stored_file = self.repository.save_file_asset(file_asset)
        tasks = self.repository.list_signature_tasks(document_id)
        for item in tasks:
            if item.taskType == "signed_file_upload":
                item.signedFileId = stored_file.id
                item.status = "completed"
                item.completedAt = self._now()
                item.updatedAt = self._now()
        self.repository.save_signature_tasks(document_id, tasks)
        return {"fileAsset": asdict(stored_file), "tasks": [asdict(item) for item in tasks]}

    def get_submission_readiness(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        warnings = [asdict(item) for item in self._calculate_readiness(document)]
        return {
            "document": asdict(document),
            "workflow": asdict(self.repository.get_workflow_by_document(document_id))
            if self.repository.get_workflow_by_document(document_id)
            else None,
            "signatureTasks": [asdict(item) for item in self.repository.list_signature_tasks(document_id)],
            "package": asdict(self.repository.get_package_by_document(document_id))
            if self.repository.get_package_by_document(document_id)
            else None,
            "warnings": warnings,
            "ready": not any(item["severity"] == "required" for item in warnings),
        }

    def create_submission_package(self, document_id: str, payload: dict) -> dict:
        document = self._require_document(document_id)
        main_file_id = payload.get("mainFileId") or document.exportedFileId
        if not main_file_id:
            raise ApprovalValidationError("mainFileId is required")
        package = FinalDocumentPackage(
            id=f"submission-package-{uuid4().hex[:8]}",
            documentId=document_id,
            projectId=document.projectId,
            ownerPartyId=document.ownerPartyId,
            mainFileId=main_file_id,
            signedFileId=payload.get("signedFileId"),
            attachmentFileIds=payload.get("attachmentFileIds", []),
            status="draft",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_package(package)
        return {"package": asdict(stored), "warnings": [asdict(item) for item in self._calculate_readiness(document)]}

    def get_submission_package(self, package_id: str) -> dict:
        return {"package": asdict(self._require_package(package_id))}

    def update_submission_package(self, package_id: str, payload: dict) -> dict:
        package = self._require_package(package_id)
        for key, value in payload.items():
            if hasattr(package, key) and value is not None:
                setattr(package, key, value)
        package.updatedAt = self._now()
        return {"package": asdict(self.repository.save_package(package))}

    def validate_submission_package(self, package_id: str) -> dict:
        package = self._require_package(package_id)
        document = self._require_document(package.documentId)
        warnings = self._calculate_readiness(document)
        if not package.mainFileId:
            warnings.append(
                SubmissionValidationWarning(
                    code="main_file_missing",
                    message="최종 제출본이 연결되지 않았습니다.",
                    severity="required",
                    field="mainFileId",
                )
            )
        return {"package": asdict(package), "warnings": [asdict(item) for item in warnings], "ready": not any(item.severity == "required" for item in warnings)}

    def finalize_submission_package(self, package_id: str) -> dict:
        package = self._require_package(package_id)
        validation = self.validate_submission_package(package_id)
        if not validation["ready"]:
            raise ApprovalValidationError("submission package is not ready")
        package.status = "finalized"
        package.finalizedAt = self._now()
        package.updatedAt = self._now()
        return {"package": asdict(self.repository.save_package(package)), "warnings": validation["warnings"]}

    def list_project_submissions(self, project_id: str) -> list[dict]:
        self._require_project(project_id)
        rows = []
        for submission in self.repository.list_submissions(project_id):
            rows.append(
                {
                    "submission": asdict(submission),
                    "recipients": [asdict(item) for item in self.repository.list_submission_recipients(submission.id)],
                    "attachments": [asdict(item) for item in self.repository.list_submission_attachments(submission.id)],
                }
            )
        return rows

    def create_submission(self, project_id: str, payload: dict) -> dict:
        document = self._require_document(payload["documentId"])
        if document.projectId != project_id:
            raise ApprovalValidationError("documentId must belong to projectId")
        if payload.get("ownerPartyId") and payload["ownerPartyId"] != document.ownerPartyId:
            raise ApprovalValidationError("ownerPartyId must match document ownerPartyId")
        package = self.repository.get_package(payload["packageId"]) if payload.get("packageId") else self.repository.get_package_by_document(document.id)
        if not package:
            package = self.repository.save_package(
                FinalDocumentPackage(
                    id=f"submission-package-{uuid4().hex[:8]}",
                    documentId=document.id,
                    projectId=document.projectId,
                    ownerPartyId=document.ownerPartyId,
                    mainFileId=document.exportedFileId or "",
                    status="draft",
                    createdAt=self._now(),
                    updatedAt=self._now(),
                )
            )
        submission = Submission(
            id=f"submission-{uuid4().hex[:8]}",
            documentId=document.id,
            projectId=project_id,
            inspectionRoundId=document.inspectionRoundId,
            ownerPartyId=payload.get("ownerPartyId") or document.ownerPartyId,
            exportedFileId=package.mainFileId,
            mailThreadId="",
            submittedAt="",
            packageId=package.id,
            channel=payload.get("channel") or "mail",
            finalFileId=package.mainFileId,
            memo=payload.get("memo"),
            status="draft",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_submission(submission)
        recipients = self._build_recipients(stored.id, stored.projectId, stored.ownerPartyId, payload.get("recipientEmails", []))
        attachments = self._build_submission_attachments(
            stored.id,
            payload.get("attachmentFileIds", []) or package.attachmentFileIds,
        )
        self.repository.save_submission_recipients(stored.id, recipients)
        self.repository.save_submission_attachments(stored.id, attachments)
        self.repository.add_submission_event(
            SubmissionStatusEvent(
                id=f"submission-event-{uuid4().hex[:8]}",
                submissionId=stored.id,
                status="draft",
                summary="제출 초안이 생성되었습니다.",
                createdAt=self._now(),
            )
        )
        return self.get_submission(stored.id)

    def get_submission(self, submission_id: str) -> dict:
        submission = self._require_submission(submission_id)
        document = self._require_document(submission.documentId)
        package = self.repository.get_package(submission.packageId) if submission.packageId else None
        return {
            "submission": asdict(submission),
            "document": asdict(document),
            "package": asdict(package) if package else None,
            "recipients": [asdict(item) for item in self.repository.list_submission_recipients(submission_id)],
            "attachments": [asdict(item) for item in self.repository.list_submission_attachments(submission_id)],
            "events": [asdict(item) for item in self.repository.list_submission_events(submission_id)],
            "auditLogs": [asdict(item) for item in self.repository.list_audit_logs("submission", submission_id)],
        }

    def update_submission(self, submission_id: str, payload: dict) -> dict:
        submission = self._require_submission(submission_id)
        for key, value in payload.items():
            if hasattr(submission, key) and value is not None:
                setattr(submission, key, value)
        submission.updatedAt = self._now()
        self.repository.save_submission(submission)
        return self.get_submission(submission_id)

    def delete_submission(self, submission_id: str) -> dict:
        self._require_submission(submission_id)
        self.repository.delete_submission(submission_id)
        return {"deleted": True, "submissionId": submission_id}

    def send_submission_mail(self, submission_id: str, payload: dict) -> dict:
        submission = self._require_submission(submission_id)
        document = self._require_document(submission.documentId)
        readiness = self._calculate_readiness(document)
        if any(item.severity == "required" for item in readiness):
            raise ApprovalValidationError("submission readiness is blocked")
        if not submission.finalFileId and not submission.exportedFileId:
            raise ApprovalValidationError("finalFileId is required before send-mail")
        recipients = self.repository.list_submission_recipients(submission_id)
        if not recipients:
            raise ApprovalValidationError("recipients are required before send-mail")
        thread = self.repository.save_mail_thread(
            MailThread(
                id=f"mail-thread-submission-{uuid4().hex[:8]}",
                projectId=submission.projectId,
                providerThreadId=None,
                inspectionRoundId=submission.inspectionRoundId,
                ownerPartyId=submission.ownerPartyId,
                subject=payload.get("subject") or f"{document.title} 제출",
                status="active",
                lastMessageAt=self._now(),
                createdAt=self._now(),
                updatedAt=self._now(),
            )
        )
        message = self.repository.save_mail_message(
            MailMessage(
                id=f"mail-message-submission-{uuid4().hex[:8]}",
                projectId=submission.projectId,
                threadId=thread.id,
                inspectionRoundId=submission.inspectionRoundId,
                ownerPartyId=submission.ownerPartyId,
                subject=thread.subject,
                fromAddress="reports@anc.local",
                toAddresses=[item.email for item in recipients],
                bodyText="문서 제출 메일이 발송되었습니다.",
                direction="outbound",
                folder="sent",
                status="sent",
                isRead=True,
                documentId=document.id,
                submissionId=submission.id,
                sentAt=payload.get("sentAt") or self._now(),
                receivedAt=payload.get("sentAt") or self._now(),
                createdAt=self._now(),
            )
        )
        submission.mailThreadId = thread.id
        submission.submittedAt = payload.get("sentAt") or self._now()
        submission.status = "submitted"
        submission.updatedAt = self._now()
        self.repository.save_submission(submission)
        document.mailThreadId = thread.id
        document.submissionId = submission.id
        document.submittedAt = submission.submittedAt
        document.status = "submitted"
        document.updatedAt = self._now()
        self.repository.save_document(document)
        self._sync_owner_report_task(document, submission)
        event = self.repository.add_submission_event(
            SubmissionStatusEvent(
                id=f"submission-event-{uuid4().hex[:8]}",
                submissionId=submission.id,
                status="submitted",
                summary="메일 제출이 완료되었습니다.",
                createdAt=self._now(),
            )
        )
        audit_log = self._add_audit_log("submission", submission.id, "submission.mail_sent", "메일 제출이 완료되었습니다.", ["mailThreadId", "submittedAt"])
        self._add_project_activity(document.projectId, "submission.sent", f"{document.title} 제출 메일이 기록되었습니다.")
        return {
            **self.get_submission(submission.id),
            "mailThread": asdict(thread),
            "mailMessage": asdict(message),
            "event": asdict(event),
            "auditLog": asdict(audit_log),
        }

    def mark_manual_submitted(self, submission_id: str, payload: dict) -> dict:
        submission = self._require_submission(submission_id)
        if not payload.get("externalReference") and not payload.get("memo"):
            raise ApprovalValidationError("externalReference or memo is required")
        document = self._require_document(submission.documentId)
        submission.status = "manual_submitted"
        submission.submittedAt = payload.get("submittedAt") or self._now()
        submission.externalReference = payload.get("externalReference")
        submission.memo = payload.get("memo")
        submission.updatedAt = self._now()
        self.repository.save_submission(submission)
        event = self.repository.add_submission_event(
            SubmissionStatusEvent(
                id=f"submission-event-{uuid4().hex[:8]}",
                submissionId=submission.id,
                status="manual_submitted",
                summary="수동 제출 이력이 기록되었습니다.",
                createdAt=self._now(),
            )
        )
        document.submissionId = submission.id
        document.submittedAt = submission.submittedAt
        document.status = "manual_submitted"
        document.updatedAt = self._now()
        self.repository.save_document(document)
        self._sync_owner_report_task(document, submission)
        audit_log = self._add_audit_log(
            "submission",
            submission.id,
            "submission.manual_submitted",
            "수동 제출 이력이 기록되었습니다.",
            ["submittedAt", "externalReference", "memo"],
        )
        self._add_project_activity(document.projectId, "submission.manual_submitted", f"{document.title} 수동 제출이 기록되었습니다.")
        return {
            **self.get_submission(submission.id),
            "event": asdict(event),
            "auditLog": asdict(audit_log),
        }

    def confirm_owner_receipt(self, submission_id: str) -> dict:
        submission = self._require_submission(submission_id)
        submission.status = "received"
        submission.receiptConfirmedAt = self._now()
        submission.updatedAt = self._now()
        self.repository.save_submission(submission)
        event = self.repository.add_submission_event(
            SubmissionStatusEvent(
                id=f"submission-event-{uuid4().hex[:8]}",
                submissionId=submission.id,
                status="received",
                summary="발주처 수령 확인이 기록되었습니다.",
                createdAt=self._now(),
            )
        )
        audit_log = self._add_audit_log(
            "submission",
            submission.id,
            "submission.receipt_confirmed",
            "발주처 수령 확인이 기록되었습니다.",
            ["receiptConfirmedAt"],
        )
        return {
            **self.get_submission(submission.id),
            "event": asdict(event),
            "auditLog": asdict(audit_log),
        }

    def request_revision(self, submission_id: str, payload: dict) -> dict:
        submission = self._require_submission(submission_id)
        submission.status = "revision_requested"
        submission.revisionRequestedAt = self._now()
        submission.memo = payload.get("memo") or submission.memo
        submission.updatedAt = self._now()
        self.repository.save_submission(submission)
        event = self.repository.add_submission_event(
            SubmissionStatusEvent(
                id=f"submission-event-{uuid4().hex[:8]}",
                submissionId=submission.id,
                status="revision_requested",
                summary="보완 요청 상태로 전환되었습니다.",
                createdAt=self._now(),
            )
        )
        audit_log = self._add_audit_log(
            "submission",
            submission.id,
            "submission.revision_requested",
            "보완 요청 상태로 전환되었습니다.",
            ["memo", "revisionRequestedAt"],
        )
        return {
            **self.get_submission(submission.id),
            "event": asdict(event),
            "auditLog": asdict(audit_log),
        }

    def resubmit(self, submission_id: str) -> dict:
        submission = self._require_submission(submission_id)
        submission.status = "resubmitted"
        submission.updatedAt = self._now()
        self.repository.save_submission(submission)
        event = self.repository.add_submission_event(
            SubmissionStatusEvent(
                id=f"submission-event-{uuid4().hex[:8]}",
                submissionId=submission.id,
                status="resubmitted",
                summary="재제출 대기 상태로 전환되었습니다.",
                createdAt=self._now(),
            )
        )
        audit_log = self._add_audit_log(
            "submission",
            submission.id,
            "submission.resubmitted",
            "재제출 대기 상태로 전환되었습니다.",
            ["status"],
        )
        return {
            **self.get_submission(submission.id),
            "event": asdict(event),
            "auditLog": asdict(audit_log),
        }

    def archive_submission(self, submission_id: str) -> dict:
        submission = self._require_submission(submission_id)
        submission.status = "archived"
        submission.updatedAt = self._now()
        self.repository.save_submission(submission)
        if submission.packageId:
            package = self.repository.get_package(submission.packageId)
            if package:
                package.status = "archived"
                package.updatedAt = self._now()
                self.repository.save_package(package)
        event = self.repository.add_submission_event(
            SubmissionStatusEvent(
                id=f"submission-event-{uuid4().hex[:8]}",
                submissionId=submission.id,
                status="archived",
                summary="제출 이력이 보관 처리되었습니다.",
                createdAt=self._now(),
            )
        )
        audit_log = self._add_audit_log(
            "submission",
            submission.id,
            "submission.archived",
            "제출 이력이 보관 처리되었습니다.",
            ["status", "packageId"],
        )
        return {
            **self.get_submission(submission.id),
            "event": asdict(event),
            "auditLog": asdict(audit_log),
        }

    def list_templates(self) -> list[dict]:
        rows = []
        for template in self.repository.list_templates():
            rows.append(
                {
                    "template": asdict(template),
                    "steps": [asdict(item) for item in self.repository.list_template_steps(template.id)],
                }
            )
        return rows

    def create_template(self, payload: dict) -> dict:
        template = ApprovalTemplate(
            id=f"approval-template-{uuid4().hex[:8]}",
            name=payload["name"],
            documentType=payload["documentType"],
            status=payload.get("status") or "draft",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        self.repository.save_template(template)
        return {"template": asdict(template), "steps": []}

    def get_template(self, template_id: str) -> dict:
        template = self._require_template(template_id)
        return {"template": asdict(template), "steps": [asdict(item) for item in self.repository.list_template_steps(template_id)]}

    def update_template(self, template_id: str, payload: dict) -> dict:
        template = self._require_template(template_id)
        for key, value in payload.items():
            if hasattr(template, key) and value is not None:
                setattr(template, key, value)
        template.updatedAt = self._now()
        self.repository.save_template(template)
        return self.get_template(template_id)

    def delete_template(self, template_id: str) -> dict:
        self._require_template(template_id)
        self.repository.delete_template(template_id)
        return {"deleted": True, "templateId": template_id}

    def publish_template(self, template_id: str) -> dict:
        return self.update_template(template_id, {"status": "published"})

    def _persist_workflow(self, workflow: ApprovalWorkflow, template: ApprovalTemplate, summary: str) -> dict:
        stored = self.repository.save_workflow(workflow)
        if not self.repository.list_steps(workflow.id):
            steps = [
                ApprovalStep(
                    id=f"approval-step-{uuid4().hex[:8]}",
                    workflowId=workflow.id,
                    stepOrder=item.stepOrder,
                    role=item.role,
                    assigneeLabel=item.defaultAssigneeLabel,
                    status="current" if item.stepOrder == 1 else "pending",
                    required=item.required,
                    createdAt=self._now(),
                    updatedAt=self._now(),
                )
                for item in self.repository.list_template_steps(template.id)
            ]
            self.repository.save_steps(workflow.id, steps)
        audit_log = self._add_audit_log("approval_workflow", workflow.id, "approval.requested", summary, ["documentId", "templateId"])
        return {
            **self.get_workflow(stored.id),
            "auditLog": asdict(audit_log),
        }

    def _act_step(self, step_id: str, status: str, payload: dict) -> dict:
        workflow, steps, step = self._locate_step(step_id)
        document = self._require_document(workflow.documentId)
        for item in steps:
            if item.id == step.id:
                item.status = status
                item.actedAt = self._now()
                item.comment = payload.get("comment")
                item.updatedAt = self._now()
                step = item
        if payload.get("comment"):
            self.repository.save_comment(
                ApprovalComment(
                    id=f"approval-comment-{uuid4().hex[:8]}",
                    workflowId=workflow.id,
                    stepId=step.id,
                    authorUserId=payload.get("actedBy") or "user-engineer-001",
                    body=payload["comment"],
                    createdAt=self._now(),
                )
            )
        if status == "approved":
            required_complete = all(item.status in {"approved", "skipped"} for item in steps if item.required)
            next_pending = next((item for item in sorted(steps, key=lambda row: row.stepOrder) if item.status == "pending"), None)
            if required_complete:
                workflow.status = "approved"
                workflow.completedAt = self._now()
                document.status = "approved"
            elif next_pending:
                next_pending.status = "current"
                next_pending.updatedAt = self._now()
                workflow.currentStepOrder = next_pending.stepOrder
                workflow.status = "in_review"
            else:
                workflow.status = "approved"
                workflow.completedAt = self._now()
                document.status = "approved"
        elif status == "changes_requested":
            workflow.status = "changes_requested"
            document.status = "changes_requested"
        elif status == "rejected":
            workflow.status = "rejected"
            document.status = "rejected"
        elif status == "skipped":
            workflow.status = "in_review"
        workflow.updatedAt = self._now()
        document.updatedAt = self._now()
        self.repository.save_steps(workflow.id, sorted(steps, key=lambda row: row.stepOrder))
        self.repository.save_workflow(workflow)
        self.repository.save_document(document)
        self._add_audit_log(
            "approval_workflow",
            workflow.id,
            f"approval.step_{status}",
            f"결재 단계가 {status} 상태로 변경되었습니다.",
            ["status", "comment", "actedAt"],
        )
        return self.get_workflow(workflow.id)

    def _calculate_readiness(self, document) -> list[SubmissionValidationWarning]:
        warnings: list[SubmissionValidationWarning] = []
        workflow = self.repository.get_workflow_by_document(document.id)
        if not workflow or workflow.status != "approved":
            warnings.append(
                SubmissionValidationWarning(
                    code="approval_missing",
                    message="필수 결재가 완료되지 않았습니다.",
                    severity="required",
                    field="approvalWorkflow",
                )
            )
        signature_tasks = self.repository.list_signature_tasks(document.id)
        if any(item.required and item.status not in {"completed", "waived"} for item in signature_tasks):
            warnings.append(
                SubmissionValidationWarning(
                    code="signature_missing",
                    message="필수 서명/날인 task가 완료되지 않았습니다.",
                    severity="required",
                    field="signatureTasks",
                )
            )
        if not document.exportedFileId:
            warnings.append(
                SubmissionValidationWarning(
                    code="exported_file_missing",
                    message="최종 export 파일이 없습니다.",
                    severity="required",
                    field="exportedFileId",
                )
            )
        owner_party = next(
            (item for item in self.project_repository.list_project_parties(document.projectId) if item.ownerPartyId == document.ownerPartyId),
            None,
        )
        if not owner_party:
            warnings.append(
                SubmissionValidationWarning(
                    code="owner_party_missing",
                    message="발주처 분기 연결이 없습니다.",
                    severity="required",
                    field="ownerPartyId",
                )
            )
        owner_org_id = owner_party.organizationId if owner_party else None
        owner_contacts = [
            item
            for item in self.project_repository.list_contacts(document.projectId)
            if item.organizationId == owner_org_id and item.receivesReport and item.email
        ]
        if not owner_contacts:
            warnings.append(
                SubmissionValidationWarning(
                    code="recipient_missing",
                    message="보고서 수신 담당 연락처가 없습니다.",
                    severity="required",
                    field="recipientEmails",
                )
            )
        return warnings

    def _build_recipients(
        self,
        submission_id: str,
        project_id: str,
        owner_party_id: str,
        explicit_emails: list[str],
    ) -> list[SubmissionRecipient]:
        owner_party = next(
            (item for item in self.project_repository.list_project_parties(project_id) if item.ownerPartyId == owner_party_id),
            None,
        )
        organization = self.project_repository.get_organization(owner_party.organizationId) if owner_party else None
        contacts = [
            item
            for item in self.project_repository.list_contacts(project_id)
            if owner_party and item.organizationId == owner_party.organizationId and item.receivesReport and item.email
        ]
        emails = explicit_emails or [item.email for item in contacts if item.email]
        recipients: list[SubmissionRecipient] = []
        for index, email in enumerate(emails, start=1):
            contact = next((item for item in contacts if item.email == email), None)
            recipients.append(
                SubmissionRecipient(
                    id=f"submission-recipient-{submission_id}-{index}",
                    submissionId=submission_id,
                    ownerPartyId=owner_party_id,
                    name=contact.name if contact else "수신자",
                    email=email,
                    organizationName=organization.name if organization else None,
                    roleLabel=contact.roleDescription if contact else "보고서 수신",
                    createdAt=self._now(),
                )
            )
        return recipients

    def _build_submission_attachments(self, submission_id: str, file_ids: list[str]) -> list[SubmissionAttachment]:
        rows: list[SubmissionAttachment] = []
        for index, file_id in enumerate(file_ids, start=1):
            rows.append(
                SubmissionAttachment(
                    id=f"submission-attachment-{submission_id}-{index}",
                    submissionId=submission_id,
                    fileId=file_id,
                    label=f"첨부 {index}",
                    attachmentType="supporting",
                    createdAt=self._now(),
                )
            )
        return rows

    def _sync_owner_report_task(self, document, submission: Submission) -> None:
        if not document.ownerReportTaskId:
            return
        task = self.inspection_repository.get_owner_report_task(document.ownerReportTaskId)
        if not task:
            return
        task.status = "submitted"
        task.mailThreadId = submission.mailThreadId
        task.submittedAt = submission.submittedAt
        task.submissionId = submission.id
        task.updatedAt = self._now()
        self.inspection_repository.save_owner_report_task(task)

    def _add_audit_log(self, entity_type: str, entity_id: str, action: str, summary: str, field_names: list[str]) -> AuditLog:
        return self.repository.save_audit_log(
            AuditLog(
                id=f"audit-log-{uuid4().hex[:8]}",
                entityType=entity_type,
                entityId=entity_id,
                action=action,
                summary=summary,
                fieldNames=field_names,
                createdAt=self._now(),
            )
        )

    def _add_project_activity(self, project_id: str, action: str, summary: str) -> ProjectActivityLog:
        return self.project_repository.add_activity_log(
            ProjectActivityLog(
                id=f"project-log-{uuid4().hex[:8]}",
                projectId=project_id,
                action=action,
                summary=summary,
                fieldNames=["documentId", "submissionId"],
                createdAt=self._now(),
            )
        )

    def _require_project(self, project_id: str):
        project = self.project_repository.get_project(project_id)
        if not project:
            raise ApprovalNotFoundError("project not found")
        return project

    def _require_document(self, document_id: str):
        document = self.repository.get_document(document_id)
        if not document:
            raise ApprovalNotFoundError("document not found")
        return document

    def _require_workflow(self, workflow_id: str) -> ApprovalWorkflow:
        workflow = self.repository.get_workflow(workflow_id)
        if not workflow:
            raise ApprovalNotFoundError("approval workflow not found")
        return workflow

    def _require_template(self, template_id: str) -> ApprovalTemplate:
        template = self.repository.get_template(template_id)
        if not template:
            raise ApprovalNotFoundError("approval template not found")
        return template

    def _resolve_template(self, template_id: str | None, document_type: str) -> ApprovalTemplate:
        if template_id:
            return self._require_template(template_id)
        for item in self.repository.list_templates():
            if item.documentType == document_type:
                return item
        raise ApprovalNotFoundError("approval template not found")

    def _require_signature_asset(self, asset_id: str) -> SignatureAsset:
        asset = self.repository.get_signature_asset(asset_id)
        if not asset:
            raise ApprovalNotFoundError("signature asset not found")
        return asset

    def _require_package(self, package_id: str) -> FinalDocumentPackage:
        package = self.repository.get_package(package_id)
        if not package:
            raise ApprovalNotFoundError("submission package not found")
        return package

    def _require_submission(self, submission_id: str) -> Submission:
        submission = self.repository.get_submission(submission_id)
        if not submission:
            raise ApprovalNotFoundError("submission not found")
        return submission

    def _build_workflow(self, document_id: str, template_id: str, requested_by: str | None) -> ApprovalWorkflow:
        document = self._require_document(document_id)
        return ApprovalWorkflow(
            id=f"approval-workflow-{uuid4().hex[:8]}",
            documentId=document.id,
            projectId=document.projectId,
            inspectionRoundId=document.inspectionRoundId,
            ownerPartyId=document.ownerPartyId,
            title=f"{document.title} 결재",
            status="requested",
            templateId=template_id,
            currentStepOrder=1,
            requestedBy=requested_by or "user-engineer-001",
            requestedAt=self._now(),
            createdAt=self._now(),
            updatedAt=self._now(),
        )

    def _locate_step(self, step_id: str) -> tuple[ApprovalWorkflow, list[ApprovalStep], ApprovalStep]:
        step = self.repository.get_step(step_id)
        if not step:
            raise ApprovalNotFoundError("approval step not found")
        workflow = self._require_workflow(step.workflowId)
        steps = self.repository.list_steps(workflow.id)
        return workflow, steps, step

    def _locate_signature_task(self, task_id: str) -> tuple[str, list[SignatureTask], SignatureTask]:
        task = self.repository.get_signature_task(task_id)
        if not task:
            raise ApprovalNotFoundError("signature task not found")
        tasks = self.repository.list_signature_tasks(task.documentId)
        return task.documentId, tasks, task
