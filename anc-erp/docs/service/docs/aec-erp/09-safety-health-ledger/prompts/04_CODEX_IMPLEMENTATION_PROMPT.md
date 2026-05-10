# 04. Codex Implementation Prompt — 안전보건대장 자동화

## Prompt

```text
You are implementing the Safety Health Ledger Automation module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module creates and maintains a project-level SafetyHealthLedger by accumulating risk register items, reduction measures, inspection history, finding/action history, safety cost history, attachments, versions, and export snapshots.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Safety Health Ledger module.

Existing concepts:
- Project
- Organization
- ProjectParty
- Contact
- Contract
- SafetyManagementPlan
- SafetyManagementRiskItem
- InspectionRound
- ChecklistSession
- ChecklistResult
- Finding
- CorrectiveAction
- EvidencePhoto
- SafetyCostUsage
- DocumentInstance
- FileAsset
- Folder
- AuditLog

Required backend models:
- SafetyHealthLedger
- SafetyHealthLedgerSnapshot
- LedgerMeta
- SafetyHealthLedgerSection
- LedgerRiskItem
- LedgerRiskReductionMeasure
- LedgerInspectionHistory
- LedgerFindingHistory
- LedgerSafetyCostHistory
- LedgerAttachment
- SafetyHealthLedgerVersion
- LedgerMissingField
- LedgerReviewWarning
- LedgerSourceLink

Required backend APIs:

Ledgers:
- GET /api/v1/projects/{projectId}/safety-health-ledgers
- POST /api/v1/projects/{projectId}/safety-health-ledgers
- GET /api/v1/safety-health-ledgers/{ledgerId}
- PATCH /api/v1/safety-health-ledgers/{ledgerId}
- DELETE /api/v1/safety-health-ledgers/{ledgerId}
- POST /api/v1/safety-health-ledgers/{ledgerId}/generate
- POST /api/v1/safety-health-ledgers/{ledgerId}/validate
- POST /api/v1/safety-health-ledgers/{ledgerId}/confirm
- POST /api/v1/safety-health-ledgers/{ledgerId}/export
- POST /api/v1/safety-health-ledgers/{ledgerId}/archive

Sections:
- GET /api/v1/safety-health-ledgers/{ledgerId}/sections
- POST /api/v1/safety-health-ledgers/{ledgerId}/sections/{sectionKey}/save
- POST /api/v1/safety-health-ledgers/{ledgerId}/sections/{sectionKey}/regenerate
- PATCH /api/v1/safety-health-ledger-sections/{sectionId}

Risk Register:
- GET /api/v1/safety-health-ledgers/{ledgerId}/risks
- POST /api/v1/safety-health-ledgers/{ledgerId}/risks
- PATCH /api/v1/safety-health-ledger-risks/{riskId}
- DELETE /api/v1/safety-health-ledger-risks/{riskId}
- POST /api/v1/safety-health-ledgers/{ledgerId}/risks/import-from-plan
- POST /api/v1/safety-health-ledgers/{ledgerId}/risks/detect-recurrence

Measures:
- GET /api/v1/safety-health-ledgers/{ledgerId}/measures
- POST /api/v1/safety-health-ledgers/{ledgerId}/measures
- PATCH /api/v1/safety-health-ledger-measures/{measureId}
- DELETE /api/v1/safety-health-ledger-measures/{measureId}

Histories:
- GET /api/v1/safety-health-ledgers/{ledgerId}/inspection-history
- POST /api/v1/safety-health-ledgers/{ledgerId}/inspection-history/sync
- GET /api/v1/safety-health-ledgers/{ledgerId}/finding-history
- POST /api/v1/safety-health-ledgers/{ledgerId}/finding-history/sync
- GET /api/v1/safety-health-ledgers/{ledgerId}/safety-cost-history
- POST /api/v1/safety-health-ledgers/{ledgerId}/safety-cost-history/sync

Attachments and versions:
- GET /api/v1/safety-health-ledgers/{ledgerId}/attachments
- POST /api/v1/safety-health-ledgers/{ledgerId}/attachments
- DELETE /api/v1/safety-health-ledger-attachments/{attachmentId}
- GET /api/v1/safety-health-ledgers/{ledgerId}/versions
- GET /api/v1/safety-health-ledger-versions/{versionId}
- POST /api/v1/safety-health-ledgers/{ledgerId}/versions

Required frontend routes:
- /projects/[projectId]/safety-health-ledgers
- /projects/[projectId]/safety-health-ledgers/new
- /safety-health-ledgers/[ledgerId]
- /safety-health-ledgers/[ledgerId]/edit
- /safety-health-ledgers/[ledgerId]/risks
- /safety-health-ledgers/[ledgerId]/measures
- /safety-health-ledgers/[ledgerId]/inspections
- /safety-health-ledgers/[ledgerId]/findings
- /safety-health-ledgers/[ledgerId]/safety-costs
- /safety-health-ledgers/[ledgerId]/attachments
- /safety-health-ledgers/[ledgerId]/preview
- /safety-health-ledgers/[ledgerId]/export
- /safety-health-ledgers/[ledgerId]/versions

Required frontend components:
- LedgerWizard
- LedgerStatusBadge
- LedgerSectionNavigator
- LedgerSectionEditor
- LedgerA4Preview
- LedgerMissingFieldPanel
- LedgerReviewWarningPanel
- LedgerVersionHistory
- LedgerExportChecklist
- LedgerRiskRegisterTable
- LedgerRiskItemForm
- LedgerRiskStatusBadge
- RiskReductionMeasureTable
- RiskRecurrenceBadge
- LedgerInspectionHistoryTable
- LedgerFindingHistoryTable
- LedgerActionHistoryTimeline
- LedgerSafetyCostHistoryTable
- LedgerAttachmentPanel
- LedgerSourceLinkPanel
- LedgerSyncPreviewModal

Business requirements:
1. SafetyHealthLedger belongs to Project.
2. There should be one active ledger per Project by default.
3. Ledger can import risk items from SafetyManagementPlan.
4. Ledger can sync inspection history from InspectionRound and ChecklistSession.
5. Ledger can sync finding/action history from Finding and CorrectiveAction.
6. Ledger can sync safety cost history from SafetyCostUsage.
7. Ledger must keep sourceLinks to original entities.
8. Repeated risk detection should mark recurrence in LedgerRiskItem and LedgerFindingHistory.
9. Ledger export must use the latest saved snapshot.
10. Export must create FileAsset and update exportedFileId.
11. Sync actions must create a new SafetyHealthLedgerVersion.
12. Required missing fields block final export.
13. Open findings and repeated risks show warnings, not automatic blocking unless configured.
14. AI-generated content is draft only.

Validation:
1. projectId is required.
2. hazardDescription is required for LedgerRiskItem.
3. riskItemId is required for LedgerRiskReductionMeasure.
4. attachment fileId must reference FileAsset.
5. export requires latest snapshot validation.
6. active duplicate ledger should be blocked or warned.

Seed data:
Create a demo SafetyHealthLedger for the Leeum elevator replacement project. Import risk items from the safety management plan candidate set:
- 승강기 철거: 추락, 낙하·비래
- 승강기 설치: 협착, 중량물 양중
- 에스컬레이터 교체: 추락, 협착
- 전기·가설전기 작업: 감전
- 용접·화기 작업: 화재
- 이동식 사다리/말비계 작업: 추락
- 승강로·피트 작업: 밀폐 또는 협소공간

Tests:
- test_safety_health_ledger_create_success
- test_safety_health_ledger_prevents_duplicate_active_ledger
- test_safety_health_ledger_imports_risks_from_safety_management_plan
- test_ledger_risk_requires_hazard_description
- test_ledger_syncs_inspection_history
- test_ledger_syncs_finding_action_history
- test_ledger_syncs_safety_cost_history
- test_ledger_detects_repeated_risks
- test_ledger_version_created_on_sync
- test_ledger_export_blocked_when_required_missing
- test_ledger_export_uses_latest_saved_snapshot
- test_ledger_export_creates_file_asset
- test_ledger_attachment_links_file_asset
- test_ledger_stale_source_warning_created

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Ledger generation service
- Risk import service
- History sync service
- Recurrence detection service
- Export service adapter placeholder
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```
