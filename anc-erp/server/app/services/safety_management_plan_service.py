from dataclasses import asdict
from uuid import uuid4

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
from server.app.repositories.checklist_repository import ChecklistRepository
from server.app.repositories.contract_repository import ContractRepository
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.project_repository import ProjectRepository
from server.app.repositories.safety_management_plan_repository import (
    PLAN_SECTION_ROWS,
    SafetyManagementPlanRepository,
)


class SafetyManagementPlanNotFoundError(Exception):
    pass


class SafetyManagementPlanValidationError(Exception):
    pass


class SafetyManagementPlanService:
    def __init__(
        self,
        repository: SafetyManagementPlanRepository,
        project_repository: ProjectRepository,
        contract_repository: ContractRepository,
        inspection_repository: InspectionRepository,
        checklist_repository: ChecklistRepository,
    ) -> None:
        self.repository = repository
        self.project_repository = project_repository
        self.contract_repository = contract_repository
        self.inspection_repository = inspection_repository
        self.checklist_repository = checklist_repository

    def list_project_plans(self, project_id: str) -> list[dict]:
        self._require_project(project_id)
        return [self._serialize_list_item(item) for item in self.repository.list_project_plans(project_id)]

    def create_plan(self, payload: dict) -> dict:
        project = self._require_project(payload["projectId"])
        template_id = payload.get("templateId")
        if not template_id:
            raise SafetyManagementPlanValidationError("templateId is required")
        contract_id = payload.get("contractId")
        inspection_round_id = payload.get("inspectionRoundId")
        if contract_id:
            contract = self.contract_repository.get_contract(contract_id)
            if not contract or contract.projectId != project.id:
                raise SafetyManagementPlanValidationError("contractId must belong to projectId")
        if inspection_round_id:
            round_item = self.inspection_repository.get_round(inspection_round_id)
            if not round_item or round_item.projectId != project.id:
                raise SafetyManagementPlanValidationError("inspectionRoundId must belong to projectId")
        duplicate = self.repository.find_active_plan(project.id, template_id, contract_id, inspection_round_id)
        if duplicate and not payload.get("revisionReason"):
            raise SafetyManagementPlanValidationError("duplicate active plan exists without revisionReason")
        plan_id = f"safety-management-plan-{uuid4().hex[:8]}"
        snapshot = self._build_snapshot(
            plan_id=plan_id,
            project_id=project.id,
            template_id=template_id,
            contract_id=contract_id,
            inspection_round_id=inspection_round_id,
            generation_mode=payload.get("generationMode", "from_project_snapshot"),
        )
        plan = SafetyManagementPlan(
            id=plan_id,
            projectId=project.id,
            title="안전관리계획서",
            status="draft",
            templateId=template_id,
            contractId=contract_id,
            inspectionRoundId=inspection_round_id,
            revisionNo=(duplicate.revisionNo + 1) if duplicate else 1,
            revisionReason=payload.get("revisionReason"),
            contentSnapshot=asdict(snapshot),
            latestVersionNo=1,
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_plan(plan)
        self.repository.save_snapshot(plan.id, snapshot)
        version = self.repository.add_version(
            SafetyManagementPlanVersion(
                id=f"safety-management-plan-version-{uuid4().hex[:8]}",
                planId=plan.id,
                versionNo=1,
                contentSnapshot=asdict(snapshot),
                createdBy="system",
                createdAt=self._now(),
                changeSummary="초안 생성",
            )
        )
        return self._mutation_payload(stored, snapshot, version)

    def get_plan(self, plan_id: str) -> dict:
        plan = self._require_plan(plan_id)
        snapshot = self._require_snapshot(plan_id)
        work_types = self.repository.list_work_types(plan_id)
        risks = self.repository.list_risk_items(plan_id)
        organization = self.repository.get_organization_plan(plan_id)
        education = self.repository.get_education_plan(plan_id)
        emergency = self.repository.get_emergency_plan(plan_id)
        attachments = self.repository.list_attachments(plan_id)
        exported_file = self.repository.get_file_asset(plan.exportedFileId) if plan.exportedFileId else None
        return {
            "plan": asdict(plan),
            "snapshot": asdict(snapshot),
            "sections": [asdict(item) for item in snapshot.sections],
            "versions": [asdict(item) for item in self.repository.list_versions(plan_id)],
            "workTypes": [asdict(item) for item in work_types],
            "riskItems": [asdict(item) for item in risks],
            "organization": asdict(organization) if organization else None,
            "education": asdict(education) if education else None,
            "emergency": asdict(emergency) if emergency else None,
            "attachments": [asdict(item) for item in attachments],
            "missingFields": [asdict(item) for item in snapshot.missingFields],
            "warnings": [asdict(item) for item in snapshot.reviewWarnings],
            "exportedFile": asdict(exported_file) if exported_file else None,
        }

    def update_plan(self, plan_id: str, payload: dict) -> dict:
        plan = self._require_plan(plan_id)
        for key, value in payload.items():
            if hasattr(plan, key) and value is not None:
                setattr(plan, key, value)
        plan.updatedAt = self._now()
        stored = self.repository.save_plan(plan)
        snapshot = self._require_snapshot(plan_id)
        return self._mutation_payload(stored, snapshot, None)

    def delete_plan(self, plan_id: str) -> dict:
        plan = self._require_plan(plan_id)
        plan.status = "archived"
        plan.archivedAt = self._now()
        plan.updatedAt = self._now()
        self.repository.save_plan(plan)
        self.repository.delete_plan(plan_id)
        return {"deleted": True, "planId": plan_id}

    def generate(self, plan_id: str) -> dict:
        plan = self._require_plan(plan_id)
        snapshot = self._build_snapshot(
            plan_id=plan.id,
            project_id=plan.projectId,
            template_id=plan.templateId,
            contract_id=plan.contractId,
            inspection_round_id=plan.inspectionRoundId,
            generation_mode="from_project_snapshot",
            preserve_existing=True,
        )
        plan.status = "ai_draft"
        plan.updatedAt = self._now()
        stored = self.repository.save_plan(plan)
        self.repository.save_snapshot(plan.id, snapshot)
        version = self._create_version(stored, snapshot, "linked data 재생성")
        return self._mutation_payload(stored, snapshot, version)

    def validate(self, plan_id: str) -> dict:
        plan = self._require_plan(plan_id)
        snapshot = self._build_snapshot(
            plan_id=plan.id,
            project_id=plan.projectId,
            template_id=plan.templateId,
            contract_id=plan.contractId,
            inspection_round_id=plan.inspectionRoundId,
            generation_mode="from_project_snapshot",
            preserve_existing=True,
        )
        self.repository.save_snapshot(plan.id, snapshot)
        return {
            "planId": plan_id,
            "missingFields": [asdict(item) for item in snapshot.missingFields],
            "warnings": [asdict(item) for item in snapshot.reviewWarnings],
            "hasDanger": any(item.severity == "required" for item in snapshot.missingFields)
            or any(item.severity == "danger" for item in snapshot.reviewWarnings),
        }

    def save_section(self, plan_id: str, payload: dict) -> dict:
        plan = self._require_plan(plan_id)
        current_snapshot = self._require_snapshot(plan_id)
        snapshot = self._build_snapshot(
            plan_id=plan.id,
            project_id=plan.projectId,
            template_id=plan.templateId,
            contract_id=plan.contractId,
            inspection_round_id=plan.inspectionRoundId,
            generation_mode="from_project_snapshot",
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
            raise SafetyManagementPlanValidationError("sectionKey not found")
        section.content = payload["content"]
        section.status = payload.get("status") or "edited"
        section.updatedAt = self._now()
        snapshot.missingFields, snapshot.reviewWarnings = self._build_validation(plan, snapshot)
        self.repository.save_snapshot(plan.id, snapshot)
        plan.contentSnapshot = asdict(snapshot)
        plan.status = "editing"
        plan.latestVersionNo += 1
        plan.updatedAt = self._now()
        stored = self.repository.save_plan(plan)
        version = self._create_version(stored, snapshot, payload.get("changeSummary") or f"{section.title} 저장")
        return self._mutation_payload(stored, snapshot, version)

    def regenerate_section(self, plan_id: str, section_key: str) -> dict:
        plan = self._require_plan(plan_id)
        current_snapshot = self._require_snapshot(plan_id)
        snapshot = self._build_snapshot(
            plan_id=plan.id,
            project_id=plan.projectId,
            template_id=plan.templateId,
            contract_id=plan.contractId,
            inspection_round_id=plan.inspectionRoundId,
            generation_mode="from_project_snapshot",
            preserve_existing=True,
        )
        for section in current_snapshot.sections:
            if section.key != section_key:
                next_section = next((item for item in snapshot.sections if item.key == section.key), None)
                if next_section:
                    next_section.content = section.content
                    next_section.status = section.status
                    next_section.updatedAt = section.updatedAt
        self.repository.save_snapshot(plan.id, snapshot)
        plan.contentSnapshot = asdict(snapshot)
        plan.latestVersionNo += 1
        plan.updatedAt = self._now()
        stored = self.repository.save_plan(plan)
        version = self._create_version(stored, snapshot, f"{section_key} section 재생성")
        return self._mutation_payload(stored, snapshot, version)

    def confirm(self, plan_id: str, confirmed_by: str) -> dict:
        plan = self._require_plan(plan_id)
        snapshot = self._require_snapshot(plan_id)
        if any(item.severity == "required" for item in snapshot.missingFields):
            raise SafetyManagementPlanValidationError("required fields must be resolved before confirm")
        plan.status = "confirmed"
        plan.updatedAt = self._now()
        stored = self.repository.save_plan(plan)
        version = self._create_version(stored, snapshot, f"계획서 확정 ({confirmed_by})")
        return self._mutation_payload(stored, snapshot, version)

    def export(self, plan_id: str, exported_by: str) -> dict:
        plan = self._require_plan(plan_id)
        snapshot = self._require_snapshot(plan_id)
        if any(item.severity == "required" for item in snapshot.missingFields):
            raise SafetyManagementPlanValidationError("required fields must be resolved before export")
        latest_version = self.repository.get_latest_version(plan_id)
        if not latest_version or latest_version.versionNo != plan.latestVersionNo:
            raise SafetyManagementPlanValidationError("export must use latest saved snapshot")
        project = self._require_project(plan.projectId)
        export_job = self.repository.save_export_job(
            SafetyManagementExportJob(
                id=f"safety-management-plan-export-{uuid4().hex[:8]}",
                planId=plan.id,
                projectId=plan.projectId,
                status="completed",
                createdAt=self._now(),
                completedAt=self._now(),
            )
        )
        file_asset = self.repository.save_file_asset(
            FileAsset(
                id=f"file-asset-safety-management-plan-{uuid4().hex[:8]}",
                projectId=plan.projectId,
                fileName=f"{plan.title}_{plan.id}.pdf",
                fileType="application/pdf",
                storagePath=f"/{project.projectName}/08_안전관리계획서/{plan.id}.pdf",
                linkedEntityType="safety_management_plan",
                linkedEntityId=plan.id,
                createdAt=self._now(),
            )
        )
        export_job.fileId = file_asset.id
        export_job.storagePath = file_asset.storagePath
        self.repository.save_export_job(export_job)
        plan.exportedFileId = file_asset.id
        plan.status = "exported"
        plan.updatedAt = self._now()
        stored = self.repository.save_plan(plan)
        version = self._create_version(stored, snapshot, f"최종본 export ({exported_by})")
        return {
            "plan": asdict(stored),
            "exportJob": asdict(export_job),
            "fileAsset": asdict(file_asset),
            "version": asdict(version),
        }

    def refresh_linked_data(self, plan_id: str) -> dict:
        plan = self._require_plan(plan_id)
        snapshot = self._build_snapshot(
            plan_id=plan.id,
            project_id=plan.projectId,
            template_id=plan.templateId,
            contract_id=plan.contractId,
            inspection_round_id=plan.inspectionRoundId,
            generation_mode="from_project_snapshot",
            preserve_existing=True,
            detect_stale_against=plan.updatedAt,
        )
        self.repository.save_snapshot(plan.id, snapshot)
        plan.contentSnapshot = asdict(snapshot)
        plan.updatedAt = self._now()
        stored = self.repository.save_plan(plan)
        return self._mutation_payload(stored, snapshot, None)

    def list_work_types(self, plan_id: str) -> list[dict]:
        self._require_plan(plan_id)
        return [asdict(item) for item in self.repository.list_work_types(plan_id)]

    def create_work_type(self, plan_id: str, payload: dict) -> dict:
        self._require_plan(plan_id)
        work_type = self.repository.save_work_type(
            SafetyManagementWorkType(
                id=f"smp-work-type-{uuid4().hex[:8]}",
                planId=plan_id,
                name=payload["name"],
                description=payload.get("description"),
                processOrder=payload.get("processOrder", len(self.repository.list_work_types(plan_id)) + 1),
                createdAt=self._now(),
                updatedAt=self._now(),
            )
        )
        return {"workType": asdict(work_type), "items": [asdict(item) for item in self.repository.list_work_types(plan_id)]}

    def update_work_type(self, work_type_id: str, payload: dict) -> dict:
        work_type = self.repository.get_work_type(work_type_id)
        if not work_type:
            raise SafetyManagementPlanNotFoundError("work type not found")
        for key, value in payload.items():
            if hasattr(work_type, key) and value is not None:
                setattr(work_type, key, value)
        work_type.updatedAt = self._now()
        stored = self.repository.save_work_type(work_type)
        return {"workType": asdict(stored), "items": [asdict(item) for item in self.repository.list_work_types(work_type.planId)]}

    def delete_work_type(self, work_type_id: str) -> dict:
        work_type = self.repository.get_work_type(work_type_id)
        if not work_type:
            raise SafetyManagementPlanNotFoundError("work type not found")
        self.repository.delete_work_type(work_type_id)
        return {"deleted": True, "workTypeId": work_type_id}

    def list_risk_items(self, plan_id: str) -> list[dict]:
        self._require_plan(plan_id)
        return [asdict(item) for item in self.repository.list_risk_items(plan_id)]

    def create_risk_item(self, plan_id: str, payload: dict) -> dict:
        self._validate_risk_payload(payload)
        risk_item = self.repository.save_risk_item(
            SafetyManagementRiskItem(
                id=f"smp-risk-item-{uuid4().hex[:8]}",
                planId=plan_id,
                workTypeId=payload.get("workTypeId"),
                workTypeName=payload.get("workTypeName"),
                hazard=payload["hazard"],
                riskCause=payload.get("riskCause"),
                reductionMeasure=payload["reductionMeasure"],
                riskLevel=payload.get("riskLevel", "medium"),
                sourceType=payload.get("sourceType"),
                sourceId=payload.get("sourceId"),
                createdAt=self._now(),
                updatedAt=self._now(),
            )
        )
        return {"riskItem": asdict(risk_item), "items": [asdict(item) for item in self.repository.list_risk_items(plan_id)]}

    def update_risk_item(self, risk_item_id: str, payload: dict) -> dict:
        risk_item = self.repository.get_risk_item(risk_item_id)
        if not risk_item:
            raise SafetyManagementPlanNotFoundError("risk item not found")
        merged = asdict(risk_item)
        merged.update({key: value for key, value in payload.items() if value is not None})
        self._validate_risk_payload(merged)
        for key, value in payload.items():
            if hasattr(risk_item, key) and value is not None:
                setattr(risk_item, key, value)
        risk_item.updatedAt = self._now()
        stored = self.repository.save_risk_item(risk_item)
        return {"riskItem": asdict(stored), "items": [asdict(item) for item in self.repository.list_risk_items(risk_item.planId)]}

    def delete_risk_item(self, risk_item_id: str) -> dict:
        risk_item = self.repository.get_risk_item(risk_item_id)
        if not risk_item:
            raise SafetyManagementPlanNotFoundError("risk item not found")
        self.repository.delete_risk_item(risk_item_id)
        return {"deleted": True, "riskItemId": risk_item_id}

    def generate_risks_from_work_types(self, plan_id: str) -> dict:
        work_types = self.repository.list_work_types(plan_id)
        created_items = []
        for work_type in work_types:
            already_exists = any(item.workTypeId == work_type.id for item in self.repository.list_risk_items(plan_id))
            if already_exists:
                continue
            created_items.append(
                self.repository.save_risk_item(
                    SafetyManagementRiskItem(
                        id=f"smp-risk-item-{uuid4().hex[:8]}",
                        planId=plan_id,
                        workTypeId=work_type.id,
                        workTypeName=work_type.name,
                        hazard=f"{work_type.name} 관련 위험요인 초안",
                        riskCause=work_type.description or "세부 작업공법 검토 필요",
                        reductionMeasure="감소대책 검토 및 확정 필요",
                        riskLevel="medium",
                        sourceType="template",
                        sourceId=work_type.id,
                        status="ai_draft",
                        createdAt=self._now(),
                        updatedAt=self._now(),
                    )
                )
            )
        return {
            "createdCount": len(created_items),
            "items": [asdict(item) for item in self.repository.list_risk_items(plan_id)],
        }

    def import_risks_from_checklist(self, plan_id: str) -> dict:
        plan = self._require_plan(plan_id)
        if not plan.inspectionRoundId:
            raise SafetyManagementPlanValidationError("inspectionRoundId is required to import checklist risks")
        created_items = []
        for session in self.checklist_repository.list_sessions_by_round(plan.inspectionRoundId):
            for result in self.checklist_repository.list_results(session.id):
                if result.result not in {"caution", "bad"}:
                    continue
                if any(item.sourceId == result.id for item in self.repository.list_risk_items(plan_id)):
                    continue
                checklist_item = self.checklist_repository.get_item(result.checklistItemId)
                created_items.append(
                    self.repository.save_risk_item(
                        SafetyManagementRiskItem(
                            id=f"smp-risk-item-{uuid4().hex[:8]}",
                            planId=plan_id,
                            workTypeId=None,
                            workTypeName=checklist_item.categoryKey if checklist_item else None,
                            hazard=(checklist_item.title if checklist_item else "체크리스트 위험요인"),
                            riskCause=result.comment,
                            reductionMeasure=result.reportComment or "감소대책 검토 및 확정 필요",
                            riskLevel="high" if result.result == "bad" else "medium",
                            sourceType="inspection_checklist",
                            sourceId=result.id,
                            status="draft",
                            createdAt=self._now(),
                            updatedAt=self._now(),
                        )
                    )
                )
            for hazard in self.checklist_repository.list_additional_hazards(session.id):
                if any(item.sourceId == hazard.id for item in self.repository.list_risk_items(plan_id)):
                    continue
                created_items.append(
                    self.repository.save_risk_item(
                        SafetyManagementRiskItem(
                            id=f"smp-risk-item-{uuid4().hex[:8]}",
                            planId=plan_id,
                            workTypeId=None,
                            workTypeName="additional_hazard",
                            hazard=hazard.hazardDescription,
                            riskCause=hazard.checkPoint,
                            reductionMeasure=hazard.contractorPlan or "감소대책 검토 및 확정 필요",
                            riskLevel="medium",
                            sourceType="additional_hazard",
                            sourceId=hazard.id,
                            status="draft",
                            createdAt=self._now(),
                            updatedAt=self._now(),
                        )
                    )
                )
        return {
            "createdCount": len(created_items),
            "items": [asdict(item) for item in self.repository.list_risk_items(plan_id)],
        }

    def get_organization(self, plan_id: str) -> dict:
        plan = self._require_plan(plan_id)
        payload = self.repository.get_organization_plan(plan_id) or SafetyOrganizationPlan(planId=plan.id, updatedAt=self._now())
        return asdict(payload)

    def update_organization(self, plan_id: str, payload: dict) -> dict:
        plan = self._require_plan(plan_id)
        stored = self.repository.save_organization_plan(
            SafetyOrganizationPlan(
                planId=plan.id,
                organizationChartFileId=payload.get("organizationChartFileId"),
                responsibilities=payload.get("responsibilities", []),
                updatedAt=self._now(),
            )
        )
        return asdict(stored)

    def get_education(self, plan_id: str) -> dict:
        plan = self._require_plan(plan_id)
        payload = self.repository.get_education_plan(plan_id) or SafetyEducationPlan(planId=plan.id, updatedAt=self._now())
        return asdict(payload)

    def update_education(self, plan_id: str, payload: dict) -> dict:
        plan = self._require_plan(plan_id)
        stored = self.repository.save_education_plan(
            SafetyEducationPlan(planId=plan.id, items=payload.get("items", []), updatedAt=self._now())
        )
        return asdict(stored)

    def get_emergency(self, plan_id: str) -> dict:
        plan = self._require_plan(plan_id)
        payload = self.repository.get_emergency_plan(plan_id) or SafetyEmergencyPlan(planId=plan.id, updatedAt=self._now())
        return asdict(payload)

    def update_emergency(self, plan_id: str, payload: dict) -> dict:
        plan = self._require_plan(plan_id)
        stored = self.repository.save_emergency_plan(
            SafetyEmergencyPlan(planId=plan.id, contacts=payload.get("contacts", []), updatedAt=self._now())
        )
        return asdict(stored)

    def list_attachments(self, plan_id: str) -> list[dict]:
        self._require_plan(plan_id)
        return [asdict(item) for item in self.repository.list_attachments(plan_id)]

    def link_attachment(self, plan_id: str, payload: dict) -> dict:
        self._require_plan(plan_id)
        attachment = self.repository.save_attachment(
            SafetyManagementPlanAttachment(
                id=f"smp-attachment-{uuid4().hex[:8]}",
                planId=plan_id,
                fileId=payload["fileId"],
                fileName=payload["fileName"],
                storagePath=payload["storagePath"],
                attachmentType=payload["attachmentType"],
                sourceLabel=payload.get("sourceLabel"),
                createdAt=self._now(),
                updatedAt=self._now(),
            )
        )
        return {"attachment": asdict(attachment), "items": [asdict(item) for item in self.repository.list_attachments(plan_id)]}

    def delete_attachment(self, attachment_id: str) -> dict:
        attachment = self.repository.get_attachment(attachment_id)
        if not attachment:
            raise SafetyManagementPlanNotFoundError("attachment not found")
        self.repository.delete_attachment(attachment_id)
        return {"deleted": True, "attachmentId": attachment_id}

    def _build_snapshot(
        self,
        plan_id: str,
        project_id: str,
        template_id: str,
        contract_id: str | None,
        inspection_round_id: str | None,
        generation_mode: str,
        preserve_existing: bool = False,
        detect_stale_against: str | None = None,
    ) -> SafetyManagementPlanSnapshot:
        project = self._require_project(project_id)
        contract = self.contract_repository.get_contract(contract_id) if contract_id else None
        round_item = self.inspection_repository.get_round(inspection_round_id) if inspection_round_id else None
        current_snapshot = self.repository.get_snapshot(plan_id) if preserve_existing else None
        work_types = self.repository.list_work_types(plan_id)
        risks = self.repository.list_risk_items(plan_id)
        attachments = self.repository.list_attachments(plan_id)
        organization = self.repository.get_organization_plan(plan_id)
        education = self.repository.get_education_plan(plan_id)
        emergency = self.repository.get_emergency_plan(plan_id)
        contractor_name = self._contractor_name(project_id)
        owner_name = self._owner_name(project_id)
        project_snapshot = SafetyManagementProjectSnapshot(
            projectId=project.id,
            projectName=project.projectName,
            siteName=project.siteName,
            siteAddress=project.siteAddress,
            constructionType=project.constructionType,
            contractorName=contractor_name,
            ownerName=owner_name,
            contractTitle=contract.contractTitle if contract else None,
            contractPeriodText=(
                f"{contract.contractStartDate} ~ {contract.contractEndDate}"
                if contract and contract.contractStartDate and contract.contractEndDate
                else None
            ),
            sourceUpdatedAt=project.updatedAt,
        )
        variables = {
            "projectName": project.projectName,
            "siteName": project.siteName,
            "siteAddress": project.siteAddress,
            "constructionType": project.constructionType,
            "contractorName": contractor_name,
            "ownerName": owner_name,
            "contractTitle": contract.contractTitle if contract else None,
            "inspectionRoundId": inspection_round_id,
            "inspectionRoundName": round_item.name if round_item else None,
            "workTypeCount": len(work_types),
            "riskItemCount": len(risks),
            "attachmentCount": len(attachments),
            "educationCount": len(education.items) if education else 0,
            "emergencyContactCount": len(emergency.contacts) if emergency else 0,
            "organizationRoleCount": len(organization.responsibilities) if organization else 0,
        }
        source_links = [
            SourceLink(
                id=f"smp-source-link-{plan_id}-project",
                sectionKey="project_overview",
                sourceEntityType="project",
                sourceEntityId=project.id,
                sourceLabel="프로젝트 원장",
                sourceUpdatedAt=project.updatedAt,
                linkedAt=self._now(),
            )
        ]
        if contract:
            source_links.append(
                SourceLink(
                    id=f"smp-source-link-{plan_id}-contract",
                    sectionKey="project_overview",
                    sourceEntityType="contract",
                    sourceEntityId=contract.id,
                    sourceLabel="계약 정보",
                    sourceUpdatedAt=contract.updatedAt,
                    linkedAt=self._now(),
                )
            )
        if round_item:
            source_links.append(
                SourceLink(
                    id=f"smp-source-link-{plan_id}-round",
                    sectionKey="inspection_plan",
                    sourceEntityType="inspection_round",
                    sourceEntityId=round_item.id,
                    sourceLabel="점검회차",
                    sourceUpdatedAt=round_item.updatedAt,
                    linkedAt=self._now(),
                )
            )
        if risks:
            source_links.append(
                SourceLink(
                    id=f"smp-source-link-{plan_id}-risk",
                    sectionKey="risk_register",
                    sourceEntityType="risk_register",
                    sourceEntityId=risks[0].id,
                    sourceLabel="위험요인 register",
                    sourceUpdatedAt=risks[0].updatedAt,
                    linkedAt=self._now(),
                )
            )
        sections: list[SafetyManagementPlanSection] = []
        for order, (key, title) in enumerate(PLAN_SECTION_ROWS, start=1):
            current_section = next((item for item in current_snapshot.sections if item.key == key), None) if current_snapshot else None
            content = dict(current_section.content) if current_section else {}
            content.update(
                {
                    "title": title,
                    "projectName": project.projectName,
                    "siteAddress": project.siteAddress,
                    "summary": self._section_summary(key, variables),
                }
            )
            sections.append(
                SafetyManagementPlanSection(
                    id=f"plan-section-{plan_id}-{key}",
                    key=key,
                    title=title,
                    status=current_section.status if current_section else ("ai_draft" if key in {"cover", "project_overview"} else "review"),
                    order=order,
                    content=content,
                    sourceEntityRefs=[item for item in source_links if item.sectionKey == key or (key == "cover" and item.sectionKey == "project_overview")],
                    updatedAt=current_section.updatedAt if current_section else self._now(),
                )
            )
        meta = SafetyManagementPlanMeta(
            planId=plan_id,
            projectId=project_id,
            templateId=template_id,
            contractId=contract_id,
            inspectionRoundId=inspection_round_id,
            generatedMode=generation_mode,
        )
        temp_plan = SafetyManagementPlan(
            id=plan_id,
            projectId=project_id,
            title="안전관리계획서",
            status="draft",
            templateId=template_id,
            contractId=contract_id,
            inspectionRoundId=inspection_round_id,
        )
        missing_fields, review_warnings = self._build_validation(temp_plan, SafetyManagementPlanSnapshot(
            meta=meta,
            projectSnapshot=project_snapshot,
            variables=variables,
            sections=sections,
            missingFields=[],
            reviewWarnings=[],
            sourceLinks=source_links,
        ))
        if detect_stale_against:
            review_warnings.extend(
                ReviewWarning(
                    type="stale_linked_data",
                    message=f"{link.sourceLabel} 원본이 계획서 저장 이후 변경되었습니다.",
                    severity="warning",
                    sectionKey=link.sectionKey,
                )
                for link in source_links
                if link.sourceUpdatedAt and link.sourceUpdatedAt >= detect_stale_against
            )
        return SafetyManagementPlanSnapshot(
            meta=meta,
            projectSnapshot=project_snapshot,
            variables=variables,
            sections=sections,
            missingFields=missing_fields,
            reviewWarnings=review_warnings,
            sourceLinks=source_links,
        )

    def _build_validation(
        self,
        plan: SafetyManagementPlan,
        snapshot: SafetyManagementPlanSnapshot,
    ) -> tuple[list[MissingField], list[ReviewWarning]]:
        missing_fields: list[MissingField] = []
        warnings: list[ReviewWarning] = [
            ReviewWarning(
                type="legal_text_review_required",
                message="법정 고정 문구는 등록된 template section 본문을 우선 사용해야 합니다.",
                severity="warning",
                sectionKey="cover",
            )
        ]
        required_rows = [
            ("projectName", "프로젝트명", "cover"),
            ("siteAddress", "현장주소", "project_overview"),
            ("constructionType", "공사유형", "project_overview"),
            ("contractorName", "시공사명", "project_overview"),
        ]
        for field, label, section_key in required_rows:
            if not snapshot.variables.get(field):
                missing_fields.append(
                    MissingField(
                        field=field,
                        message=f"{label}이(가) 누락되었습니다.",
                        severity="required",
                        label=label,
                        sectionKey=section_key,
                        reason="프로젝트 원장 또는 계약 연결을 확인하세요.",
                    )
                )
        if snapshot.variables.get("workTypeCount", 0) == 0:
            missing_fields.append(
                MissingField(
                    field="workTypes",
                    message="작업공종이 없습니다.",
                    severity="required",
                    label="작업공종",
                    sectionKey="work_types",
                    reason="최소 1개 공종을 등록해야 합니다.",
                )
            )
        if snapshot.variables.get("riskItemCount", 0) == 0:
            missing_fields.append(
                MissingField(
                    field="riskItems",
                    message="위험요인 register가 비어 있습니다.",
                    severity="required",
                    label="위험요인 register",
                    sectionKey="risk_register",
                    reason="공종 기반 생성 또는 체크리스트 import가 필요합니다.",
                )
            )
        if snapshot.variables.get("educationCount", 0) == 0:
            missing_fields.append(
                MissingField(
                    field="educationPlan",
                    message="안전교육 계획이 없습니다.",
                    severity="recommended",
                    label="안전교육 계획",
                    sectionKey="safety_education",
                )
            )
        if snapshot.variables.get("emergencyContactCount", 0) == 0:
            warnings.append(
                ReviewWarning(
                    type="missing_required_data",
                    message="비상연락망이 비어 있습니다.",
                    severity="warning",
                    sectionKey="emergency_response",
                )
            )
        if snapshot.variables.get("attachmentCount", 0) == 0:
            warnings.append(
                ReviewWarning(
                    type="missing_required_data",
                    message="첨부자료 연결이 없습니다.",
                    severity="warning",
                    sectionKey="attachments",
                )
            )
        return missing_fields, warnings

    def _section_summary(self, key: str, variables: dict) -> str:
        summaries = {
            "cover": f"{variables['projectName']} / 안전관리계획서 draft",
            "project_overview": f"{variables['siteAddress']} / {variables['constructionType']}",
            "work_types": f"작업공종 {variables['workTypeCount']}건",
            "risk_register": f"위험요인 {variables['riskItemCount']}건",
            "safety_organization": f"역할 {variables['organizationRoleCount']}건",
            "safety_education": f"교육계획 {variables['educationCount']}건",
            "emergency_response": f"비상연락 {variables['emergencyContactCount']}건",
            "attachments": f"첨부 {variables['attachmentCount']}건",
        }
        return summaries.get(key, "검토 필요")

    def _create_version(
        self,
        plan: SafetyManagementPlan,
        snapshot: SafetyManagementPlanSnapshot,
        change_summary: str,
    ) -> SafetyManagementPlanVersion:
        version = SafetyManagementPlanVersion(
            id=f"safety-management-plan-version-{uuid4().hex[:8]}",
            planId=plan.id,
            versionNo=plan.latestVersionNo,
            contentSnapshot=asdict(snapshot),
            createdBy="user-engineer-001",
            createdAt=self._now(),
            changeSummary=change_summary,
        )
        return self.repository.add_version(version)

    def _mutation_payload(
        self,
        plan: SafetyManagementPlan,
        snapshot: SafetyManagementPlanSnapshot,
        version: SafetyManagementPlanVersion | None,
    ) -> dict:
        return {
            "plan": asdict(plan),
            "snapshot": asdict(snapshot),
            "warnings": [asdict(item) for item in snapshot.reviewWarnings],
            "missingFields": [asdict(item) for item in snapshot.missingFields],
            "version": asdict(version) if version else None,
        }

    def _serialize_list_item(self, plan: SafetyManagementPlan) -> dict:
        snapshot = self.repository.get_snapshot(plan.id)
        missing_required_count = 0
        warning_count = 0
        if snapshot:
            missing_required_count = len([item for item in snapshot.missingFields if item.severity == "required"])
            warning_count = len(snapshot.reviewWarnings)
        round_name = None
        if plan.inspectionRoundId:
            round_item = self.inspection_repository.get_round(plan.inspectionRoundId)
            round_name = round_item.name if round_item else None
        return {
            "plan": asdict(plan),
            "inspectionRoundName": round_name,
            "missingRequiredCount": missing_required_count,
            "warningCount": warning_count,
            "latestVersion": asdict(self.repository.get_latest_version(plan.id)) if self.repository.get_latest_version(plan.id) else None,
        }

    def _validate_risk_payload(self, payload: dict) -> None:
        if not payload.get("hazard"):
            raise SafetyManagementPlanValidationError("hazard is required")
        if not payload.get("reductionMeasure"):
            raise SafetyManagementPlanValidationError("reductionMeasure is required")

    def _require_project(self, project_id: str):
        project = self.project_repository.get_project(project_id)
        if not project:
            raise SafetyManagementPlanNotFoundError("project not found")
        return project

    def _require_plan(self, plan_id: str) -> SafetyManagementPlan:
        plan = self.repository.get_plan(plan_id)
        if not plan:
            raise SafetyManagementPlanNotFoundError("plan not found")
        return plan

    def _require_snapshot(self, plan_id: str) -> SafetyManagementPlanSnapshot:
        snapshot = self.repository.get_snapshot(plan_id)
        if not snapshot:
            raise SafetyManagementPlanNotFoundError("plan snapshot not found")
        return snapshot

    def _owner_name(self, project_id: str) -> str | None:
        organizations = {item.id: item.name for item in self.project_repository.list_organizations()}
        owner = next((item for item in self.project_repository.list_project_parties(project_id) if item.role == "owner"), None)
        if not owner:
            return None
        return organizations.get(owner.organizationId)

    def _contractor_name(self, project_id: str) -> str | None:
        organizations = {item.id: item.name for item in self.project_repository.list_organizations()}
        contractor = next((item for item in self.project_repository.list_project_parties(project_id) if item.role == "contractor"), None)
        if not contractor:
            return None
        return organizations.get(contractor.organizationId)

    def _now(self) -> str:
        return "2026-05-10T09:00:00+09:00"
