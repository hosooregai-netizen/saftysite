# Reverse Spec - Review Approval Delivery Center

## Purpose

- Recover the shared review, approval, and delivery center used to move appraisal reports from draft completion to client receipt.
- Preserve the global queue view, review decisions, approval ownership, delivery tracking, receipt confirmation, and reissue history.

## Source Mapping

- Base queue and modal pattern:
  - [../reverse-specs/admin-reports-list-and-review-reverse-spec.md](../reverse-specs/admin-reports-list-and-review-reverse-spec.md)
- Supporting dashboard and list signals:
  - [intake-and-case-dashboard-reverse-spec.md](./intake-and-case-dashboard-reverse-spec.md)
  - [appraisal-report-list-and-create-flow-reverse-spec.md](./appraisal-report-list-and-create-flow-reverse-spec.md)
- Renamed entities:
  - `quality review` -> review and approval
  - `dispatch` -> delivery and receipt
- Removed semantics:
  - quarterly SMS dispatch management
  - safety report-type bundles
- New appraisal-only logic:
  - approver gate
  - rejection reason
  - delivery receipt and reissue timeline

## Feature Goal

Users must be able to:

- browse reports waiting for review or delivery
- assign or confirm reviewer and approver ownership
- mark a report as revision requested or approved
- record delivery method, delivered date, recipient, and receipt date
- trigger reissue flow when a delivered report requires a new version

## User Role

- primary user: reviewer, approver, or operations admin
- secondary user: appraiser observing queue state
- preconditions:
  - authenticated appraisal ERP session
  - access to review and delivery actions for the target report

## Entry and Scope

- route: `/appraisal?section=reports`
- common presets:
  - `reviewPending`
  - `revisionRequested`
  - `deliveryPending`
  - `awaitingReceipt`
- out of scope:
  - report body editing
  - invoice payment entry

## Data Contracts

### Main entities

`ReviewApproval`

- `reportKey`
- `caseKey`
- `caseNo`
- `title`
- `versionNo`
- `reviewStatus`
- `reviewerId`
- `reviewerName`
- `approverId`
- `approverName`
- `reviewRequestedAt`
- `reviewedAt`
- `approvedAt`
- `rejectionReason`

`DeliveryQueueRow`

- `reportKey`
- `caseKey`
- `caseNo`
- `deliveryStatus`
- `deliveryMethod`
- `deliveredAt`
- `receivedAt`
- `recipientName`
- `reissueCount`

### Read APIs

- `GET /api/appraisal/reports`
  - filters:
    - `review_status`
    - `delivery_status`
    - `assigned_appraiser_id`
    - `query`
    - `limit`
    - `offset`

### Write APIs

- `PATCH /api/appraisal/reports/:reportKey/review`
  - payload:
    - `reviewStatus`
    - `reviewerId`
    - `approverId`
    - `rejectionReason`
    - `note`

- `PATCH /api/appraisal/reports/:reportKey/delivery`
  - payload:
    - `deliveryStatus`
    - `deliveryMethod`
    - `deliveredAt`
    - `receivedAt`
    - `recipientName`
    - `reissueReason`

### Output or download APIs

- approved-document download actions are available from queue rows
- delivery package generation uses the currently approved report version only

## Caching and Persistence

- review queue and delivery queue share a normalized report-list cache
- row-level review or delivery mutation patches the visible row immediately
- successful review or delivery mutations invalidate overview counters for aging and backlog

## State Model

### Primary local state

- `query`
- `reviewStatus`
- `deliveryStatus`
- `assignedAppraiserId`
- `rows`
- `total`
- `selectedKeys`
- `reviewRow`
- `reviewForm`
- `deliveryRow`
- `deliveryForm`
- `loading`
- `error`
- `notice`

### Derived state

- `reviewQueueRows`
- `deliveryQueueRows`
- `activePreset`
- `canApprove`
- `canDeliver`
- `selectedRows`

## Business Rules

### Identifier rules

- review and delivery actions mutate by `reportKey`
- queue rows must display `caseNo`, `versionNo`, and current review status together

### Domain rules

- a report can enter `approved` only through the review mutation
- default v1 separation of duties:
  - drafter and approver should not be the same user unless an override permission exists
- `revision_requested` requires a non-empty rejection reason
- delivery completion states are blocked until:
  - report review status is `approved`
  - approved version is the active version
- `receivedAt` cannot be earlier than `deliveredAt`
- reissue action does not overwrite the delivered version; it starts a new draft version

### Validation rules

- review save is blocked unless:
  - `reviewStatus` exists
  - `approverId` exists for approval
- delivery save is blocked unless:
  - `deliveryMethod` exists when moving to `delivered`
  - `recipientName` exists when moving to `received`

## UI Composition

### Main sections

- review backlog toolbar
- queue table
- review drawer
- delivery drawer
- approved document actions

### Modal and overlay structure

- review decision drawer
- delivery tracking drawer
- reissue confirmation modal

## Interaction Flows

### Review flow

1. reviewer opens a report row
2. checks review ownership and status
3. marks either `revision_requested` or `approved`
4. visible row and overview backlog counters update

### Delivery flow

1. operator opens an approved row
2. enters delivery method and delivered date
3. later records recipient and receipt date
4. delivery queue updates from `pending` to `delivered` to `received`

### Reissue flow

1. operator chooses `재발행`
2. confirms reason
3. system routes to new report creation with version increment

## Error Handling

- review mutation failures keep the drawer open with server validation text
- delivery mutation failures do not clear entered recipient fields
- stale version conflicts force a row refetch before another approval attempt

## Non-Obvious Implementation Notes

- Review and delivery are downstream pipeline stages, but they still live in the reports section for v1 simplicity.
- Delivery history must remain attached to the approved report version that was actually sent.
- Reissue should create a new report version, not mutate delivery history on the old one.

## Recovery Checklist

- [ ] Review queue renders from report rows
- [ ] Approval requires review mutation, not editor-side local state
- [ ] Revision request requires a reason
- [ ] Delivery and receipt are tracked separately
- [ ] Reissue creates a new version instead of overwriting history
- [ ] Delivery cannot complete before approval

## Verification

- approve one report, deliver it, record receipt, and verify row-state transitions
- request revision on another report and verify rejection reason handling
- create a reissue from a delivered version and confirm history preservation

