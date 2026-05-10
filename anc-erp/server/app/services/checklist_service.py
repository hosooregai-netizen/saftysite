from dataclasses import asdict
from uuid import uuid4

from server.app.domain.models import (
    AdditionalHazardItem,
    AuditLog,
    ChecklistItem,
    ChecklistMobileDraft,
    ChecklistPhoto,
    ChecklistReportMapping,
    ChecklistResult,
    ChecklistSession,
    ChecklistTemplate,
    Finding,
    FindingCandidate,
    RiskReductionChecklistItem,
)
from server.app.repositories.checklist_repository import ChecklistRepository
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.project_repository import ProjectRepository


class ChecklistNotFoundError(Exception):
    pass


class ChecklistValidationError(Exception):
    pass


class ChecklistService:
    VALID_RESULTS = {"not_checked", "good", "caution", "bad", "not_applicable"}
    VALID_SESSION_STATUSES = {"not_started", "in_progress", "paused", "completed", "reviewed", "locked"}

    def __init__(
        self,
        repository: ChecklistRepository,
        project_repository: ProjectRepository,
        inspection_repository: InspectionRepository,
    ) -> None:
        self.repository = repository
        self.project_repository = project_repository
        self.inspection_repository = inspection_repository

    def list_templates(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_templates()]

    def create_template(self, payload: dict) -> dict:
        template = ChecklistTemplate(
            id=f"checklist-template-{uuid4().hex[:8]}",
            name=payload["name"],
            description=payload.get("description"),
            projectType=payload.get("projectType"),
            documentType=payload.get("documentType", "safety_health_ledger_inspection_report"),
            version=payload.get("version", "1.0.0"),
            status=payload.get("status", "draft"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        created = self.repository.save_template(template)
        return {"template": asdict(created), "warnings": []}

    def get_template(self, template_id: str) -> dict:
        template = self._require_template(template_id)
        return {
            "template": asdict(template),
            "categories": [asdict(item) for item in self.repository.list_categories(template_id)],
            "items": [asdict(item) for item in self.repository.list_template_items(template_id)],
        }

    def update_template(self, template_id: str, payload: dict) -> dict:
        template = self._require_template(template_id)
        for key, value in payload.items():
            if hasattr(template, key):
                setattr(template, key, value)
        template.updatedAt = self._now()
        updated = self.repository.save_template(template)
        return {"template": asdict(updated), "warnings": []}

    def delete_template(self, template_id: str) -> dict:
        self._require_template(template_id)
        self.repository.delete_template(template_id)
        return {"deleted": True}

    def publish_template(self, template_id: str) -> dict:
        template = self._require_template(template_id)
        template.status = "published"
        template.publishedAt = self._now()
        template.updatedAt = self._now()
        updated = self.repository.save_template(template)
        return {"template": asdict(updated), "warnings": []}

    def clone_template(self, template_id: str) -> dict:
        template = self._require_template(template_id)
        clone = ChecklistTemplate(
            id=f"checklist-template-{uuid4().hex[:8]}",
            name=f"{template.name} 사본",
            description=template.description,
            projectType=template.projectType,
            documentType=template.documentType,
            version=template.version,
            status="draft",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        self.repository.save_template(clone)
        for item in self.repository.list_template_items(template_id):
            self.repository.save_item(
                ChecklistItem(
                    id=f"checklist-item-{uuid4().hex[:8]}",
                    templateId=clone.id,
                    categoryId=item.categoryId,
                    categoryKey=item.categoryKey,
                    discipline=item.discipline,
                    title=item.title,
                    detail=item.detail,
                    reportLabel=item.reportLabel,
                    defaultApplicability=item.defaultApplicability,
                    isRequired=item.isRequired,
                    findingRequiredWhen=item.findingRequiredWhen,
                    sourceSectionKey=item.sourceSectionKey,
                    displayOrder=item.displayOrder,
                )
            )
        return {"template": asdict(clone), "warnings": []}

    def list_template_items(self, template_id: str) -> list[dict]:
        self._require_template(template_id)
        return [
            {
                **asdict(item),
                "category": next(
                    (
                        asdict(category)
                        for category in self.repository.list_categories(template_id)
                        if category.id == item.categoryId
                    ),
                    None,
                ),
            }
            for item in self.repository.list_template_items(template_id)
        ]

    def create_template_item(self, template_id: str, payload: dict) -> dict:
        self._require_template(template_id)
        item = ChecklistItem(
            id=f"checklist-item-{uuid4().hex[:8]}",
            templateId=template_id,
            categoryId=payload["categoryId"],
            categoryKey=payload["categoryKey"],
            discipline=payload.get("discipline"),
            title=payload["title"],
            detail=payload.get("detail"),
            reportLabel=payload.get("reportLabel"),
            defaultApplicability=payload.get("defaultApplicability", True),
            isRequired=payload.get("isRequired", True),
            findingRequiredWhen=payload.get("findingRequiredWhen", "caution_or_bad"),
            sourceSectionKey=payload.get("sourceSectionKey"),
            displayOrder=payload.get("displayOrder", len(self.repository.list_template_items(template_id)) + 1),
        )
        created = self.repository.save_item(item)
        return {"item": asdict(created), "warnings": []}

    def update_template_item(self, item_id: str, payload: dict) -> dict:
        item = self._require_item(item_id)
        for key, value in payload.items():
            if hasattr(item, key):
                setattr(item, key, value)
        updated = self.repository.save_item(item)
        return {"item": asdict(updated), "warnings": []}

    def delete_template_item(self, item_id: str) -> dict:
        self._require_item(item_id)
        self.repository.delete_item(item_id)
        return {"deleted": True}

    def reorder_template_items(self, template_id: str, item_ids: list[str]) -> list[dict]:
        self._require_template(template_id)
        updated: list[dict] = []
        for index, item_id in enumerate(item_ids, start=1):
            item = self._require_item(item_id)
            item.displayOrder = index
            updated.append(asdict(self.repository.save_item(item)))
        return updated

    def list_sessions(self, inspection_round_id: str) -> list[dict]:
        self._require_round(inspection_round_id)
        return [self._serialize_session(item) for item in self.repository.list_sessions_by_round(inspection_round_id)]

    def create_session(self, inspection_round_id: str, payload: dict) -> dict:
        round_item = self._require_round(inspection_round_id)
        template = self._require_template(payload["templateId"])
        if template.status != "published":
            raise ChecklistValidationError("published checklist template required")
        session = ChecklistSession(
            id=f"checklist-session-{uuid4().hex[:8]}",
            projectId=round_item.projectId,
            inspectionRoundId=inspection_round_id,
            ownerPartyId=payload.get("ownerPartyId"),
            templateId=template.id,
            templateVersion=template.version,
            inspectorUserId=payload.get("inspectorUserId") or round_item.inspectorUserId,
            inspectionDate=payload.get("inspectionDate") or round_item.actualInspectionDate,
            status="not_started",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        created = self.repository.save_session(session)
        created_results = []
        for item in self.repository.list_template_items(template.id):
            result = ChecklistResult(
                id=f"checklist-result-{uuid4().hex[:8]}",
                sessionId=created.id,
                projectId=created.projectId,
                inspectionRoundId=created.inspectionRoundId,
                checklistItemId=item.id,
                result="not_checked",
                reportMappingStatus="not_mapped",
                createdAt=self._now(),
                updatedAt=self._now(),
            )
            created_results.append(asdict(self.repository.save_result(result)))
        risk_items = []
        if template.projectType == "elevator_replacement":
            for seed_item in self.repository._build_default_risk_reduction_items(created.id, self._now()):  # type: ignore[attr-defined]
                risk_items.append(asdict(self.repository.save_risk_reduction_item(seed_item)))
        audit_log = self.repository.add_audit_log(
            AuditLog(
                id=f"checklist-audit-{uuid4().hex[:8]}",
                entityType="checklist_session",
                entityId=created.id,
                action="checklist-session.created",
                summary="체크리스트 세션이 생성되었습니다.",
                fieldNames=["projectId", "inspectionRoundId", "templateId"],
                createdAt=self._now(),
            )
        )
        return {
            "session": self._serialize_session(created),
            "results": created_results,
            "riskReductionItems": risk_items,
            "auditLog": asdict(audit_log),
            "warnings": [],
        }

    def get_session(self, session_id: str) -> dict:
        session = self._require_session(session_id)
        template = self._require_template(session.templateId)
        return {
            "session": self._serialize_session(session),
            "template": asdict(template),
            "categories": [asdict(item) for item in self.repository.list_categories(template.id)],
            "results": [self._serialize_result(item) for item in self.repository.list_results(session_id)],
            "findingCandidates": [asdict(item) for item in self.repository.list_candidates(session_id)],
            "riskReductionItems": [asdict(item) for item in self.repository.list_risk_reduction_items(session_id)],
            "additionalHazards": [asdict(item) for item in self.repository.list_additional_hazards(session_id)],
            "photos": [
                asdict(item)
                for result in self.repository.list_results(session_id)
                for item in self.repository.list_photos_for_result(result.id)
            ],
            "reportMappings": [asdict(item) for item in self.repository.list_report_mappings(session_id)],
            "mobileDrafts": [asdict(item) for item in self.repository.list_mobile_drafts(session_id)],
            "auditLogs": [asdict(item) for item in self.repository.list_audit_logs(session_id)],
            "warnings": self._validation_warnings(session),
        }

    def update_session(self, session_id: str, payload: dict) -> dict:
        session = self._require_session(session_id)
        for key, value in payload.items():
            if hasattr(session, key):
                setattr(session, key, value)
        if payload.get("status") and payload["status"] not in self.VALID_SESSION_STATUSES:
            raise ChecklistValidationError("invalid checklist session status")
        session.updatedAt = self._now()
        updated = self.repository.save_session(session)
        return {"session": self._serialize_session(updated), "warnings": self._validation_warnings(updated)}

    def start_session(self, session_id: str) -> dict:
        return self._transition_session(session_id, "in_progress", started_at=True)

    def pause_session(self, session_id: str) -> dict:
        return self._transition_session(session_id, "paused")

    def complete_session(self, session_id: str) -> dict:
        session = self._require_session(session_id)
        validation = self.validate_results(session_id)
        if validation["missingRequiredItems"]:
            raise ChecklistValidationError("required checklist items must be completed")
        session.status = "completed"
        session.completedAt = self._now()
        session.updatedAt = self._now()
        updated = self.repository.save_session(session)
        return {"session": self._serialize_session(updated), "warnings": validation["warnings"]}

    def review_session(self, session_id: str) -> dict:
        session = self._require_session(session_id)
        session.status = "reviewed"
        session.reviewedAt = self._now()
        session.updatedAt = self._now()
        updated = self.repository.save_session(session)
        return {"session": self._serialize_session(updated), "warnings": self._validation_warnings(updated)}

    def lock_session(self, session_id: str) -> dict:
        session = self._require_session(session_id)
        session.status = "locked"
        session.lockedAt = self._now()
        session.updatedAt = self._now()
        updated = self.repository.save_session(session)
        return {"session": self._serialize_session(updated), "warnings": []}

    def list_results(self, session_id: str) -> list[dict]:
        self._require_session(session_id)
        return [self._serialize_result(item) for item in self.repository.list_results(session_id)]

    def create_result(self, session_id: str, payload: dict) -> dict:
        session = self._require_session(session_id)
        self._ensure_session_mutable(session)
        result = ChecklistResult(
            id=f"checklist-result-{uuid4().hex[:8]}",
            sessionId=session_id,
            projectId=session.projectId,
            inspectionRoundId=session.inspectionRoundId,
            checklistItemId=payload["checklistItemId"],
            result=payload.get("result", "not_checked"),
            comment=payload.get("comment"),
            reportComment=payload.get("reportComment"),
            actionRequired=payload.get("actionRequired", False),
            responsiblePartyId=payload.get("responsiblePartyId"),
            dueDate=payload.get("dueDate"),
            reportMappingStatus="not_mapped",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self._save_result_with_rules(result, session)
        return {"result": self._serialize_result(stored), "warnings": self._result_warnings(stored)}

    def update_result(self, result_id: str, payload: dict) -> dict:
        result = self._require_result(result_id)
        session = self._require_session(result.sessionId)
        self._ensure_session_mutable(session)
        for key, value in payload.items():
            if hasattr(result, key):
                setattr(result, key, value)
        result.updatedAt = self._now()
        stored = self._save_result_with_rules(result, session)
        return {"result": self._serialize_result(stored), "warnings": self._result_warnings(stored)}

    def bulk_save_results(self, session_id: str, rows: list[dict]) -> dict:
        self._require_session(session_id)
        updated = []
        warnings: list[str] = []
        for row in rows:
            mutation = self.update_result(row["resultId"], row)
            updated.append(mutation["result"])
            warnings.extend(mutation["warnings"])
        return {"results": updated, "warnings": warnings}

    def fill_not_applicable(self, session_id: str, reason: str | None) -> dict:
        self._require_session(session_id)
        updated = []
        warnings = []
        for result in self.repository.list_results(session_id):
            if result.result != "not_checked":
                continue
            mutation = self.update_result(
                result.id,
                {
                    "result": "not_applicable",
                    "comment": reason or "현장 조건상 제외",
                },
            )
            updated.append(mutation["result"])
            warnings.extend(mutation["warnings"])
        return {"results": updated, "warnings": warnings}

    def validate_results(self, session_id: str) -> dict:
        session = self._require_session(session_id)
        template_items = {item.id: item for item in self.repository.list_template_items(session.templateId)}
        missing_required_items: list[str] = []
        warnings: list[str] = []
        for result in self.repository.list_results(session_id):
            item = template_items.get(result.checklistItemId)
            if item and item.isRequired and result.result == "not_checked":
                missing_required_items.append(item.title)
            warnings.extend(self._result_warnings(result))
        return {
            "sessionId": session_id,
            "missingRequiredItems": missing_required_items,
            "warnings": warnings,
            "isValid": len(missing_required_items) == 0,
        }

    def list_finding_candidates(self, session_id: str) -> list[dict]:
        self._require_session(session_id)
        return [asdict(item) for item in self.repository.list_candidates(session_id)]

    def create_finding_candidate(self, result_id: str, payload: dict) -> dict:
        result = self._require_result(result_id)
        session = self._require_session(result.sessionId)
        candidate = self._build_candidate_for_result(result, session, payload_override=payload)
        stored = self.repository.save_candidate(candidate)
        result.findingCandidateId = stored.id
        self.repository.save_result(result)
        return {"findingCandidate": asdict(stored), "warnings": []}

    def accept_candidate(self, candidate_id: str) -> dict:
        candidate = self._require_candidate(candidate_id)
        candidate.status = "accepted"
        candidate.updatedAt = self._now()
        updated = self.repository.save_candidate(candidate)
        return {"findingCandidate": asdict(updated), "warnings": []}

    def dismiss_candidate(self, candidate_id: str, dismissed_reason: str | None) -> dict:
        candidate = self._require_candidate(candidate_id)
        candidate.status = "dismissed"
        candidate.dismissedReason = dismissed_reason
        candidate.updatedAt = self._now()
        updated = self.repository.save_candidate(candidate)
        return {"findingCandidate": asdict(updated), "warnings": []}

    def convert_candidate_to_finding(self, candidate_id: str) -> dict:
        candidate = self._require_candidate(candidate_id)
        finding = Finding(
            id=candidate.convertedFindingId or f"finding-{uuid4().hex[:8]}",
            projectId=candidate.projectId,
            inspectionRoundId=candidate.inspectionRoundId,
            sourceType="checklist_candidate",
            sourceId=candidate.id,
            title=candidate.title,
            detail=candidate.detail,
            status="draft",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored_finding = self.repository.save_finding(finding)
        candidate.status = "converted"
        candidate.convertedFindingId = stored_finding.id
        candidate.updatedAt = self._now()
        updated = self.repository.save_candidate(candidate)
        result = self._require_result(candidate.checklistResultId)
        result.findingId = updated.convertedFindingId
        result.reportMappingStatus = "mapped"
        self.repository.save_result(result)
        return {"findingCandidate": asdict(updated), "finding": asdict(stored_finding), "warnings": []}

    def create_additional_hazard(self, session_id: str, payload: dict) -> dict:
        session = self._require_session(session_id)
        next_no = max((item.no for item in self.repository.list_additional_hazards(session_id)), default=0) + 1
        item = AdditionalHazardItem(
            id=f"additional-hazard-{uuid4().hex[:8]}",
            sessionId=session_id,
            no=next_no,
            hazardDescription=payload["hazardDescription"],
            contractorPlan=payload.get("contractorPlan"),
            checkPoint=payload.get("checkPoint"),
            implementationStatus=payload.get("implementationStatus", "not_checked"),
            note=payload.get("note"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_additional_hazard(item)
        return {"additionalHazard": asdict(stored), "warnings": []}

    def update_additional_hazard(self, hazard_id: str, payload: dict) -> dict:
        item = self._require_additional_hazard(hazard_id)
        for key, value in payload.items():
            if hasattr(item, key):
                setattr(item, key, value)
        item.updatedAt = self._now()
        stored = self.repository.save_additional_hazard(item)
        return {"additionalHazard": asdict(stored), "warnings": []}

    def list_photos(self, result_id: str) -> list[dict]:
        self._require_result(result_id)
        return [asdict(item) for item in self.repository.list_photos_for_result(result_id)]

    def upload_photo(self, result_id: str, payload: dict) -> dict:
        result = self._require_result(result_id)
        session = self._require_session(result.sessionId)
        photo = ChecklistPhoto(
            id=f"checklist-photo-{uuid4().hex[:8]}",
            projectId=result.projectId,
            inspectionRoundId=result.inspectionRoundId,
            sessionId=session.id,
            checklistResultId=result_id,
            additionalHazardId=payload.get("additionalHazardId"),
            fileId=payload["fileId"],
            fileName=payload["fileName"],
            storagePath=payload["storagePath"],
            caption=payload.get("caption"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_photo(photo)
        if stored.id not in result.photoIds:
            result.photoIds.append(stored.id)
        self.repository.save_result(result)
        return {"photo": asdict(stored), "warnings": []}

    def link_photo(self, result_id: str, photo_id: str, additional_hazard_id: str | None) -> dict:
        result = self._require_result(result_id)
        photo = self._require_photo(photo_id)
        photo.checklistResultId = result_id
        photo.additionalHazardId = additional_hazard_id
        stored = self.repository.save_photo(photo)
        if stored.id not in result.photoIds:
            result.photoIds.append(stored.id)
        self.repository.save_result(result)
        return {"photo": asdict(stored), "warnings": []}

    def unlink_photo(self, photo_id: str) -> dict:
        photo = self._require_photo(photo_id)
        photo.checklistResultId = None
        photo.additionalHazardId = None
        updated = self.repository.save_photo(photo)
        return {"photo": asdict(updated), "warnings": []}

    def get_report_mapping(self, session_id: str) -> dict:
        self._require_session(session_id)
        return {
            "sessionId": session_id,
            "reportMappings": [asdict(item) for item in self.repository.list_report_mappings(session_id)],
        }

    def summarize_session(self, session_id: str) -> dict:
        session = self._require_session(session_id)
        mappings = self._build_report_mappings(session)
        self.repository.delete_report_mappings_for_session(session_id)
        saved = [asdict(self.repository.save_report_mapping(item)) for item in mappings]
        return {"sessionId": session_id, "reportMappings": saved, "warnings": []}

    def sync_to_report(self, session_id: str) -> dict:
        session = self._require_session(session_id)
        report_mappings = self.repository.list_report_mappings(session_id)
        if not report_mappings:
            report_mappings = [self.repository.save_report_mapping(item) for item in self._build_report_mappings(session)]
        synced = []
        for mapping in report_mappings:
            mapping.documentId = mapping.documentId or "doc-sample-001"
            mapping.stale = False
            synced.append(asdict(self.repository.save_report_mapping(mapping)))
        return {"sessionId": session_id, "reportMappings": synced, "warnings": []}

    def create_mobile_draft(self, session_id: str, payload: dict) -> dict:
        self._require_session(session_id)
        draft = ChecklistMobileDraft(
            id=f"checklist-mobile-draft-{uuid4().hex[:8]}",
            sessionId=session_id,
            clientVersion=payload.get("clientVersion", 1),
            draftVersion=payload.get("draftVersion", 1),
            payload=payload.get("payload", {}),
            conflictDetected=False,
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_mobile_draft(draft)
        return {"mobileDraft": asdict(stored), "warnings": []}

    def get_mobile_draft(self, session_id: str, draft_id: str) -> dict:
        self._require_session(session_id)
        draft = self.repository.get_mobile_draft(draft_id)
        if not draft or draft.sessionId != session_id:
            raise ChecklistNotFoundError("checklist mobile draft not found")
        return {"mobileDraft": asdict(draft)}

    def commit_mobile_draft(self, session_id: str, draft_id: str, payload: dict) -> dict:
        draft = self.repository.get_mobile_draft(draft_id)
        if not draft or draft.sessionId != session_id:
            raise ChecklistNotFoundError("checklist mobile draft not found")
        conflict = payload.get("draftVersion", 0) < draft.draftVersion
        draft.clientVersion = payload["clientVersion"]
        draft.draftVersion = payload["draftVersion"]
        draft.payload = payload.get("payload", {})
        draft.conflictDetected = conflict
        draft.updatedAt = self._now()
        stored = self.repository.save_mobile_draft(draft)
        return {"mobileDraft": asdict(stored), "warnings": ["mobileDraftConflict"] if conflict else []}

    def _save_result_with_rules(self, result: ChecklistResult, session: ChecklistSession) -> ChecklistResult:
        if result.result not in self.VALID_RESULTS:
            raise ChecklistValidationError("invalid checklist result value")
        result.actionRequired = result.actionRequired or result.result in {"caution", "bad"}
        if result.result in {"caution", "bad"}:
            candidate = self._build_candidate_for_result(result, session)
            stored_candidate = self.repository.save_candidate(candidate)
            result.findingCandidateId = stored_candidate.id
            result.reportMappingStatus = "mapped"
        elif result.result == "good":
            result.reportMappingStatus = "mapped"
        else:
            result.reportMappingStatus = "not_mapped"
        stored = self.repository.save_result(result)
        self._mark_report_mappings_stale(session.id)
        return stored

    def _build_candidate_for_result(
        self,
        result: ChecklistResult,
        session: ChecklistSession,
        payload_override: dict | None = None,
    ) -> FindingCandidate:
        item = self._require_item(result.checklistItemId)
        existing = self.repository.get_candidate(result.findingCandidateId) if result.findingCandidateId else None
        payload_override = payload_override or {}
        return FindingCandidate(
            id=existing.id if existing else f"finding-candidate-{uuid4().hex[:8]}",
            projectId=session.projectId,
            inspectionRoundId=session.inspectionRoundId,
            sessionId=session.id,
            checklistResultId=result.id,
            title=payload_override.get("title") or f"{item.title} 보완 필요",
            detail=payload_override.get("detail") or result.comment or item.detail or item.title,
            riskType=payload_override.get("riskType") or item.categoryKey,
            requiredAction=payload_override.get("requiredAction") or "현장 보완 후 재점검",
            status=existing.status if existing else "candidate",
            convertedFindingId=existing.convertedFindingId if existing else None,
            dismissedReason=existing.dismissedReason if existing else None,
            createdAt=existing.createdAt if existing else self._now(),
            updatedAt=self._now(),
        )

    def _transition_session(self, session_id: str, status: str, started_at: bool = False) -> dict:
        session = self._require_session(session_id)
        session.status = status
        if started_at and not session.startedAt:
            session.startedAt = self._now()
        session.updatedAt = self._now()
        updated = self.repository.save_session(session)
        return {"session": self._serialize_session(updated), "warnings": self._validation_warnings(updated)}

    def _build_report_mappings(self, session: ChecklistSession) -> list[ChecklistReportMapping]:
        grouped: dict[tuple[str, str], list[str]] = {}
        for result in self.repository.list_results(session.id):
            item = self._require_item(result.checklistItemId)
            if result.result == "not_checked":
                continue
            key = (item.sourceSectionKey or "inspection_checklist", item.reportLabel or item.title)
            grouped.setdefault(key, []).append(result.result)
        mappings = []
        for index, ((section_key, label), result_values) in enumerate(grouped.items(), start=1):
            summary = f"{label}: {', '.join(result_values)}"
            mappings.append(
                ChecklistReportMapping(
                    id=f"checklist-report-mapping-{session.id}-{index:02d}",
                    sessionId=session.id,
                    documentId=None,
                    sourceSectionKey=section_key,
                    reportLabel=label,
                    rowSummary=summary,
                    stale=False,
                    createdAt=self._now(),
                    updatedAt=self._now(),
                )
            )
        return mappings

    def _validation_warnings(self, session: ChecklistSession) -> list[str]:
        warnings: list[str] = []
        validation = self.validate_results(session.id)
        if validation["missingRequiredItems"]:
            warnings.append("requiredChecklistItemsMissing")
        if any(result.result in {"caution", "bad"} and len(result.photoIds) == 0 for result in self.repository.list_results(session.id)):
            warnings.append("cautionOrBadPhotoMissing")
        return warnings

    def _result_warnings(self, result: ChecklistResult) -> list[str]:
        warnings: list[str] = []
        if result.result == "not_applicable" and not (result.comment or "").strip():
            warnings.append("notApplicableReasonRecommended")
        if result.result in {"caution", "bad"} and not (result.comment or "").strip():
            warnings.append("commentRecommended")
        if result.result in {"caution", "bad"} and not result.photoIds:
            warnings.append("photoRecommended")
        return warnings

    def _serialize_session(self, session: ChecklistSession) -> dict:
        results = self.repository.list_results(session.id)
        completed_count = sum(1 for item in results if item.result != "not_checked")
        return {
            **asdict(session),
            "resultCount": len(results),
            "completedCount": completed_count,
            "progressRate": 0 if len(results) == 0 else round(completed_count / len(results), 2),
        }

    def _serialize_result(self, result: ChecklistResult) -> dict:
        item = self._require_item(result.checklistItemId)
        return {
            **asdict(result),
            "item": asdict(item),
        }

    def _require_template(self, template_id: str) -> ChecklistTemplate:
        template = self.repository.get_template(template_id)
        if not template:
            raise ChecklistNotFoundError("checklist template not found")
        return template

    def _require_item(self, item_id: str) -> ChecklistItem:
        item = self.repository.get_item(item_id)
        if not item:
            raise ChecklistNotFoundError("checklist item not found")
        return item

    def _require_round(self, inspection_round_id: str):
        round_item = self.inspection_repository.get_round(inspection_round_id)
        if not round_item:
            raise ChecklistNotFoundError("inspection round not found")
        return round_item

    def _require_session(self, session_id: str) -> ChecklistSession:
        session = self.repository.get_session(session_id)
        if not session:
            raise ChecklistNotFoundError("checklist session not found")
        return session

    def _require_result(self, result_id: str) -> ChecklistResult:
        result = self.repository.get_result(result_id)
        if not result:
            raise ChecklistNotFoundError("checklist result not found")
        return result

    def _require_candidate(self, candidate_id: str) -> FindingCandidate:
        candidate = self.repository.get_candidate(candidate_id)
        if not candidate:
            raise ChecklistNotFoundError("finding candidate not found")
        return candidate

    def _require_additional_hazard(self, hazard_id: str) -> AdditionalHazardItem:
        item = self.repository.get_additional_hazard(hazard_id)
        if not item:
            raise ChecklistNotFoundError("additional hazard not found")
        return item

    def _require_photo(self, photo_id: str) -> ChecklistPhoto:
        photo = self.repository.get_photo(photo_id)
        if not photo:
            raise ChecklistNotFoundError("checklist photo not found")
        return photo

    def _ensure_session_mutable(self, session: ChecklistSession) -> None:
        if session.status == "locked":
            raise ChecklistValidationError("locked checklist session cannot be updated")

    def _mark_report_mappings_stale(self, session_id: str) -> None:
        mappings = self.repository.list_report_mappings(session_id)
        for mapping in mappings:
            mapping.stale = True
            mapping.updatedAt = self._now()
            self.repository.save_report_mapping(mapping)

    def _now(self) -> str:
        return "2026-05-10T09:00:00+09:00"
