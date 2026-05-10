# 02. Tech Markdown — 현장점검 체크리스트

## 1. Frontend Routes

```text
/projects/[projectId]/checklist-templates
/projects/[projectId]/inspections/[inspectionRoundId]/checklist
/inspections/[inspectionRoundId]/checklist
/inspections/[inspectionRoundId]/checklist/mobile
/inspections/[inspectionRoundId]/checklist/review
/checklist-sessions/[sessionId]
/checklist-sessions/[sessionId]/results
/checklist-sessions/[sessionId]/finding-candidates
/checklist-sessions/[sessionId]/photos
/admin/checklist-templates
/admin/checklist-templates/[templateId]
```

## 2. Frontend Components

```text
ChecklistSessionPage
ChecklistMobilePage
ChecklistReviewPage
ChecklistTemplateAdminPage
ChecklistSessionHeader
ChecklistProgressBar
ChecklistCategoryTabs
ChecklistItemCard
ChecklistResultRadioGroup
ChecklistResultTable
ChecklistResultMatrix
ChecklistCommentField
ChecklistPhotoUploader
ChecklistFindingCandidateDrawer
ChecklistFindingCandidateTable
ChecklistBulkActionBar
ChecklistMissingInputPanel
ChecklistReportMappingPanel
ChecklistVersionBadge
RiskReductionChecklistTable
AdditionalHazardChecklistTable
MobileChecklistBottomBar
OfflineDraftIndicator
```

## 3. Backend APIs

### Templates

```text
GET    /api/v1/checklist-templates
POST   /api/v1/checklist-templates
GET    /api/v1/checklist-templates/{templateId}
PATCH  /api/v1/checklist-templates/{templateId}
DELETE /api/v1/checklist-templates/{templateId}
POST   /api/v1/checklist-templates/{templateId}/publish
POST   /api/v1/checklist-templates/{templateId}/clone
```

### Template Items

```text
GET    /api/v1/checklist-templates/{templateId}/items
POST   /api/v1/checklist-templates/{templateId}/items
PATCH  /api/v1/checklist-items/{itemId}
DELETE /api/v1/checklist-items/{itemId}
POST   /api/v1/checklist-templates/{templateId}/items/reorder
```

### Checklist Sessions

```text
GET    /api/v1/inspection-rounds/{inspectionRoundId}/checklist-sessions
POST   /api/v1/inspection-rounds/{inspectionRoundId}/checklist-sessions
GET    /api/v1/checklist-sessions/{sessionId}
PATCH  /api/v1/checklist-sessions/{sessionId}
POST   /api/v1/checklist-sessions/{sessionId}/start
POST   /api/v1/checklist-sessions/{sessionId}/pause
POST   /api/v1/checklist-sessions/{sessionId}/complete
POST   /api/v1/checklist-sessions/{sessionId}/review
POST   /api/v1/checklist-sessions/{sessionId}/lock
```

### Results

```text
GET   /api/v1/checklist-sessions/{sessionId}/results
POST  /api/v1/checklist-sessions/{sessionId}/results
PATCH /api/v1/checklist-results/{resultId}
POST  /api/v1/checklist-sessions/{sessionId}/results/bulk-save
POST  /api/v1/checklist-sessions/{sessionId}/results/fill-not-applicable
POST  /api/v1/checklist-sessions/{sessionId}/results/validate
```

### Finding Candidates

```text
GET  /api/v1/checklist-sessions/{sessionId}/finding-candidates
POST /api/v1/checklist-results/{resultId}/finding-candidate
POST /api/v1/finding-candidates/{candidateId}/accept
POST /api/v1/finding-candidates/{candidateId}/dismiss
POST /api/v1/finding-candidates/{candidateId}/convert-to-finding
```

### Photos / Report / Mobile

```text
POST /api/v1/checklist-results/{resultId}/photos/upload
GET  /api/v1/checklist-results/{resultId}/photos
POST /api/v1/checklist-results/{resultId}/photos/link
POST /api/v1/checklist-photos/{photoId}/unlink
GET  /api/v1/checklist-sessions/{sessionId}/report-mapping
POST /api/v1/checklist-sessions/{sessionId}/summarize
POST /api/v1/checklist-sessions/{sessionId}/sync-to-report
POST /api/v1/checklist-sessions/{sessionId}/mobile-drafts
GET  /api/v1/checklist-sessions/{sessionId}/mobile-drafts/{draftId}
POST /api/v1/checklist-sessions/{sessionId}/mobile-drafts/{draftId}/commit
```

## 4. Data Models

