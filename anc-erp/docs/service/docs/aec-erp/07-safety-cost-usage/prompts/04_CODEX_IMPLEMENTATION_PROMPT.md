# 04. Codex Implementation Prompt — 산업안전보건관리비 사용내용 확인

## Prompt

```text
You are implementing the Safety Cost Usage Confirmation module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module manages owner-specific safety cost calculated amount, used amount, used rate, basis month/date, basis documents, evidence files, review comments, confirmation, and synchronization to safety reports.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Safety Cost Usage module.

Existing concepts:
- Project
- ProjectParty
- InspectionRound
- DocumentInstance
- FileAsset
- Folder
- MailThread
- Submission
- AuditLog

Required backend models:
- SafetyCostUsage
- SafetyCostEvidence
- SafetyCostReview
- SafetyCostHistoryEvent
- SafetyCostValidationWarning
- SafetyCostReportMapping

Required backend APIs:
Usage:
- GET /api/v1/projects/{projectId}/safety-cost-usages
- GET /api/v1/inspection-rounds/{inspectionRoundId}/safety-cost-usages
- POST /api/v1/inspection-rounds/{inspectionRoundId}/safety-cost-usages
- GET /api/v1/safety-cost-usages/{usageId}
- PATCH /api/v1/safety-cost-usages/{usageId}
- DELETE /api/v1/safety-cost-usages/{usageId}
- POST /api/v1/safety-cost-usages/{usageId}/calculate-rate
- POST /api/v1/safety-cost-usages/{usageId}/validate
- POST /api/v1/safety-cost-usages/{usageId}/generate-comment
- POST /api/v1/safety-cost-usages/{usageId}/review
- POST /api/v1/safety-cost-usages/{usageId}/confirm
- POST /api/v1/safety-cost-usages/{usageId}/sync-to-report
- GET /api/v1/projects/{projectId}/safety-cost-usages/owner-matrix

Evidence:
- GET /api/v1/safety-cost-usages/{usageId}/evidence
- POST /api/v1/safety-cost-usages/{usageId}/evidence/upload
- POST /api/v1/safety-cost-usages/{usageId}/evidence/link-file
- PATCH /api/v1/safety-cost-evidence/{evidenceId}
- DELETE /api/v1/safety-cost-evidence/{evidenceId}

History / Report:
- GET /api/v1/safety-cost-usages/{usageId}/history
- GET /api/v1/documents/{documentId}/safety-cost-usage
- POST /api/v1/documents/{documentId}/safety-cost-usage/refresh

Required frontend routes:
- /projects/[projectId]/safety-costs
- /projects/[projectId]/safety-costs/owner-matrix
- /inspections/[inspectionRoundId]/safety-costs
- /inspections/[inspectionRoundId]/safety-costs/new
- /safety-costs/[usageId]
- /safety-costs/[usageId]/edit
- /safety-costs/[usageId]/evidence
- /safety-costs/[usageId]/review
- /safety-costs/[usageId]/preview
- /safety-costs/[usageId]/history
- /documents/safety-reports/[documentId]/safety-cost-usage

Required frontend components:
- SafetyCostSummaryCard
- SafetyCostUsageForm
- SafetyCostUsageRateGauge
- SafetyCostOwnerMatrix
- SafetyCostEvidenceUploader
- SafetyCostEvidenceTable
- SafetyCostCommentGeneratorPanel
- SafetyCostReviewPanel
- SafetyCostStatusBadge
- SafetyCostWarningPanel
- SafetyCostReportPreviewCard
- SafetyCostHistoryTimeline
- SafetyCostSyncToReportButton

Business requirements:
1. SafetyCostUsage must belong to Project, InspectionRound, and owner ProjectParty.
2. Same inspectionRoundId + ownerPartyId should have at most one active usage record.
3. usedRateCalculated is calculated by the system.
4. userEnteredRate mismatch must generate warning.
5. usedAmount exceeding calculatedAmount must generate danger warning.
6. Confirmation requires basis month/date and basis document or evidence file.
7. AI generated appropriateness comment is draft only.
8. Evidence upload must create FileAsset or link existing FileAsset.
9. Sync-to-report updates safety_cost_usage section, project_summary summary phrase, and implementation_confirmation budget phrase.
10. Amount/comment/evidence changes must create SafetyCostHistoryEvent and AuditLog.
11. Owner matrix should return all owner parties for a project and round.
12. Report export should warn if confirmed safety cost usage is missing.

Seed data:
- 삼성문화재단: calculatedAmount 99462613, usedAmount 37978000, usedRate 38.2, basisMonth 1월말, basisDocument 산업안전보건관리비 사용내역서
- 삼성생명공익재단: calculatedAmount 66928618, usedAmount 27117450, usedRate 40.5, basisMonth 1월말, basisDocument 산업안전보건관리비 사용내역서

Tests:
- test_safety_cost_create_success
- test_safety_cost_requires_project_round_owner
- test_safety_cost_owner_party_must_be_owner
- test_safety_cost_calculates_used_rate
- test_safety_cost_rate_mismatch_warning
- test_safety_cost_used_amount_exceeds_calculated_amount_warning
- test_safety_cost_requires_basis_for_confirm
- test_safety_cost_evidence_upload_link_file
- test_safety_cost_generate_comment
- test_safety_cost_review_create_success
- test_safety_cost_confirm_success
- test_safety_cost_confirm_blocked_without_evidence
- test_safety_cost_sync_to_report_updates_sections
- test_safety_cost_history_created_on_amount_update
- test_safety_cost_owner_matrix_returns_all_owners
- test_safety_cost_report_export_missing_warning

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Rate calculation service
- Validation service
- Evidence upload/link service
- Comment generation service
- Sync-to-report service
- Frontend pages and components
- API client functions
- Type definitions
- Tests
```
