from copy import deepcopy

from server.app.domain.models import (
    AuditLog,
    DocumentVersion,
    SafetyCostEvidence,
    SafetyCostHistoryEvent,
    SafetyCostReportMapping,
    SafetyCostReview,
    SafetyCostUsage,
)
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.project_repository import ProjectRepository


class SafetyCostRepository:
    def __init__(
        self,
        project_repository: ProjectRepository,
        inspection_repository: InspectionRepository,
    ) -> None:
        self.project_repository = project_repository
        self.inspection_repository = inspection_repository
        self.usages: dict[str, SafetyCostUsage] = {}
        self.evidenceItems: dict[str, SafetyCostEvidence] = {}
        self.reviews: dict[str, list[SafetyCostReview]] = {}
        self.historyEvents: dict[str, list[SafetyCostHistoryEvent]] = {}
        self.auditLogs: dict[str, list[AuditLog]] = {}
        self.reportMappings: dict[str, SafetyCostReportMapping] = {}
        self.documentSections: dict[str, dict] = {}
        self.documentVersions: dict[str, DocumentVersion] = {}
        self._seed()

    def _seed(self) -> None:
        project_id = "project-sample-001"
        round_id = "round-sample-001"
        created_at = "2026-05-10T09:00:00+09:00"
        usage_rows = [
            (
                "safety-cost-usage-sample-001",
                "owner-samsung-cultural-foundation",
                99462613,
                37978000,
                38.2,
                "1월말",
                "산업안전보건관리비 사용내역서",
                "appropriate",
                "confirmed",
                "공사 특수성을 반영, 적정하게 사용 중으로 판단됨",
            ),
            (
                "safety-cost-usage-sample-002",
                "owner-samsung-life-foundation",
                66928618,
                27117450,
                40.5,
                "1월말",
                "산업안전보건관리비 사용내역서",
                "appropriate",
                "review",
                "공사 특수성을 반영, 적정하게 사용 중으로 판단됨",
            ),
        ]
        for index, (
            usage_id,
            owner_party_id,
            calculated_amount,
            used_amount,
            entered_rate,
            basis_month,
            basis_document,
            appropriateness_status,
            status,
            comment,
        ) in enumerate(usage_rows, start=1):
            usage = SafetyCostUsage(
                id=usage_id,
                projectId=project_id,
                inspectionRoundId=round_id,
                ownerPartyId=owner_party_id,
                calculatedAmount=calculated_amount,
                usedAmount=used_amount,
                usedRateCalculated=round((used_amount / calculated_amount) * 100, 1),
                userEnteredRate=entered_rate,
                basisMonth=basis_month,
                basisDocumentText=basis_document,
                appropriatenessComment=comment,
                appropriatenessStatus=appropriateness_status,
                status=status,
                confirmedBy="user-engineer-001" if status == "confirmed" else None,
                confirmedAt=created_at if status == "confirmed" else None,
                createdAt=created_at,
                updatedAt=created_at,
            )
            self.usages[usage.id] = deepcopy(usage)
            evidence = SafetyCostEvidence(
                id=f"safety-cost-evidence-sample-{index:03d}",
                safetyCostUsageId=usage.id,
                projectId=project_id,
                inspectionRoundId=round_id,
                ownerPartyId=owner_party_id,
                fileId=f"file-asset-safety-cost-{index:03d}",
                evidenceType="safety_cost_usage_statement",
                fileName=f"safety-cost-usage-{index:03d}.pdf",
                storagePath=f"/리움미술관 승강기 교체공사/04_현장점검/제1회/산업안전보건관리비/safety-cost-usage-{index:03d}.pdf",
                issuedDate="2026-01-31",
                submittedBy="contact-contractor-001",
                memo="시공사 제출본",
                createdAt=created_at,
                updatedAt=created_at,
            )
            self.evidenceItems[evidence.id] = deepcopy(evidence)
            review = SafetyCostReview(
                id=f"safety-cost-review-sample-{index:03d}",
                safetyCostUsageId=usage.id,
                reviewerId="user-engineer-001",
                reviewedAt=created_at,
                reviewComment=comment,
                appropriatenessStatus=appropriateness_status,
                aiDraftComment=comment,
            )
            self.reviews[usage.id] = [deepcopy(review)]
            history = SafetyCostHistoryEvent(
                id=f"safety-cost-history-sample-{index:03d}",
                safetyCostUsageId=usage.id,
                projectId=project_id,
                inspectionRoundId=round_id,
                ownerPartyId=owner_party_id,
                eventType="safety-cost.created",
                summary="산업안전보건관리비 사용내역이 등록되었습니다.",
                changedFields=["calculatedAmount", "usedAmount", "basisMonth", "basisDocumentText"],
                createdAt=created_at,
            )
            self.historyEvents[usage.id] = [deepcopy(history)]
            self.auditLogs[usage.id] = [
                AuditLog(
                    id=f"safety-cost-audit-sample-{index:03d}",
                    entityType="safety_cost_usage",
                    entityId=usage.id,
                    action="safety-cost.created",
                    summary="산업안전보건관리비 사용내역 초안이 생성되었습니다.",
                    fieldNames=["projectId", "inspectionRoundId", "ownerPartyId"],
                    createdAt=created_at,
                )
            ]

        self._seed_document_section(
            usage_id="safety-cost-usage-sample-001",
            document_id="doc-sample-001",
            created_at=created_at,
        )

    def _seed_document_section(self, usage_id: str, document_id: str, created_at: str) -> None:
        usage = self.usages[usage_id]
        mapping = SafetyCostReportMapping(
            id=f"safety-cost-report-mapping-{usage_id}",
            safetyCostUsageId=usage.id,
            documentId=document_id,
            projectSummaryPhrase=self._build_project_summary_phrase(usage),
            implementationBudgetPhrase=self._build_budget_phrase(usage),
            documentVersionId=f"document-version-safety-cost-{usage.id}",
            syncedAt=created_at,
        )
        self.reportMappings[usage.id] = deepcopy(mapping)
        document_version = DocumentVersion(
            id=mapping.documentVersionId or f"document-version-safety-cost-{usage.id}",
            documentId=document_id,
            projectId=usage.projectId,
            inspectionRoundId=usage.inspectionRoundId,
            ownerPartyId=usage.ownerPartyId,
            sectionKey="safety_cost_usage",
            createdAt=created_at,
        )
        self.documentVersions[document_version.id] = deepcopy(document_version)
        usage.syncedDocumentId = document_id
        usage.status = "synced_to_report"
        self.usages[usage.id] = deepcopy(usage)
        self.documentSections[document_id] = {
            "documentId": document_id,
            "documentVersionId": document_version.id,
            "sectionKey": "safety_cost_usage",
            "safetyCostUsageId": usage.id,
            "projectSummaryPhrase": mapping.projectSummaryPhrase,
            "implementationBudgetPhrase": mapping.implementationBudgetPhrase,
            "updatedAt": created_at,
        }

    def _build_project_summary_phrase(self, usage: SafetyCostUsage) -> str:
        basis = usage.basisMonth or usage.basisDate or "기준 미입력"
        return (
            f"산업안전보건관리비 계상금액 {usage.calculatedAmount:,.0f}원 중 "
            f"{usage.usedAmount:,.0f}원을 사용하여 사용률 {usage.usedRateCalculated:.1f}% ({basis} 기준)입니다."
        )

    def _build_budget_phrase(self, usage: SafetyCostUsage) -> str:
        return usage.appropriatenessComment or "산업안전보건관리비 사용 적정성 검토가 필요합니다."

    def list_project_usages(self, project_id: str) -> list[SafetyCostUsage]:
        return [deepcopy(item) for item in self.usages.values() if item.projectId == project_id and not item.archivedAt]

    def list_round_usages(self, inspection_round_id: str) -> list[SafetyCostUsage]:
        return [
            deepcopy(item)
            for item in self.usages.values()
            if item.inspectionRoundId == inspection_round_id and not item.archivedAt
        ]

    def get_usage(self, usage_id: str) -> SafetyCostUsage | None:
        item = self.usages.get(usage_id)
        return deepcopy(item) if item else None

    def find_active_usage(self, inspection_round_id: str, owner_party_id: str) -> SafetyCostUsage | None:
        for item in self.usages.values():
            if (
                item.inspectionRoundId == inspection_round_id
                and item.ownerPartyId == owner_party_id
                and not item.archivedAt
            ):
                return deepcopy(item)
        return None

    def save_usage(self, usage: SafetyCostUsage) -> SafetyCostUsage:
        self.usages[usage.id] = deepcopy(usage)
        return deepcopy(usage)

    def delete_usage(self, usage_id: str, archived_at: str) -> SafetyCostUsage | None:
        usage = self.usages.get(usage_id)
        if not usage:
            return None
        usage.archivedAt = archived_at
        usage.status = "archived"
        usage.updatedAt = archived_at
        self.usages[usage.id] = deepcopy(usage)
        return deepcopy(usage)

    def list_evidence(self, usage_id: str) -> list[SafetyCostEvidence]:
        return [deepcopy(item) for item in self.evidenceItems.values() if item.safetyCostUsageId == usage_id]

    def get_evidence(self, evidence_id: str) -> SafetyCostEvidence | None:
        item = self.evidenceItems.get(evidence_id)
        return deepcopy(item) if item else None

    def save_evidence(self, evidence: SafetyCostEvidence) -> SafetyCostEvidence:
        self.evidenceItems[evidence.id] = deepcopy(evidence)
        return deepcopy(evidence)

    def delete_evidence(self, evidence_id: str) -> None:
        self.evidenceItems.pop(evidence_id, None)

    def list_reviews(self, usage_id: str) -> list[SafetyCostReview]:
        return deepcopy(self.reviews.get(usage_id, []))

    def add_review(self, review: SafetyCostReview) -> SafetyCostReview:
        self.reviews.setdefault(review.safetyCostUsageId, []).append(deepcopy(review))
        return deepcopy(review)

    def list_history(self, usage_id: str) -> list[SafetyCostHistoryEvent]:
        return deepcopy(self.historyEvents.get(usage_id, []))

    def add_history(self, event: SafetyCostHistoryEvent) -> SafetyCostHistoryEvent:
        self.historyEvents.setdefault(event.safetyCostUsageId, []).append(deepcopy(event))
        return deepcopy(event)

    def list_audit_logs(self, usage_id: str) -> list[AuditLog]:
        return deepcopy(self.auditLogs.get(usage_id, []))

    def add_audit_log(self, log: AuditLog) -> AuditLog:
        self.auditLogs.setdefault(log.entityId, []).append(deepcopy(log))
        return deepcopy(log)

    def get_report_mapping(self, usage_id: str) -> SafetyCostReportMapping | None:
        item = self.reportMappings.get(usage_id)
        return deepcopy(item) if item else None

    def save_report_mapping(self, mapping: SafetyCostReportMapping) -> SafetyCostReportMapping:
        self.reportMappings[mapping.safetyCostUsageId] = deepcopy(mapping)
        return deepcopy(mapping)

    def get_document_section(self, document_id: str) -> dict | None:
        item = self.documentSections.get(document_id)
        return deepcopy(item) if item else None

    def save_document_section(self, document_id: str, payload: dict) -> dict:
        self.documentSections[document_id] = deepcopy(payload)
        return deepcopy(payload)

    def get_document_version(self, document_version_id: str) -> DocumentVersion | None:
        item = self.documentVersions.get(document_version_id)
        return deepcopy(item) if item else None

    def save_document_version(self, document_version: DocumentVersion) -> DocumentVersion:
        self.documentVersions[document_version.id] = deepcopy(document_version)
        return deepcopy(document_version)
