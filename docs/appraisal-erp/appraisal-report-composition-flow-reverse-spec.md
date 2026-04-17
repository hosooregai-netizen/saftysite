# Reverse Spec - Appraisal Report Composition Flow

## Purpose

- Recover the appraisal report editor used to draft, revise, review, export, and version one report.
- Preserve autosave, subject snapshot editing, comparable management, valuation worksheet editing, attachment linking, and document export.

## Source Mapping

- Structural editor ideas:
  - current shared report composition patterns from `features/inspection-session/*`
  - autosave and export patterns from `features/site-reports/quarterly-report/*`
- Entry and list relationship:
  - [appraisal-report-list-and-create-flow-reverse-spec.md](./appraisal-report-list-and-create-flow-reverse-spec.md)
- Renamed entities:
  - `inspection or quarterly report payload` -> `AppraisalReport`
  - `source reports` -> subject, evidence, and comparable source material
- Removed semantics:
  - quarterly source aggregation
  - technical-guidance projection logic
  - hazard and education step flows
- New appraisal-only logic:
  - valuation worksheet
  - comparable entries
  - opinion conclusion
  - approval-ready draft checks

## Feature Goal

Users must be able to:

- open a report route by `reportKey`
- load or create the current draft version
- edit report header, subject snapshot, comparable data, valuation worksheet, and conclusion
- autosave safely while drafting
- request review, revise after rejection, and export HWPX or PDF

## User Role

- primary user: assigned appraiser
- secondary user: reviewer or approver in read-only or markup mode
- preconditions:
  - authenticated appraisal ERP session
  - accessible `reportKey`

## Entry and Scope

- route: `/appraisal/reports/[reportKey]`
- optional query params:
  - `mode=review`
  - `panel=comparables|worksheet|attachments`
- out of scope:
  - global list filtering
  - finance mutations
  - mobile field-capture UX

## Data Contracts

### Main entities

`AppraisalReport`

- `reportKey`
- `caseKey`
- `caseNo`
- `orderNo`
- `versionNo`
- `title`
- `purpose`
- `baseDate`
- `dueDate`
- `status`
- `subjectIds`
- `documentInfo`
- `subjectSnapshot`
- `deliveryStatus`
- `invoiceStatus`

`ValuationWorksheet`

- `valuationBasis`
- `approachTypes`
- `adjustmentRows`
- `conclusionValue`
- `conclusionCurrency`
- `assumptions`
- `limitingConditions`

`ComparableEntry`

- `comparableId`
- `category`
- `sourceLabel`
- `transactionDate`
- `transactionAmount`
- `unitValue`
- `adjustmentRows`
- `adjustedValue`
- `note`

### Read APIs

- `GET /api/appraisal/reports/:reportKey`
  - response:
    - `report`
    - `worksheet`
    - `comparables`
    - `linkedAssets`
    - `caseSummary`

- `GET /api/appraisal/assets`
  - filters:
    - `case_key`
    - `report_key`
    - `subject_id`

### Write APIs

- `PATCH /api/appraisal/reports/:reportKey`
  - payload sections may include:
    - `documentInfo`
    - `subjectSnapshot`
    - `worksheet`
    - `comparables`
    - `linkedAssets`
    - `status`

- review request is expressed by setting report status to `review_requested`

### Output or download APIs

- report document actions export HWPX and PDF by `reportKey`
- export must persist the latest draft before generating output

## Caching and Persistence

- report detail is keyed by `reportKey`
- editor autosave uses a draft fingerprint and pauses while a save is already in flight
- linked asset picker may keep a short-lived per-report cache, but attachments should refetch after upload or relink
- approved versions are immutable; post-approval editing requires a new report version

## State Model

### Primary local state

- `draft`
- `worksheet`
- `comparables`
- `linkedAssets`
- `notice`
- `documentError`
- `titleEditorOpen`
- `attachmentsOpen`
- `isSaving`
- `isExporting`

### Derived state

- `draftFingerprint`
- `availableSubjects`
- `linkedAssetsBySection`
- `hasUnsavedChanges`
- `canRequestReview`
- `isApprovedReadOnly`
- `valuationWarnings`

## Business Rules

### Identifier rules

- `reportKey` and `versionNo` are read-only inside the editor
- section references to attachments must use stable `assetId`, not file names

### Domain rules

- the editor always shows case purpose, base date, and due date in the header
- if `comparative` approach is selected, at least one `ComparableEntry` is required
- review request is blocked unless all are present:
  - `purpose`
  - `baseDate`
  - `dueDate`
  - at least one active subject
  - a non-null conclusion value
- approval does not happen in the editor; it happens through the review API and downstream center
- once approved, the report becomes read-only except for document export and reference browsing
- delivery and invoice states are visible but not editable here

### Validation rules

- invalid numeric values in the worksheet block save
- comparable rows require either `transactionAmount` or `unitValue`
- duplicate `comparableId` values in the same report are blocked

## UI Composition

### Main sections

- editor summary header
- document info panel
- subject snapshot panel
- comparable list and editor
- valuation worksheet panel
- conclusion and assumptions panel
- attachment drawer
- export actions

### Modal and overlay structure

- title editor modal
- comparable editor drawer
- attachment picker drawer
- export progress overlay

## Interaction Flows

### Initial load

1. read `reportKey`
2. load report detail payload
3. derive subject, comparable, and attachment views
4. render the editor

### Drafting flow

1. user edits document sections
2. draft fingerprint changes
3. autosave persists the changed section
4. visible notice confirms save state

### Review request flow

1. user presses `검토 요청`
2. editor validates header, subject, and conclusion requirements
3. status changes to `review_requested`
4. downstream review queue reflects the new status

### Export flow

1. user presses HWPX or PDF export
2. editor saves the latest draft
3. export action generates the document
4. document download starts or an inline failure appears

## Error Handling

- save failures keep the draft dirty and show a persistent error notice
- export failures do not roll back the saved draft
- missing linked assets show a non-blocking warning instead of crashing the editor

## Non-Obvious Implementation Notes

- This screen owns report body editing only; approval, delivery, and finance states are downstream concerns.
- Version immutability after approval is critical for audit and delivery history.
- Attachment linkage must survive report reissue so old versions keep their historical evidence map.

## Recovery Checklist

- [ ] Report loads from `reportKey`
- [ ] Autosave preserves draft changes
- [ ] Comparable and worksheet editing work independently
- [ ] Review request validates required appraisal fields
- [ ] Approved versions become read-only
- [ ] Export persists the latest draft before generation

## Verification

- edit one draft, reload, and confirm autosaved content
- request review with missing fields and verify blocking behavior
- approve a report externally and confirm the editor becomes read-only

