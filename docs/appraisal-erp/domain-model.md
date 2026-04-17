# Appraisal ERP Domain Model

## Purpose

- Define the shared nouns, identifiers, statuses, and relationships for the appraisal ERP.
- Keep every reverse spec aligned to one lifecycle vocabulary.
- Provide enough domain structure to guide future API, UI, and storage design.

## Source Mapping

- Structural inspiration comes from the safety ERP's site, schedule, report, and dispatch domains.
- The entity model is remapped for appraisal work:
  - `site` becomes an appraisal `case`
  - one case can hold multiple `property subject` records
  - document production centers on `appraisal report`, not technical-guidance sessions
  - `dispatch` becomes `delivery` and `receipt`
  - finance becomes a first-class case subdomain
- Safety-only concepts such as quarterly summary, bad workplace, hazard findings, and K2B imports are excluded from v1.

## Identifiers

### Required identifier formats

- `caseKey`: `AC-YYYY-NNNN`
- `orderNo`: `ORD-YYYYMMDD-NNN`
- `subjectId`: `SUB-XX`
- `reportKey`: `APR-YYYY-NNNN-VX`
- `scheduleId`: `SCH-YYYY-NNNN-XX`
- `assetId`: `EVD-YYYY-NNNN`
- `invoiceNo`: `INV-YYYYMM-NNN`

### External references

- `clientOrderNo`: customer-side order number
- `externalCaseRef`: optional court, bank, auction, or public-project reference
- `parcelRef`: optional parcel or unit reference

## Data Contracts

### `AppraisalCase`

- identity:
  - `caseKey`
  - `orderNo`
  - `clientOrderNo`
  - `externalCaseRef`
- parties:
  - `clientId`
  - `requestingOrgId`
  - `contactPartyIds`
- appraisal context:
  - `purpose`
  - `baseDate`
  - `receivedDate`
  - `dueDate`
  - `priority`
- operations:
  - `status`
  - `assignedAppraiserId`
  - `reviewerId`
  - `approverId`
- finance:
  - `feePolicy`
  - `quotedAmount`
  - `taxMode`
- rollups:
  - `subjectCount`
  - `reportVersion`
  - `deliveryStatus`
  - `invoiceStatus`

### `CaseOrder`

- order metadata used at intake
- customer requirements
- requested deliverables
- deadline commitments
- billing rules

### `PropertySubject`

- `subjectId`
- `caseKey`
- `subjectType`
- `address`
- `parcelRef`
- `buildingName`
- `unitNo`
- `rightRelationSummary`
- `areaSummary`
- `occupancySummary`
- `status`

### `CaseAssignment`

- `caseKey`
- `assignedAppraiserId`
- `reviewerId`
- `approverId`
- `assignedAt`
- `assignmentNote`

### `CaseSchedule`

- `scheduleId`
- `caseKey`
- `milestoneType`
- `plannedDate`
- `windowStart`
- `windowEnd`
- `ownerUserId`
- `status`
- `changeReasonLabel`
- `changeReasonMemo`

### `AppraisalReport`

- `reportKey`
- `caseKey`
- `versionNo`
- `title`
- `status`
- `baseDate`
- `dueDate`
- `purpose`
- `subjectIds`
- `draftedBy`
- `reviewRequestedAt`
- `approvedAt`
- `deliveredAt`

### `ValuationWorksheet`

- valuation basis
- approach selections
- adjustment tables
- conclusion values
- assumptions and limiting conditions

### `ComparableEntry`

- `comparableId`
- `reportKey`
- `category`
- `sourceLabel`
- `transactionDate`
- `baseValue`
- `adjustmentRows`
- `adjustedValue`

### `EvidenceAsset`

- `assetId`
- `caseKey`
- optional `reportKey`
- optional `subjectId`
- `assetKind`
- `fileName`
- `previewUrl`
- `downloadUrl`
- `capturedAt`
- `uploadedByUserId`

### `ReviewApproval`

- `reportKey`
- `reviewStatus`
- `reviewerId`
- `approverId`
- `reviewRequestedAt`
- `reviewedAt`
- `approvedAt`
- `rejectionReason`

### `InvoiceSettlement`

- `invoiceNo`
- `caseKey`
- `status`
- `issueDate`
- `dueDate`
- `supplyAmount`
- `taxAmount`
- `totalAmount`
- `receivedAmount`
- `settledAt`

## State Model

### Shared case lifecycle

- `intake`
- `assigned`
- `scheduled`
- `inspecting`
- `drafting`
- `in_review`
- `revision_requested`
- `approved`
- `delivered`
- `invoiced`
- `partially_paid`
- `settled`
- `closed`
- `archived`
- `cancelled`

### Report lifecycle

- `draft`
- `review_requested`
- `revision_requested`
- `approved`
- `delivered`
- `archived`

### Delivery lifecycle

- `pending`
- `ready`
- `delivered`
- `received`
- `reissued`
- `waived`

### Invoice lifecycle

- `not_requested`
- `draft`
- `issued`
- `partially_paid`
- `paid`
- `settled`
- `written_off`

## Relationships

- one `AppraisalCase` has one `CaseOrder`
- one `AppraisalCase` has many `PropertySubject`
- one `AppraisalCase` has many `CaseSchedule`
- one `AppraisalCase` has many `EvidenceAsset`
- one `AppraisalCase` has one or more `AppraisalReport` versions
- one `AppraisalReport` has one `ValuationWorksheet`
- one `AppraisalReport` has many `ComparableEntry`
- one `AppraisalReport` has one `ReviewApproval`
- one `AppraisalCase` has zero or more `InvoiceSettlement` records

## Business Rules

### Identifier rules

- `caseKey`, `orderNo`, and `reportKey` are system-issued and immutable after creation.
- `subjectId` is sequential within a case and must remain stable even if a subject is soft-deleted.
- `reportKey` version suffix increments for reissue or approved-draft regeneration.

### Lifecycle rules

- A case cannot enter `approved` unless its active report is `approved`.
- Delivery cannot move to `delivered`, `received`, or `reissued` before report approval.
- Invoice cannot move to `issued`, `partially_paid`, `paid`, or `settled` before report approval.
- Case `closed` requires:
  - report approved
  - delivery received or waived
  - invoice settled or written off

### Date rules

- `receivedDate <= dueDate`
- `baseDate` must exist before approval
- schedule windows must contain their chosen planned date

### Scope rules

- Mobile investigation-specific entities are not part of v1.
- External registry, map, and public-data links are connector slots and may be stored only as references in v1.

## Interaction Flows

### Case lifecycle

1. Intake creates `CaseOrder` and `AppraisalCase`.
2. Assignment sets appraiser, reviewer, and approver.
3. Scheduling creates case milestones.
4. Drafting creates or updates the active `AppraisalReport`.
5. Review and approval update `ReviewApproval`.
6. Delivery records package issuance and receipt.
7. Finance records invoice and settlement.
8. Case closes when operational and finance gates are satisfied.

### Report version lifecycle

1. Create version 1 draft.
2. Request review.
3. Either reject for revision or approve.
4. Deliver the approved version.
5. If reissue is needed, generate a new version and preserve prior versions.

## Recovery Checklist

- [ ] Entity names match `api-contracts.md`.
- [ ] Status values match every reverse spec in this folder.
- [ ] Identifier formats are stable and reconstructable.
- [ ] Case, report, delivery, and invoice lifecycles do not conflict.
- [ ] Finance and delivery gates cannot bypass report approval.

