# 02. Tech Markdown — 계약/견적 관리

## 1. 기술 스택

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory Repository
- V1 Storage: MongoDB Repository Adapter
- File Layer: Local Storage MVP → Object Storage V1
- API namespace: `/api/v1`

## 2. Frontend Routes

```text
/projects/[projectId]/contracts
/projects/[projectId]/contracts/new
/contracts/[contractId]
/contracts/[contractId]/edit
/contracts/[contractId]/preview
/contracts/[contractId]/payments
/contracts/[contractId]/files
/contracts/[contractId]/changes

/projects/[projectId]/estimates
/projects/[projectId]/estimates/new
/estimates/[estimateId]
/estimates/[estimateId]/preview
```

## 3. Frontend Components

```text
ContractListPage
ContractCreatePage
ContractDetailPage
ContractPreviewPage
ContractPaymentPage
ContractFilePage
ContractChangePage

ContractTable
ContractForm
ContractPartyTable
ContractPartySplitEditor
PaymentTermTable
PaymentTermForm
PaymentSplitMatrix
ContractAmountSummary
ContractStatusBadge
ContractPreviewA4
ContractVersionHistory
SignedFileUploader
ContractFileList
ContractChangeTimeline

EstimateTable
EstimateForm
EstimateItemTable
EstimatePreviewA4
EstimateConvertButton
```

## 4. Backend APIs

### Contracts

```text
GET    /api/v1/projects/{projectId}/contracts
POST   /api/v1/projects/{projectId}/contracts
GET    /api/v1/contracts/{contractId}
PATCH  /api/v1/contracts/{contractId}
DELETE /api/v1/contracts/{contractId}

POST   /api/v1/contracts/{contractId}/generate
POST   /api/v1/contracts/{contractId}/preview
POST   /api/v1/contracts/{contractId}/export
POST   /api/v1/contracts/{contractId}/mark-sent
POST   /api/v1/contracts/{contractId}/mark-signed
```

### Contract Parties

```text
GET    /api/v1/contracts/{contractId}/parties
POST   /api/v1/contracts/{contractId}/parties
PATCH  /api/v1/contract-parties/{contractPartyId}
DELETE /api/v1/contract-parties/{contractPartyId}
POST   /api/v1/contracts/{contractId}/parties/apply-project-parties
```

### Payment Terms

```text
GET    /api/v1/contracts/{contractId}/payment-terms
POST   /api/v1/contracts/{contractId}/payment-terms
PATCH  /api/v1/payment-terms/{paymentTermId}
DELETE /api/v1/payment-terms/{paymentTermId}
POST   /api/v1/contracts/{contractId}/payment-terms/calculate-split
```

### Estimates

```text
GET    /api/v1/projects/{projectId}/estimates
POST   /api/v1/projects/{projectId}/estimates
GET    /api/v1/estimates/{estimateId}
PATCH  /api/v1/estimates/{estimateId}
DELETE /api/v1/estimates/{estimateId}

POST   /api/v1/estimates/{estimateId}/generate
POST   /api/v1/estimates/{estimateId}/export
POST   /api/v1/estimates/{estimateId}/convert-to-contract
```

### Files

```text
POST /api/v1/contracts/{contractId}/files/upload
GET  /api/v1/contracts/{contractId}/files
POST /api/v1/contracts/{contractId}/files/{fileId}/set-final
POST /api/v1/contracts/{contractId}/files/{fileId}/set-signed
```

## 5. Data Models

### Contract

```ts
type ContractStatus =
  | 'draft'
  | 'review'
  | 'sent'
  | 'signed'
  | 'cancelled'
  | 'archived'

type ContractType =
  | 'technical_service'
  | 'inspection'
  | 'consulting'
  | 'other'

type Contract = {
  id: string
  projectId: string
  contractNo?: string
  contractTitle: string
  contractType: ContractType
  serviceName: string
  serviceScope: string
  contractAmount: number
  vatIncluded: boolean
  vatAmount?: number
  supplyAmount?: number
  contractStartDate?: string
  contractEndDate?: string
  constructionStartDate?: string
  constructionEndDate?: string
  deliverables: string[]
  inspectionCount?: number
  paymentSummary?: string
  status: ContractStatus
  finalFileId?: string
  signedFileId?: string
  createdAt: string
  updatedAt: string
}
```

