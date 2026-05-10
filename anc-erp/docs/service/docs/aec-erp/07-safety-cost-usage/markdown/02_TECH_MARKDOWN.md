# 02. Tech Markdown — 산업안전보건관리비 사용내용 확인

## 1. Frontend Routes

```text
/projects/[projectId]/safety-costs
/projects/[projectId]/safety-costs/owner-matrix
/inspections/[inspectionRoundId]/safety-costs
/inspections/[inspectionRoundId]/safety-costs/new
/safety-costs/[usageId]
/safety-costs/[usageId]/edit
/safety-costs/[usageId]/evidence
/safety-costs/[usageId]/review
/safety-costs/[usageId]/preview
/safety-costs/[usageId]/history
/documents/safety-reports/[documentId]/safety-cost-usage
```

## 2. Frontend Components

```text
SafetyCostUsageListPage
SafetyCostUsageDetailPage
SafetyCostUsageFormPage
SafetyCostOwnerMatrixPage
SafetyCostEvidencePage
SafetyCostReviewPage
SafetyCostPreviewPage

SafetyCostSummaryCard
SafetyCostUsageForm
SafetyCostUsageRateGauge
SafetyCostOwnerMatrix
SafetyCostEvidenceUploader
SafetyCostEvidenceTable
SafetyCostCommentGeneratorPanel
SafetyCostReviewPanel
SafetyCostStatusBadge
SafetyCostWarningPanel
SafetyCostReportPreviewCard
SafetyCostHistoryTimeline
SafetyCostSyncToReportButton
```

## 3. Backend APIs

### Usage

```text
GET    /api/v1/projects/{projectId}/safety-cost-usages
GET    /api/v1/inspection-rounds/{inspectionRoundId}/safety-cost-usages
POST   /api/v1/inspection-rounds/{inspectionRoundId}/safety-cost-usages
GET    /api/v1/safety-cost-usages/{usageId}
PATCH  /api/v1/safety-cost-usages/{usageId}
DELETE /api/v1/safety-cost-usages/{usageId}

POST   /api/v1/safety-cost-usages/{usageId}/calculate-rate
POST   /api/v1/safety-cost-usages/{usageId}/validate
POST   /api/v1/safety-cost-usages/{usageId}/generate-comment
POST   /api/v1/safety-cost-usages/{usageId}/review
POST   /api/v1/safety-cost-usages/{usageId}/confirm
POST   /api/v1/safety-cost-usages/{usageId}/sync-to-report
GET    /api/v1/projects/{projectId}/safety-cost-usages/owner-matrix
```

### Evidence

```text
GET    /api/v1/safety-cost-usages/{usageId}/evidence
POST   /api/v1/safety-cost-usages/{usageId}/evidence/upload
POST   /api/v1/safety-cost-usages/{usageId}/evidence/link-file
PATCH  /api/v1/safety-cost-evidence/{evidenceId}
DELETE /api/v1/safety-cost-evidence/{evidenceId}
```

### History / Report

```text
GET  /api/v1/safety-cost-usages/{usageId}/history
GET  /api/v1/documents/{documentId}/safety-cost-usage
POST /api/v1/documents/{documentId}/safety-cost-usage/refresh
```

## 4. Data Models

```ts
type SafetyCostUsageStatus =
  | 'draft'
  | 'needs_evidence'
  | 'review'
  | 'confirmed'
  | 'synced_to_report'
  | 'rejected'
  | 'archived'

type SafetyCostAppropriatenessStatus =
  | 'not_reviewed'
  | 'appropriate'
  | 'needs_review'
  | 'insufficient_evidence'
  | 'inappropriate'

type SafetyCostUsage = {
  id: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId: string
  calculatedAmount: number
  usedAmount: number
  usedRateCalculated: number
  userEnteredRate?: number
  basisMonth?: string
  basisDate?: string
  basisDocumentText?: string
  appropriatenessComment?: string
  appropriatenessStatus: SafetyCostAppropriatenessStatus
  status: SafetyCostUsageStatus
  confirmedBy?: string
  confirmedAt?: string
  reportInclude: boolean
  syncedDocumentId?: string
  createdAt: string
  updatedAt: string
}

type SafetyCostEvidenceType =
  | 'safety_cost_usage_statement'
  | 'receipt'
  | 'invoice'
  | 'photo_evidence'
  | 'internal_summary'
  | 'owner_submitted_file'
  | 'other'

type SafetyCostEvidence = {
  id: string
  safetyCostUsageId: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId: string
  fileId: string
  evidenceType: SafetyCostEvidenceType
  fileName: string
  issuedDate?: string
  submittedBy?: string
  memo?: string
  createdAt: string
  updatedAt: string
}

type SafetyCostReview = {
  id: string
  safetyCostUsageId: string
  reviewerId: string
  reviewedAt: string
  reviewComment: string
  appropriatenessStatus: SafetyCostAppropriatenessStatus
  aiDraftComment?: string
}

type SafetyCostValidationWarning = {
  type:
    | 'rate_mismatch'
    | 'used_amount_exceeds_calculated'
    | 'missing_basis_month'
    | 'missing_basis_document'
    | 'missing_evidence'
    | 'owner_mismatch'
    | 'not_confirmed'
  severity: 'info' | 'warning' | 'danger'
  message: string
}
```

