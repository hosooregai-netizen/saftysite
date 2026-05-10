# 02. Tech Markdown — 안전보건대장 자동화

## 1. Frontend Routes

```text
/projects/[projectId]/safety-health-ledgers
/projects/[projectId]/safety-health-ledgers/new
/safety-health-ledgers/[ledgerId]
/safety-health-ledgers/[ledgerId]/edit
/safety-health-ledgers/[ledgerId]/risks
/safety-health-ledgers/[ledgerId]/measures
/safety-health-ledgers/[ledgerId]/inspections
/safety-health-ledgers/[ledgerId]/findings
/safety-health-ledgers/[ledgerId]/safety-costs
/safety-health-ledgers/[ledgerId]/attachments
/safety-health-ledgers/[ledgerId]/preview
/safety-health-ledgers/[ledgerId]/export
/safety-health-ledgers/[ledgerId]/versions
```

## 2. Frontend Components

```text
SafetyHealthLedgerListPage
SafetyHealthLedgerCreatePage
SafetyHealthLedgerDetailPage
SafetyHealthLedgerEditorPage
SafetyHealthLedgerPreviewPage

LedgerWizard
LedgerStatusBadge
LedgerSectionNavigator
LedgerSectionEditor
LedgerA4Preview
LedgerMissingFieldPanel
LedgerReviewWarningPanel
LedgerVersionHistory
LedgerExportChecklist

LedgerRiskRegisterTable
LedgerRiskItemForm
LedgerRiskStatusBadge
RiskReductionMeasureTable
RiskRecurrenceBadge

LedgerInspectionHistoryTable
LedgerFindingHistoryTable
LedgerActionHistoryTimeline
LedgerSafetyCostHistoryTable
LedgerAttachmentPanel
LedgerSourceLinkPanel
LedgerSyncPreviewModal
```

## 3. Backend APIs

### Ledgers

```text
GET    /api/v1/projects/{projectId}/safety-health-ledgers
POST   /api/v1/projects/{projectId}/safety-health-ledgers
GET    /api/v1/safety-health-ledgers/{ledgerId}
PATCH  /api/v1/safety-health-ledgers/{ledgerId}
DELETE /api/v1/safety-health-ledgers/{ledgerId}

POST   /api/v1/safety-health-ledgers/{ledgerId}/generate
POST   /api/v1/safety-health-ledgers/{ledgerId}/validate
POST   /api/v1/safety-health-ledgers/{ledgerId}/confirm
POST   /api/v1/safety-health-ledgers/{ledgerId}/export
POST   /api/v1/safety-health-ledgers/{ledgerId}/archive
```

### Sections

```text
GET   /api/v1/safety-health-ledgers/{ledgerId}/sections
POST  /api/v1/safety-health-ledgers/{ledgerId}/sections/{sectionKey}/save
POST  /api/v1/safety-health-ledgers/{ledgerId}/sections/{sectionKey}/regenerate
PATCH /api/v1/safety-health-ledger-sections/{sectionId}
```

### Risk Register

```text
GET    /api/v1/safety-health-ledgers/{ledgerId}/risks
POST   /api/v1/safety-health-ledgers/{ledgerId}/risks
PATCH  /api/v1/safety-health-ledger-risks/{riskId}
DELETE /api/v1/safety-health-ledger-risks/{riskId}
POST   /api/v1/safety-health-ledgers/{ledgerId}/risks/import-from-plan
POST   /api/v1/safety-health-ledgers/{ledgerId}/risks/detect-recurrence
```

### Measures

```text
GET   /api/v1/safety-health-ledgers/{ledgerId}/measures
POST  /api/v1/safety-health-ledgers/{ledgerId}/measures
PATCH /api/v1/safety-health-ledger-measures/{measureId}
DELETE /api/v1/safety-health-ledger-measures/{measureId}
```

### Histories

```text
GET  /api/v1/safety-health-ledgers/{ledgerId}/inspection-history
POST /api/v1/safety-health-ledgers/{ledgerId}/inspection-history/sync

GET  /api/v1/safety-health-ledgers/{ledgerId}/finding-history
POST /api/v1/safety-health-ledgers/{ledgerId}/finding-history/sync

GET  /api/v1/safety-health-ledgers/{ledgerId}/safety-cost-history
POST /api/v1/safety-health-ledgers/{ledgerId}/safety-cost-history/sync
```

### Attachments / Versions

```text
GET  /api/v1/safety-health-ledgers/{ledgerId}/attachments
POST /api/v1/safety-health-ledgers/{ledgerId}/attachments
DELETE /api/v1/safety-health-ledger-attachments/{attachmentId}

GET  /api/v1/safety-health-ledgers/{ledgerId}/versions
GET  /api/v1/safety-health-ledger-versions/{versionId}
POST /api/v1/safety-health-ledgers/{ledgerId}/versions
```

