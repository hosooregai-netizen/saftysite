# 04. Codex Implementation Prompt — 계약/견적 관리

## Prompt

```text
You are implementing the Contract and Estimate Management module for A&C 기술사 ERP.

The service is a construction safety engineering ERP for A&C 기술사사무소. The Contract module manages technical service contracts, estimates, payment terms, owner payment split, final contract files, and signed files.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Contract and Estimate module.

Existing root concepts:
- Project
- Organization
- ProjectParty
- Contact
- FileAsset
- Folder
- AuditLog

Required backend models:
- Contract
- ContractParty
- PaymentTerm
- PaymentSplitItem
- Estimate
- EstimateItem
- ContractVersion
- ContractChange
- ContractFileLink

Required backend APIs:

Contracts:
- GET /api/v1/projects/{projectId}/contracts
- POST /api/v1/projects/{projectId}/contracts
- GET /api/v1/contracts/{contractId}
- PATCH /api/v1/contracts/{contractId}
- DELETE /api/v1/contracts/{contractId}
- POST /api/v1/contracts/{contractId}/generate
- POST /api/v1/contracts/{contractId}/preview
- POST /api/v1/contracts/{contractId}/export
- POST /api/v1/contracts/{contractId}/mark-sent
- POST /api/v1/contracts/{contractId}/mark-signed

Contract Parties:
- GET /api/v1/contracts/{contractId}/parties
- POST /api/v1/contracts/{contractId}/parties
- PATCH /api/v1/contract-parties/{contractPartyId}
- DELETE /api/v1/contract-parties/{contractPartyId}
- POST /api/v1/contracts/{contractId}/parties/apply-project-parties

Payment Terms:
- GET /api/v1/contracts/{contractId}/payment-terms
- POST /api/v1/contracts/{contractId}/payment-terms
- PATCH /api/v1/payment-terms/{paymentTermId}
- DELETE /api/v1/payment-terms/{paymentTermId}
- POST /api/v1/contracts/{contractId}/payment-terms/calculate-split

Estimates:
- GET /api/v1/projects/{projectId}/estimates
- POST /api/v1/projects/{projectId}/estimates
- GET /api/v1/estimates/{estimateId}
- PATCH /api/v1/estimates/{estimateId}
- DELETE /api/v1/estimates/{estimateId}
- POST /api/v1/estimates/{estimateId}/generate
- POST /api/v1/estimates/{estimateId}/export
- POST /api/v1/estimates/{estimateId}/convert-to-contract

Files:
- POST /api/v1/contracts/{contractId}/files/upload
- GET /api/v1/contracts/{contractId}/files
- POST /api/v1/contracts/{contractId}/files/{fileId}/set-final
- POST /api/v1/contracts/{contractId}/files/{fileId}/set-signed

Required frontend routes:
- /projects/[projectId]/contracts
- /projects/[projectId]/contracts/new
- /contracts/[contractId]
- /contracts/[contractId]/edit
- /contracts/[contractId]/preview
- /contracts/[contractId]/payments
- /contracts/[contractId]/files
- /contracts/[contractId]/changes
- /projects/[projectId]/estimates
- /projects/[projectId]/estimates/new
- /estimates/[estimateId]
- /estimates/[estimateId]/preview

Required frontend components:
- ContractTable
- ContractForm
- ContractPartyTable
- ContractPartySplitEditor
- PaymentTermTable
- PaymentTermForm
- PaymentSplitMatrix
- ContractAmountSummary
- ContractStatusBadge
- ContractPreviewA4
- ContractVersionHistory
- SignedFileUploader
- EstimateTable
- EstimateForm
- EstimateItemTable
- EstimatePreviewA4

Business requirements:
1. A Contract must belong to a Project.
2. Contract can have multiple client parties.
3. ProjectParty owner records can be applied to ContractParty records.
4. ContractParty shareRatio must be used to calculate shareAmount.
5. PaymentTerm splitItems must be calculated by ContractParty shareRatio.
6. PaymentTerm split sum must match PaymentTerm amount.
7. ContractParty shareAmount sum should match Contract amount; if not, show warning.
8. Contract can be generated as a draft using the service AI prompt `contract-draft-generation`.
9. Contract export must use the latest saved ContractVersion.
10. Signed status requires a signed file.
11. Final and signed contract files must be stored in the webhard folder `/프로젝트명/00_계약_견적`.
12. Estimate can be converted to Contract.
13. All status changes should create AuditLog.
14. Contract period and inspectionCount must be exposed to the inspection schedule module.
15. Deliverables must be exposed to the document automation module.

Validation:
1. contractAmount > 0.
2. contractTitle is required.
3. contractStartDate <= contractEndDate.
4. inspectionCount is a non-negative integer.
5. paid PaymentTerm requires paidDate.
6. signed Contract requires signedFileId.
7. Estimate requires at least one item to export.
8. Estimate total must equal item totals.

Seed data:
Create a demo contract for the Leeum elevator replacement project:
- contractTitle: 리움미술관 승강기 교체공사 공사안전보건대장 이행점검 기술용역계약서
- serviceName: 한남동 승강기 교체공사(리움미술관) 기술용역
- serviceScope: 공사안전보건대장 이행점검 결과보고서 작성 및 제출
- contractAmount: 11000000
- vatIncluded: true
- inspectionCount: 10
- client_1: 삼성문화재단, shareRatio 60, shareAmount 6600000
- client_2: 삼성생명공익재단, shareRatio 40, shareAmount 4400000
- service_provider: A&C기술사사무소
- payment term 1: 1차기성, 4400000
- payment term 2: 준공금, 6600000

Tests:
- test_contract_create_success
- test_contract_amount_must_be_positive
- test_contract_apply_project_parties
- test_contract_multiple_clients_supported
- test_contract_share_ratio_calculation
- test_payment_term_split_by_ratio
- test_payment_term_split_sum_matches_amount
- test_contract_generate_creates_version
- test_contract_export_uses_latest_version
- test_contract_mark_signed_requires_signed_file
- test_estimate_create_and_convert_to_contract
- test_contract_file_saved_to_webhard_contract_folder
- test_contract_status_change_creates_audit_log

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```
