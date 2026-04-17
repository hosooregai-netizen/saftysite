# Reverse Spec - Appraisal Report List And Create Flow

## Purpose

- Recover the report list and draft-creation flow used to browse, create, open, archive, and reissue appraisal reports.
- Preserve both the global report list under the shared shell and the case-level report panel that sits inside case detail.

## Source Mapping

- Base list and create pattern:
  - [../reverse-specs/site-technical-guidance-report-list-reverse-spec.md](../reverse-specs/site-technical-guidance-report-list-reverse-spec.md)
- Supporting admin review pattern:
  - [../reverse-specs/admin-reports-list-and-review-reverse-spec.md](../reverse-specs/admin-reports-list-and-review-reverse-spec.md)
- Renamed entities:
  - `technical-guidance report` -> `AppraisalReport`
  - `site report list` -> case report panel or global report list
- Removed semantics:
  - visit-round seed
  - technical-guidance follow-up projection
- New appraisal-only logic:
  - report versioning
  - reissue from approved versions
  - review and delivery status columns

## Feature Goal

Users must be able to:

- browse reports by case, appraiser, review state, and delivery state
- create a new appraisal report draft from one case
- create a reissue version from an approved or delivered report
- open an existing report in the editor
- archive a draft or superseded version when allowed

## User Role

- primary user: appraiser
- secondary user: reviewer or operations admin
- preconditions:
  - authenticated appraisal ERP session
  - access to the target case

## Entry and Scope

- global route: `/appraisal?section=reports`
- contextual route source:
  - `/appraisal/cases/[caseKey]` report panel
- optional search params:
  - `query`
  - `caseKey`
  - `assignedAppraiserId`
  - `reviewStatus`
  - `deliveryStatus`
- out of scope:
  - report body editing itself
  - approval mutation details
  - finance mutation details

## Data Contracts

### Main entities

`AppraisalReportListRow`

- `reportKey`
- `caseKey`
- `caseNo`
- `orderNo`
- `title`
- `versionNo`
- `purpose`
- `baseDate`
- `dueDate`
- `status`
- `reviewStatus`
- `deliveryStatus`
- `assignedAppraiserName`
- `reviewerName`
- `updatedAt`
- `href`

### Read APIs

- `GET /api/appraisal/reports`
  - filters:
    - `query`
    - `case_key`
    - `assigned_appraiser_id`
    - `review_status`
    - `delivery_status`
    - `date_from`
    - `date_to`
    - `limit`
    - `offset`
  - response:
    - `rows`
    - `total`
    - `refreshedAt`

### Write APIs

- `POST /api/appraisal/reports`
  - payload:
    - `caseKey`
    - `versionMode`
    - `subjectIds`
    - optional `seedFromApprovedReportKey`

- `PATCH /api/appraisal/reports/:reportKey`
  - used for archive or title updates when needed

### Output or download APIs

- list rows may expose:
  - open editor
  - download current approved PDF or HWPX
  - export filtered report list

## Caching and Persistence

- report list cache key:
  - `appraisal-reports:list:${requestKey}`
- case-panel report cache key:
  - `appraisal-reports:case:${caseKey}`
- TTL: `5 minutes`
- create success inserts the new row into the matching global and case caches

## State Model

### Primary local state

- `query`
- `caseKey`
- `assignedAppraiserId`
- `reviewStatus`
- `deliveryStatus`
- `page`
- `sort`
- `rows`
- `total`
- `isCreateDialogOpen`
- `createForm`
- `createError`
- `isCreating`

### Derived state

- `requestKey`
- `activeFilterCount`
- `pagedRows`
- `selectedCase`
- `nextVersionMode`
- `defaultTitle`
- `canCreateReport`
- `hasActiveDraft`

## Business Rules

### Identifier rules

- new report keys must follow the shared `reportKey` version format from [domain-model.md](./domain-model.md)
- list display must show `caseNo`, `orderNo`, and `versionNo`

### Domain rules

- a case may have only one active draft or in-review report version at a time
- creating the first report for a case defaults to version `V1`
- creating from an approved or delivered report defaults to reissue mode and increments the version number
- report creation requires:
  - at least one active property subject
  - a non-empty due date
  - a valid case purpose
- delivery status columns are read-only in this flow
- invoice completion is not mutated here, but visible status must stay consistent with approved and delivered report state

### Validation rules

- create is blocked unless:
  - `caseKey` exists
  - `subjectIds` has at least one value
- when reissue mode is chosen:
  - `seedFromApprovedReportKey` must exist

## UI Composition

### Main sections

- report list toolbar
- global report table
- case-level report panel
- create or reissue dialog

### Modal and overlay structure

- create dialog with case summary, subject selector, and version mode
- archive confirmation dialog

## Interaction Flows

### Initial load

1. resolve current filters
2. hydrate global or case-level cache if present
3. fetch report rows
4. derive create availability and version defaults
5. render list

### Create first report flow

1. user opens `보고서 생성`
2. select case and subjects
3. default title and version are suggested
4. save creates draft
5. route to `/appraisal/reports/[reportKey]`

### Reissue flow

1. user opens `재발행 보고서 생성`
2. choose an approved source version
3. system increments version number
4. save creates a new draft seeded from the approved version
5. route to editor

## Error Handling

- create failure keeps the dialog open with actionable validation text
- stale list cache must not hide a newly created report after successful create
- archive failure reverts the local row status patch

## Non-Obvious Implementation Notes

- The global list and case-level panel must share the same row-normalization logic.
- Versioning is a report concern, not a case-status replacement.
- Reissue creation must preserve prior approved versions for audit and delivery history.

## Recovery Checklist

- [ ] Global and case-level report lists both render
- [ ] First-version create flow works
- [ ] Reissue version flow works
- [ ] Only one active draft or in-review version is allowed per case
- [ ] Stable case and report identifiers remain visible
- [ ] Delivery and finance status columns remain lifecycle-consistent

## Verification

- create a first report from one case and confirm editor routing
- create a reissue from an approved version and verify version increment
- verify global list and case panel show the same status values

