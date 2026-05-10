from copy import deepcopy

from server.app.domain.models import (
    Contact,
    DocumentInstance,
    InspectionRound,
    Organization,
    Project,
    ProjectActivityLog,
    ProjectAggregate,
    ProjectParty,
    ProjectRelatedCounts,
)


class ProjectRepository:
    def __init__(self) -> None:
        self.projects: dict[str, Project] = {}
        self.organizations: dict[str, Organization] = {}
        self.projectParties: dict[str, ProjectParty] = {}
        self.contacts: dict[str, Contact] = {}
        self.projectActivityLogs: dict[str, list[ProjectActivityLog]] = {}
        self.inspectionRounds: dict[str, list[InspectionRound]] = {}
        self.relatedCounts: dict[str, ProjectRelatedCounts] = {}
        self._seed()

    def _seed(self) -> None:
        created_at = "2026-05-01T09:00:00+09:00"
        updated_at = "2026-05-01T09:00:00+09:00"
        project = Project(
            id="project-sample-001",
            projectCode="ANC-2025-001",
            projectName="리움미술관 승강기 교체공사",
            siteName="리움미술관",
            siteAddress="서울시 용산구 한남동 이태원로 55길 60-16",
            constructionType="승강기 교체공사",
            constructionDescription="승강기 교체 및 부대 안전시설 정비",
            totalAmount=9130000000,
            startDate="2025-10-01",
            endDate="2028-02-29",
            actualStartDate="2025-11-03",
            progressRate=3.9,
            inspectionCycleText="3개월 이내 1회",
            totalInspectionRounds=10,
            status="active",
            memo="Bootstrap 이후 첫 실데이터 프로젝트 원장 샘플",
            createdAt=created_at,
            updatedAt=updated_at,
        )
        organizations = [
            Organization(
                id="org-owner-001",
                name="삼성문화재단",
                type="owner",
                createdAt=created_at,
                updatedAt=updated_at,
            ),
            Organization(
                id="org-owner-002",
                name="삼성생명공익재단",
                type="owner",
                createdAt=created_at,
                updatedAt=updated_at,
            ),
            Organization(
                id="org-contractor-001",
                name="현대엘리베이터(주)",
                type="contractor",
                createdAt=created_at,
                updatedAt=updated_at,
            ),
            Organization(
                id="org-engineer-001",
                name="A&C기술사사무소",
                type="engineer",
                createdAt=created_at,
                updatedAt=updated_at,
            ),
        ]
        project_parties = [
            ProjectParty(
                id="project-party-owner-001",
                projectId=project.id,
                organizationId="org-owner-001",
                role="owner",
                shareRatio=50,
                shareAmount=4565000000,
                requiresSeparateReport=True,
                reportRecipient=True,
                displayOrder=1,
                ownerPartyId="owner-samsung-cultural-foundation",
                createdAt=created_at,
                updatedAt=updated_at,
            ),
            ProjectParty(
                id="project-party-owner-002",
                projectId=project.id,
                organizationId="org-owner-002",
                role="owner",
                shareRatio=50,
                shareAmount=4565000000,
                requiresSeparateReport=True,
                reportRecipient=True,
                displayOrder=2,
                ownerPartyId="owner-samsung-life-foundation",
                createdAt=created_at,
                updatedAt=updated_at,
            ),
            ProjectParty(
                id="project-party-contractor-001",
                projectId=project.id,
                organizationId="org-contractor-001",
                role="contractor",
                invoiceRecipient=True,
                displayOrder=3,
                createdAt=created_at,
                updatedAt=updated_at,
            ),
            ProjectParty(
                id="project-party-engineer-001",
                projectId=project.id,
                organizationId="org-engineer-001",
                role="engineer",
                displayOrder=4,
                createdAt=created_at,
                updatedAt=updated_at,
            ),
        ]
        contacts = [
            Contact(
                id="contact-owner-001",
                projectId=project.id,
                organizationId="org-owner-001",
                name="김발주",
                position="과장",
                phone="010-1111-2222",
                email="owner1@example.com",
                roleDescription="보고서 수신 담당",
                isPrimary=True,
                receivesReport=True,
                createdAt=created_at,
                updatedAt=updated_at,
            ),
            Contact(
                id="contact-owner-002",
                projectId=project.id,
                organizationId="org-owner-002",
                name="박발주",
                position="대리",
                phone="010-3333-4444",
                email="owner2@example.com",
                roleDescription="발주처 담당자",
                receivesReport=True,
                createdAt=created_at,
                updatedAt=updated_at,
            ),
            Contact(
                id="contact-contractor-001",
                projectId=project.id,
                organizationId="org-contractor-001",
                name="이시공",
                position="소장",
                phone="010-5555-6666",
                email="contractor@example.com",
                roleDescription="시공사 현장소장",
                receivesActionRequest=True,
                createdAt=created_at,
                updatedAt=updated_at,
            ),
        ]
        document = DocumentInstance(
            id="doc-sample-001",
            projectId=project.id,
            inspectionRoundId="round-sample-001",
            ownerPartyId="owner-samsung-cultural-foundation",
            title="공사안전보건대장 이행확인 보고서",
            status="draft",
        )
        inspection_round = InspectionRound(
            id="round-sample-001",
            projectId=project.id,
            name="1차 정기점검",
            status="scheduled",
            nextInspectionDate="2026-06-15",
            documentInstances=[document],
        )
        activity_logs = [
            ProjectActivityLog(
                id="project-log-seed-001",
                projectId=project.id,
                action="project.created",
                summary="프로젝트 원장과 기본 웹하드 폴더 생성 요청이 등록되었습니다.",
                fieldNames=["projectName", "siteName", "siteAddress"],
                createdAt=created_at,
            )
        ]
        self.projects[project.id] = project
        self.organizations.update({item.id: item for item in organizations})
        self.projectParties.update({item.id: item for item in project_parties})
        self.contacts.update({item.id: item for item in contacts})
        self.inspectionRounds[project.id] = [inspection_round]
        self.projectActivityLogs[project.id] = activity_logs
        self.relatedCounts[project.id] = ProjectRelatedCounts(
            projectId=project.id,
            contracts=1,
            inspectionRounds=1,
            documents=1,
            files=1,
            mailThreads=0,
            openFindings=0,
        )

    def list_project_aggregates(self) -> list[ProjectAggregate]:
        return [self.get_project_aggregate(project_id) for project_id in self.projects]

    def get_project(self, project_id: str) -> Project | None:
        project = self.projects.get(project_id)
        return deepcopy(project) if project else None

    def get_project_aggregate(self, project_id: str) -> ProjectAggregate | None:
        project = self.projects.get(project_id)
        if not project:
            return None

        organizations = [
            deepcopy(self.organizations[party.organizationId])
            for party in sorted(self.list_project_parties(project_id), key=lambda item: item.displayOrder)
            if party.organizationId in self.organizations
        ]
        contacts = self.list_contacts(project_id)
        inspection_rounds = deepcopy(self.inspectionRounds.get(project_id, []))
        return ProjectAggregate(
            project=deepcopy(project),
            organizations=organizations,
            projectParties=sorted(
                self.list_project_parties(project_id),
                key=lambda item: item.displayOrder,
            ),
            contacts=contacts,
            inspectionRounds=inspection_rounds,
            relatedCounts=deepcopy(self.relatedCounts.get(project_id)),
            activityLogs=deepcopy(self.projectActivityLogs.get(project_id, [])),
        )

    def create_project(self, project: Project) -> Project:
        self.projects[project.id] = deepcopy(project)
        self.inspectionRounds[project.id] = []
        self.projectActivityLogs[project.id] = []
        self.relatedCounts[project.id] = ProjectRelatedCounts(projectId=project.id)
        return deepcopy(project)

    def update_project(self, project_id: str, project: Project) -> Project:
        self.projects[project_id] = deepcopy(project)
        return deepcopy(project)

    def archive_project(self, project_id: str, archived_at: str) -> Project:
        project = self.projects[project_id]
        project.status = "archived"
        project.archivedAt = archived_at
        project.updatedAt = archived_at
        self.projects[project_id] = deepcopy(project)
        return deepcopy(project)

    def delete_project(self, project_id: str) -> None:
        self.projects.pop(project_id, None)
        self.inspectionRounds.pop(project_id, None)
        self.projectActivityLogs.pop(project_id, None)
        self.relatedCounts.pop(project_id, None)
        party_ids = [item.id for item in self.projectParties.values() if item.projectId == project_id]
        for party_id in party_ids:
            self.projectParties.pop(party_id, None)
        contact_ids = [item.id for item in self.contacts.values() if item.projectId == project_id]
        for contact_id in contact_ids:
            self.contacts.pop(contact_id, None)

    def list_organizations(self) -> list[Organization]:
        return [deepcopy(item) for item in self.organizations.values()]

    def get_organization(self, organization_id: str) -> Organization | None:
        organization = self.organizations.get(organization_id)
        return deepcopy(organization) if organization else None

    def create_organization(self, organization: Organization) -> Organization:
        self.organizations[organization.id] = deepcopy(organization)
        return deepcopy(organization)

    def update_organization(self, organization_id: str, organization: Organization) -> Organization:
        self.organizations[organization_id] = deepcopy(organization)
        return deepcopy(organization)

    def delete_organization(self, organization_id: str) -> None:
        self.organizations.pop(organization_id, None)

    def list_project_parties(self, project_id: str) -> list[ProjectParty]:
        return [
            deepcopy(item)
            for item in self.projectParties.values()
            if item.projectId == project_id
        ]

    def get_project_party(self, party_id: str) -> ProjectParty | None:
        party = self.projectParties.get(party_id)
        return deepcopy(party) if party else None

    def create_project_party(self, party: ProjectParty) -> ProjectParty:
        self.projectParties[party.id] = deepcopy(party)
        return deepcopy(party)

    def update_project_party(self, party_id: str, party: ProjectParty) -> ProjectParty:
        self.projectParties[party_id] = deepcopy(party)
        return deepcopy(party)

    def delete_project_party(self, party_id: str) -> None:
        self.projectParties.pop(party_id, None)

    def list_contacts(self, project_id: str) -> list[Contact]:
        return [
            deepcopy(item)
            for item in self.contacts.values()
            if item.projectId == project_id
        ]

    def get_contact(self, contact_id: str) -> Contact | None:
        contact = self.contacts.get(contact_id)
        return deepcopy(contact) if contact else None

    def create_contact(self, contact: Contact) -> Contact:
        self.contacts[contact.id] = deepcopy(contact)
        return deepcopy(contact)

    def update_contact(self, contact_id: str, contact: Contact) -> Contact:
        self.contacts[contact_id] = deepcopy(contact)
        return deepcopy(contact)

    def delete_contact(self, contact_id: str) -> None:
        self.contacts.pop(contact_id, None)

    def set_related_counts(self, project_id: str, counts: ProjectRelatedCounts) -> None:
        self.relatedCounts[project_id] = deepcopy(counts)

    def get_related_counts(self, project_id: str) -> ProjectRelatedCounts:
        return deepcopy(self.relatedCounts[project_id])

    def add_activity_log(self, log: ProjectActivityLog) -> ProjectActivityLog:
        self.projectActivityLogs.setdefault(log.projectId, []).append(deepcopy(log))
        return deepcopy(log)

    def list_activity_logs(self, project_id: str) -> list[ProjectActivityLog]:
        return deepcopy(self.projectActivityLogs.get(project_id, []))

    def set_inspection_rounds(self, project_id: str, rounds: list[InspectionRound]) -> None:
        self.inspectionRounds[project_id] = deepcopy(rounds)

    def list_inspection_rounds(self, project_id: str) -> list[InspectionRound]:
        return deepcopy(self.inspectionRounds.get(project_id, []))
