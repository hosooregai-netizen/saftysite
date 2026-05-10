from copy import deepcopy

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
from server.app.repositories.project_repository import ProjectRepository


class MailRepository:
    def __init__(self, project_repository: ProjectRepository) -> None:
        self.project_repository = project_repository
        self.accounts: dict[str, MailAccount] = {}
        self.threads: dict[str, MailThread] = {}
        self.messages: dict[str, MailMessage] = {}
        self.attachments: dict[str, MailAttachment] = {}
        self.drafts: dict[str, MailDraft] = {}
        self.links: dict[str, MailEntityLink] = {}
        self.templates: dict[str, MailTemplate] = {}
        self.signatures: dict[str, MailSignature] = {}
        self.sync_jobs: dict[str, MailSyncJob] = {}
        self.provider_events: dict[str, MailProviderEvent] = {}
        self.audit_logs: dict[str, list[AuditLog]] = {}
        self._seed()

    def _seed(self) -> None:
        project = self.project_repository.get_project("project-sample-001")
        if not project:
            return
        timestamp = "2026-05-10T09:00:00+09:00"
        guest = MailAccount(
            id="mail-account-guest-001",
            provider="guest",
            mode="guest_draft_mode",
            email="guest-draft@anc.local",
            displayName="A&C Guest Draft",
            projectId=project.id,
            status="active",
            isConnected=False,
            createdAt=timestamp,
            updatedAt=timestamp,
        )
        connected = MailAccount(
            id="mail-account-google-001",
            provider="google",
            mode="connected_oauth_mode",
            email="reports@anc.local",
            displayName="A&C Reports",
            projectId=project.id,
            status="active",
            isConnected=True,
            lastSyncedAt="2026-05-10T10:00:00+09:00",
            createdAt=timestamp,
            updatedAt="2026-05-10T10:00:00+09:00",
        )
        self.save_account(guest)
        self.save_account(connected)
        self.save_signature(
            MailSignature(
                id="mail-signature-001",
                label="기본 서명",
                content="A&C기술사사무소\n기술지도팀",
                accountId=connected.id,
                isDefault=True,
                createdAt=timestamp,
                updatedAt=timestamp,
            )
        )
        self.save_template(
            MailTemplate(
                id="mail-template-submission-001",
                name="보고서 제출 메일",
                templateType="submission",
                subjectTemplate="[A&C ERP] {{documentTitle}} 제출",
                bodyTemplate="첨부한 {{documentTitle}} 검토 부탁드립니다.",
                variables=["documentTitle", "ownerName"],
                createdAt=timestamp,
                updatedAt=timestamp,
            )
        )
        self.save_template(
            MailTemplate(
                id="mail-template-action-001",
                name="지적사항 조치 요청",
                templateType="action_request",
                subjectTemplate="[A&C ERP] 조치 요청 - {{inspectionRoundName}}",
                bodyTemplate="아래 지적사항에 대한 조치 결과를 회신해 주시기 바랍니다.",
                variables=["inspectionRoundName", "findingTitles"],
                createdAt=timestamp,
                updatedAt=timestamp,
            )
        )
        self.save_sync_job(
            MailSyncJob(
                id="mail-sync-job-001",
                accountId=connected.id,
                status="completed",
                summary="프로젝트 제출/회신 메일 2건 동기화",
                startedAt="2026-05-10T09:55:00+09:00",
                completedAt="2026-05-10T10:00:00+09:00",
            )
        )
        submission_thread = MailThread(
            id="mail-thread-sample-001",
            projectId=project.id,
            providerThreadId="provider-thread-sample-001",
            inspectionRoundId="round-sample-001",
            ownerPartyId="owner-samsung-cultural-foundation",
            subject="[A&C ERP] 공사안전보건대장 이행확인 보고서 제출",
            participantContactIds=["contact-owner-001"],
            status="active",
            lastMessageAt="2026-05-10T10:05:00+09:00",
            createdAt=timestamp,
            updatedAt="2026-05-10T10:05:00+09:00",
        )
        action_thread = MailThread(
            id="mail-thread-sample-002",
            projectId=project.id,
            providerThreadId="provider-thread-sample-002",
            inspectionRoundId="round-sample-001",
            subject="[A&C ERP] 조치 요청 - 1차 정기점검",
            participantContactIds=["contact-contractor-001"],
            linkedFindingIds=["finding-sample-001"],
            status="active",
            lastMessageAt="2026-05-09T14:30:00+09:00",
            createdAt="2026-05-09T14:00:00+09:00",
            updatedAt="2026-05-09T14:30:00+09:00",
        )
        self.save_thread(submission_thread)
        self.save_thread(action_thread)
        message_1 = MailMessage(
            id="mail-message-sample-001",
            projectId=project.id,
            threadId=submission_thread.id,
            providerMessageId="provider-message-sample-001",
            inspectionRoundId="round-sample-001",
            ownerPartyId="owner-samsung-cultural-foundation",
            subject=submission_thread.subject,
            fromAddress="reports@anc.local",
            toAddresses=["owner1@example.com"],
            bodyText="첨부한 공사안전보건대장 이행확인 보고서 최종본을 검토해 주십시오.",
            direction="outbound",
            folder="sent",
            status="sent",
            isRead=True,
            documentId="doc-sample-001",
            submissionId="submission-doc-sample-001",
            sentAt="2026-05-10T10:05:00+09:00",
            receivedAt="2026-05-10T10:05:00+09:00",
            createdAt="2026-05-10T10:05:00+09:00",
        )
        message_2 = MailMessage(
            id="mail-message-sample-002",
            projectId=project.id,
            threadId=action_thread.id,
            providerMessageId="provider-message-sample-002",
            inspectionRoundId="round-sample-001",
            subject=action_thread.subject,
            fromAddress="contractor@example.com",
            toAddresses=["reports@anc.local"],
            bodyText="조치 예정일을 이번 주 금요일로 조정해 검토 요청드립니다.",
            direction="inbound",
            folder="inbox",
            status="received",
            isRead=False,
            receivedAt="2026-05-09T14:30:00+09:00",
            createdAt="2026-05-09T14:30:00+09:00",
        )
        self.save_message(message_1)
        self.save_message(message_2)
        self.save_attachment(
            MailAttachment(
                id="mail-attachment-sample-001",
                messageId=message_1.id,
                projectId=project.id,
                fileName="제출본_이행확인보고서.pdf",
                mimeType="application/pdf",
                sizeBytes=2480000,
                savedFileId="file-asset-webhard-sample-001",
                linkedFileId="file-asset-webhard-sample-001",
                createdAt=message_1.createdAt,
            )
        )
        self.save_attachment(
            MailAttachment(
                id="mail-attachment-sample-002",
                messageId=message_2.id,
                projectId=project.id,
                fileName="현장보완계획.pdf",
                mimeType="application/pdf",
                sizeBytes=990000,
                createdAt=message_2.createdAt,
            )
        )
        self.save_link(
            MailEntityLink(
                id="mail-link-sample-001",
                projectId=project.id,
                threadId=submission_thread.id,
                messageId=message_1.id,
                entityType="document_instance",
                entityId="doc-sample-001",
                relationType="submission",
                createdAt=message_1.createdAt,
            )
        )
        self.save_link(
            MailEntityLink(
                id="mail-link-sample-002",
                projectId=project.id,
                threadId=submission_thread.id,
                messageId=message_1.id,
                entityType="submission",
                entityId="submission-doc-sample-001",
                relationType="submitted_via",
                createdAt=message_1.createdAt,
            )
        )
        self.save_link(
            MailEntityLink(
                id="mail-link-sample-003",
                projectId=project.id,
                threadId=action_thread.id,
                messageId=message_2.id,
                entityType="finding",
                entityId="finding-sample-001",
                relationType="action_request",
                createdAt=message_2.createdAt,
            )
        )
        self.save_provider_event(
            MailProviderEvent(
                id="mail-provider-event-001",
                accountId=connected.id,
                eventType="sync.completed",
                threadId=submission_thread.id,
                payloadSummary="2 threads synchronized",
                createdAt="2026-05-10T10:00:00+09:00",
            )
        )

    def list_accounts(self) -> list[MailAccount]:
        return [deepcopy(item) for item in self.accounts.values()]

    def get_account(self, account_id: str) -> MailAccount | None:
        item = self.accounts.get(account_id)
        return deepcopy(item) if item else None

    def save_account(self, account: MailAccount) -> MailAccount:
        self.accounts[account.id] = deepcopy(account)
        return deepcopy(account)

    def delete_account(self, account_id: str) -> None:
        self.accounts.pop(account_id, None)

    def list_threads(self, project_id: str | None = None, folder: str | None = None) -> list[MailThread]:
        rows = [deepcopy(item) for item in self.threads.values() if project_id is None or item.projectId == project_id]
        if folder:
            thread_ids = {
                message.threadId
                for message in self.messages.values()
                if message.threadId and message.folder == folder and (project_id is None or message.projectId == project_id)
            }
            rows = [item for item in rows if item.id in thread_ids]
        return sorted(rows, key=lambda item: item.lastMessageAt or item.updatedAt, reverse=True)

    def get_thread(self, thread_id: str) -> MailThread | None:
        item = self.threads.get(thread_id)
        return deepcopy(item) if item else None

    def find_thread_by_provider_id(self, provider_thread_id: str) -> MailThread | None:
        for item in self.threads.values():
            if item.providerThreadId == provider_thread_id:
                return deepcopy(item)
        return None

    def save_thread(self, thread: MailThread) -> MailThread:
        self.threads[thread.id] = deepcopy(thread)
        return deepcopy(thread)

    def list_messages(
        self,
        project_id: str | None = None,
        folder: str | None = None,
        thread_id: str | None = None,
    ) -> list[MailMessage]:
        rows = [
            deepcopy(item)
            for item in self.messages.values()
            if (project_id is None or item.projectId == project_id)
            and (folder is None or item.folder == folder)
            and (thread_id is None or item.threadId == thread_id)
        ]
        return sorted(rows, key=lambda item: item.receivedAt or item.sentAt or item.createdAt, reverse=True)

    def get_message(self, message_id: str) -> MailMessage | None:
        item = self.messages.get(message_id)
        return deepcopy(item) if item else None

    def find_message_by_provider_id(self, provider_message_id: str) -> MailMessage | None:
        for item in self.messages.values():
            if item.providerMessageId == provider_message_id:
                return deepcopy(item)
        return None

    def save_message(self, message: MailMessage) -> MailMessage:
        self.messages[message.id] = deepcopy(message)
        return deepcopy(message)

    def list_attachments(self, message_id: str) -> list[MailAttachment]:
        return [deepcopy(item) for item in self.attachments.values() if item.messageId == message_id]

    def get_attachment(self, attachment_id: str) -> MailAttachment | None:
        item = self.attachments.get(attachment_id)
        return deepcopy(item) if item else None

    def save_attachment(self, attachment: MailAttachment) -> MailAttachment:
        self.attachments[attachment.id] = deepcopy(attachment)
        return deepcopy(attachment)

    def list_links(
        self,
        thread_id: str | None = None,
        message_id: str | None = None,
        project_id: str | None = None,
    ) -> list[MailEntityLink]:
        rows = [
            deepcopy(item)
            for item in self.links.values()
            if (thread_id is None or item.threadId == thread_id)
            and (message_id is None or item.messageId == message_id)
            and (project_id is None or item.projectId == project_id)
        ]
        return rows

    def save_link(self, link: MailEntityLink) -> MailEntityLink:
        self.links[link.id] = deepcopy(link)
        return deepcopy(link)

    def list_drafts(self, project_id: str | None = None) -> list[MailDraft]:
        return [
            deepcopy(item)
            for item in self.drafts.values()
            if project_id is None or item.projectId == project_id
        ]

    def get_draft(self, draft_id: str) -> MailDraft | None:
        item = self.drafts.get(draft_id)
        return deepcopy(item) if item else None

    def save_draft(self, draft: MailDraft) -> MailDraft:
        self.drafts[draft.id] = deepcopy(draft)
        return deepcopy(draft)

    def list_templates(self) -> list[MailTemplate]:
        return [deepcopy(item) for item in self.templates.values()]

    def get_template(self, template_id: str) -> MailTemplate | None:
        item = self.templates.get(template_id)
        return deepcopy(item) if item else None

    def save_template(self, template: MailTemplate) -> MailTemplate:
        self.templates[template.id] = deepcopy(template)
        return deepcopy(template)

    def delete_template(self, template_id: str) -> None:
        self.templates.pop(template_id, None)

    def list_signatures(self) -> list[MailSignature]:
        return [deepcopy(item) for item in self.signatures.values()]

    def get_signature(self, signature_id: str) -> MailSignature | None:
        item = self.signatures.get(signature_id)
        return deepcopy(item) if item else None

    def save_signature(self, signature: MailSignature) -> MailSignature:
        self.signatures[signature.id] = deepcopy(signature)
        return deepcopy(signature)

    def list_sync_jobs(self, account_id: str) -> list[MailSyncJob]:
        return [
            deepcopy(item)
            for item in self.sync_jobs.values()
            if item.accountId == account_id
        ]

    def save_sync_job(self, job: MailSyncJob) -> MailSyncJob:
        self.sync_jobs[job.id] = deepcopy(job)
        return deepcopy(job)

    def save_provider_event(self, event: MailProviderEvent) -> MailProviderEvent:
        self.provider_events[event.id] = deepcopy(event)
        return deepcopy(event)

    def list_audit_logs(self, entity_type: str, entity_id: str) -> list[AuditLog]:
        return [deepcopy(item) for item in self.audit_logs.get(f"{entity_type}:{entity_id}", [])]

    def save_audit_log(self, audit_log: AuditLog) -> AuditLog:
        key = f"{audit_log.entityType}:{audit_log.entityId}"
        self.audit_logs.setdefault(key, []).append(deepcopy(audit_log))
        return deepcopy(audit_log)