### ContractParty

```ts
type ContractPartyRole =
  | 'client'
  | 'client_1'
  | 'client_2'
  | 'contractor'
  | 'service_provider'
  | 'payer'
  | 'observer'

type ContractParty = {
  id: string
  contractId: string
  organizationId: string
  projectPartyId?: string
  role: ContractPartyRole
  displayName: string
  representativeName?: string
  businessNumber?: string
  address?: string
  phone?: string
  shareRatio?: number
  shareAmount?: number
  paymentRequired: boolean
  signingRequired: boolean
  displayOrder: number
}
```

### PaymentTerm

```ts
type PaymentStatus =
  | 'planned'
  | 'requested'
  | 'paid'
  | 'overdue'
  | 'cancelled'

type PaymentTerm = {
  id: string
  contractId: string
  label: string
  triggerText: string
  dueDate?: string
  amount: number
  ratio?: number
  status: PaymentStatus
  requestDate?: string
  paidDate?: string
  evidenceFileId?: string
  splitItems: PaymentSplitItem[]
  createdAt: string
  updatedAt: string
}

type PaymentSplitItem = {
  organizationId: string
  projectPartyId?: string
  label: string
  ratio: number
  amount: number
}
```

### Estimate

```ts
type EstimateStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'converted'

type Estimate = {
  id: string
  projectId: string
  estimateNo?: string
  title: string
  serviceName: string
  validUntil?: string
  status: EstimateStatus
  supplyAmount: number
  vatAmount: number
  totalAmount: number
  items: EstimateItem[]
  finalFileId?: string
  createdAt: string
  updatedAt: string
}

type EstimateItem = {
  id: string
  name: string
  description?: string
  quantity: number
  unit: string
  unitPrice: number
  supplyAmount: number
  vatAmount: number
  totalAmount: number
}
```

### ContractVersion

```ts
type ContractVersion = {
  id: string
  contractId: string
  versionNo: number
  status: 'draft' | 'review' | 'final' | 'signed'
  contentSnapshot: Record<string, unknown>
  fileId?: string
  createdBy: string
  createdAt: string
}
```

### ContractChange

```ts
type ContractChange = {
  id: string
  contractId: string
  changeNo: number
  reason: string
  previousAmount?: number
  changedAmount?: number
  previousEndDate?: string
  changedEndDate?: string
  changedScope?: string
  agreementFileId?: string
  approvedAt?: string
  createdAt: string
}
```

## 6. Repository Interface

```ts
interface ContractRepository {
  listByProject(projectId: string): Promise<Contract[]>
  getById(contractId: string): Promise<Contract | null>
  create(input: ContractCreateInput): Promise<Contract>
  update(contractId: string, input: ContractUpdateInput): Promise<Contract>
  delete(contractId: string): Promise<void>
}

interface PaymentTermRepository {
  listByContract(contractId: string): Promise<PaymentTerm[]>
  create(input: PaymentTermCreateInput): Promise<PaymentTerm>
  update(paymentTermId: string, input: PaymentTermUpdateInput): Promise<PaymentTerm>
  delete(paymentTermId: string): Promise<void>
}
```

## 7. Validation Rules

### Contract

- `projectId`는 필수다.
- `contractTitle`은 필수다.
- `contractAmount`는 0보다 커야 한다.
- `contractStartDate`가 `contractEndDate`보다 늦을 수 없다.
- `inspectionCount`는 0 이상 정수다.
- `signed` 상태로 변경하려면 `signedFileId`가 필요하다.
- 관련 문서나 제출 이력이 있으면 삭제는 soft delete 또는 차단을 기본으로 한다.

