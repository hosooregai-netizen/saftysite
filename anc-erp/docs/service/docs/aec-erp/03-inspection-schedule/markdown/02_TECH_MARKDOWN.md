# 02. Tech Markdown — 점검회차/일정 관리

## 1. Frontend Routes

```text
/projects/[projectId]/inspections
/projects/[projectId]/inspections/schedule
/projects/[projectId]/inspections/new
/inspections/[inspectionRoundId]
/inspections/[inspectionRoundId]/edit
/inspections/[inspectionRoundId]/tasks
/inspections/[inspectionRoundId]/owner-reports
/inspections/[inspectionRoundId]/attachments
/calendar/inspections
```

## 2. Frontend Components

```text
InspectionSchedulePage
InspectionCalendarPage
InspectionRoundDetailPage
InspectionRoundCreatePage
InspectionRoundEditPage

InspectionTimeline
InspectionYearGrid
InspectionMonthGrid
InspectionRoundCard
InspectionRoundTable
InspectionStatusBadge
InspectionScheduleGenerator
InspectionSchedulePreview
OwnerReportTaskList
OwnerReportStatusMatrix
InspectionTaskChecklist
InspectionReminderPanel
InspectionRescheduleModal
WorkScheduleAttachmentPanel
WorkSchedulePreview
RoundDependencyStatus
MilestoneBadge
```

## 3. Backend APIs

### Schedule

```text
GET    /api/v1/projects/{projectId}/inspection-schedules
POST   /api/v1/projects/{projectId}/inspection-schedules
GET    /api/v1/inspection-schedules/{scheduleId}
PATCH  /api/v1/inspection-schedules/{scheduleId}
DELETE /api/v1/inspection-schedules/{scheduleId}

POST   /api/v1/projects/{projectId}/inspection-schedules/preview
POST   /api/v1/projects/{projectId}/inspection-schedules/generate
```

### Rounds

```text
GET    /api/v1/projects/{projectId}/inspection-rounds
POST   /api/v1/projects/{projectId}/inspection-rounds
GET    /api/v1/inspection-rounds/{inspectionRoundId}
PATCH  /api/v1/inspection-rounds/{inspectionRoundId}
DELETE /api/v1/inspection-rounds/{inspectionRoundId}

POST   /api/v1/inspection-rounds/{inspectionRoundId}/confirm-date
POST   /api/v1/inspection-rounds/{inspectionRoundId}/reschedule
POST   /api/v1/inspection-rounds/{inspectionRoundId}/close
```

### Owner Report Tasks

```text
GET    /api/v1/inspection-rounds/{inspectionRoundId}/owner-report-tasks
POST   /api/v1/inspection-rounds/{inspectionRoundId}/owner-report-tasks/generate
PATCH  /api/v1/owner-report-tasks/{taskId}
POST   /api/v1/owner-report-tasks/{taskId}/link-document
POST   /api/v1/owner-report-tasks/{taskId}/mark-exported
POST   /api/v1/owner-report-tasks/{taskId}/mark-submitted
```

### Inspection Tasks

```text
GET    /api/v1/inspection-rounds/{inspectionRoundId}/tasks
POST   /api/v1/inspection-rounds/{inspectionRoundId}/tasks
PATCH  /api/v1/inspection-tasks/{taskId}
POST   /api/v1/inspection-rounds/{inspectionRoundId}/tasks/generate-defaults
```

### Attachments

```text
GET    /api/v1/inspection-rounds/{inspectionRoundId}/attachments
POST   /api/v1/inspection-rounds/{inspectionRoundId}/attachments
PATCH  /api/v1/work-schedule-attachments/{attachmentId}
DELETE /api/v1/work-schedule-attachments/{attachmentId}
```

### Calendar

```text
GET /api/v1/calendar/inspection-rounds
GET /api/v1/calendar/inspection-tasks
```

## 4. Data Models

### InspectionSchedule

```ts
type InspectionScheduleStatus = 'draft' | 'active' | 'completed' | 'archived'

type InspectionScheduleBasisType =
  | 'project_period'
  | 'contract_period'
  | 'manual'

type InspectionSchedule = {
  id: string
  projectId: string
  contractId?: string
  scheduleName: string
  basisType: InspectionScheduleBasisType
  cycleText: string
  totalRounds: number
  startDate?: string
  endDate?: string
  status: InspectionScheduleStatus
  createdAt: string
  updatedAt: string
}
```

### InspectionRound

