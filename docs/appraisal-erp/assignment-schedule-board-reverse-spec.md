# Reverse Spec - Assignment Schedule Board

## Purpose

- Recover the controller-facing schedule board for case milestones and shared calendar management.
- Preserve month-grid planning, unscheduled queue review, assignment edits, date-window validation, and quick rescheduling inside allowed windows.

## Source Mapping

- Base pattern:
  - [../reverse-specs/admin-schedules-section-reverse-spec.md](../reverse-specs/admin-schedules-section-reverse-spec.md)
- Detail-shell dependency:
  - [case-directory-and-detail-shell-reverse-spec.md](./case-directory-and-detail-shell-reverse-spec.md)
- Renamed entities:
  - `inspection schedule` -> `CaseSchedule`
  - `round` -> milestone
  - `assignee` -> appraiser or reviewer owner
- Removed semantics:
  - visit-round numbering
  - construction schedule generation
- New appraisal-only logic:
  - milestone types across intake, inspection, drafting, review, delivery, and finance

## Feature Goal

Users must be able to:

- see all scheduled case milestones in a monthly calendar
- see open or unscheduled milestones in a queue
- assign owners and dates
- move milestones within permitted windows
- track due pressure before a case slips past deadline

## User Role

- primary user: operations admin
- secondary user: team lead or reviewer with schedule authority
- preconditions:
  - authenticated appraisal ERP session
  - rights to edit shared case schedules

## Entry and Scope

- route: `/appraisal?section=schedules`
- optional search params:
  - `month`
  - `ownerUserId`
  - `status`
  - `query`
- out of scope:
  - personal appraiser schedule screen behavior
  - report body editing

## Data Contracts

### Main entities

`CaseSchedule`

- `scheduleId`
- `caseKey`
- `caseNo`
- `orderNo`
- `milestoneType`
- `plannedDate`
- `windowStart`
- `windowEnd`
- `ownerUserId`
- `ownerUserName`
- `status`
- `changeReasonLabel`
- `changeReasonMemo`
- `caseStatus`
- `dueDate`
- `href`

Supported `milestoneType` defaults:

- `intake_review`
- `site_visit`
- `subject_verification`
- `draft_due`
- `review_due`
- `delivery_due`
- `invoice_due`

### Read APIs

- `GET /api/appraisal/schedules/calendar`
  - filters:
    - `month`
    - `owner_user_id`
    - `status`
    - `query`
    - `view`
  - response:
    - `rows`
    - `monthTotal`
    - `queueTotal`
    - `availableMonths`
    - `refreshedAt`

### Write APIs

- `PATCH /api/appraisal/schedules/:scheduleId`
  - payload may include:
    - `plannedDate`
    - `ownerUserId`
    - `status`
    - `changeReasonLabel`
    - `changeReasonMemo`

### Output or download APIs

- schedule export uses the current normalized month model and queue model

## Caching and Persistence

- calendar cache key:
  - `appraisal-schedules:calendar:${requestKey}`
- queue cache key:
  - `appraisal-schedules:queue:${requestKey}`
- TTL: `5 minutes`
- moving or editing a schedule patches visible rows locally and invalidates the matching month cache

## State Model

### Primary local state

- `month`
- `query`
- `ownerUserId`
- `status`
- `selectedDate`
- `dialogOpen`
- `activeScheduleId`
- `dragScheduleId`
- `rows`
- `queueRows`
- `loading`
- `error`
- `notice`

### Derived state

- `requestKey`
- `rowsByDate`
- `visibleQueueRows`
- `sortedQueueRows`
- `activeSchedule`
- `dialogEligibleRows`
- `dialogWindowError`
- `showOtherMonthHint`

## Business Rules

### Identifier rules

- calendar chips must show `caseNo` and `milestoneType`
- schedule save and navigation always use `scheduleId` and `caseKey`

### Domain rules

- milestone ordering may not regress behind already-completed predecessor milestones
- `draft_due` cannot be marked complete before at least one report draft exists
- `review_due` cannot complete before report review request exists
- `delivery_due` and `invoice_due` cannot complete before report approval
- drop is allowed only when target date is inside `windowStart ~ windowEnd`

### Validation rules

- save is blocked unless:
  - a schedule row is selected
  - `plannedDate` exists
  - `changeReasonLabel` is present when changing an existing planned date
  - target date stays in window
- status transitions that would skip report approval must be rejected

## UI Composition

### Main sections

- month toolbar
- filter and owner controls
- calendar grid
- unscheduled queue
- selected-date detail list

### Modal and overlay structure

- milestone edit dialog
- same-date conflict panel inside dialog
- drag-move validation hint

## Interaction Flows

### Initial load

1. resolve month and filters
2. hydrate cached month data if present
3. fetch current month calendar rows
4. derive queue rows and day buckets
5. render calendar and queue

### Schedule edit flow

1. user opens a milestone row or calendar chip
2. dialog prefills owner, date, and last change reason
3. user changes owner or planned date
4. save patches the visible row and queue

### Drag-move flow

1. user drags a scheduled chip
2. target date is validated against the allowed window
3. successful drop writes the new `plannedDate`
4. calendar and queue rerender without a full page reset

## Error Handling

- stale schedule saves must return a visible notice and refetch the affected month
- calendar load failures show an inline error state without destroying current filters
- invalid drag targets show a non-blocking validation hint

## Non-Obvious Implementation Notes

- The shared board and the personal board must use the same milestone vocabulary.
- Queue and calendar are two views over the same normalized schedule rows.
- Delivery and finance milestones are visible here, but their completion still depends on downstream report and finance rules.

## Recovery Checklist

- [ ] Month grid renders from `CaseSchedule` rows
- [ ] Queue rows and calendar chips stay in sync
- [ ] Save and drag-move both obey window rules
- [ ] Delivery and finance milestones cannot bypass approval rules
- [ ] Calendar rows always link back to stable case identifiers

## Verification

- load one month, move one milestone, refresh, and confirm persistence
- test one blocked drag outside the allowed window
- verify delivery and invoice milestone completion is approval-gated

