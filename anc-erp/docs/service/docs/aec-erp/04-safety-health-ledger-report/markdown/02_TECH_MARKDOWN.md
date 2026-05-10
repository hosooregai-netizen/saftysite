# 02. Tech Markdown — 공사안전보건대장 이행확인 보고서 자동화

## 1. Frontend Routes

```text
/projects/[projectId]/documents/safety-reports
/projects/[projectId]/documents/safety-reports/new
/documents/safety-reports/[documentId]
/documents/safety-reports/[documentId]/edit
/documents/safety-reports/[documentId]/preview
/documents/safety-reports/[documentId]/sections
/documents/safety-reports/[documentId]/variables
/documents/safety-reports/[documentId]/export
/documents/safety-reports/[documentId]/submission
/inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document
```

## 2. Frontend Components

```text
SafetyReportListPage
SafetyReportCreatePage
SafetyReportEditorPage
SafetyReportPreviewPage
SafetyReportExportPage
SafetyReportWizard
InspectionRoundSelector
OwnerPartySelector
ReportTemplateSelector
ReportRequiredDataPanel
MissingFieldPanel
OwnerReportBranchNotice
DocumentSectionNavigator
DocumentSectionEditor
A4ReportPreview
ReportVariablePanel
ReportGenerateButton
ReportSaveBar
ReportExportBar
ReportVersionHistory
ReportStatusBadge
CoverSectionEditor
ProjectSummarySectionEditor
SitePhotoSummarySectionEditor
ChecklistSectionEditor
ConfirmationSectionEditor
RiskReductionChecklistEditor
AdditionalHazardChecklistEditor
SafetyCostSectionEditor
PhotoLedgerSectionEditor
ScheduleAttachmentSectionEditor
```

## 3. Backend APIs

### Safety Reports

```text
GET    /api/v1/projects/{projectId}/safety-reports
POST   /api/v1/safety-reports/draft
GET    /api/v1/safety-reports/{documentId}
PATCH  /api/v1/safety-reports/{documentId}
DELETE /api/v1/safety-reports/{documentId}
POST   /api/v1/safety-reports/{documentId}/generate
POST   /api/v1/safety-reports/{documentId}/validate
POST   /api/v1/safety-reports/{documentId}/save-section
POST   /api/v1/safety-reports/{documentId}/sections/{sectionKey}/regenerate
POST   /api/v1/safety-reports/{documentId}/confirm
POST   /api/v1/safety-reports/{documentId}/export
POST   /api/v1/safety-reports/{documentId}/clone-for-owner
```

### Required Data

```text
GET /api/v1/inspection-rounds/{inspectionRoundId}/safety-report-required-data
GET /api/v1/inspection-rounds/{inspectionRoundId}/owner-report-branches
GET /api/v1/safety-reports/{documentId}/missing-fields
GET /api/v1/safety-reports/{documentId}/variables
```

### Linked Data

```text
GET  /api/v1/safety-reports/{documentId}/checklist-results
GET  /api/v1/safety-reports/{documentId}/findings
GET  /api/v1/safety-reports/{documentId}/photo-ledger
GET  /api/v1/safety-reports/{documentId}/safety-cost
POST /api/v1/safety-reports/{documentId}/refresh-linked-data
```

### Submission Link

```text
POST /api/v1/safety-reports/{documentId}/link-owner-report-task
POST /api/v1/safety-reports/{documentId}/mark-submitted
```

## 4. Data Models

### SafetyReportDraftRequest

```ts
type SafetyReportDraftRequest = {
  projectId: string
  inspectionRoundId: string
  ownerPartyId: string
  templateId: string
  ownerReportTaskId?: string
  generationMode: 'from_linked_data' | 'blank' | 'clone_from_existing'
  cloneFromDocumentId?: string
}
```

### DocumentInstance

```ts
type DocumentStatus =
  | 'draft'
  | 'ai_draft'
  | 'editing'
  | 'review'
  | 'confirmed'
  | 'exported'
  | 'submitted'
  | 'archived'

type DocumentInstance = {
  id: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId: string
  ownerReportTaskId?: string
  templateId: string
  documentType: 'safety_health_ledger_inspection_report'
  title: string
  documentNo?: string
  roundNo: number
  status: DocumentStatus
  contentSnapshot: SafetyReportSnapshot
  latestVersionNo: number
  exportedFileId?: string
  submittedAt?: string
  createdAt: string
  updatedAt: string
}
```

### SafetyReportSnapshot

```ts
type SafetyReportSnapshot = {
  meta: SafetyReportMeta
  variables: Record<string, unknown>
  sections: SafetyReportSection[]
  missingFields: MissingField[]
  reviewWarnings: ReviewWarning[]
  sourceLinks: SourceLink[]
}
```

### SafetyReportSection

```ts
type SafetyReportSectionKey =
  | 'cover'
  | 'project_summary'
  | 'site_photo_summary'
  | 'inspection_checklist'
  | 'implementation_confirmation'
  | 'risk_reduction_checklist'
  | 'additional_hazard_checklist'
  | 'safety_cost_usage'
  | 'owner_safety_activity'
  | 'worker_consultation'
  | 'hired_safety_expert'
  | 'serious_accident_management'
  | 'photo_ledger'
  | 'schedule_attachments'

type SafetyReportSection = {
  id: string
  key: SafetyReportSectionKey
  title: string
  status: 'not_started' | 'ai_draft' | 'edited' | 'review' | 'confirmed' | 'locked'
  order: number
  content: Record<string, unknown>
  sourceEntityRefs: SourceLink[]
  updatedAt: string
}
```