### ContractParty

- client 또는 client_1/client_2가 하나 이상 필요하다.
- service_provider는 하나 이상 필요하다.
- shareRatio 합계가 100이 아니면 warning을 표시한다.
- shareAmount 합계가 contractAmount와 다르면 warning을 표시한다.
- signingRequired가 true인 party는 날인본 확인 대상이다.

### PaymentTerm

- amount는 0보다 커야 한다.
- splitItems의 합계는 amount와 일치해야 한다.
- paid 상태로 변경하려면 paidDate가 필요하다.
- paid 상태에서는 evidenceFileId를 권장한다.

### Estimate

- export에는 item이 1개 이상 필요하다.
- quantity와 unitPrice는 0 이상이어야 한다.
- totalAmount는 item 합계와 일치해야 한다.

## 8. Service Rules

### ProjectParty 적용

```text
ProjectParty.role = owner      → ContractParty.role = client/client_1/client_2
ProjectParty.role = engineer   → ContractParty.role = service_provider
ProjectParty.role = contractor → ContractParty.role = observer 또는 contractor
```

### 발주처별 분담금액 계산

```text
shareAmount = contractAmount * shareRatio / 100
```

원 단위 반올림이 필요한 경우 마지막 항목에서 보정한다.

### 지급조건 분할 계산

```text
paymentSplitAmount = paymentTerm.amount * contractParty.shareRatio / 100
```

### 계약서 생성

```text
1. Project 조회
2. Contract 조회
3. ContractParty 조회
4. PaymentTerm 조회
5. DocumentTemplate 조회
6. 변수 매핑
7. 누락정보 검출
8. AI 초안 생성
9. ContractVersion 저장
10. 미리보기 반환
```

### Export

```text
1. 현재 계약서 draft 저장
2. 최신 ContractVersion 재조회
3. PDF/HWPX 생성
4. FileAsset 생성
5. 웹하드 /프로젝트명/00_계약_견적 저장
6. finalFileId 또는 signedFileId 연결
7. AuditLog 기록
```

## 9. API Response Example

```json
{
  "contract": {
    "id": "contract_leeum_safety_2026",
    "projectId": "project_leeum_elevator_2026",
    "contractTitle": "리움미술관 승강기 교체공사 공사안전보건대장 이행점검 기술용역계약서",
    "contractType": "technical_service",
    "serviceName": "한남동 승강기 교체공사(리움미술관) 기술용역",
    "serviceScope": "공사안전보건대장 이행점검 결과보고서 작성 및 제출",
    "contractAmount": 11000000,
    "vatIncluded": true,
    "inspectionCount": 10,
    "status": "signed"
  },
  "parties": [
    {"displayName": "삼성문화재단", "role": "client_1", "shareRatio": 60, "shareAmount": 6600000},
    {"displayName": "삼성생명공익재단", "role": "client_2", "shareRatio": 40, "shareAmount": 4400000},
    {"displayName": "A&C기술사사무소", "role": "service_provider"}
  ],
  "paymentTerms": [
    {"label": "1차기성", "amount": 4400000},
    {"label": "준공금", "amount": 6600000}
  ]
}
```

## 10. Tests

```text
test_contract_create_success
test_contract_requires_project
test_contract_amount_must_be_positive
test_contract_apply_project_parties
test_contract_multiple_clients_supported
test_contract_share_ratio_calculation
test_contract_share_amount_sum_warning
test_payment_term_split_by_ratio
test_payment_term_split_sum_matches_amount
test_contract_generate_creates_version
test_contract_export_uses_latest_version
test_contract_mark_signed_requires_signed_file
test_estimate_create_and_convert_to_contract
test_contract_file_saved_to_webhard_contract_folder
test_contract_status_change_creates_audit_log
```
