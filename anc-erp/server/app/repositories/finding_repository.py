from copy import deepcopy

from server.app.domain.models import (
    ActionRequestMailDraft,
    AuditLog,
    CorrectiveAction,
    DocumentVersion,
    EvidencePhoto,
    MailThread,
    Finding,
    FindingTimelineEvent,
    PhotoLedger,
    PhotoLedgerEntry,
    PhotoLedgerWarning,
    PhotoMarkupInfo,
    PhotoMarkupShape,
)
from server.app.repositories.checklist_repository import ChecklistRepository
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.project_repository import ProjectRepository


class FindingRepository:
    def __init__(
        self,
        project_repository: ProjectRepository,
        inspection_repository: InspectionRepository,
        checklist_repository: ChecklistRepository,
    ) -> None:
        self.project_repository = project_repository
        self.inspection_repository = inspection_repository
        self.checklist_repository = checklist_repository
        self.findings: dict[str, Finding] = {}
        self.correctiveActions: dict[str, CorrectiveAction] = {}
        self.photos: dict[str, EvidencePhoto] = {}
        self.photoLedgers: dict[str, PhotoLedger] = {}
        self.photoLedgerEntries: dict[str, PhotoLedgerEntry] = {}
        self.photoLedgerWarnings: dict[str, list[PhotoLedgerWarning]] = {}
        self.timelineEvents: dict[str, list[FindingTimelineEvent]] = {}
        self.auditLogs: dict[str, list[AuditLog]] = {}
        self.mailDrafts: dict[str, ActionRequestMailDraft] = {}
        self.mailThreads: dict[str, MailThread] = {}
        self.documentSections: dict[str, dict] = {}
        self.documentVersions: dict[str, DocumentVersion] = {}
        self._seed()

    def _seed(self) -> None:
        project_id = "project-sample-001"
        round_id = "round-sample-001"
        created_at = "2026-05-10T09:00:00+09:00"
        seeded_rows = [
            (
                "finding-sample-001",
                "owner-samsung-cultural-foundation",
                "엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치 미비",
                "이동식 사다리 전도 방지를 위한 아웃트리거 설치 상태가 확인되지 않았습니다.",
                "fall",
                "엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치",
                "verified",
            ),
            (
                "finding-sample-002",
                "owner-samsung-cultural-foundation",
                "가설분전함 정·부 책임자 지정 미비",
                "가설분전함 정·부 책임자 표기가 누락되어 전기안전 관리주체가 불명확합니다.",
                "electric",
                "가설분전함 정·부 책임자 지정 및 지정관리자가 지속적 관리",
                "action_requested",
            ),
            (
                "finding-sample-003",
                "owner-samsung-life-foundation",
                "방우형 콘센트 덮개 파손으로 인해 감전사고 우려",
                "외부 사용 콘센트의 방우 덮개가 파손되어 감전 우려가 있습니다.",
                "electric",
                "파손된 방우형 콘센트 교체하여 사용",
                "action_requested",
            ),
            (
                "finding-sample-004",
                "owner-samsung-life-foundation",
                "가설분전함의 전선배선 피복 노출부 임시 보완처리 미비",
                "가설분전함 배선 피복 노출부의 절연 보완이 확인되지 않았습니다.",
                "electric",
                "가설분전함의 전선배선 피복 노출부 전기용 절연테이프로 보완조치",
                "open",
            ),
            (
                "finding-sample-005",
                "owner-samsung-life-foundation",
                "케이블 릴 전선 풀림상태 안전조치 미비",
                "케이블 릴 전선이 과도하게 풀려 넘어짐 및 접촉 위험이 있습니다.",
                "other",
                "케이블 릴 전선 2줄 이상 감김 상태 유지 확인",
                "action_requested",
            ),
        ]
        for index, (
            finding_id,
            owner_party_id,
            title,
            detail,
            risk_type,
            required_action,
            status,
        ) in enumerate(seeded_rows, start=1):
            finding = Finding(
                id=finding_id,
                projectId=project_id,
                inspectionRoundId=round_id,
                ownerPartyId=owner_party_id,
                title=title,
                detail=detail,
                riskType=risk_type,
                requiredAction=required_action,
                responsiblePartyId="project-party-contractor-001",
                dueDate=f"2026-05-{10 + index:02d}",
                status=status,
                sourceType="manual",
                sourceId=f"manual-source-{index:03d}",
                reportInclude=True,
                reportOrder=index,
                createdBy="user-inspector-001",
                createdAt=created_at,
                updatedAt=created_at,
            )
            self.findings[finding.id] = deepcopy(finding)
            self.timelineEvents[finding.id] = [
                FindingTimelineEvent(
                    id=f"finding-timeline-{index:03d}-01",
                    findingId=finding.id,
                    eventType="finding.created",
                    summary="지적사항이 등록되었습니다.",
                    createdAt=created_at,
                )
            ]
            self.auditLogs[finding.id] = [
                AuditLog(
                    id=f"finding-audit-{index:03d}-01",
                    entityType="finding",
                    entityId=finding.id,
                    action="finding.created",
                    summary="지적사항 초안이 생성되었습니다.",
                    fieldNames=["projectId", "inspectionRoundId", "ownerPartyId"],
                    createdAt=created_at,
                )
            ]

        action_rows = [
            (
                "action-sample-001",
                "finding-sample-001",
                "엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치",
                "verified",
                "2026-05-11",
                "2026-05-12T10:00:00+09:00",
            ),
            (
                "action-sample-002",
                "finding-sample-002",
                "가설분전함 정·부 책임자 지정 및 표지 부착",
                "submitted",
                "2026-05-12",
                None,
            ),
            (
                "action-sample-003",
                "finding-sample-003",
                "파손된 방우형 콘센트 교체",
                "submitted",
                "2026-05-13",
                None,
            ),
            (
                "action-sample-005",
                "finding-sample-005",
                "케이블 릴 전선 2줄 이상 감김 상태 유지 조치",
                "draft",
                None,
                None,
            ),
        ]
        for index, (action_id, finding_id, action_detail, status, action_date, verified_at) in enumerate(
            action_rows,
            start=1,
        ):
            finding = self.findings[finding_id]
            action = CorrectiveAction(
                id=action_id,
                findingId=finding_id,
                projectId=finding.projectId,
                inspectionRoundId=finding.inspectionRoundId,
                actionDetail=action_detail,
                actionDate=action_date,
                actionOrganizationId="org-contractor-001",
                submittedBy="contact-contractor-001",
                submittedAt=created_at if status in {"submitted", "verified"} else None,
                verifiedBy="user-engineer-001" if verified_at else None,
                verifiedAt=verified_at,
                verificationComment="현장 재확인 완료" if verified_at else None,
                status=status,
                createdAt=created_at,
                updatedAt=created_at,
            )
            self.correctiveActions[action.id] = deepcopy(action)
            self.timelineEvents.setdefault(finding_id, []).append(
                FindingTimelineEvent(
                    id=f"finding-timeline-{index:03d}-02",
                    findingId=finding_id,
                    eventType=f"corrective-action.{status}",
                    summary=f"조치현황이 {status} 상태로 등록되었습니다.",
                    createdAt=created_at,
                )
            )

        photo_rows = [
            (
                "photo-sample-001",
                "finding-sample-001",
                None,
                "finding_photo",
                "ladder_before.jpg",
                "/리움미술관 승강기 교체공사/02_지적사항/ladder_before.jpg",
                "아웃트리거 미설치 상태",
                True,
            ),
            (
                "photo-sample-002",
                "finding-sample-001",
                "action-sample-001",
                "action_photo",
                "ladder_after.jpg",
                "/리움미술관 승강기 교체공사/02_지적사항/ladder_after.jpg",
                "아웃트리거 설치 완료",
                True,
            ),
            (
                "photo-sample-003",
                "finding-sample-002",
                None,
                "finding_photo",
                "distribution_before.jpg",
                "/리움미술관 승강기 교체공사/02_지적사항/distribution_before.jpg",
                "책임자 표기 누락",
                True,
            ),
            (
                "photo-sample-004",
                "finding-sample-003",
                None,
                "finding_photo",
                "socket_before.jpg",
                "/리움미술관 승강기 교체공사/02_지적사항/socket_before.jpg",
                "방우 덮개 파손 상태",
                True,
            ),
            (
                "photo-sample-005",
                "finding-sample-004",
                None,
                "finding_photo",
                "insulation_before.jpg",
                "/리움미술관 승강기 교체공사/02_지적사항/insulation_before.jpg",
                "피복 노출 상태",
                False,
            ),
            (
                "photo-sample-006",
                "finding-sample-005",
                None,
                "finding_photo",
                "cable_before.jpg",
                "/리움미술관 승강기 교체공사/02_지적사항/cable_before.jpg",
                "케이블 릴 전선 풀림 상태",
                True,
            ),
        ]
        for index, (
            photo_id,
            finding_id,
            action_id,
            photo_type,
            file_name,
            storage_path,
            caption,
            representative,
        ) in enumerate(photo_rows, start=1):
            finding = self.findings[finding_id]
            markup = None
            if index == 1:
                markup = PhotoMarkupInfo(
                    id="photo-markup-sample-001",
                    photoId=photo_id,
                    shapes=[
                        PhotoMarkupShape(
                            id="photo-markup-shape-sample-001",
                            shapeType="ellipse",
                            x=0.34,
                            y=0.42,
                            width=0.24,
                            height=0.16,
                        )
                    ],
                    createdAt=created_at,
                    updatedAt=created_at,
                )
            photo = EvidencePhoto(
                id=photo_id,
                projectId=finding.projectId,
                inspectionRoundId=finding.inspectionRoundId,
                ownerPartyId=finding.ownerPartyId,
                findingId=finding_id,
                correctiveActionId=action_id,
                fileId=f"file-asset-{photo_id}",
                photoType=photo_type,
                fileName=file_name,
                storagePath=storage_path,
                caption=caption,
                representative=representative,
                markupInfo=markup,
                createdAt=created_at,
                updatedAt=created_at,
            )
            self.photos[photo.id] = deepcopy(photo)

        ledger_rows = [
            ("photo-ledger-sample-001", "owner-samsung-cultural-foundation", "삼성문화재단 사진대지", "doc-sample-001"),
            ("photo-ledger-sample-002", "owner-samsung-life-foundation", "삼성생명공익재단 사진대지", None),
        ]
        for index, (ledger_id, owner_party_id, title, document_id) in enumerate(ledger_rows, start=1):
            ledger = PhotoLedger(
                id=ledger_id,
                projectId=project_id,
                inspectionRoundId=round_id,
                ownerPartyId=owner_party_id,
                documentId=document_id,
                title=title,
                status="draft",
                createdAt=created_at,
                updatedAt=created_at,
            )
            self.photoLedgers[ledger.id] = deepcopy(ledger)
            self.photoLedgerWarnings[ledger.id] = []
            self.auditLogs.setdefault(ledger.id, []).append(
                AuditLog(
                    id=f"photo-ledger-audit-{index:03d}",
                    entityType="photo_ledger",
                    entityId=ledger.id,
                    action="photo-ledger.created",
                    summary="사진대지 초안이 생성되었습니다.",
                    fieldNames=["inspectionRoundId", "ownerPartyId", "documentId"],
                    createdAt=created_at,
                )
            )

        entry_rows = [
            (
                "photo-ledger-entry-sample-001",
                "photo-ledger-sample-001",
                "finding-sample-001",
                "action-sample-001",
                "photo-sample-001",
                "photo-sample-002",
                True,
                1,
            ),
            (
                "photo-ledger-entry-sample-002",
                "photo-ledger-sample-001",
                "finding-sample-002",
                "action-sample-002",
                "photo-sample-003",
                None,
                False,
                2,
            ),
            (
                "photo-ledger-entry-sample-003",
                "photo-ledger-sample-002",
                "finding-sample-003",
                "action-sample-003",
                "photo-sample-004",
                None,
                False,
                1,
            ),
            (
                "photo-ledger-entry-sample-004",
                "photo-ledger-sample-002",
                "finding-sample-005",
                "action-sample-005",
                "photo-sample-006",
                None,
                False,
                2,
            ),
        ]
        for (
            entry_id,
            ledger_id,
            finding_id,
            action_id,
            finding_photo_id,
            action_photo_id,
            confirmed,
            display_order,
        ) in entry_rows:
            finding = self.findings[finding_id]
            self.photoLedgerEntries[entry_id] = PhotoLedgerEntry(
                id=entry_id,
                photoLedgerId=ledger_id,
                projectId=finding.projectId,
                inspectionRoundId=finding.inspectionRoundId,
                ownerPartyId=finding.ownerPartyId,
                findingId=finding_id,
                correctiveActionId=action_id,
                findingPhotoId=finding_photo_id,
                actionPhotoId=action_photo_id,
                findingCaption=self.photos[finding_photo_id].caption if finding_photo_id else None,
                actionCaption=self.photos[action_photo_id].caption if action_photo_id else None,
                displayOrder=display_order,
                confirmed=confirmed,
                createdAt=created_at,
                updatedAt=created_at,
            )

        self.documentSections["doc-sample-001"] = {
            "documentId": "doc-sample-001",
            "documentVersionId": "document-version-sample-001",
            "sectionKey": "photo_ledger",
            "photoLedgerId": "photo-ledger-sample-001",
            "entryIds": ["photo-ledger-entry-sample-001", "photo-ledger-entry-sample-002"],
            "updatedAt": created_at,
        }
        self.documentVersions["document-version-sample-001"] = DocumentVersion(
            id="document-version-sample-001",
            documentId="doc-sample-001",
            projectId=project_id,
            inspectionRoundId=round_id,
            ownerPartyId="owner-samsung-cultural-foundation",
            sourcePhotoLedgerId="photo-ledger-sample-001",
            sectionKey="photo_ledger",
            createdAt=created_at,
        )
        self._sync_project(project_id)

    def _sync_project(self, project_id: str) -> None:
        counts = self.project_repository.get_related_counts(project_id)
        counts.openFindings = len(
            [
                item
                for item in self.findings.values()
                if item.projectId == project_id and item.status != "closed"
            ]
        )
        self.project_repository.set_related_counts(project_id, counts)

    def list_project_findings(self, project_id: str) -> list[Finding]:
        return sorted(
            [deepcopy(item) for item in self.findings.values() if item.projectId == project_id],
            key=lambda item: (item.reportOrder or 9999, item.createdAt, item.id),
        )

    def list_round_findings(self, inspection_round_id: str) -> list[Finding]:
        return sorted(
            [deepcopy(item) for item in self.findings.values() if item.inspectionRoundId == inspection_round_id],
            key=lambda item: (item.reportOrder or 9999, item.createdAt, item.id),
        )

    def get_finding(self, finding_id: str) -> Finding | None:
        item = self.findings.get(finding_id)
        return deepcopy(item) if item else None

    def save_finding(self, finding: Finding) -> Finding:
        self.findings[finding.id] = deepcopy(finding)
        self._sync_project(finding.projectId)
        return deepcopy(finding)

    def delete_finding(self, finding_id: str) -> None:
        finding = self.findings.pop(finding_id, None)
        if not finding:
            return
        for action in self.list_corrective_actions(finding_id):
            self.correctiveActions.pop(action.id, None)
        for photo in self.list_finding_photos(finding_id):
            self.photos.pop(photo.id, None)
        self.timelineEvents.pop(finding_id, None)
        self.auditLogs.pop(finding_id, None)
        entry_ids = [item.id for item in self.photoLedgerEntries.values() if item.findingId == finding_id]
        for entry_id in entry_ids:
            self.photoLedgerEntries.pop(entry_id, None)
        self._sync_project(finding.projectId)

    def find_duplicate_source(
        self,
        project_id: str,
        inspection_round_id: str,
        source_type: str | None,
        source_id: str | None,
        exclude_finding_id: str | None = None,
    ) -> Finding | None:
        if not source_type or not source_id:
            return None
        for finding in self.findings.values():
            if finding.id == exclude_finding_id:
                continue
            if (
                finding.projectId == project_id
                and finding.inspectionRoundId == inspection_round_id
                and finding.sourceType == source_type
                and finding.sourceId == source_id
            ):
                return deepcopy(finding)
        return None

    def list_corrective_actions(self, finding_id: str) -> list[CorrectiveAction]:
        return [
            deepcopy(item)
            for item in self.correctiveActions.values()
            if item.findingId == finding_id
        ]

    def get_corrective_action(self, action_id: str) -> CorrectiveAction | None:
        item = self.correctiveActions.get(action_id)
        return deepcopy(item) if item else None

    def save_corrective_action(self, action: CorrectiveAction) -> CorrectiveAction:
        self.correctiveActions[action.id] = deepcopy(action)
        return deepcopy(action)

    def delete_corrective_action(self, action_id: str) -> None:
        self.correctiveActions.pop(action_id, None)

    def list_finding_photos(self, finding_id: str) -> list[EvidencePhoto]:
        return [
            deepcopy(item)
            for item in self.photos.values()
            if item.findingId == finding_id
        ]

    def get_photo(self, photo_id: str) -> EvidencePhoto | None:
        item = self.photos.get(photo_id)
        return deepcopy(item) if item else None

    def save_photo(self, photo: EvidencePhoto) -> EvidencePhoto:
        self.photos[photo.id] = deepcopy(photo)
        return deepcopy(photo)

    def delete_photo(self, photo_id: str) -> None:
        self.photos.pop(photo_id, None)

    def list_photo_ledgers(self, inspection_round_id: str) -> list[PhotoLedger]:
        return [
            deepcopy(item)
            for item in self.photoLedgers.values()
            if item.inspectionRoundId == inspection_round_id
        ]

    def get_photo_ledger(self, photo_ledger_id: str) -> PhotoLedger | None:
        item = self.photoLedgers.get(photo_ledger_id)
        return deepcopy(item) if item else None

    def save_photo_ledger(self, photo_ledger: PhotoLedger) -> PhotoLedger:
        self.photoLedgers[photo_ledger.id] = deepcopy(photo_ledger)
        return deepcopy(photo_ledger)

    def delete_photo_ledger(self, photo_ledger_id: str) -> None:
        self.photoLedgers.pop(photo_ledger_id, None)
        self.photoLedgerWarnings.pop(photo_ledger_id, None)
        entry_ids = [item.id for item in self.photoLedgerEntries.values() if item.photoLedgerId == photo_ledger_id]
        for entry_id in entry_ids:
            self.photoLedgerEntries.pop(entry_id, None)

    def list_photo_ledger_entries(self, photo_ledger_id: str) -> list[PhotoLedgerEntry]:
        return sorted(
            [
                deepcopy(item)
                for item in self.photoLedgerEntries.values()
                if item.photoLedgerId == photo_ledger_id
            ],
            key=lambda item: item.displayOrder,
        )

    def get_photo_ledger_entry(self, entry_id: str) -> PhotoLedgerEntry | None:
        item = self.photoLedgerEntries.get(entry_id)
        return deepcopy(item) if item else None

    def save_photo_ledger_entry(self, entry: PhotoLedgerEntry) -> PhotoLedgerEntry:
        self.photoLedgerEntries[entry.id] = deepcopy(entry)
        return deepcopy(entry)

    def delete_photo_ledger_entry(self, entry_id: str) -> None:
        self.photoLedgerEntries.pop(entry_id, None)

    def list_photo_ledger_warnings(self, photo_ledger_id: str) -> list[PhotoLedgerWarning]:
        return deepcopy(self.photoLedgerWarnings.get(photo_ledger_id, []))

    def replace_photo_ledger_warnings(
        self,
        photo_ledger_id: str,
        warnings: list[PhotoLedgerWarning],
    ) -> list[PhotoLedgerWarning]:
        self.photoLedgerWarnings[photo_ledger_id] = deepcopy(warnings)
        return deepcopy(warnings)

    def list_timeline_events(self, finding_id: str) -> list[FindingTimelineEvent]:
        return deepcopy(self.timelineEvents.get(finding_id, []))

    def add_timeline_event(self, event: FindingTimelineEvent) -> FindingTimelineEvent:
        self.timelineEvents.setdefault(event.findingId, []).append(deepcopy(event))
        return deepcopy(event)

    def list_audit_logs(self, entity_id: str) -> list[AuditLog]:
        return deepcopy(self.auditLogs.get(entity_id, []))

    def add_audit_log(self, log: AuditLog) -> AuditLog:
        self.auditLogs.setdefault(log.entityId, []).append(deepcopy(log))
        return deepcopy(log)

    def save_mail_draft(self, draft: ActionRequestMailDraft) -> ActionRequestMailDraft:
        self.mailDrafts[draft.id] = deepcopy(draft)
        return deepcopy(draft)

    def get_mail_draft(self, draft_id: str) -> ActionRequestMailDraft | None:
        item = self.mailDrafts.get(draft_id)
        return deepcopy(item) if item else None

    def save_mail_thread(self, thread: MailThread) -> MailThread:
        self.mailThreads[thread.id] = deepcopy(thread)
        return deepcopy(thread)

    def get_mail_thread(self, thread_id: str) -> MailThread | None:
        item = self.mailThreads.get(thread_id)
        return deepcopy(item) if item else None

    def save_document_section(self, document_id: str, payload: dict) -> dict:
        self.documentSections[document_id] = deepcopy(payload)
        return deepcopy(payload)

    def get_document_section(self, document_id: str) -> dict | None:
        payload = self.documentSections.get(document_id)
        return deepcopy(payload) if payload else None

    def save_document_version(self, version: DocumentVersion) -> DocumentVersion:
        self.documentVersions[version.id] = deepcopy(version)
        return deepcopy(version)

    def get_document_version(self, version_id: str) -> DocumentVersion | None:
        item = self.documentVersions.get(version_id)
        return deepcopy(item) if item else None
