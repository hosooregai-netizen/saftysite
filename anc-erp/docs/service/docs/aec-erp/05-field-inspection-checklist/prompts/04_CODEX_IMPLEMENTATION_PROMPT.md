# 04. Codex Implementation Prompt — 현장점검 체크리스트

## Prompt

```text
You are implementing the Field Inspection Checklist module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module manages checklist templates, checklist sessions, checklist results, risk reduction checklist items, additional hazard items, photos, finding candidates, mobile input, and report mapping.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Field Inspection Checklist module.

Existing concepts:
- Project
- ProjectParty
- InspectionRound
- InspectionOwnerReportTask
- Finding
- CorrectiveAction
- EvidencePhoto
- FileAsset
- DocumentInstance
- AuditLog

Required backend models:
- ChecklistTemplate
- ChecklistCategory
- ChecklistItem
- ChecklistSession
- ChecklistResult
- FindingCandidate
- RiskReductionChecklistItem
- AdditionalHazardItem
- ChecklistPhoto
- ChecklistMobileDraft
- ChecklistReportMapping

Required backend APIs:
Templates:
- GET /api/v1/checklist-templates
- POST /api/v1/checklist-templates
- GET /api/v1/checklist-templates/{templateId}
- PATCH /api/v1/checklist-templates/{templateId}
- DELETE /api/v1/checklist-templates/{templateId}
- POST /api/v1/checklist-templates/{templateId}/publish
- POST /api/v1/checklist-templates/{templateId}/clone

Template Items:
- GET /api/v1/checklist-templates/{templateId}/items
- POST /api/v1/checklist-templates/{templateId}/items
- PATCH /api/v1/checklist-items/{itemId}
- DELETE /api/v1/checklist-items/{itemId}
- POST /api/v1/checklist-templates/{templateId}/items/reorder

Checklist Sessions:
- GET /api/v1/inspection-rounds/{inspectionRoundId}/checklist-sessions
- POST /api/v1/inspection-rounds/{inspectionRoundId}/checklist-sessions
- GET /api/v1/checklist-sessions/{sessionId}
- PATCH /api/v1/checklist-sessions/{sessionId}
- POST /api/v1/checklist-sessions/{sessionId}/start
- POST /api/v1/checklist-sessions/{sessionId}/pause
- POST /api/v1/checklist-sessions/{sessionId}/complete
- POST /api/v1/checklist-sessions/{sessionId}/review
- POST /api/v1/checklist-sessions/{sessionId}/lock

Results:
- GET /api/v1/checklist-sessions/{sessionId}/results
- POST /api/v1/checklist-sessions/{sessionId}/results
- PATCH /api/v1/checklist-results/{resultId}
- POST /api/v1/checklist-sessions/{sessionId}/results/bulk-save
- POST /api/v1/checklist-sessions/{sessionId}/results/fill-not-applicable
- POST /api/v1/checklist-sessions/{sessionId}/results/validate

Finding Candidates:
- GET /api/v1/checklist-sessions/{sessionId}/finding-candidates
- POST /api/v1/checklist-results/{resultId}/finding-candidate
- POST /api/v1/finding-candidates/{candidateId}/accept
- POST /api/v1/finding-candidates/{candidateId}/dismiss
- POST /api/v1/finding-candidates/{candidateId}/convert-to-finding

Photos / Report / Mobile:
- POST /api/v1/checklist-results/{resultId}/photos/upload
- GET /api/v1/checklist-results/{resultId}/photos
- POST /api/v1/checklist-results/{resultId}/photos/link
- GET /api/v1/checklist-sessions/{sessionId}/report-mapping
- POST /api/v1/checklist-sessions/{sessionId}/summarize
- POST /api/v1/checklist-sessions/{sessionId}/sync-to-report
- POST /api/v1/checklist-sessions/{sessionId}/mobile-drafts
- POST /api/v1/checklist-sessions/{sessionId}/mobile-drafts/{draftId}/commit

Required frontend routes:
- /projects/[projectId]/checklist-templates
- /projects/[projectId]/inspections/[inspectionRoundId]/checklist
- /inspections/[inspectionRoundId]/checklist
- /inspections/[inspectionRoundId]/checklist/mobile
- /inspections/[inspectionRoundId]/checklist/review
- /checklist-sessions/[sessionId]
- /checklist-sessions/[sessionId]/results
- /checklist-sessions/[sessionId]/finding-candidates
- /checklist-sessions/[sessionId]/photos
- /admin/checklist-templates
- /admin/checklist-templates/[templateId]

Business requirements:
1. ChecklistSession must belong to Project and InspectionRound.
2. ChecklistSession must be created from a published ChecklistTemplate.
3. Creating a session initializes ChecklistResult records for template items.
4. Creating a session initializes risk reduction items for the elevator replacement template.
5. Result values are not_checked, good, caution, bad, not_applicable.
6. caution or bad results create or update FindingCandidate.
7. not_applicable should support reason/comment.
8. locked sessions cannot be modified.
9. completed sessions require all required items to be checked.
10. Photos can be linked to checklist results and additional hazards.
11. AdditionalHazardItem with not_implemented should create FindingCandidate.
12. Checklist summaries must map to report sections.
13. Mobile draft commit must support conflict detection.
14. All status changes should create AuditLog.

Tests:
- test_checklist_template_create_success
- test_checklist_session_create_from_template
- test_checklist_session_initializes_results
- test_checklist_session_generates_risk_reduction_items
- test_checklist_result_save_good
- test_checklist_result_caution_creates_finding_candidate
- test_checklist_result_bad_creates_finding_candidate
- test_checklist_locked_session_prevents_update
- test_additional_hazard_not_implemented_creates_candidate
- test_checklist_photo_upload_links_result
- test_checklist_complete_requires_required_items
- test_checklist_summary_generates_report_mapping
- test_checklist_mobile_draft_commit
- test_checklist_report_sync_to_safety_report

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Checklist template seed service
- Finding candidate service
- Report mapping service
- Mobile draft commit service
- Frontend pages and components
- API client functions
- Type definitions
- Tests
```
