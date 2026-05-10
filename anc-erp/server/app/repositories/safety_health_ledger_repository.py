from copy import deepcopy
from dataclasses import asdict

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
from server.app.repositories.safety_management_plan_repository import SafetyManagementPlanRepository


LEDGER_SECTION_ROWS = [
    ("basic_info", "기본정보"),
    ("project_summary", "공사개요"),
    ("stakeholders", "발주자·시공자·전문가 정보"),
    ("hazard_risk_register", "주요 유해·위험요인"),
    ("risk_reduction_measures", "위험성 감소대책"),
    ("design_stage_review", "설계/계획 단계 검토사항"),
    ("construction_stage_review", "시공 단계 확인사항"),
    ("inspection_history", "점검 이력"),
    ("finding_history", "지적사항 이력"),
    ("corrective_action_history", "조치 완료 이력"),
    ("safety_cost_history", "산업안전보건관리비 확인 이력"),
    ("attachments", "첨부문서"),
    ("revision_history", "변경/개정 이력"),
]


class SafetyHealthLedgerRepository:
    def __init__(
        self,
        project_repository: ProjectRepository,
        safety_management_plan_repository: SafetyManagementPlanRepository,
        inspection_repository: InspectionRepository,
        checklist_repository: ChecklistRepository,
        finding_repository: FindingRepository,
        safety_cost_repository: SafetyCostRepository,
    ) -> None:
        self.project_repository = project_repository
        self.safety_management_plan_repository = safety_management_plan_repository
        self.inspection_repository = inspection_repository
        self.checklist_repository = checklist_repository
        self.finding_repository = finding_repository
        self.safety_cost_repository = safety_cost_repository
        self.ledgers: dict[str, SafetyHealthLedger] = {}
        self.snapshots: dict[str, SafetyHealthLedgerSnapshot] = {}
        self.versions: dict[str, list[SafetyHealthLedgerVersion]] = {}
        self.riskItems: dict[str, LedgerRiskItem] = {}
        self.measures: dict[str, LedgerRiskReductionMeasure] = {}
        self.inspectionHistories: dict[str, LedgerInspectionHistory] = {}
        self.findingHistories: dict[str, LedgerFindingHistory] = {}
        self.safetyCostHistories: dict[str, LedgerSafetyCostHistory] = {}
        self.attachments: dict[str, LedgerAttachment] = {}
        self.exportJobs: dict[str, SafetyHealthLedgerExportJob] = {}
        self.fileAssets: dict[str, FileAsset] = {}
        self._seed()

    def _seed(self) -> None:
        created_at = "2026-05-10T09:00:00+09:00"
        project = self.project_repository.get_project("project-sample-001")
        if not project:
            return
        source_plan = next(iter(self.safety_management_plan_repository.list_project_plans(project.id)), None)
        plan_risks = (
            self.safety_management_plan_repository.list_risk_items(source_plan.id)
            if source_plan
            else []
        )
        rounds = self.inspection_repository.list_rounds(project.id)
        findings = self.finding_repository.list_project_findings(project.id)
        usages = self.safety_cost_repository.list_project_usages(project.id)

        risk_items: list[LedgerRiskItem] = []
        measures: list[LedgerRiskReductionMeasure] = []
        for index, plan_risk in enumerate(plan_risks[:2], start=1):
            risk_item = LedgerRiskItem(
                id=f"ledger-risk-sample-{index:03d}",
                ledgerId="safety-health-ledger-sample-001",
                projectId=project.id,
                sourceType="safety_management_plan",
                sourceId=plan_risk.id,
                workType=plan_risk.workTypeName,
                hazardDescription=plan_risk.hazard,
                riskType=plan_risk.riskCause,
                riskLevel=plan_risk.riskLevel,
                reductionMeasureSummary=plan_risk.reductionMeasure,
                recurrenceCount=1,
                status="in_control" if index == 1 else "identified",
                firstDetectedAt=created_at,
                lastDetectedAt=created_at,
                createdAt=created_at,
                updatedAt=created_at,
            )
            risk_items.append(risk_item)
            self.riskItems[risk_item.id] = deepcopy(risk_item)
            measure = LedgerRiskReductionMeasure(
                id=f"ledger-measure-sample-{index:03d}",
                ledgerId="safety-health-ledger-sample-001",
                riskItemId=risk_item.id,
                title=f"{plan_risk.workTypeName or '공종'} 감소대책",
                description=plan_risk.reductionMeasure,
                status="in_progress" if index == 1 else "planned",
                sourceType="safety_management_plan",
                sourceId=plan_risk.id,
                createdAt=created_at,
                updatedAt=created_at,
            )
            measures.append(measure)
            self.measures[measure.id] = deepcopy(measure)

        inspection_history: list[LedgerInspectionHistory] = []
        for index, round_item in enumerate(rounds[:2], start=1):
            sessions = self.checklist_repository.list_sessions_by_round(round_item.id)
            session = sessions[0] if sessions else None
            results = self.checklist_repository.list_results(session.id) if session else []
            caution_count = sum(1 for item in results if item.result == "caution")
            bad_count = sum(1 for item in results if item.result == "bad")
            round_findings = self.finding_repository.list_round_findings(round_item.id)
            action_completed = 0
            for finding in round_findings:
                if any(action.status == "verified" for action in self.finding_repository.list_corrective_actions(finding.id)):
                    action_completed += 1
            history = LedgerInspectionHistory(
                id=f"ledger-inspection-history-sample-{index:03d}",
                ledgerId="safety-health-ledger-sample-001",
                projectId=project.id,
                inspectionRoundId=round_item.id,
                roundNo=round_item.roundNo,
                documentNo=round_item.documentNo,
                inspectionDate=round_item.actualInspectionDate or round_item.plannedDate,
                checklistSessionId=session.id if session else None,
                checklistSummary="회차별 점검 결과 누적",
                cautionCount=caution_count,
                badCount=bad_count,
                findingCount=len(round_findings),
                actionCompletedCount=action_completed,
                openFindingCount=max(len(round_findings) - action_completed, 0),
                linkedReportIds=[document.id for document in round_item.documentInstances],
                createdAt=created_at,
                updatedAt=created_at,
            )
            inspection_history.append(history)
            self.inspectionHistories[history.id] = deepcopy(history)

        finding_history: list[LedgerFindingHistory] = []
        for index, finding in enumerate(findings[:3], start=1):
            actions = self.finding_repository.list_corrective_actions(finding.id)
            verified_action = next((item for item in actions if item.status == "verified"), None)
            history = LedgerFindingHistory(
                id=f"ledger-finding-history-sample-{index:03d}",
                ledgerId="safety-health-ledger-sample-001",
                projectId=finding.projectId,
                inspectionRoundId=finding.inspectionRoundId,
                findingId=finding.id,
                correctiveActionId=verified_action.id if verified_action else (actions[0].id if actions else None),
                ownerPartyId=finding.ownerPartyId,
                title=finding.title,
                riskType=finding.riskType,
                responsibleOrganizationId=finding.responsiblePartyId,
                status=finding.status,
                requiredAction=finding.requiredAction,
                actionDetail=verified_action.actionDetail if verified_action else (actions[0].actionDetail if actions else None),
                verifiedBy=verified_action.verifiedBy if verified_action else None,
                verifiedAt=verified_action.verifiedAt if verified_action else None,
                recurrenceCount=1,
                reportInclude=finding.reportInclude,
                createdAt=created_at,
                updatedAt=created_at,
            )
            finding_history.append(history)
            self.findingHistories[history.id] = deepcopy(history)

        cost_history: list[LedgerSafetyCostHistory] = []
        for index, usage in enumerate(usages, start=1):
            history = LedgerSafetyCostHistory(
                id=f"ledger-safety-cost-history-sample-{index:03d}",
                ledgerId="safety-health-ledger-sample-001",
                projectId=usage.projectId,
                inspectionRoundId=usage.inspectionRoundId,
                ownerPartyId=usage.ownerPartyId,
                usageId=usage.id,
                basisMonth=usage.basisMonth,
                calculatedAmount=usage.calculatedAmount,
                usedAmount=usage.usedAmount,
                usedRateCalculated=usage.usedRateCalculated,
                appropriatenessStatus=usage.appropriatenessStatus,
                reportLinked=bool(usage.syncedDocumentId),
                createdAt=created_at,
                updatedAt=created_at,
            )
            cost_history.append(history)
            self.safetyCostHistories[history.id] = deepcopy(history)

        attachments: list[LedgerAttachment] = []
        if source_plan:
            for index, attachment in enumerate(self.safety_management_plan_repository.list_attachments(source_plan.id), start=1):
                ledger_attachment = LedgerAttachment(
                    id=f"ledger-attachment-sample-{index:03d}",
                    ledgerId="safety-health-ledger-sample-001",
                    projectId=project.id,
                    fileId=attachment.fileId,
                    fileName=attachment.fileName,
                    storagePath=attachment.storagePath,
                    attachmentType=attachment.attachmentType,
                    sourceEntityType="safety_management_plan",
                    sourceEntityId=source_plan.id,
                    sourceLabel=attachment.sourceLabel,
                    createdAt=created_at,
                    updatedAt=created_at,
                )
                attachments.append(ledger_attachment)
                self.attachments[ledger_attachment.id] = deepcopy(ledger_attachment)

        source_links = [
            SourceLink(
                id="ledger-source-link-project",
                sectionKey="project_summary",
                sourceEntityType="project",
                sourceEntityId=project.id,
                sourceLabel="프로젝트 원장",
                sourceUpdatedAt=project.updatedAt,
                linkedAt=created_at,
            )
        ]
        if source_plan:
            source_links.append(
                SourceLink(
                    id="ledger-source-link-plan",
                    sectionKey="hazard_risk_register",
                    sourceEntityType="safety_management_plan",
                    sourceEntityId=source_plan.id,
                    sourceLabel="안전관리계획서",
                    sourceUpdatedAt=source_plan.updatedAt,
                    linkedAt=created_at,
                )
            )

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
                latestUpdatedAt=created_at,
                sourcePlanId=source_plan.id if source_plan else None,
            ),
            sections=[
                SafetyHealthLedgerSection(
                    id=f"ledger-section-sample-{order:02d}",
                    ledgerId="safety-health-ledger-sample-001",
                    key=key,
                    title=title,
                    order=order,
                    status="review" if key in {"hazard_risk_register", "inspection_history", "finding_history"} else "ai_draft",
                    content={
                        "title": title,
                        "summary": "linked data draft. human review required.",
                    },
                    sourceLinks=[link for link in source_links if link.sectionKey == key],
                    updatedAt=created_at,
                )
                for order, (key, title) in enumerate(LEDGER_SECTION_ROWS, start=1)
            ],
            riskItems=risk_items,
            measures=measures,
            inspectionHistory=inspection_history,
            findingHistory=finding_history,
            safetyCostHistory=cost_history,
            attachments=attachments,
            missingFields=[],
            reviewWarnings=[
                ReviewWarning(
                    type="draft_review_required",
                    message="누적 대장 초안은 linked data 기준이며 최종 확정 전 수동 검토가 필요합니다.",
                    severity="warning",
                    sectionKey="revision_history",
                )
            ],
            sourceLinks=source_links,
        )
        ledger = SafetyHealthLedger(
            id="safety-health-ledger-sample-001",
            projectId=project.id,
            templateId="template-safety-health-ledger-v1",
            title="프로젝트 안전보건대장",
            status="review",
            currentVersionNo=1,
            latestSnapshot=asdict(snapshot),
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.ledgers[ledger.id] = deepcopy(ledger)
        self.snapshots[ledger.id] = deepcopy(snapshot)
        self.versions[ledger.id] = [
            SafetyHealthLedgerVersion(
                id="safety-health-ledger-version-sample-001",
                ledgerId=ledger.id,
                versionNo=1,
                snapshot=asdict(snapshot),
                createdBy="system",
                createdAt=created_at,
                changeSummary="초안 생성",
            )
        ]

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

    def list_project_ledgers(self, project_id: str) -> list[SafetyHealthLedger]:
        return [
            deepcopy(item)
            for item in self.ledgers.values()
            if item.projectId == project_id and item.status != "archived"
        ]

    def get_ledger(self, ledger_id: str) -> SafetyHealthLedger | None:
        item = self.ledgers.get(ledger_id)
        return deepcopy(item) if item else None

    def save_ledger(self, ledger: SafetyHealthLedger) -> SafetyHealthLedger:
        self.ledgers[ledger.id] = deepcopy(ledger)
        return deepcopy(ledger)

    def delete_ledger(self, ledger_id: str) -> None:
        self.ledgers.pop(ledger_id, None)
        self.snapshots.pop(ledger_id, None)
        self.versions.pop(ledger_id, None)

    def find_active_ledger(self, project_id: str, template_id: str, exclude_ledger_id: str | None = None) -> SafetyHealthLedger | None:
        for item in self.ledgers.values():
            if item.id == exclude_ledger_id or item.status == "archived":
                continue
            if item.projectId == project_id and item.templateId == template_id:
                return deepcopy(item)
        return None

    def save_snapshot(self, ledger_id: str, snapshot: SafetyHealthLedgerSnapshot) -> SafetyHealthLedgerSnapshot:
        self.snapshots[ledger_id] = deepcopy(snapshot)
        ledger = self.ledgers.get(ledger_id)
        if ledger:
            ledger.latestSnapshot = asdict(snapshot)
            self.ledgers[ledger_id] = deepcopy(ledger)
        return deepcopy(snapshot)

    def get_snapshot(self, ledger_id: str) -> SafetyHealthLedgerSnapshot | None:
        item = self.snapshots.get(ledger_id)
        return deepcopy(item) if item else None

    def list_versions(self, ledger_id: str) -> list[SafetyHealthLedgerVersion]:
        return deepcopy(self.versions.get(ledger_id, []))

    def add_version(self, version: SafetyHealthLedgerVersion) -> SafetyHealthLedgerVersion:
        self.versions.setdefault(version.ledgerId, []).append(deepcopy(version))
        return deepcopy(version)

    def get_latest_version(self, ledger_id: str) -> SafetyHealthLedgerVersion | None:
        items = self.versions.get(ledger_id, [])
        return deepcopy(items[-1]) if items else None

    def list_risk_items(self, ledger_id: str) -> list[LedgerRiskItem]:
        return [deepcopy(item) for item in self.riskItems.values() if item.ledgerId == ledger_id]

    def save_risk_item(self, risk_item: LedgerRiskItem) -> LedgerRiskItem:
        self.riskItems[risk_item.id] = deepcopy(risk_item)
        return deepcopy(risk_item)

    def get_risk_item(self, risk_item_id: str) -> LedgerRiskItem | None:
        item = self.riskItems.get(risk_item_id)
        return deepcopy(item) if item else None

    def delete_risk_item(self, risk_item_id: str) -> None:
        self.riskItems.pop(risk_item_id, None)

    def list_measures(self, ledger_id: str) -> list[LedgerRiskReductionMeasure]:
        return [deepcopy(item) for item in self.measures.values() if item.ledgerId == ledger_id]

    def save_measure(self, measure: LedgerRiskReductionMeasure) -> LedgerRiskReductionMeasure:
        self.measures[measure.id] = deepcopy(measure)
        return deepcopy(measure)

    def get_measure(self, measure_id: str) -> LedgerRiskReductionMeasure | None:
        item = self.measures.get(measure_id)
        return deepcopy(item) if item else None

    def delete_measure(self, measure_id: str) -> None:
        self.measures.pop(measure_id, None)

    def list_inspection_history(self, ledger_id: str) -> list[LedgerInspectionHistory]:
        return sorted(
            [deepcopy(item) for item in self.inspectionHistories.values() if item.ledgerId == ledger_id],
            key=lambda item: (item.roundNo or 0, item.createdAt),
        )

    def replace_inspection_history(self, ledger_id: str, items: list[LedgerInspectionHistory]) -> list[LedgerInspectionHistory]:
        for item_id in [item.id for item in self.list_inspection_history(ledger_id)]:
            self.inspectionHistories.pop(item_id, None)
        for item in items:
            self.inspectionHistories[item.id] = deepcopy(item)
        return self.list_inspection_history(ledger_id)

    def list_finding_history(self, ledger_id: str) -> list[LedgerFindingHistory]:
        return [deepcopy(item) for item in self.findingHistories.values() if item.ledgerId == ledger_id]

    def replace_finding_history(self, ledger_id: str, items: list[LedgerFindingHistory]) -> list[LedgerFindingHistory]:
        for item_id in [item.id for item in self.list_finding_history(ledger_id)]:
            self.findingHistories.pop(item_id, None)
        for item in items:
            self.findingHistories[item.id] = deepcopy(item)
        return self.list_finding_history(ledger_id)

    def list_safety_cost_history(self, ledger_id: str) -> list[LedgerSafetyCostHistory]:
        return [deepcopy(item) for item in self.safetyCostHistories.values() if item.ledgerId == ledger_id]

    def replace_safety_cost_history(self, ledger_id: str, items: list[LedgerSafetyCostHistory]) -> list[LedgerSafetyCostHistory]:
        for item_id in [item.id for item in self.list_safety_cost_history(ledger_id)]:
            self.safetyCostHistories.pop(item_id, None)
        for item in items:
            self.safetyCostHistories[item.id] = deepcopy(item)
        return self.list_safety_cost_history(ledger_id)

    def list_attachments(self, ledger_id: str) -> list[LedgerAttachment]:
        return [deepcopy(item) for item in self.attachments.values() if item.ledgerId == ledger_id]

    def save_attachment(self, attachment: LedgerAttachment) -> LedgerAttachment:
        self.attachments[attachment.id] = deepcopy(attachment)
        return deepcopy(attachment)

    def get_attachment(self, attachment_id: str) -> LedgerAttachment | None:
        item = self.attachments.get(attachment_id)
        return deepcopy(item) if item else None

    def delete_attachment(self, attachment_id: str) -> None:
        self.attachments.pop(attachment_id, None)

    def save_export_job(self, export_job: SafetyHealthLedgerExportJob) -> SafetyHealthLedgerExportJob:
        self.exportJobs[export_job.id] = deepcopy(export_job)
        return deepcopy(export_job)

    def save_file_asset(self, file_asset: FileAsset) -> FileAsset:
        self.fileAssets[file_asset.id] = deepcopy(file_asset)
        return deepcopy(file_asset)

    def get_file_asset(self, file_id: str) -> FileAsset | None:
        item = self.fileAssets.get(file_id)
        return deepcopy(item) if item else None