### MissingField

```ts
type MissingField = {
  field: string
  label: string
  severity: 'required' | 'recommended' | 'optional'
  sectionKey: SafetyReportSectionKey
  reason: string
  sourceEntityType?: string
  sourceEntityId?: string
}
```

### ReviewWarning

```ts
type ReviewWarning = {
  type:
    | 'missing_required_data'
    | 'owner_specific_data_mismatch'
    | 'stale_linked_data'
    | 'photo_pair_missing'
    | 'safety_cost_rate_mismatch'
    | 'checklist_finding_mismatch'
    | 'legal_text_review_required'
  message: string
  sectionKey?: SafetyReportSectionKey
  severity: 'info' | 'warning' | 'danger'
}
```

### SafetyReportVersion

```ts
type SafetyReportVersion = {
  id: string
  documentId: string
  versionNo: number
  contentSnapshot: SafetyReportSnapshot
  createdBy: string
  createdAt: string
  changeSummary?: string
}
```

## 5. Validation Rules

### Draft Creation

- `projectId`는 필수다.
- `inspectionRoundId`는 필수다.
- `ownerPartyId`는 필수다.
- `ownerPartyId`는 해당 project의 owner ProjectParty여야 한다.
- 같은 `inspectionRoundId + ownerPartyId` 조합의 active 문서가 이미 있으면 중복 생성 경고 또는 차단을 제공한다.

### Required Fields

최종 export 전 필수:

```text
projectName
siteAddress
contractorName
ownerName
inspectionDate
roundNo
documentNo
writerName
confirmerName
constructionPeriod
constructionAmount
ownerConstructionAmount
progressRate
checklistResults
safetyCostUsage
```

### Export Validation

- required missingFields가 있으면 final export를 막는다.
- 필수 섹션이 `not_started`이면 export를 막는다.
- export는 최신 저장 `contentSnapshot` 기준으로 수행한다.
- exported 파일은 `FileAsset`으로 생성되어야 한다.

## 6. Service Rules

### Draft Generation Flow

```text
1. Project 조회
2. InspectionRound 조회
3. Owner ProjectParty 조회
4. Contract / Contact 조회
5. ChecklistResult 조회
6. Finding / CorrectiveAction 조회
7. EvidencePhoto 조회
8. SafetyCostUsage 조회
9. WorkScheduleAttachment 조회
10. 변수 매핑
11. 누락정보 검출
12. AI 초안 생성
13. DocumentInstance 생성
14. SafetyReportVersion 1 생성
15. OwnerReportTask 연결
```

### Clone For Owner

```text
기존 DocumentInstance 선택
→ targetOwnerPartyId 선택
→ 공통 섹션 복사
→ owner-specific 변수 교체
→ owner-specific missingFields 재검증
→ 새 DocumentInstance 생성
```

### Export Flow

```text
1. editor state 저장
2. 최신 DocumentInstance 재조회
3. validate 실행
4. export renderer 호출
5. PDF/HWPX 파일 생성
6. FileAsset 생성
7. 웹하드 /프로젝트명/08_최종본 저장
8. DocumentInstance.exportedFileId 업데이트
9. OwnerReportTask.status = exported
10. AuditLog 기록
```

## 7. Report Section Data Sources

| 섹션 | 주요 데이터 소스 |
|---|---|
| cover | Project, InspectionRound, ProjectParty, Contact |
| project_summary | Project, ProjectParty, Organization, InspectionRound |
| site_photo_summary | EvidencePhoto, InspectionRound, AI summary |
| inspection_checklist | ChecklistResult, ChecklistItem, Finding |
| implementation_confirmation | Project, OwnerParty, SafetyCostUsage, Finding |
| risk_reduction_checklist | RiskReductionItem, InspectionResult |
| additional_hazard_checklist | Finding, AdditionalRiskItem |
| safety_cost_usage | SafetyCostUsage |
| owner_safety_activity | OwnerSafetyActivity |
| worker_consultation | WorkerConsultation |
| hired_safety_expert | ProjectParty, Contract |
| serious_accident_management | SeriousAccidentRecord |
| photo_ledger | Finding, CorrectiveAction, EvidencePhoto |
| schedule_attachments | WorkScheduleAttachment, FileAsset |

## 8. Tests

```text
test_safety_report_draft_create_success
test_safety_report_requires_project_round_owner
test_safety_report_prevents_duplicate_active_owner_report
test_safety_report_generates_owner_specific_document
test_safety_report_missing_required_fields
test_safety_report_clone_for_owner_replaces_owner_specific_values
test_safety_report_checklist_results_mapped
test_safety_report_finding_photo_ledger_mapped
test_safety_report_safety_cost_rate_calculated
test_safety_report_export_blocked_when_required_missing
test_safety_report_export_uses_latest_saved_snapshot
test_safety_report_export_creates_file_asset
test_safety_report_links_owner_report_task
test_safety_report_mark_submitted_updates_owner_report_task
test_safety_report_refresh_linked_data_detects_stale_source
```
