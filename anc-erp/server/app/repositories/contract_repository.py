from copy import deepcopy

from server.app.domain.models import (
    AuditLog,
    Contract,
    ContractChange,
    ContractFileLink,
    ContractParty,
    ContractVersion,
    Estimate,
    EstimateItem,
    FileAsset,
    PaymentSplitItem,
    PaymentTerm,
)
from server.app.repositories.project_repository import ProjectRepository


class ContractRepository:
    def __init__(self, project_repository: ProjectRepository) -> None:
        self.project_repository = project_repository
        self.contracts: dict[str, Contract] = {}
        self.contractParties: dict[str, list[ContractParty]] = {}
        self.paymentTerms: dict[str, list[PaymentTerm]] = {}
        self.contractVersions: dict[str, list[ContractVersion]] = {}
        self.contractChanges: dict[str, list[ContractChange]] = {}
        self.contractFiles: dict[str, list[ContractFileLink]] = {}
        self.fileAssets: dict[str, FileAsset] = {}
        self.auditLogs: dict[str, list[AuditLog]] = {}
        self.estimates: dict[str, Estimate] = {}
        self._seed()

    def _seed(self) -> None:
        created_at = "2026-05-09T09:00:00+09:00"
        contract = Contract(
            id="contract-sample-001",
            projectId="project-sample-001",
            contractNo="ANC-C-2026-001",
            contractTitle="리움미술관 승강기 교체공사 공사안전보건대장 이행점검 기술용역계약서",
            contractType="technical_service",
            serviceName="한남동 승강기 교체공사(리움미술관) 기술용역",
            serviceScope="공사안전보건대장 이행점검 결과보고서 작성 및 제출",
            contractAmount=11000000,
            vatIncluded=True,
            vatAmount=1000000,
            supplyAmount=10000000,
            contractStartDate="2026-05-01",
            contractEndDate="2026-12-31",
            constructionStartDate="2025-11-03",
            constructionEndDate="2028-02-29",
            deliverables=[
                "공사안전보건대장 이행점검 결과보고서",
                "발주처별 제출용 최종본",
            ],
            inspectionCount=10,
            paymentSummary="1차기성 4,400,000원 / 준공금 6,600,000원",
            status="draft",
            latestVersionId="contract-version-sample-001",
            createdAt=created_at,
            updatedAt=created_at,
        )
        parties = [
            ContractParty(
                id="contract-party-client-001",
                contractId=contract.id,
                organizationId="org-owner-001",
                projectPartyId="project-party-owner-001",
                role="client_1",
                displayName="삼성문화재단",
                shareRatio=60,
                shareAmount=6600000,
                paymentRequired=True,
                signingRequired=True,
                displayOrder=1,
                createdAt=created_at,
                updatedAt=created_at,
            ),
            ContractParty(
                id="contract-party-client-002",
                contractId=contract.id,
                organizationId="org-owner-002",
                projectPartyId="project-party-owner-002",
                role="client_2",
                displayName="삼성생명공익재단",
                shareRatio=40,
                shareAmount=4400000,
                paymentRequired=True,
                signingRequired=True,
                displayOrder=2,
                createdAt=created_at,
                updatedAt=created_at,
            ),
            ContractParty(
                id="contract-party-service-001",
                contractId=contract.id,
                organizationId="org-engineer-001",
                projectPartyId="project-party-engineer-001",
                role="service_provider",
                displayName="A&C기술사사무소",
                paymentRequired=False,
                signingRequired=True,
                displayOrder=3,
                createdAt=created_at,
                updatedAt=created_at,
            ),
            ContractParty(
                id="contract-party-contractor-001",
                contractId=contract.id,
                organizationId="org-contractor-001",
                projectPartyId="project-party-contractor-001",
                role="contractor",
                displayName="현대엘리베이터(주)",
                paymentRequired=False,
                signingRequired=False,
                displayOrder=4,
                createdAt=created_at,
                updatedAt=created_at,
            ),
        ]
        payment_terms = [
            PaymentTerm(
                id="payment-term-sample-001",
                contractId=contract.id,
                label="1차기성",
                triggerText="착수 후 1차 이행점검 완료 시",
                dueDate=None,
                amount=4400000,
                ratio=40,
                status="planned",
                splitItems=[
                    PaymentSplitItem(
                        organizationId="org-owner-001",
                        projectPartyId="project-party-owner-001",
                        label="삼성문화재단",
                        ratio=60,
                        amount=2640000,
                    ),
                    PaymentSplitItem(
                        organizationId="org-owner-002",
                        projectPartyId="project-party-owner-002",
                        label="삼성생명공익재단",
                        ratio=40,
                        amount=1760000,
                    ),
                ],
                createdAt=created_at,
                updatedAt=created_at,
            ),
            PaymentTerm(
                id="payment-term-sample-002",
                contractId=contract.id,
                label="준공금",
                triggerText="최종 결과보고서 제출 후",
                dueDate=None,
                amount=6600000,
                ratio=60,
                status="planned",
                splitItems=[
                    PaymentSplitItem(
                        organizationId="org-owner-001",
                        projectPartyId="project-party-owner-001",
                        label="삼성문화재단",
                        ratio=60,
                        amount=3960000,
                    ),
                    PaymentSplitItem(
                        organizationId="org-owner-002",
                        projectPartyId="project-party-owner-002",
                        label="삼성생명공익재단",
                        ratio=40,
                        amount=2640000,
                    ),
                ],
                createdAt=created_at,
                updatedAt=created_at,
            ),
        ]
        versions = [
            ContractVersion(
                id="contract-version-sample-001",
                contractId=contract.id,
                versionNo=1,
                draftText=(
                    "계약서 초안\n"
                    "프로젝트: 리움미술관 승강기 교체공사\n"
                    "용역명: 한남동 승강기 교체공사(리움미술관) 기술용역\n"
                    "용역범위: 공사안전보건대장 이행점검 결과보고서 작성 및 제출\n"
                    "계약금액: 11,000,000원 (VAT 포함)\n"
                    "발주처 분담: 삼성문화재단 60%, 삼성생명공익재단 40%\n"
                    "점검횟수: 10회"
                ),
                templateKey="contract-draft-generation",
                isDraft=True,
                missingFields=[],
                createdAt=created_at,
            )
        ]
        file_asset = FileAsset(
            id="file-asset-sample-final",
            projectId=contract.projectId,
            fileName="리움미술관_기술용역계약서_v1.pdf",
            fileType="application/pdf",
            storagePath="/리움미술관 승강기 교체공사/00_계약_견적/리움미술관_기술용역계약서_v1.pdf",
            linkedEntityType="contract",
            linkedEntityId=contract.id,
            createdAt=created_at,
        )
        files = [
            ContractFileLink(
                id="contract-file-sample-final",
                fileId=file_asset.id,
                contractId=contract.id,
                fileName="리움미술관_기술용역계약서_v1.pdf",
                fileType="application/pdf",
                storagePath="/리움미술관 승강기 교체공사/00_계약_견적/리움미술관_기술용역계약서_v1.pdf",
                fileCategory="final",
                isFinal=True,
                createdAt=created_at,
            )
        ]
        changes = [
            ContractChange(
                id="contract-change-sample-001",
                contractId=contract.id,
                summary="계약금액과 지급조건 초안이 등록되었습니다.",
                changedFields=["contractAmount", "paymentSummary"],
                createdAt=created_at,
            )
        ]
        audits = [
            AuditLog(
                id="contract-audit-sample-001",
                entityType="contract",
                entityId=contract.id,
                action="contract.created",
                summary="계약 초안이 생성되었습니다.",
                fieldNames=["contractTitle", "contractAmount"],
                createdAt=created_at,
            )
        ]
        estimate = Estimate(
            id="estimate-sample-001",
            projectId="project-sample-001",
            estimateNo="ANC-E-2026-001",
            title="리움미술관 승강기 교체공사 기술용역 견적서",
            serviceName="한남동 승강기 교체공사(리움미술관) 기술용역",
            validUntil="2026-06-30",
            status="draft",
            supplyAmount=10000000,
            vatAmount=1000000,
            totalAmount=11000000,
            items=[
                EstimateItem(
                    id="estimate-item-sample-001",
                    label="정기 이행점검",
                    description="총 10회 현장 점검 및 보고서 작성",
                    quantity=10,
                    unitPrice=1000000,
                    supplyAmount=10000000,
                    vatAmount=1000000,
                    totalAmount=11000000,
                )
            ],
            createdAt=created_at,
            updatedAt=created_at,
        )

        self.contracts[contract.id] = contract
        self.contractParties[contract.id] = parties
        self.paymentTerms[contract.id] = payment_terms
        self.contractVersions[contract.id] = versions
        self.contractChanges[contract.id] = changes
        self.contractFiles[contract.id] = files
        self.fileAssets[file_asset.id] = file_asset
        self.auditLogs[contract.id] = audits
        self.estimates[estimate.id] = estimate

        counts = self.project_repository.get_related_counts("project-sample-001")
        counts.contracts = max(counts.contracts, 1)
        counts.files = max(counts.files, len(files))
        self.project_repository.set_related_counts("project-sample-001", counts)

    def list_contracts(self, project_id: str) -> list[Contract]:
        return [
            deepcopy(item)
            for item in self.contracts.values()
            if item.projectId == project_id and item.archivedAt is None
        ]

    def get_contract(self, contract_id: str) -> Contract | None:
        item = self.contracts.get(contract_id)
        return deepcopy(item) if item else None

    def create_contract(self, contract: Contract) -> Contract:
        self.contracts[contract.id] = deepcopy(contract)
        self.contractParties.setdefault(contract.id, [])
        self.paymentTerms.setdefault(contract.id, [])
        self.contractVersions.setdefault(contract.id, [])
        self.contractChanges.setdefault(contract.id, [])
        self.contractFiles.setdefault(contract.id, [])
        self.auditLogs.setdefault(contract.id, [])
        return deepcopy(contract)

    def update_contract(self, contract_id: str, contract: Contract) -> Contract:
        self.contracts[contract_id] = deepcopy(contract)
        return deepcopy(contract)

    def delete_contract(self, contract_id: str) -> None:
        self.contracts.pop(contract_id, None)
        self.contractParties.pop(contract_id, None)
        self.paymentTerms.pop(contract_id, None)
        self.contractVersions.pop(contract_id, None)
        self.contractChanges.pop(contract_id, None)
        self.contractFiles.pop(contract_id, None)
        self.auditLogs.pop(contract_id, None)

    def list_contract_parties(self, contract_id: str) -> list[ContractParty]:
        return deepcopy(self.contractParties.get(contract_id, []))

    def get_contract_party(self, contract_party_id: str) -> ContractParty | None:
        for items in self.contractParties.values():
            for item in items:
                if item.id == contract_party_id:
                    return deepcopy(item)
        return None

    def save_contract_parties(self, contract_id: str, parties: list[ContractParty]) -> list[ContractParty]:
        self.contractParties[contract_id] = deepcopy(parties)
        return deepcopy(parties)

    def list_payment_terms(self, contract_id: str) -> list[PaymentTerm]:
        return deepcopy(self.paymentTerms.get(contract_id, []))

    def get_payment_term(self, payment_term_id: str) -> PaymentTerm | None:
        for items in self.paymentTerms.values():
            for item in items:
                if item.id == payment_term_id:
                    return deepcopy(item)
        return None

    def save_payment_terms(self, contract_id: str, payment_terms: list[PaymentTerm]) -> list[PaymentTerm]:
        self.paymentTerms[contract_id] = deepcopy(payment_terms)
        return deepcopy(payment_terms)

    def list_contract_versions(self, contract_id: str) -> list[ContractVersion]:
        return deepcopy(self.contractVersions.get(contract_id, []))

    def add_contract_version(self, version: ContractVersion) -> ContractVersion:
        self.contractVersions.setdefault(version.contractId, []).append(deepcopy(version))
        return deepcopy(version)

    def list_contract_changes(self, contract_id: str) -> list[ContractChange]:
        return deepcopy(self.contractChanges.get(contract_id, []))

    def add_contract_change(self, change: ContractChange) -> ContractChange:
        self.contractChanges.setdefault(change.contractId, []).append(deepcopy(change))
        return deepcopy(change)

    def list_contract_files(self, contract_id: str) -> list[ContractFileLink]:
        return deepcopy(self.contractFiles.get(contract_id, []))

    def add_contract_file(self, file_link: ContractFileLink) -> ContractFileLink:
        self.contractFiles.setdefault(file_link.contractId, []).append(deepcopy(file_link))
        return deepcopy(file_link)

    def save_contract_files(self, contract_id: str, files: list[ContractFileLink]) -> list[ContractFileLink]:
        self.contractFiles[contract_id] = deepcopy(files)
        return deepcopy(files)

    def create_file_asset(self, file_asset: FileAsset) -> FileAsset:
        self.fileAssets[file_asset.id] = deepcopy(file_asset)
        return deepcopy(file_asset)

    def get_file_asset(self, file_asset_id: str) -> FileAsset | None:
        item = self.fileAssets.get(file_asset_id)
        return deepcopy(item) if item else None

    def list_audit_logs(self, contract_id: str) -> list[AuditLog]:
        return deepcopy(self.auditLogs.get(contract_id, []))

    def add_audit_log(self, contract_id: str, audit_log: AuditLog) -> AuditLog:
        self.auditLogs.setdefault(contract_id, []).append(deepcopy(audit_log))
        return deepcopy(audit_log)

    def list_estimates(self, project_id: str) -> list[Estimate]:
        return [deepcopy(item) for item in self.estimates.values() if item.projectId == project_id]

    def get_estimate(self, estimate_id: str) -> Estimate | None:
        item = self.estimates.get(estimate_id)
        return deepcopy(item) if item else None

    def create_estimate(self, estimate: Estimate) -> Estimate:
        self.estimates[estimate.id] = deepcopy(estimate)
        return deepcopy(estimate)

    def update_estimate(self, estimate_id: str, estimate: Estimate) -> Estimate:
        self.estimates[estimate_id] = deepcopy(estimate)
        return deepcopy(estimate)

    def delete_estimate(self, estimate_id: str) -> None:
        self.estimates.pop(estimate_id, None)
