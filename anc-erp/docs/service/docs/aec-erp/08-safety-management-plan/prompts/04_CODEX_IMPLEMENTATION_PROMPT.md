# 04. Codex Implementation Prompt — 안전관리계획서 자동화

## Prompt

```text
You are implementing the Safety Management Plan Automation module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module creates project-level safety management plans from project registry, contract, parties, contacts, schedules, work types, risk register, safety organization, education plan, emergency plan, inspection plan, and attachments.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Safety Management Plan module.

Existing concepts:
- Project
- Organization
- ProjectParty
- Contact
- Contract
- WorkScheduleAttachment
- ChecklistTemplate
- ChecklistResult
- Finding
- FileAsset
- Folder
- Submission
- AuditLog
- PromptTemplate

Required backend models:
- SafetyManagementPlan
- SafetyManagementProjectSnapshot
- SafetyManagementPlanSection
- SafetyManagementPlanVersion
- SafetyManagementWorkType
- SafetyManagementRiskItem
- SafetyOrganizationPlan
- SafetyEducationPlan
- SafetyEmergencyPlan
- SafetyInspectionPlan
- SafetyManagementPlanAttachment
- SafetyManagementExportJob
- MissingField
- PlanWarning
- SourceLink

Required backend APIs:

Plans:
- GET /api/v1/projects/{projectId}/safety-management-plans
- POST /api/v1/projects/{projectId}/safety-management-plans
- GET /api/v1/safety-management-plans/{planId}
- PATCH /api/v1/safety-management-plans/{planId}
- DELETE /api/v1/safety-management-plans/{planId}
- POST /api/v1/safety-management-plans/{planId}/generate
- POST /api/v1/safety-management-plans/{planId}/validate
- POST /api/v1/safety-management-plans/{planId}/save-section
- POST /api/v1/safety-management-plans/{planId}/sections/{sectionKey}/regenerate
- POST /api/v1/safety-management-plans/{planId}/confirm
- POST /api/v1/safety-management-plans/{planId}/export
- POST /api/v1/safety-management-plans/{planId}/refresh-linked-data

Work Types and Risks:
- GET /api/v1/safety-management-plans/{planId}/work-types
- POST /api/v1/safety-management-plans/{planId}/work-types
- PATCH /api/v1/safety-management-work-types/{workTypeId}
- DELETE /api/v1/safety-management-work-types/{workTypeId}
- GET /api/v1/safety-management-plans/{planId}/risks
- POST /api/v1/safety-management-plans/{planId}/risks
- PATCH /api/v1/safety-management-risks/{riskItemId}
- DELETE /api/v1/safety-management-risks/{riskItemId}
- POST /api/v1/safety-management-plans/{planId}/risks/generate-from-work-types
- POST /api/v1/safety-management-plans/{planId}/risks/import-from-checklist

Supporting Sections:
- GET /api/v1/safety-management-plans/{planId}/organization
- PATCH /api/v1/safety-management-plans/{planId}/organization
- GET /api/v1/safety-management-plans/{planId}/education
- PATCH /api/v1/safety-management-plans/{planId}/education
- GET /api/v1/safety-management-plans/{planId}/emergency
- PATCH /api/v1/safety-management-plans/{planId}/emergency
- GET /api/v1/safety-management-plans/{planId}/attachments
- POST /api/v1/safety-management-plans/{planId}/attachments/link
- DELETE /api/v1/safety-management-plan-attachments/{attachmentId}

Required frontend routes:
- /projects/[projectId]/safety-management-plans
- /projects/[projectId]/safety-management-plans/new
- /safety-management-plans/[planId]
- /safety-management-plans/[planId]/edit
- /safety-management-plans/[planId]/preview
- /safety-management-plans/[planId]/sections
- /safety-management-plans/[planId]/risks
- /safety-management-plans/[planId]/organization
- /safety-management-plans/[planId]/education
- /safety-management-plans/[planId]/emergency
- /safety-management-plans/[planId]/attachments
- /safety-management-plans/[planId]/export

Required frontend components:
- SafetyManagementPlanWizard
- PlanTemplateSelector
- PlanRequiredDataPanel
- PlanSectionNavigator
- PlanSectionEditor
- PlanA4Preview
- PlanExportChecklist
- WorkTypeTable
- RiskRegisterTable
- RiskItemForm
- RiskMatrixBadge
- ReductionMeasureEditor
- SafetyOrganizationEditor
- EmergencyContactTable
- EducationPlanTable
- InspectionPlanTable
- AttachmentLinkPanel
- StaleSourceWarningPanel

Business requirements:
1. SafetyManagementPlan must belong to Project.
2. SafetyManagementPlan can optionally link to Contract and InspectionRound for revisions.
3. Plan creation must snapshot Project, ProjectParty, Contact, and Contract data.
4. WorkType and RiskItem are first-class records.
5. AI-generated sections must be draft only.
6. Legal/template text must come from registered template sections.
7. Export must use the latest saved snapshot.
8. Export must create FileAsset and save it to webhard.
9. Risk register can be generated from work types or imported from checklist/additional hazard data.
10. Refresh linked data must detect stale source data.
11. All status changes and exports create AuditLog.

Seed data for Leeum elevator replacement project:
- workTypes: 승강기 철거, 승강기 설치, 에스컬레이터 교체, 가설전기, 용접·화기, 이동식 사다리/말비계, 승강로·피트 작업, 폐기물 반출
- risk examples: 추락, 감전, 화재, 협착, 낙하·비래, 밀폐공간, 중량물 양중

Tests:
- test_safety_management_plan_create_success
- test_safety_management_plan_requires_project_and_template
- test_safety_management_plan_prevents_duplicate_active_without_revision
- test_safety_management_plan_loads_project_snapshot
- test_safety_management_plan_work_type_create_success
- test_safety_management_plan_risk_item_requires_hazard_and_measure
- test_safety_management_plan_generate_risks_from_work_types
- test_safety_management_plan_import_risks_from_checklist
- test_safety_management_plan_missing_required_fields
- test_safety_management_plan_section_regenerate_ai_draft
- test_safety_management_plan_export_blocked_when_required_missing
- test_safety_management_plan_export_uses_latest_saved_snapshot
- test_safety_management_plan_export_creates_file_asset
- test_safety_management_plan_refresh_linked_data_sets_stale
- test_safety_management_plan_version_created_on_save

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Risk generation service
- Plan generation service
- Export service adapter placeholder
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```
