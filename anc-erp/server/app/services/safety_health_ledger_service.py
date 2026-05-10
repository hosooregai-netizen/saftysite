from dataclasses import asdict
from uuid import uuid4

from server.app.domain.models import (
    FileAsset,
    LedgerAttachment,
    LedgerFindingHistory,
    LedgerInspectionHistory,
    LedgerMeta,
    LedgerRiskItem,
    LedgerRiskReductionMeasure,
    LedgerSafetyCostHistory,
    MissingField,
    ReviewWarning,
    SafetyHealthLedger,
    SafetyHealthLedgerExportJob,
    SafetyHealthLedgerSection,
    SafetyHealthLedgerSnapshot,
    SafetyHealthLedgerVersion,
    SourceLink,
)
from server.app.repositories.checklist_repository import ChecklistRepository
from server.app.repositories.finding_repository import FindingRepository
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.project_repository import ProjectRepository
from server.app.repositories.safety_cost_repository import SafetyCostRepository
from server.app.repositories.safety_health_ledger_repository import (
    LEDGER_SECTION_ROWS,
    SafetyHealthLedgerRepository,
)
from server.app.repositories.safety_management_plan_repository import SafetyManagementPlanRepository


class SafetyHealthLedgerNotFoundError(Exception):
    pass


class SafetyHealthLedgerValidationError(Exception):
    pass


