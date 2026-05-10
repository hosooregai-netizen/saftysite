# 04. Codex Implementation Prompt — 공사안전보건대장 이행확인 보고서 자동화

## Prompt

```text
You are implementing the Safety Health Ledger Inspection Report Automation module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module creates owner-specific construction safety health ledger inspection reports from project, inspection round, checklist, finding, corrective action, photo, safety cost, and schedule attachment data.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Safety Report Automation module.

Existing concepts:
- Project
- Organization
- ProjectParty
- Contact
- Contract
- InspectionRound
- InspectionOwnerReportTask
- ChecklistItem
- ChecklistResult
- Finding
- CorrectiveAction
- EvidencePhoto
- SafetyCostUsage
- FileAsset
- Folder
- MailThread
- Submission
- AuditLog

Required backend models:
- DocumentInstance
- SafetyReportSnapshot
- SafetyReportMeta
- SafetyReportSection
- SafetyReportVersion
- MissingField
- ReviewWarning
- SourceLink
- SafetyReportExportJob

Required backend APIs:

Safety Reports:
- GET /api/v1/projects/{projectId}/safety-reports
- POST /api/v1/safety-reports/draft
- GET /api/v1/safety-reports/{documentId}
- PATCH /api/v1/safety-reports/{documentId}
- DELETE /api/v1/safety-reports/{documentId}
- POST /api/v1/safety-reports/{documentId}/generate
- POST /api/v1/safety-reports/{documentId}/validate
- POST /api/v1/safety-reports/{documentId}/save-section
- POST /api/v1/safety-reports/{documentId}/sections/{sectionKey}/regenerate
- POST /api/v1/safety-reports/{documentId}/confirm
- POST /api/v1/safety-reports/{documentId}/export
- POST /api/v1/safety-reports/{documentId}/clone-for-owner

Required Data:
- GET /api/v1/inspection-rounds/{inspectionRoundId}/safety-report-required-data
- GET /api/v1/inspection-rounds/{inspectionRoundId}/owner-report-branches
- GET /api/v1/safety-reports/{documentId}/missing-fields
- GET /api/v1/safety-reports/{documentId}/variables

Linked Data:
- GET /api/v1/safety-reports/{documentId}/checklist-results
- GET /api/v1/safety-reports/{documentId}/findings
- GET /api/v1/safety-reports/{documentId}/photo-ledger
- GET /api/v1/safety-reports/{documentId}/safety-cost
- POST /api/v1/safety-reports/{documentId}/refresh-linked-data

Submission Link:
- POST /api/v1/safety-reports/{documentId}/link-owner-report-task
- POST /api/v1/safety-reports/{documentId}/mark-submitted

Required frontend routes:
- /projects/[projectId]/documents/safety-reports
- /projects/[projectId]/documents/safety-reports/new
- /documents/safety-reports/[documentId]
- /documents/safety-reports/[documentId]/edit
- /documents/safety-reports/[documentId]/preview
- /documents/safety-reports/[documentId]/sections
- /documents/safety-reports/[documentId]/variables
- /documents/safety-reports/[documentId]/export
- /documents/safety-reports/[documentId]/submission
- /inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document

Required frontend components:
- SafetyReportWizard
- InspectionRoundSelector
- OwnerPartySelector
- ReportTemplateSelector
- ReportRequiredDataPanel
- MissingFieldPanel
- OwnerReportBranchNotice
- DocumentSectionNavigator
- DocumentSectionEditor
- A4ReportPreview
- ReportVariablePanel
- ReportGenerateButton
- ReportSaveBar
- ReportExportBar
- ReportVersionHistory
- ReportStatusBadge
- PhotoLedgerSectionEditor
- SafetyCostSectionEditor

Business requirements:
1. A Safety Report must belong to Project, InspectionRound, and owner ProjectParty.
2. Same inspectionRoundId can have multiple reports, one per ownerPartyId.
3. Duplicate active document for inspectionRoundId + ownerPartyId should show warning or be blocked.
4. Report generation must collect linked data from Project, OwnerParty, InspectionRound, Checklist, Findings, Actions, Photos, SafetyCost, and Attachments.
5. Report sections must be editable independently.
6. Missing required fields must be shown before generation and export.
7. AI generated text is draft only.
8. Legal text must come from template section text, not invented by AI.
9. Export must use the latest saved contentSnapshot.
10. Export must create FileAsset in webhard final folder.
11. Export should update OwnerReportTask.status to exported.
12. Mark submitted should update DocumentInstance and OwnerReportTask.
13. Clone-for-owner should copy common sections and replace owner-specific variables.
14. Refresh linked data should detect stale source data and let user apply changes.

Validation:
1. projectId, inspectionRoundId, ownerPartyId, templateId are required.
2. ownerPartyId must be an owner ProjectParty in the project.
3. Required fields must be present before final export.
4. safetyCost usedRate must be recalculated and compared.
5. photo ledger requires finding/action pair for final export unless user confirms exception.
6. section status must not be not_started for required sections.
7. submitted status requires exportedFileId.

Seed data:
Create two demo report branches for Leeum elevator replacement project:
- inspectionRound: roundNo 1, documentNo 제2026-01호, inspectionDate 2026-01-23
- owner branch 1: 삼성문화재단
- owner branch 2: 삼성생명공익재단

Tests:
- test_safety_report_draft_create_success
- test_safety_report_requires_project_round_owner
- test_safety_report_prevents_duplicate_active_owner_report
- test_safety_report_generates_owner_specific_document
- test_safety_report_missing_required_fields
- test_safety_report_clone_for_owner_replaces_owner_specific_values
- test_safety_report_checklist_results_mapped
- test_safety_report_finding_photo_ledger_mapped
- test_safety_report_safety_cost_rate_calculated
- test_safety_report_export_blocked_when_required_missing
- test_safety_report_export_uses_latest_saved_snapshot
- test_safety_report_export_creates_file_asset
- test_safety_report_links_owner_report_task
- test_safety_report_mark_submitted_updates_owner_report_task
- test_safety_report_refresh_linked_data_detects_stale_source

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Safety report generation service
- Validation service
- Export service adapter placeholder
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```
