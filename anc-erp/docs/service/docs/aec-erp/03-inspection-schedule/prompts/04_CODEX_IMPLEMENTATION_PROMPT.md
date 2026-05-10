# 04. Codex Implementation Prompt — 점검회차/일정 관리

## Prompt

```text
You are implementing the Inspection Schedule and Rounds module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module manages inspection schedules, inspection rounds, owner-specific report tasks, round tasks, rescheduling logs, milestone labels, calendar views, and work schedule attachments.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Inspection Schedule and Rounds module.

Existing concepts:
- Project
- Contract
- Organization
- ProjectParty
- Contact
- FileAsset
- Folder
- AuditLog
- DocumentInstance

Required backend models:
- InspectionSchedule
- InspectionRound
- InspectionOwnerReportTask
- InspectionTask
- WorkScheduleAttachment
- InspectionRescheduleLog
- InspectionRoundMilestone

Required backend APIs:

Schedule:
- GET /api/v1/projects/{projectId}/inspection-schedules
- POST /api/v1/projects/{projectId}/inspection-schedules
- GET /api/v1/inspection-schedules/{scheduleId}
- PATCH /api/v1/inspection-schedules/{scheduleId}
- DELETE /api/v1/inspection-schedules/{scheduleId}
- POST /api/v1/projects/{projectId}/inspection-schedules/preview
- POST /api/v1/projects/{projectId}/inspection-schedules/generate

Rounds:
- GET /api/v1/projects/{projectId}/inspection-rounds
- POST /api/v1/projects/{projectId}/inspection-rounds
- GET /api/v1/inspection-rounds/{inspectionRoundId}
- PATCH /api/v1/inspection-rounds/{inspectionRoundId}
- DELETE /api/v1/inspection-rounds/{inspectionRoundId}
- POST /api/v1/inspection-rounds/{inspectionRoundId}/confirm-date
- POST /api/v1/inspection-rounds/{inspectionRoundId}/reschedule
- POST /api/v1/inspection-rounds/{inspectionRoundId}/close

Owner Report Tasks:
- GET /api/v1/inspection-rounds/{inspectionRoundId}/owner-report-tasks
- POST /api/v1/inspection-rounds/{inspectionRoundId}/owner-report-tasks/generate
- PATCH /api/v1/owner-report-tasks/{taskId}
- POST /api/v1/owner-report-tasks/{taskId}/link-document
- POST /api/v1/owner-report-tasks/{taskId}/mark-exported
- POST /api/v1/owner-report-tasks/{taskId}/mark-submitted

Inspection Tasks:
- GET /api/v1/inspection-rounds/{inspectionRoundId}/tasks
- POST /api/v1/inspection-rounds/{inspectionRoundId}/tasks
- PATCH /api/v1/inspection-tasks/{taskId}
- POST /api/v1/inspection-rounds/{inspectionRoundId}/tasks/generate-defaults

Attachments:
- GET /api/v1/inspection-rounds/{inspectionRoundId}/attachments
- POST /api/v1/inspection-rounds/{inspectionRoundId}/attachments
- PATCH /api/v1/work-schedule-attachments/{attachmentId}
- DELETE /api/v1/work-schedule-attachments/{attachmentId}

Calendar:
- GET /api/v1/calendar/inspection-rounds
- GET /api/v1/calendar/inspection-tasks

Required frontend routes:
- /projects/[projectId]/inspections
- /projects/[projectId]/inspections/schedule
- /projects/[projectId]/inspections/new
- /inspections/[inspectionRoundId]
- /inspections/[inspectionRoundId]/edit
- /inspections/[inspectionRoundId]/tasks
- /inspections/[inspectionRoundId]/owner-reports
- /inspections/[inspectionRoundId]/attachments
- /calendar/inspections

Required frontend components:
- InspectionTimeline
- InspectionYearGrid
- InspectionMonthGrid
- InspectionRoundCard
- InspectionRoundTable
- InspectionStatusBadge
- InspectionScheduleGenerator
- InspectionSchedulePreview
- OwnerReportTaskList
- OwnerReportStatusMatrix
- InspectionTaskChecklist
- InspectionReminderPanel
- InspectionRescheduleModal
- WorkScheduleAttachmentPanel
- WorkSchedulePreview
- RoundDependencyStatus
- MilestoneBadge

Business requirements:
1. InspectionSchedule belongs to Project.
2. InspectionRound belongs to Project and optionally to InspectionSchedule.
3. A project cannot have duplicated roundNo.
4. InspectionSchedule preview must not persist data.
5. InspectionSchedule generate must create:
   - one InspectionSchedule
   - N InspectionRound records
   - OwnerReportTask records for owner ProjectParty where requiresSeparateReport is true
   - default InspectionTask records for each round
6. OwnerReportTask is created per owner party per round.
7. Round documentNo defaults to `제{year}-{roundNo two digits}호`.
8. actualInspectionDate, plannedDate, plannedMonth must be separated.
9. Rescheduling must create InspectionRescheduleLog.
10. Submitted round status requires all owner report tasks to be submitted or confirmed.
11. Closed round status should require checklist/documents/photos to be completed when those modules exist.
12. WorkScheduleAttachment links FileAsset to Project and optionally to InspectionRound.
13. Calendar endpoint returns rounds and tasks in a date range.
14. All status changes should create AuditLog.
15. Milestone labels such as `1차기성` and `준공금` should be exposed on round cards.

Seed data:
Create inspection schedule for the Leeum elevator replacement project:
- scheduleName: 리움미술관 승강기 교체공사 공사안전보건대장 이행점검
- basisType: contract_period
- cycleText: 3개월 이내 1회
- totalRounds: 10
- rounds:
  - 1: 2026-01, plannedDate 2026-01-23, actualInspectionDate 2026-01-23, documentNo 제2026-01호
  - 2: 2026-04
  - 3: 2026-07
  - 4: 2026-10, milestone 1차기성
  - 5: 2027-01
  - 6: 2027-04
  - 7: 2027-07
  - 8: 2027-10
  - 9: 2028-01
  - 10: 2028-02, milestone 준공금
- owner report tasks for:
  - 삼성문화재단
  - 삼성생명공익재단

Validation:
1. projectId is required.
2. totalRounds must be greater than 0.
3. roundNo must be unique in the project.
4. ownerPartyId must refer to a ProjectParty with role owner.
5. mark-submitted requires submittedAt or mailThreadId.
6. reschedule requires reason.
7. close requires dependency check.
8. preview endpoint must not mutate repositories.

Tests:
- test_inspection_schedule_preview_success
- test_inspection_schedule_preview_does_not_persist
- test_inspection_schedule_generate_10_rounds
- test_inspection_round_no_unique_per_project
- test_inspection_round_document_no_generation
- test_inspection_schedule_generates_owner_report_tasks
- test_owner_report_task_created_only_for_separate_report_owner
- test_inspection_task_defaults_created
- test_inspection_reschedule_creates_log
- test_round_submitted_requires_all_owner_reports_submitted
- test_round_closed_requires_dependencies
- test_work_schedule_attachment_linked_to_round
- test_calendar_returns_inspection_rounds
- test_milestone_labels_are_exposed

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```
