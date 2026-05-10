from copy import deepcopy
from dataclasses import asdict

from server.app.domain.models import (
    DocumentInstance,
    DocumentVersion,
    FileAsset,
    MailThread,
    MissingField,
    ReviewWarning,
    SafetyReportExportJob,
    SafetyReportMeta,
    SafetyReportSection,
    SafetyReportSnapshot,
    Submission,
    SourceLink,
)
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.project_repository import ProjectRepository


SECTION_ROWS = [
    ("cover", "표지"),
    ("project_summary", "공사 개요"),
    ("site_photo_summary", "현장 사진 요약"),
    ("inspection_checklist", "점검 체크리스트"),
    ("implementation_confirmation", "이행확인"),
    ("risk_reduction_checklist", "위험성 감소대책"),
    ("additional_hazard_checklist", "추가 위험요인"),
    ("safety_cost_usage", "산업안전보건관리비 사용내용"),
    ("photo_ledger", "사진대지"),
    ("schedule_attachments", "공정표 첨부"),
]


class SafetyReportRepository:
    def __init__(
        self,
        project_repository: ProjectRepository,
        inspection_repository: InspectionRepository,
    ) -> None:
        self.project_repository = project_repository
        self.inspection_repository = inspection_repository
        self.documents: dict[str, DocumentInstance] = {}
        self.snapshots: dict[str, SafetyReportSnapshot] = {}
        self.versions: dict[str, list[DocumentVersion]] = {}
        self.exportJobs: dict[str, SafetyReportExportJob] = {}
        self.fileAssets: dict[str, FileAsset] = {}
        self.mailThreads: dict[str, MailThread] = {}
        self.submissions: dict[str, Submission] = {}
        self._seed()

    def _seed(self) -> None:
        created_at = "2026-05-10T09:00:00+09:00"
        round_item = self.inspection_repository.get_round("round-sample-001")
        project = self.project_repository.get_project("project-sample-001")
        if not round_item or not project:
            return
        owner_party_id = "owner-samsung-cultural-foundation"
        owner_display_name = self._owner_display_name(project.id, owner_party_id)
        snapshot = self._build_base_snapshot(
            document_id="doc-sample-001",
            project_id=project.id,
            inspection_round_id=round_item.id,
            owner_party_id=owner_party_id,
            owner_display_name=owner_display_name,
            template_id="template-safety-report-v1",
            generation_mode="from_linked_data",
            created_at=created_at,
            document_no=round_item.documentNo,
            round_no=round_item.roundNo,
            project_name=project.projectName,
            site_address=project.siteAddress,
            contractor_name=self._contractor_name(project.id),
            inspection_date=round_item.actualInspectionDate or round_item.plannedDate,
        )
        document = DocumentInstance(
            id="doc-sample-001",
            projectId=project.id,
            inspectionRoundId=round_item.id,
            ownerPartyId=owner_party_id,
            ownerReportTaskId="owner-report-task-001-01",
            templateId="template-safety-report-v1",
            title="공사안전보건대장 이행확인 보고서",
            documentNo=round_item.documentNo,
            roundNo=round_item.roundNo,
            status="draft",
            contentSnapshot=asdict(snapshot),
            latestVersionNo=1,
            createdAt=created_at,
            updatedAt=created_at,
        )
        version = DocumentVersion(
            id="document-version-safety-report-001",
            documentId=document.id,
            projectId=document.projectId,
            inspectionRoundId=document.inspectionRoundId,
            ownerPartyId=document.ownerPartyId,
            versionNo=1,
            contentSnapshot=asdict(snapshot),
            createdBy="system",
            createdAt=created_at,
            changeSummary="초기 초안 생성",
        )
        self.documents[document.id] = deepcopy(document)
        self.snapshots[document.id] = deepcopy(snapshot)
        self.versions[document.id] = [deepcopy(version)]
        self._sync_round_document(document)
        task = self.inspection_repository.get_owner_report_task("owner-report-task-001-01")
        if task:
            task.documentInstanceId = document.id
            self.inspection_repository.save_owner_report_task(task)

    def _build_base_snapshot(
        self,
        document_id: str,
        project_id: str,
        inspection_round_id: str,
        owner_party_id: str,
        owner_display_name: str,
        template_id: str,
        generation_mode: str,
        created_at: str,
        document_no: str | None,
        round_no: int,
        project_name: str,
        site_address: str,
        contractor_name: str | None,
        inspection_date: str | None,
    ) -> SafetyReportSnapshot:
        meta = SafetyReportMeta(
            documentId=document_id,
            projectId=project_id,
            inspectionRoundId=inspection_round_id,
            ownerPartyId=owner_party_id,
            ownerDisplayName=owner_display_name,
            templateId=template_id,
            generatedMode=generation_mode,
        )
        source_links = [
            SourceLink(
                id=f"source-link-{document_id}-project",
                sectionKey="project_summary",
                sourceEntityType="project",
                sourceEntityId=project_id,
                sourceLabel="프로젝트 원장",
                sourceUpdatedAt=created_at,
                linkedAt=created_at,
            ),
            SourceLink(
                id=f"source-link-{document_id}-inspection-round",
                sectionKey="cover",
                sourceEntityType="inspection_round",
                sourceEntityId=inspection_round_id,
                sourceLabel="점검회차",
                sourceUpdatedAt=created_at,
                linkedAt=created_at,
            ),
            SourceLink(
                id=f"source-link-{document_id}-owner",
                sectionKey="cover",
                sourceEntityType="owner_party",
                sourceEntityId=owner_party_id,
                sourceLabel="발주처 분기",
                sourceUpdatedAt=created_at,
                linkedAt=created_at,
            ),
        ]
        sections = [
            SafetyReportSection(
                id=f"section-{document_id}-{key}",
                key=key,
                title=title,
                status="ai_draft" if key in {"cover", "project_summary"} else "review",
                order=index,
                content={
                    "title": title,
                    "documentNo": document_no,
                    "roundNo": round_no,
                    "projectName": project_name,
                    "siteAddress": site_address,
                    "ownerDisplayName": owner_display_name,
                    "inspectionDate": inspection_date,
                    "draftNote": "Linked-data draft. Human review required.",
                },
                sourceEntityRefs=[link for link in source_links if link.sectionKey in {key, "cover"}],
                updatedAt=created_at,
            )
            for index, (key, title) in enumerate(SECTION_ROWS, start=1)
        ]
        missing_fields = []
        if not contractor_name:
            missing_fields.append(
                MissingField(
                    field="contractorName",
                    message="시공사명이 연결되지 않았습니다.",
                    severity="recommended",
                    label="시공사명",
                    sectionKey="project_summary",
                    reason="프로젝트 관계자 원장에서 시공사 연결을 확인하세요.",
                    sourceEntityType="project_party",
                )
            )
        warnings = [
            ReviewWarning(
                type="legal_text_review_required",
                message="법정 고정 문구는 템플릿 본문을 우선 확인해야 합니다.",
                severity="warning",
                sectionKey="cover",
            )
        ]
        variables = {
            "projectName": project_name,
            "siteAddress": site_address,
            "contractorName": contractor_name,
            "inspectionRoundId": inspection_round_id,
            "inspectionDate": inspection_date,
            "ownerPartyId": owner_party_id,
            "ownerDisplayName": owner_display_name,
            "documentNo": document_no,
            "roundNo": round_no,
        }
        return SafetyReportSnapshot(
            meta=meta,
            variables=variables,
            sections=sections,
            missingFields=missing_fields,
            reviewWarnings=warnings,
            sourceLinks=source_links,
        )

    def _owner_display_name(self, project_id: str, owner_party_id: str) -> str:
        parties = self.project_repository.list_project_parties(project_id)
        organizations = {item.id: item.name for item in self.project_repository.list_organizations()}
        party = next((item for item in parties if item.ownerPartyId == owner_party_id), None)
        if not party:
            return owner_party_id
        return organizations.get(party.organizationId, owner_party_id)

    def _contractor_name(self, project_id: str) -> str | None:
        organizations = {item.id: item.name for item in self.project_repository.list_organizations()}
        party = next(
            (item for item in self.project_repository.list_project_parties(project_id) if item.role == "contractor"),
            None,
        )
        if not party:
            return None
        return organizations.get(party.organizationId)

    def _sync_round_document(self, document: DocumentInstance) -> None:
        round_item = self.inspection_repository.get_round(document.inspectionRoundId)
        if not round_item:
            return
        updated_rows = [item for item in round_item.documentInstances if item.id != document.id]
        updated_rows.append(deepcopy(document))
        round_item.documentInstances = sorted(updated_rows, key=lambda item: item.id)
        self.inspection_repository.update_round(round_item.id, round_item)

    def list_project_documents(self, project_id: str) -> list[DocumentInstance]:
        return [deepcopy(item) for item in self.documents.values() if item.projectId == project_id and item.status != "archived"]

    def get_document(self, document_id: str) -> DocumentInstance | None:
        item = self.documents.get(document_id)
        return deepcopy(item) if item else None

    def save_document(self, document: DocumentInstance) -> DocumentInstance:
        self.documents[document.id] = deepcopy(document)
        self._sync_round_document(document)
        return deepcopy(document)

    def delete_document(self, document_id: str) -> None:
        document = self.documents.get(document_id)
        if not document:
            return
        self.documents.pop(document_id, None)
        self.snapshots.pop(document_id, None)
        self.versions.pop(document_id, None)
        round_item = self.inspection_repository.get_round(document.inspectionRoundId)
        if round_item:
            round_item.documentInstances = [item for item in round_item.documentInstances if item.id != document_id]
            self.inspection_repository.update_round(round_item.id, round_item)

    def find_active_document(
        self,
        inspection_round_id: str,
        owner_party_id: str,
        exclude_document_id: str | None = None,
    ) -> DocumentInstance | None:
        for item in self.documents.values():
            if item.id == exclude_document_id:
                continue
            if (
                item.inspectionRoundId == inspection_round_id
                and item.ownerPartyId == owner_party_id
                and item.status != "archived"
            ):
                return deepcopy(item)
        return None

    def save_snapshot(self, document_id: str, snapshot: SafetyReportSnapshot) -> SafetyReportSnapshot:
        self.snapshots[document_id] = deepcopy(snapshot)
        document = self.documents.get(document_id)
        if document:
            document.contentSnapshot = asdict(snapshot)
            self.documents[document_id] = deepcopy(document)
        return deepcopy(snapshot)

    def get_snapshot(self, document_id: str) -> SafetyReportSnapshot | None:
        item = self.snapshots.get(document_id)
        return deepcopy(item) if item else None

    def list_versions(self, document_id: str) -> list[DocumentVersion]:
        return deepcopy(self.versions.get(document_id, []))

    def add_version(self, version: DocumentVersion) -> DocumentVersion:
        self.versions.setdefault(version.documentId, []).append(deepcopy(version))
        return deepcopy(version)

    def get_latest_version(self, document_id: str) -> DocumentVersion | None:
        rows = self.versions.get(document_id, [])
        return deepcopy(rows[-1]) if rows else None

    def save_export_job(self, export_job: SafetyReportExportJob) -> SafetyReportExportJob:
        self.exportJobs[export_job.id] = deepcopy(export_job)
        return deepcopy(export_job)

    def save_file_asset(self, file_asset: FileAsset) -> FileAsset:
        self.fileAssets[file_asset.id] = deepcopy(file_asset)
        return deepcopy(file_asset)

    def get_file_asset(self, file_id: str) -> FileAsset | None:
        item = self.fileAssets.get(file_id)
        return deepcopy(item) if item else None

    def save_mail_thread(self, thread: MailThread) -> MailThread:
        self.mailThreads[thread.id] = deepcopy(thread)
        return deepcopy(thread)

    def get_mail_thread(self, thread_id: str) -> MailThread | None:
        item = self.mailThreads.get(thread_id)
        return deepcopy(item) if item else None

    def save_submission(self, submission: Submission) -> Submission:
        self.submissions[submission.id] = deepcopy(submission)
        return deepcopy(submission)

    def get_submission(self, submission_id: str) -> Submission | None:
        item = self.submissions.get(submission_id)
        return deepcopy(item) if item else None
