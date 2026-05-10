# 02. Tech Markdown — 지적사항/조치현황/사진대지

## 1. Frontend Routes

```text
/projects/[projectId]/findings
/projects/[projectId]/findings/new
/inspections/[inspectionRoundId]/findings
/inspections/[inspectionRoundId]/findings/new
/findings/[findingId]
/findings/[findingId]/edit
/findings/[findingId]/actions
/findings/[findingId]/photos
/findings/[findingId]/verify

/inspections/[inspectionRoundId]/photo-ledger
/inspections/[inspectionRoundId]/photo-ledger/new
/photo-ledgers/[photoLedgerId]
/photo-ledgers/[photoLedgerId]/edit
/photo-ledgers/[photoLedgerId]/preview
/photo-ledgers/[photoLedgerId]/export
```

## 2. Frontend Components

```text
FindingListPage
FindingDetailPage
FindingFormPage
CorrectiveActionPage
PhotoLedgerBuilderPage
PhotoLedgerPreviewPage

FindingTable
FindingStatusBadge
FindingRiskBadge
FindingForm
FindingSourceLinkPanel
FindingTimeline
FindingPhotoGallery
CorrectiveActionForm
CorrectiveActionTable
CorrectiveActionStatusBadge
VerificationPanel
ActionRequestMailButton

PhotoUploader
PhotoGrid
PhotoPairMatcher
PhotoMarkupEditor
PhotoCaptionEditor
PhotoLedgerEntryCard
PhotoLedgerEntryTable
PhotoLedgerA4Preview
PhotoLedgerExportChecklist
OwnerPhotoLedgerFilter
MissingPhotoWarningPanel
```

## 3. Backend APIs

### Findings

```text
GET    /api/v1/projects/{projectId}/findings
POST   /api/v1/projects/{projectId}/findings
GET    /api/v1/inspection-rounds/{inspectionRoundId}/findings
POST   /api/v1/inspection-rounds/{inspectionRoundId}/findings
GET    /api/v1/findings/{findingId}
PATCH  /api/v1/findings/{findingId}
DELETE /api/v1/findings/{findingId}

POST   /api/v1/findings/{findingId}/request-action
POST   /api/v1/findings/{findingId}/verify
POST   /api/v1/findings/{findingId}/reject
POST   /api/v1/findings/{findingId}/close
POST   /api/v1/findings/{findingId}/link-checklist-result
POST   /api/v1/findings/{findingId}/link-owner
```

### Corrective Actions

```text
GET    /api/v1/findings/{findingId}/actions
POST   /api/v1/findings/{findingId}/actions
GET    /api/v1/corrective-actions/{actionId}
PATCH  /api/v1/corrective-actions/{actionId}
DELETE /api/v1/corrective-actions/{actionId}

POST   /api/v1/corrective-actions/{actionId}/submit
POST   /api/v1/corrective-actions/{actionId}/verify
POST   /api/v1/corrective-actions/{actionId}/reject
```

### Photos

```text
GET    /api/v1/findings/{findingId}/photos
POST   /api/v1/findings/{findingId}/photos/upload
POST   /api/v1/findings/{findingId}/photos/link
PATCH  /api/v1/evidence-photos/{photoId}
DELETE /api/v1/evidence-photos/{photoId}

POST   /api/v1/evidence-photos/{photoId}/markup
POST   /api/v1/evidence-photos/{photoId}/set-caption
POST   /api/v1/evidence-photos/{photoId}/set-representative
```

### Photo Ledger

```text
GET    /api/v1/inspection-rounds/{inspectionRoundId}/photo-ledgers
POST   /api/v1/inspection-rounds/{inspectionRoundId}/photo-ledgers
GET    /api/v1/photo-ledgers/{photoLedgerId}
PATCH  /api/v1/photo-ledgers/{photoLedgerId}
DELETE /api/v1/photo-ledgers/{photoLedgerId}

POST   /api/v1/photo-ledgers/{photoLedgerId}/generate-entries
GET    /api/v1/photo-ledgers/{photoLedgerId}/entries
POST   /api/v1/photo-ledgers/{photoLedgerId}/entries
PATCH  /api/v1/photo-ledger-entries/{entryId}
DELETE /api/v1/photo-ledger-entries/{entryId}
POST   /api/v1/photo-ledgers/{photoLedgerId}/reorder
POST   /api/v1/photo-ledgers/{photoLedgerId}/validate
POST   /api/v1/photo-ledgers/{photoLedgerId}/export
POST   /api/v1/photo-ledgers/{photoLedgerId}/sync-to-report
```

### Mail Integration

```text
POST /api/v1/findings/action-request-mail/draft
POST /api/v1/findings/action-request-mail/send
```

## 4. Data Models

### Finding

