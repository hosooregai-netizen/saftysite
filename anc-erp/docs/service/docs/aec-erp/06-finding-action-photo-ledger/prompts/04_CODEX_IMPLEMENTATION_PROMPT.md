# 04. Codex Implementation Prompt — 지적사항/조치현황/사진대지

## Prompt

```text
You are implementing the Finding, Corrective Action, and Photo Ledger module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module manages findings, corrective actions, evidence photos, photo markups, photo ledger entries, action request mails, and synchronization to safety reports.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Finding/Corrective Action/Photo Ledger module.

Existing concepts:
- Project
- ProjectParty
- InspectionRound
- ChecklistResult
- FindingCandidate
- AdditionalHazardItem
- RiskReductionChecklistItem
- DocumentInstance
- FileAsset
- Folder
- MailThread
- Submission
- AuditLog

Required backend models:
- Finding
- CorrectiveAction
- EvidencePhoto
- PhotoMarkupInfo
- PhotoMarkupShape
- PhotoLedger
- PhotoLedgerEntry
- PhotoLedgerWarning
- FindingTimelineEvent
- ActionRequestMailDraft

Required backend APIs:

Findings:
- GET /api/v1/projects/{projectId}/findings
- POST /api/v1/projects/{projectId}/findings
- GET /api/v1/inspection-rounds/{inspectionRoundId}/findings
- POST /api/v1/inspection-rounds/{inspectionRoundId}/findings
- GET /api/v1/findings/{findingId}
- PATCH /api/v1/findings/{findingId}
- DELETE /api/v1/findings/{findingId}
- POST /api/v1/findings/{findingId}/request-action
- POST /api/v1/findings/{findingId}/verify
- POST /api/v1/findings/{findingId}/reject
- POST /api/v1/findings/{findingId}/close
- POST /api/v1/findings/{findingId}/link-checklist-result
- POST /api/v1/findings/{findingId}/link-owner

Corrective Actions:
- GET /api/v1/findings/{findingId}/actions
- POST /api/v1/findings/{findingId}/actions
- GET /api/v1/corrective-actions/{actionId}
- PATCH /api/v1/corrective-actions/{actionId}
- DELETE /api/v1/corrective-actions/{actionId}
- POST /api/v1/corrective-actions/{actionId}/submit
- POST /api/v1/corrective-actions/{actionId}/verify
- POST /api/v1/corrective-actions/{actionId}/reject

Photos:
- GET /api/v1/findings/{findingId}/photos
- POST /api/v1/findings/{findingId}/photos/upload
- POST /api/v1/findings/{findingId}/photos/link
- PATCH /api/v1/evidence-photos/{photoId}
- DELETE /api/v1/evidence-photos/{photoId}
- POST /api/v1/evidence-photos/{photoId}/markup
- POST /api/v1/evidence-photos/{photoId}/set-caption
- POST /api/v1/evidence-photos/{photoId}/set-representative

Photo Ledger:
- GET /api/v1/inspection-rounds/{inspectionRoundId}/photo-ledgers
- POST /api/v1/inspection-rounds/{inspectionRoundId}/photo-ledgers
- GET /api/v1/photo-ledgers/{photoLedgerId}
- PATCH /api/v1/photo-ledgers/{photoLedgerId}
- DELETE /api/v1/photo-ledgers/{photoLedgerId}
- POST /api/v1/photo-ledgers/{photoLedgerId}/generate-entries
- GET /api/v1/photo-ledgers/{photoLedgerId}/entries
- POST /api/v1/photo-ledgers/{photoLedgerId}/entries
- PATCH /api/v1/photo-ledger-entries/{entryId}
- DELETE /api/v1/photo-ledger-entries/{entryId}
- POST /api/v1/photo-ledgers/{photoLedgerId}/reorder
- POST /api/v1/photo-ledgers/{photoLedgerId}/validate
- POST /api/v1/photo-ledgers/{photoLedgerId}/export
- POST /api/v1/photo-ledgers/{photoLedgerId}/sync-to-report

Mail Integration:
- POST /api/v1/findings/action-request-mail/draft
- POST /api/v1/findings/action-request-mail/send

Required frontend routes:
- /projects/[projectId]/findings
- /projects/[projectId]/findings/new
- /inspections/[inspectionRoundId]/findings
- /inspections/[inspectionRoundId]/findings/new
- /findings/[findingId]
- /findings/[findingId]/edit
- /findings/[findingId]/actions
- /findings/[findingId]/photos
- /findings/[findingId]/verify
- /inspections/[inspectionRoundId]/photo-ledger
- /inspections/[inspectionRoundId]/photo-ledger/new
- /photo-ledgers/[photoLedgerId]
- /photo-ledgers/[photoLedgerId]/edit
- /photo-ledgers/[photoLedgerId]/preview
- /photo-ledgers/[photoLedgerId]/export

Required frontend components:
- FindingTable
- FindingStatusBadge
- FindingRiskBadge
- FindingForm
- FindingSourceLinkPanel
- FindingTimeline
- FindingPhotoGallery
- CorrectiveActionForm
- CorrectiveActionTable
- CorrectiveActionStatusBadge
- VerificationPanel
- ActionRequestMailButton
- PhotoUploader
- PhotoGrid
- PhotoPairMatcher
- PhotoMarkupEditor
- PhotoCaptionEditor
- PhotoLedgerEntryCard
- PhotoLedgerEntryTable
- PhotoLedgerA4Preview
- PhotoLedgerExportChecklist
- OwnerPhotoLedgerFilter
- MissingPhotoWarningPanel

Business requirements:
1. Finding must belong to Project and InspectionRound.
2. Finding may belong to ownerPartyId for owner-specific reports.
3. Finding can be created from FindingCandidate, ChecklistResult, AdditionalHazardItem, RiskReductionChecklistItem, photo, mail, or manual input.
4. sourceType + sourceId duplication should be prevented.
5. CorrectiveAction must belong to Finding.
6. Finding cannot be closed unless at least one CorrectiveAction is verified.
7. EvidencePhoto must be linked to FileAsset.
8. Photo markup must be saved as overlay metadata and must not modify the original image.
9. Yellow dashed ellipse should be supported as the default markup style.
10. PhotoLedger should generate entries from reportInclude=true findings.
11. PhotoLedger owner filter must respect ownerPartyId.
12. PhotoLedger validation must warn missing finding photo, missing action photo, missing action, unverified action, owner mismatch, file missing, and invalid markup.
13. PhotoLedger sync-to-report should update DocumentInstance photo_ledger section and create a new document version.
14. Action request mail draft should include selected findings, required actions, due dates, and photos.
15. All status transitions should create timeline events and audit logs.

Seed data:
Create demo findings for the Leeum elevator replacement project:

Owner: 삼성문화재단
- Finding: 엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치 미비
  Action: 엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치
- Finding: 가설분전함 정·부 책임자 지정 미비
  Action: 가설분전함 정·부 책임자 지정 및 지정관리자가 지속적 관리

Owner: 삼성생명공익재단
- Finding: 방우형 콘센트 덮개 파손으로 인해 감전사고 우려
  Action: 파손된 방우형 콘센트 교체하여 사용
- Finding: 가설분전함의 전선배선 피복 노출부 임시 보완처리 미비
  Action: 가설분전함의 전선배선 피복 노출부 전기용 절연테이프로 보완조치
- Finding: 케이블 릴 전선 풀림상태 안전조치 미비
  Action: 케이블 릴 전선 2줄 이상 감김 상태 유지 확인

Validation:
1. projectId is required for Finding.
2. inspectionRoundId is required for Finding.
3. ownerPartyId must be an owner ProjectParty if provided.
4. title is required.
5. requiredAction is required before action_requested status.
6. CorrectiveAction submit requires actionDetail.
7. CorrectiveAction verify requires verifiedBy and verifiedAt.
8. CorrectiveAction reject requires rejectedReason.
9. EvidencePhoto requires fileId.
10. PhotoLedger export requires at least one entry.
11. PhotoLedger confirmed status cannot have danger warnings.
12. sync-to-report requires documentId.

Tests:
- test_finding_create_success
- test_finding_requires_project_and_round
- test_finding_owner_party_must_be_owner
- test_finding_from_checklist_candidate
- test_finding_prevent_duplicate_source
- test_finding_request_action_changes_status
- test_corrective_action_submit_success
- test_corrective_action_verify_success
- test_corrective_action_reject_requires_reason
- test_finding_close_requires_verified_action
- test_evidence_photo_upload_link_finding
- test_evidence_photo_markup_saved
- test_photo_ledger_create_success
- test_photo_ledger_generate_entries_from_findings
- test_photo_ledger_warns_missing_action_photo
- test_photo_ledger_warns_unverified_action
- test_photo_ledger_owner_filter
- test_photo_ledger_reorder_entries
- test_photo_ledger_export_uses_confirmed_entries
- test_photo_ledger_sync_to_safety_report
- test_action_request_mail_draft_includes_findings

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Photo ledger generation service
- Photo ledger validation service
- Photo markup metadata service
- Action request mail draft service
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```
