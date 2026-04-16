# Reverse Spec Sample - Admin Schedules Section

## Purpose

- Reconstruct the `/admin` schedules board without depending on the current implementation details.
- Preserve the controller workflow for:
  - month-grid schedule overview
  - unselected schedule queue
  - schedule assignment/edit modal
  - quick drag-move inside allowed date windows
  - Excel export and site basic-material download

This document is intentionally more concrete than a product brief and more stable than a code walkthrough.

## Source of Truth

- Screen: [features/admin/sections/schedules/SchedulesSection.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/schedules/SchedulesSection.tsx)
- Client API: [lib/admin/apiClient.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/admin/apiClient.ts)
- Export API client: [lib/admin/exportClient.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/admin/exportClient.ts)
- Response types: [types/admin.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/types/admin.ts)
- Session cache helper: [features/admin/lib/adminSessionCache.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/lib/adminSessionCache.ts)

## Reconstruction Confidence Levels

- Enough for UI mock: screen sections, labels, tables, and buttons only.
- Enough for behavioral rebuild: add query state, API contracts, validation, modal flows, and derived calculations.
- Enough for production recovery:
  - all external contracts
  - all derived state rules
  - validation and error messages
  - cache semantics
  - edge cases
  - smoke-test expectations

This sample targets the third level.

## Feature Goal

Controllers must be able to:

- inspect all selected schedules for a month in a calendar view
- inspect all unselected rounds in a queue view
- filter schedules by site, assignee, text query, and status
- edit one schedule by opening a modal for a target date
- move an already selected schedule to another valid date by drag and drop
- export the current schedule view as Excel
- download site basic material when a single site is filtered

## User Role

- Primary user: admin/controller
- Required precondition: authenticated user with a valid safety auth token

## Entry and Scope

- The screen is a section inside `/admin`, not a standalone page.
- Initial local state is seeded from URL search params:
  - `month`
  - `plannedDate`
  - `query`
  - `siteId`
  - `assigneeUserId`
  - `status`
- If `month` is absent, default to the current local month in `YYYY-MM` format.

## Data Contracts

### Main entity

`SafetyInspectionSchedule`

Required fields used by the screen:

- identifiers: `id`, `siteId`, `headquarterId`
- schedule metadata: `roundNo`, `totalRounds`, `plannedDate`, `actualVisitDate`
- allowed movement window: `windowStart`, `windowEnd`
- assignment: `assigneeUserId`, `assigneeName`
- status: `status`
- display labels: `siteName`, `headquarterName`
- review/selection data:
  - `selectionConfirmedAt`
  - `selectionConfirmedByName`
  - `selectionReasonLabel`
  - `selectionReasonMemo`
- issue flags:
  - `isConflicted`
  - `isOutOfWindow`
  - `isOverdue`

### Read APIs

- `GET /api/admin/schedules/calendar`
  - filters:
    - `assignee_user_id`
    - `month`
    - `query`
    - `site_id`
    - `status`
  - response:
    - `rows`
    - `monthTotal`
    - `allSelectedTotal`
    - `unselectedTotal`
    - `availableMonths`
    - `month`
    - `refreshedAt`

- `GET /api/admin/schedules/queue`
  - filters:
    - same as calendar
    - plus `limit`, `offset`
  - current client implementation forces `limit=5000`, `offset=0`
  - response:
    - `rows`
    - `total`
    - `month`
    - `refreshedAt`

- `GET /api/admin/schedules/lookups`
  - response:
    - `sites: [{ id, name }]`
    - `users: [{ id, name }]`

### Write APIs

- `PATCH /api/admin/schedules/:scheduleId`
  - payload may include:
    - `assigneeUserId`
    - `plannedDate`
    - `selectionReasonLabel`
    - `selectionReasonMemo`
    - `status`

### Download/export APIs

- `POST /api/admin/exports/schedules`
  - body carries `filename` and current filters
- `GET /api/admin/sites/:siteId/basic-material`

## Caching Rules

- Use `sessionStorage` cache scoped by `currentUser.id`.
- TTL is `5 minutes`.
- Separate cache keys are required for:
  - lookups
  - calendar response by request key
  - queue response by request key
- Request key must be the JSON stringified form of:
  - `assigneeUserId`
  - `month`
  - trimmed `query`
  - `siteId`
  - `status`

## State Model

### Primary local state

- filters:
  - `month`
  - `selectedDate`
  - `query`
  - `siteId`
  - `assigneeUserId`
  - `status`
- table state:
  - `sort`
  - `queuePage`
- modal state:
  - `dialogOpen`
  - `activeScheduleId`
  - `dragScheduleId`
  - `form`
- fetch state:
  - `lookups`
  - `scheduleState`
  - `loadingRequestKey`
  - `abortControllerRef`
- transient UI state:
  - `notice`

### Derived state

- `deferredQuery`: debounced-like query via `useDeferredValue`
- `requestKey`: current filter signature
- `calendarResponse`
- `queueResponse`
- `error`
- `isLoading`
- `isInitialLoading`
- `activeFilterCount`
- `sortedSelectedRows`
- `sortedQueueRows`
- `allScheduleRows`
- `visibleRows`
- `pagedQueueRows`
- `queueTotalPages`
- `calendar`
- `rowsByDate`
- `activeSchedule`
- `dragSchedule`
- `dialogSelectableRows`
- `dialogSelectedRows`
- `activeSiteDetailHref`
- `showOtherMonthHint`
- `jumpableMonths`

## Business Rules

### Month and date rules

- `selectedDate` is cleared if it no longer belongs to the currently selected `month`.
- Month navigation works by moving `YYYY-MM` forward or backward by one month.
- Calendar grid uses Monday-first weekday alignment.

