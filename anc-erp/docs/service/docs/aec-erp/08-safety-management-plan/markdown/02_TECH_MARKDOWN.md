# 02. Tech Markdown — 안전관리계획서 자동화

## 1. Frontend Routes

```text
/projects/[projectId]/safety-management-plans
/projects/[projectId]/safety-management-plans/new
/safety-management-plans/[planId]
/safety-management-plans/[planId]/edit
/safety-management-plans/[planId]/preview
/safety-management-plans/[planId]/sections
/safety-management-plans/[planId]/risks
/safety-management-plans/[planId]/organization
/safety-management-plans/[planId]/education
/safety-management-plans/[planId]/emergency
/safety-management-plans/[planId]/attachments
/safety-management-plans/[planId]/export
```

## 2. Frontend Components

```text
SafetyManagementPlanListPage
SafetyManagementPlanCreatePage
SafetyManagementPlanEditorPage
SafetyManagementPlanPreviewPage

SafetyManagementPlanWizard
PlanTemplateSelector
PlanRequiredDataPanel
PlanSectionNavigator
PlanSectionEditor
PlanA4Preview
PlanVariablePanel
PlanExportChecklist
PlanStatusBadge
PlanVersionHistory

WorkTypeTable
WorkTypeForm
RiskRegisterTable
RiskItemForm
RiskMatrixBadge
ReductionMeasureEditor
SafetyOrganizationEditor
EmergencyContactTable
EducationPlanTable
InspectionPlanTable
PpePlanTable
AttachmentLinkPanel
StaleSourceWarningPanel
```

## 3. Backend APIs

### Plans

```text
GET    /api/v1/projects/{projectId}/safety-management-plans
POST   /api/v1/projects/{projectId}/safety-management-plans
GET    /api/v1/safety-management-plans/{planId}
PATCH  /api/v1/safety-management-plans/{planId}
DELETE /api/v1/safety-management-plans/{planId}

POST   /api/v1/safety-management-plans/{planId}/generate
POST   /api/v1/safety-management-plans/{planId}/validate
POST   /api/v1/safety-management-plans/{planId}/save-section
POST   /api/v1/safety-management-plans/{planId}/sections/{sectionKey}/regenerate
POST   /api/v1/safety-management-plans/{planId}/confirm
POST   /api/v1/safety-management-plans/{planId}/export
POST   /api/v1/safety-management-plans/{planId}/refresh-linked-data
```

### Work Types and Risks

```text
GET    /api/v1/safety-management-plans/{planId}/work-types
POST   /api/v1/safety-management-plans/{planId}/work-types
PATCH  /api/v1/safety-management-work-types/{workTypeId}
DELETE /api/v1/safety-management-work-types/{workTypeId}

GET    /api/v1/safety-management-plans/{planId}/risks
POST   /api/v1/safety-management-plans/{planId}/risks
PATCH  /api/v1/safety-management-risks/{riskItemId}
DELETE /api/v1/safety-management-risks/{riskItemId}
POST   /api/v1/safety-management-plans/{planId}/risks/generate-from-work-types
POST   /api/v1/safety-management-plans/{planId}/risks/import-from-checklist
```

### Supporting Sections

```text
GET    /api/v1/safety-management-plans/{planId}/organization
PATCH  /api/v1/safety-management-plans/{planId}/organization
GET    /api/v1/safety-management-plans/{planId}/education
PATCH  /api/v1/safety-management-plans/{planId}/education
GET    /api/v1/safety-management-plans/{planId}/emergency
PATCH  /api/v1/safety-management-plans/{planId}/emergency
GET    /api/v1/safety-management-plans/{planId}/attachments
POST   /api/v1/safety-management-plans/{planId}/attachments/link
DELETE /api/v1/safety-management-plan-attachments/{attachmentId}
```

## 4. Data Models

### SafetyManagementPlan

```ts
type SafetyManagementPlanStatus =
  | 'draft'
  | 'input_required'
  | 'ai_draft'
  | 'editing'
  | 'review'
  | 'confirmed'
  | 'exported'
  | 'submitted'
  | 'archived'

type SafetyManagementPlan = {
  id: string
  projectId: string
  contractId?: string
  inspectionRoundId?: string
  templateId: string
  planNo?: string
  title: string
  status: SafetyManagementPlanStatus
  projectSnapshot: SafetyManagementProjectSnapshot
  sections: SafetyManagementPlanSection[]
  workTypes: SafetyManagementWorkType[]
  riskItems: SafetyManagementRiskItem[]
  organization?: SafetyOrganizationPlan
  educationPlan?: SafetyEducationPlan
  emergencyPlan?: SafetyEmergencyPlan
  inspectionPlan?: SafetyInspectionPlan
  attachments: SafetyManagementPlanAttachment[]
  missingFields: MissingField[]
  warnings: PlanWarning[]
  stale: boolean
  latestVersionNo: number
  exportedFileId?: string
  submittedAt?: string
  createdAt: string
  updatedAt: string
}
```

### SafetyManagementPlanSection

```ts
type SafetyManagementPlanSectionKey =
  | 'cover'
  | 'project_overview'
  | 'construction_schedule'
  | 'safety_organization'
  | 'work_method'
  | 'risk_assessment'
  | 'reduction_measures'
  | 'safety_education'
  | 'ppe_management'
  | 'equipment_temporary_electric_fire'
  | 'emergency_response'
  | 'inspection_record_management'
  | 'safety_cost_plan'
  | 'attachments'

type SafetyManagementPlanSection = {
  id: string
  planId: string
  key: SafetyManagementPlanSectionKey
  title: string
  status: 'not_started' | 'ai_draft' | 'edited' | 'review' | 'confirmed' | 'locked'
  order: number
  content: Record<string, unknown>
  sourceEntityRefs: SourceLink[]
  updatedAt: string
}
```