class SafetyHealthLedgerService:
    def __init__(
        self,
        repository: SafetyHealthLedgerRepository,
        project_repository: ProjectRepository,
        safety_management_plan_repository: SafetyManagementPlanRepository,
        inspection_repository: InspectionRepository,
        checklist_repository: ChecklistRepository,
        finding_repository: FindingRepository,
        safety_cost_repository: SafetyCostRepository,
    ) -> None:
        self.repository = repository
        self.project_repository = project_repository
        self.safety_management_plan_repository = safety_management_plan_repository
        self.inspection_repository = inspection_repository
        self.checklist_repository = checklist_repository
        self.finding_repository = finding_repository
        self.safety_cost_repository = safety_cost_repository

    def list_project_ledgers(self, project_id: str) -> list[dict]:
        self._require_project(project_id)
        return [self._serialize_list_item(item) for item in self.repository.list_project_ledgers(project_id)]

    def create_ledger(self, payload: dict) -> dict:
        project = self._require_project(payload["projectId"])
        template_id = payload.get("templateId")
        if not template_id:
            raise SafetyHealthLedgerValidationError("templateId is required")
        duplicate = self.repository.find_active_ledger(project.id, template_id)
        if duplicate and not payload.get("revisionReason"):
            raise SafetyHealthLedgerValidationError("duplicate active ledger exists without revisionReason")

        source_plan_id = payload.get("sourcePlanId")
        if source_plan_id:
            source_plan = self.safety_management_plan_repository.get_plan(source_plan_id)
            if not source_plan or source_plan.projectId != project.id:
                raise SafetyHealthLedgerValidationError("sourcePlanId must belong to projectId")

        ledger_id = f"safety-health-ledger-{uuid4().hex[:8]}"
        ledger = SafetyHealthLedger(
            id=ledger_id,
            projectId=project.id,
            templateId=template_id,
            title="프로젝트 안전보건대장",
            status="draft",
            currentVersionNo=1,
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        self.repository.save_ledger(ledger)

        if source_plan_id:
            imported = self._build_imported_plan_risks(ledger_id, source_plan_id)
            for risk_item in imported["riskItems"]:
                self.repository.save_risk_item(risk_item)
            for measure in imported["measures"]:
                self.repository.save_measure(measure)

        if payload.get("includeInspectionHistory", True):
            self.repository.replace_inspection_history(ledger_id, self._build_inspection_history(ledger_id, project.id))
        if payload.get("includeFindingHistory", True):
            self.repository.replace_finding_history(ledger_id, self._build_finding_history(ledger_id, project.id))
        if payload.get("includeSafetyCostHistory", True):
            self.repository.replace_safety_cost_history(ledger_id, self._build_safety_cost_history(ledger_id, project.id))

        snapshot = self._build_snapshot(
            ledger_id=ledger_id,
            project_id=project.id,
            template_id=template_id,
            source_plan_id=source_plan_id,
            preserve_existing=True,
        )
        self.repository.save_snapshot(ledger_id, snapshot)
        ledger.latestSnapshot = asdict(snapshot)
        self.repository.save_ledger(ledger)
        version = self.repository.add_version(
            SafetyHealthLedgerVersion(
                id=f"safety-health-ledger-version-{uuid4().hex[:8]}",
                ledgerId=ledger_id,
                versionNo=1,
                snapshot=asdict(snapshot),
                createdBy="system",
                createdAt=self._now(),
                changeSummary="초안 생성",
            )
        )
        return self._mutation_payload(ledger, snapshot, version)

    def get_ledger(self, ledger_id: str) -> dict:
        ledger = self._require_ledger(ledger_id)
        snapshot = self._require_snapshot(ledger_id)
        exported_file = self.repository.get_file_asset(ledger.exportedFileId) if ledger.exportedFileId else None
        return {
            "ledger": asdict(ledger),
            "snapshot": asdict(snapshot),
            "sections": [asdict(item) for item in snapshot.sections],
            "versions": [asdict(item) for item in self.repository.list_versions(ledger_id)],
            "riskItems": [asdict(item) for item in self.repository.list_risk_items(ledger_id)],
            "measures": [asdict(item) for item in self.repository.list_measures(ledger_id)],
            "inspectionHistory": [asdict(item) for item in self.repository.list_inspection_history(ledger_id)],
            "findingHistory": [asdict(item) for item in self.repository.list_finding_history(ledger_id)],
            "safetyCostHistory": [asdict(item) for item in self.repository.list_safety_cost_history(ledger_id)],
            "attachments": [asdict(item) for item in self.repository.list_attachments(ledger_id)],
            "missingFields": [asdict(item) for item in snapshot.missingFields],
            "warnings": [asdict(item) for item in snapshot.reviewWarnings],
            "exportedFile": asdict(exported_file) if exported_file else None,
        }

    def update_ledger(self, ledger_id: str, payload: dict) -> dict:
        ledger = self._require_ledger(ledger_id)
        for key, value in payload.items():
            if hasattr(ledger, key) and value is not None:
                setattr(ledger, key, value)
        ledger.updatedAt = self._now()
        stored = self.repository.save_ledger(ledger)
        return self._mutation_payload(stored, self._require_snapshot(ledger_id), None)

    def delete_ledger(self, ledger_id: str) -> dict:
        self._require_ledger(ledger_id)
        self.repository.delete_ledger(ledger_id)
        return {"deleted": True, "ledgerId": ledger_id}

    def generate(self, ledger_id: str) -> dict:
        ledger = self._require_ledger(ledger_id)
        snapshot = self._build_snapshot(
            ledger_id=ledger.id,
            project_id=ledger.projectId,
            template_id=ledger.templateId,
            source_plan_id=self._current_source_plan_id(ledger_id),
            preserve_existing=True,
        )
        ledger.status = "review"
        ledger.updatedAt = self._now()
        stored = self.repository.save_ledger(ledger)
        self.repository.save_snapshot(ledger.id, snapshot)
        version = self._create_version(stored, snapshot, "linked data 재생성")
        return self._mutation_payload(stored, snapshot, version)

    def validate(self, ledger_id: str) -> dict:
        ledger = self._require_ledger(ledger_id)
        snapshot = self._build_snapshot(
            ledger_id=ledger.id,
            project_id=ledger.projectId,
            template_id=ledger.templateId,
            source_plan_id=self._current_source_plan_id(ledger_id),
            preserve_existing=True,
            detect_stale_against=ledger.updatedAt,
        )
        self.repository.save_snapshot(ledger.id, snapshot)
        return {
            "ledgerId": ledger_id,
            "missingFields": [asdict(item) for item in snapshot.missingFields],
            "warnings": [asdict(item) for item in snapshot.reviewWarnings],
            "hasDanger": any(item.severity == "required" for item in snapshot.missingFields)
            or any(item.severity == "danger" for item in snapshot.reviewWarnings),
        }

    def confirm(self, ledger_id: str, confirmed_by: str) -> dict:
        ledger = self._require_ledger(ledger_id)
        snapshot = self._require_snapshot(ledger_id)
        if any(item.severity == "required" for item in snapshot.missingFields):
            raise SafetyHealthLedgerValidationError("required fields must be resolved before confirm")
        ledger.status = "confirmed"
        ledger.updatedAt = self._now()
        stored = self.repository.save_ledger(ledger)
        version = self._create_version(stored, snapshot, f"대장 확정 ({confirmed_by})")
        return self._mutation_payload(stored, snapshot, version)

    def export(self, ledger_id: str, exported_by: str) -> dict:
        ledger = self._require_ledger(ledger_id)
        snapshot = self._require_snapshot(ledger_id)
        if any(item.severity == "required" for item in snapshot.missingFields):
            raise SafetyHealthLedgerValidationError("required fields must be resolved before export")
        latest_version = self.repository.get_latest_version(ledger_id)
        if not latest_version or latest_version.versionNo != ledger.currentVersionNo:
            raise SafetyHealthLedgerValidationError("export must use latest saved snapshot")
        project = self._require_project(ledger.projectId)
        export_job = self.repository.save_export_job(
            SafetyHealthLedgerExportJob(
                id=f"safety-health-ledger-export-{uuid4().hex[:8]}",
                ledgerId=ledger.id,
                projectId=ledger.projectId,
                status="completed",
                createdAt=self._now(),
                completedAt=self._now(),
            )
        )
        file_asset = self.repository.save_file_asset(
            FileAsset(
                id=f"file-asset-safety-health-ledger-{uuid4().hex[:8]}",
                projectId=ledger.projectId,
                fileName=f"{ledger.title}_{ledger.id}.pdf",
                fileType="application/pdf",
                storagePath=f"/{project.projectName}/09_안전보건대장/{ledger.id}.pdf",
                linkedEntityType="safety_health_ledger",
                linkedEntityId=ledger.id,
                createdAt=self._now(),
            )
        )
        export_job.fileId = file_asset.id
        export_job.storagePath = file_asset.storagePath
        self.repository.save_export_job(export_job)
        ledger.exportedFileId = file_asset.id
        ledger.status = "exported"
        ledger.updatedAt = self._now()
        stored = self.repository.save_ledger(ledger)
        version = self._create_version(stored, snapshot, f"최종본 export ({exported_by})")
        return {
            "ledger": asdict(stored),
            "exportJob": asdict(export_job),
            "fileAsset": asdict(file_asset),
            "version": asdict(version),
        }

    def archive(self, ledger_id: str) -> dict:
        ledger = self._require_ledger(ledger_id)
        ledger.status = "archived"
        ledger.archivedAt = self._now()
        ledger.updatedAt = self._now()
        self.repository.save_ledger(ledger)
        return {"ledgerId": ledger_id, "archived": True}

    def list_sections(self, ledger_id: str) -> list[dict]:
        self._require_ledger(ledger_id)
        snapshot = self._require_snapshot(ledger_id)
        return [asdict(item) for item in snapshot.sections]

    def save_section(self, ledger_id: str, section_key: str, payload: dict) -> dict:
        ledger = self._require_ledger(ledger_id)
        current_snapshot = self._require_snapshot(ledger_id)
        snapshot = self._build_snapshot(
            ledger_id=ledger.id,
            project_id=ledger.projectId,
            template_id=ledger.templateId,
            source_plan_id=self._current_source_plan_id(ledger_id),
            preserve_existing=True,
        )
        for section in snapshot.sections:
            existing = next((item for item in current_snapshot.sections if item.key == section.key), None)
            if existing:
                section.content = existing.content
                section.status = existing.status
                section.updatedAt = existing.updatedAt
        section = next((item for item in snapshot.sections if item.key == section_key), None)
        if not section:
            raise SafetyHealthLedgerValidationError("sectionKey not found")
        section.content = payload["content"]
        section.status = payload.get("status") or "edited"
        section.updatedAt = self._now()
        snapshot.missingFields, snapshot.reviewWarnings = self._build_validation(ledger, snapshot)
        self.repository.save_snapshot(ledger.id, snapshot)
        ledger.latestSnapshot = asdict(snapshot)
        ledger.status = "review"
        ledger.currentVersionNo += 1
        ledger.updatedAt = self._now()
        stored = self.repository.save_ledger(ledger)
        version = self._create_version(stored, snapshot, payload.get("changeSummary") or f"{section.title} 저장")
        return self._mutation_payload(stored, snapshot, version)

    def regenerate_section(self, ledger_id: str, section_key: str) -> dict:
        ledger = self._require_ledger(ledger_id)
        current_snapshot = self._require_snapshot(ledger_id)
        snapshot = self._build_snapshot(
            ledger_id=ledger.id,
            project_id=ledger.projectId,
            template_id=ledger.templateId,
            source_plan_id=self._current_source_plan_id(ledger_id),
            preserve_existing=True,
        )
        for section in current_snapshot.sections:
            if section.key != section_key:
                next_section = next((item for item in snapshot.sections if item.key == section.key), None)
                if next_section:
                    next_section.content = section.content
                    next_section.status = section.status
                    next_section.updatedAt = section.updatedAt
        self.repository.save_snapshot(ledger.id, snapshot)
        ledger.latestSnapshot = asdict(snapshot)
        ledger.currentVersionNo += 1
        ledger.updatedAt = self._now()
        stored = self.repository.save_ledger(ledger)
        version = self._create_version(stored, snapshot, f"{section_key} section 재생성")
        return self._mutation_payload(stored, snapshot, version)

    def list_risk_items(self, ledger_id: str) -> list[dict]:
        self._require_ledger(ledger_id)
        return [asdict(item) for item in self.repository.list_risk_items(ledger_id)]

    def create_risk_item(self, ledger_id: str, payload: dict) -> dict:
        self._require_ledger(ledger_id)
        if not payload.get("hazardDescription"):
            raise SafetyHealthLedgerValidationError("hazardDescription is required")
        risk_item = self.repository.save_risk_item(
            LedgerRiskItem(
                id=f"ledger-risk-{uuid4().hex[:8]}",
                ledgerId=ledger_id,
                projectId=self._require_ledger(ledger_id).projectId,
                sourceType=payload.get("sourceType"),
                sourceId=payload.get("sourceId"),
                workType=payload.get("workType"),
                workDescription=payload.get("workDescription"),
                hazardDescription=payload["hazardDescription"],
                riskType=payload.get("riskType"),
                riskLevel=payload.get("riskLevel"),
                reductionMeasureSummary=payload.get("reductionMeasureSummary"),
                responsibleOrganizationId=payload.get("responsibleOrganizationId"),
                relatedChecklistItemIds=payload.get("relatedChecklistItemIds", []),
                relatedFindingIds=payload.get("relatedFindingIds", []),
                recurrenceCount=payload.get("recurrenceCount", 0),
                status=payload.get("status", "identified"),
                firstDetectedAt=self._now(),
                lastDetectedAt=self._now(),
                createdAt=self._now(),
                updatedAt=self._now(),
            )
        )
        snapshot = self._refresh_after_structure_change(ledger_id, "위험요인 등록")
        return {"riskItem": asdict(risk_item), "items": [asdict(item) for item in self.repository.list_risk_items(ledger_id)], "snapshot": asdict(snapshot)}

    def update_risk_item(self, risk_item_id: str, payload: dict) -> dict:
        risk_item = self.repository.get_risk_item(risk_item_id)
        if not risk_item:
            raise SafetyHealthLedgerNotFoundError("risk item not found")
        for key, value in payload.items():
            if hasattr(risk_item, key) and value is not None:
                setattr(risk_item, key, value)
        if not risk_item.hazardDescription:
            raise SafetyHealthLedgerValidationError("hazardDescription is required")
        risk_item.updatedAt = self._now()
        stored = self.repository.save_risk_item(risk_item)
        snapshot = self._refresh_after_structure_change(risk_item.ledgerId, "위험요인 수정")
        return {"riskItem": asdict(stored), "items": [asdict(item) for item in self.repository.list_risk_items(risk_item.ledgerId)], "snapshot": asdict(snapshot)}

    def delete_risk_item(self, risk_item_id: str) -> dict:
        risk_item = self.repository.get_risk_item(risk_item_id)
        if not risk_item:
            raise SafetyHealthLedgerNotFoundError("risk item not found")
        self.repository.delete_risk_item(risk_item_id)
        snapshot = self._refresh_after_structure_change(risk_item.ledgerId, "위험요인 삭제")
        return {"deleted": True, "riskItemId": risk_item_id, "snapshot": asdict(snapshot)}

    def import_risks_from_plan(self, ledger_id: str) -> dict:
        ledger = self._require_ledger(ledger_id)
        source_plan_id = self._current_source_plan_id(ledger_id)
        if not source_plan_id:
            raise SafetyHealthLedgerValidationError("sourcePlanId is required to import risks from plan")
        imported = self._build_imported_plan_risks(ledger_id, source_plan_id)
        for risk_item in imported["riskItems"]:
            self.repository.save_risk_item(risk_item)
        for measure in imported["measures"]:
            self.repository.save_measure(measure)
        snapshot = self._refresh_after_structure_change(ledger.id, "안전관리계획서 위험요인 import")
        return {
            "createdCount": len(imported["riskItems"]),
            "riskItems": [asdict(item) for item in self.repository.list_risk_items(ledger.id)],
            "measures": [asdict(item) for item in self.repository.list_measures(ledger.id)],
            "snapshot": asdict(snapshot),
        }

    def detect_recurrence(self, ledger_id: str) -> dict:
        self._require_ledger(ledger_id)
        items = self.repository.list_risk_items(ledger_id)
        key_counts: dict[str, int] = {}
        for item in items:
            key = self._normalize_recurrence_key(item.workType, item.riskType, item.hazardDescription)
            key_counts[key] = key_counts.get(key, 0) + 1
        repeated_count = 0
        for item in items:
            key = self._normalize_recurrence_key(item.workType, item.riskType, item.hazardDescription)
            item.recurrenceCount = key_counts[key]
            if item.recurrenceCount > 1:
                item.status = "repeated"
                repeated_count += 1
            self.repository.save_risk_item(item)
        snapshot = self._refresh_after_structure_change(ledger_id, "반복 위험요인 감지")
        return {
            "repeatedCount": repeated_count,
            "items": [asdict(item) for item in self.repository.list_risk_items(ledger_id)],
            "warnings": [asdict(item) for item in snapshot.reviewWarnings],
        }

    def list_measures(self, ledger_id: str) -> list[dict]:
        self._require_ledger(ledger_id)
        return [asdict(item) for item in self.repository.list_measures(ledger_id)]

    def create_measure(self, ledger_id: str, payload: dict) -> dict:
        self._require_ledger(ledger_id)
        if not payload.get("title") or not payload.get("description"):
            raise SafetyHealthLedgerValidationError("title and description are required")
        measure = self.repository.save_measure(
            LedgerRiskReductionMeasure(
                id=f"ledger-measure-{uuid4().hex[:8]}",
                ledgerId=ledger_id,
                riskItemId=payload.get("riskItemId"),
                title=payload["title"],
                description=payload["description"],
                responsibleOrganizationId=payload.get("responsibleOrganizationId"),
                status=payload.get("status", "planned"),
                dueDate=payload.get("dueDate"),
                sourceType=payload.get("sourceType"),
                sourceId=payload.get("sourceId"),
                createdAt=self._now(),
                updatedAt=self._now(),
            )
        )
        snapshot = self._refresh_after_structure_change(ledger_id, "감소대책 등록")
        return {"measure": asdict(measure), "items": [asdict(item) for item in self.repository.list_measures(ledger_id)], "snapshot": asdict(snapshot)}

    def update_measure(self, measure_id: str, payload: dict) -> dict:
        measure = self.repository.get_measure(measure_id)
        if not measure:
            raise SafetyHealthLedgerNotFoundError("measure not found")
        for key, value in payload.items():
            if hasattr(measure, key) and value is not None:
                setattr(measure, key, value)
        if not measure.title or not measure.description:
            raise SafetyHealthLedgerValidationError("title and description are required")
        measure.updatedAt = self._now()
        stored = self.repository.save_measure(measure)
        snapshot = self._refresh_after_structure_change(measure.ledgerId, "감소대책 수정")
        return {"measure": asdict(stored), "items": [asdict(item) for item in self.repository.list_measures(measure.ledgerId)], "snapshot": asdict(snapshot)}

    def delete_measure(self, measure_id: str) -> dict:
        measure = self.repository.get_measure(measure_id)
        if not measure:
            raise SafetyHealthLedgerNotFoundError("measure not found")
        self.repository.delete_measure(measure_id)
        snapshot = self._refresh_after_structure_change(measure.ledgerId, "감소대책 삭제")
        return {"deleted": True, "measureId": measure_id, "snapshot": asdict(snapshot)}

    def list_inspection_history(self, ledger_id: str) -> list[dict]:
        self._require_ledger(ledger_id)
        return [asdict(item) for item in self.repository.list_inspection_history(ledger_id)]

    def sync_inspection_history(self, ledger_id: str) -> dict:
        ledger = self._require_ledger(ledger_id)
        items = self._build_inspection_history(ledger.id, ledger.projectId)
        self.repository.replace_inspection_history(ledger.id, items)
        snapshot = self._refresh_after_structure_change(ledger.id, "점검이력 동기화")
        return {"createdCount": len(items), "items": [asdict(item) for item in items], "version": asdict(self.repository.get_latest_version(ledger.id)), "snapshot": asdict(snapshot)}

    def list_finding_history(self, ledger_id: str) -> list[dict]:
        self._require_ledger(ledger_id)
        return [asdict(item) for item in self.repository.list_finding_history(ledger_id)]

    def sync_finding_history(self, ledger_id: str) -> dict:
        ledger = self._require_ledger(ledger_id)
        items = self._build_finding_history(ledger.id, ledger.projectId)
        self.repository.replace_finding_history(ledger.id, items)
        snapshot = self._refresh_after_structure_change(ledger.id, "지적사항/조치 이력 동기화")
        return {"createdCount": len(items), "items": [asdict(item) for item in items], "version": asdict(self.repository.get_latest_version(ledger.id)), "snapshot": asdict(snapshot)}

    def list_safety_cost_history(self, ledger_id: str) -> list[dict]:
        self._require_ledger(ledger_id)
        return [asdict(item) for item in self.repository.list_safety_cost_history(ledger_id)]

    def sync_safety_cost_history(self, ledger_id: str) -> dict:
        ledger = self._require_ledger(ledger_id)
        items = self._build_safety_cost_history(ledger.id, ledger.projectId)
        self.repository.replace_safety_cost_history(ledger.id, items)
        snapshot = self._refresh_after_structure_change(ledger.id, "안전관리비 이력 동기화")
        return {"createdCount": len(items), "items": [asdict(item) for item in items], "version": asdict(self.repository.get_latest_version(ledger.id)), "snapshot": asdict(snapshot)}

    def list_attachments(self, ledger_id: str) -> list[dict]:
        self._require_ledger(ledger_id)
        return [asdict(item) for item in self.repository.list_attachments(ledger_id)]

    def link_attachment(self, ledger_id: str, payload: dict) -> dict:
        ledger = self._require_ledger(ledger_id)
        attachment = self.repository.save_attachment(
            LedgerAttachment(
                id=f"ledger-attachment-{uuid4().hex[:8]}",
                ledgerId=ledger.id,
                projectId=ledger.projectId,
                fileId=payload["fileId"],
                fileName=payload["fileName"],
                storagePath=payload["storagePath"],
                attachmentType=payload["attachmentType"],
                sourceEntityType=payload.get("sourceEntityType"),
                sourceEntityId=payload.get("sourceEntityId"),
                sourceLabel=payload.get("sourceLabel"),
                createdAt=self._now(),
                updatedAt=self._now(),
            )
        )
        self.repository.save_file_asset(
            FileAsset(
                id=attachment.fileId,
                projectId=ledger.projectId,
                fileName=attachment.fileName,
                fileType="application/octet-stream",
                storagePath=attachment.storagePath,
                linkedEntityType="safety_health_ledger_attachment",
                linkedEntityId=attachment.id,
                createdAt=self._now(),
            )
        )
        snapshot = self._refresh_after_structure_change(ledger.id, "첨부자료 연결")
        return {"attachment": asdict(attachment), "items": [asdict(item) for item in self.repository.list_attachments(ledger.id)], "snapshot": asdict(snapshot)}

    def delete_attachment(self, attachment_id: str) -> dict:
        attachment = self.repository.get_attachment(attachment_id)
        if not attachment:
            raise SafetyHealthLedgerNotFoundError("attachment not found")
        self.repository.delete_attachment(attachment_id)
        snapshot = self._refresh_after_structure_change(attachment.ledgerId, "첨부자료 삭제")
        return {"deleted": True, "attachmentId": attachment_id, "snapshot": asdict(snapshot)}

    def list_versions(self, ledger_id: str) -> list[dict]:
        self._require_ledger(ledger_id)
        return [asdict(item) for item in self.repository.list_versions(ledger_id)]

    def create_version(self, ledger_id: str, payload: dict) -> dict:
        ledger = self._require_ledger(ledger_id)
        snapshot = self._require_snapshot(ledger.id)
        ledger.currentVersionNo += 1
        ledger.updatedAt = self._now()
        self.repository.save_ledger(ledger)
        version = self._create_version(ledger, snapshot, payload.get("changeSummary") or "수동 버전 저장", payload.get("createdBy") or "user-engineer-001")
        return {"version": asdict(version), "items": [asdict(item) for item in self.repository.list_versions(ledger_id)]}

    def _serialize_list_item(self, ledger: SafetyHealthLedger) -> dict:
        snapshot = self._require_snapshot(ledger.id)
        latest_version = self.repository.get_latest_version(ledger.id)
        return {
            "ledger": asdict(ledger),
            "missingRequiredCount": len([item for item in snapshot.missingFields if item.severity == "required"]),
            "warningCount": len(snapshot.reviewWarnings),
            "latestVersion": asdict(latest_version) if latest_version else None,
        }

    def _mutation_payload(
        self,
        ledger: SafetyHealthLedger,
        snapshot: SafetyHealthLedgerSnapshot,
        version: SafetyHealthLedgerVersion | None,
    ) -> dict:
        return {
            "ledger": asdict(ledger),
            "snapshot": asdict(snapshot),
            "warnings": [asdict(item) for item in snapshot.reviewWarnings],
            "missingFields": [asdict(item) for item in snapshot.missingFields],
            "version": asdict(version) if version else None,
        }

    def _refresh_after_structure_change(self, ledger_id: str, change_summary: str) -> SafetyHealthLedgerSnapshot:
        ledger = self._require_ledger(ledger_id)
        snapshot = self._build_snapshot(
            ledger_id=ledger.id,
            project_id=ledger.projectId,
            template_id=ledger.templateId,
            source_plan_id=self._current_source_plan_id(ledger_id),
            preserve_existing=True,
        )
        self.repository.save_snapshot(ledger.id, snapshot)
        ledger.latestSnapshot = asdict(snapshot)
        ledger.currentVersionNo += 1
        ledger.updatedAt = self._now()
        self.repository.save_ledger(ledger)
        self._create_version(ledger, snapshot, change_summary)
        return snapshot

    def _create_version(
        self,
        ledger: SafetyHealthLedger,
        snapshot: SafetyHealthLedgerSnapshot,
        change_summary: str,
        created_by: str = "system",
    ) -> SafetyHealthLedgerVersion:
        version = self.repository.add_version(
            SafetyHealthLedgerVersion(
                id=f"safety-health-ledger-version-{uuid4().hex[:8]}",
                ledgerId=ledger.id,
                versionNo=ledger.currentVersionNo,
                snapshot=asdict(snapshot),
                createdBy=created_by,
                createdAt=self._now(),
                changeSummary=change_summary,
            )
        )
        return version

    def _build_snapshot(
        self,
        ledger_id: str,
        project_id: str,
        template_id: str,
        source_plan_id: str | None,
        preserve_existing: bool = False,
        detect_stale_against: str | None = None,
    ) -> SafetyHealthLedgerSnapshot:
        project = self._require_project(project_id)
        source_plan = self.safety_management_plan_repository.get_plan(source_plan_id) if source_plan_id else None
        risk_items = self.repository.list_risk_items(ledger_id) if preserve_existing else []
        measures = self.repository.list_measures(ledger_id) if preserve_existing else []
        inspection_history = self.repository.list_inspection_history(ledger_id) if preserve_existing else []
        finding_history = self.repository.list_finding_history(ledger_id) if preserve_existing else []
        safety_cost_history = self.repository.list_safety_cost_history(ledger_id) if preserve_existing else []
        attachments = self.repository.list_attachments(ledger_id) if preserve_existing else []

        source_links = self._build_source_links(project_id, source_plan_id)
        rounds = self.inspection_repository.list_rounds(project_id)
        latest_updated_candidates = [project.updatedAt]
        if source_plan:
            latest_updated_candidates.append(source_plan.updatedAt)
        latest_updated_candidates.extend([item.updatedAt for item in rounds if item.updatedAt])
        latest_updated_candidates.extend([item.updatedAt for item in self.finding_repository.list_project_findings(project_id) if item.updatedAt])
        latest_updated_candidates.extend([item.updatedAt for item in self.safety_cost_repository.list_project_usages(project_id) if item.updatedAt])

        snapshot = SafetyHealthLedgerSnapshot(
            meta=LedgerMeta(
                projectId=project.id,
                projectName=project.projectName,
                siteName=project.siteName,
                siteAddress=project.siteAddress,
                constructionType=project.constructionType,
                ownerNames=self._owner_names(project.id),
                contractorName=self._contractor_name(project.id),
                engineerName=self._engineer_name(project.id),
                constructionStartDate=project.startDate,
                constructionEndDate=project.endDate,
                latestInspectionRoundNo=rounds[-1].roundNo if rounds else None,
                latestUpdatedAt=max([item for item in latest_updated_candidates if item], default=self._now()),
                sourcePlanId=source_plan_id,
            ),
            sections=self._build_sections(
                ledger_id=ledger_id,
                risk_items=risk_items,
                measures=measures,
                inspection_history=inspection_history,
                finding_history=finding_history,
                safety_cost_history=safety_cost_history,
                attachments=attachments,
                source_links=source_links,
            ),
            riskItems=risk_items,
            measures=measures,
            inspectionHistory=inspection_history,
            findingHistory=finding_history,
            safetyCostHistory=safety_cost_history,
            attachments=attachments,
            sourceLinks=source_links,
        )
        snapshot.missingFields, snapshot.reviewWarnings = self._build_validation(
            self._require_ledger(ledger_id),
            snapshot,
            detect_stale_against=detect_stale_against,
        )
        return snapshot

    def _build_sections(
        self,
        ledger_id: str,
        risk_items: list[LedgerRiskItem],
        measures: list[LedgerRiskReductionMeasure],
        inspection_history: list[LedgerInspectionHistory],
        finding_history: list[LedgerFindingHistory],
        safety_cost_history: list[LedgerSafetyCostHistory],
        attachments: list[LedgerAttachment],
        source_links: list[SourceLink],
    ) -> list[SafetyHealthLedgerSection]:
        repeated_count = len([item for item in risk_items if item.recurrenceCount > 1 or item.status == "repeated"])
        open_findings = len([item for item in finding_history if item.status not in {"verified", "closed"}])
        confirmed_costs = len([item for item in safety_cost_history if item.appropriatenessStatus == "appropriate"])
        rows: list[SafetyHealthLedgerSection] = []
        for order, (key, title) in enumerate(LEDGER_SECTION_ROWS, start=1):
            content: dict[str, object] = {
                "title": title,
                "ledgerId": ledger_id,
                "summary": "linked data draft. human review required.",
            }
            if key == "hazard_risk_register":
                content.update(
                    {
                        "totalRisks": len(risk_items),
                        "repeatedRisks": repeated_count,
                        "highRisks": len([item for item in risk_items if item.riskLevel in {"high", "critical"}]),
                    }
                )
            elif key == "risk_reduction_measures":
                content.update(
                    {
                        "measureCount": len(measures),
                        "needsActionCount": len([item for item in measures if item.status not in {"done", "closed"}]),
                    }
                )
            elif key == "inspection_history":
                content.update({"historyCount": len(inspection_history)})
            elif key in {"finding_history", "corrective_action_history"}:
                content.update({"findingCount": len(finding_history), "openFindingCount": open_findings})
            elif key == "safety_cost_history":
                content.update({"usageCount": len(safety_cost_history), "confirmedCount": confirmed_costs})
            elif key == "attachments":
                content.update({"attachmentCount": len(attachments)})
            section_links = [item for item in source_links if item.sectionKey == key]
            rows.append(
                SafetyHealthLedgerSection(
                    id=f"{ledger_id}-{key}",
                    ledgerId=ledger_id,
                    key=key,
                    title=title,
                    order=order,
                    status="review" if key in {"hazard_risk_register", "inspection_history", "finding_history"} else "ai_draft",
                    content=content,
                    sourceLinks=section_links,
                    updatedAt=self._now(),
                )
            )
        return rows

    def _build_validation(
        self,
        ledger: SafetyHealthLedger,
        snapshot: SafetyHealthLedgerSnapshot,
        detect_stale_against: str | None = None,
    ) -> tuple[list[MissingField], list[ReviewWarning]]:
        missing_fields: list[MissingField] = []
        warnings: list[ReviewWarning] = []

        if not snapshot.riskItems:
            missing_fields.append(
                MissingField(
                    field="riskItems",
                    message="위험요인 register가 비어 있습니다.",
                    severity="required",
                    label="위험요인 register",
                    sectionKey="hazard_risk_register",
                )
            )
        if not snapshot.measures:
            missing_fields.append(
                MissingField(
                    field="measures",
                    message="위험성 감소대책이 비어 있습니다.",
                    severity="required",
                    label="감소대책",
                    sectionKey="risk_reduction_measures",
                )
            )
        if not snapshot.inspectionHistory:
            missing_fields.append(
                MissingField(
                    field="inspectionHistory",
                    message="점검이력 누적이 아직 없습니다.",
                    severity="recommended",
                    label="점검이력",
                    sectionKey="inspection_history",
                )
            )
        if not snapshot.attachments:
            missing_fields.append(
                MissingField(
                    field="attachments",
                    message="대장 첨부자료가 연결되지 않았습니다.",
                    severity="recommended",
                    label="첨부자료",
                    sectionKey="attachments",
                )
            )
        repeated_items = [item for item in snapshot.riskItems if item.recurrenceCount > 1 or item.status == "repeated"]
        if repeated_items:
            warnings.append(
                ReviewWarning(
                    type="repeated_risks_detected",
                    message="반복/재발 위험요인이 있어 누적 관리 검토가 필요합니다.",
                    severity="warning",
                    sectionKey="hazard_risk_register",
                )
            )
        open_findings = [item for item in snapshot.findingHistory if item.status not in {"verified", "closed"}]
        if open_findings:
            warnings.append(
                ReviewWarning(
                    type="open_findings_remaining",
                    message="미확인 또는 미종결 지적사항이 남아 있습니다.",
                    severity="warning",
                    sectionKey="finding_history",
                )
            )
        if detect_stale_against:
            stale_detected = False
            latest_source_updated_at = snapshot.meta.latestUpdatedAt or ""
            if latest_source_updated_at and latest_source_updated_at > detect_stale_against:
                stale_detected = True
            else:
                previous_snapshot = ledger.latestSnapshot if isinstance(ledger.latestSnapshot, dict) else {}
                previous_meta = previous_snapshot.get("meta", {}) if isinstance(previous_snapshot, dict) else {}
                stale_detected = any(
                    [
                        previous_meta.get("projectName") != snapshot.meta.projectName,
                        previous_meta.get("siteName") != snapshot.meta.siteName,
                        previous_meta.get("contractorName") != snapshot.meta.contractorName,
                        previous_meta.get("latestInspectionRoundNo") != snapshot.meta.latestInspectionRoundNo,
                    ]
                )
            if stale_detected:
                warnings.append(
                    ReviewWarning(
                        type="stale_source_warning",
                        message="원본 데이터가 대장 저장 시점 이후 갱신되었습니다. sync preview를 다시 검토하세요.",
                        severity="warning",
                        sectionKey="revision_history",
                    )
                )
        if ledger.exportedFileId and ledger.status == "exported":
            warnings.append(
                ReviewWarning(
                    type="exported_snapshot_exists",
                    message="이미 export된 최종본이 있습니다. 최신 linked data 재검토 여부를 확인하세요.",
                    severity="info",
                    sectionKey="revision_history",
                )
            )
        return missing_fields, warnings

    def _build_imported_plan_risks(self, ledger_id: str, source_plan_id: str) -> dict:
        plan = self.safety_management_plan_repository.get_plan(source_plan_id)
        if not plan:
            raise SafetyHealthLedgerValidationError("source safety management plan not found")
        risks = self.safety_management_plan_repository.list_risk_items(plan.id)
        created_risks: list[LedgerRiskItem] = []
        created_measures: list[LedgerRiskReductionMeasure] = []
        for item in risks:
            risk_item = LedgerRiskItem(
                id=f"ledger-risk-{uuid4().hex[:8]}",
                ledgerId=ledger_id,
                projectId=plan.projectId,
                sourceType="safety_management_plan",
                sourceId=item.id,
                workType=item.workTypeName,
                hazardDescription=item.hazard,
                riskType=item.riskCause,
                riskLevel=item.riskLevel,
                reductionMeasureSummary=item.reductionMeasure,
                recurrenceCount=1,
                status="planned",
                firstDetectedAt=self._now(),
                lastDetectedAt=self._now(),
                createdAt=self._now(),
                updatedAt=self._now(),
            )
            created_risks.append(risk_item)
            created_measures.append(
                LedgerRiskReductionMeasure(
                    id=f"ledger-measure-{uuid4().hex[:8]}",
                    ledgerId=ledger_id,
                    riskItemId=risk_item.id,
                    title=f"{item.workTypeName or '공종'} 감소대책",
                    description=item.reductionMeasure,
                    status="planned",
                    sourceType="safety_management_plan",
                    sourceId=item.id,
                    createdAt=self._now(),
                    updatedAt=self._now(),
                )
            )
        return {"riskItems": created_risks, "measures": created_measures}

    def _build_inspection_history(self, ledger_id: str, project_id: str) -> list[LedgerInspectionHistory]:
        rows: list[LedgerInspectionHistory] = []
        for round_item in self.inspection_repository.list_rounds(project_id):
            sessions = self.checklist_repository.list_sessions_by_round(round_item.id)
            session = sessions[0] if sessions else None
            results = self.checklist_repository.list_results(session.id) if session else []
            round_findings = self.finding_repository.list_round_findings(round_item.id)
            caution_count = sum(1 for item in results if item.result == "caution")
            bad_count = sum(1 for item in results if item.result == "bad")
            completed_actions = 0
            for finding in round_findings:
                actions = self.finding_repository.list_corrective_actions(finding.id)
                if any(action.status == "verified" for action in actions):
                    completed_actions += 1
            owner_tasks = self.inspection_repository.list_owner_report_tasks(round_item.id)
            rows.append(
                LedgerInspectionHistory(
                    id=f"ledger-inspection-history-{round_item.id}",
                    ledgerId=ledger_id,
                    projectId=project_id,
                    inspectionRoundId=round_item.id,
                    roundNo=round_item.roundNo,
                    documentNo=round_item.documentNo,
                    inspectionDate=round_item.actualInspectionDate or round_item.plannedDate,
                    inspectorName=round_item.inspectorUserId,
                    ownerReportSubmittedCount=len([item for item in owner_tasks if item.submittedAt]),
                    checklistSessionId=session.id if session else None,
                    checklistSummary="회차별 현장점검 결과 누적",
                    cautionCount=caution_count,
                    badCount=bad_count,
                    findingCount=len(round_findings),
                    actionCompletedCount=completed_actions,
                    openFindingCount=max(len(round_findings) - completed_actions, 0),
                    linkedReportIds=[document.id for document in round_item.documentInstances],
                    createdAt=self._now(),
                    updatedAt=self._now(),
                )
            )
        return rows

    def _build_finding_history(self, ledger_id: str, project_id: str) -> list[LedgerFindingHistory]:
        rows: list[LedgerFindingHistory] = []
        for finding in self.finding_repository.list_project_findings(project_id):
            actions = self.finding_repository.list_corrective_actions(finding.id)
            prioritized_action = next((item for item in actions if item.status == "verified"), None) or (actions[0] if actions else None)
            recurrence_count = len(
                [
                    item
                    for item in self.finding_repository.list_project_findings(project_id)
                    if item.riskType == finding.riskType and item.title[:10] == finding.title[:10]
                ]
            )
            rows.append(
                LedgerFindingHistory(
                    id=f"ledger-finding-history-{finding.id}",
                    ledgerId=ledger_id,
                    projectId=project_id,
                    inspectionRoundId=finding.inspectionRoundId,
                    findingId=finding.id,
                    correctiveActionId=prioritized_action.id if prioritized_action else None,
                    ownerPartyId=finding.ownerPartyId,
                    title=finding.title,
                    riskType=finding.riskType,
                    responsibleOrganizationId=finding.responsiblePartyId,
                    status=finding.status,
                    requiredAction=finding.requiredAction,
                    actionDetail=prioritized_action.actionDetail if prioritized_action else None,
                    verifiedBy=prioritized_action.verifiedBy if prioritized_action else None,
                    verifiedAt=prioritized_action.verifiedAt if prioritized_action else None,
                    recurrenceCount=recurrence_count,
                    reportInclude=finding.reportInclude,
                    createdAt=self._now(),
                    updatedAt=self._now(),
                )
            )
        return rows

    def _build_safety_cost_history(self, ledger_id: str, project_id: str) -> list[LedgerSafetyCostHistory]:
        rows: list[LedgerSafetyCostHistory] = []
        for usage in self.safety_cost_repository.list_project_usages(project_id):
            rows.append(
                LedgerSafetyCostHistory(
                    id=f"ledger-safety-cost-history-{usage.id}",
                    ledgerId=ledger_id,
                    projectId=project_id,
                    inspectionRoundId=usage.inspectionRoundId,
                    ownerPartyId=usage.ownerPartyId,
                    usageId=usage.id,
                    basisMonth=usage.basisMonth,
                    calculatedAmount=usage.calculatedAmount,
                    usedAmount=usage.usedAmount,
                    usedRateCalculated=usage.usedRateCalculated,
                    appropriatenessStatus=usage.appropriatenessStatus,
                    reportLinked=bool(usage.syncedDocumentId),
                    createdAt=self._now(),
                    updatedAt=self._now(),
                )
            )
        return rows

    def _build_source_links(self, project_id: str, source_plan_id: str | None) -> list[SourceLink]:
        project = self._require_project(project_id)
        links = [
            SourceLink(
                id=f"ledger-source-link-project-{project_id}",
                sectionKey="project_summary",
                sourceEntityType="project",
                sourceEntityId=project_id,
                sourceLabel="프로젝트 원장",
                sourceUpdatedAt=project.updatedAt,
                linkedAt=self._now(),
            )
        ]
        if source_plan_id:
            plan = self.safety_management_plan_repository.get_plan(source_plan_id)
            if plan:
                links.append(
                    SourceLink(
                        id=f"ledger-source-link-plan-{source_plan_id}",
                        sectionKey="hazard_risk_register",
                        sourceEntityType="safety_management_plan",
                        sourceEntityId=source_plan_id,
                        sourceLabel="안전관리계획서",
                        sourceUpdatedAt=plan.updatedAt,
                        linkedAt=self._now(),
                    )
                )
        return links

    def _normalize_recurrence_key(self, work_type: str | None, risk_type: str | None, hazard_description: str) -> str:
        return "|".join(
            [
                (work_type or "").strip().lower(),
                (risk_type or "").strip().lower(),
                "".join((hazard_description or "").strip().lower().split())[:24],
            ]
        )

    def _current_source_plan_id(self, ledger_id: str) -> str | None:
        snapshot = self.repository.get_snapshot(ledger_id)
        if snapshot and snapshot.meta.sourcePlanId:
            return snapshot.meta.sourcePlanId
        return None

    def _owner_names(self, project_id: str) -> list[str]:
        organizations = {item.id: item.name for item in self.project_repository.list_organizations()}
        return [
            organizations.get(item.organizationId, item.organizationId)
            for item in self.project_repository.list_project_parties(project_id)
            if item.role == "owner"
        ]

    def _contractor_name(self, project_id: str) -> str | None:
        organizations = {item.id: item.name for item in self.project_repository.list_organizations()}
        contractor = next(
            (item for item in self.project_repository.list_project_parties(project_id) if item.role == "contractor"),
            None,
        )
        if not contractor:
            return None
        return organizations.get(contractor.organizationId)

    def _engineer_name(self, project_id: str) -> str | None:
        organizations = {item.id: item.name for item in self.project_repository.list_organizations()}
        engineer = next(
            (item for item in self.project_repository.list_project_parties(project_id) if item.role == "engineer"),
            None,
        )
        if not engineer:
            return None
        return organizations.get(engineer.organizationId)

    def _require_project(self, project_id: str):
        project = self.project_repository.get_project(project_id)
        if not project:
            raise SafetyHealthLedgerNotFoundError("project not found")
        return project

    def _require_ledger(self, ledger_id: str) -> SafetyHealthLedger:
        ledger = self.repository.get_ledger(ledger_id)
        if not ledger:
            raise SafetyHealthLedgerNotFoundError("safety health ledger not found")
        return ledger

    def _require_snapshot(self, ledger_id: str) -> SafetyHealthLedgerSnapshot:
        snapshot = self.repository.get_snapshot(ledger_id)
        if not snapshot:
            raise SafetyHealthLedgerNotFoundError("safety health ledger snapshot not found")
        return snapshot

    def _now(self) -> str:
        return "2026-05-10T09:00:00+09:00"
