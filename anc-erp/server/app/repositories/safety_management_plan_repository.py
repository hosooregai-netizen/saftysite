from copy import deepcopy
from dataclasses import asdict

from server.app.domain.models import (
    FileAsset,
    MissingField,
    ReviewWarning,
    SafetyEducationPlan,
    SafetyEmergencyPlan,
    SafetyManagementExportJob,
    SafetyManagementPlan,
    SafetyManagementPlanAttachment,
    SafetyManagementPlanMeta,
    SafetyManagementPlanSection,
    SafetyManagementPlanSnapshot,
    SafetyManagementPlanVersion,
    SafetyManagementProjectSnapshot,
    SafetyManagementRiskItem,
    SafetyManagementWorkType,
    SafetyOrganizationPlan,
    SourceLink,
)
from server.app.repositories.project_repository import ProjectRepository


PLAN_SECTION_ROWS = [
    ("cover", "표지"),
    ("project_overview", "공사 개요"),
    ("work_types", "작업공종 및 작업공법"),
    ("risk_register", "유해·위험요인 및 감소대책"),
    ("safety_organization", "안전관리조직"),
    ("safety_education", "안전교육 계획"),
    ("emergency_response", "비상대응 계획"),
    ("inspection_plan", "점검 계획"),
    ("attachments", "첨부자료"),
]


