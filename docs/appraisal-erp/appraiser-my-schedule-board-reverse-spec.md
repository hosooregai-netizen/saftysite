# Reverse Spec - Appraiser My-Schedule Board

## Purpose

- Recover the worker-style personal schedule board for an appraiser's assigned case milestones.
- Preserve the personal queue, monthly calendar, reason capture, and self-service reschedule request flow without exposing the full controller board.

## Source Mapping

- Base pattern:
  - [../reverse-specs/worker-calendar-schedule-board-reverse-spec.md](../reverse-specs/worker-calendar-schedule-board-reverse-spec.md)
- Shared calendar vocabulary:
  - [assignment-schedule-board-reverse-spec.md](./assignment-schedule-board-reverse-spec.md)
- Renamed entities:
  - `worker schedule` -> personal appraisal milestone board
  - `visit selection reason` -> schedule change reason
- Removed semantics:
  - admin redirect into safety schedule section
  - construction-round language
- New appraisal-only logic:
  - case milestone confirmation
  - reschedule requests with due-date awareness

## Feature Goal

Users must be able to:

- see only their assigned milestones for a selected month
- pick or revise a valid date within the allowed window
- enter a reason label and detailed memo when changing a milestone
- inspect same-day conflicts with their own other cases
- jump from a schedule row into the linked case or report

## User Role

- primary user: assigned appraiser
- secondary user: reviewer using personal workload scope
- preconditions:
  - authenticated appraisal ERP user
  - at least one assigned milestone

## Entry and Scope

- route: `/appraisal?section=schedules&view=me`
- optional search params:
  - `month`
  - `status`
  - `caseKey`
- out of scope:
  - controller drag-move over all users
  - bulk reassignment between staff

## Data Contracts

### Main entities

`CaseSchedule`

- `scheduleId`
- `caseKey`
- `caseNo`
- `milestoneType`
- `plannedDate`
- `windowStart`
- `windowEnd`
- `status`
- `changeReasonLabel`
- `changeReasonMemo`
- `dueDate`
- `reportKey`

### Read APIs

- `GET /api/appraisal/schedules/calendar`
  - filters:
    - `month`
    - `view=me`
    - `status`
    - `case_key`
  - response:
    - `rows`
    - `monthTotal`
    - `queueTotal`
    - `refreshedAt`

### Write APIs

- `PATCH /api/appraisal/schedules/:scheduleId`
  - accepted fields:
    - `plannedDate`
    - `status`
    - `changeReasonLabel`
    - `changeReasonMemo`

### Output or download APIs

- no export is required for v1 personal schedule flow

## Caching and Persistence

- personal schedule cache key:
  - `appraisal-schedules:me:${requestKey}`
- TTL: `5 minutes`
- successful save replaces the local row immediately and updates the matching personal cache entry

## State Model

### Primary local state

- `month`
- `status`
- `caseKey`
- `rows`
- `loading`
- `error`
- `notice`
- `selectedDate`
- `dialog`

### Derived state

- `unplannedRows`
- `plannedRows`
- `rowsByDate`
- `dialogSelectedSchedule`
- `dialogEligibleRows`
- `dialogSelectedRows`
- `dialogWindowError`

## Business Rules

### Identifier rules

- schedule rows display `caseNo` plus `milestoneType`
- case or report links always route through `caseKey` or `reportKey`

### Domain rules

- users may edit only rows currently assigned to themselves unless they hold schedule-admin permission
- eligible rows for a selected day are:
  - unplanned rows in the allowed window
  - the currently selected row
- reschedule reason is required when changing a previously saved date
- personal schedule completion must not mark delivery or invoice milestones complete before report approval

### Validation rules

- save is blocked unless:
  - one row is selected
  - `plannedDate` exists
  - reason label and memo are both present for a changed date
  - selected date is inside the row window

## UI Composition

### Main sections

- personal summary bar
- month selector
- unplanned milestone list
- monthly calendar
- selected-date milestone list

### Modal and overlay structure

- milestone selection and edit modal
- same-day conflict list
- window validation hint

## Interaction Flows

### Initial load

1. resolve `view=me` scope and month
2. fetch personal milestones
3. derive unplanned and planned groups
4. render summary, queue, and calendar

### Confirm milestone flow

1. user opens a queue row or calendar day
2. modal computes eligible rows
3. user selects or confirms one row
4. save updates the row locally
5. selected day view refreshes

### Open linked work flow

1. user taps the linked case or report action
2. route to:
  - `/appraisal/cases/[caseKey]`
  - `/appraisal/reports/[reportKey]`

## Error Handling

- permission failure returns a visible message and does not mutate the local row
- fetch failure keeps the current month and filter state intact
- invalid window selection shows inline validation, not a full-page error

## Non-Obvious Implementation Notes

- This screen shares contracts with the controller board, but not its full authority surface.
- The personal board is still part of v1 because core authoring depends on predictable milestone self-management.
- `view=me` is a scope convention, not a separate domain model.

## Recovery Checklist

- [ ] Personal scope only shows the current user's assigned milestones
- [ ] Queue, calendar, and same-day list stay in sync
- [ ] Save requires reason metadata for changed dates
- [ ] Permission rules prevent cross-user edits
- [ ] Delivery and invoice milestones stay approval-gated

## Verification

- open the personal board, save one date, reload, and verify local persistence
- attempt a blocked edit on a non-owned row
- verify case and report links route correctly