```ts
type ChecklistTemplateStatus = 'draft' | 'published' | 'archived'
type ChecklistCategoryKey = 'common' | 'architecture_civil' | 'construction_machine' | 'risk_reduction' | 'additional_hazard' | 'custom'
type ChecklistSessionStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'reviewed' | 'locked'
type ChecklistResultValue = 'not_checked' | 'good' | 'caution' | 'bad' | 'not_applicable'
type FindingCandidateStatus = 'candidate' | 'accepted' | 'dismissed' | 'converted'

type ChecklistTemplate = {
  id: string
  name: string
  description?: string
  projectType?: string
  documentType: 'safety_health_ledger_inspection_report'
  version: string
  status: ChecklistTemplateStatus
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

type ChecklistItem = {
  id: string
  templateId: string
  categoryId: string
  categoryKey: ChecklistCategoryKey
  discipline?: string
  title: string
  detail?: string
  reportLabel?: string
  defaultApplicability: boolean
  isRequired: boolean
  findingRequiredWhen?: 'caution' | 'bad' | 'caution_or_bad' | 'never'
  sourceSectionKey?: string
  displayOrder: number
}

type ChecklistSession = {
  id: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId?: string
  templateId: string
  templateVersion: string
  inspectorUserId?: string
  inspectionDate?: string
  status: ChecklistSessionStatus
  startedAt?: string
  completedAt?: string
  reviewedAt?: string
  lockedAt?: string
}

type ChecklistResult = {
  id: string
  sessionId: string
  projectId: string
  inspectionRoundId: string
  checklistItemId: string
  result: ChecklistResultValue
  comment?: string
  reportComment?: string
  actionRequired: boolean
  responsiblePartyId?: string
  dueDate?: string
  photoIds: string[]
  findingCandidateId?: string
  findingId?: string
  reportMappingStatus: 'not_mapped' | 'mapped' | 'excluded'
}

type FindingCandidate = {
  id: string
  projectId: string
  inspectionRoundId: string
  sessionId: string
  checklistResultId: string
  title: string
  detail: string
  riskType?: string
  requiredAction: string
  status: FindingCandidateStatus
  convertedFindingId?: string
  dismissedReason?: string
}

type AdditionalHazardItem = {
  id: string
  sessionId: string
  no: number
  hazardDescription: string
  contractorPlan?: string
  checkPoint?: string
  implementationStatus: 'implemented' | 'not_implemented' | 'not_applicable' | 'not_checked'
  note?: string
  photoIds: string[]
  findingCandidateId?: string
  findingId?: string
}
```

## 5. Validation Rules

- `ChecklistSession.projectId`, `inspectionRoundId`, `templateId`는 필수다.
- `locked` 상태에서는 결과를 수정할 수 없다.
- `completed` 상태가 되려면 필수 항목이 모두 입력되어야 한다.
- `caution` 또는 `bad`는 comment 입력을 권장한다.
- `caution` 또는 `bad`에서 조건이 충족되면 FindingCandidate를 생성한다.
- `not_applicable`은 사유 입력을 권장한다.
- 추가 유해·위험요인 `not_implemented`는 FindingCandidate 생성을 권장한다.

## 6. Service Rules

### Checklist Session 생성

```text
1. InspectionRound 조회
2. Project 조회
3. published ChecklistTemplate 조회
4. ChecklistSession 생성
5. Template의 ChecklistItem 기준으로 ChecklistResult 초기 생성
6. RiskReduction 기본 20개 항목 생성
7. AuditLog 기록
```

### 결과 저장

```text
1. session status 확인
2. locked 여부 확인
3. result validation
4. ChecklistResult 저장
5. caution/bad이면 FindingCandidate 생성 또는 갱신
6. reportMappingStatus 갱신
7. session progress 재계산
```

### 보고서 매핑

| Checklist Category | Report Section |
|---|---|
| common | inspection_checklist |
| architecture_civil | inspection_checklist |
| construction_machine | inspection_checklist |
| risk_reduction | risk_reduction_checklist |
| additional_hazard | additional_hazard_checklist, photo_ledger |

## 7. Seed Template Items

기본 템플릿명: `공사안전보건대장 이행확인 표준 점검표`

- common: 안전관리 계획, 교육/PPE, 안전관리조직/비상연락망, 재해·재난 대비, 휴게시설
- architecture_civil: 추락/낙하, 비계, 가설통로, 조도, 충돌/협착, 전기, 화재/질식, 위험물, 흙막이, 동바리, 주변 안전, 굴착/비탈면, 배수로, 주변 지반, 지하매설물
- construction_machine: 건설기계 관리 상태
- risk_reduction: 가설분전반, 가설전선, 사다리, 말비계, 화기취급, 이동식 크레인, 지게차, 고속절단기, 용접기 등 20개

## 8. Tests

```text
test_checklist_template_create_success
test_checklist_session_create_from_template
test_checklist_session_initializes_results
test_checklist_session_generates_risk_reduction_items
test_checklist_result_save_good
test_checklist_result_caution_creates_finding_candidate
test_checklist_result_bad_creates_finding_candidate
test_checklist_result_not_applicable_requires_reason_warning
test_checklist_bulk_save_success
test_checklist_locked_session_prevents_update
test_additional_hazard_create_success
test_additional_hazard_not_implemented_creates_candidate
test_checklist_photo_upload_links_result
test_checklist_complete_requires_required_items
test_checklist_summary_generates_report_mapping
test_checklist_mobile_draft_commit
test_checklist_report_sync_to_safety_report
```
