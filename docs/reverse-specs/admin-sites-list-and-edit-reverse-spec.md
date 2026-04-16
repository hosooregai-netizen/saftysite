# Reverse Spec - Admin Sites List And Edit Flow

## Purpose

- Recover the `/admin` sites list used for site browsing, filtering, editing, assignment, status changes, exports, and basic-material downloads.
- Preserve the split between list behavior, editor modal, assignment modal, and row action menu.

## Source of Truth

- main section: [features/admin/sections/sites/SitesSection.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/sites/SitesSection.tsx)
- section state: [features/admin/sections/sites/useSitesSectionState.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/sites/useSitesSectionState.ts)
- table: [features/admin/sections/sites/SitesTable.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/sites/SitesTable.tsx)
- helpers/types: [features/admin/sections/sites/siteSectionHelpers.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/sites/siteSectionHelpers.ts)
- API client: [lib/admin/apiClient.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/admin/apiClient.ts)
- export/download client: [lib/admin/exportClient.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/admin/exportClient.ts)

## Feature Goal

Controllers must be able to:

- browse sites with search, assignment filter, status filter, sorting, and paging
- create a site
- edit a site
- delete a site when allowed
- assign and unassign field agents
- change site status from the action menu
- open site entry or report view
- export the current site list to Excel
- download basic material per site

## User Role

- primary user: admin/controller
- preconditions:
  - authenticated admin user
  - mutation callbacks are supplied by parent shell:
    - create
    - update
    - delete
    - assign field agent
    - unassign field agent

## Entry and Scope

- this is an admin section, optionally reused with different header/title behavior
- configurable props:
  - `showHeader`
  - `showHeadquarterColumn`
  - `title`
  - `titleActionHref`
  - `titleActionLabel`
  - `lockedHeadquarterId`
  - `initialStatusFilter`
  - `autoEditSiteId`
  - `onSelectSiteEntry`
  - `canDelete`

## Data Contracts

### Main entity

`SafetySite`

Fields used by this feature include:

- identifiers:
  - `id`
  - `headquarter_id`
- labels:
  - `site_name`
  - `site_code`
  - `management_number`
  - `project_kind`
  - `site_address`
- assignment display:
  - `guidance_officer_name`
  - `inspector_name`
  - `assigned_user`
  - `assigned_users`
- status:
  - `status`
- project dates and finance:
  - `project_amount`
  - `project_start_date`
  - `project_end_date`
  - `last_visit_date`
- headquarter detail:
  - `headquarter_detail`
  - `headquarter`

### Read APIs

- `GET /api/admin/sites/list`
  - query params:
    - `assignment`
    - `headquarter_id`
    - `limit`
    - `offset`
    - `query`
    - `site_id`
    - `sort_by`
    - `sort_dir`
    - `status`
  - response:
    - paged `SafetySite[]`

- `GET /api/admin/directory/lookups`
  - for headquarters and user options

### Output/download APIs

- Excel export:
  - current implementation fetches up to 5000 rows then uses `exportAdminWorkbook('sites', sheets)`
- basic material:
  - `GET /api/admin/sites/:siteId/basic-material`

### Mutations from parent callbacks

- create site
- update site
- delete site
- assign field agent
- unassign field agent

## Caching Rules

- directory lookups use shared `directory-lookups` admin session cache key
- site list uses request-specific cache key:
  - `sites:list:${requestKey}`
- request key contains:
  - `assignmentFilter`
  - `headquarterId`
  - `page`
  - trimmed deferred query
  - `sort`
  - `statusFilter`

## State Model

### Primary local state

- modal state:
  - `editingId`
  - `assignmentSiteId`
  - `form`
- list controls:
  - `query`
  - `page`
  - `statusFilter`
  - `sort`
  - `assignmentFilter`
- data state:
  - `rows`
  - `total`
  - `isLoading`
  - `directoryLookups`
- assist state:
  - `lastAutoEditSiteId`

### Derived state

- `requestKey`
- `totalPages`
- `currentPage`
- `activeFilterCount`
- `assignmentSite`
- `currentAssignedUserIds`
- `headquarters`
- `users`
- `isCreateReady`
- `pagedSites`

## Business Rules

### Search and filters

- query searches by:
  - site name
  - management number
  - project kind
  - address
- active filter count includes:
  - non-default status filter
  - non-default assignment filter

### Validation

- create requires:
  - headquarter id, unless locked by parent
  - site name
- submit validates max lengths for many text fields
- duplicate `site_code` is rejected against currently loaded rows
- invalid submit uses `window.alert(...)`

### Payload normalization

- blank strings become nullable text fields where appropriate
- number inputs become parsed numeric fields
- `total_rounds` is truncated to integer if present
- create and update share `buildSitePayload(form, lockedHeadquarterId)`

### Delete rule

- delete requires explicit browser confirmation
- warning text mentions assignment cleanup and irreversibility

### Status changes

- action menu shows every status except the site’s current normalized display status
- no-op if target status already matches current normalized status

### Site entry rule

- if `onSelectSiteEntry` is supplied, use that
- otherwise navigate to `/sites/:siteId`

### Basic-material rule

- per-site action menu can trigger direct download
- download errors surface via `window.alert(...)`

### Auto-edit rule

- if `autoEditSiteId` is provided and not already handled:
  - first try current rows
  - if not found, fetch site by id with `limit=1`
  - then open edit modal

## UI Composition

### Header

- title or spacer depending on `showHeader`
- optional inline title action link
- search input
- filter menu
- Excel export button
- `현장 추가` button

### Table columns

- 현장명
- 사업장 관리번호, optional
- 공사 종류
- 지도요원
- 주소
- 공사 금액 with date range secondary line
- 상태
- 마지막 방문일
- action menu

### Row action menu

- site main or reports
- assign field agent
- view photos
- print basic material
- edit
- status changes
- delete, if allowed

### Modals

- `SiteEditorModal`
- `SiteAssignmentModal`

## Interaction Flows

### Initial load

1. load cached lookups if available
2. load cached list page if available
3. fetch fresh site page if cache is stale

### Create site

1. user clicks `현장 추가`
2. editor opens with blank form plus locked headquarter if provided
3. validate
4. call `onCreate`
5. close modal
6. refresh current page

### Edit site

1. user opens `수정`
2. prefill form from site
3. validate
4. call `onUpdate`
5. close modal
6. refresh current page

### Assign field agent

1. user opens assignment modal
2. current assigned ids are derived from the site row
3. assign or clear via callbacks
4. refresh page after each mutation

### Export sites

1. refetch up to 5000 rows with current filters
2. build workbook sheet client-side
3. save workbook

## Error Handling

- list fetch failures log to console and keep last visible state
- directory lookup failures log to console
- validation failures and basic-material download failures use browser alerts
- in-flight site list requests are aborted when list controls change

## Non-Obvious Constraints

- duplicate `site_code` validation currently checks only the loaded row set, not the full remote dataset
- `pagedSites` equals the server page rows; no extra client slicing occurs after fetch
- table navigation is suppressed when the click target is inside interactive controls
- export ignores current page and intentionally refetches a much larger filtered set

## Recovery Checklist

- [ ] search and filters change the fetched site page
- [ ] create and edit modal submit paths rebuild payloads correctly
- [ ] assignment modal reflects current assignees
- [ ] row click opens site entry unless interactive child consumed the event
- [ ] status changes refresh the page
- [ ] delete shows confirmation and refreshes list
- [ ] Excel export includes filtered rows
- [ ] basic-material download works per site

## Verification

- admin sites smoke
- targeted typecheck
- create/edit/assignment manual sanity pass