```ts
type FindingStatus =
  | 'open'
  | 'action_requested'
  | 'action_submitted'
  | 'verification_requested'
  | 'verified'
  | 'closed'
  | 'rejected'
  | 'cancelled'

type FindingRiskType =
  | 'fall'
  | 'electric'
  | 'fire'
  | 'struck_by'
  | 'caught_between'
  | 'chemical'
  | 'health'
  | 'equipment'
  | 'document'
  | 'other'

type Finding = {
  id: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId?: string
  title: string
  detail: string
  riskType?: FindingRiskType
  requiredAction: string
  responsiblePartyId?: string
  dueDate?: string
  status: FindingStatus
  sourceType?: 'checklist_result' | 'additional_hazard' | 'risk_reduction' | 'manual' | 'photo' | 'mail'
  sourceId?: string
  checklistResultId?: string
  additionalHazardItemId?: string
  riskReductionItemId?: string
  reportInclude: boolean
  reportOrder?: number
  createdBy?: string
  createdAt: string
  updatedAt: string
}
```

### CorrectiveAction

```ts
type CorrectiveActionStatus =
  | 'draft'
  | 'submitted'
  | 'verification_requested'
  | 'verified'
  | 'rejected'
  | 'cancelled'

type CorrectiveAction = {
  id: string
  findingId: string
  projectId: string
  inspectionRoundId: string
  actionDetail: string
  actionDate?: string
  actionOrganizationId?: string
  submittedBy?: string
  submittedAt?: string
  verifiedBy?: string
  verifiedAt?: string
  verificationComment?: string
  rejectedReason?: string
  status: CorrectiveActionStatus
  createdAt: string
  updatedAt: string
}
```

### EvidencePhoto

```ts
type EvidencePhotoType =
  | 'finding_photo'
  | 'action_photo'
  | 'site_context_photo'
  | 'detail_photo'
  | 'schedule_photo'
  | 'other'

type EvidencePhoto = {
  id: string
  projectId: string
  inspectionRoundId?: string
  ownerPartyId?: string
  findingId?: string
  correctiveActionId?: string
  fileId: string
  photoType: EvidencePhotoType
  caption?: string
  takenAt?: string
  uploadedBy?: string
  isRepresentative: boolean
  reportInclude: boolean
  markupInfo?: PhotoMarkupInfo
  createdAt: string
  updatedAt: string
}
```

### PhotoMarkupInfo

```ts
type PhotoMarkupShapeType =
  | 'ellipse'
  | 'rectangle'
  | 'arrow'
  | 'text'
  | 'freehand'

type PhotoMarkupShape = {
  id: string
  type: PhotoMarkupShapeType
  x: number
  y: number
  width?: number
  height?: number
  points?: Array<{ x: number; y: number }>
  text?: string
  strokeColor?: string
  strokeStyle?: 'solid' | 'dashed'
  strokeWidth?: number
}

type PhotoMarkupInfo = {
  version: number
  imageWidth: number
  imageHeight: number
  shapes: PhotoMarkupShape[]
}
```

### PhotoLedger

```ts
type PhotoLedgerStatus =
  | 'draft'
  | 'review'
  | 'confirmed'
  | 'exported'
  | 'synced_to_report'

type PhotoLedger = {
  id: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId?: string
  documentId?: string
  title: string
  status: PhotoLedgerStatus
  layoutType: 'one_entry_per_page' | 'two_entries_per_page'
  createdAt: string
  updatedAt: string
}
```

### PhotoLedgerEntry

```ts
type PhotoLedgerEntry = {
  id: string
  photoLedgerId: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId?: string
  findingId: string
  correctiveActionId?: string
  findingTitle: string
  actionTitle?: string
  findingCaption: string
  actionCaption?: string
  findingPhotoIds: string[]
  actionPhotoIds: string[]
  representativeFindingPhotoId?: string
  representativeActionPhotoId?: string
  pageNo?: number
  displayOrder: number
  warnings: PhotoLedgerWarning[]
  createdAt: string
  updatedAt: string
}
```

### PhotoLedgerWarning

```ts
type PhotoLedgerWarning = {
  type:
    | 'missing_finding_photo'
    | 'missing_action_photo'
    | 'missing_action'
    | 'missing_caption'
    | 'unverified_action'
    | 'owner_mismatch'
    | 'file_missing'
    | 'markup_invalid'
  message: string
  severity: 'info' | 'warning' | 'danger'
}
```

## 5. Validation Rules

### Finding

- `projectId`는 필수다.
- `inspectionRoundId`는 필수다.
- `title`은 필수다.
- `requiredAction`은 `action_requested` 상태 전 필수다.
- `ownerPartyId`가 있으면 해당 project의 owner ProjectParty여야 한다.
- `closed` 상태가 되려면 verified 상태의 CorrectiveAction이 하나 이상 있어야 한다.

