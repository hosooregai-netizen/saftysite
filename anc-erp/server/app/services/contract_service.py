from dataclasses import asdict
from uuid import uuid4

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
    Organization,
    PaymentSplitItem,
    PaymentTerm,
    ProjectRelatedCounts,
)
from server.app.repositories.contract_repository import ContractRepository
from server.app.repositories.project_repository import ProjectRepository


class ContractNotFoundError(Exception):
    pass


class ContractValidationError(Exception):
    pass


class ContractService:
    def __init__(self, repository: ContractRepository, project_repository: ProjectRepository) -> None:
        self.repository = repository
        self.project_repository = project_repository

    def list_contracts(self, project_id: str) -> list[dict]:
        self._require_project(project_id)
        return [self._serialize_contract_list_item(item) for item in self.repository.list_contracts(project_id)]

    def create_contract(self, project_id: str, payload: dict) -> dict:
        self._require_project(project_id)
        self._validate_contract_payload(payload)
        contract = self._build_contract(project_id, payload)
        created = self.repository.create_contract(contract)

        parties = [self._build_contract_party(created.id, item, index + 1) for index, item in enumerate(payload.get("parties", []))]
        self.repository.save_contract_parties(created.id, parties)

        payment_terms = [self._build_payment_term(created.id, item) for item in payload.get("paymentTerms", [])]
        self.repository.save_payment_terms(created.id, payment_terms)

        audit = self._add_audit_log(
            created.id,
            "contract.created",
            "계약 초안이 생성되었습니다.",
            ["contractTitle", "contractAmount"],
        )
        self._increment_project_contract_count(project_id, 1)
        return {
            "contract": asdict(created),
            "warnings": self._contract_warnings(created.id),
            "auditLog": asdict(audit),
        }

    def get_contract(self, contract_id: str) -> dict:
        return self._serialize_contract_detail(contract_id)

    def update_contract(self, contract_id: str, payload: dict) -> dict:
        contract = self._require_contract(contract_id)
        merged = {**asdict(contract), **payload}
        self._validate_contract_payload(merged)
        changed_fields = [key for key, value in payload.items() if getattr(contract, key, None) != value]
        for key, value in payload.items():
            if hasattr(contract, key):
                setattr(contract, key, value)
        contract.updatedAt = self._now()
        contract.supplyAmount, contract.vatAmount = self._normalize_amounts(
            contract.contractAmount,
            contract.vatIncluded,
            contract.supplyAmount,
            contract.vatAmount,
        )
        updated = self.repository.update_contract(contract_id, contract)
        if changed_fields:
            self.repository.add_contract_change(
                ContractChange(
                    id=f"contract-change-{uuid4().hex[:8]}",
                    contractId=contract_id,
                    summary="계약 정보가 수정되었습니다.",
                    changedFields=changed_fields,
                    createdAt=self._now(),
                )
            )
        audit = self._add_audit_log(
            contract_id,
            "contract.updated",
            "계약 기본정보가 수정되었습니다.",
            changed_fields,
        )
        return {
            "contract": asdict(updated),
            "warnings": self._contract_warnings(contract_id),
            "auditLog": asdict(audit),
        }

    def delete_contract(self, contract_id: str) -> dict:
        contract = self._require_contract(contract_id)
        self.repository.delete_contract(contract_id)
        self._increment_project_contract_count(contract.projectId, -1)
        return {"deleted": True}

    def list_contract_parties(self, contract_id: str) -> list[dict]:
        self._require_contract(contract_id)
        return [self._serialize_contract_party(item) for item in self.repository.list_contract_parties(contract_id)]

    def create_contract_party(self, contract_id: str, payload: dict) -> dict:
        self._require_contract(contract_id)
        parties = self.repository.list_contract_parties(contract_id)
        party = self._build_contract_party(contract_id, payload, len(parties) + 1)
        parties.append(party)
        self.repository.save_contract_parties(contract_id, parties)
        return {
            "contractParty": asdict(party),
            "warnings": self._contract_warnings(contract_id),
        }

    def update_contract_party(self, contract_party_id: str, payload: dict) -> dict:
        party = self.repository.get_contract_party(contract_party_id)
        if not party:
            raise ContractNotFoundError("contract party not found")
        parties = self.repository.list_contract_parties(party.contractId)
        for item in parties:
            if item.id == contract_party_id:
                for key, value in payload.items():
                    if hasattr(item, key):
                        setattr(item, key, value)
                item.updatedAt = self._now()
                updated = item
                break
        else:
            raise ContractNotFoundError("contract party not found")
        self.repository.save_contract_parties(party.contractId, parties)
        return {
            "contractParty": asdict(updated),
            "warnings": self._contract_warnings(party.contractId),
        }

    def delete_contract_party(self, contract_party_id: str) -> dict:
        party = self.repository.get_contract_party(contract_party_id)
        if not party:
            raise ContractNotFoundError("contract party not found")
        parties = [item for item in self.repository.list_contract_parties(party.contractId) if item.id != contract_party_id]
        self.repository.save_contract_parties(party.contractId, parties)
        return {"deleted": True}

    def apply_project_parties(self, contract_id: str) -> list[dict]:
        contract = self._require_contract(contract_id)
        project_parties = sorted(
            self.project_repository.list_project_parties(contract.projectId),
            key=lambda item: item.displayOrder,
        )
        mapped: list[ContractParty] = []
        owner_index = 0
        for project_party in project_parties:
            organization = self.project_repository.get_organization(project_party.organizationId)
            if not organization:
                continue
            role = project_party.role
            contract_role = role
            payment_required = False
            signing_required = False
            if role == "owner":
                owner_index += 1
                contract_role = f"client_{owner_index}"
                payment_required = True
                signing_required = True
            elif role == "engineer":
                contract_role = "service_provider"
                signing_required = True
            elif role == "contractor":
                contract_role = "contractor"

            mapped.append(
                ContractParty(
                    id=f"contract-party-{uuid4().hex[:8]}",
                    contractId=contract_id,
                    organizationId=organization.id,
                    projectPartyId=project_party.id,
                    role=contract_role,
                    displayName=organization.name,
                    representativeName=organization.representativeName,
                    businessNumber=organization.businessNumber,
                    address=organization.address,
                    phone=organization.phone,
                    shareRatio=project_party.shareRatio,
                    shareAmount=project_party.shareAmount,
                    paymentRequired=payment_required,
                    signingRequired=signing_required,
                    displayOrder=len(mapped) + 1,
                    createdAt=self._now(),
                    updatedAt=self._now(),
                )
            )
        self.repository.save_contract_parties(contract_id, mapped)
        return [self._serialize_contract_party(item) for item in mapped]

    def list_payment_terms(self, contract_id: str) -> list[dict]:
        self._require_contract(contract_id)
        return [asdict(item) for item in self.repository.list_payment_terms(contract_id)]

    def create_payment_term(self, contract_id: str, payload: dict) -> dict:
        self._require_contract(contract_id)
        payment_terms = self.repository.list_payment_terms(contract_id)
        payment_term = self._build_payment_term(contract_id, payload)
        payment_terms.append(payment_term)
        self.repository.save_payment_terms(contract_id, payment_terms)
        return {
            "paymentTerm": asdict(payment_term),
            "warnings": self._contract_warnings(contract_id),
        }

    def update_payment_term(self, payment_term_id: str, payload: dict) -> dict:
        payment_term = self.repository.get_payment_term(payment_term_id)
        if not payment_term:
            raise ContractNotFoundError("payment term not found")
        merged = {**asdict(payment_term), **payload}
        self._validate_payment_term_payload(merged)
        payment_terms = self.repository.list_payment_terms(payment_term.contractId)
        for item in payment_terms:
            if item.id == payment_term_id:
                for key, value in payload.items():
                    if key == "splitItems" and value is not None:
                        item.splitItems = [
                            PaymentSplitItem(
                                organizationId=split["organizationId"],
                                projectPartyId=split.get("projectPartyId"),
                                label=split["label"],
                                ratio=split["ratio"],
                                amount=split["amount"],
                            )
                            for split in value
                        ]
                    elif hasattr(item, key):
                        setattr(item, key, value)
                item.updatedAt = self._now()
                updated = item
                break
        else:
            raise ContractNotFoundError("payment term not found")
        self.repository.save_payment_terms(payment_term.contractId, payment_terms)
        return {
            "paymentTerm": asdict(updated),
            "warnings": self._contract_warnings(payment_term.contractId),
        }

    def delete_payment_term(self, payment_term_id: str) -> dict:
        payment_term = self.repository.get_payment_term(payment_term_id)
        if not payment_term:
            raise ContractNotFoundError("payment term not found")
        payment_terms = [item for item in self.repository.list_payment_terms(payment_term.contractId) if item.id != payment_term_id]
        self.repository.save_payment_terms(payment_term.contractId, payment_terms)
        return {"deleted": True}

    def calculate_payment_split(self, contract_id: str, payload: dict) -> dict:
        contract = self._require_contract(contract_id)
        amount = payload.get("amount")
        if amount is None:
            raise ContractValidationError("amount is required")
        split_items = self._calculate_split_items(contract, amount)
        warnings: list[str] = []
        if sum(item.amount for item in split_items) != amount:
            warnings.append("paymentSplitAmountMismatch")
        return {
            "contractId": contract_id,
            "paymentTermAmount": amount,
            "splitItems": [asdict(item) for item in split_items],
            "warnings": warnings,
            "totalRatio": round(sum(item.ratio for item in split_items), 2),
            "totalAmount": sum(item.amount for item in split_items),
        }

    def preview_contract(self, contract_id: str) -> dict:
        contract = self._require_contract(contract_id)
        draft = self._build_contract_draft(contract)
        return {
            "contractId": contract_id,
            "templateKey": "contract-draft-generation",
            "draftText": draft["text"],
            "missingFields": draft["missingFields"],
            "warnings": self._contract_warnings(contract_id),
            "isDraft": True,
        }

    def generate_contract(self, contract_id: str) -> dict:
        contract = self._require_contract(contract_id)
        draft = self._build_contract_draft(contract)
        versions = self.repository.list_contract_versions(contract_id)
        version = ContractVersion(
            id=f"contract-version-{uuid4().hex[:8]}",
            contractId=contract_id,
            versionNo=len(versions) + 1,
            draftText=draft["text"],
            templateKey="contract-draft-generation",
            isDraft=True,
            missingFields=draft["missingFields"],
            createdAt=self._now(),
        )
        created = self.repository.add_contract_version(version)
        contract.latestVersionId = created.id
        contract.updatedAt = self._now()
        self.repository.update_contract(contract_id, contract)
        self.repository.add_contract_change(
            ContractChange(
                id=f"contract-change-{uuid4().hex[:8]}",
                contractId=contract_id,
                summary="계약서 AI 초안이 생성되었습니다.",
                changedFields=["latestVersionId"],
                createdAt=self._now(),
            )
        )
        audit = self._add_audit_log(
            contract_id,
            "contract.generated",
            "계약서 초안 버전이 저장되었습니다.",
            ["latestVersionId"],
        )
        return {
            "version": asdict(created),
            "warnings": self._contract_warnings(contract_id),
            "auditLog": asdict(audit),
        }

    def export_contract(self, contract_id: str) -> dict:
        contract = self._require_contract(contract_id)
        version = self._require_latest_version(contract)
        project = self._require_project(contract.projectId)
        file_link = ContractFileLink(
            id=f"contract-file-{uuid4().hex[:8]}",
            fileId=f"file-asset-{uuid4().hex[:8]}",
            contractId=contract_id,
            fileName=f"{contract.contractTitle}_v{version.versionNo}.pdf",
            fileType="application/pdf",
            storagePath=f"/{project.projectName}/00_계약_견적/{contract.contractTitle}_v{version.versionNo}.pdf",
            fileCategory="export",
            createdAt=self._now(),
        )
        self.repository.create_file_asset(
            FileAsset(
                id=file_link.fileId,
                projectId=contract.projectId,
                fileName=file_link.fileName,
                fileType=file_link.fileType,
                storagePath=file_link.storagePath,
                linkedEntityType="contract",
                linkedEntityId=contract_id,
                createdAt=self._now(),
            )
        )
        self.repository.add_contract_file(file_link)
        self._sync_project_file_count(contract.projectId)
        return {
            "contractId": contract_id,
            "latestVersionId": version.id,
            "file": asdict(file_link),
            "usedLatestVersion": True,
        }

    def mark_contract_sent(self, contract_id: str) -> dict:
        contract = self._require_contract(contract_id)
        contract.status = "sent"
        contract.updatedAt = self._now()
        updated = self.repository.update_contract(contract_id, contract)
        audit = self._add_audit_log(contract_id, "contract.sent", "계약서 발송 상태로 변경되었습니다.", ["status"])
        return {
            "contract": asdict(updated),
            "auditLog": asdict(audit),
        }

    def mark_contract_signed(self, contract_id: str) -> dict:
        contract = self._require_contract(contract_id)
        if not contract.signedFileId:
            raise ContractValidationError("signedFileId is required before signed status")
        contract.status = "signed"
        contract.updatedAt = self._now()
        updated = self.repository.update_contract(contract_id, contract)
        audit = self._add_audit_log(contract_id, "contract.signed", "날인 완료 상태로 변경되었습니다.", ["status", "signedFileId"])
        return {
            "contract": asdict(updated),
            "auditLog": asdict(audit),
        }

    def upload_contract_file(self, contract_id: str, payload: dict) -> dict:
        contract = self._require_contract(contract_id)
        project = self._require_project(contract.projectId)
        file_link = ContractFileLink(
            id=f"contract-file-{uuid4().hex[:8]}",
            fileId=f"file-asset-{uuid4().hex[:8]}",
            contractId=contract_id,
            fileName=payload["fileName"],
            fileType=payload.get("fileType", "application/octet-stream"),
            storagePath=f"/{project.projectName}/00_계약_견적/{payload['fileName']}",
            fileCategory=payload.get("fileCategory", "attachment"),
            createdAt=self._now(),
        )
        self.repository.create_file_asset(
            FileAsset(
                id=file_link.fileId,
                projectId=contract.projectId,
                fileName=file_link.fileName,
                fileType=file_link.fileType,
                storagePath=file_link.storagePath,
                linkedEntityType="contract",
                linkedEntityId=contract_id,
                createdAt=self._now(),
            )
        )
        created = self.repository.add_contract_file(file_link)
        self._sync_project_file_count(contract.projectId)
        return {"file": asdict(created)}

    def list_contract_files(self, contract_id: str) -> list[dict]:
        self._require_contract(contract_id)
        return [asdict(item) for item in self.repository.list_contract_files(contract_id)]

    def set_final_contract_file(self, contract_id: str, file_id: str) -> dict:
        contract = self._require_contract(contract_id)
        files = self.repository.list_contract_files(contract_id)
        selected = None
        for item in files:
            item.isFinal = item.id == file_id
            if item.isFinal:
                item.fileCategory = "final"
                selected = item
        if not selected:
            raise ContractNotFoundError("contract file not found")
        self.repository.save_contract_files(contract_id, files)
        contract.finalFileId = file_id
        contract.updatedAt = self._now()
        updated = self.repository.update_contract(contract_id, contract)
        return {"contract": asdict(updated), "file": asdict(selected)}

    def set_signed_contract_file(self, contract_id: str, file_id: str) -> dict:
        contract = self._require_contract(contract_id)
        files = self.repository.list_contract_files(contract_id)
        selected = None
        for item in files:
            item.isSigned = item.id == file_id
            if item.isSigned:
                item.fileCategory = "signed"
                selected = item
        if not selected:
            raise ContractNotFoundError("contract file not found")
        self.repository.save_contract_files(contract_id, files)
        contract.signedFileId = file_id
        contract.updatedAt = self._now()
        updated = self.repository.update_contract(contract_id, contract)
        return {"contract": asdict(updated), "file": asdict(selected)}

    def list_estimates(self, project_id: str) -> list[dict]:
        self._require_project(project_id)
        return [self._serialize_estimate_list_item(item) for item in self.repository.list_estimates(project_id)]

    def create_estimate(self, project_id: str, payload: dict) -> dict:
        self._require_project(project_id)
        self._validate_estimate_payload(payload)
        estimate = self._build_estimate(project_id, payload)
        created = self.repository.create_estimate(estimate)
        return {"estimate": asdict(created)}

    def get_estimate(self, estimate_id: str) -> dict:
        estimate = self.repository.get_estimate(estimate_id)
        if not estimate:
            raise ContractNotFoundError("estimate not found")
        return asdict(estimate)

    def update_estimate(self, estimate_id: str, payload: dict) -> dict:
        estimate = self.repository.get_estimate(estimate_id)
        if not estimate:
            raise ContractNotFoundError("estimate not found")
        merged = {**asdict(estimate), **payload}
        self._validate_estimate_payload(merged)
        for key, value in payload.items():
            if key == "items" and value is not None:
                estimate.items = [self._build_estimate_item(item) for item in value]
            elif hasattr(estimate, key):
                setattr(estimate, key, value)
        estimate.updatedAt = self._now()
        updated = self.repository.update_estimate(estimate_id, estimate)
        return {"estimate": asdict(updated)}

    def delete_estimate(self, estimate_id: str) -> dict:
        estimate = self.repository.get_estimate(estimate_id)
        if not estimate:
            raise ContractNotFoundError("estimate not found")
        self.repository.delete_estimate(estimate_id)
        return {"deleted": True}

    def generate_estimate(self, estimate_id: str) -> dict:
        estimate = self.repository.get_estimate(estimate_id)
        if not estimate:
            raise ContractNotFoundError("estimate not found")
        return {
            "estimateId": estimate.id,
            "draftText": self._build_estimate_draft(estimate),
            "isDraft": True,
        }

    def export_estimate(self, estimate_id: str) -> dict:
        estimate = self.repository.get_estimate(estimate_id)
        if not estimate:
            raise ContractNotFoundError("estimate not found")
        if not estimate.items:
            raise ContractValidationError("estimate requires at least one item to export")
        return {
            "estimateId": estimate.id,
            "fileName": f"{estimate.title}.pdf",
            "isDraft": True,
        }

    def convert_estimate_to_contract(self, estimate_id: str) -> dict:
        estimate = self.repository.get_estimate(estimate_id)
        if not estimate:
            raise ContractNotFoundError("estimate not found")
        contract = Contract(
            id=f"contract-{uuid4().hex[:8]}",
            projectId=estimate.projectId,
            contractNo=None,
            contractTitle=f"{estimate.title} 계약 전환 초안",
            contractType="estimate-converted",
            serviceName=estimate.serviceName,
            serviceScope="견적서 기준 서비스 범위 초안",
            contractAmount=estimate.totalAmount,
            vatIncluded=True,
            vatAmount=estimate.vatAmount,
            supplyAmount=estimate.supplyAmount,
            deliverables=["견적 전환 계약 초안"],
            status="draft",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        created_contract = self.repository.create_contract(contract)
        estimate.status = "converted"
        estimate.convertedContractId = created_contract.id
        estimate.updatedAt = self._now()
        updated_estimate = self.repository.update_estimate(estimate_id, estimate)
        self._increment_project_contract_count(estimate.projectId, 1)
        return {
            "estimate": asdict(updated_estimate),
            "contract": asdict(created_contract),
        }

    def _serialize_contract_list_item(self, contract: Contract) -> dict:
        parties = self.repository.list_contract_parties(contract.id)
        client_names = [item.displayName for item in parties if item.role.startswith("client")]
        payment_terms = self.repository.list_payment_terms(contract.id)
        versions = self.repository.list_contract_versions(contract.id)
        return {
            "contract": asdict(contract),
            "clientNames": client_names,
            "paymentTermCount": len(payment_terms),
            "versionCount": len(versions),
            "warnings": self._contract_warnings(contract.id),
        }

    def _serialize_contract_detail(self, contract_id: str) -> dict:
        contract = self._require_contract(contract_id)
        project = self._require_project(contract.projectId)
        return {
            "contract": asdict(contract),
            "project": asdict(project),
            "parties": [self._serialize_contract_party(item) for item in self.repository.list_contract_parties(contract_id)],
            "paymentTerms": [asdict(item) for item in self.repository.list_payment_terms(contract_id)],
            "versions": [asdict(item) for item in self.repository.list_contract_versions(contract_id)],
            "changes": [asdict(item) for item in self.repository.list_contract_changes(contract_id)],
            "files": [asdict(item) for item in self.repository.list_contract_files(contract_id)],
            "auditLogs": [asdict(item) for item in self.repository.list_audit_logs(contract_id)],
            "warnings": self._contract_warnings(contract_id),
        }

    def _serialize_contract_party(self, party: ContractParty) -> dict:
        organization = self.project_repository.get_organization(party.organizationId)
        return {
            **asdict(party),
            "organization": asdict(organization) if organization else None,
        }

    def _serialize_estimate_list_item(self, estimate: Estimate) -> dict:
        return {
            "estimate": asdict(estimate),
            "itemCount": len(estimate.items),
        }

    def _build_contract(self, project_id: str, payload: dict) -> Contract:
        contract_amount = int(payload["contractAmount"])
        supply_amount, vat_amount = self._normalize_amounts(
            contract_amount,
            bool(payload.get("vatIncluded", True)),
            payload.get("supplyAmount"),
            payload.get("vatAmount"),
        )
        return Contract(
            id=f"contract-{uuid4().hex[:8]}",
            projectId=project_id,
            contractNo=payload.get("contractNo"),
            contractTitle=payload["contractTitle"].strip(),
            contractType=payload.get("contractType", "technical_service"),
            serviceName=payload.get("serviceName", "").strip(),
            serviceScope=payload.get("serviceScope", "").strip(),
            contractAmount=contract_amount,
            vatIncluded=bool(payload.get("vatIncluded", True)),
            vatAmount=vat_amount,
            supplyAmount=supply_amount,
            contractStartDate=payload.get("contractStartDate"),
            contractEndDate=payload.get("contractEndDate"),
            constructionStartDate=payload.get("constructionStartDate"),
            constructionEndDate=payload.get("constructionEndDate"),
            deliverables=payload.get("deliverables", []),
            inspectionCount=payload.get("inspectionCount"),
            paymentSummary=payload.get("paymentSummary"),
            status=payload.get("status", "draft"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )

    def _build_contract_party(self, contract_id: str, payload: dict, display_order: int) -> ContractParty:
        organization = self.project_repository.get_organization(payload["organizationId"])
        display_name = payload.get("displayName") or (organization.name if organization else "미지정")
        return ContractParty(
            id=f"contract-party-{uuid4().hex[:8]}",
            contractId=contract_id,
            organizationId=payload["organizationId"],
            projectPartyId=payload.get("projectPartyId"),
            role=payload["role"],
            displayName=display_name,
            representativeName=payload.get("representativeName") or (organization.representativeName if organization else None),
            businessNumber=payload.get("businessNumber") or (organization.businessNumber if organization else None),
            address=payload.get("address") or (organization.address if organization else None),
            phone=payload.get("phone") or (organization.phone if organization else None),
            shareRatio=payload.get("shareRatio"),
            shareAmount=payload.get("shareAmount"),
            paymentRequired=bool(payload.get("paymentRequired", False)),
            signingRequired=bool(payload.get("signingRequired", False)),
            displayOrder=payload.get("displayOrder", display_order),
            createdAt=self._now(),
            updatedAt=self._now(),
        )

    def _build_payment_term(self, contract_id: str, payload: dict) -> PaymentTerm:
        self._validate_payment_term_payload(payload)
        split_items = [
            PaymentSplitItem(
                organizationId=item["organizationId"],
                projectPartyId=item.get("projectPartyId"),
                label=item["label"],
                ratio=item["ratio"],
                amount=item["amount"],
            )
            for item in payload.get("splitItems", [])
        ]
        return PaymentTerm(
            id=f"payment-term-{uuid4().hex[:8]}",
            contractId=contract_id,
            label=payload["label"],
            triggerText=payload.get("triggerText", ""),
            dueDate=payload.get("dueDate"),
            amount=payload["amount"],
            ratio=payload.get("ratio"),
            status=payload.get("status", "planned"),
            requestDate=payload.get("requestDate"),
            paidDate=payload.get("paidDate"),
            evidenceFileId=payload.get("evidenceFileId"),
            splitItems=split_items,
            createdAt=self._now(),
            updatedAt=self._now(),
        )

    def _build_estimate(self, project_id: str, payload: dict) -> Estimate:
        items = [self._build_estimate_item(item) for item in payload.get("items", [])]
        return Estimate(
            id=f"estimate-{uuid4().hex[:8]}",
            projectId=project_id,
            estimateNo=payload.get("estimateNo"),
            title=payload["title"].strip(),
            serviceName=payload.get("serviceName", "").strip(),
            validUntil=payload.get("validUntil"),
            status=payload.get("status", "draft"),
            supplyAmount=payload["supplyAmount"],
            vatAmount=payload["vatAmount"],
            totalAmount=payload["totalAmount"],
            items=items,
            createdAt=self._now(),
            updatedAt=self._now(),
        )

    def _build_estimate_item(self, payload: dict) -> EstimateItem:
        return EstimateItem(
            id=payload.get("id") or f"estimate-item-{uuid4().hex[:8]}",
            label=payload["label"],
            description=payload.get("description"),
            quantity=payload.get("quantity", 1),
            unitPrice=payload["unitPrice"],
            supplyAmount=payload["supplyAmount"],
            vatAmount=payload["vatAmount"],
            totalAmount=payload["totalAmount"],
        )

    def _normalize_amounts(
        self,
        contract_amount: int,
        vat_included: bool,
        supply_amount: int | None,
        vat_amount: int | None,
    ) -> tuple[int | None, int | None]:
        if supply_amount is not None and vat_amount is not None:
            return supply_amount, vat_amount
        if vat_included:
            normalized_vat = int(round(contract_amount / 11))
            return contract_amount - normalized_vat, normalized_vat
        return contract_amount, 0

    def _build_contract_draft(self, contract: Contract) -> dict:
        parties = self.repository.list_contract_parties(contract.id)
        payment_terms = self.repository.list_payment_terms(contract.id)
        project = self._require_project(contract.projectId)
        client_lines = [
            f"{item.displayName} {item.shareRatio or 0}% ({item.shareAmount or 0:,}원)"
            for item in parties
            if item.role.startswith("client")
        ]
        payment_lines = [f"{item.label} {item.amount:,}원" for item in payment_terms]
        missing_fields: list[str] = []
        if not contract.serviceScope:
            missing_fields.append("serviceScope")
        if contract.inspectionCount is None:
            missing_fields.append("inspectionCount")
        text = "\n".join(
            [
                "계약서 초안",
                f"프로젝트: {project.projectName}",
                f"계약명: {contract.contractTitle}",
                f"용역명: {contract.serviceName}",
                f"용역범위: {contract.serviceScope or '[미입력]'}",
                f"계약금액: {contract.contractAmount:,}원 {'(VAT 포함)' if contract.vatIncluded else '(VAT 별도)'}",
                f"발주처 분담: {', '.join(client_lines) if client_lines else '[미설정]'}",
                f"지급조건: {', '.join(payment_lines) if payment_lines else '[미설정]'}",
                f"점검횟수: {contract.inspectionCount if contract.inspectionCount is not None else '[미입력]'}",
                "주의: 본 초안은 저장된 구조화 데이터만 사용하며 일반조건 법률문구는 자동 생성하지 않습니다.",
            ]
        )
        return {
            "text": text,
            "missingFields": missing_fields,
        }

    def _build_estimate_draft(self, estimate: Estimate) -> str:
        item_lines = [f"{item.label} {item.totalAmount:,}원" for item in estimate.items]
        return "\n".join(
            [
                "견적서 초안",
                f"견적명: {estimate.title}",
                f"용역명: {estimate.serviceName}",
                f"항목: {', '.join(item_lines)}",
                f"총액: {estimate.totalAmount:,}원",
            ]
        )

    def _calculate_split_items(self, contract: Contract, amount: int) -> list[PaymentSplitItem]:
        parties = [item for item in self.repository.list_contract_parties(contract.id) if item.role.startswith("client")]
        if not parties:
            return []
        normalized: list[PaymentSplitItem] = []
        remaining = amount
        for index, party in enumerate(parties, start=1):
            ratio = float(party.shareRatio or 0)
            split_amount = remaining if index == len(parties) else int(round(amount * ratio / 100))
            remaining -= split_amount
            normalized.append(
                PaymentSplitItem(
                    organizationId=party.organizationId,
                    projectPartyId=party.projectPartyId,
                    label=party.displayName,
                    ratio=ratio,
                    amount=split_amount,
                )
            )
        return normalized

    def _contract_warnings(self, contract_id: str) -> list[str]:
        contract = self._require_contract(contract_id)
        warnings: list[str] = []
        parties = [item for item in self.repository.list_contract_parties(contract_id) if item.role.startswith("client")]
        payment_terms = self.repository.list_payment_terms(contract_id)
        share_ratio_sum = round(sum(item.shareRatio or 0 for item in parties), 2)
        share_amount_sum = sum(item.shareAmount or 0 for item in parties)
        payment_sum = sum(item.amount for item in payment_terms)
        if parties and share_ratio_sum != 100:
            warnings.append("contractPartyShareRatioMismatch")
        if parties and share_amount_sum != contract.contractAmount:
            warnings.append("contractPartyShareAmountMismatch")
        if payment_terms and payment_sum != contract.contractAmount:
            warnings.append("paymentTermAmountMismatch")
        for payment_term in payment_terms:
            split_sum = sum(item.amount for item in payment_term.splitItems)
            if payment_term.splitItems and split_sum != payment_term.amount:
                warnings.append("paymentSplitAmountMismatch")
                break
        return warnings

    def _require_project(self, project_id: str):
        project = self.project_repository.get_project(project_id)
        if not project:
            raise ContractNotFoundError("project not found")
        return project

    def _require_contract(self, contract_id: str) -> Contract:
        contract = self.repository.get_contract(contract_id)
        if not contract:
            raise ContractNotFoundError("contract not found")
        return contract

    def _require_latest_version(self, contract: Contract) -> ContractVersion:
        versions = self.repository.list_contract_versions(contract.id)
        if not versions:
            raise ContractValidationError("contract version not found")
        if contract.latestVersionId:
            for version in versions:
                if version.id == contract.latestVersionId:
                    return version
        return versions[-1]

    def _add_audit_log(self, contract_id: str, action: str, summary: str, field_names: list[str]) -> AuditLog:
        return self.repository.add_audit_log(
            contract_id,
            AuditLog(
                id=f"audit-{uuid4().hex[:8]}",
                entityType="contract",
                entityId=contract_id,
                action=action,
                summary=summary,
                fieldNames=field_names,
                createdAt=self._now(),
            ),
        )

    def _increment_project_contract_count(self, project_id: str, delta: int) -> None:
        counts = self.project_repository.get_related_counts(project_id)
        counts.contracts = max(0, counts.contracts + delta)
        self.project_repository.set_related_counts(project_id, counts)

    def _sync_project_file_count(self, project_id: str) -> None:
        counts = self.project_repository.get_related_counts(project_id)
        counts.files = max(
            counts.files,
            sum(len(self.repository.list_contract_files(item.id)) for item in self.repository.list_contracts(project_id)),
        )
        self.project_repository.set_related_counts(project_id, counts)

    def _validate_contract_payload(self, payload: dict) -> None:
        if not str(payload.get("contractTitle", "")).strip():
            raise ContractValidationError("contractTitle is required")
        amount = payload.get("contractAmount")
        if amount is None or int(amount) <= 0:
            raise ContractValidationError("contractAmount must be positive")
        start_date = payload.get("contractStartDate")
        end_date = payload.get("contractEndDate")
        if start_date and end_date and start_date > end_date:
            raise ContractValidationError("contractStartDate must be before or equal to contractEndDate")
        inspection_count = payload.get("inspectionCount")
        if inspection_count is not None and int(inspection_count) < 0:
            raise ContractValidationError("inspectionCount must be a non-negative integer")
        if payload.get("status") == "signed" and not payload.get("signedFileId"):
            raise ContractValidationError("signedFileId is required before signed status")

    def _validate_payment_term_payload(self, payload: dict) -> None:
        if not str(payload.get("label", "")).strip():
            raise ContractValidationError("payment term label is required")
        if payload.get("amount") is None or int(payload["amount"]) < 0:
            raise ContractValidationError("payment term amount must be non-negative")
        if payload.get("status") == "paid" and not payload.get("paidDate"):
            raise ContractValidationError("paid payment term requires paidDate")

    def _validate_estimate_payload(self, payload: dict) -> None:
        if not str(payload.get("title", "")).strip():
            raise ContractValidationError("title is required")
        items = payload.get("items", [])
        if payload.get("status") in {"sent", "accepted", "converted"} and not items:
            raise ContractValidationError("estimate requires at least one item to export")
        expected_total = sum(item.get("totalAmount", 0) for item in items)
        if items and expected_total != payload.get("totalAmount"):
            raise ContractValidationError("estimate total must equal item totals")

    def _now(self) -> str:
        return "2026-05-09T11:00:00+09:00"