class SafetyManagementPlanRepository:
    def __init__(self, project_repository: ProjectRepository) -> None:
        self.project_repository = project_repository
        self.plans: dict[str, SafetyManagementPlan] = {}
        self.snapshots: dict[str, SafetyManagementPlanSnapshot] = {}
        self.versions: dict[str, list[SafetyManagementPlanVersion]] = {}
        self.workTypes: dict[str, SafetyManagementWorkType] = {}
        self.riskItems: dict[str, SafetyManagementRiskItem] = {}
        self.organizationPlans: dict[str, SafetyOrganizationPlan] = {}
        self.educationPlans: dict[str, SafetyEducationPlan] = {}
        self.emergencyPlans: dict[str, SafetyEmergencyPlan] = {}
        self.attachments: dict[str, SafetyManagementPlanAttachment] = {}
        self.exportJobs: dict[str, SafetyManagementExportJob] = {}
        self.fileAssets: dict[str, FileAsset] = {}
        self._seed()

    def _seed(self) -> None:
        created_at = "2026-05-10T09:00:00+09:00"
        project = self.project_repository.get_project("project-sample-001")
        if not project:
            return
        owner_name = self._owner_name(project.id)
        contractor_name = self._contractor_name(project.id)
        snapshot = SafetyManagementPlanSnapshot(
            meta=SafetyManagementPlanMeta(
                planId="safety-management-plan-sample-001",
                projectId=project.id,
                templateId="template-safety-management-plan-v1",
                contractId="contract-sample-001",
                inspectionRoundId="round-sample-001",
                generatedMode="from_project_snapshot",
            ),
            projectSnapshot=SafetyManagementProjectSnapshot(
                projectId=project.id,
                projectName=project.projectName,
                siteName=project.siteName,
                siteAddress=project.siteAddress,
                constructionType=project.constructionType,
                contractorName=contractor_name,
                ownerName=owner_name,
                contractTitle="기본 계약 연결",
                contractPeriodText="2026-05-01 ~ 2026-12-31",
                sourceUpdatedAt=project.updatedAt,
            ),
            variables={
                "projectName": project.projectName,
                "siteName": project.siteName,
                "siteAddress": project.siteAddress,
                "constructionType": project.constructionType,
                "contractorName": contractor_name,
                "ownerName": owner_name,
                "workTypeCount": 2,
                "riskItemCount": 2,
                "attachmentCount": 1,
            },
            sections=[
                SafetyManagementPlanSection(
                    id=f"plan-section-sample-{index:02d}",
                    key=key,
                    title=title,
                    status="ai_draft" if key in {"cover", "project_overview"} else "review",
                    order=index,
                    content={
                        "title": title,
                        "projectName": project.projectName,
                        "siteAddress": project.siteAddress,
                        "summary": "linked data draft. human review required.",
                    },
                    sourceEntityRefs=[
                        SourceLink(
                            id=f"plan-source-link-{key}",
                            sectionKey=key,
                            sourceEntityType="project",
                            sourceEntityId=project.id,
                            sourceLabel="프로젝트 원장",
                            sourceUpdatedAt=project.updatedAt,
                            linkedAt=created_at,
                        )
                    ],
                    updatedAt=created_at,
                )
                for index, (key, title) in enumerate(PLAN_SECTION_ROWS, start=1)
            ],
            missingFields=[
                MissingField(
                    field="educationPlan",
                    message="안전교육 계획이 아직 비어 있습니다.",
                    severity="recommended",
                    label="안전교육 계획",
                    sectionKey="safety_education",
                )
            ],
            reviewWarnings=[
                ReviewWarning(
                    type="legal_text_review_required",
                    message="법정 고정 문구는 등록된 템플릿 문구를 우선 검토해야 합니다.",
                    severity="warning",
                    sectionKey="cover",
                )
            ],
            sourceLinks=[
                SourceLink(
                    id="plan-source-link-project",
                    sectionKey="project_overview",
                    sourceEntityType="project",
                    sourceEntityId=project.id,
                    sourceLabel="프로젝트 원장",
                    sourceUpdatedAt=project.updatedAt,
                    linkedAt=created_at,
                )
            ],
        )
        plan = SafetyManagementPlan(
            id="safety-management-plan-sample-001",
            projectId=project.id,
            title="안전관리계획서",
            status="draft",
            templateId="template-safety-management-plan-v1",
            contractId="contract-sample-001",
            inspectionRoundId="round-sample-001",
            revisionNo=1,
            contentSnapshot=asdict(snapshot),
            latestVersionNo=1,
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.plans[plan.id] = deepcopy(plan)
        self.snapshots[plan.id] = deepcopy(snapshot)
        self.versions[plan.id] = [
            SafetyManagementPlanVersion(
                id="safety-management-plan-version-sample-001",
                planId=plan.id,
                versionNo=1,
                contentSnapshot=asdict(snapshot),
                createdBy="system",
                createdAt=created_at,
                changeSummary="초안 생성",
            )
        ]
        self.workTypes["smp-work-type-001"] = SafetyManagementWorkType(
            id="smp-work-type-001",
            planId=plan.id,
            name="기존 승강기 해체",
            description="기존 설비 해체 전 작업구간 분리와 추락방지 확인",
            processOrder=1,
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.workTypes["smp-work-type-002"] = SafetyManagementWorkType(
            id="smp-work-type-002",
            planId=plan.id,
            name="신규 장비 반입 및 설치",
            description="반입 동선, 양중, 설치 작업 순서 검토",
            processOrder=2,
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.riskItems["smp-risk-item-001"] = SafetyManagementRiskItem(
            id="smp-risk-item-001",
            planId=plan.id,
            workTypeId="smp-work-type-001",
            workTypeName="기존 승강기 해체",
            hazard="해체 작업 중 추락 또는 협착 위험",
            riskCause="작업구간 격리와 추락방지 조치가 미흡할 수 있음",
            reductionMeasure="개구부 방호와 작업구간 통제 계획을 사전 점검한다.",
            riskLevel="high",
            sourceType="template",
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.riskItems["smp-risk-item-002"] = SafetyManagementRiskItem(
            id="smp-risk-item-002",
            planId=plan.id,
            workTypeId="smp-work-type-002",
            workTypeName="신규 장비 반입 및 설치",
            hazard="장비 반입 중 전도 또는 충돌 위험",
            riskCause="양중 계획과 통제구역 설정이 미완료일 수 있음",
            reductionMeasure="양중계획서와 유도자 배치, 반입 동선 통제 계획을 명시한다.",
            riskLevel="high",
            sourceType="template",
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.organizationPlans[plan.id] = SafetyOrganizationPlan(
            planId=plan.id,
            responsibilities=[
                {
                    "role": "총괄 책임",
                    "organizationId": None,
                    "name": None,
                    "responsibility": "프로젝트 안전관리 총괄 계획 검토",
                }
            ],
            updatedAt=created_at,
        )
        self.educationPlans[plan.id] = SafetyEducationPlan(
            planId=plan.id,
            items=[
                {
                    "educationType": "정기교육",
                    "target": "현장 작업자",
                    "cycle": "월 1회",
                    "content": "작업공종별 위험요인 공유",
                    "recordMethod": "교육일지",
                }
            ],
            updatedAt=created_at,
        )
        self.emergencyPlans[plan.id] = SafetyEmergencyPlan(
            planId=plan.id,
            contacts=[
                {
                    "type": "현장 비상연락",
                    "name": None,
                    "phone": None,
                    "organization": contractor_name,
                    "note": "실제 담당자 입력 필요",
                }
            ],
            updatedAt=created_at,
        )
        attachment = SafetyManagementPlanAttachment(
            id="smp-attachment-001",
            planId=plan.id,
            fileId="file-asset-smp-001",
            fileName="기본_공정표.pdf",
            storagePath=f"/{project.projectName}/08_안전관리계획서/기본_공정표.pdf",
            attachmentType="schedule",
            sourceLabel="기본 공정표",
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.attachments[attachment.id] = deepcopy(attachment)

    def _owner_name(self, project_id: str) -> str | None:
        organizations = {item.id: item.name for item in self.project_repository.list_organizations()}
        owner = next(
            (item for item in self.project_repository.list_project_parties(project_id) if item.role == "owner"),
            None,
        )
        if not owner:
            return None
        return organizations.get(owner.organizationId)

    def _contractor_name(self, project_id: str) -> str | None:
        organizations = {item.id: item.name for item in self.project_repository.list_organizations()}
        contractor = next(
            (item for item in self.project_repository.list_project_parties(project_id) if item.role == "contractor"),
            None,
        )
        if not contractor:
            return None
        return organizations.get(contractor.organizationId)

    def list_project_plans(self, project_id: str) -> list[SafetyManagementPlan]:
        return [deepcopy(item) for item in self.plans.values() if item.projectId == project_id and item.status != "archived"]

    def get_plan(self, plan_id: str) -> SafetyManagementPlan | None:
        item = self.plans.get(plan_id)
        return deepcopy(item) if item else None

    def save_plan(self, plan: SafetyManagementPlan) -> SafetyManagementPlan:
        self.plans[plan.id] = deepcopy(plan)
        return deepcopy(plan)

    def delete_plan(self, plan_id: str) -> None:
        self.plans.pop(plan_id, None)
        self.snapshots.pop(plan_id, None)
        self.versions.pop(plan_id, None)

    def find_active_plan(
        self,
        project_id: str,
        template_id: str,
        contract_id: str | None,
        inspection_round_id: str | None,
        exclude_plan_id: str | None = None,
    ) -> SafetyManagementPlan | None:
        for item in self.plans.values():
            if item.id == exclude_plan_id or item.status == "archived":
                continue
            if (
                item.projectId == project_id
                and item.templateId == template_id
                and item.contractId == contract_id
                and item.inspectionRoundId == inspection_round_id
            ):
                return deepcopy(item)
        return None

    def save_snapshot(self, plan_id: str, snapshot: SafetyManagementPlanSnapshot) -> SafetyManagementPlanSnapshot:
        self.snapshots[plan_id] = deepcopy(snapshot)
        plan = self.plans.get(plan_id)
        if plan:
            plan.contentSnapshot = asdict(snapshot)
            self.plans[plan_id] = deepcopy(plan)
        return deepcopy(snapshot)

    def get_snapshot(self, plan_id: str) -> SafetyManagementPlanSnapshot | None:
        item = self.snapshots.get(plan_id)
        return deepcopy(item) if item else None

    def list_versions(self, plan_id: str) -> list[SafetyManagementPlanVersion]:
        return deepcopy(self.versions.get(plan_id, []))

    def add_version(self, version: SafetyManagementPlanVersion) -> SafetyManagementPlanVersion:
        self.versions.setdefault(version.planId, []).append(deepcopy(version))
        return deepcopy(version)

    def get_latest_version(self, plan_id: str) -> SafetyManagementPlanVersion | None:
        rows = self.versions.get(plan_id, [])
        return deepcopy(rows[-1]) if rows else None

    def list_work_types(self, plan_id: str) -> list[SafetyManagementWorkType]:
        return sorted(
            [deepcopy(item) for item in self.workTypes.values() if item.planId == plan_id],
            key=lambda item: (item.processOrder, item.createdAt),
        )

    def save_work_type(self, work_type: SafetyManagementWorkType) -> SafetyManagementWorkType:
        self.workTypes[work_type.id] = deepcopy(work_type)
        return deepcopy(work_type)

    def get_work_type(self, work_type_id: str) -> SafetyManagementWorkType | None:
        item = self.workTypes.get(work_type_id)
        return deepcopy(item) if item else None

    def delete_work_type(self, work_type_id: str) -> None:
        self.workTypes.pop(work_type_id, None)

    def list_risk_items(self, plan_id: str) -> list[SafetyManagementRiskItem]:
        return [deepcopy(item) for item in self.riskItems.values() if item.planId == plan_id]

    def save_risk_item(self, risk_item: SafetyManagementRiskItem) -> SafetyManagementRiskItem:
        self.riskItems[risk_item.id] = deepcopy(risk_item)
        return deepcopy(risk_item)

    def get_risk_item(self, risk_item_id: str) -> SafetyManagementRiskItem | None:
        item = self.riskItems.get(risk_item_id)
        return deepcopy(item) if item else None

    def delete_risk_item(self, risk_item_id: str) -> None:
        self.riskItems.pop(risk_item_id, None)

    def get_organization_plan(self, plan_id: str) -> SafetyOrganizationPlan | None:
        item = self.organizationPlans.get(plan_id)
        return deepcopy(item) if item else None

    def save_organization_plan(self, payload: SafetyOrganizationPlan) -> SafetyOrganizationPlan:
        self.organizationPlans[payload.planId] = deepcopy(payload)
        return deepcopy(payload)

    def get_education_plan(self, plan_id: str) -> SafetyEducationPlan | None:
        item = self.educationPlans.get(plan_id)
        return deepcopy(item) if item else None

    def save_education_plan(self, payload: SafetyEducationPlan) -> SafetyEducationPlan:
        self.educationPlans[payload.planId] = deepcopy(payload)
        return deepcopy(payload)

    def get_emergency_plan(self, plan_id: str) -> SafetyEmergencyPlan | None:
        item = self.emergencyPlans.get(plan_id)
        return deepcopy(item) if item else None

    def save_emergency_plan(self, payload: SafetyEmergencyPlan) -> SafetyEmergencyPlan:
        self.emergencyPlans[payload.planId] = deepcopy(payload)
        return deepcopy(payload)

    def list_attachments(self, plan_id: str) -> list[SafetyManagementPlanAttachment]:
        return [deepcopy(item) for item in self.attachments.values() if item.planId == plan_id]

    def save_attachment(self, attachment: SafetyManagementPlanAttachment) -> SafetyManagementPlanAttachment:
        self.attachments[attachment.id] = deepcopy(attachment)
        return deepcopy(attachment)

    def get_attachment(self, attachment_id: str) -> SafetyManagementPlanAttachment | None:
        item = self.attachments.get(attachment_id)
        return deepcopy(item) if item else None

    def delete_attachment(self, attachment_id: str) -> None:
        self.attachments.pop(attachment_id, None)

    def save_export_job(self, export_job: SafetyManagementExportJob) -> SafetyManagementExportJob:
        self.exportJobs[export_job.id] = deepcopy(export_job)
        return deepcopy(export_job)

    def save_file_asset(self, file_asset: FileAsset) -> FileAsset:
        self.fileAssets[file_asset.id] = deepcopy(file_asset)
        return deepcopy(file_asset)

    def get_file_asset(self, file_id: str) -> FileAsset | None:
        item = self.fileAssets.get(file_id)
        return deepcopy(item) if item else None