## 5. Validation Rules

1. `projectId`, `inspectionRoundId`, `ownerPartyId`는 필수다.
2. `ownerPartyId`는 해당 프로젝트의 발주처 ProjectParty여야 한다.
3. `calculatedAmount`는 0보다 커야 한다.
4. `usedAmount`는 0 이상이어야 한다.
5. `usedAmount > calculatedAmount`이면 danger warning이다.
6. `usedRateCalculated = usedAmount / calculatedAmount * 100`, 소수점 1자리 반올림.
7. `userEnteredRate`가 계산값과 다르면 rate_mismatch warning이다.
8. `basisMonth` 또는 `basisDate`는 확정 전 필수다.
9. `basisDocumentText` 또는 evidenceItems 1개 이상은 확정 전 필수다.
10. AI draft comment는 최종 적정성 의견이 아니다.
11. 발주처별 금액이 섞이면 danger warning이다.

## 6. Service Rules

### 안전관리비 생성

```text
1. Project 확인
2. InspectionRound 확인
3. ownerPartyId 확인
4. 동일 inspectionRoundId + ownerPartyId 중복 확인
5. 사용률 계산
6. SafetyCostUsage 저장
7. HistoryEvent 생성
8. AuditLog 기록
```

### 적정성 의견 생성

```text
1. SafetyCostUsage 조회
2. Evidence 조회
3. 관련 Checklist/Finding 요약 조회
4. 사용률과 기준월 확인
5. service-ai prompt 호출
6. appropriatenessComment draft 저장
7. status = review
```

### 확정

```text
1. validate 실행
2. danger warning 확인
3. reviewer 또는 confirmer 확인
4. appropriatenessStatus 저장
5. status = confirmed
6. HistoryEvent 생성
```

### 보고서 동기화

```text
1. SafetyCostUsage confirmed 확인
2. DocumentInstance 조회
3. safety_cost_usage section 업데이트
4. project_summary 총평의 사용률 문구 업데이트
5. implementation_confirmation 예산관리 문구 업데이트
6. DocumentVersion 생성
7. SafetyCostUsage.status = synced_to_report
```

## 7. Report Mapping

| Source | Target Report Section |
|---|---|
| calculatedAmount | safety_cost_usage.calculatedAmount |
| usedAmount | safety_cost_usage.usedAmount |
| usedRate | safety_cost_usage.usedRate |
| basisMonth | safety_cost_usage.basisMonth |
| basisDocumentText | safety_cost_usage.basisDocument |
| appropriatenessComment | safety_cost_usage.appropriateness |
| usedRate | project_summary.generalComment |
| appropriatenessComment | implementation_confirmation.documentManagement.budget |

## 8. Seed Data

```json
{
  "culture": {
    "ownerName": "삼성문화재단",
    "calculatedAmount": 99462613,
    "usedAmount": 37978000,
    "usedRate": 38.2,
    "basisMonth": "1월말",
    "basisDocumentText": "산업안전보건관리비 사용내역서",
    "appropriatenessComment": "공사 특수성을 반영, 적정하게 사용 중으로 판단됨"
  },
  "public": {
    "ownerName": "삼성생명공익재단",
    "calculatedAmount": 66928618,
    "usedAmount": 27117450,
    "usedRate": 40.5,
    "basisMonth": "1월말",
    "basisDocumentText": "산업안전보건관리비 사용내역서",
    "appropriatenessComment": "공사 특수성을 반영, 적정하게 사용 중으로 판단됨"
  }
}
```

## 9. Tests

```text
test_safety_cost_create_success
test_safety_cost_requires_project_round_owner
test_safety_cost_owner_party_must_be_owner
test_safety_cost_calculates_used_rate
test_safety_cost_rate_mismatch_warning
test_safety_cost_used_amount_exceeds_calculated_amount_warning
test_safety_cost_requires_basis_for_confirm
test_safety_cost_evidence_upload_link_file
test_safety_cost_generate_comment
test_safety_cost_review_create_success
test_safety_cost_confirm_success
test_safety_cost_confirm_blocked_without_evidence
test_safety_cost_sync_to_report_updates_sections
test_safety_cost_history_created_on_amount_update
test_safety_cost_owner_matrix_returns_all_owners
test_safety_cost_report_export_missing_warning
```