```ts
type InspectionRoundStatus =
  | 'planned'
  | 'scheduled'
  | 'in_progress'
  | 'checked'
  | 'review'
  | 'report_ready'
  | 'submitted'
  | 'closed'
  | 'cancelled'

type InspectionRound = {
  id: string
  projectId: string
  scheduleId?: string
  roundNo: number
  documentNo?: string
  plannedMonth?: string
  plannedDate?: string
  actualInspectionDate?: string
  inspectorUserId?: string
  confirmerContactId?: string
  contractorContactId?: string
  status: InspectionRoundStatus
  reportDueDate?: string
  milestoneLabel?: string
  memo?: string
  createdAt: string
  updatedAt: string
}
```

### InspectionOwnerReportTask

```ts
type OwnerReportTaskStatus =
  | 'not_started'
  | 'drafting'
  | 'review'
  | 'exported'
  | 'submitted'
  | 'confirmed'
  | 'cancelled'

type InspectionOwnerReportTask = {
  id: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId: string
  documentInstanceId?: string
  status: OwnerReportTaskStatus
  exportedFileId?: string
  submittedAt?: string
  mailThreadId?: string
  createdAt: string
  updatedAt: string
}
```

### InspectionTask

```ts
type InspectionTaskType =
  | 'schedule_confirm'
  | 'owner_coordination'
  | 'contractor_coordination'
  | 'prepare_materials'
  | 'site_inspection'
  | 'checklist_input'
  | 'finding_summary'
  | 'photo_ledger'
  | 'report_draft'
  | 'internal_review'
  | 'owner_submission'
  | 'follow_up'

type InspectionTaskStatus =
  | 'todo'
  | 'in_progress'
  | 'done'
  | 'blocked'
  | 'cancelled'

type InspectionTask = {
  id: string
  projectId: string
  inspectionRoundId: string
  taskType: InspectionTaskType
  title: string
  dueDate?: string
  assigneeId?: string
  status: InspectionTaskStatus
  linkedEntityType?: string
  linkedEntityId?: string
  createdAt: string
  updatedAt: string
}
```

### WorkScheduleAttachment

```ts
type WorkScheduleAttachment = {
  id: string
  projectId: string
  inspectionRoundId?: string
  year?: number
  title: string
  fileId: string
  highlightedArea?: Record<string, unknown>
  note?: string
  createdAt: string
  updatedAt: string
}
```

### InspectionRescheduleLog

```ts
type InspectionRescheduleLog = {
  id: string
  inspectionRoundId: string
  previousPlannedDate?: string
  nextPlannedDate?: string
  previousActualDate?: string
  nextActualDate?: string
  reason: string
  requestedBy?: string
  approvedBy?: string
  createdAt: string
}
```

## 5. Repository Interfaces

```ts
interface InspectionScheduleRepository {
  listByProject(projectId: string): Promise<InspectionSchedule[]>
  getById(scheduleId: string): Promise<InspectionSchedule | null>
  create(input: InspectionScheduleCreateInput): Promise<InspectionSchedule>
  update(scheduleId: string, input: InspectionScheduleUpdateInput): Promise<InspectionSchedule>
  delete(scheduleId: string): Promise<void>
}

interface InspectionRoundRepository {
  listByProject(projectId: string): Promise<InspectionRound[]>
  listBySchedule(scheduleId: string): Promise<InspectionRound[]>
  getById(inspectionRoundId: string): Promise<InspectionRound | null>
  create(input: InspectionRoundCreateInput): Promise<InspectionRound>
  update(inspectionRoundId: string, input: InspectionRoundUpdateInput): Promise<InspectionRound>
  delete(inspectionRoundId: string): Promise<void>
}

interface OwnerReportTaskRepository {
  listByRound(inspectionRoundId: string): Promise<InspectionOwnerReportTask[]>
  create(input: OwnerReportTaskCreateInput): Promise<InspectionOwnerReportTask>
  update(taskId: string, input: OwnerReportTaskUpdateInput): Promise<InspectionOwnerReportTask>
}

interface InspectionTaskRepository {
  listByRound(inspectionRoundId: string): Promise<InspectionTask[]>
  create(input: InspectionTaskCreateInput): Promise<InspectionTask>
  update(taskId: string, input: InspectionTaskUpdateInput): Promise<InspectionTask>
}
```

## 6. Validation Rules

### InspectionSchedule