### CorrectiveAction

- `findingId`는 필수다.
- `actionDetail`은 submitted 상태 전 필수다.
- `verified` 상태가 되려면 `verifiedBy`와 `verifiedAt`이 필요하다.
- `rejected` 상태가 되려면 `rejectedReason`이 필요하다.

### EvidencePhoto

- `fileId`는 필수다.
- `photoType = action_photo`이면 `correctiveActionId`를 권장한다.
- `photoType = finding_photo`이면 `findingId`를 권장한다.
- `reportInclude = true`이면 `caption`을 권장한다.

### PhotoLedger

- `inspectionRoundId`는 필수다.
- entry는 최소 1개 이상이어야 export 가능하다.
- 각 entry는 `findingId`를 가져야 한다.
- `confirmed` 상태가 되려면 danger warning이 없어야 한다.
- `synced_to_report` 상태가 되려면 `documentId`가 필요하다.

## 6. Service Rules

### Finding 생성

```text
1. Project 확인
2. InspectionRound 확인
3. ownerPartyId 확인
4. sourceType/sourceId 중복 확인
5. Finding 저장
6. 지적사진 연결
7. FindingTimelineEvent 생성
8. AuditLog 기록
```

### 조치 요청

```text
1. Finding 상태 확인
2. responsiblePartyId 확인
3. requiredAction 확인
4. status = action_requested
5. 조치요청 메일 초안 생성 가능
6. timeline event 생성
```

### 조치 등록

```text
1. CorrectiveAction 생성
2. 조치사진 연결
3. Finding.status = action_submitted
4. timeline event 생성
```

### 조치 확인

```text
1. CorrectiveAction 확인
2. actionDetail, actionPhoto 확인
3. verifiedBy, verifiedAt 저장
4. CorrectiveAction.status = verified
5. Finding.status = verified
6. timeline event 생성
```

### 사진대지 항목 생성

```text
1. InspectionRound의 Findings 조회
2. reportInclude = true 항목 필터
3. ownerPartyId 조건 적용
4. 각 Finding의 대표 지적사진 조회
5. verified CorrectiveAction 조회
6. 대표 조치사진 조회
7. PhotoLedgerEntry 생성
8. caption 자동 생성
9. warning 검증
```

### 보고서 동기화

```text
1. PhotoLedger validate
2. DocumentInstance 조회
3. photo_ledger section 교체 또는 갱신
4. DocumentVersion 생성
5. PhotoLedger.status = synced_to_report
6. OwnerReportTask 업데이트
```

## 7. Report Mapping

| Source | Target Report Section |
|---|---|
| Finding.title | photo_ledger.findingCaption |
| CorrectiveAction.actionDetail | photo_ledger.actionCaption |
| EvidencePhoto.finding_photo | photo_ledger.findingPhoto |
| EvidencePhoto.action_photo | photo_ledger.actionPhoto |
| Finding.title | implementation_confirmation.needsImprovement |
| Finding.source additional_hazard | additional_hazard_checklist |
| Finding.source risk_reduction | risk_reduction_checklist |

## 8. Seed Findings

### 삼성문화재단

1. 엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치 미비
   - 조치: 엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치

2. 가설분전함 정·부 책임자 지정 미비
   - 조치: 가설분전함 정·부 책임자 지정 및 지정관리자가 지속적 관리

### 삼성생명공익재단

1. 방우형 콘센트 덮개 파손으로 인해 감전사고 우려
   - 조치: 파손된 방우형 콘센트 교체하여 사용

2. 가설분전함의 전선배선 피복 노출부 임시 보완처리 미비
   - 조치: 가설분전함의 전선배선 피복 노출부 전기용 절연테이프로 보완조치

3. 케이블 릴 전선 풀림상태 안전조치 미비
   - 조치: 케이블 릴 전선 2줄 이상 감김 상태 유지 확인

## 9. Tests

```text
test_finding_create_success
test_finding_requires_project_and_round
test_finding_owner_party_must_be_owner
test_finding_from_checklist_candidate
test_finding_prevent_duplicate_source
test_finding_request_action_changes_status
test_corrective_action_submit_success
test_corrective_action_verify_success
test_corrective_action_reject_requires_reason
test_finding_close_requires_verified_action
test_evidence_photo_upload_link_finding
test_evidence_photo_markup_saved
test_photo_ledger_create_success
test_photo_ledger_generate_entries_from_findings
test_photo_ledger_warns_missing_action_photo
test_photo_ledger_warns_unverified_action
test_photo_ledger_owner_filter
test_photo_ledger_reorder_entries
test_photo_ledger_export_uses_confirmed_entries
test_photo_ledger_sync_to_safety_report
test_action_request_mail_draft_includes_findings
```
