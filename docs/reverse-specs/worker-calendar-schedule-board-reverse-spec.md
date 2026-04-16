# Reverse Spec - Worker Calendar Schedule Board

## Purpose

- Recover the worker-facing monthly schedule board used to choose planned visit dates and record selection reasons.
- Preserve the split between unselected rounds, monthly calendar, selected schedule list, and the visit-selection modal.

## Source of Truth

- page entry: [app/calendar/page.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/app/calendar/page.tsx)
- main screen: [features/calendar/components/WorkerCalendarScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/calendar/components/WorkerCalendarScreen.tsx)
- client API: [lib/calendar/apiClient.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/calendar/apiClient.ts)
- worker read route: [app/api/me/schedules/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/me/schedules/route.ts)
- worker patch route: [app/api/me/schedules/[scheduleId]/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/me/schedules/[scheduleId]/route.ts)

## Feature Goal

Workers must be able to:

- see assigned schedule rounds for a selected month
- identify unselected rounds
- choose a visit date within the allowed window
- enter both a reason label and detailed memo
- inspect already selected schedules for a date
- revise an existing selected schedule and its reason

## User Role

- primary user: worker / assigned field agent
- special case:
  - if current logged-in user is admin, redirect to admin schedules section instead of rendering worker calendar

## Entry and Scope

- route: `/calendar`
- optional query param:
  - `siteId`

Out of scope:

- admin drag-move schedule board
- queue generation
- monthly export

## Data Contracts

### Read API

- `GET /api/me/schedules`
- query params:
  - `limit`
  - `month`
  - `offset`
  - `siteId`
  - `status`
- current server rules:
  - limit clamped to `1..300`
  - default limit `200`
  - rows are built from `buildAdminSchedules(...)` but filtered to current user id

### Write API

- `PATCH /api/me/schedules/:scheduleId`
- request accepts both camelCase and snake_case for:
  - `plannedDate`
  - `selectionReasonLabel`
  - `selectionReasonMemo`
  - `status`

### Mutation side effects

Successful worker schedule patch also:

- updates local site memo via `updateAdminSite(...)`
- appends local schedule notifications
- refreshes analytics snapshot
- refreshes schedule snapshot

### Permission rule

After schedule mutation is computed:

- if previous assignee is not the current user
- and next assignee is also not the current user
- then return `403` with `수정 권한이 없는 일정입니다.`

## State Model

### Primary local state

- `menuOpen`
- `month`
- `rows`
- `loading`
- `error`
- `notice`
- `selectedDate`
- `dialog`

### Dialog state

- `open`
- `plannedDate`
- `scheduleId`
- `selectionReasonLabel`
- `selectionReasonMemo`

### Derived state

- `isAdminView`
- `selectedSiteId`
- `unselectedRows`
- `selectedRows`
- `visibleSelectedRows`
- `calendar`
- `rowsByDate`
- `dialogSelectedSchedule`
- `dialogEligibleRows`
- `dialogSelectedRows`
- `dialogWindowError`

## Business Rules

### Admin redirect

- if current user role is admin:
  - immediately redirect to admin schedules section
  - preserve `siteId` filter if present

### Month and site filtering

- month is chosen via `<input type="month">`
- site filter is a query-param based select
- changing site replaces route:
  - `/calendar`
  - or `/calendar?siteId=<encoded id>`

### Calendar rules

- Monday-first alignment
- clicking any day opens the schedule modal for that date
- calendar day cell shows up to three selected schedule chips

### Unselected round rules

- list contains only rows where `plannedDate` is empty
- sorted by:
  - `roundNo`
  - `siteName`
  - `windowStart`

### Selected schedule rules

- selected rows sorted by:
  - `plannedDate`
  - `roundNo`
  - `siteName`
- bottom list optionally narrows to `selectedDate`

### Modal eligibility rule

- selectable rows are:
  - rows with no `plannedDate`
  - plus the currently selected row
  - but only when modal date falls within `windowStart ~ windowEnd`

### Save validation

Save is blocked unless:

- a schedule is selected
- planned date exists
- reason label is non-empty
- reason memo is non-empty
- planned date is within selected schedule window

Validation messages:

- `회차를 먼저 선택해 주세요.`
- `선택한 회차를 찾지 못했습니다.`
- `방문 날짜를 먼저 선택해 주세요.`
- `사유 분류와 상세 메모를 함께 입력해 주세요.`
- window-specific error from `buildWindowErrorMessage(...)`

### Save result

- patch only the selected schedule row
- replace that row in local `rows`
- update `selectedDate`
- show notice:
  - `{siteName} {roundNo}회차 방문 일정과 사유를 저장했습니다.`

## UI Composition

### Top shell

- worker app header
- worker menu sidebar/drawer
- page title: `내 일정`

### Summary bar

- 미선택 회차 count
- 선택 완료 일정 count
- 배정 현장 count

### Main schedule card

Contains:

- month selector
- site selector
- unselected rounds list
- month calendar
- selected schedules list

### Modal

Title:

- `방문 일정 선택`

Fields and sections:

- date input
- selectable rounds list
- same-date confirmed schedules list
- reason label input
- detailed memo textarea
- selected round allowed-window hint
- window error

## Interaction Flows

### Initial load

1. wait for inspection-session auth readiness
2. if admin, redirect away
3. fetch worker schedules for current month and optional site id
4. render derived unselected/selected/calendar views

### Select schedule from queue

1. user taps `팝업에서 일정 지정`
2. modal opens on that row’s `windowStart`
3. default selected schedule is chosen if valid

### Select schedule from calendar day

1. user taps a calendar day
2. modal opens for that day
3. eligible rows are computed by allowed window

### Revise existing selected schedule

1. user opens a selected schedule row
2. modal prefills current reason label/memo
3. user can keep same row or switch to another eligible row

## Error Handling

- unauthenticated worker sees login panel
- not-ready state shows standalone loading shell
- worker fetch errors show section-level error box
- patch errors show top-level error message
- invalid window also appears inline in the modal and disables save

## Non-Obvious Constraints

- worker schedule API reuses admin schedule-building logic on the server but constrains by current worker id
- worker PATCH route mutates site memo and notification state, not just the schedule row
- admin users do not share the worker UI; they are redirected into the admin schedule section instead

## Recovery Checklist

- [ ] worker route loads month schedules
- [ ] admin user is redirected to admin schedules
- [ ] unselected and selected lists derive correctly
- [ ] calendar day click opens modal
- [ ] site filter rewrites route query
- [ ] modal blocks invalid dates outside allowed window
- [ ] reason label and memo are both required
- [ ] successful save updates the row locally and shows notice

## Verification

- worker calendar smoke if available
- targeted typecheck
- manual save flow with one unselected and one already selected schedule
