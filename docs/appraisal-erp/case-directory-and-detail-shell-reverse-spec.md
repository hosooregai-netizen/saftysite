# Reverse Spec - Case Directory And Detail Shell

## Purpose

- Recover the case directory and case detail shell that replace the safety ERP's site list and site main.
- Preserve the split between global case browsing, case creation, detail summary, property-subject management, assignment, evidence, report links, finance, and audit panels.

## Source Mapping

- Base directory and detail pattern:
  - [../reverse-specs/admin-sites-list-and-edit-reverse-spec.md](../reverse-specs/admin-sites-list-and-edit-reverse-spec.md)
- Supporting report-entry pattern:
  - [../reverse-specs/site-technical-guidance-report-list-reverse-spec.md](../reverse-specs/site-technical-guidance-report-list-reverse-spec.md)
- Renamed entities:
  - `site` -> `AppraisalCase`
  - `site detail shell` -> case detail hub
  - `site report list` -> appraisal report panel
- Removed semantics:
  - construction site status wording
  - K2B import meaning
  - site-based basic material download
- New appraisal-only logic:
  - intake fields
  - property subjects
  - right relations
  - delivery, finance, and audit panels

## Feature Goal

Users must be able to:

- browse cases with search, filters, sorting, and pagination
- create a new case from intake data
- edit case header and deadlines
- manage property subjects inside one case
- assign appraiser, reviewer, and approver
- open the related report, evidence, delivery, finance, and audit panels

## User Role

- primary user: intake coordinator or operations admin
- secondary user: reviewer, approver, or finance user with read access
- preconditions:
  - authenticated appraisal ERP session
  - authority to view the target client and case set

## Entry and Scope

- list route: `/appraisal?section=cases`
- detail route: `/appraisal/cases/[caseKey]`
- optional list search params:
  - `query`
  - `status`
  - `clientId`
  - `assignedAppraiserId`
  - `dateFrom`
  - `dateTo`
- out of scope:
  - report body authoring
  - final invoice mutation screen
  - mobile field UX

## Data Contracts

### Main entities

`AppraisalCase`

- `caseKey`
- `caseNo`
- `orderNo`
- `clientOrderNo`
- `clientName`
- `requestingOrgName`
- `purpose`
- `baseDate`
- `receivedDate`
- `dueDate`
- `status`
- `assignedAppraiserId`
- `assignedAppraiserName`
- `reviewerId`
- `reviewerName`
- `approverId`
- `approverName`
- `subjectCount`
- `reportVersion`
- `deliveryStatus`
- `invoiceStatus`

`CaseOrder`

- intake memo
- request channel
- quoted amount
- requested deliverables
- tax mode

`PropertySubject`

- `subjectId`
- `subjectType`
- `address`
- `parcelRef`
- `buildingName`
- `unitNo`
- `rightRelationSummary`
- `areaSummary`
- `status`

### Read APIs

- `GET /api/appraisal/cases`
  - filters:
    - `query`
    - `status`
    - `client_id`
    - `assigned_appraiser_id`
    - `date_from`
    - `date_to`
    - `limit`
    - `offset`
    - `sort_by`
    - `sort_dir`
  - response:
    - `rows`
    - `total`
    - `lookups`

- `GET /api/appraisal/cases/:caseKey`
  - response:
    - `case`
    - `order`
    - `subjects`
    - `assignment`
    - `reportSummary`
    - `deliverySummary`
    - `financeSummary`
    - `auditSummary`

### Write APIs

- `POST /api/appraisal/cases`
- `PATCH /api/appraisal/cases/:caseKey`
- case create and update payloads may include:
  - case header
  - order metadata
  - initial or updated subject rows
  - assignment fields

### Output or download APIs

- case export uses the current filtered list model
- detail shell may expose bundled evidence or delivery package downloads through linked downstream flows

## Caching and Persistence

- list cache key:
  - `appraisal-cases:list:${requestKey}`
- detail cache key:
  - `appraisal-cases:detail:${caseKey}`
- list cache TTL: `5 minutes`
- detail cache TTL: `2 minutes`
- optimistic updates are allowed for:
  - case header edits
  - subject edits
  - assignment changes

## State Model

### Primary local state

- list state:
  - `query`
  - `statusFilter`
  - `clientId`
  - `assignedAppraiserId`
  - `page`
  - `sort`
- modal state:
  - `isCreateOpen`
  - `editingCaseKey`
  - `subjectEditorState`
  - `assignmentDialogOpen`
- detail state:
  - `activePanel`
  - `detailResponse`
  - `notice`
  - `error`

### Derived state

- `requestKey`
- `activeFilterCount`
- `pagedRows`
- `currentCase`
- `currentOrder`
- `activeSubjects`
- `hasDraftReport`
- `canCreateReport`
- `canRequestDelivery`
- `canIssueInvoice`

## Business Rules

### Identifier rules

- `orderNo` is issued at case creation time
- `caseKey` is immutable after creation
- `subjectId` is sequential inside a case and remains stable across edits

### Domain rules

- `purpose`, `receivedDate`, and `dueDate` are required at case creation
- `baseDate` may be blank at intake but is required before report approval
- moving from `intake` to `assigned` requires an assigned appraiser
- moving to `scheduled` requires at least one open `CaseSchedule`
- moving to `drafting` requires at least one active `PropertySubject`
- delivery and invoice panels remain read-only until an active report reaches approval-ready conditions

### Validation rules

- create is blocked when:
  - `purpose` is empty
  - `receivedDate` is empty
  - `dueDate` is empty
- subject save is blocked when:
  - `subjectType` is empty
  - `address` is empty
- invalid date range blocks save when `receivedDate > dueDate`

## UI Composition

### Main sections

- cases list toolbar
- case table
- create or edit dialog
- case detail summary header
- case detail side metrics
- tab or panel set:
  - summary
  - subjects
  - evidence
  - reports
  - delivery
  - finance
  - audit

### Modal and overlay structure

- create or edit dialog
- subject editor drawer
- assignment dialog
- audit viewer drawer

## Interaction Flows

### Initial list load

1. read search params
2. hydrate list from cache if possible
3. fetch case list and lookups
4. derive visible rows and filter badges
5. render table

### Create case flow

1. user opens `사건 등록`
2. enters intake header and order data
3. optionally adds the first property subject
4. saves
5. receives `caseKey`, `orderNo`, and detail route

### Detail work flow

1. user opens a case row
2. detail shell loads case, subjects, assignment, and downstream summaries
3. user edits summary, subjects, or assignment
4. local row and detail caches patch in place

## Error Handling

- list fetch failures show a full-width banner and keep the last cached page if present
- detail fetch failures show a case-specific error panel
- optimistic update failure reverts the edited section and surfaces a notice

## Non-Obvious Implementation Notes

- Case detail is the operational hub, but report authoring stays on `/appraisal/reports/[reportKey]`.
- Assignment, report, delivery, and finance banners must all read from the same normalized case lifecycle.
- Subject deletion should be soft-delete friendly so report history remains stable.

## Recovery Checklist

- [ ] Case list filters, sort, and pagination work
- [ ] Case creation issues `orderNo` and `caseKey`
- [ ] Case detail panels render from one detail payload
- [ ] Subject and assignment edits patch the visible case state
- [ ] Delivery and invoice panels remain lifecycle-consistent
- [ ] Identifier rules stay aligned with `domain-model.md`

## Verification

- create one case, add one subject, assign one appraiser, reopen detail
- open a case from the list and verify panel summaries stay consistent
- compare case status handling against `domain-model.md`