### Sorting rules

- Default sort: `plannedDate asc`
- Secondary fallback for `plannedDate` ties:
  - `roundNo asc`
  - `siteName asc`
- Queue and selected rows share the same sort logic.

### Placeholder cleanup

- `selectionReasonLabel` and `selectionReasonMemo` must be normalized.
- Treat these as empty:
  - exact `Legacy InSEF import`
  - strings containing `legacy_site_id=`

### Schedule chip rules

- Calendar chip title format:
  - `[assigneeName or 미배정] roundNo/totalRounds - siteName`
- If `totalRounds` is absent or invalid, fall back to `roundNo`.

### Drag-move rules

- Only rows with a non-empty `plannedDate` are draggable.
- Drop is allowed only when:
  - target date is not the same as current `plannedDate`
  - target date is within `windowStart ~ windowEnd`
- Successful drag-move writes only `plannedDate`.

### Modal selection rules

- Modal always binds to one `plannedDate`.
- Selectable rows in the modal are:
  - the currently active row, even if already selected
  - any unplanned row whose date window contains the modal date
- Existing selected rows for the same modal date are shown separately as `같은 날짜 확정 일정`.

### Save validation rules

- Save is blocked unless all are present:
  - `activeSchedule`
  - `form.plannedDate`
  - non-empty trimmed `selectionReasonLabel`
  - non-empty trimmed `selectionReasonMemo`
- Validation messages:
  - `일정을 저장할 회차를 먼저 선택해 주세요.`
  - `방문일을 먼저 선택해 주세요.`
  - `사유 분류와 상세 메모를 함께 입력해 주세요.`

### Export and download rules

- Basic-material download is allowed only when `siteId` is selected.
- Otherwise show:
  - `기초자료는 특정 현장을 선택한 상태에서만 출력할 수 있습니다.`

## UI Composition

### Section 1: 일정/캘린더

Contains:

- search input
- filter menu:
  - site
  - assignee
  - status
- `기초자료 출력` button, conditional on `siteId`
- `엑셀 내보내기` button
- error banner
- notice banner
- other-month hint banner
- month toolbar:
  - previous month
  - next month
  - today
  - month label
  - month input
- calendar weekday row
- calendar month grid
- unselected queue table

### Section 2: 방문 일정 목록

Contains a table of selected schedules for either:

- all selected rows in the month, or
- only rows matching `selectedDate`

### Modal: 방문 일정 선택

Contains:

- active schedule summary panel
- date input
- assignee select
- selectable round table
- same-date existing schedule table
- selection reason input
- status select
- detailed memo textarea
- save/cancel actions

## Interaction Flows

### Initial load

1. Seed filter state from URL params.
2. Hydrate lookups and request-specific calendar/queue data from session cache if present.
3. If cache is stale or missing, fetch:
   - calendar
   - queue
4. Write fresh payloads back to session cache.

### Open modal from empty day

1. User clicks calendar day header.
2. Use that day as `plannedDate`.
3. Pick the first row that is either:
   - already on that date, or
   - unplanned and within the date window
4. Open modal with derived form state.

### Open modal from schedule row/chip

1. User clicks a row or chip.
2. Modal date is `plannedDate`, falling back to `windowStart`.
3. Set clicked row as active row.
4. Initialize form from that row.

### Save schedule

1. Validate required fields.
2. Patch the selected schedule.
3. Refresh calendar and queue using the updated month derived from `plannedDate`.
4. Set current screen month to the updated month.
5. Set `selectedDate` to the saved `plannedDate`.
6. Show notice `일정을 저장했습니다.`
7. Close modal.

### Quick move by drag-and-drop

1. User drags a selected schedule chip.
2. Calendar day highlights only if target day is inside allowed window.
3. On drop, patch only `plannedDate`.
4. Refresh the affected month.
5. Select the target date.
6. Show notice:
   - `{siteName} {roundNo}회차 방문일을 {targetDate}로 변경했습니다.`

### Export

1. Build export filter body from current visible filter state plus sort state.
2. Post to schedules export API.
3. Download returned workbook blob.

## Error Handling

- API errors are surfaced as section-level banner errors.
- Fetch errors are keyed by `requestKey` so stale errors do not leak into a new filter state.
- Lookup fetch failure is logged to console only and does not block the screen.
- In-flight calendar/queue requests must be aborted when filter state changes.

## Non-Obvious Implementation Notes

- The queue API is server-paged, but this screen currently force-fetches up to 5000 rows and paginates client-side with `QUEUE_PAGE_SIZE = 25`.
- The screen does not currently sync changed filters back into the URL after mount.
- `visibleRows` comes only from selected rows, not from the unselected queue.
- `selectedDate` acts as a local day filter for the bottom selected-schedule list.

## Recovery Checklist

A rebuild is not complete unless all of the following are true:

- month calendar renders with Monday-first alignment
- selected schedules appear as chips inside the month grid
- queue rows can be sorted and paged client-side
- drag-move is blocked outside `windowStart ~ windowEnd`
- modal refuses save without both reason fields
- same-date existing schedules are visible inside the modal
- basic-material download is disabled without a selected site
- request cache is scoped by user and filter signature

## Recommended Spec Granularity for Future Reverse Docs

For each recoverable ERP feature, create one markdown file with these sections:

1. purpose and user role
2. entry points and route context
3. entities and external contracts
4. local state model
5. derived state rules
6. business rules and validation
7. UI composition
8. interaction flows
9. error, loading, and cache behavior
10. smoke-test checklist

If any of sections 3 through 9 are missing, the feature can usually be redesigned, but not reliably restored.