### SafetyManagementWorkType

```ts
type SafetyManagementWorkType = {
  id: string
  planId: string
  projectId: string
  name: string
  description?: string
  location?: string
  periodStart?: string
  periodEnd?: string
  manpower?: number
  equipment?: string[]
  displayOrder: number
  createdAt: string
  updatedAt: string
}
```

### SafetyManagementRiskItem

```ts
type SafetyManagementRiskLevel = 'low' | 'medium' | 'high' | 'critical'

type SafetyManagementRiskItem = {
  id: string
  planId: string
  projectId: string
  workTypeId?: string
  workTypeName: string
  taskDescription?: string
  hazardDescription: string
  riskType?: 'fall' | 'electric' | 'fire' | 'caught_between' | 'struck_by' | 'confined_space' | 'equipment' | 'health' | 'other'
  riskLevel?: SafetyManagementRiskLevel
  reductionMeasure: string
  responsiblePartyId?: string
  checkMethod?: string
  sourceType?: 'manual' | 'template' | 'additional_hazard' | 'inspection_checklist' | 'safety_health_ledger'
  sourceId?: string
  reportInclude: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}
```

### Supporting Models

```ts
type SafetyOrganizationPlan = {
  planId: string
  managerName?: string
  managerRole?: string
  organizationChartFileId?: string
  responsibilities: Array<{ role: string; organizationId?: string; name?: string; responsibility: string }>
}

type SafetyEducationPlan = {
  planId: string
  items: Array<{ educationType: string; target: string; cycle: string; content: string; recordMethod: string }>
}

type SafetyEmergencyPlan = {
  planId: string
  contacts: Array<{ type: string; name: string; phone?: string; organization?: string; note?: string }>
  responseProcedures: Array<{ accidentType: string; procedure: string; responsibleRole?: string }>
  evacuationRouteFileId?: string
}

type SafetyInspectionPlan = {
  planId: string
  items: Array<{ inspectionType: string; cycle: string; inspectorRole: string; recordMethod: string; linkedChecklistTemplateId?: string }>
}

type SafetyManagementPlanAttachment = {
  id: string
  planId: string
  projectId: string
  fileId: string
  attachmentType: 'schedule' | 'drawing' | 'organization_chart' | 'emergency_contact' | 'risk_assessment' | 'equipment_certificate' | 'education_material' | 'safety_cost_plan' | 'other'
  title: string
  required: boolean
  createdAt: string
}
```

## 5. Validation Rules

### Draft Creation

- projectId는 필수다.
- templateId는 필수다.
- plan title은 필수다.
- 같은 projectId에서 active plan이 이미 있으면 새 개정본 생성 또는 중복 생성 경고를 표시한다.

### Required Fields Before Export

```text
projectName
siteAddress
ownerParties
contractorName
constructionPeriod
safetyOrganization
emergencyContacts
workTypes
riskItems
reductionMeasures
educationPlan
inspectionPlan
attachmentsRequired
```

### Risk Register

- workTypeName은 필수다.
- hazardDescription은 필수다.
- reductionMeasure는 필수다.
- high/critical 위험은 responsiblePartyId 또는 responsible role이 필요하다.

### Export

- required missingFields가 있으면 최종 export를 막는다.
- 필수 섹션 status가 not_started이면 export를 막는다.
- export는 최신 저장 snapshot 기준으로 수행한다.
- exported 파일은 FileAsset으로 저장되어야 한다.

## 6. Service Rules

### Plan Draft Flow

```text
1. Project 조회
2. ProjectParty/Contact 조회
3. Contract 조회 optional
4. WorkScheduleAttachment/FileAsset 조회
5. 기본 WorkType 후보 생성
6. RiskItem 후보 생성
7. MissingField 검출
8. AI 초안 생성 optional
9. SafetyManagementPlan 생성
10. SafetyManagementPlanVersion 1 생성
11. AuditLog 기록
```

### Generate Risks From Work Types

```text
WorkType 선택
→ 공종 라이브러리 조회
→ 기본 위험요인 후보 생성
→ 사용자가 선택/수정
→ SafetyManagementRiskItem 저장
```

### Refresh Linked Data

```text
Project/Contract/Contact/FileAsset 변경 감지
→ stale = true
→ 변경된 source link 표시
→ 사용자가 반영 선택
→ PlanVersion 생성
```

### Export Flow

```text
1. editor state 저장
2. 최신 Plan snapshot 재조회
3. validate 실행
4. export renderer 호출
5. PDF/HWPX 파일 생성
6. FileAsset 생성
7. 웹하드 저장
8. SafetyManagementPlan.exportedFileId 업데이트
9. AuditLog 기록
```

## 7. Tests

```text
test_safety_management_plan_create_success
test_safety_management_plan_requires_project_and_template
test_safety_management_plan_prevents_duplicate_active_without_revision
test_safety_management_plan_loads_project_snapshot
test_safety_management_plan_work_type_create_success
test_safety_management_plan_risk_item_requires_hazard_and_measure
test_safety_management_plan_generate_risks_from_work_types
test_safety_management_plan_import_risks_from_checklist
test_safety_management_plan_missing_required_fields
test_safety_management_plan_section_regenerate_ai_draft
test_safety_management_plan_export_blocked_when_required_missing
test_safety_management_plan_export_uses_latest_saved_snapshot
test_safety_management_plan_export_creates_file_asset
test_safety_management_plan_refresh_linked_data_sets_stale
test_safety_management_plan_version_created_on_save
```