## 4. Data Models

### SafetyHealthLedger

```ts
type SafetyHealthLedgerStatus =
  | 'draft'
  | 'review'
  | 'confirmed'
  | 'exported'
  | 'archived'

type SafetyHealthLedger = {
  id: string
  projectId: string
  templateId: string
  title: string
  status: SafetyHealthLedgerStatus
  currentVersionNo: number
  latestSnapshot: SafetyHealthLedgerSnapshot
  exportedFileId?: string
  createdAt: string
  updatedAt: string
}
```

### SafetyHealthLedgerSnapshot

```ts
type SafetyHealthLedgerSnapshot = {
  meta: LedgerMeta
  sections: SafetyHealthLedgerSection[]
  riskItems: LedgerRiskItem[]
  measures: LedgerRiskReductionMeasure[]
  inspectionHistory: LedgerInspectionHistory[]
  findingHistory: LedgerFindingHistory[]
  safetyCostHistory: LedgerSafetyCostHistory[]
  attachments: LedgerAttachment[]
  missingFields: LedgerMissingField[]
  reviewWarnings: LedgerReviewWarning[]
  sourceLinks: LedgerSourceLink[]
}
```

### LedgerMeta

```ts
type LedgerMeta = {
  projectName: string
  siteName?: string
  siteAddress?: string
  constructionType?: string
  ownerNames: string[]
  contractorName?: string
  engineerName?: string
  constructionStartDate?: string
  constructionEndDate?: string
  latestInspectionRoundNo?: number
  latestUpdatedAt?: string
}
```

### SafetyHealthLedgerSection

```ts
type LedgerSectionKey =
  | 'basic_info'
  | 'project_summary'
  | 'stakeholders'
  | 'hazard_risk_register'
  | 'risk_reduction_measures'
  | 'design_stage_review'
  | 'construction_stage_review'
  | 'inspection_history'
  | 'finding_history'
  | 'corrective_action_history'
  | 'safety_cost_history'
  | 'attachments'
  | 'revision_history'

type SafetyHealthLedgerSection = {
  id: string
  ledgerId: string
  key: LedgerSectionKey
  title: string
  order: number
  status: 'not_started' | 'ai_draft' | 'edited' | 'review' | 'confirmed' | 'locked'
  content: Record<string, unknown>
  sourceLinks: LedgerSourceLink[]
  updatedAt: string
}
```

### LedgerRiskItem

```ts
type LedgerRiskStatus =
  | 'identified'
  | 'planned'
  | 'in_control'
  | 'needs_action'
  | 'repeated'
  | 'closed'

type LedgerRiskItem = {
  id: string
  ledgerId: string
  projectId: string
  sourceType?: 'safety_management_plan' | 'checklist' | 'finding' | 'manual'
  sourceId?: string
  workType?: string
  workDescription?: string
  hazardDescription: string
  riskType?: string
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  reductionMeasureSummary?: string
  responsibleOrganizationId?: string
  relatedChecklistItemIds: string[]
  relatedFindingIds: string[]
  recurrenceCount: number
  status: LedgerRiskStatus
  firstDetectedAt?: string
  lastDetectedAt?: string
  createdAt: string
  updatedAt: string
}
```

### LedgerRiskReductionMeasure

```ts
type LedgerRiskReductionMeasure = {
  id: string
  ledgerId: string
  riskItemId: string
  measureDetail: string
  responsibleOrganizationId?: string
  inspectionMethod?: string
  dueDate?: string
  status: 'planned' | 'in_progress' | 'implemented' | 'verified' | 'ineffective' | 'cancelled'
  verifiedBy?: string
  verifiedAt?: string
  sourceLinks: LedgerSourceLink[]
}
```

### LedgerInspectionHistory

```ts
type LedgerInspectionHistory = {
  id: string
  ledgerId: string
  inspectionRoundId: string
  roundNo: number
  documentNo?: string
  inspectionDate?: string
  checklistSessionId?: string
  summary: string
  goodCount: number
  cautionCount: number
  badCount: number
  findingCount: number
  verifiedActionCount: number
  openFindingCount: number
  linkedReportIds: string[]
  sourceLinks: LedgerSourceLink[]
}
```

### LedgerFindingHistory

```ts
type LedgerFindingHistory = {
  id: string
  ledgerId: string
  findingId: string
  inspectionRoundId: string
  ownerPartyId?: string
  title: string
  riskType?: string
  status: string
  actionSummary?: string
  verifiedAt?: string
  evidencePhotoIds: string[]
  isRepeated: boolean
  recurrenceGroupId?: string
  sourceLinks: LedgerSourceLink[]
}
```

### LedgerSafetyCostHistory

