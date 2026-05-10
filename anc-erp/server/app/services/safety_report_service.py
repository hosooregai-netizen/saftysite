from dataclasses import asdict
from uuid import uuid4

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
from server.app.repositories.checklist_repository import ChecklistRepository
from server.app.repositories.finding_repository import FindingRepository
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.project_repository import ProjectRepository
from server.app.repositories.safety_cost_repository import SafetyCostRepository
from server.app.repositories.safety_report_repository import SECTION_ROWS, SafetyReportRepository


class SafetyReportNotFoundError(Exception):
    pass


class SafetyReportValidationError(Exception):
    pass


class SafetyReportService:
    def __init__(
        self,
        repository: SafetyReportRepository,
        project_repository: ProjectRepository,
        inspection_repository: InspectionRepository,
        checklist_repository: ChecklistRepository,
        finding_repository: FindingRepository,
        safety_cost_repository: SafetyCostRepository,
    ) -> None:
        self.repository = repository
        self.project_repository = project_repository
        self.inspection_repository = inspection_repository
        self.checklist_repository = checklist_repository
        self.finding_repository = finding_repository
        self.safety_cost_repository = safety_cost_repository

    def list_project_reports(self, project_id: str) -> list[dict]:
        self._require_project(project_id)
        return [self._serialize_list_item(item) for item in self.repository.list_project_documents(project_id)]

    def create_draft(self, payload: dict) -> dict:
        project = self._require_project(payload["projectId"])
        round_item = self._require_round(payload["inspectionRoundId"])
        if round_item.projectId != project.id:
            raise SafetyReportValidationError("inspectionRoundId must belong to projectId")
        self._require_owner_party(project.id, payload["ownerPartyId"])
        duplicate = self.repository.find_active_document(round_item.id, payload["ownerPartyId"])
        if duplicate:
            raise SafetyReportValidationError("duplicate active document exists for inspectionRoundId + ownerPartyId")
        document_id = f"safety-report-{uuid4().hex[:8]}"
        snapshot = self._build_snapshot(
            document_id=document_id,
            project_id=project.id,
            inspection_round_id=round_item.id,
            owner_party_id=payload["ownerPartyId"],
            template_id=payload["templateId"],
            generation_mode=payload.get("generationMode", "from_linked_data"),
            clone_from_document_id=payload.get("cloneFromDocumentId"),
        )
        document = DocumentInstance(
            id=document_id,
            projectId=project.id,
            inspectionRoundId=round_item.id,
            ownerPartyId=payload["ownerPartyId"],
            ownerReportTaskId=payload.get("ownerReportTaskId"),
            templateId=payload["templateId"],
            title="공사안전보건대장 이행확인 보고서",
            documentNo=round_item.documentNo,
            roundNo=round_item.roundNo,
            status="draft",
            contentSnapshot=asdict(snapshot),
            latestVersionNo=1,
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_document(document)
        version = self.repository.add_version(
            DocumentVersion(
                id=f"document-version-{uuid4().hex[:8]}",
                documentId=stored.id,
                projectId=stored.projectId,
                inspectionRoundId=stored.inspectionRoundId,
                ownerPartyId=stored.ownerPartyId,
                versionNo=1,
                contentSnapshot=asdict(snapshot),
                createdBy="system",
                createdAt=self._now(),
                changeSummary="초안 생성",
            )
        )
        self.repository.save_snapshot(stored.id, snapshot)
        if stored.ownerReportTaskId:
            task = self.inspection_repository.get_owner_report_task(stored.ownerReportTaskId)
            if task:
                task.documentInstanceId = stored.id
                task.updatedAt = self._now()
                self.inspection_repository.save_owner_report_task(task)
        return {
            "document": asdict(stored),
            "snapshot": asdict(snapshot),
            "warnings": [asdict(item) for item in snapshot.reviewWarnings],
            "missingFields": [asdict(item) for item in snapshot.missingFields],
            "version": asdict(version),
        }

    def get_report(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        snapshot = self._require_snapshot(document_id)
        task = self._get_owner_report_task(document.ownerReportTaskId)
        exported_file = self.repository.get_file_asset(document.exportedFileId) if document.exportedFileId else None
        linked_data = self._linked_data(document)
        return {
            "document": asdict(document),
            "snapshot": asdict(snapshot),
            "sections": [asdict(item) for item in snapshot.sections],
            "versions": [asdict(item) for item in self.repository.list_versions(document_id)],
            "missingFields": [asdict(item) for item in snapshot.missingFields],
            "warnings": [asdict(item) for item in snapshot.reviewWarnings],
            "linkedOwnerReportTask": asdict(task) if task else None,
            "linkedDataSummary": {
                "checklistResults": len(linked_data["checklistResults"]),
                "findings": len(linked_data["findings"]),
                "photoLedgers": len(linked_data["photoLedgers"]),
                "safetyCostUsages": len(linked_data["safetyCostUsages"]),
                "attachments": len(linked_data["attachments"]),
            },
            "exportedFile": asdict(exported_file) if exported_file else None,
        }

    def update_report(self, document_id: str, payload: dict) -> dict:
        document = self._require_document(document_id)
        for key, value in payload.items():
            if hasattr(document, key) and value is not None:
                setattr(document, key, value)
        document.updatedAt = self._now()
        stored = self.repository.save_document(document)
        snapshot = self._require_snapshot(document_id)
        return {
            "document": asdict(stored),
            "snapshot": asdict(snapshot),
            "warnings": [asdict(item) for item in snapshot.reviewWarnings],
            "missingFields": [asdict(item) for item in snapshot.missingFields],
            "version": None,
        }

    def delete_report(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        document.status = "archived"
        document.updatedAt = self._now()
        self.repository.save_document(document)
        self.repository.delete_document(document_id)
        return {"deleted": True, "documentId": document_id}

    def generate(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        snapshot = self._build_snapshot(
            document_id=document.id,
            project_id=document.projectId,
            inspection_round_id=document.inspectionRoundId,
            owner_party_id=document.ownerPartyId,
            template_id=document.templateId or "template-safety-report-v1",
            generation_mode="from_linked_data",
        )
        document.status = "ai_draft"
        document.updatedAt = self._now()
        stored = self.repository.save_document(document)
        self.repository.save_snapshot(document_id, snapshot)
        version = self._create_version(stored, snapshot, "linked data 재생성")
        return self._mutation_payload(stored, snapshot, version)

    def validate(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        snapshot = self._build_snapshot(
            document_id=document.id,
            project_id=document.projectId,
            inspection_round_id=document.inspectionRoundId,
            owner_party_id=document.ownerPartyId,
            template_id=document.templateId or "template-safety-report-v1",
            generation_mode="from_linked_data",
            preserve_existing=True,
        )
        self.repository.save_snapshot(document_id, snapshot)
        return {
            "documentId": document_id,
            "missingFields": [asdict(item) for item in snapshot.missingFields],
            "warnings": [asdict(item) for item in snapshot.reviewWarnings],
            "hasDanger": any(item.severity == "danger" for item in snapshot.reviewWarnings)
            or any(item.severity == "required" for item in snapshot.missingFields),
        }

    def save_section(self, document_id: str, payload: dict) -> dict:
        document = self._require_document(document_id)
        current_snapshot = self._require_snapshot(document_id)
        snapshot = self._build_snapshot(
            document_id=document.id,
            project_id=document.projectId,
            inspection_round_id=document.inspectionRoundId,
            owner_party_id=document.ownerPartyId,
            template_id=document.templateId or "template-safety-report-v1",
            generation_mode="from_linked_data",
            preserve_existing=True,
        )
        for section in snapshot.sections:
            existing = next((item for item in current_snapshot.sections if item.key == section.key), None)
            if existing:
                section.content = existing.content
                section.status = existing.status
                section.updatedAt = existing.updatedAt
        section = next((item for item in snapshot.sections if item.key == payload["sectionKey"]), None)
        if not section:
            raise SafetyReportValidationError("sectionKey not found")
        section.content = payload["content"]
        section.status = payload.get("status") or "edited"
        section.updatedAt = self._now()
        snapshot.missingFields, snapshot.reviewWarnings = self._build_validation(snapshot.variables, snapshot.sections, document)
        self.repository.save_snapshot(document_id, snapshot)
        document.contentSnapshot = asdict(snapshot)
        document.status = "editing"
        document.latestVersionNo += 1
        document.updatedAt = self._now()
        stored = self.repository.save_document(document)
        version = self._create_version(stored, snapshot, payload.get("changeSummary") or f"{section.title} 저장")
        return self._mutation_payload(stored, snapshot, version)

    def regenerate_section(self, document_id: str, section_key: str) -> dict:
        document = self._require_document(document_id)
        snapshot = self._build_snapshot(
            document_id=document.id,
            project_id=document.projectId,
            inspection_round_id=document.inspectionRoundId,
            owner_party_id=document.ownerPartyId,
            template_id=document.templateId or "template-safety-report-v1",
            generation_mode="from_linked_data",
            preserve_existing=True,
        )
        current = self._require_snapshot(document_id)
        for section in current.sections:
            if section.key != section_key:
                matching = next((item for item in snapshot.sections if item.key == section.key), None)
                if matching:
                    matching.content = section.content
                    matching.status = section.status
        self.repository.save_snapshot(document_id, snapshot)
        document.contentSnapshot = asdict(snapshot)
        document.latestVersionNo += 1
        document.updatedAt = self._now()
        stored = self.repository.save_document(document)
        version = self._create_version(stored, snapshot, f"{section_key} section 재생성")
        return self._mutation_payload(stored, snapshot, version)

    def confirm(self, document_id: str, confirmed_by: str) -> dict:
        document = self._require_document(document_id)
        snapshot = self._require_snapshot(document_id)
        missing_required = [item for item in snapshot.missingFields if item.severity == "required"]
        if missing_required:
            raise SafetyReportValidationError("required fields must be resolved before confirm")
        document.status = "confirmed"
        document.updatedAt = self._now()
        stored = self.repository.save_document(document)
        version = self._create_version(stored, snapshot, f"문서 확정 ({confirmed_by})")
        return self._mutation_payload(stored, snapshot, version)

    def export(self, document_id: str, exported_by: str) -> dict:
        document = self._require_document(document_id)
        snapshot = self._require_snapshot(document_id)
        project = self._require_project(document.projectId)
        missing_required = [item for item in snapshot.missingFields if item.severity == "required"]
        if missing_required:
            raise SafetyReportValidationError("required fields must be resolved before export")
        latest_version = self.repository.get_latest_version(document_id)
        if not latest_version or latest_version.versionNo != document.latestVersionNo:
            raise SafetyReportValidationError("export must use latest saved snapshot")
        export_job = self.repository.save_export_job(
            SafetyReportExportJob(
                id=f"safety-report-export-{uuid4().hex[:8]}",
                documentId=document.id,
                projectId=document.projectId,
                inspectionRoundId=document.inspectionRoundId,
                ownerPartyId=document.ownerPartyId,
                status="completed",
                createdAt=self._now(),
                completedAt=self._now(),
            )
        )
        file_asset = self.repository.save_file_asset(
            FileAsset(
                id=f"file-asset-safety-report-{uuid4().hex[:8]}",
                projectId=document.projectId,
                fileName=f"{document.title}_{document.documentNo or document.id}.pdf",
                fileType="application/pdf",
                storagePath=(
                    f"/{project.projectName}/05_보고서/{document.inspectionRoundId}/"
                    f"{document.ownerPartyId}/{document.documentNo or document.id}.pdf"
                ),
                linkedEntityType="document_instance",
                linkedEntityId=document.id,
                createdAt=self._now(),
            )
        )
        export_job.fileId = file_asset.id
        export_job.storagePath = file_asset.storagePath
        self.repository.save_export_job(export_job)
        document.exportedFileId = file_asset.id
        document.status = "exported"
        document.updatedAt = self._now()
        stored = self.repository.save_document(document)
        task = self._get_owner_report_task(stored.ownerReportTaskId)
        if task:
            task.exportedFileId = file_asset.id
            task.status = "exported"
            task.updatedAt = self._now()
            self.inspection_repository.save_owner_report_task(task)
        version = self._create_version(stored, snapshot, f"최종본 export ({exported_by})")
        return {
            "document": asdict(stored),
            "exportJob": asdict(export_job),
            "fileAsset": asdict(file_asset),
            "version": asdict(version),
        }

    def clone_for_owner(self, document_id: str, payload: dict) -> dict:
        document = self._require_document(document_id)
        self._require_owner_party(document.projectId, payload["ownerPartyId"])
        duplicate = self.repository.find_active_document(document.inspectionRoundId, payload["ownerPartyId"])
        if duplicate:
            raise SafetyReportValidationError("duplicate active document exists for inspectionRoundId + ownerPartyId")
        snapshot = self._build_snapshot(
            document_id=f"safety-report-{uuid4().hex[:8]}",
            project_id=document.projectId,
            inspection_round_id=document.inspectionRoundId,
            owner_party_id=payload["ownerPartyId"],
            template_id=document.templateId or "template-safety-report-v1",
            generation_mode="clone_from_existing",
            clone_from_document_id=document.id,
        )
        cloned = DocumentInstance(
            id=snapshot.meta.documentId,
            projectId=document.projectId,
            inspectionRoundId=document.inspectionRoundId,
            ownerPartyId=payload["ownerPartyId"],
            ownerReportTaskId=payload.get("ownerReportTaskId"),
            templateId=document.templateId,
            title=document.title,
            documentNo=document.documentNo,
            roundNo=document.roundNo,
            status="draft",
            contentSnapshot=asdict(snapshot),
            latestVersionNo=1,
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_document(cloned)
        version = self._create_version(stored, snapshot, "발주처 분기 복제")
        return self._mutation_payload(stored, snapshot, version)

    def get_required_data(self, inspection_round_id: str) -> dict:
        round_item = self._require_round(inspection_round_id)
        owners = self._owner_branches(inspection_round_id)
        required_fields: list[MissingField] = []
        if not round_item.documentNo:
            required_fields.append(
                MissingField(
                    field="documentNo",
                    message="문서번호가 없습니다.",
                    severity="required",
                    label="문서번호",
                    sectionKey="cover",
                    reason="점검회차 문서번호를 먼저 입력하세요.",
                )
            )
        if not round_item.actualInspectionDate and not round_item.plannedDate:
            required_fields.append(
                MissingField(
                    field="inspectionDate",
                    message="점검일자가 없습니다.",
                    severity="required",
                    label="점검일자",
                    sectionKey="cover",
                    reason="plannedDate 또는 actualInspectionDate가 필요합니다.",
                )
            )
        return {
            "projectId": round_item.projectId,
            "inspectionRoundId": inspection_round_id,
            "ownerBranches": owners,
            "requiredData": [asdict(item) for item in required_fields],
            "warnings": [],
        }

    def get_owner_report_branches(self, inspection_round_id: str) -> list[dict]:
        return self._owner_branches(inspection_round_id)

    def get_missing_fields(self, document_id: str) -> list[dict]:
        snapshot = self._require_snapshot(document_id)
        return [asdict(item) for item in snapshot.missingFields]

    def get_variables(self, document_id: str) -> dict:
        snapshot = self._require_snapshot(document_id)
        return {
            "documentId": document_id,
            "variables": snapshot.variables,
            "sourceLinks": [asdict(item) for item in snapshot.sourceLinks],
        }

    def get_checklist_results(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        items = self._linked_data(document)["checklistResults"]
        return {"documentId": document_id, "sectionKey": "inspection_checklist", "items": items}

    def get_findings(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        items = self._linked_data(document)["findings"]
        return {"documentId": document_id, "sectionKey": "implementation_confirmation", "items": items}

    def get_photo_ledger(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        items = self._linked_data(document)["photoLedgers"]
        return {"documentId": document_id, "sectionKey": "photo_ledger", "items": items}

    def get_safety_cost(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        items = self._linked_data(document)["safetyCostUsages"]
        return {"documentId": document_id, "sectionKey": "safety_cost_usage", "items": items}

    def refresh_linked_data(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        snapshot = self._build_snapshot(
            document_id=document.id,
            project_id=document.projectId,
            inspection_round_id=document.inspectionRoundId,
            owner_party_id=document.ownerPartyId,
            template_id=document.templateId or "template-safety-report-v1",
            generation_mode="from_linked_data",
            preserve_existing=True,
            detect_stale_against=document.updatedAt,
        )
        self.repository.save_snapshot(document_id, snapshot)
        document.contentSnapshot = asdict(snapshot)
        document.updatedAt = self._now()
        stored = self.repository.save_document(document)
        return self._mutation_payload(stored, snapshot, None)

    def link_owner_report_task(self, document_id: str, owner_report_task_id: str) -> dict:
        document = self._require_document(document_id)
        task = self._require_owner_report_task(owner_report_task_id)
        if task.inspectionRoundId != document.inspectionRoundId:
            raise SafetyReportValidationError("ownerReportTaskId must belong to document inspectionRoundId")
        document.ownerReportTaskId = owner_report_task_id
        document.updatedAt = self._now()
        stored = self.repository.save_document(document)
        task.documentInstanceId = document_id
        task.updatedAt = self._now()
        updated_task = self.inspection_repository.save_owner_report_task(task)
        snapshot = self._require_snapshot(document_id)
        return {
            "document": asdict(stored),
            "snapshot": asdict(snapshot),
            "warnings": [asdict(item) for item in snapshot.reviewWarnings],
            "missingFields": [asdict(item) for item in snapshot.missingFields],
            "version": None,
            "ownerReportTask": asdict(updated_task),
        }

    def mark_submitted(
        self,
        document_id: str,
        submitted_at: str | None,
        mail_thread_id: str | None,
        submission_id: str | None,
    ) -> dict:
        document = self._require_document(document_id)
        if not document.exportedFileId:
            raise SafetyReportValidationError("submitted status requires exportedFileId")
        timestamp = submitted_at or self._now()
        resolved_mail_thread_id = mail_thread_id or document.mailThreadId or f"mail-thread-{document.id}"
        resolved_submission_id = submission_id or document.submissionId or f"submission-{document.id}"
        mail_thread = self.repository.save_mail_thread(
            MailThread(
                id=resolved_mail_thread_id,
                projectId=document.projectId,
                inspectionRoundId=document.inspectionRoundId,
                ownerPartyId=document.ownerPartyId,
                subject=f"{document.title} 제출",
                createdAt=self._now(),
                updatedAt=self._now(),
            )
        )
        submission = self.repository.save_submission(
            Submission(
                id=resolved_submission_id,
                documentId=document.id,
                projectId=document.projectId,
                inspectionRoundId=document.inspectionRoundId,
                ownerPartyId=document.ownerPartyId,
                exportedFileId=document.exportedFileId,
                mailThreadId=resolved_mail_thread_id,
                submittedAt=timestamp,
                createdAt=self._now(),
                updatedAt=self._now(),
            )
        )
        document.submittedAt = timestamp
        document.mailThreadId = resolved_mail_thread_id
        document.submissionId = resolved_submission_id
        document.status = "submitted"
        document.updatedAt = self._now()
        stored = self.repository.save_document(document)
        task = None
        if document.ownerReportTaskId:
            task = self._require_owner_report_task(document.ownerReportTaskId)
            task.submittedAt = document.submittedAt
            task.mailThreadId = document.mailThreadId
            task.submissionId = document.submissionId
            task.status = "submitted"
            task.updatedAt = self._now()
            task = self.inspection_repository.save_owner_report_task(task)
        return {
            "document": asdict(stored),
            "ownerReportTask": asdict(task) if task else None,
            "mailThreadId": stored.mailThreadId,
            "submissionId": stored.submissionId,
            "mailThread": asdict(mail_thread),
            "submission": asdict(submission),
        }

    def _linked_data(self, document: DocumentInstance) -> dict:
        sessions = self.checklist_repository.list_sessions_by_round(document.inspectionRoundId)
        results: list[dict] = []
        for session in sessions:
            for result in self.checklist_repository.list_results(session.id):
                results.append(asdict(result))
        findings = [
            asdict(item)
            for item in self.finding_repository.list_round_findings(document.inspectionRoundId)
            if item.ownerPartyId in {None, document.ownerPartyId}
        ]
        photo_ledgers = [
            asdict(item)
            for item in self.finding_repository.list_photo_ledgers(document.inspectionRoundId)
            if item.ownerPartyId in {None, document.ownerPartyId}
        ]
        safety_costs = [
            asdict(item)
            for item in self.safety_cost_repository.list_round_usages(document.inspectionRoundId)
            if item.ownerPartyId == document.ownerPartyId
        ]
        attachments = [asdict(item) for item in self.inspection_repository.list_attachments(document.inspectionRoundId)]
        return {
            "checklistResults": results,
            "findings": findings,
            "photoLedgers": photo_ledgers,
            "safetyCostUsages": safety_costs,
            "attachments": attachments,
        }

    def _build_snapshot(
        self,
        document_id: str,
        project_id: str,
        inspection_round_id: str,
        owner_party_id: str,
        template_id: str,
        generation_mode: str,
        clone_from_document_id: str | None = None,
        preserve_existing: bool = False,
        detect_stale_against: str | None = None,
    ) -> SafetyReportSnapshot:
        project = self._require_project(project_id)
        round_item = self._require_round(inspection_round_id)
        owner_display_name = self._owner_display_name(project_id, owner_party_id)
        source_document = self.repository.get_document(clone_from_document_id) if clone_from_document_id else None
        current_snapshot = self.repository.get_snapshot(document_id) if preserve_existing else None
        linked = self._linked_data(
            DocumentInstance(
                id=document_id,
                projectId=project_id,
                inspectionRoundId=inspection_round_id,
                ownerPartyId=owner_party_id,
                title="공사안전보건대장 이행확인 보고서",
                status="draft",
            )
        )
        contractor_name = self._contractor_name(project_id)
        first_safety_cost = linked["safetyCostUsages"][0] if linked["safetyCostUsages"] else None
        variables = {
            "projectName": project.projectName,
            "siteAddress": project.siteAddress,
            "ownerDisplayName": owner_display_name,
            "ownerPartyId": owner_party_id,
            "inspectionRoundId": inspection_round_id,
            "inspectionDate": round_item.actualInspectionDate or round_item.plannedDate,
            "documentNo": round_item.documentNo,
            "roundNo": round_item.roundNo,
            "contractorName": contractor_name,
            "checklistResultCount": len(linked["checklistResults"]),
            "findingCount": len(linked["findings"]),
            "photoLedgerCount": len(linked["photoLedgers"]),
            "safetyCostUsageCount": len(linked["safetyCostUsages"]),
            "attachmentCount": len(linked["attachments"]),
            "safetyCostUsedRate": first_safety_cost.get("usedRateCalculated") if first_safety_cost else None,
        }
        source_links = self._build_source_links(
            document_id,
            project,
            round_item,
            owner_party_id,
            linked,
        )
        sections = self._build_sections(
            document_id=document_id,
            round_item=round_item,
            owner_display_name=owner_display_name,
            variables=variables,
            source_links=source_links,
            source_document=source_document,
            current_snapshot=current_snapshot,
        )
        missing_fields, review_warnings = self._build_validation(
            variables,
            sections,
            DocumentInstance(
                id=document_id,
                projectId=project_id,
                inspectionRoundId=inspection_round_id,
                ownerPartyId=owner_party_id,
                title="공사안전보건대장 이행확인 보고서",
                status="draft",
            ),
        )
        if first_safety_cost and first_safety_cost.get("userEnteredRate") is not None:
            if first_safety_cost["userEnteredRate"] != first_safety_cost["usedRateCalculated"]:
                review_warnings.append(
                    ReviewWarning(
                        type="safety_cost_rate_mismatch",
                        message="산안비 입력 사용률과 계산 사용률이 다릅니다.",
                        severity="warning",
                        sectionKey="safety_cost_usage",
                    )
                )
        if detect_stale_against:
            stale_warnings = [
                ReviewWarning(
                    type="stale_linked_data",
                    message=f"{link.sourceLabel} 원본이 문서 저장 이후 변경되었습니다.",
                    severity="warning",
                    sectionKey=link.sectionKey,
                )
                for link in source_links
                if link.sourceUpdatedAt and link.sourceUpdatedAt >= detect_stale_against
            ]
            review_warnings.extend(stale_warnings)
        meta = SafetyReportMeta(
            documentId=document_id,
            projectId=project_id,
            inspectionRoundId=inspection_round_id,
            ownerPartyId=owner_party_id,
            ownerDisplayName=owner_display_name,
            templateId=template_id,
            generatedMode=generation_mode,
        )
        return SafetyReportSnapshot(
            meta=meta,
            variables=variables,
            sections=sections,
            missingFields=missing_fields,
            reviewWarnings=review_warnings,
            sourceLinks=source_links,
        )

    def _build_source_links(self, document_id: str, project: object, round_item: object, owner_party_id: str, linked: dict) -> list[SourceLink]:
        source_links = [
            SourceLink(
                id=f"source-link-{document_id}-project",
                sectionKey="project_summary",
                sourceEntityType="project",
                sourceEntityId=project.id,
                sourceLabel="프로젝트 원장",
                sourceUpdatedAt=project.updatedAt,
                linkedAt=self._now(),
            ),
            SourceLink(
                id=f"source-link-{document_id}-round",
                sectionKey="cover",
                sourceEntityType="inspection_round",
                sourceEntityId=round_item.id,
                sourceLabel="점검회차",
                sourceUpdatedAt=round_item.updatedAt,
                linkedAt=self._now(),
            ),
            SourceLink(
                id=f"source-link-{document_id}-owner",
                sectionKey="cover",
                sourceEntityType="owner_party",
                sourceEntityId=owner_party_id,
                sourceLabel="발주처 분기",
                sourceUpdatedAt=round_item.updatedAt,
                linkedAt=self._now(),
            ),
        ]
        if linked["checklistResults"]:
            source_links.append(
                SourceLink(
                    id=f"source-link-{document_id}-checklist",
                    sectionKey="inspection_checklist",
                    sourceEntityType="checklist_result",
                    sourceEntityId=linked["checklistResults"][0]["id"],
                    sourceLabel="체크리스트 결과",
                    sourceUpdatedAt=linked["checklistResults"][0].get("updatedAt"),
                    linkedAt=self._now(),
                )
            )
        if linked["findings"]:
            source_links.append(
                SourceLink(
                    id=f"source-link-{document_id}-finding",
                    sectionKey="implementation_confirmation",
                    sourceEntityType="finding",
                    sourceEntityId=linked["findings"][0]["id"],
                    sourceLabel="지적사항",
                    sourceUpdatedAt=linked["findings"][0].get("updatedAt"),
                    linkedAt=self._now(),
                )
            )
        if linked["photoLedgers"]:
            source_links.append(
                SourceLink(
                    id=f"source-link-{document_id}-photo-ledger",
                    sectionKey="photo_ledger",
                    sourceEntityType="photo_ledger",
                    sourceEntityId=linked["photoLedgers"][0]["id"],
                    sourceLabel="사진대지",
                    sourceUpdatedAt=linked["photoLedgers"][0].get("updatedAt"),
                    linkedAt=self._now(),
                )
            )
        if linked["safetyCostUsages"]:
            source_links.append(
                SourceLink(
                    id=f"source-link-{document_id}-safety-cost",
                    sectionKey="safety_cost_usage",
                    sourceEntityType="safety_cost_usage",
                    sourceEntityId=linked["safetyCostUsages"][0]["id"],
                    sourceLabel="산업안전보건관리비",
                    sourceUpdatedAt=linked["safetyCostUsages"][0].get("updatedAt"),
                    linkedAt=self._now(),
                )
            )
        return source_links

    def _build_sections(
        self,
        document_id: str,
        round_item: object,
        owner_display_name: str,
        variables: dict,
        source_links: list[SourceLink],
        source_document: DocumentInstance | None,
        current_snapshot: SafetyReportSnapshot | None,
    ) -> list[SafetyReportSection]:
        source_snapshot = self.repository.get_snapshot(source_document.id) if source_document else None
        sections: list[SafetyReportSection] = []
        for order, (key, title) in enumerate(SECTION_ROWS, start=1):
            clone_content = None
            if source_snapshot:
                clone_section = next((item for item in source_snapshot.sections if item.key == key), None)
                if clone_section:
                    clone_content = dict(clone_section.content)
                    clone_content["ownerDisplayName"] = owner_display_name
            current_section = next((item for item in current_snapshot.sections if item.key == key), None) if current_snapshot else None
            content = clone_content or (dict(current_section.content) if current_section else {})
            content.update(
                {
                    "title": title,
                    "projectName": variables["projectName"],
                    "siteAddress": variables["siteAddress"],
                    "documentNo": variables["documentNo"],
                    "roundNo": variables["roundNo"],
                    "inspectionDate": variables["inspectionDate"],
                    "ownerDisplayName": owner_display_name,
                    "summary": self._section_summary(key, variables),
                }
            )
            status = current_section.status if current_section else ("ai_draft" if key in {"cover", "project_summary"} else "review")
            sections.append(
                SafetyReportSection(
                    id=f"section-{document_id}-{key}",
                    key=key,
                    title=title,
                    status=status,
                    order=order,
                    content=content,
                    sourceEntityRefs=[item for item in source_links if item.sectionKey == key or (key == "cover" and item.sectionKey == "cover")],
                    updatedAt=current_section.updatedAt if current_section else self._now(),
                )
            )
        return sections

    def _section_summary(self, key: str, variables: dict) -> str:
        summaries = {
            "cover": f"{variables['projectName']} / {variables['ownerDisplayName']} / {variables['documentNo'] or '문서번호 미입력'}",
            "project_summary": f"{variables['siteAddress']} / 시공사 {variables['contractorName'] or '미연결'}",
            "inspection_checklist": f"체크리스트 {variables['checklistResultCount']}건 반영",
            "implementation_confirmation": f"지적사항 {variables['findingCount']}건 검토",
            "safety_cost_usage": f"산안비 {variables['safetyCostUsageCount']}건 / 사용률 {variables['safetyCostUsedRate'] or '-'}",
            "photo_ledger": f"사진대지 {variables['photoLedgerCount']}건",
            "schedule_attachments": f"첨부 {variables['attachmentCount']}건",
        }
        return summaries.get(key, "연결 데이터 검토 필요")

    def _build_validation(
        self,
        variables: dict,
        sections: list[SafetyReportSection],
        document: DocumentInstance,
    ) -> tuple[list[MissingField], list[ReviewWarning]]:
        missing_fields: list[MissingField] = []
        review_warnings: list[ReviewWarning] = []
        required_rows = [
            ("projectName", "프로젝트명", "cover"),
            ("siteAddress", "현장주소", "project_summary"),
            ("contractorName", "시공사명", "project_summary"),
            ("ownerDisplayName", "발주처명", "cover"),
            ("inspectionDate", "점검일자", "cover"),
            ("roundNo", "회차번호", "cover"),
            ("documentNo", "문서번호", "cover"),
        ]
        for field, label, section_key in required_rows:
            if not variables.get(field):
                missing_fields.append(
                    MissingField(
                        field=field,
                        message=f"{label}이(가) 누락되었습니다.",
                        severity="required",
                        label=label,
                        sectionKey=section_key,
                        reason="원본 linked data 또는 수동 편집값을 확인하세요.",
                    )
                )
        if variables.get("checklistResultCount", 0) == 0:
            missing_fields.append(
                MissingField(
                    field="checklistResults",
                    message="체크리스트 결과가 없습니다.",
                    severity="required",
                    label="체크리스트 결과",
                    sectionKey="inspection_checklist",
                    reason="체크리스트 세션을 완료해야 합니다.",
                )
            )
        if variables.get("photoLedgerCount", 0) == 0:
            review_warnings.append(
                ReviewWarning(
                    type="photo_pair_missing",
                    message="사진대지 연결이 없어 최종본 export 전에 확인이 필요합니다.",
                    severity="warning",
                    sectionKey="photo_ledger",
                )
            )
        if variables.get("findingCount", 0) == 0 and variables.get("checklistResultCount", 0) > 0:
            review_warnings.append(
                ReviewWarning(
                    type="checklist_finding_mismatch",
                    message="체크리스트 결과는 있으나 지적사항 반영이 비어 있습니다.",
                    severity="warning",
                    sectionKey="implementation_confirmation",
                )
            )
        if any(section.status == "not_started" for section in sections if section.key in {"cover", "project_summary", "inspection_checklist"}):
            missing_fields.append(
                MissingField(
                    field="sectionStatus",
                    message="필수 섹션이 아직 시작되지 않았습니다.",
                    severity="required",
                    label="필수 섹션 상태",
                    sectionKey="project_summary",
                    reason="필수 섹션은 ai_draft 이상 상태여야 합니다.",
                )
            )
        if document.status == "submitted" and not document.exportedFileId:
            review_warnings.append(
                ReviewWarning(
                    type="missing_export_file",
                    message="제출 상태에는 exportedFileId가 필요합니다.",
                    severity="danger",
                    sectionKey="cover",
                )
            )
        return missing_fields, review_warnings

    def _create_version(self, document: DocumentInstance, snapshot: SafetyReportSnapshot, change_summary: str) -> DocumentVersion:
        version = DocumentVersion(
            id=f"document-version-{uuid4().hex[:8]}",
            documentId=document.id,
            projectId=document.projectId,
            inspectionRoundId=document.inspectionRoundId,
            ownerPartyId=document.ownerPartyId,
            versionNo=document.latestVersionNo,
            contentSnapshot=asdict(snapshot),
            createdBy="user-engineer-001",
            createdAt=self._now(),
            changeSummary=change_summary,
        )
        self.repository.add_version(version)
        return version

    def _mutation_payload(self, document: DocumentInstance, snapshot: SafetyReportSnapshot, version: DocumentVersion | None) -> dict:
        return {
            "document": asdict(document),
            "snapshot": asdict(snapshot),
            "warnings": [asdict(item) for item in snapshot.reviewWarnings],
            "missingFields": [asdict(item) for item in snapshot.missingFields],
            "version": asdict(version) if version else None,
        }

    def _owner_branches(self, inspection_round_id: str) -> list[dict]:
        rows = self.inspection_repository.list_owner_report_tasks(inspection_round_id)
        return [
            {
                "ownerPartyId": item.ownerPartyId,
                "ownerDisplayName": item.ownerDisplayName or item.ownerPartyId,
                "ownerReportTaskId": item.id,
            }
            for item in rows
        ]

    def _owner_display_name(self, project_id: str, owner_party_id: str) -> str:
        organizations = {item.id: item.name for item in self.project_repository.list_organizations()}
        for party in self.project_repository.list_project_parties(project_id):
            if party.ownerPartyId == owner_party_id:
                return organizations.get(party.organizationId, owner_party_id)
        return owner_party_id

    def _contractor_name(self, project_id: str) -> str | None:
        organizations = {item.id: item.name for item in self.project_repository.list_organizations()}
        contractor = next(
            (item for item in self.project_repository.list_project_parties(project_id) if item.role == "contractor"),
            None,
        )
        if not contractor:
            return None
        return organizations.get(contractor.organizationId)

    def _require_project(self, project_id: str):
        project = self.project_repository.get_project(project_id)
        if not project:
            raise SafetyReportNotFoundError("project not found")
        return project

    def _require_round(self, inspection_round_id: str):
        round_item = self.inspection_repository.get_round(inspection_round_id)
        if not round_item:
            raise SafetyReportNotFoundError("inspection round not found")
        return round_item

    def _require_owner_party(self, project_id: str, owner_party_id: str) -> None:
        for party in self.project_repository.list_project_parties(project_id):
            if party.role == "owner" and party.ownerPartyId == owner_party_id:
                return
        raise SafetyReportValidationError("ownerPartyId must be an owner ProjectParty in the project")

    def _require_document(self, document_id: str) -> DocumentInstance:
        document = self.repository.get_document(document_id)
        if not document:
            raise SafetyReportNotFoundError("document not found")
        return document

    def _require_snapshot(self, document_id: str) -> SafetyReportSnapshot:
        snapshot = self.repository.get_snapshot(document_id)
        if not snapshot:
            raise SafetyReportNotFoundError("document snapshot not found")
        return snapshot

    def _get_owner_report_task(self, owner_report_task_id: str | None):
        if not owner_report_task_id:
            return None
        return self.inspection_repository.get_owner_report_task(owner_report_task_id)

    def _require_owner_report_task(self, owner_report_task_id: str):
        task = self.inspection_repository.get_owner_report_task(owner_report_task_id)
        if not task:
            raise SafetyReportNotFoundError("owner report task not found")
        return task

    def _now(self) -> str:
        return "2026-05-10T09:00:00+09:00"
