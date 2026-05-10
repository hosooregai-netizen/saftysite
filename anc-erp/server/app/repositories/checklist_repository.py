from copy import deepcopy

from server.app.domain.models import (
    AuditLog,
    Finding,
    ChecklistCategory,
    ChecklistItem,
    ChecklistMobileDraft,
    ChecklistPhoto,
    ChecklistReportMapping,
    ChecklistResult,
    ChecklistSession,
    ChecklistTemplate,
    FindingCandidate,
    RiskReductionChecklistItem,
    AdditionalHazardItem,
)
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.project_repository import ProjectRepository


class ChecklistRepository:
    def __init__(
        self,
        project_repository: ProjectRepository,
        inspection_repository: InspectionRepository,
    ) -> None:
        self.project_repository = project_repository
        self.inspection_repository = inspection_repository
        self.templates: dict[str, ChecklistTemplate] = {}
        self.categories: dict[str, ChecklistCategory] = {}
        self.items: dict[str, ChecklistItem] = {}
        self.sessions: dict[str, ChecklistSession] = {}
        self.results: dict[str, ChecklistResult] = {}
        self.candidates: dict[str, FindingCandidate] = {}
        self.findings: dict[str, Finding] = {}
        self.riskReductionItems: dict[str, RiskReductionChecklistItem] = {}
        self.additionalHazards: dict[str, AdditionalHazardItem] = {}
        self.photos: dict[str, ChecklistPhoto] = {}
        self.mobileDrafts: dict[str, ChecklistMobileDraft] = {}
        self.reportMappings: dict[str, ChecklistReportMapping] = {}
        self.auditLogs: dict[str, list[AuditLog]] = {}
        self._seed()

    def _seed(self) -> None:
        created_at = "2026-05-10T09:00:00+09:00"
        template = ChecklistTemplate(
            id="checklist-template-sample-001",
            name="승강기 교체공사 표준 현장점검 체크리스트",
            description="공사안전보건대장 이행점검 결과보고서용 기본 점검표",
            projectType="elevator_replacement",
            documentType="safety_health_ledger_inspection_report",
            version="2026.1",
            status="published",
            publishedAt=created_at,
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.templates[template.id] = deepcopy(template)

        category_rows = [
            ("common", "공통", 1),
            ("architecture_civil", "건축·토목", 2),
            ("construction_machine", "건설기계", 3),
            ("risk_reduction", "위험성 감소대책", 4),
            ("additional_hazard", "추가 유해·위험요인", 5),
        ]
        for key, title, display_order in category_rows:
            category = ChecklistCategory(
                id=f"checklist-category-{key}",
                templateId=template.id,
                key=key,
                title=title,
                displayOrder=display_order,
            )
            self.categories[category.id] = deepcopy(category)

        item_rows = [
            (
                "common",
                "안전관리 계획 수립 및 이행 적정 여부",
                "안전관리 계획서와 현장 적용 상태를 확인합니다.",
                "안전관리 계획 수립 및 이행",
                "inspection_checklist",
            ),
            (
                "common",
                "근로자 안전교육 및 개인보호구 착용상태",
                "신규 및 정기 안전교육 이행과 보호구 지급상태를 확인합니다.",
                "근로자 안전교육 및 보호구",
                "inspection_checklist",
            ),
            (
                "architecture_civil",
                "전기 안전관리",
                "가설전선 피복, 콘센트, 케이블릴 상태를 확인합니다.",
                "전기 안전관리",
                "inspection_checklist",
            ),
            (
                "construction_machine",
                "건설기계 안전장치 상태",
                "건설기계 안전장치와 신호수 배치 상태를 확인합니다.",
                "건설기계 안전장치",
                "inspection_checklist",
            ),
        ]
        for index, (category_key, title, detail, report_label, section_key) in enumerate(item_rows, start=1):
            category = next(item for item in self.categories.values() if item.key == category_key)
            checklist_item = ChecklistItem(
                id=f"checklist-item-{index:03d}",
                templateId=template.id,
                categoryId=category.id,
                categoryKey=category.key,
                discipline=None,
                title=title,
                detail=detail,
                reportLabel=report_label,
                defaultApplicability=True,
                isRequired=True,
                findingRequiredWhen="caution_or_bad",
                sourceSectionKey=section_key,
                displayOrder=index,
            )
            self.items[checklist_item.id] = deepcopy(checklist_item)

        round_item = self.inspection_repository.get_round("round-sample-001")
        if not round_item:
            return
        session = ChecklistSession(
            id="checklist-session-sample-001",
            projectId=round_item.projectId,
            inspectionRoundId=round_item.id,
            ownerPartyId=None,
            templateId=template.id,
            templateVersion=template.version,
            inspectorUserId=round_item.inspectorUserId,
            inspectionDate=round_item.actualInspectionDate,
            status="in_progress",
            startedAt=created_at,
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.sessions[session.id] = deepcopy(session)
        for index, item in enumerate(self.list_template_items(template.id), start=1):
            result_value = "not_checked"
            comment = None
            if item.title == "전기 안전관리":
                result_value = "caution"
                comment = "가설전선 피복 보완과 케이블릴 정리 필요"
            result = ChecklistResult(
                id=f"checklist-result-{index:03d}",
                sessionId=session.id,
                projectId=session.projectId,
                inspectionRoundId=session.inspectionRoundId,
                checklistItemId=item.id,
                result=result_value,
                comment=comment,
                actionRequired=result_value in {"caution", "bad"},
                reportMappingStatus="not_mapped",
                createdAt=created_at,
                updatedAt=created_at,
            )
            self.results[result.id] = deepcopy(result)
        for risk_item in self._build_default_risk_reduction_items(session.id, created_at):
            self.riskReductionItems[risk_item.id] = deepcopy(risk_item)
        additional = AdditionalHazardItem(
            id="additional-hazard-sample-001",
            sessionId=session.id,
            no=1,
            hazardDescription="방우형 콘센트 덮개 파손 상태 확인 필요",
            contractorPlan=None,
            checkPoint="현장 콘센트 방우 상태 확인",
            implementationStatus="not_checked",
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.additionalHazards[additional.id] = deepcopy(additional)
        electric_result = next(
            item for item in self.results.values() if item.sessionId == session.id and item.result == "caution"
        )
        candidate = FindingCandidate(
            id="finding-candidate-sample-001",
            projectId=session.projectId,
            inspectionRoundId=session.inspectionRoundId,
            sessionId=session.id,
            checklistResultId=electric_result.id,
            title="전기 안전관리 보완 필요",
            detail=electric_result.comment or "전기 안전관리 미흡 사항 확인",
            riskType="electrical",
            requiredAction="가설전선 피복 보완 및 케이블릴 정리",
            status="candidate",
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.candidates[candidate.id] = deepcopy(candidate)
        electric_result.findingCandidateId = candidate.id
        self.results[electric_result.id] = deepcopy(electric_result)
        photo = ChecklistPhoto(
            id="checklist-photo-sample-001",
            projectId=session.projectId,
            inspectionRoundId=session.inspectionRoundId,
            sessionId=session.id,
            checklistResultId=electric_result.id,
            additionalHazardId=None,
            fileId="file-asset-checklist-photo-001",
            fileName="checklist_electrical_001.jpg",
            storagePath="/리움미술관 승강기 교체공사/01_점검회차/01_체크리스트/checklist_electrical_001.jpg",
            caption="가설전선 피복 보완 필요",
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.photos[photo.id] = deepcopy(photo)
        electric_result.photoIds.append(photo.id)
        self.results[electric_result.id] = deepcopy(electric_result)
        self.reportMappings["checklist-report-mapping-sample-001"] = ChecklistReportMapping(
            id="checklist-report-mapping-sample-001",
            sessionId=session.id,
            documentId=None,
            sourceSectionKey="inspection_checklist",
            reportLabel="전기 안전관리",
            rowSummary="주의 항목 1건, 보완 필요",
            stale=False,
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.auditLogs[session.id] = [
            AuditLog(
                id="checklist-audit-sample-001",
                entityType="checklist_session",
                entityId=session.id,
                action="checklist-session.created",
                summary="점검회차 체크리스트 세션이 생성되었습니다.",
                fieldNames=["projectId", "inspectionRoundId", "templateId"],
                createdAt=created_at,
            )
        ]

    def _build_default_risk_reduction_items(
        self,
        session_id: str,
        created_at: str,
    ) -> list[RiskReductionChecklistItem]:
        names = [
            "가설분전반",
            "가설전선",
            "가설전선(보조)",
            "사다리",
            "말비계",
            "화기취급",
            "이동식 크레인",
            "지게차",
            "고속절단기",
            "용접기",
            "체인블럭 및 레버블럭",
            "밀폐공간",
            "공기매개 감염병",
            "위험물질",
            "온열질환",
            "근골격계",
            "소음작업",
            "조도",
            "근로자 휴게시설",
            "응급처치",
        ]
        return [
            RiskReductionChecklistItem(
                id=f"risk-reduction-{session_id}-{index:02d}",
                sessionId=session_id,
                no=index,
                field=name,
                workType="승강기 교체 설치작업",
                contractorPlan=None,
                checkPoint=f"{name} 이행 확인",
                result="not_checked",
                implementationStatus="not_checked",
                createdAt=created_at,
                updatedAt=created_at,
            )
            for index, name in enumerate(names, start=1)
        ]

    def list_templates(self) -> list[ChecklistTemplate]:
        return [deepcopy(item) for item in self.templates.values()]

    def get_template(self, template_id: str) -> ChecklistTemplate | None:
        item = self.templates.get(template_id)
        return deepcopy(item) if item else None

    def save_template(self, template: ChecklistTemplate) -> ChecklistTemplate:
        self.templates[template.id] = deepcopy(template)
        return deepcopy(template)

    def delete_template(self, template_id: str) -> None:
        self.templates.pop(template_id, None)

    def list_categories(self, template_id: str) -> list[ChecklistCategory]:
        return sorted(
            [deepcopy(item) for item in self.categories.values() if item.templateId == template_id],
            key=lambda item: item.displayOrder,
        )

    def list_template_items(self, template_id: str) -> list[ChecklistItem]:
        return sorted(
            [deepcopy(item) for item in self.items.values() if item.templateId == template_id],
            key=lambda item: item.displayOrder,
        )

    def get_item(self, item_id: str) -> ChecklistItem | None:
        item = self.items.get(item_id)
        return deepcopy(item) if item else None

    def save_item(self, item: ChecklistItem) -> ChecklistItem:
        self.items[item.id] = deepcopy(item)
        return deepcopy(item)

    def delete_item(self, item_id: str) -> None:
        self.items.pop(item_id, None)

    def list_sessions_by_round(self, inspection_round_id: str) -> list[ChecklistSession]:
        return [
            deepcopy(item)
            for item in self.sessions.values()
            if item.inspectionRoundId == inspection_round_id
        ]

    def get_session(self, session_id: str) -> ChecklistSession | None:
        item = self.sessions.get(session_id)
        return deepcopy(item) if item else None

    def save_session(self, session: ChecklistSession) -> ChecklistSession:
        self.sessions[session.id] = deepcopy(session)
        return deepcopy(session)

    def list_results(self, session_id: str) -> list[ChecklistResult]:
        return [
            deepcopy(item)
            for item in self.results.values()
            if item.sessionId == session_id
        ]

    def get_result(self, result_id: str) -> ChecklistResult | None:
        item = self.results.get(result_id)
        return deepcopy(item) if item else None

    def save_result(self, result: ChecklistResult) -> ChecklistResult:
        self.results[result.id] = deepcopy(result)
        return deepcopy(result)

    def list_candidates(self, session_id: str) -> list[FindingCandidate]:
        return [
            deepcopy(item)
            for item in self.candidates.values()
            if item.sessionId == session_id
        ]

    def get_candidate(self, candidate_id: str) -> FindingCandidate | None:
        item = self.candidates.get(candidate_id)
        return deepcopy(item) if item else None

    def save_candidate(self, candidate: FindingCandidate) -> FindingCandidate:
        self.candidates[candidate.id] = deepcopy(candidate)
        return deepcopy(candidate)

    def get_finding(self, finding_id: str) -> Finding | None:
        item = self.findings.get(finding_id)
        return deepcopy(item) if item else None

    def save_finding(self, finding: Finding) -> Finding:
        self.findings[finding.id] = deepcopy(finding)
        return deepcopy(finding)

    def list_risk_reduction_items(self, session_id: str) -> list[RiskReductionChecklistItem]:
        return sorted(
            [
                deepcopy(item)
                for item in self.riskReductionItems.values()
                if item.sessionId == session_id
            ],
            key=lambda item: item.no,
        )

    def save_risk_reduction_item(self, item: RiskReductionChecklistItem) -> RiskReductionChecklistItem:
        self.riskReductionItems[item.id] = deepcopy(item)
        return deepcopy(item)

    def list_additional_hazards(self, session_id: str) -> list[AdditionalHazardItem]:
        return sorted(
            [
                deepcopy(item)
                for item in self.additionalHazards.values()
                if item.sessionId == session_id
            ],
            key=lambda item: item.no,
        )

    def get_additional_hazard(self, hazard_id: str) -> AdditionalHazardItem | None:
        item = self.additionalHazards.get(hazard_id)
        return deepcopy(item) if item else None

    def save_additional_hazard(self, item: AdditionalHazardItem) -> AdditionalHazardItem:
        self.additionalHazards[item.id] = deepcopy(item)
        return deepcopy(item)

    def list_photos_for_result(self, result_id: str) -> list[ChecklistPhoto]:
        return [
            deepcopy(item)
            for item in self.photos.values()
            if item.checklistResultId == result_id
        ]

    def get_photo(self, photo_id: str) -> ChecklistPhoto | None:
        item = self.photos.get(photo_id)
        return deepcopy(item) if item else None

    def save_photo(self, photo: ChecklistPhoto) -> ChecklistPhoto:
        self.photos[photo.id] = deepcopy(photo)
        return deepcopy(photo)

    def list_report_mappings(self, session_id: str) -> list[ChecklistReportMapping]:
        return [
            deepcopy(item)
            for item in self.reportMappings.values()
            if item.sessionId == session_id
        ]

    def save_report_mapping(self, mapping: ChecklistReportMapping) -> ChecklistReportMapping:
        self.reportMappings[mapping.id] = deepcopy(mapping)
        return deepcopy(mapping)

    def delete_report_mappings_for_session(self, session_id: str) -> None:
        mapping_ids = [mapping_id for mapping_id, item in self.reportMappings.items() if item.sessionId == session_id]
        for mapping_id in mapping_ids:
            self.reportMappings.pop(mapping_id, None)

    def get_mobile_draft(self, draft_id: str) -> ChecklistMobileDraft | None:
        item = self.mobileDrafts.get(draft_id)
        return deepcopy(item) if item else None

    def list_mobile_drafts(self, session_id: str) -> list[ChecklistMobileDraft]:
        return [
            deepcopy(item)
            for item in self.mobileDrafts.values()
            if item.sessionId == session_id
        ]

    def save_mobile_draft(self, draft: ChecklistMobileDraft) -> ChecklistMobileDraft:
        self.mobileDrafts[draft.id] = deepcopy(draft)
        return deepcopy(draft)

    def list_audit_logs(self, session_id: str) -> list[AuditLog]:
        return deepcopy(self.auditLogs.get(session_id, []))

    def add_audit_log(self, log: AuditLog) -> AuditLog:
        self.auditLogs.setdefault(log.entityId, []).append(deepcopy(log))
        return deepcopy(log)