```ts
type LedgerSafetyCostHistory = {
  id: string
  ledgerId: string
  safetyCostUsageId: string
  inspectionRoundId?: string
  ownerPartyId?: string
  ownerName?: string
  basisMonth?: string
  calculatedAmount: number
  usedAmount: number
  usedRate: number
  appropriatenessStatus?: string
  evidenceFileIds: string[]
  sourceLinks: LedgerSourceLink[]
}
```

### LedgerAttachment / Version

```ts
type LedgerAttachment = {
  id: string
  ledgerId: string
  fileId: string
  attachmentType:
    | 'safety_management_plan'
    | 'safety_report'
    | 'checklist'
    | 'photo_ledger'
    | 'safety_cost'
    | 'schedule'
    | 'education'
    | 'meeting'
    | 'other'
  title: string
  linkedEntityType?: string
  linkedEntityId?: string
  createdAt: string
}

type SafetyHealthLedgerVersion = {
  id: string
  ledgerId: string
  versionNo: number
  status: 'draft' | 'review' | 'confirmed' | 'exported'
  changeReason?: string
  changedSectionKeys: LedgerSectionKey[]
  snapshot: SafetyHealthLedgerSnapshot
  exportedFileId?: string
  createdBy?: string
  createdAt: string
}
```

## 5. Validation Rules

### Ledger Creation

- `projectId`는 필수다.
- 같은 프로젝트의 active 안전보건대장은 기본 1개만 허용한다.
- 템플릿이 없으면 기본 템플릿을 사용한다.

### Risk Register

- `hazardDescription`은 필수다.
- 위험요인을 안전관리계획서에서 가져온 경우 `sourceType=safety_management_plan`과 `sourceId`를 유지한다.
- 같은 위험요인이 반복 발생하면 `recurrenceCount`를 갱신한다.

### Sync

- 점검 이력 동기화는 `InspectionRound` 기준으로 수행한다.
- 지적사항 이력 동기화는 `Finding`과 `CorrectiveAction` 기준으로 수행한다.
- 안전관리비 이력 동기화는 `SafetyCostUsage` 기준으로 수행한다.
- 원본 데이터 변경 시 stale warning을 표시한다.

### Export

- required missing field가 있으면 final export를 막는다.
- 미완료 조치가 있으면 warning을 표시한다.
- 반복 위험요인이 있으면 warning을 표시한다.
- export는 최신 저장 snapshot을 기준으로 한다.

## 6. Service Rules

### Create From Project

```text
1. Project 조회
2. ProjectParty / Contact 조회
3. 기본 SafetyHealthLedger 생성
4. 기본 sections 생성
5. SafetyManagementPlan이 있으면 risk import 후보 생성
6. LedgerVersion 1 생성
7. AuditLog 기록
```

### Import From Safety Management Plan

```text
1. SafetyManagementPlan 조회
2. RiskItem / WorkType / Section 조회
3. LedgerRiskItem 생성 또는 갱신
4. RiskReductionMeasure 생성 또는 갱신
5. sourceLinks 저장
6. recurrence 초기화
```

### Sync From Inspection Data

```text
1. InspectionRound 목록 조회
2. ChecklistSession / ChecklistResult 요약
3. Finding / CorrectiveAction 이력 조회
4. SafetyCostUsage 이력 조회
5. LedgerInspectionHistory 갱신
6. LedgerFindingHistory 갱신
7. LedgerSafetyCostHistory 갱신
8. 반복 위험요인 감지
9. LedgerVersion 생성
```

### Recurrence Detection

반복 지적 판단 기준:

```text
same riskType
or same checklistItemId
or similar normalized finding title
or same workType + same hazard keyword
```

결과:

```text
LedgerRiskItem.status = repeated
LedgerFindingHistory.isRepeated = true
reviewWarnings에 repeated_risk 추가
```

### Export Flow

```text
1. editor state 저장
2. 최신 ledger snapshot 재조회
3. validate 실행
4. PDF/HWPX renderer 호출
5. FileAsset 생성
6. 웹하드 저장
7. SafetyHealthLedger.exportedFileId 업데이트
8. SafetyHealthLedgerVersion 생성
9. AuditLog 기록
```

## 7. Tests

```text
test_safety_health_ledger_create_success
test_safety_health_ledger_prevents_duplicate_active_ledger
test_safety_health_ledger_imports_risks_from_safety_management_plan
test_ledger_risk_requires_hazard_description
test_ledger_syncs_inspection_history
test_ledger_syncs_finding_action_history
test_ledger_syncs_safety_cost_history
test_ledger_detects_repeated_risks
test_ledger_version_created_on_sync
test_ledger_export_blocked_when_required_missing
test_ledger_export_uses_latest_saved_snapshot
test_ledger_export_creates_file_asset
test_ledger_attachment_links_file_asset
test_ledger_stale_source_warning_created
```
