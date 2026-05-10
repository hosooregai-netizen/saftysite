from dataclasses import asdict
from uuid import uuid4

from server.app.domain.models import (
    AuditLog,
    MailAccount,
    MailAttachment,
    MailDraft,
    MailEntityLink,
    MailMessage,
    MailProviderEvent,
    MailSignature,
    MailSyncJob,
    MailTemplate,
    MailThread,
)
from server.app.repositories.contract_repository import ContractRepository
from server.app.repositories.finding_repository import FindingRepository
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.mail_repository import MailRepository
from server.app.repositories.project_repository import ProjectRepository
from server.app.repositories.safety_report_repository import SafetyReportRepository
from server.app.services.finding_service import FindingService, FindingValidationError
from server.app.services.safety_report_service import SafetyReportService, SafetyReportValidationError
from server.app.services.webhard_service import WebhardService


class MailboxNotFoundError(Exception):
    pass


class MailboxValidationError(Exception):
    pass


class MailboxService:
    def __init__(
        self,
        repository: MailRepository,
        project_repository: ProjectRepository,
        inspection_repository: InspectionRepository,
        contract_repository: ContractRepository,
        finding_repository: FindingRepository,
        safety_report_repository: SafetyReportRepository,
        finding_service: FindingService,
        safety_report_service: SafetyReportService,
        webhard_service: WebhardService,
    ) -> None:
        self.repository = repository
        self.project_repository = project_repository
        self.inspection_repository = inspection_repository
        self.contract_repository = contract_repository
        self.finding_repository = finding_repository
        self.safety_report_repository = safety_report_repository
        self.finding_service = finding_service
        self.safety_report_service = safety_report_service
        self.webhard_service = webhard_service

    def _now(self) -> str:
        return "2026-05-10T11:00:00+09:00"

    def list_accounts(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_accounts()]

    def create_guest_account(self, payload: dict) -> dict:
        account = MailAccount(
            id=f"mail-account-guest-{uuid4().hex[:8]}",
            provider="guest",
            mode="guest_draft_mode",
            email=payload.get("email") or "guest-draft@anc.local",
            displayName=payload.get("displayName") or "A&C Guest Draft",
            projectId=payload.get("projectId"),
            status="active",
            isConnected=False,
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_account(account)
        return {"account": asdict(stored)}

    def get_account(self, account_id: str) -> dict:
        return {"account": asdict(self._require_account(account_id))}

    def update_account(self, account_id: str, payload: dict) -> dict:
        account = self._require_account(account_id)
        if payload.get("displayName"):
            account.displayName = payload["displayName"]
        if payload.get("status"):
            account.status = payload["status"]
        account.updatedAt = self._now()
        return {"account": asdict(self.repository.save_account(account))}

    def delete_account(self, account_id: str) -> dict:
        self._require_account(account_id)
        self.repository.delete_account(account_id)
        return {"deleted": True, "accountId": account_id}

    def oauth_google_start(self) -> dict:
        return {
            "provider": "google",
            "authUrl": "https://accounts.google.com/o/oauth2/auth?client_id=draft&scope=gmail.readonly%20gmail.send",
            "mode": "connected_oauth_mode",
        }

    def oauth_google_callback(self) -> dict:
        connected = self.repository.get_account("mail-account-google-001")
        return {"connected": True, "account": asdict(connected) if connected else None}

    def disconnect_account(self, account_id: str) -> dict:
        account = self._require_account(account_id)
        account.isConnected = False
        account.status = "disconnected"
        account.updatedAt = self._now()
        return {"account": asdict(self.repository.save_account(account))}

    def sync_account(self, account_id: str) -> dict:
        account = self._require_account(account_id)
        project_id = account.projectId or "project-sample-001"
        provider_thread_id = f"provider-sync-thread-{account.id}"
        provider_message_id = f"provider-sync-message-{account.id}"
        existing_thread = self.repository.find_thread_by_provider_id(provider_thread_id)
        existing_message = self.repository.find_message_by_provider_id(provider_message_id)
        thread = MailThread(
            id=existing_thread.id if existing_thread else f"mail-thread-sync-{uuid4().hex[:8]}",
            projectId=project_id,
            providerThreadId=provider_thread_id,
            subject="[A&C ERP] 동기화된 메일",
            participantContactIds=[],
            status="active",
            lastMessageAt=self._now(),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        message = MailMessage(
            id=existing_message.id if existing_message else f"mail-message-sync-{uuid4().hex[:8]}",
            projectId=project_id,
            threadId=thread.id,
            providerMessageId=provider_message_id,
            subject=thread.subject,
            fromAddress="sync@example.com",
            toAddresses=[account.email],
            bodyText="동기화된 샘플 메일입니다.",
            direction="inbound",
            folder="inbox",
            status="received",
            isRead=False,
            receivedAt=self._now(),
            createdAt=self._now(),
        )
        job = MailSyncJob(
            id=f"mail-sync-job-{uuid4().hex[:8]}",
            accountId=account.id,
            status="completed",
            summary="메일 1건 동기화",
            startedAt=self._now(),
            completedAt=self._now(),
        )
        account.lastSyncedAt = self._now()
        account.updatedAt = self._now()
        self.repository.save_thread(thread)
        self.repository.save_message(message)
        self.repository.save_sync_job(job)
        self.repository.save_provider_event(
            MailProviderEvent(
                id=f"mail-provider-event-{uuid4().hex[:8]}",
                accountId=account.id,
                eventType="sync.completed",
                threadId=thread.id,
                messageId=message.id,
                payloadSummary="메일 1건 수신",
                createdAt=self._now(),
            )
        )
        self.repository.save_account(account)
        audit_log = self._add_audit_log(
            entity_type="mail_account",
            entity_id=account.id,
            action="mail.sync",
            summary="메일 계정 동기화가 실행되었습니다.",
            field_names=["providerThreadId", "providerMessageId"],
        )
        return {
            "account": asdict(account),
            "job": asdict(job),
            "threads": [asdict(thread)],
            "messages": [asdict(message)],
            "auditLog": asdict(audit_log),
        }

    def list_sync_jobs(self, account_id: str) -> list[dict]:
        self._require_account(account_id)
        return [asdict(item) for item in self.repository.list_sync_jobs(account_id)]

    def list_threads(self, project_id: str | None = None, folder: str | None = None) -> list[dict]:
        rows = []
        for thread in self.repository.list_threads(project_id, folder):
            messages = self.repository.list_messages(project_id=thread.projectId, thread_id=thread.id)
            latest = messages[0] if messages else None
            unread = len([item for item in messages if not item.isRead and item.direction == "inbound"])
            rows.append(
                {
                    "thread": asdict(thread),
                    "latestMessage": asdict(latest) if latest else None,
                    "unreadCount": unread,
                    "links": [asdict(item) for item in self.repository.list_links(thread_id=thread.id)],
                }
            )
        return rows

    def get_thread(self, thread_id: str) -> dict:
        thread = self._require_thread(thread_id)
        messages = self.repository.list_messages(thread_id=thread.id)
        attachments = [asdict(item) for message in messages for item in self.repository.list_attachments(message.id)]
        return {
            "thread": asdict(thread),
            "messages": [asdict(item) for item in messages],
            "attachments": attachments,
            "links": [asdict(item) for item in self.repository.list_links(thread_id=thread.id)],
        }

    def update_thread(self, thread_id: str, payload: dict) -> dict:
        thread = self._require_thread(thread_id)
        if payload.get("status"):
            thread.status = payload["status"]
        thread.updatedAt = self._now()
        return {"thread": asdict(self.repository.save_thread(thread))}

    def archive_thread(self, thread_id: str) -> dict:
        return self.update_thread(thread_id, {"status": "archived"})

    def list_messages(self, project_id: str | None = None, folder: str | None = None) -> list[dict]:
        return [asdict(item) for item in self.repository.list_messages(project_id=project_id, folder=folder)]

    def get_message(self, message_id: str) -> dict:
        message = self._require_message(message_id)
        return {
            "message": asdict(message),
            "attachments": [asdict(item) for item in self.repository.list_attachments(message.id)],
            "links": [asdict(item) for item in self.repository.list_links(message_id=message.id)],
        }

    def update_message(self, message_id: str, payload: dict) -> dict:
        message = self._require_message(message_id)
        if payload.get("folder"):
            message.folder = payload["folder"]
        if payload.get("isRead") is not None:
            message.isRead = payload["isRead"]
        return {"message": asdict(self.repository.save_message(message))}

    def mark_read(self, message_id: str) -> dict:
        return self.update_message(message_id, {"isRead": True})

    def link_entity(self, message_id: str, payload: dict) -> dict:
        message = self._require_message(message_id)
        link = MailEntityLink(
            id=f"mail-link-{uuid4().hex[:8]}",
            projectId=payload["projectId"],
            threadId=message.threadId,
            messageId=message.id,
            entityType=payload["entityType"],
            entityId=payload["entityId"],
            relationType=payload.get("relationType") or "reference",
            confirmed=True,
            createdAt=self._now(),
        )
        stored = self.repository.save_link(link)
        audit_log = self._add_audit_log(
            entity_type="mail_message",
            entity_id=message.id,
            action="mail.link_entity",
            summary="메일 엔티티 연결이 저장되었습니다.",
            field_names=["projectId", "entityType", "entityId", "relationType"],
        )
        return {
            "message": asdict(message),
            "link": asdict(stored),
            "links": [asdict(item) for item in self.repository.list_links(message_id=message_id)],
            "auditLog": asdict(audit_log),
        }

    def classify_message(self, message_id: str) -> dict:
        message = self._require_message(message_id)
        links: list[MailEntityLink] = []
        if message.projectId:
            links.append(
                self.repository.save_link(
                    MailEntityLink(
                        id=f"mail-link-{uuid4().hex[:8]}",
                        projectId=message.projectId,
                        threadId=message.threadId,
                        messageId=message.id,
                        entityType="project",
                        entityId=message.projectId,
                        relationType="subject_match" if "제출" in (message.subject or "") else "contact_match",
                        confirmed=False,
                        createdAt=self._now(),
                    )
                )
            )
        if message.documentId or "보고서" in (message.subject or ""):
            links.append(
                self.repository.save_link(
                    MailEntityLink(
                        id=f"mail-link-{uuid4().hex[:8]}",
                        projectId=message.projectId,
                        threadId=message.threadId,
                        messageId=message.id,
                        entityType="document_instance",
                        entityId=message.documentId or "doc-sample-001",
                        relationType="submission_candidate",
                        confirmed=False,
                        createdAt=self._now(),
                    )
                )
            )
        return {
            "message": asdict(message),
            "links": [asdict(item) for item in links],
            "warnings": [],
        }

    def create_draft(self, payload: dict) -> dict:
        draft = MailDraft(
            id=f"mail-draft-{uuid4().hex[:8]}",
            draftType=payload["draftType"],
            mode=payload.get("mode") or "guest_draft_mode",
            projectId=payload.get("projectId"),
            inspectionRoundId=payload.get("inspectionRoundId"),
            ownerPartyId=payload.get("ownerPartyId"),
            documentId=payload.get("documentId"),
            submissionId=payload.get("submissionId"),
            findingIds=payload.get("findingIds", []),
            contractId=payload.get("contractId"),
            estimateId=payload.get("estimateId"),
            accountId=payload.get("accountId"),
            threadId=payload.get("threadId"),
            toAddresses=payload.get("toAddresses", []),
            ccAddresses=payload.get("ccAddresses", []),
            subject=payload.get("subject") or "",
            body=payload.get("body") or "",
            attachmentFileIds=payload.get("attachmentFileIds", []),
            templateId=payload.get("templateId"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_draft(draft)
        return {"draft": asdict(stored), "warnings": []}

    def get_draft(self, draft_id: str) -> dict:
        return {"draft": asdict(self._require_draft(draft_id))}

    def update_draft(self, draft_id: str, payload: dict) -> dict:
        draft = self._require_draft(draft_id)
        for field in [
            "mode",
            "accountId",
            "subject",
            "body",
            "templateId",
        ]:
            if payload.get(field) is not None:
                setattr(draft, field, payload[field])
        if payload.get("toAddresses") is not None:
            draft.toAddresses = payload["toAddresses"]
        if payload.get("ccAddresses") is not None:
            draft.ccAddresses = payload["ccAddresses"]
        if payload.get("attachmentFileIds") is not None:
            draft.attachmentFileIds = payload["attachmentFileIds"]
        draft.updatedAt = self._now()
        stored = self.repository.save_draft(draft)
        return {"draft": asdict(stored), "warnings": []}

    def generate_draft(self, draft_id: str, payload: dict | None = None) -> dict:
        draft = self._require_draft(draft_id)
        prompt = payload.get("prompt") if payload else None
        generated = draft.body or "안녕하세요.\n관련 자료를 검토하시고 회신 부탁드립니다."
        if prompt:
            generated = f"{generated}\n\n[AI DRAFT 메모] {prompt}"
        draft.aiDraftText = generated
        if not draft.body:
            draft.body = generated
        draft.updatedAt = self._now()
        stored = self.repository.save_draft(draft)
        return {"draft": asdict(stored), "warnings": ["ai_output_is_draft_only"]}

    def validate_draft(self, draft_id: str) -> dict:
        draft = self._require_draft(draft_id)
        warnings: list[str] = []
        missing: list[str] = []
        invalid = [item for item in draft.toAddresses if "@" not in item]
        if invalid:
            warnings.append("invalid_recipient_email")
        if not draft.toAddresses:
            missing.append("toAddresses")
        if not draft.subject:
            missing.append("subject")
        if draft.draftType == "submission_mail":
            if not draft.documentId:
                missing.append("documentId")
            document = self.safety_report_repository.get_document(draft.documentId) if draft.documentId else None
            if not document or not document.exportedFileId:
                warnings.append("exported_file_required")
            if document and document.ownerPartyId:
                owner_contacts = self._list_owner_report_contact_emails(document.projectId, document.ownerPartyId)
                if owner_contacts and any(address not in owner_contacts for address in draft.toAddresses):
                    warnings.append("owner_mismatch")
        if draft.draftType == "action_request" and not draft.findingIds:
            warnings.append("findingIds_required")
        draft.validationWarnings = warnings + [f"missing:{item}" for item in missing]
        stored = self.repository.save_draft(draft)
        return {
            "draftId": draft.id,
            "recipientsValid": not invalid,
            "missingFields": missing,
            "warnings": draft.validationWarnings,
            "sendBlocked": bool(invalid or missing or ("exported_file_required" in warnings)),
            "draft": asdict(stored),
        }

    def send_draft(self, draft_id: str, payload: dict | None = None) -> dict:
        draft = self._require_draft(draft_id)
        validation = self.validate_draft(draft_id)
        if draft.mode == "guest_draft_mode":
            return {
                "draft": validation["draft"],
                "sendMode": "copy_only",
                "warnings": ["guest_mode_blocks_provider_send"],
            }
        if validation["sendBlocked"]:
            raise MailboxValidationError("draft validation failed")
        return self._send_mail_payload(
            {
                "draftType": draft.draftType,
                "mode": draft.mode,
                "projectId": draft.projectId,
                "inspectionRoundId": draft.inspectionRoundId,
                "ownerPartyId": draft.ownerPartyId,
                "documentId": draft.documentId,
                "submissionId": draft.submissionId,
                "findingIds": draft.findingIds,
                "accountId": draft.accountId,
                "toAddresses": draft.toAddresses,
                "ccAddresses": draft.ccAddresses,
                "subject": draft.subject,
                "body": draft.body,
                "attachmentFileIds": draft.attachmentFileIds,
                "sentAt": payload.get("sentAt") if payload else None,
            },
            draft=draft,
        )

    def send_mail(self, payload: dict) -> dict:
        return self._send_mail_payload(payload, draft=None)

    def _send_mail_payload(self, payload: dict, draft: MailDraft | None) -> dict:
        project_id = payload.get("projectId")
        if not project_id:
            raise MailboxValidationError("projectId is required for send")
        thread = MailThread(
            id=f"mail-thread-{uuid4().hex[:8]}",
            projectId=project_id,
            inspectionRoundId=payload.get("inspectionRoundId"),
            ownerPartyId=payload.get("ownerPartyId"),
            subject=payload["subject"],
            participantContactIds=[],
            status="active",
            lastMessageAt=payload.get("sentAt") or self._now(),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        message = MailMessage(
            id=f"mail-message-{uuid4().hex[:8]}",
            projectId=project_id,
            threadId=thread.id,
            inspectionRoundId=payload.get("inspectionRoundId"),
            ownerPartyId=payload.get("ownerPartyId"),
            subject=payload["subject"],
            fromAddress="reports@anc.local",
            toAddresses=payload.get("toAddresses", []),
            ccAddresses=payload.get("ccAddresses", []),
            bodyText=payload.get("body"),
            direction="outbound",
            folder="sent",
            status="sent",
            isRead=True,
            documentId=payload.get("documentId"),
            submissionId=payload.get("submissionId"),
            receivedAt=payload.get("sentAt") or self._now(),
            sentAt=payload.get("sentAt") or self._now(),
            createdAt=self._now(),
        )
        self.repository.save_thread(thread)
        self.repository.save_message(message)
        submission = None
        document = None
        owner_report_task = None
        if payload["draftType"] == "submission_mail" and payload.get("documentId"):
            try:
                submitted = self.safety_report_service.mark_submitted(
                    payload["documentId"],
                    payload.get("sentAt"),
                    thread.id,
                    payload.get("submissionId"),
                )
                submission = submitted.get("submission")
                document = submitted.get("document")
                owner_report_task = submitted.get("ownerReportTask")
                message.submissionId = submitted.get("submissionId")
                message.documentId = payload["documentId"]
                self.repository.save_message(message)
            except SafetyReportValidationError as error:
                raise MailboxValidationError(str(error)) from error
        if payload["draftType"] == "action_request":
            for finding_id in payload.get("findingIds", []):
                finding = self.finding_repository.get_finding(finding_id)
                if not finding:
                    continue
                try:
                    self.finding_service.request_action(
                        finding_id,
                        {"requiredAction": finding.requiredAction or "메일 조치 요청"},
                    )
                except FindingValidationError as error:
                    raise MailboxValidationError(str(error)) from error
        if draft:
            draft.threadId = thread.id
            draft.sentAt = payload.get("sentAt") or self._now()
            draft.updatedAt = self._now()
            self.repository.save_draft(draft)
        audit_log = self._add_audit_log(
            entity_type="mail_thread",
            entity_id=thread.id,
            action="mail.sent",
            summary="메일 발송 기록이 생성되었습니다.",
            field_names=["draftType", "projectId", "documentId", "submissionId", "findingIds"],
        )
        return {
            "mailThread": asdict(thread),
            "message": asdict(message),
            "draft": asdict(draft) if draft else None,
            "submission": submission,
            "document": document,
            "ownerReportTask": owner_report_task,
            "warnings": [],
            "auditLog": asdict(audit_log),
        }

    def list_attachments(self, message_id: str) -> list[dict]:
        self._require_message(message_id)
        return [asdict(item) for item in self.repository.list_attachments(message_id)]

    def save_attachment_to_webhard(self, attachment_id: str) -> dict:
        attachment = self._require_attachment(attachment_id)
        folder = self.webhard_service.repository.find_folder_by_type(attachment.projectId, "mail_attachment")
        if not folder:
            raise MailboxValidationError("mail attachment folder missing")
        existing = next(
            (
                item
                for item in self.webhard_service.repository.list_files(project_id=attachment.projectId, folder_id=folder.id)
                if item.fileName == attachment.fileName
            ),
            None,
        )
        if existing:
            version = self.webhard_service.add_version(
                existing.id,
                {
                    "versionKind": "mail_attachment",
                    "fileName": attachment.fileName,
                    "sizeBytes": attachment.sizeBytes,
                    "changeSummary": "메일 첨부 중복 저장",
                },
            )
            attachment.savedFileId = existing.id
            attachment.linkedFileId = existing.id
            self.repository.save_attachment(attachment)
            audit_log = self._add_audit_log(
                entity_type="mail_attachment",
                entity_id=attachment.id,
                action="mail.attachment_saved",
                summary="메일 첨부파일이 웹하드 버전으로 저장되었습니다.",
                field_names=["savedFileId", "linkedFileId"],
            )
            return {"attachment": asdict(attachment), "file": version["file"], "version": version["version"], "auditLog": asdict(audit_log)}
        result = self.webhard_service.save_mail_attachment(
            attachment.messageId,
            {
                "projectId": attachment.projectId,
                "fileName": attachment.fileName,
                "mimeType": attachment.mimeType,
                "sizeBytes": attachment.sizeBytes,
                "tags": ["mail_attachment"],
            },
        )
        attachment.savedFileId = result["file"]["id"]
        attachment.linkedFileId = result["file"]["id"]
        self.repository.save_attachment(attachment)
        audit_log = self._add_audit_log(
            entity_type="mail_attachment",
            entity_id=attachment.id,
            action="mail.attachment_saved",
            summary="메일 첨부파일이 웹하드에 저장되었습니다.",
            field_names=["savedFileId", "linkedFileId"],
        )
        return {"attachment": asdict(attachment), **result, "auditLog": asdict(audit_log)}

    def save_bulk_attachments_to_webhard(self, payload: dict) -> dict:
        items = [self.save_attachment_to_webhard(attachment_id) for attachment_id in payload.get("attachmentIds", [])]
        return {"items": items}

    def link_attachment_file(self, attachment_id: str, payload: dict) -> dict:
        attachment = self._require_attachment(attachment_id)
        attachment.linkedFileId = payload["fileId"]
        attachment.savedFileId = payload["fileId"]
        stored = self.repository.save_attachment(attachment)
        return {"attachment": asdict(stored)}

    def create_submission_mail_draft(self, document_id: str, payload: dict | None = None) -> dict:
        document = self.safety_report_repository.get_document(document_id)
        if not document:
            raise MailboxNotFoundError("document not found")
        if not document.exportedFileId:
            raise MailboxValidationError("report submission requires exportedFileId")
        contacts = self._list_owner_report_contact_emails(document.projectId, document.ownerPartyId)
        resolved_payload = payload or {}
        return self.create_draft(
            {
                "draftType": "submission_mail",
                "mode": "connected_oauth_mode",
                "projectId": document.projectId,
                "inspectionRoundId": document.inspectionRoundId,
                "ownerPartyId": document.ownerPartyId,
                "documentId": document.id,
                "submissionId": document.submissionId,
                "toAddresses": contacts,
                "subject": resolved_payload.get("subject") or f"[A&C ERP] {document.title} 제출",
                "body": resolved_payload.get("body") or f"{document.title} 최종본을 첨부합니다.",
                "attachmentFileIds": [document.exportedFileId],
                "templateId": "mail-template-submission-001",
            }
        )

    def create_action_request_mail_draft(self, finding_id: str | None, payload: dict | None = None) -> dict:
        resolved_payload = payload or {}
        finding_ids = resolved_payload.get("findingIds")
        if not finding_ids and finding_id:
            finding_ids = [finding_id]
        if not finding_ids:
            raise MailboxValidationError("findingIds are required")
        first = self.finding_repository.get_finding(finding_ids[0])
        if not first:
            raise MailboxNotFoundError("finding not found")
        contacts = [item.email for item in self.project_repository.list_contacts(first.projectId) if item.receivesActionRequest and item.email]
        body = resolved_payload.get("body")
        if not body:
            titles = []
            for item_id in finding_ids:
                finding = self.finding_repository.get_finding(item_id)
                if finding:
                    titles.append(f"- {finding.title}")
            body = "아래 지적사항에 대한 조치 결과를 회신해 주시기 바랍니다.\n\n" + "\n".join(titles)
        return self.create_draft(
            {
                "draftType": "action_request",
                "mode": "connected_oauth_mode",
                "projectId": first.projectId,
                "inspectionRoundId": first.inspectionRoundId,
                "ownerPartyId": resolved_payload.get("ownerPartyId"),
                "findingIds": finding_ids,
                "toAddresses": contacts,
                "subject": resolved_payload.get("subject") or f"[A&C ERP] 조치 요청 - {first.inspectionRoundId}",
                "body": body,
                "attachmentFileIds": [],
                "templateId": "mail-template-action-001",
            }
        )

    def create_material_request_mail_draft(self, project_id: str) -> dict:
        project = self._require_project(project_id)
        return self.create_draft(
            {
                "draftType": "material_request",
                "mode": "guest_draft_mode",
                "projectId": project.id,
                "subject": f"[A&C ERP] {project.projectName} 자료 요청",
                "body": "프로젝트 자료 송부를 부탁드립니다.",
            }
        )

    def create_schedule_coordination_mail_draft(self, inspection_round_id: str) -> dict:
        round_item = self._require_round(inspection_round_id)
        return self.create_draft(
            {
                "draftType": "schedule_coordination",
                "mode": "connected_oauth_mode",
                "projectId": round_item.projectId,
                "inspectionRoundId": round_item.id,
                "subject": f"[A&C ERP] {round_item.name} 일정 협의",
                "body": "점검 일정 협의를 부탁드립니다.",
            }
        )

    def create_contract_mail_draft(self, contract_id: str) -> dict:
        contract = self.contract_repository.get_contract(contract_id)
        if not contract:
            raise MailboxNotFoundError("contract not found")
        return self.create_draft(
            {
                "draftType": "contract_send",
                "mode": "connected_oauth_mode",
                "projectId": contract.projectId,
                "subject": f"[A&C ERP] 계약서 송부 - {contract.contractNo}",
                "body": f"{contract.contractNo} 계약서를 송부드립니다.",
                "contractId": contract.id,
            }
        )

    def create_estimate_mail_draft(self, estimate_id: str) -> dict:
        estimate = self.contract_repository.get_estimate(estimate_id)
        if not estimate:
            raise MailboxNotFoundError("estimate not found")
        return self.create_draft(
            {
                "draftType": "estimate_send",
                "mode": "connected_oauth_mode",
                "projectId": estimate.projectId,
                "subject": f"[A&C ERP] 견적서 송부 - {estimate.estimateNo}",
                "body": f"{estimate.estimateNo} 견적서를 송부드립니다.",
                "estimateId": estimate.id,
            }
        )

    def list_templates(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_templates()]

    def create_template(self, payload: dict) -> dict:
        template = MailTemplate(
            id=f"mail-template-{uuid4().hex[:8]}",
            name=payload["name"],
            templateType=payload["templateType"],
            subjectTemplate=payload["subjectTemplate"],
            bodyTemplate=payload["bodyTemplate"],
            variables=payload.get("variables", []),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        return {"template": asdict(self.repository.save_template(template))}

    def get_template(self, template_id: str) -> dict:
        return {"template": asdict(self._require_template(template_id))}

    def update_template(self, template_id: str, payload: dict) -> dict:
        template = self._require_template(template_id)
        if payload.get("name"):
            template.name = payload["name"]
        if payload.get("subjectTemplate"):
            template.subjectTemplate = payload["subjectTemplate"]
        if payload.get("bodyTemplate"):
            template.bodyTemplate = payload["bodyTemplate"]
        if payload.get("variables") is not None:
            template.variables = payload["variables"]
        template.updatedAt = self._now()
        return {"template": asdict(self.repository.save_template(template))}

    def delete_template(self, template_id: str) -> dict:
        self._require_template(template_id)
        self.repository.delete_template(template_id)
        return {"deleted": True, "templateId": template_id}

    def list_signatures(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_signatures()]

    def create_signature(self, payload: dict) -> dict:
        signature = MailSignature(
            id=f"mail-signature-{uuid4().hex[:8]}",
            label=payload["label"],
            content=payload["content"],
            accountId=payload.get("accountId"),
            isDefault=payload.get("isDefault", False),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        return {"signature": asdict(self.repository.save_signature(signature))}

    def update_signature(self, signature_id: str, payload: dict) -> dict:
        signature = self._require_signature(signature_id)
        if payload.get("label"):
            signature.label = payload["label"]
        if payload.get("content"):
            signature.content = payload["content"]
        if payload.get("isDefault") is not None:
            signature.isDefault = payload["isDefault"]
        signature.updatedAt = self._now()
        return {"signature": asdict(self.repository.save_signature(signature))}

    def _require_account(self, account_id: str) -> MailAccount:
        item = self.repository.get_account(account_id)
        if not item:
            raise MailboxNotFoundError("mail account not found")
        return item

    def _require_thread(self, thread_id: str) -> MailThread:
        item = self.repository.get_thread(thread_id)
        if not item:
            raise MailboxNotFoundError("mail thread not found")
        return item

    def _require_message(self, message_id: str) -> MailMessage:
        item = self.repository.get_message(message_id)
        if not item:
            raise MailboxNotFoundError("mail message not found")
        return item

    def _require_attachment(self, attachment_id: str) -> MailAttachment:
        item = self.repository.get_attachment(attachment_id)
        if not item:
            raise MailboxNotFoundError("mail attachment not found")
        return item

    def _require_draft(self, draft_id: str) -> MailDraft:
        item = self.repository.get_draft(draft_id)
        if not item:
            raise MailboxNotFoundError("mail draft not found")
        return item

    def _require_template(self, template_id: str) -> MailTemplate:
        item = self.repository.get_template(template_id)
        if not item:
            raise MailboxNotFoundError("mail template not found")
        return item

    def _require_signature(self, signature_id: str) -> MailSignature:
        item = self.repository.get_signature(signature_id)
        if not item:
            raise MailboxNotFoundError("mail signature not found")
        return item

    def _require_project(self, project_id: str):
        item = self.project_repository.get_project(project_id)
        if not item:
            raise MailboxNotFoundError("project not found")
        return item

    def _require_round(self, inspection_round_id: str):
        item = self.inspection_repository.get_round(inspection_round_id)
        if not item:
            raise MailboxNotFoundError("inspection round not found")
        return item

    def _list_owner_report_contact_emails(self, project_id: str, owner_party_id: str | None) -> list[str]:
        contacts = [item for item in self.project_repository.list_contacts(project_id) if item.receivesReport and item.email]
        if not owner_party_id:
            return [item.email for item in contacts]
        allowed_org_ids = {
            item.organizationId
            for item in self.project_repository.list_project_parties(project_id)
            if item.ownerPartyId == owner_party_id
        }
        scoped = [item.email for item in contacts if item.organizationId in allowed_org_ids]
        return scoped or [item.email for item in contacts]

    def _add_audit_log(self, entity_type: str, entity_id: str, action: str, summary: str, field_names: list[str]) -> AuditLog:
        audit_log = AuditLog(
            id=f"audit-{uuid4().hex[:8]}",
            entityType=entity_type,
            entityId=entity_id,
            action=action,
            summary=summary,
            fieldNames=field_names,
            createdAt=self._now(),
        )
        return self.repository.save_audit_log(audit_log)
