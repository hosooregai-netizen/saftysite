from dataclasses import asdict
from uuid import uuid4

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
from server.app.repositories.finding_repository import FindingRepository
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.project_repository import ProjectRepository


class FindingNotFoundError(Exception):
    pass


class FindingValidationError(Exception):
    pass


class FindingService:
    def __init__(
        self,
        repository: FindingRepository,
        project_repository: ProjectRepository,
        inspection_repository: InspectionRepository,
        checklist_repository: ChecklistRepository,
    ) -> None:
        self.repository = repository
        self.project_repository = project_repository
        self.inspection_repository = inspection_repository
        self.checklist_repository = checklist_repository

    def list_project_findings(self, project_id: str) -> list[dict]:
        self._require_project(project_id)
        return [self._serialize_finding_list_item(item) for item in self.repository.list_project_findings(project_id)]

    def create_project_finding(self, project_id: str, payload: dict) -> dict:
        self._require_project(project_id)
        inspection_round_id = payload.get("inspectionRoundId")
        if not inspection_round_id:
            raise FindingValidationError("inspectionRoundId is required")
        round_item = self._require_round(inspection_round_id)
        if round_item.projectId != project_id:
            raise FindingValidationError("inspectionRoundId must belong to projectId")
        return self._create_finding(round_item.projectId, round_item.id, payload)

    def list_round_findings(self, inspection_round_id: str) -> list[dict]:
        self._require_round(inspection_round_id)
        return [self._serialize_finding_list_item(item) for item in self.repository.list_round_findings(inspection_round_id)]

    def create_round_finding(self, inspection_round_id: str, payload: dict) -> dict:
        round_item = self._require_round(inspection_round_id)
        return self._create_finding(round_item.projectId, inspection_round_id, payload)

    def get_finding(self, finding_id: str) -> dict:
        finding = self._require_finding(finding_id)
        return self._serialize_finding_detail(finding)

    def update_finding(self, finding_id: str, payload: dict) -> dict:
        finding = self._require_finding(finding_id)
        source_type = payload.get("sourceType", finding.sourceType)
        source_id = payload.get("sourceId", finding.sourceId)
        duplicate = self.repository.find_duplicate_source(
            finding.projectId,
            finding.inspectionRoundId,
            source_type,
            source_id,
            exclude_finding_id=finding.id,
        )
        if duplicate:
            raise FindingValidationError("sourceType + sourceId duplicate finding exists")
        for key, value in payload.items():
            if hasattr(finding, key):
                setattr(finding, key, value)
        self._validate_finding(finding)
        finding.updatedAt = self._now()
        stored = self.repository.save_finding(finding)
        audit_log = self._add_audit_log(
            entity_type="finding",
            entity_id=stored.id,
            action="finding.updated",
            summary="지적사항이 수정되었습니다.",
            field_names=list(payload.keys()),
        )
        return {"finding": asdict(stored), "warnings": self._finding_warnings(stored), "auditLog": asdict(audit_log)}

    def delete_finding(self, finding_id: str) -> dict:
        finding = self._require_finding(finding_id)
        self.repository.delete_finding(finding_id)
        return {"deleted": True, "findingId": finding_id}

    def request_action(self, finding_id: str, payload: dict) -> dict:
        finding = self._require_finding(finding_id)
        required_action = payload.get("requiredAction") or finding.requiredAction
        if not required_action:
            raise FindingValidationError("requiredAction is required before action_requested status")
        finding.requiredAction = required_action
        if payload.get("responsiblePartyId"):
            finding.responsiblePartyId = payload["responsiblePartyId"]
        if payload.get("dueDate"):
            finding.dueDate = payload["dueDate"]
        finding.status = "action_requested"
        finding.updatedAt = self._now()
        stored = self.repository.save_finding(finding)
        self._add_timeline_event(stored.id, "finding.action_requested", "시공사 조치 요청 상태로 전환되었습니다.")
        audit_log = self._add_audit_log(
            entity_type="finding",
            entity_id=stored.id,
            action="finding.action_requested",
            summary="지적사항 조치 요청이 등록되었습니다.",
            field_names=["requiredAction", "responsiblePartyId", "dueDate"],
        )
        return {"finding": asdict(stored), "warnings": self._finding_warnings(stored), "auditLog": asdict(audit_log)}

    def verify_finding(self, finding_id: str, payload: dict) -> dict:
        finding = self._require_finding(finding_id)
        if not self._has_verified_action(finding_id):
            raise FindingValidationError("verified corrective action required")
        finding.status = "verified"
        finding.updatedAt = self._now()
        stored = self.repository.save_finding(finding)
        self._add_timeline_event(stored.id, "finding.verified", payload.get("comment") or "지적사항이 확인되었습니다.")
        audit_log = self._add_audit_log(
            entity_type="finding",
            entity_id=stored.id,
            action="finding.verified",
            summary="지적사항이 확인되었습니다.",
            field_names=["comment"],
        )
        return {"finding": asdict(stored), "warnings": self._finding_warnings(stored), "auditLog": asdict(audit_log)}

    def reject_finding(self, finding_id: str, payload: dict) -> dict:
        finding = self._require_finding(finding_id)
        finding.status = "rejected"
        finding.updatedAt = self._now()
        stored = self.repository.save_finding(finding)
        self._add_timeline_event(stored.id, "finding.rejected", payload.get("reason") or "조치 확인이 반려되었습니다.")
        audit_log = self._add_audit_log(
            entity_type="finding",
            entity_id=stored.id,
            action="finding.rejected",
            summary="지적사항 확인이 반려되었습니다.",
            field_names=["reason"],
        )
        return {"finding": asdict(stored), "warnings": self._finding_warnings(stored), "auditLog": asdict(audit_log)}

    def close_finding(self, finding_id: str) -> dict:
        finding = self._require_finding(finding_id)
        if not self._has_verified_action(finding_id):
            raise FindingValidationError("at least one verified corrective action required")
        finding.status = "closed"
        finding.updatedAt = self._now()
        stored = self.repository.save_finding(finding)
        self._add_timeline_event(stored.id, "finding.closed", "지적사항이 종결되었습니다.")
        audit_log = self._add_audit_log(
            entity_type="finding",
            entity_id=stored.id,
            action="finding.closed",
            summary="지적사항이 종결되었습니다.",
            field_names=["status"],
        )
        return {"finding": asdict(stored), "warnings": [], "auditLog": asdict(audit_log)}

    def link_checklist_result(self, finding_id: str, checklist_result_id: str) -> dict:
        finding = self._require_finding(finding_id)
        result = self.checklist_repository.get_result(checklist_result_id)
        if not result:
            raise FindingValidationError("checklist result not found")
        finding.checklistResultId = checklist_result_id
        finding.sourceType = finding.sourceType or "checklist_result"
        finding.sourceId = finding.sourceId or checklist_result_id
        finding.updatedAt = self._now()
        stored = self.repository.save_finding(finding)
        result.findingId = stored.id
        result.reportMappingStatus = "mapped"
        self.checklist_repository.save_result(result)
        return {"finding": asdict(stored), "warnings": []}

    def link_owner(self, finding_id: str, owner_party_id: str) -> dict:
        finding = self._require_finding(finding_id)
        self._validate_owner_party(finding.projectId, owner_party_id)
        finding.ownerPartyId = owner_party_id
        finding.updatedAt = self._now()
        stored = self.repository.save_finding(finding)
        return {"finding": asdict(stored), "warnings": []}

    def list_corrective_actions(self, finding_id: str) -> list[dict]:
        self._require_finding(finding_id)
        return [asdict(item) for item in self.repository.list_corrective_actions(finding_id)]

    def create_corrective_action(self, finding_id: str, payload: dict) -> dict:
        finding = self._require_finding(finding_id)
        action = CorrectiveAction(
            id=f"corrective-action-{uuid4().hex[:8]}",
            findingId=finding_id,
            projectId=finding.projectId,
            inspectionRoundId=finding.inspectionRoundId,
            actionDetail=payload["actionDetail"],
            actionDate=payload.get("actionDate"),
            actionOrganizationId=payload.get("actionOrganizationId"),
            status=payload.get("status", "draft"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_corrective_action(action)
        self._add_timeline_event(finding_id, "corrective-action.created", "조치현황이 등록되었습니다.")
        return {"correctiveAction": asdict(stored), "warnings": []}

    def get_corrective_action(self, action_id: str) -> dict:
        action = self._require_action(action_id)
        return {"correctiveAction": asdict(action), "warnings": []}

    def update_corrective_action(self, action_id: str, payload: dict) -> dict:
        action = self._require_action(action_id)
        for key, value in payload.items():
            if hasattr(action, key):
                setattr(action, key, value)
        action.updatedAt = self._now()
        stored = self.repository.save_corrective_action(action)
        return {"correctiveAction": asdict(stored), "warnings": []}

    def delete_corrective_action(self, action_id: str) -> dict:
        self._require_action(action_id)
        self.repository.delete_corrective_action(action_id)
        return {"deleted": True}

    def submit_corrective_action(self, action_id: str, payload: dict) -> dict:
        action = self._require_action(action_id)
        if not (payload.get("actionDetail") or action.actionDetail):
            raise FindingValidationError("CorrectiveAction submit requires actionDetail")
        action.actionDetail = payload.get("actionDetail") or action.actionDetail
        action.actionDate = payload.get("actionDate") or action.actionDate
        action.actionOrganizationId = payload.get("actionOrganizationId") or action.actionOrganizationId
        action.submittedBy = payload.get("submittedBy")
        action.submittedAt = payload.get("submittedAt") or self._now()
        action.status = "submitted"
        action.updatedAt = self._now()
        stored = self.repository.save_corrective_action(action)
        finding = self._require_finding(action.findingId)
        finding.status = "action_requested"
        finding.updatedAt = self._now()
        self.repository.save_finding(finding)
        self._add_timeline_event(finding.id, "corrective-action.submitted", "조치현황이 제출되었습니다.")
        return {"correctiveAction": asdict(stored), "warnings": []}

    def verify_corrective_action(self, action_id: str, payload: dict) -> dict:
        action = self._require_action(action_id)
        if not payload.get("verifiedBy") or not payload.get("verifiedAt"):
            raise FindingValidationError("CorrectiveAction verify requires verifiedBy and verifiedAt")
        action.verifiedBy = payload["verifiedBy"]
        action.verifiedAt = payload["verifiedAt"]
        action.verificationComment = payload.get("verificationComment")
        action.status = "verified"
        action.updatedAt = self._now()
        stored = self.repository.save_corrective_action(action)
        finding = self._require_finding(action.findingId)
        if finding.status != "closed":
            finding.status = "verified"
            finding.updatedAt = self._now()
            self.repository.save_finding(finding)
        self._add_timeline_event(finding.id, "corrective-action.verified", "조치현황이 확인되었습니다.")
        return {"correctiveAction": asdict(stored), "warnings": []}

    def reject_corrective_action(self, action_id: str, payload: dict) -> dict:
        action = self._require_action(action_id)
        if not payload.get("rejectedReason"):
            raise FindingValidationError("CorrectiveAction reject requires rejectedReason")
        action.rejectedReason = payload["rejectedReason"]
        action.status = "rejected"
        action.updatedAt = self._now()
        stored = self.repository.save_corrective_action(action)
        finding = self._require_finding(action.findingId)
        finding.status = "rejected"
        finding.updatedAt = self._now()
        self.repository.save_finding(finding)
        self._add_timeline_event(finding.id, "corrective-action.rejected", "조치현황이 반려되었습니다.")
        return {"correctiveAction": asdict(stored), "warnings": []}

    def list_photos(self, finding_id: str) -> list[dict]:
        self._require_finding(finding_id)
        return [asdict(item) for item in self.repository.list_finding_photos(finding_id)]

    def upload_photo(self, finding_id: str, payload: dict) -> dict:
        finding = self._require_finding(finding_id)
        if not payload.get("fileId"):
            raise FindingValidationError("EvidencePhoto requires fileId")
        photo = EvidencePhoto(
            id=f"evidence-photo-{uuid4().hex[:8]}",
            projectId=finding.projectId,
            inspectionRoundId=finding.inspectionRoundId,
            ownerPartyId=finding.ownerPartyId,
            findingId=finding_id,
            correctiveActionId=payload.get("correctiveActionId"),
            fileId=payload["fileId"],
            photoType=self._normalize_photo_type(payload.get("photoType", "finding_photo")),
            fileName=payload.get("fileName", f"{finding_id}.jpg"),
            storagePath=payload.get("storagePath", f"/draft/{finding_id}.jpg"),
            caption=payload.get("caption"),
            takenAt=payload.get("takenAt"),
            uploadedBy=payload.get("uploadedBy"),
            representative=payload.get("representative", False),
            reportInclude=payload.get("reportInclude", True),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_photo(photo)
        return {"photo": asdict(stored), "warnings": []}

    def link_photo(self, finding_id: str, payload: dict) -> dict:
        self._require_finding(finding_id)
        photo = self._require_photo(payload["photoId"])
        photo.findingId = finding_id
        if payload.get("correctiveActionId"):
            photo.correctiveActionId = payload["correctiveActionId"]
        photo.updatedAt = self._now()
        stored = self.repository.save_photo(photo)
        return {"photo": asdict(stored), "warnings": []}

    def update_photo(self, photo_id: str, payload: dict) -> dict:
        photo = self._require_photo(photo_id)
        for key, value in payload.items():
            if key == "photoType" and value is not None:
                value = self._normalize_photo_type(value)
            if hasattr(photo, key):
                setattr(photo, key, value)
        photo.updatedAt = self._now()
        stored = self.repository.save_photo(photo)
        return {"photo": asdict(stored), "warnings": []}

    def delete_photo(self, photo_id: str) -> dict:
        self._require_photo(photo_id)
        self.repository.delete_photo(photo_id)
        return {"deleted": True}

    def markup_photo(self, photo_id: str, payload: dict) -> dict:
        photo = self._require_photo(photo_id)
        markup = PhotoMarkupInfo(
            id=photo.markupInfo.id if photo.markupInfo else f"photo-markup-{uuid4().hex[:8]}",
            photoId=photo.id,
            shapes=[
                PhotoMarkupShape(
                    id=item.get("id") or f"photo-markup-shape-{uuid4().hex[:8]}",
                    shapeType=item["shapeType"],
                    x=item["x"],
                    y=item["y"],
                    width=item.get("width"),
                    height=item.get("height"),
                    color=item.get("color", "#FFD84D"),
                    strokeStyle=item.get("strokeStyle", "dashed"),
                    text=item.get("text"),
                )
                for item in payload.get("shapes", [])
            ],
            createdAt=photo.markupInfo.createdAt if photo.markupInfo else self._now(),
            updatedAt=self._now(),
        )
        photo.markupInfo = markup
        photo.updatedAt = self._now()
        stored = self.repository.save_photo(photo)
        return {"photo": asdict(stored), "warnings": []}

    def set_photo_caption(self, photo_id: str, caption: str | None) -> dict:
        photo = self._require_photo(photo_id)
        photo.caption = caption
        photo.updatedAt = self._now()
        stored = self.repository.save_photo(photo)
        return {"photo": asdict(stored), "warnings": []}

    def set_photo_representative(self, photo_id: str) -> dict:
        photo = self._require_photo(photo_id)
        if photo.findingId:
            for sibling in self.repository.list_finding_photos(photo.findingId):
                if sibling.id == photo.id:
                    continue
                sibling.representative = False
                sibling.updatedAt = self._now()
                self.repository.save_photo(sibling)
        photo.representative = True
        photo.updatedAt = self._now()
        stored = self.repository.save_photo(photo)
        return {"photo": asdict(stored), "warnings": []}

    def list_photo_ledgers(self, inspection_round_id: str) -> list[dict]:
        self._require_round(inspection_round_id)
        return [asdict(item) for item in self.repository.list_photo_ledgers(inspection_round_id)]

    def create_photo_ledger(self, inspection_round_id: str, payload: dict) -> dict:
        round_item = self._require_round(inspection_round_id)
        if payload.get("ownerPartyId"):
            self._validate_owner_party(round_item.projectId, payload["ownerPartyId"])
        photo_ledger = PhotoLedger(
            id=f"photo-ledger-{uuid4().hex[:8]}",
            projectId=round_item.projectId,
            inspectionRoundId=inspection_round_id,
            ownerPartyId=payload.get("ownerPartyId"),
            documentId=payload.get("documentId"),
            title=payload.get("title", f"{round_item.name} 사진대지"),
            status=payload.get("status", "draft"),
            layoutMode=payload.get("layoutMode", "one_entry_per_page"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_photo_ledger(photo_ledger)
        return {"photoLedger": asdict(stored), "warnings": []}

    def get_photo_ledger(self, photo_ledger_id: str) -> dict:
        photo_ledger = self._require_photo_ledger(photo_ledger_id)
        return self._serialize_photo_ledger_detail(photo_ledger)

    def update_photo_ledger(self, photo_ledger_id: str, payload: dict) -> dict:
        photo_ledger = self._require_photo_ledger(photo_ledger_id)
        if payload.get("ownerPartyId"):
            self._validate_owner_party(photo_ledger.projectId, payload["ownerPartyId"])
        for key, value in payload.items():
            if hasattr(photo_ledger, key):
                setattr(photo_ledger, key, value)
        photo_ledger.updatedAt = self._now()
        stored = self.repository.save_photo_ledger(photo_ledger)
        return {"photoLedger": asdict(stored), "warnings": []}

    def delete_photo_ledger(self, photo_ledger_id: str) -> dict:
        self._require_photo_ledger(photo_ledger_id)
        self.repository.delete_photo_ledger(photo_ledger_id)
        return {"deleted": True}

    def generate_photo_ledger_entries(self, photo_ledger_id: str) -> dict:
        photo_ledger = self._require_photo_ledger(photo_ledger_id)
        findings = [
            item
            for item in self.repository.list_round_findings(photo_ledger.inspectionRoundId)
            if item.reportInclude and (not photo_ledger.ownerPartyId or item.ownerPartyId == photo_ledger.ownerPartyId)
        ]
        created_entries = []
        for index, finding in enumerate(findings, start=1):
            existing = next(
                (item for item in self.repository.list_photo_ledger_entries(photo_ledger.id) if item.findingId == finding.id),
                None,
            )
            if existing:
                created_entries.append(asdict(existing))
                continue
            actions = self.repository.list_corrective_actions(finding.id)
            photos = self.repository.list_finding_photos(finding.id)
            finding_photo = next((item for item in photos if item.photoType == "finding_photo"), None)
            action_photo = next((item for item in photos if item.photoType == "action_photo"), None)
            entry = PhotoLedgerEntry(
                id=f"photo-ledger-entry-{uuid4().hex[:8]}",
                photoLedgerId=photo_ledger.id,
                projectId=finding.projectId,
                inspectionRoundId=finding.inspectionRoundId,
                ownerPartyId=finding.ownerPartyId,
                findingId=finding.id,
                correctiveActionId=actions[0].id if actions else None,
                findingPhotoId=finding_photo.id if finding_photo else None,
                actionPhotoId=action_photo.id if action_photo else None,
                findingCaption=finding_photo.caption if finding_photo else finding.title,
                actionCaption=action_photo.caption if action_photo else finding.requiredAction,
                displayOrder=index,
                confirmed=False,
                createdAt=self._now(),
                updatedAt=self._now(),
            )
            created_entries.append(asdict(self.repository.save_photo_ledger_entry(entry)))
        return {"photoLedger": asdict(photo_ledger), "entries": created_entries, "warnings": []}

    def list_photo_ledger_entries(self, photo_ledger_id: str) -> list[dict]:
        self._require_photo_ledger(photo_ledger_id)
        return [asdict(item) for item in self.repository.list_photo_ledger_entries(photo_ledger_id)]

    def create_photo_ledger_entry(self, photo_ledger_id: str, payload: dict) -> dict:
        photo_ledger = self._require_photo_ledger(photo_ledger_id)
        finding = self._require_finding(payload["findingId"])
        entry = PhotoLedgerEntry(
            id=f"photo-ledger-entry-{uuid4().hex[:8]}",
            photoLedgerId=photo_ledger_id,
            projectId=finding.projectId,
            inspectionRoundId=finding.inspectionRoundId,
            ownerPartyId=finding.ownerPartyId,
            findingId=finding.id,
            correctiveActionId=payload.get("correctiveActionId"),
            findingPhotoId=payload.get("findingPhotoId"),
            actionPhotoId=payload.get("actionPhotoId"),
            findingCaption=payload.get("findingCaption"),
            actionCaption=payload.get("actionCaption"),
            displayOrder=payload.get("displayOrder", len(self.repository.list_photo_ledger_entries(photo_ledger_id)) + 1),
            confirmed=payload.get("confirmed", False),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_photo_ledger_entry(entry)
        return {"entry": asdict(stored), "warnings": []}

    def update_photo_ledger_entry(self, entry_id: str, payload: dict) -> dict:
        entry = self._require_entry(entry_id)
        for key, value in payload.items():
            if hasattr(entry, key):
                setattr(entry, key, value)
        entry.updatedAt = self._now()
        stored = self.repository.save_photo_ledger_entry(entry)
        return {"entry": asdict(stored), "warnings": []}

    def delete_photo_ledger_entry(self, entry_id: str) -> dict:
        self._require_entry(entry_id)
        self.repository.delete_photo_ledger_entry(entry_id)
        return {"deleted": True}

    def reorder_photo_ledger_entries(self, photo_ledger_id: str, entry_ids: list[str]) -> list[dict]:
        self._require_photo_ledger(photo_ledger_id)
        updated = []
        for index, entry_id in enumerate(entry_ids, start=1):
            entry = self._require_entry(entry_id)
            entry.displayOrder = index
            entry.updatedAt = self._now()
            updated.append(asdict(self.repository.save_photo_ledger_entry(entry)))
        return updated

    def validate_photo_ledger(self, photo_ledger_id: str) -> dict:
        photo_ledger = self._require_photo_ledger(photo_ledger_id)
        warnings: list[PhotoLedgerWarning] = []
        for entry in self.repository.list_photo_ledger_entries(photo_ledger_id):
            finding = self._require_finding(entry.findingId)
            finding_photo = self.repository.get_photo(entry.findingPhotoId) if entry.findingPhotoId else None
            action_photo = self.repository.get_photo(entry.actionPhotoId) if entry.actionPhotoId else None
            action = self.repository.get_corrective_action(entry.correctiveActionId) if entry.correctiveActionId else None
            if not finding_photo:
                warnings.append(self._build_ledger_warning(photo_ledger_id, entry.id, "missing_finding_photo", "danger", "지적사진이 누락되었습니다."))
            if action and not action_photo:
                warnings.append(self._build_ledger_warning(photo_ledger_id, entry.id, "missing_action_photo", "danger", "조치사진이 누락되었습니다."))
            if not action:
                warnings.append(self._build_ledger_warning(photo_ledger_id, entry.id, "missing_action", "warning", "조치현황이 연결되지 않았습니다."))
            elif action.status != "verified":
                warnings.append(self._build_ledger_warning(photo_ledger_id, entry.id, "unverified_action", "danger", "조치확인이 완료되지 않았습니다."))
            if photo_ledger.ownerPartyId and finding.ownerPartyId != photo_ledger.ownerPartyId:
                warnings.append(self._build_ledger_warning(photo_ledger_id, entry.id, "owner_mismatch", "danger", "발주처 필터와 지적사항 발주처가 다릅니다."))
            for photo in [finding_photo, action_photo]:
                if photo and not photo.fileId:
                    warnings.append(self._build_ledger_warning(photo_ledger_id, entry.id, "file_missing", "warning", "증빙 파일 연결이 누락되었습니다."))
                if photo and photo.markupInfo:
                    for shape in photo.markupInfo.shapes:
                        if shape.x < 0 or shape.x > 1 or shape.y < 0 or shape.y > 1:
                            warnings.append(self._build_ledger_warning(photo_ledger_id, entry.id, "invalid_markup", "warning", "사진 마크업 좌표가 올바르지 않습니다."))
            if entry.confirmed and any(item.severity == "danger" for item in warnings if item.entryId == entry.id):
                warnings.append(self._build_ledger_warning(photo_ledger_id, entry.id, "confirmed_with_danger", "danger", "확정 항목에 위험 경고가 남아 있습니다."))
        stored = self.repository.replace_photo_ledger_warnings(photo_ledger_id, warnings)
        return {
            "photoLedgerId": photo_ledger.id,
            "warnings": [asdict(item) for item in stored],
            "hasDanger": any(item.severity == "danger" for item in stored),
        }

    def export_photo_ledger(self, photo_ledger_id: str) -> dict:
        self._require_photo_ledger(photo_ledger_id)
        entries = self.repository.list_photo_ledger_entries(photo_ledger_id)
        if not entries:
            raise FindingValidationError("PhotoLedger export requires at least one entry")
        validation = self.validate_photo_ledger(photo_ledger_id)
        confirmed_ids = {item.id for item in entries if item.confirmed}
        confirmed_danger = [
            item
            for item in validation["warnings"]
            if item["severity"] == "danger" and item.get("entryId") in confirmed_ids
        ]
        if confirmed_danger:
            raise FindingValidationError("PhotoLedger confirmed status cannot have danger warnings")
        photo_ledger = self._require_photo_ledger(photo_ledger_id)
        photo_ledger.status = "exported"
        photo_ledger.updatedAt = self._now()
        self.repository.save_photo_ledger(photo_ledger)
        return {
            "photoLedgerId": photo_ledger_id,
            "exportedFileId": f"file-asset-export-{photo_ledger_id}",
            "usedConfirmedEntries": any(item.confirmed for item in entries),
            "warningCount": len(validation["warnings"]),
        }

    def sync_photo_ledger_to_report(self, photo_ledger_id: str, payload: dict) -> dict:
        photo_ledger = self._require_photo_ledger(photo_ledger_id)
        document_id = payload.get("documentId") or photo_ledger.documentId
        if not document_id:
            raise FindingValidationError("sync-to-report requires documentId")
        validation = self.validate_photo_ledger(photo_ledger_id)
        version_id = f"document-version-{uuid4().hex[:8]}"
        document_version = DocumentVersion(
            id=version_id,
            documentId=document_id,
            projectId=photo_ledger.projectId,
            inspectionRoundId=photo_ledger.inspectionRoundId,
            ownerPartyId=photo_ledger.ownerPartyId,
            sourcePhotoLedgerId=photo_ledger.id,
            sectionKey="photo_ledger",
            createdAt=self._now(),
        )
        self.repository.save_document_version(document_version)
        section_state = self.repository.save_document_section(
            document_id,
            {
                "documentId": document_id,
                "documentVersionId": version_id,
                "sectionKey": "photo_ledger",
                "photoLedgerId": photo_ledger_id,
                "entryIds": [item.id for item in self.repository.list_photo_ledger_entries(photo_ledger_id)],
                "updatedAt": self._now(),
            },
        )
        photo_ledger.documentId = document_id
        photo_ledger.status = "synced"
        photo_ledger.syncedAt = self._now()
        photo_ledger.updatedAt = self._now()
        self.repository.save_photo_ledger(photo_ledger)
        return {
            "photoLedgerId": photo_ledger_id,
            "documentId": document_id,
            "documentVersionId": section_state["documentVersionId"],
            "sectionKey": "photo_ledger",
            "warnings": [item["code"] for item in validation["warnings"]],
            "documentVersion": asdict(document_version),
        }

    def get_document_photo_ledger_section(self, document_id: str) -> dict:
        section = self.repository.get_document_section(document_id)
        if not section:
            raise FindingNotFoundError("document photo ledger section not found")
        ledger = self._require_photo_ledger(section["photoLedgerId"])
        detail = self._serialize_photo_ledger_detail(ledger)
        document_version = self.repository.get_document_version(section["documentVersionId"])
        return {
            "documentId": document_id,
            "section": section,
            "documentVersion": asdict(document_version) if document_version else None,
            **detail,
        }

    def draft_action_request_mail(self, payload: dict) -> dict:
        finding_ids = payload.get("findingIds", [])
        findings = [self._require_finding(item) for item in finding_ids]
        if not findings:
            raise FindingValidationError("at least one findingId is required")
        first = findings[0]
        subject = payload.get("subject") or f"[A&C ERP] 조치 요청 - {first.inspectionRoundId}"
        body_lines = [
            "아래 지적사항에 대한 조치 결과를 회신해 주시기 바랍니다.",
            "",
        ]
        attachment_file_ids: list[str] = []
        for finding in findings:
            photos = self.repository.list_finding_photos(finding.id)
            attachment_file_ids.extend([photo.fileId for photo in photos if photo.fileId])
            body_lines.append(f"- {finding.title}")
            body_lines.append(f"  조치요청: {finding.requiredAction or '현장 보완 필요'}")
            if finding.dueDate:
                body_lines.append(f"  기한: {finding.dueDate}")
        draft = ActionRequestMailDraft(
            id=f"action-request-mail-{uuid4().hex[:8]}",
            projectId=first.projectId,
            inspectionRoundId=first.inspectionRoundId,
            findingIds=finding_ids,
            ownerPartyId=payload.get("ownerPartyId"),
            contractorContactId=payload.get("contractorContactId"),
            subject=subject,
            body=payload.get("body") or "\n".join(body_lines),
            attachmentFileIds=attachment_file_ids,
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_mail_draft(draft)
        return {"mailDraft": asdict(stored), "warnings": []}

    def send_action_request_mail(self, payload: dict) -> dict:
        draft = self.repository.get_mail_draft(payload["mailDraftId"])
        if not draft:
            raise FindingNotFoundError("action request mail draft not found")
        mail_thread_id = payload.get("mailThreadId") or f"mail-thread-{uuid4().hex[:8]}"
        mail_thread = MailThread(
            id=mail_thread_id,
            projectId=draft.projectId,
            inspectionRoundId=draft.inspectionRoundId,
            ownerPartyId=draft.ownerPartyId,
            subject=draft.subject,
            participantContactIds=[draft.contractorContactId] if draft.contractorContactId else [],
            linkedFindingIds=draft.findingIds,
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        self.repository.save_mail_thread(mail_thread)
        draft.mailThreadId = mail_thread_id
        draft.sentAt = payload.get("sentAt") or self._now()
        draft.updatedAt = self._now()
        stored = self.repository.save_mail_draft(draft)
        return {"mailDraft": asdict(stored), "mailThread": asdict(mail_thread), "warnings": []}

    def _create_finding(self, project_id: str, inspection_round_id: str, payload: dict) -> dict:
        source_type = payload.get("sourceType")
        source_id = payload.get("sourceId")
        if self.repository.find_duplicate_source(project_id, inspection_round_id, source_type, source_id):
            raise FindingValidationError("sourceType + sourceId duplicate finding exists")
        title = payload.get("title")
        detail = payload.get("detail")
        required_action = payload.get("requiredAction", "")
        owner_party_id = payload.get("ownerPartyId")
        if source_type == "checklist_candidate" and source_id:
            candidate = self.checklist_repository.get_candidate(source_id)
            if not candidate:
                raise FindingValidationError("finding candidate not found")
            title = title or candidate.title
            detail = detail or candidate.detail
            required_action = required_action or candidate.requiredAction
        if not title:
            raise FindingValidationError("title is required")
        finding = Finding(
            id=f"finding-{uuid4().hex[:8]}",
            projectId=project_id,
            inspectionRoundId=inspection_round_id,
            ownerPartyId=owner_party_id,
            title=title,
            detail=detail or title,
            riskType=payload.get("riskType"),
            requiredAction=required_action,
            responsiblePartyId=payload.get("responsiblePartyId"),
            dueDate=payload.get("dueDate"),
            status=payload.get("status", "open"),
            sourceType=source_type,
            sourceId=source_id,
            checklistResultId=payload.get("checklistResultId"),
            additionalHazardItemId=payload.get("additionalHazardItemId"),
            riskReductionItemId=payload.get("riskReductionItemId"),
            reportInclude=payload.get("reportInclude", True),
            reportOrder=payload.get("reportOrder"),
            createdBy=payload.get("createdBy"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        self._validate_finding(finding)
        stored = self.repository.save_finding(finding)
        self._link_source_objects(stored)
        self._add_timeline_event(stored.id, "finding.created", "지적사항이 등록되었습니다.")
        audit_log = self._add_audit_log(
            entity_type="finding",
            entity_id=stored.id,
            action="finding.created",
            summary="지적사항이 생성되었습니다.",
            field_names=["projectId", "inspectionRoundId", "ownerPartyId"],
        )
        return {"finding": asdict(stored), "warnings": self._finding_warnings(stored), "auditLog": asdict(audit_log)}

    def _link_source_objects(self, finding: Finding) -> None:
        if finding.sourceType == "checklist_candidate" and finding.sourceId:
            candidate = self.checklist_repository.get_candidate(finding.sourceId)
            if candidate:
                candidate.status = "converted"
                candidate.convertedFindingId = finding.id
                candidate.updatedAt = self._now()
                self.checklist_repository.save_candidate(candidate)
                result = self.checklist_repository.get_result(candidate.checklistResultId)
                if result:
                    result.findingId = finding.id
                    result.findingCandidateId = candidate.id
                    result.reportMappingStatus = "mapped"
                    self.checklist_repository.save_result(result)
                finding.checklistResultId = candidate.checklistResultId
                self.repository.save_finding(finding)
        elif finding.sourceType == "checklist_result" and finding.sourceId:
            result = self.checklist_repository.get_result(finding.sourceId)
            if result:
                result.findingId = finding.id
                result.reportMappingStatus = "mapped"
                self.checklist_repository.save_result(result)
        elif finding.additionalHazardItemId:
            hazard = self.checklist_repository.get_additional_hazard(finding.additionalHazardItemId)
            if hazard:
                hazard.findingId = finding.id
                self.checklist_repository.save_additional_hazard(hazard)

    def _validate_finding(self, finding: Finding) -> None:
        self._require_project(finding.projectId)
        round_item = self._require_round(finding.inspectionRoundId)
        if round_item.projectId != finding.projectId:
            raise FindingValidationError("projectId and inspectionRoundId must match")
        if finding.ownerPartyId:
            self._validate_owner_party(finding.projectId, finding.ownerPartyId)
        if not finding.title:
            raise FindingValidationError("title is required")
        if finding.status == "action_requested" and not finding.requiredAction:
            raise FindingValidationError("requiredAction is required before action_requested status")

    def _normalize_photo_type(self, photo_type: str | None) -> str:
        normalized = (photo_type or "finding_photo").strip().lower()
        alias_map = {
            "finding": "finding_photo",
            "finding_photo": "finding_photo",
            "action": "action_photo",
            "action_photo": "action_photo",
            "other": "other",
        }
        if normalized not in alias_map:
            raise FindingValidationError("photoType must be finding_photo, action_photo, or other")
        return alias_map[normalized]

    def _finding_warnings(self, finding: Finding) -> list[str]:
        warnings: list[str] = []
        finding_photos = [
            photo for photo in self.repository.list_finding_photos(finding.id) if photo.photoType == "finding_photo"
        ]
        action_photos = [
            photo for photo in self.repository.list_finding_photos(finding.id) if photo.photoType == "action_photo"
        ]
        actions = self.repository.list_corrective_actions(finding.id)
        if not finding_photos:
            warnings.append("findingPhotoMissing")
        if actions and not action_photos:
            warnings.append("actionPhotoMissing")
        if actions and not any(action.status == "verified" for action in actions):
            warnings.append("correctiveActionUnverified")
        return warnings

    def _serialize_finding_list_item(self, finding: Finding) -> dict:
        owner_display_name = None
        responsible_org_name = None
        for party in self.project_repository.list_project_parties(finding.projectId):
            if party.ownerPartyId and party.ownerPartyId == finding.ownerPartyId:
                organization = self.project_repository.get_organization(party.organizationId)
                owner_display_name = organization.name if organization else party.organizationId
            if finding.responsiblePartyId and party.id == finding.responsiblePartyId:
                organization = self.project_repository.get_organization(party.organizationId)
                responsible_org_name = organization.name if organization else party.organizationId
        photos = self.repository.list_finding_photos(finding.id)
        actions = self.repository.list_corrective_actions(finding.id)
        return {
            "finding": asdict(finding),
            "ownerDisplayName": owner_display_name,
            "responsibleOrganizationName": responsible_org_name,
            "findingPhotoCount": len([item for item in photos if item.photoType == "finding_photo"]),
            "actionPhotoCount": len([item for item in photos if item.photoType == "action_photo"]),
            "correctiveActionStatus": actions[-1].status if actions else None,
            "warnings": self._finding_warnings(finding),
        }

    def _serialize_finding_detail(self, finding: Finding) -> dict:
        return {
            "finding": asdict(finding),
            "correctiveActions": [asdict(item) for item in self.repository.list_corrective_actions(finding.id)],
            "photos": [asdict(item) for item in self.repository.list_finding_photos(finding.id)],
            "timeline": [asdict(item) for item in self.repository.list_timeline_events(finding.id)],
            "warnings": self._finding_warnings(finding),
        }

    def _serialize_photo_ledger_detail(self, photo_ledger: PhotoLedger) -> dict:
        entries = self.repository.list_photo_ledger_entries(photo_ledger.id)
        finding_ids = [item.findingId for item in entries]
        action_ids = [item.correctiveActionId for item in entries if item.correctiveActionId]
        photo_ids = [item.findingPhotoId for item in entries if item.findingPhotoId] + [
            item.actionPhotoId for item in entries if item.actionPhotoId
        ]
        findings = [self._require_finding(item) for item in finding_ids]
        actions = [self._require_action(item) for item in action_ids]
        photos = [self._require_photo(item) for item in photo_ids]
        warnings = self.repository.list_photo_ledger_warnings(photo_ledger.id)
        return {
            "photoLedger": asdict(photo_ledger),
            "entries": [asdict(item) for item in entries],
            "findings": [asdict(item) for item in findings],
            "correctiveActions": [asdict(item) for item in actions],
            "photos": [asdict(item) for item in photos],
            "warnings": [asdict(item) for item in warnings],
        }

    def _build_ledger_warning(
        self,
        photo_ledger_id: str,
        entry_id: str | None,
        code: str,
        severity: str,
        message: str,
    ) -> PhotoLedgerWarning:
        return PhotoLedgerWarning(
            id=f"photo-ledger-warning-{uuid4().hex[:8]}",
            photoLedgerId=photo_ledger_id,
            entryId=entry_id,
            code=code,
            severity=severity,
            message=message,
            createdAt=self._now(),
        )

    def _validate_owner_party(self, project_id: str, owner_party_id: str) -> None:
        for party in self.project_repository.list_project_parties(project_id):
            if party.role == "owner" and party.ownerPartyId == owner_party_id:
                return
        raise FindingValidationError("ownerPartyId must be an owner ProjectParty")

    def _has_verified_action(self, finding_id: str) -> bool:
        return any(item.status == "verified" for item in self.repository.list_corrective_actions(finding_id))

    def _require_project(self, project_id: str):
        project = self.project_repository.get_project(project_id)
        if not project:
            raise FindingNotFoundError("project not found")
        return project

    def _require_round(self, inspection_round_id: str):
        round_item = self.inspection_repository.get_round(inspection_round_id)
        if not round_item:
            raise FindingNotFoundError("inspection round not found")
        return round_item

    def _require_finding(self, finding_id: str) -> Finding:
        finding = self.repository.get_finding(finding_id)
        if not finding:
            raise FindingNotFoundError("finding not found")
        return finding

    def _require_action(self, action_id: str) -> CorrectiveAction:
        action = self.repository.get_corrective_action(action_id)
        if not action:
            raise FindingNotFoundError("corrective action not found")
        return action

    def _require_photo(self, photo_id: str) -> EvidencePhoto:
        photo = self.repository.get_photo(photo_id)
        if not photo:
            raise FindingNotFoundError("evidence photo not found")
        return photo

    def _require_photo_ledger(self, photo_ledger_id: str) -> PhotoLedger:
        photo_ledger = self.repository.get_photo_ledger(photo_ledger_id)
        if not photo_ledger:
            raise FindingNotFoundError("photo ledger not found")
        return photo_ledger

    def _require_entry(self, entry_id: str) -> PhotoLedgerEntry:
        entry = self.repository.get_photo_ledger_entry(entry_id)
        if not entry:
            raise FindingNotFoundError("photo ledger entry not found")
        return entry

    def _add_timeline_event(self, finding_id: str, event_type: str, summary: str) -> FindingTimelineEvent:
        return self.repository.add_timeline_event(
            FindingTimelineEvent(
                id=f"finding-timeline-{uuid4().hex[:8]}",
                findingId=finding_id,
                eventType=event_type,
                summary=summary,
                createdAt=self._now(),
            )
        )

    def _add_audit_log(self, entity_type: str, entity_id: str, action: str, summary: str, field_names: list[str]) -> AuditLog:
        return self.repository.add_audit_log(
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

    def _now(self) -> str:
        return "2026-05-10T09:00:00+09:00"