- `projectId`는 필수다.
- `totalRounds`는 1 이상 정수다.
- `basisType = project_period`이면 Project의 startDate/endDate가 필요하다.
- `basisType = contract_period`이면 Contract의 contractStartDate/contractEndDate가 필요하다.
- 미리보기 API는 데이터를 저장하지 않는다.

### InspectionRound

- `roundNo`는 1 이상 정수다.
- 같은 `projectId` 안에서 `roundNo`는 중복될 수 없다.
- `plannedMonth`, `plannedDate`, `actualInspectionDate`를 분리한다.
- `submitted` 상태가 되려면 발주처별 보고서 업무가 모두 submitted 또는 confirmed여야 한다.
- `closed` 상태가 되려면 체크리스트, 지적사항, 사진대지, 보고서 종속 조건을 통과해야 한다.

### OwnerReportTask

- `ownerPartyId`는 ProjectParty 중 role이 owner인 대상이어야 한다.
- `requiresSeparateReport = true`인 owner는 자동 생성 대상이다.
- `submitted` 상태는 `submittedAt` 또는 `mailThreadId`가 있어야 한다.

## 7. Service Rules

### Schedule Preview

```text
1. Project 조회
2. Contract 선택 시 Contract 조회
3. basisType 확인
4. startDate/endDate 확인
5. cycleText/totalRounds 확인
6. 기본 회차 후보 생성
7. 발주처별 보고서 업무 후보 생성
8. 사용자에게 preview 반환
```

### Schedule Generate

```text
1. InspectionSchedule 생성
2. InspectionRound N개 생성
3. 각 round별 OwnerReportTask 생성
4. 각 round별 기본 InspectionTask 생성
5. 회차별 웹하드 폴더 생성 이벤트 발행
6. AuditLog 기록
```

### OwnerReportTask 자동 생성

```text
ProjectParty where role = owner and requiresSeparateReport = true
→ InspectionOwnerReportTask 생성
```

### Document Number 생성

기본 규칙:

```text
제{year}-{roundNo padded 2}호
```

예시:

```text
제2026-01호
```

단, 문서번호는 사용자가 직접 수정할 수 있어야 한다.

### Default Task Due Date

점검일이 있는 경우:

| 업무 | 기준 |
|---|---|
| schedule_confirm | D-30 |
| owner_coordination | D-14 |
| contractor_coordination | D-14 |
| prepare_materials | D-7 |
| site_inspection | D-Day |
| checklist_input | D+1 |
| finding_summary | D+3 |
| photo_ledger | D+5 |
| report_draft | D+7 |
| internal_review | D+10 |
| owner_submission | D+14 |

점검 예정일이 없고 예정월만 있으면 dueDate는 null로 두고 warning을 표시한다.

## 8. API Response Example

```json
{
  "schedule": {
    "id": "schedule_leeum_2026_2028",
    "projectId": "project_leeum_elevator_2026",
    "scheduleName": "리움미술관 승강기 교체공사 공사안전보건대장 이행점검",
    "basisType": "contract_period",
    "cycleText": "3개월 이내 1회",
    "totalRounds": 10,
    "startDate": "2026-01-01",
    "endDate": "2028-02-29",
    "status": "active"
  },
  "rounds": [
    {
      "roundNo": 1,
      "documentNo": "제2026-01호",
      "plannedMonth": "2026-01",
      "plannedDate": "2026-01-23",
      "actualInspectionDate": "2026-01-23",
      "status": "submitted"
    },
    {
      "roundNo": 2,
      "documentNo": "제2026-02호",
      "plannedMonth": "2026-04",
      "status": "planned"
    }
  ],
  "ownerReportTasks": [
    {
      "roundNo": 1,
      "ownerName": "삼성문화재단",
      "status": "submitted"
    },
    {
      "roundNo": 1,
      "ownerName": "삼성생명공익재단",
      "status": "submitted"
    }
  ]
}
```

## 9. Tests

```text
test_inspection_schedule_preview_success
test_inspection_schedule_preview_does_not_persist
test_inspection_schedule_generate_10_rounds
test_inspection_round_no_unique_per_project
test_inspection_round_document_no_generation
test_inspection_schedule_generates_owner_report_tasks
test_owner_report_task_created_only_for_separate_report_owner
test_inspection_task_defaults_created
test_inspection_reschedule_creates_log
test_round_submitted_requires_all_owner_reports_submitted
test_round_closed_requires_checklist_and_documents
test_work_schedule_attachment_linked_to_round
test_calendar_returns_inspection_rounds
test_milestone_labels_are_exposed
```
