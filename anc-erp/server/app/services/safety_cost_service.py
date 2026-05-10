from dataclasses import asdict
from uuid import uuid4

from server.app.domain.models import (
    AuditLog,
    DocumentVersion,
    ProjectParty,
    SafetyCostEvidence,
    SafetyCostHistoryEvent,
    SafetyCostReportMapping,
    SafetyCostReview,
    SafetyCostUsage,
    SafetyCostValidationWarning,
)
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.project_repository import ProjectRepository
from server.app.repositories.safety_cost_repository import SafetyCostRepository


class SafetyCostNotFoundError(Exception):
    pass


class SafetyCostValidationError(Exception):
    pass


class SafetyCostService:
    def __init__(
        self,
        repository: SafetyCostRepository,
        project_repository: ProjectRepository,
        inspection_repository: InspectionRepository,
    ) -> None:
        self.repository = repository
        self.project_repository = project_repository
        self.inspection_repository = inspection_repository

    def list_project_usages(self, project_id: str) -> list[dict]:
        self._require_project(project_id)
        items = sorted(
            self.repository.list_project_usages(project_id),
            key=lambda item: (item.inspectionRoundId, item.ownerPartyId, item.updatedAt),
            reverse=True,
        )
        return [self._serialize_list_item(item) for item in items]

    def list_round_usages(self, inspection_round_id: str) -> list[dict]:
        self._require_round(inspection_round_id)
        items = sorted(
            self.repository.list_round_usages(inspection_round_id),
            key=lambda item: item.ownerPartyId,
        )
        return [self._serialize_list_item(item) for item in items]

    def create_usage(self, inspection_round_id: str, payload: dict) -> dict:
        round_item = self._require_round(inspection_round_id)
        owner_party_id = payload.get("ownerPartyId")
        if not owner_party_id:
            raise SafetyCostValidationError("ownerPartyId is required")
        owner_party = self._require_owner_party(round_item.projectId, owner_party_id)
        duplicate = self.repository.find_active_usage(inspection_round_id, owner_party_id)
        if duplicate:
            raise SafetyCostValidationError("same inspectionRoundId + ownerPartyId already has active usage")
        usage = SafetyCostUsage(
            id=f"safety-cost-usage-{uuid4().hex[:8]}",
            projectId=round_item.projectId,
            inspectionRoundId=inspection_round_id,
            ownerPartyId=owner_party_id,
            calculatedAmount=payload["calculatedAmount"],
            usedAmount=payload["usedAmount"],
            usedRateCalculated=self._calculate_rate_value(payload["calculatedAmount"], payload["usedAmount"]),
            userEnteredRate=payload.get("userEnteredRate"),
            basisMonth=payload.get("basisMonth"),
            basisDate=payload.get("basisDate"),
            basisDocumentText=payload.get("basisDocumentText"),
            appropriatenessComment=payload.get("appropriatenessComment"),
            appropriatenessStatus=payload.get("appropriatenessStatus", "not_reviewed"),
            status=self._derive_status(payload, evidence_count=0),
            reportInclude=payload.get("reportInclude", True),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        self._validate_usage_values(usage)
        stored = self.repository.save_usage(usage)
        history = self.repository.add_history(
            SafetyCostHistoryEvent(
                id=f"safety-cost-history-{uuid4().hex[:8]}",
                safetyCostUsageId=stored.id,
                projectId=stored.projectId,
                inspectionRoundId=stored.inspectionRoundId,
                ownerPartyId=stored.ownerPartyId,
                eventType="safety-cost.created",
                summary="산업안전보건관리비 사용내역이 등록되었습니다.",
                changedFields=["calculatedAmount", "usedAmount", "basisMonth", "basisDate", "basisDocumentText"],
                createdAt=self._now(),
            )
        )
        audit_log = self.repository.add_audit_log(
            AuditLog(
                id=f"safety-cost-audit-{uuid4().hex[:8]}",
                entityType="safety_cost_usage",
                entityId=stored.id,
                action="safety-cost.created",
                summary=f"{self._owner_display_name(owner_party)} 안전관리비 사용내역이 생성되었습니다.",
                fieldNames=["projectId", "inspectionRoundId", "ownerPartyId"],
                createdAt=self._now(),
            )
        )
        return {
            "usage": asdict(stored),
            "warnings": [asdict(item) for item in self._validate_usage(stored)],
            "historyEvent": asdict(history),
            "auditLog": asdict(audit_log),
        }

    def get_usage(self, usage_id: str) -> dict:
        usage = self._require_usage(usage_id)
        mapping = self.repository.get_report_mapping(usage_id)
        document_version = (
            self.repository.get_document_version(mapping.documentVersionId)
            if mapping and mapping.documentVersionId
            else None
        )
        return {
            "usage": asdict(usage),
            "ownerDisplayName": self._owner_display_name_by_usage(usage),
            "evidenceItems": [asdict(item) for item in self.repository.list_evidence(usage_id)],
            "reviews": [asdict(item) for item in self.repository.list_reviews(usage_id)],
            "history": [asdict(item) for item in self.repository.list_history(usage_id)],
            "warnings": [asdict(item) for item in self._validate_usage(usage)],
            "reportMapping": asdict(mapping) if mapping else None,
            "documentVersion": asdict(document_version) if document_version else None,
        }

    def update_usage(self, usage_id: str, payload: dict) -> dict:
        usage = self._require_usage(usage_id)
        changed_fields: list[str] = []
        previous_values = {
            "calculatedAmount": usage.calculatedAmount,
            "usedAmount": usage.usedAmount,
            "basisMonth": usage.basisMonth,
            "basisDate": usage.basisDate,
            "basisDocumentText": usage.basisDocumentText,
            "appropriatenessComment": usage.appropriatenessComment,
            "userEnteredRate": usage.userEnteredRate,
            "reportInclude": usage.reportInclude,
        }
        for key, value in payload.items():
            if hasattr(usage, key) and value is not None:
                if getattr(usage, key) != value:
                    changed_fields.append(key)
                setattr(usage, key, value)
        if "calculatedAmount" in payload or "usedAmount" in payload:
            usage.usedRateCalculated = self._calculate_rate_value(usage.calculatedAmount, usage.usedAmount)
        usage.status = self._derive_status(asdict(usage), evidence_count=len(self.repository.list_evidence(usage.id)))
        self._validate_usage_values(usage)
        usage.updatedAt = self._now()
        stored = self.repository.save_usage(usage)
        if changed_fields:
            self.repository.add_history(
                SafetyCostHistoryEvent(
                    id=f"safety-cost-history-{uuid4().hex[:8]}",
                    safetyCostUsageId=stored.id,
                    projectId=stored.projectId,
                    inspectionRoundId=stored.inspectionRoundId,
                    ownerPartyId=stored.ownerPartyId,
                    eventType="safety-cost.updated",
                    summary="산업안전보건관리비 사용내역이 수정되었습니다.",
                    changedFields=changed_fields,
                    createdAt=self._now(),
                )
            )
            audit_log = self.repository.add_audit_log(
                AuditLog(
                    id=f"safety-cost-audit-{uuid4().hex[:8]}",
                    entityType="safety_cost_usage",
                    entityId=stored.id,
                    action="safety-cost.updated",
                    summary="산업안전보건관리비 사용내역이 수정되었습니다.",
                    fieldNames=changed_fields,
                    createdAt=self._now(),
                )
            )
        else:
            audit_log = None
        if self.repository.get_report_mapping(stored.id):
            mapping = self.repository.get_report_mapping(stored.id)
            if mapping:
                mapping.projectSummaryPhrase = self._build_project_summary_phrase(stored)
                mapping.implementationBudgetPhrase = self._build_budget_phrase(stored)
                self.repository.save_report_mapping(mapping)
        return {
            "usage": asdict(stored),
            "warnings": [asdict(item) for item in self._validate_usage(stored)],
            "previousValues": previous_values,
            "auditLog": asdict(audit_log) if audit_log else None,
        }

    def delete_usage(self, usage_id: str) -> dict:
        self._require_usage(usage_id)
        archived = self.repository.delete_usage(usage_id, self._now())
        return {"deleted": bool(archived), "usageId": usage_id}

    def calculate_rate(self, usage_id: str) -> dict:
        usage = self._require_usage(usage_id)
        usage.usedRateCalculated = self._calculate_rate_value(usage.calculatedAmount, usage.usedAmount)
        usage.updatedAt = self._now()
        stored = self.repository.save_usage(usage)
        return {
            "usageId": stored.id,
            "usedRateCalculated": stored.usedRateCalculated,
            "warnings": [asdict(item) for item in self._validate_usage(stored)],
        }

    def validate(self, usage_id: str) -> dict:
        usage = self._require_usage(usage_id)
        warnings = self._validate_usage(usage)
        return {
            "usageId": usage_id,
            "warnings": [asdict(item) for item in warnings],
            "hasDanger": any(item.severity == "danger" for item in warnings),
        }

    def generate_comment(self, usage_id: str) -> dict:
        usage = self._require_usage(usage_id)
        evidence_items = self.repository.list_evidence(usage_id)
        comment = self._generate_comment_text(usage, evidence_items)
        usage.status = "review"
        usage.updatedAt = self._now()
        stored = self.repository.save_usage(usage)
        review = self.repository.add_review(
            SafetyCostReview(
                id=f"safety-cost-review-{uuid4().hex[:8]}",
                safetyCostUsageId=stored.id,
                reviewerId="ai-draft",
                reviewedAt=self._now(),
                reviewComment=comment,
                appropriatenessStatus=stored.appropriatenessStatus,
                aiDraftComment=comment,
            )
        )
        return {
            "usage": asdict(stored),
            "review": asdict(review),
            "warnings": [asdict(item) for item in self._validate_usage(stored)],
        }

    def review(self, usage_id: str, payload: dict) -> dict:
        usage = self._require_usage(usage_id)
        usage.appropriatenessComment = payload["reviewComment"]
        usage.appropriatenessStatus = payload["appropriatenessStatus"]
        usage.status = "review"
        usage.updatedAt = self._now()
        stored = self.repository.save_usage(usage)
        review = self.repository.add_review(
            SafetyCostReview(
                id=f"safety-cost-review-{uuid4().hex[:8]}",
                safetyCostUsageId=stored.id,
                reviewerId=payload["reviewerId"],
                reviewedAt=self._now(),
                reviewComment=payload["reviewComment"],
                appropriatenessStatus=payload["appropriatenessStatus"],
                aiDraftComment=payload.get("aiDraftComment"),
            )
        )
        return {
            "usage": asdict(stored),
            "review": asdict(review),
            "warnings": [asdict(item) for item in self._validate_usage(stored)],
        }

    def confirm(self, usage_id: str, payload: dict) -> dict:
        usage = self._require_usage(usage_id)
        warnings = self._validate_usage(usage)
        if any(item.severity == "danger" for item in warnings):
            raise SafetyCostValidationError("danger warnings must be resolved before confirm")
        warning_types = {item.type for item in warnings}
        if {"missing_basis_month", "missing_basis_document", "missing_evidence"} & warning_types:
            raise SafetyCostValidationError("basis month/date and evidence required before confirm")
        usage.confirmedBy = payload["confirmedBy"]
        usage.confirmedAt = payload.get("confirmedAt") or self._now()
        usage.status = "confirmed"
        usage.updatedAt = self._now()
        stored = self.repository.save_usage(usage)
        self.repository.add_history(
            SafetyCostHistoryEvent(
                id=f"safety-cost-history-{uuid4().hex[:8]}",
                safetyCostUsageId=stored.id,
                projectId=stored.projectId,
                inspectionRoundId=stored.inspectionRoundId,
                ownerPartyId=stored.ownerPartyId,
                eventType="safety-cost.confirmed",
                summary="산업안전보건관리비 사용내역이 확정되었습니다.",
                changedFields=["status", "confirmedBy", "confirmedAt"],
                createdAt=self._now(),
            )
        )
        return {
            "usage": asdict(stored),
            "warnings": [asdict(item) for item in self._validate_usage(stored)],
        }

    def sync_to_report(self, usage_id: str, document_id: str) -> dict:
        usage = self._require_usage(usage_id)
        if usage.status != "confirmed" and usage.status != "synced_to_report":
            raise SafetyCostValidationError("SafetyCostUsage must be confirmed before sync-to-report")
        document = self._require_document(document_id)
        mapping = SafetyCostReportMapping(
            id=f"safety-cost-report-mapping-{uuid4().hex[:8]}",
            safetyCostUsageId=usage.id,
            documentId=document_id,
            projectSummaryPhrase=self._build_project_summary_phrase(usage),
            implementationBudgetPhrase=self._build_budget_phrase(usage),
            documentVersionId=f"document-version-safety-cost-{uuid4().hex[:8]}",
            syncedAt=self._now(),
        )
        stored_mapping = self.repository.save_report_mapping(mapping)
        document_version = self.repository.save_document_version(
            DocumentVersion(
                id=stored_mapping.documentVersionId or f"document-version-safety-cost-{uuid4().hex[:8]}",
                documentId=document.id,
                projectId=usage.projectId,
                inspectionRoundId=usage.inspectionRoundId,
                ownerPartyId=usage.ownerPartyId,
                sectionKey="safety_cost_usage",
                createdAt=self._now(),
            )
        )
        section = self.repository.save_document_section(
            document_id,
            {
                "documentId": document_id,
                "documentVersionId": document_version.id,
                "sectionKey": "safety_cost_usage",
                "safetyCostUsageId": usage.id,
                "projectSummaryPhrase": stored_mapping.projectSummaryPhrase,
                "implementationBudgetPhrase": stored_mapping.implementationBudgetPhrase,
                "updatedAt": self._now(),
            },
        )
        usage.syncedDocumentId = document_id
        usage.status = "synced_to_report"
        usage.updatedAt = self._now()
        stored_usage = self.repository.save_usage(usage)
        return {
            "usage": asdict(stored_usage),
            "reportMapping": asdict(stored_mapping),
            "documentVersion": asdict(document_version),
            "documentVersionId": document_version.id,
            "documentId": document_id,
            "sectionKey": "safety_cost_usage",
            "section": section,
            "warnings": [asdict(item) for item in self._validate_usage(stored_usage)],
        }

    def owner_matrix(self, project_id: str) -> dict:
        self._require_project(project_id)
        owner_parties = self._list_owner_parties(project_id)
        rows = []
        for owner_party in owner_parties:
            usages = [
                item
                for item in self.repository.list_project_usages(project_id)
                if item.ownerPartyId == (owner_party.ownerPartyId or "")
            ]
            latest = sorted(usages, key=lambda item: item.updatedAt or item.createdAt, reverse=True)[0] if usages else None
            rows.append(
                {
                    "ownerPartyId": owner_party.ownerPartyId,
                    "ownerDisplayName": self._owner_display_name(owner_party),
                    "usage": asdict(latest) if latest else None,
                    "warnings": [asdict(item) for item in self._validate_usage(latest)] if latest else [],
                    "evidenceCount": len(self.repository.list_evidence(latest.id)) if latest else 0,
                }
            )
        return {"projectId": project_id, "rows": rows}

    def list_evidence(self, usage_id: str) -> list[dict]:
        self._require_usage(usage_id)
        return [asdict(item) for item in self.repository.list_evidence(usage_id)]

    def upload_evidence(self, usage_id: str, payload: dict) -> dict:
        usage = self._require_usage(usage_id)
        evidence = SafetyCostEvidence(
            id=f"safety-cost-evidence-{uuid4().hex[:8]}",
            safetyCostUsageId=usage.id,
            projectId=usage.projectId,
            inspectionRoundId=usage.inspectionRoundId,
            ownerPartyId=usage.ownerPartyId,
            fileId=payload["fileId"],
            evidenceType=payload["evidenceType"],
            fileName=payload["fileName"],
            storagePath=payload["storagePath"],
            issuedDate=payload.get("issuedDate"),
            submittedBy=payload.get("submittedBy"),
            memo=payload.get("memo"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_evidence(evidence)
        self._touch_usage(usage)
        self.repository.add_history(
            SafetyCostHistoryEvent(
                id=f"safety-cost-history-{uuid4().hex[:8]}",
                safetyCostUsageId=usage.id,
                projectId=usage.projectId,
                inspectionRoundId=usage.inspectionRoundId,
                ownerPartyId=usage.ownerPartyId,
                eventType="safety-cost.evidence.uploaded",
                summary="산업안전보건관리비 증빙파일이 추가되었습니다.",
                changedFields=["evidence"],
                fileId=stored.fileId,
                createdAt=self._now(),
            )
        )
        return {"evidence": asdict(stored), "warnings": [asdict(item) for item in self._validate_usage(usage)]}

    def link_evidence_file(self, usage_id: str, payload: dict) -> dict:
        return self.upload_evidence(usage_id, payload)

    def update_evidence(self, evidence_id: str, payload: dict) -> dict:
        evidence = self._require_evidence(evidence_id)
        for key, value in payload.items():
            if hasattr(evidence, key) and value is not None:
                setattr(evidence, key, value)
        evidence.updatedAt = self._now()
        stored = self.repository.save_evidence(evidence)
        usage = self._require_usage(evidence.safetyCostUsageId)
        self._touch_usage(usage)
        return {"evidence": asdict(stored), "warnings": [asdict(item) for item in self._validate_usage(usage)]}

    def delete_evidence(self, evidence_id: str) -> dict:
        evidence = self._require_evidence(evidence_id)
        self.repository.delete_evidence(evidence_id)
        usage = self._require_usage(evidence.safetyCostUsageId)
        self._touch_usage(usage)
        return {"deleted": True, "evidenceId": evidence_id}

    def get_history(self, usage_id: str) -> list[dict]:
        self._require_usage(usage_id)
        return [asdict(item) for item in self.repository.list_history(usage_id)]

    def get_document_safety_cost_usage(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        section = self.repository.get_document_section(document_id)
        usage = self._resolve_document_usage(document_id, document)
        if not usage:
            raise SafetyCostNotFoundError("safety cost usage for document not found")
        mapping = self.repository.get_report_mapping(usage.id)
        document_version = None
        if section and section.get("documentVersionId"):
            document_version = self.repository.get_document_version(section["documentVersionId"])
        elif mapping and mapping.documentVersionId:
            document_version = self.repository.get_document_version(mapping.documentVersionId)
        return {
            "documentId": document_id,
            "section": section
            or {
                "documentId": document_id,
                "documentVersionId": document_version.id if document_version else None,
                "sectionKey": "safety_cost_usage",
                "safetyCostUsageId": usage.id,
                "projectSummaryPhrase": self._build_project_summary_phrase(usage),
                "implementationBudgetPhrase": self._build_budget_phrase(usage),
                "updatedAt": usage.updatedAt,
            },
            "documentVersion": asdict(document_version) if document_version else None,
            "usage": asdict(usage),
            "evidenceItems": [asdict(item) for item in self.repository.list_evidence(usage.id)],
            "reviews": [asdict(item) for item in self.repository.list_reviews(usage.id)],
            "warnings": [asdict(item) for item in self._validate_usage(usage)],
            "reportMapping": asdict(mapping) if mapping else None,
        }

    def refresh_document_safety_cost_usage(self, document_id: str) -> dict:
        document = self._require_document(document_id)
        usage = self._resolve_document_usage(document_id, document)
        if not usage:
            raise SafetyCostNotFoundError("safety cost usage for document not found")
        return self.sync_to_report(usage.id, document_id)

    def _serialize_list_item(self, usage: SafetyCostUsage) -> dict:
        return {
            "usage": asdict(usage),
            "ownerDisplayName": self._owner_display_name_by_usage(usage),
            "evidenceCount": len(self.repository.list_evidence(usage.id)),
            "warnings": [asdict(item) for item in self._validate_usage(usage)],
        }

    def _validate_usage(self, usage: SafetyCostUsage | None) -> list[SafetyCostValidationWarning]:
        if not usage:
            return []
        warnings: list[SafetyCostValidationWarning] = []
        if usage.userEnteredRate is not None and round(usage.userEnteredRate, 1) != usage.usedRateCalculated:
            warnings.append(
                SafetyCostValidationWarning(
                    type="rate_mismatch",
                    severity="warning",
                    message="입력 사용률과 시스템 계산 사용률이 다릅니다.",
                )
            )
        if usage.usedAmount > usage.calculatedAmount:
            warnings.append(
                SafetyCostValidationWarning(
                    type="used_amount_exceeds_calculated",
                    severity="danger",
                    message="사용금액이 계상금액을 초과했습니다.",
                )
            )
        if not (usage.basisMonth or usage.basisDate):
            warnings.append(
                SafetyCostValidationWarning(
                    type="missing_basis_month",
                    severity="warning",
                    message="기준월 또는 기준일이 필요합니다.",
                )
            )
        evidence_items = self.repository.list_evidence(usage.id)
        if not usage.basisDocumentText and not evidence_items:
            warnings.append(
                SafetyCostValidationWarning(
                    type="missing_basis_document",
                    severity="warning",
                    message="관련근거 문구 또는 증빙자료가 필요합니다.",
                )
            )
        if not evidence_items:
            warnings.append(
                SafetyCostValidationWarning(
                    type="missing_evidence",
                    severity="warning",
                    message="증빙파일이 연결되지 않았습니다.",
                )
            )
        owner_party = self._find_owner_party(usage.projectId, usage.ownerPartyId)
        if not owner_party:
            warnings.append(
                SafetyCostValidationWarning(
                    type="owner_mismatch",
                    severity="danger",
                    message="발주처별 산업안전보건관리비 값이 올바른 ownerParty에 연결되지 않았습니다.",
                )
            )
        if usage.status != "confirmed" and usage.status != "synced_to_report":
            warnings.append(
                SafetyCostValidationWarning(
                    type="not_confirmed",
                    severity="info",
                    message="보고서 export 전 확정이 필요합니다.",
                )
            )
        return warnings

    def _validate_usage_values(self, usage: SafetyCostUsage) -> None:
        if not usage.projectId or not usage.inspectionRoundId or not usage.ownerPartyId:
            raise SafetyCostValidationError("projectId, inspectionRoundId, ownerPartyId are required")
        if usage.calculatedAmount <= 0:
            raise SafetyCostValidationError("calculatedAmount must be greater than 0")
        if usage.usedAmount < 0:
            raise SafetyCostValidationError("usedAmount must be greater than or equal to 0")
        self._require_owner_party(usage.projectId, usage.ownerPartyId)

    def _generate_comment_text(self, usage: SafetyCostUsage, evidence_items: list[SafetyCostEvidence]) -> str:
        basis = usage.basisMonth or usage.basisDate or "기준 미입력"
        evidence_phrase = "관련 증빙이 확인되었고" if evidence_items else "추가 증빙 확인이 필요하나"
        if usage.usedAmount > usage.calculatedAmount:
            return (
                f"{basis} 기준 사용금액이 계상금액을 초과하여 {evidence_phrase} "
                "산업안전보건관리비 집행 적정성에 대한 추가 검토가 필요합니다."
            )
        return (
            f"{basis} 기준 사용률 {usage.usedRateCalculated:.1f}%로 확인되며, "
            f"{evidence_phrase} 공사 특수성을 반영해 적정하게 사용 중인 것으로 판단됩니다."
        )

    def _build_project_summary_phrase(self, usage: SafetyCostUsage) -> str:
        basis = usage.basisMonth or usage.basisDate or "기준 미입력"
        return (
            f"계상금액 {usage.calculatedAmount:,.0f}원 중 {usage.usedAmount:,.0f}원 사용, "
            f"사용률 {usage.usedRateCalculated:.1f}% ({basis} 기준)"
        )

    def _build_budget_phrase(self, usage: SafetyCostUsage) -> str:
        return usage.appropriatenessComment or "산업안전보건관리비 사용 적정성 검토 의견을 입력하세요."

    def _derive_status(self, payload: dict, evidence_count: int) -> str:
        if payload.get("status") in {"confirmed", "synced_to_report", "archived"}:
            return payload["status"]
        has_support = bool(payload.get("basisDocumentText")) or evidence_count > 0
        if not has_support:
            return "needs_evidence"
        return "draft"

    def _calculate_rate_value(self, calculated_amount: int, used_amount: int) -> float:
        if calculated_amount <= 0:
            raise SafetyCostValidationError("calculatedAmount must be greater than 0")
        if used_amount < 0:
            raise SafetyCostValidationError("usedAmount must be greater than or equal to 0")
        return round((used_amount / calculated_amount) * 100, 1)

    def _touch_usage(self, usage: SafetyCostUsage) -> SafetyCostUsage:
        usage.updatedAt = self._now()
        usage.status = self._derive_status(asdict(usage), evidence_count=len(self.repository.list_evidence(usage.id)))
        return self.repository.save_usage(usage)

    def _require_project(self, project_id: str):
        project = self.project_repository.get_project(project_id)
        if not project:
            raise SafetyCostNotFoundError("project not found")
        return project

    def _require_round(self, inspection_round_id: str):
        round_item = self.inspection_repository.get_round(inspection_round_id)
        if not round_item:
            raise SafetyCostNotFoundError("inspection round not found")
        return round_item

    def _require_usage(self, usage_id: str) -> SafetyCostUsage:
        usage = self.repository.get_usage(usage_id)
        if not usage:
            raise SafetyCostNotFoundError("safety cost usage not found")
        return usage

    def _require_evidence(self, evidence_id: str) -> SafetyCostEvidence:
        evidence = self.repository.get_evidence(evidence_id)
        if not evidence:
            raise SafetyCostNotFoundError("safety cost evidence not found")
        return evidence

    def _list_owner_parties(self, project_id: str) -> list[ProjectParty]:
        return [
            party
            for party in self.project_repository.list_project_parties(project_id)
            if party.role == "owner" and party.ownerPartyId
        ]

    def _find_owner_party(self, project_id: str, owner_party_id: str) -> ProjectParty | None:
        for party in self._list_owner_parties(project_id):
            if party.ownerPartyId == owner_party_id:
                return party
        return None

    def _require_owner_party(self, project_id: str, owner_party_id: str) -> ProjectParty:
        owner_party = self._find_owner_party(project_id, owner_party_id)
        if not owner_party:
            raise SafetyCostValidationError("ownerPartyId must be an owner ProjectParty")
        return owner_party

    def _owner_display_name(self, owner_party: ProjectParty) -> str:
        organization = self.project_repository.get_organization(owner_party.organizationId)
        return organization.name if organization else owner_party.organizationId

    def _owner_display_name_by_usage(self, usage: SafetyCostUsage) -> str:
        owner_party = self._find_owner_party(usage.projectId, usage.ownerPartyId)
        return self._owner_display_name(owner_party) if owner_party else usage.ownerPartyId

    def _require_document(self, document_id: str):
        document = self._find_document_instance(document_id)
        if not document:
            raise SafetyCostNotFoundError("document not found")
        return document

    def _find_document_instance(self, document_id: str):
        for aggregate in self.project_repository.list_project_aggregates():
            for round_item in aggregate.inspectionRounds:
                for document in round_item.documentInstances:
                    if document.id == document_id:
                        return document
        return None

    def _resolve_document_usage(self, document_id: str, document) -> SafetyCostUsage | None:
        section = self.repository.get_document_section(document_id)
        if section:
            usage = self.repository.get_usage(section["safetyCostUsageId"])
            if usage:
                return usage
        if document.ownerPartyId:
            usage = self.repository.find_active_usage(document.inspectionRoundId, document.ownerPartyId)
            if usage:
                return usage
        for item in self.repository.list_round_usages(document.inspectionRoundId):
            if item.syncedDocumentId == document_id:
                return item
        return None

    def _now(self) -> str:
        return "2026-05-10T09:00:00+09:00"
