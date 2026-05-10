from dataclasses import asdict
import re
from uuid import uuid4

from server.app.domain.models import (
    Contact,
    ExtractedContact,
    ExtractedOrganization,
    ExtractedProject,
    ExtractedProjectParty,
    MissingField,
    Organization,
    Project,
    ProjectActivityLog,
    ProjectAggregate,
    ProjectExtractionResult,
    ProjectParty,
    ProjectRelatedCounts,
    ProjectRequirementStatus,
)
from server.app.repositories.project_repository import ProjectRepository


class ProjectNotFoundError(Exception):
    pass


class ProjectValidationError(Exception):
    pass


class ProjectService:
    def __init__(self, repository: ProjectRepository) -> None:
        self.repository = repository

    def list_projects(self) -> list[dict]:
        items: list[dict] = []
        for aggregate in self.repository.list_project_aggregates():
            owners = self._organization_names_by_role(aggregate, "owner")
            contractors = self._organization_names_by_role(aggregate, "contractor")
            items.append(
                {
                    "project": asdict(aggregate.project),
                    "ownerNames": owners,
                    "contractorNames": contractors,
                    "relatedCounts": asdict(aggregate.relatedCounts or ProjectRelatedCounts(projectId=aggregate.id)),
                    "nextInspectionDate": self._next_inspection_date(aggregate),
                    "lastActivity": aggregate.activityLogs[-1].summary if aggregate.activityLogs else None,
                }
            )
        return items

    def create_project(self, payload: dict) -> dict:
        self._validate_project_payload(payload)
        project = Project(
            id=f"project-{uuid4().hex[:8]}",
            projectCode=payload.get("projectCode"),
            projectName=payload["projectName"].strip(),
            siteName=payload.get("siteName", "").strip(),
            siteAddress=payload.get("siteAddress", "").strip(),
            constructionType=payload.get("constructionType", "").strip(),
            constructionDescription=payload.get("constructionDescription"),
            totalAmount=payload.get("totalAmount"),
            startDate=payload.get("startDate"),
            endDate=payload.get("endDate"),
            actualStartDate=payload.get("actualStartDate"),
            progressRate=payload.get("progressRate"),
            inspectionCycleText=payload.get("inspectionCycleText"),
            totalInspectionRounds=payload.get("totalInspectionRounds"),
            status=payload.get("status", "planning"),
            memo=payload.get("memo"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        self.repository.create_project(project)
        create_log = self.repository.add_activity_log(
            ProjectActivityLog(
                id=f"log-{uuid4().hex[:8]}",
                projectId=project.id,
                action="project.created",
                summary="프로젝트 원장이 생성되었고 기본 웹하드 폴더 생성 요청이 예약되었습니다.",
                fieldNames=["projectName", "siteName", "siteAddress"],
                createdAt=self._now(),
            )
        )
        aggregate = self._require_aggregate(project.id)
        return {
            "project": asdict(project),
            "warnings": self._share_warnings(aggregate),
            "activityLog": asdict(create_log),
            "pendingEvents": ["project.defaultWebhardFolder.requested"],
        }

    def get_project(self, project_id: str) -> dict:
        return self._serialize_aggregate(self._require_aggregate(project_id))

    def update_project(self, project_id: str, payload: dict) -> dict:
        aggregate = self._require_aggregate(project_id)
        current = aggregate.project
        merged = {
            **asdict(current),
            **payload,
        }
        self._validate_project_payload(merged)
        changed_fields = [key for key, value in payload.items() if getattr(current, key) != value]

        current.projectCode = merged.get("projectCode")
        current.projectName = merged["projectName"].strip()
        current.siteName = merged.get("siteName", "").strip()
        current.siteAddress = merged.get("siteAddress", "").strip()
        current.constructionType = merged.get("constructionType", "").strip()
        current.constructionDescription = merged.get("constructionDescription")
        current.totalAmount = merged.get("totalAmount")
        current.startDate = merged.get("startDate")
        current.endDate = merged.get("endDate")
        current.actualStartDate = merged.get("actualStartDate")
        current.progressRate = merged.get("progressRate")
        current.inspectionCycleText = merged.get("inspectionCycleText")
        current.totalInspectionRounds = merged.get("totalInspectionRounds")
        current.status = merged.get("status", current.status)
        current.memo = merged.get("memo")
        current.updatedAt = self._now()
        updated = self.repository.update_project(project_id, current)
        log = self.repository.add_activity_log(
            ProjectActivityLog(
                id=f"log-{uuid4().hex[:8]}",
                projectId=project_id,
                action="project.updated",
                summary="프로젝트 원장 기본정보가 수정되었습니다.",
                fieldNames=changed_fields,
                createdAt=self._now(),
            )
        )
        return {
            "project": asdict(updated),
            "warnings": self._share_warnings(self._require_aggregate(project_id)),
            "activityLog": asdict(log),
        }

    def delete_project(self, project_id: str) -> dict:
        aggregate = self._require_aggregate(project_id)
        if not aggregate.relatedCounts or aggregate.relatedCounts.documents == 0:
            self.repository.delete_project(project_id)
            return {
                "deleted": True,
                "deletedBecause": "no-related-documents",
            }
        archived = self.repository.archive_project(project_id, self._now())
        log = self.repository.add_activity_log(
            ProjectActivityLog(
                id=f"log-{uuid4().hex[:8]}",
                projectId=project_id,
                action="project.archived",
                summary="관련 문서 보존을 위해 프로젝트가 보관 상태로 전환되었습니다.",
                fieldNames=["status", "archivedAt"],
                createdAt=self._now(),
            )
        )
        return {
            "project": asdict(archived),
            "archivedBecause": "related-documents-exist" if (aggregate.relatedCounts and aggregate.relatedCounts.documents > 0) else "manual-archive",
            "activityLog": asdict(log),
        }

    def get_project_summary(self, project_id: str) -> dict:
        aggregate = self._require_aggregate(project_id)
        owners = [party for party in aggregate.projectParties if party.role == "owner"]
        return {
            "projectId": aggregate.id,
            "projectName": aggregate.project.projectName,
            "siteAddress": aggregate.project.siteAddress,
            "status": aggregate.project.status,
            "progressRate": aggregate.project.progressRate,
            "totalAmount": aggregate.project.totalAmount,
            "inspectionCycleText": aggregate.project.inspectionCycleText,
            "totalInspectionRounds": aggregate.project.totalInspectionRounds,
            "ownerCount": len(owners),
            "reportTargetOwnerCount": len([party for party in owners if party.requiresSeparateReport]),
            "nextInspectionDate": self._next_inspection_date(aggregate),
            "relatedCounts": asdict(aggregate.relatedCounts or ProjectRelatedCounts(projectId=aggregate.id)),
        }

    def get_project_requirements(self, project_id: str) -> dict:
        aggregate = self._require_aggregate(project_id)
        project = aggregate.project
        owners = [party for party in aggregate.projectParties if party.role == "owner"]
        report_contacts = [
            contact
            for contact in aggregate.contacts
            if contact.receivesReport
        ]

        safety_missing: list[MissingField] = []
        if not project.siteAddress:
            safety_missing.append(MissingField("siteAddress", "현장주소가 없습니다.", "required"))
        if project.progressRate is None:
            safety_missing.append(MissingField("progressRate", "공정율이 없습니다.", "required"))
        if not project.endDate:
            safety_missing.append(MissingField("endDate", "공사 종료일이 없습니다.", "required"))
        if not owners:
            safety_missing.append(MissingField("ownerParties", "최소 1개 이상의 발주처가 필요합니다.", "required"))
        if owners and not any(party.requiresSeparateReport for party in owners):
            safety_missing.append(
                MissingField(
                    "requiresSeparateReport",
                    "발주처별 보고서 제출 여부가 설정되지 않았습니다.",
                    "required",
                )
            )
        if any(contact.receivesReport and not contact.email for contact in aggregate.contacts):
            safety_missing.append(
                MissingField(
                    "reportRecipientEmail",
                    "보고서 수신 담당자의 이메일이 누락되어 있습니다.",
                    "required",
                )
            )

        contract_missing: list[MissingField] = []
        if not project.projectName:
            contract_missing.append(MissingField("projectName", "프로젝트명이 없습니다.", "required"))
        if not project.constructionType:
            contract_missing.append(MissingField("constructionType", "공사종류가 없습니다.", "required"))
        if project.totalAmount is None:
            contract_missing.append(MissingField("totalAmount", "총 공사금액이 없습니다.", "recommended"))

        inspection_missing: list[MissingField] = []
        if not project.inspectionCycleText:
            inspection_missing.append(MissingField("inspectionCycleText", "점검주기가 없습니다.", "required"))
        if project.totalInspectionRounds is None:
            inspection_missing.append(MissingField("totalInspectionRounds", "총 점검회차가 없습니다.", "required"))

        mail_missing: list[MissingField] = []
        if not report_contacts:
            mail_missing.append(MissingField("receivesReport", "보고서 수신 담당자가 없습니다.", "required"))
        if any(contact.receivesReport and not contact.email for contact in aggregate.contacts):
            mail_missing.append(MissingField("email", "메일 제출용 이메일이 누락되어 있습니다.", "required"))

        requirements = ProjectRequirementStatus(
            projectId=project_id,
            forSafetyReport=safety_missing,
            forContract=contract_missing,
            forInspectionRound=inspection_missing,
            forMailSubmission=mail_missing,
            warnings=self._share_warnings(aggregate),
        )
        return asdict(requirements)

    def get_related_counts(self, project_id: str) -> dict:
        self._require_aggregate(project_id)
        counts = self.repository.get_related_counts(project_id)
        return asdict(counts)

    def get_project_history(self, project_id: str) -> list[dict]:
        self._require_aggregate(project_id)
        return [asdict(item) for item in self.repository.list_activity_logs(project_id)]

    def list_organizations(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_organizations()]

    def create_organization(self, payload: dict) -> dict:
        existing = next(
            (
                item
                for item in self.repository.list_organizations()
                if item.name == payload["name"] and item.type == payload["type"]
            ),
            None,
        )
        if existing:
            return {
                "organization": asdict(existing),
                "warnings": ["organization_duplicate"],
            }

        organization = Organization(
            id=f"org-{uuid4().hex[:8]}",
            name=payload["name"],
            type=payload["type"],
            businessNumber=payload.get("businessNumber"),
            representativeName=payload.get("representativeName"),
            address=payload.get("address"),
            phone=payload.get("phone"),
            email=payload.get("email"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        created = self.repository.create_organization(organization)
        return {"organization": asdict(created), "warnings": []}

    def get_organization(self, organization_id: str) -> dict:
        organization = self.repository.get_organization(organization_id)
        if not organization:
            raise ProjectNotFoundError("organization not found")
        return asdict(organization)

    def update_organization(self, organization_id: str, payload: dict) -> dict:
        organization = self.repository.get_organization(organization_id)
        if not organization:
            raise ProjectNotFoundError("organization not found")
        for key, value in payload.items():
            setattr(organization, key, value)
        organization.updatedAt = self._now()
        updated = self.repository.update_organization(organization_id, organization)
        return {"organization": asdict(updated), "warnings": []}

    def delete_organization(self, organization_id: str) -> dict:
        self.repository.delete_organization(organization_id)
        return {"deleted": True}

    def list_project_parties(self, project_id: str) -> list[dict]:
        aggregate = self._require_aggregate(project_id)
        org_map = {item.id: item for item in aggregate.organizations}
        return [
            {
                **asdict(party),
                "organization": asdict(org_map[party.organizationId]) if party.organizationId in org_map else None,
            }
            for party in sorted(aggregate.projectParties, key=lambda item: item.displayOrder)
        ]

    def create_project_party(self, project_id: str, payload: dict) -> dict:
        self._require_aggregate(project_id)
        party = ProjectParty(
            id=f"party-{uuid4().hex[:8]}",
            projectId=project_id,
            organizationId=payload["organizationId"],
            role=payload["role"],
            shareRatio=payload.get("shareRatio"),
            shareAmount=payload.get("shareAmount"),
            requiresSeparateReport=payload.get("requiresSeparateReport", False),
            reportRecipient=payload.get("reportRecipient", False),
            invoiceRecipient=payload.get("invoiceRecipient", False),
            displayOrder=payload.get("displayOrder", len(self.repository.list_project_parties(project_id)) + 1),
            note=payload.get("note"),
            ownerPartyId=payload.get("ownerPartyId") or (f"owner-{uuid4().hex[:8]}" if payload["role"] == "owner" else None),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        created = self.repository.create_project_party(party)
        log = self.repository.add_activity_log(
            ProjectActivityLog(
                id=f"log-{uuid4().hex[:8]}",
                projectId=project_id,
                action="project-party.created",
                summary="프로젝트 관계자가 추가되었습니다.",
                fieldNames=["role", "organizationId"],
                createdAt=self._now(),
            )
        )
        return {
            "projectParty": asdict(created),
            "warnings": self._share_warnings(self._require_aggregate(project_id)),
            "activityLog": asdict(log),
        }

    def update_project_party(self, party_id: str, payload: dict) -> dict:
        party = self.repository.get_project_party(party_id)
        if not party:
            raise ProjectNotFoundError("project party not found")
        for key, value in payload.items():
            setattr(party, key, value)
        party.updatedAt = self._now()
        updated = self.repository.update_project_party(party_id, party)
        return {
            "projectParty": asdict(updated),
            "warnings": self._share_warnings(self._require_aggregate(party.projectId)),
        }

    def delete_project_party(self, party_id: str) -> dict:
        party = self.repository.get_project_party(party_id)
        if not party:
            raise ProjectNotFoundError("project party not found")
        self.repository.delete_project_party(party_id)
        return {"deleted": True}

    def reorder_project_parties(self, project_id: str, party_ids: list[str]) -> list[dict]:
        for index, party_id in enumerate(party_ids, start=1):
            party = self.repository.get_project_party(party_id)
            if not party or party.projectId != project_id:
                raise ProjectNotFoundError("project party not found")
            party.displayOrder = index
            party.updatedAt = self._now()
            self.repository.update_project_party(party_id, party)
        return self.list_project_parties(project_id)

    def calculate_project_party_share(self, project_id: str, parties: list[dict], total_amount: int | None) -> dict:
        self._require_aggregate(project_id)
        ratio_sum = round(sum(item.get("shareRatio") or 0 for item in parties), 2)
        amount_sum = int(sum(item.get("shareAmount") or 0 for item in parties))
        warnings: list[str] = []
        if ratio_sum > 100:
            warnings.append("shareRatioSumOver100")
        if total_amount is not None and amount_sum != total_amount:
            warnings.append("shareAmountMismatchAgainstTotalAmount")
        return {
            "projectId": project_id,
            "shareRatioSum": ratio_sum,
            "shareAmountSum": amount_sum,
            "warnings": warnings,
        }

    def list_contacts(self, project_id: str) -> list[dict]:
        aggregate = self._require_aggregate(project_id)
        org_map = {item.id: item for item in aggregate.organizations}
        return [
            {
                **asdict(contact),
                "organization": asdict(org_map[contact.organizationId]) if contact.organizationId in org_map else None,
            }
            for contact in aggregate.contacts
        ]

    def create_contact(self, project_id: str, payload: dict) -> dict:
        self._require_aggregate(project_id)
        contact = Contact(
            id=f"contact-{uuid4().hex[:8]}",
            projectId=project_id,
            organizationId=payload["organizationId"],
            name=payload["name"],
            position=payload.get("position"),
            phone=payload.get("phone"),
            email=payload.get("email"),
            roleDescription=payload.get("roleDescription"),
            isPrimary=payload.get("isPrimary", False),
            receivesReport=payload.get("receivesReport", False),
            receivesActionRequest=payload.get("receivesActionRequest", False),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        if contact.isPrimary:
            self._clear_primary_contact(project_id)
        created = self.repository.create_contact(contact)
        log = self.repository.add_activity_log(
            ProjectActivityLog(
                id=f"log-{uuid4().hex[:8]}",
                projectId=project_id,
                action="contact.created",
                summary="프로젝트 담당자가 추가되었습니다.",
                fieldNames=["organizationId", "name", "email"],
                createdAt=self._now(),
            )
        )
        warnings = []
        if created.receivesReport and not created.email:
            warnings.append("reportRecipientRequiresEmail")
        return {
            "contact": asdict(created),
            "warnings": warnings,
            "activityLog": asdict(log),
        }

    def update_contact(self, contact_id: str, payload: dict) -> dict:
        contact = self.repository.get_contact(contact_id)
        if not contact:
            raise ProjectNotFoundError("contact not found")
        if payload.get("isPrimary"):
            self._clear_primary_contact(contact.projectId)
        for key, value in payload.items():
            setattr(contact, key, value)
        contact.updatedAt = self._now()
        updated = self.repository.update_contact(contact_id, contact)
        warnings = []
        if updated.receivesReport and not updated.email:
            warnings.append("reportRecipientRequiresEmail")
        return {"contact": asdict(updated), "warnings": warnings}

    def delete_contact(self, contact_id: str) -> dict:
        contact = self.repository.get_contact(contact_id)
        if not contact:
            raise ProjectNotFoundError("contact not found")
        self.repository.delete_contact(contact_id)
        return {"deleted": True}

    def set_primary_contact(self, project_id: str, contact_id: str) -> list[dict]:
        self._clear_primary_contact(project_id)
        contact = self.repository.get_contact(contact_id)
        if not contact or contact.projectId != project_id:
            raise ProjectNotFoundError("contact not found")
        contact.isPrimary = True
        contact.updatedAt = self._now()
        self.repository.update_contact(contact_id, contact)
        return self.list_contacts(project_id)

    def extract_from_document(self, source_text: str) -> dict:
        owners = self._split_names(self._extract_line(source_text, ["발주처", "owners"]))
        contractor = self._extract_line(source_text, ["시공사", "contractor"])
        engineer = self._extract_line(source_text, ["엔지니어링사", "engineer", "A&C 담당"])
        project_name = self._extract_line(source_text, ["사업명", "projectName"])
        site_name = self._extract_line(source_text, ["현장명", "siteName"])
        site_address = self._extract_line(source_text, ["현장주소", "siteAddress"])
        construction_type = self._extract_line(source_text, ["공사종류", "constructionType"])
        inspection_cycle_text = self._extract_line(source_text, ["점검주기", "inspectionCycleText"])
        total_inspection_rounds = self._extract_int(self._extract_line(source_text, ["총 점검회차", "totalInspectionRounds"]))
        total_amount = self._extract_int(self._extract_line(source_text, ["공사금액", "totalAmount"]))
        progress_rate = self._extract_float(self._extract_line(source_text, ["공정율", "progressRate"]))
        date_range = self._extract_date_range(source_text)
        actual_start_date = self._extract_line(source_text, ["실착공일", "actualStartDate"])

        organizations: list[ExtractedOrganization] = [
            ExtractedOrganization(name=name, type="owner") for name in owners
        ]
        if contractor:
            organizations.append(ExtractedOrganization(name=contractor, type="contractor"))
        if engineer:
            organizations.append(ExtractedOrganization(name=engineer, type="engineer"))

        parties: list[ExtractedProjectParty] = [
            ExtractedProjectParty(
                organizationName=name,
                role="owner",
                requiresSeparateReport=None,
                reportRecipient=None,
            )
            for name in owners
        ]
        if contractor:
            parties.append(
                ExtractedProjectParty(
                    organizationName=contractor,
                    role="contractor",
                    invoiceRecipient=None,
                )
            )
        if engineer:
            parties.append(ExtractedProjectParty(organizationName=engineer, role="engineer"))

        contacts = self._extract_contacts(source_text)
        warnings: list[str] = []
        if not owners:
            warnings.append("ownerMissing")
        if not project_name:
            warnings.append("projectNameMissing")

        result = ProjectExtractionResult(
            project=ExtractedProject(
                projectName=project_name,
                siteName=site_name,
                siteAddress=site_address,
                constructionType=construction_type,
                totalAmount=total_amount,
                startDate=date_range[0],
                endDate=date_range[1],
                actualStartDate=actual_start_date,
                progressRate=progress_rate,
                inspectionCycleText=inspection_cycle_text,
                totalInspectionRounds=total_inspection_rounds,
                status="planning",
            ),
            organizations=organizations,
            projectParties=parties,
            contacts=contacts,
            warnings=warnings,
            isDraft=True,
        )
        return asdict(result)

    def validate_extracted_info(self, project_id: str, payload: dict) -> dict:
        self._require_aggregate(project_id)
        warnings = list(dict.fromkeys(payload.get("warnings", [])))

        def add_warning(code: str) -> None:
            if code not in warnings:
                warnings.append(code)

        project_preview = payload.get("project", {})
        if not project_preview.get("projectName"):
            add_warning("projectNameMissing")
        if not payload.get("projectParties"):
            add_warning("projectPartyMissing")
        if not payload.get("contacts"):
            add_warning("contactMissing")
        for party in payload.get("projectParties", []):
            if party.get("role") == "owner" and party.get("requiresSeparateReport") is None:
                add_warning("ownerSeparateReportSettingUnknown")
            if party.get("role") == "owner" and party.get("reportRecipient") is None:
                add_warning("ownerReportRecipientSettingUnknown")
        return {
            "projectId": project_id,
            "warnings": warnings,
            "isDraft": True,
        }

    def apply_extracted_info(self, project_id: str, payload: dict) -> dict:
        aggregate = self._require_aggregate(project_id)
        project_preview = payload.get("project", {})
        if project_preview.get("projectName"):
            aggregate.project.projectName = project_preview["projectName"]
        if project_preview.get("siteName"):
            aggregate.project.siteName = project_preview["siteName"]
        if project_preview.get("siteAddress"):
            aggregate.project.siteAddress = project_preview["siteAddress"]
        if project_preview.get("constructionType"):
            aggregate.project.constructionType = project_preview["constructionType"]
        if project_preview.get("totalAmount") is not None:
            aggregate.project.totalAmount = project_preview["totalAmount"]
        aggregate.project.updatedAt = self._now()
        self.repository.update_project(project_id, aggregate.project)

        org_name_to_id: dict[str, str] = {
            organization.name: organization.id for organization in aggregate.organizations
        }
        for org_payload in payload.get("organizations", []):
            if org_payload["name"] in org_name_to_id:
                continue
            created_org = self.repository.create_organization(
                Organization(
                    id=f"org-{uuid4().hex[:8]}",
                    name=org_payload["name"],
                    type=org_payload["type"],
                    representativeName=org_payload.get("representativeName"),
                    phone=org_payload.get("phone"),
                    email=org_payload.get("email"),
                    createdAt=self._now(),
                    updatedAt=self._now(),
                )
            )
            org_name_to_id[created_org.name] = created_org.id

        for party_payload in payload.get("projectParties", []):
            organization_id = org_name_to_id.get(party_payload["organizationName"])
            if not organization_id:
                continue
            duplicate = next(
                (
                    party
                    for party in self.repository.list_project_parties(project_id)
                    if party.organizationId == organization_id and party.role == party_payload["role"]
                ),
                None,
            )
            if duplicate:
                continue
            self.repository.create_project_party(
                ProjectParty(
                    id=f"party-{uuid4().hex[:8]}",
                    projectId=project_id,
                    organizationId=organization_id,
                    role=party_payload["role"],
                    shareRatio=party_payload.get("shareRatio"),
                    shareAmount=party_payload.get("shareAmount"),
                    requiresSeparateReport=bool(party_payload.get("requiresSeparateReport")),
                    reportRecipient=bool(party_payload.get("reportRecipient")),
                    invoiceRecipient=bool(party_payload.get("invoiceRecipient")),
                    displayOrder=len(self.repository.list_project_parties(project_id)) + 1,
                    ownerPartyId=f"owner-{uuid4().hex[:8]}" if party_payload["role"] == "owner" else None,
                    createdAt=self._now(),
                    updatedAt=self._now(),
                )
            )

        for contact_payload in payload.get("contacts", []):
            organization_id = org_name_to_id.get(contact_payload["organizationName"])
            if not organization_id:
                continue
            duplicate_contact = next(
                (
                    contact
                    for contact in self.repository.list_contacts(project_id)
                    if contact.organizationId == organization_id and contact.name == contact_payload["name"]
                ),
                None,
            )
            if duplicate_contact:
                continue
            self.repository.create_contact(
                Contact(
                    id=f"contact-{uuid4().hex[:8]}",
                    projectId=project_id,
                    organizationId=organization_id,
                    name=contact_payload["name"],
                    position=contact_payload.get("position"),
                    phone=contact_payload.get("phone"),
                    email=contact_payload.get("email"),
                    roleDescription=contact_payload.get("roleDescription"),
                    receivesReport=contact_payload.get("receivesReport", False),
                    receivesActionRequest=contact_payload.get("receivesActionRequest", False),
                    createdAt=self._now(),
                    updatedAt=self._now(),
                )
            )

        self.repository.add_activity_log(
            ProjectActivityLog(
                id=f"log-{uuid4().hex[:8]}",
                projectId=project_id,
                action="project.extracted-info-applied",
                summary="문서 추출 preview가 사용자 승인 후 프로젝트 원장에 반영되었습니다.",
                fieldNames=["projectName", "organizations", "projectParties", "contacts"],
                createdAt=self._now(),
            )
        )
        return self.get_project(project_id)

    def _require_aggregate(self, project_id: str) -> ProjectAggregate:
        aggregate = self.repository.get_project_aggregate(project_id)
        if not aggregate:
            raise ProjectNotFoundError("project not found")
        return aggregate

    def _serialize_aggregate(self, aggregate: ProjectAggregate) -> dict:
        return {
            "project": asdict(aggregate.project),
            "organizations": [asdict(item) for item in aggregate.organizations],
            "projectParties": [asdict(item) for item in aggregate.projectParties],
            "contacts": [asdict(item) for item in aggregate.contacts],
            "inspectionRounds": [asdict(item) for item in aggregate.inspectionRounds],
            "relatedCounts": asdict(aggregate.relatedCounts or ProjectRelatedCounts(projectId=aggregate.id)),
            "activityLogs": [asdict(item) for item in aggregate.activityLogs],
        }

    def _validate_project_payload(self, payload: dict) -> None:
        if not payload.get("projectName") or not str(payload["projectName"]).strip():
            raise ProjectValidationError("projectName is required")
        progress_rate = payload.get("progressRate")
        if progress_rate is not None and not (0 <= progress_rate <= 100):
            raise ProjectValidationError("progressRate must be between 0 and 100")
        inspection_rounds = payload.get("totalInspectionRounds")
        if inspection_rounds is not None and inspection_rounds < 0:
            raise ProjectValidationError("totalInspectionRounds must be a non-negative integer")
        start_date = payload.get("startDate")
        end_date = payload.get("endDate")
        if start_date and end_date and start_date > end_date:
            raise ProjectValidationError("startDate must not be later than endDate")

    def _share_warnings(self, aggregate: ProjectAggregate) -> list[str]:
        warnings: list[str] = []
        owner_parties = [party for party in aggregate.projectParties if party.role == "owner"]
        ratio_sum = round(sum(item.shareRatio or 0 for item in owner_parties), 2)
        amount_sum = int(sum(item.shareAmount or 0 for item in owner_parties))
        if ratio_sum > 100:
            warnings.append("shareRatioSumOver100")
        if aggregate.project.totalAmount is not None and owner_parties and amount_sum != aggregate.project.totalAmount:
            warnings.append("shareAmountMismatchAgainstTotalAmount")
        if any(contact.receivesReport and not contact.email for contact in aggregate.contacts):
            warnings.append("reportRecipientRequiresEmail")
        return warnings

    def _organization_names_by_role(self, aggregate: ProjectAggregate, role: str) -> list[str]:
        organization_ids = [
            party.organizationId
            for party in aggregate.projectParties
            if party.role == role
        ]
        org_map = {item.id: item.name for item in aggregate.organizations}
        return [org_map[item] for item in organization_ids if item in org_map]

    def _next_inspection_date(self, aggregate: ProjectAggregate) -> str | None:
        dates = [item.nextInspectionDate for item in aggregate.inspectionRounds if item.nextInspectionDate]
        return min(dates) if dates else None

    def _clear_primary_contact(self, project_id: str) -> None:
        for contact in self.repository.list_contacts(project_id):
            if contact.isPrimary:
                contact.isPrimary = False
                contact.updatedAt = self._now()
                self.repository.update_contact(contact.id, contact)

    def _extract_line(self, source_text: str, labels: list[str]) -> str | None:
        for label in labels:
            pattern = rf"{re.escape(label)}\s*:\s*(.+)"
            match = re.search(pattern, source_text)
            if match:
                return match.group(1).strip()
        return None

    def _split_names(self, value: str | None) -> list[str]:
        if not value:
            return []
        return [item.strip() for item in re.split(r",|/|·|\n", value) if item.strip()]

    def _extract_int(self, value: str | None) -> int | None:
        if not value:
            return None
        digits = re.sub(r"[^0-9]", "", value)
        return int(digits) if digits else None

    def _extract_float(self, value: str | None) -> float | None:
        if not value:
            return None
        match = re.search(r"[0-9]+(?:\.[0-9]+)?", value)
        return float(match.group(0)) if match else None

    def _extract_date_range(self, source_text: str) -> tuple[str | None, str | None]:
        line = self._extract_line(source_text, ["공사기간", "period"])
        if not line:
            return (None, None)
        match = re.search(r"(\d{4}-\d{2}-\d{2}).*?(\d{4}-\d{2}-\d{2})", line)
        if not match:
            return (None, None)
        return (match.group(1), match.group(2))

    def _extract_contacts(self, source_text: str) -> list[ExtractedContact]:
        contacts: list[ExtractedContact] = []
        pattern = re.compile(
            r"담당자\s*:\s*(?P<name>[^|\n]+)\|\s*소속\s*:\s*(?P<org>[^|\n]+)\|\s*이메일\s*:\s*(?P<email>[^|\n]+)\|\s*전화\s*:\s*(?P<phone>[^\n]+)"
        )
        for match in pattern.finditer(source_text):
            contacts.append(
                ExtractedContact(
                    organizationName=match.group("org").strip(),
                    name=match.group("name").strip(),
                    phone=match.group("phone").strip(),
                    email=match.group("email").strip(),
                    roleDescription="문서 추출 담당자",
                    receivesReport=True,
                )
            )
        return contacts

    def _now(self) -> str:
        return "2026-05-09T10:00:00+09:00"
