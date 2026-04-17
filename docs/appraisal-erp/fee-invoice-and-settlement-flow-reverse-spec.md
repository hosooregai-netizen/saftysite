# Reverse Spec - Fee Invoice And Settlement Flow

## Purpose

- Recover the finance-facing flow for fee setup, invoice issuance, payment entry, aging review, and settlement closure at the case level.
- Preserve list filtering, invoice drafting, payment accumulation, and case-close gating from the finance perspective.

## Source Mapping

- Structural list and summary patterns:
  - [../reverse-specs/admin-overview-dashboard-reverse-spec.md](../reverse-specs/admin-overview-dashboard-reverse-spec.md)
  - [../reverse-specs/admin-sites-list-and-edit-reverse-spec.md](../reverse-specs/admin-sites-list-and-edit-reverse-spec.md)
- Delivery dependency:
  - [review-approval-delivery-center-reverse-spec.md](./review-approval-delivery-center-reverse-spec.md)
- Renamed entities:
  - no direct safety-domain equivalent; this is a new v1 appraisal module
- Removed semantics:
  - revenue by visit-round and safety-site operations
- New appraisal-only logic:
  - invoice lifecycle
  - payment accumulation
  - settlement and write-off

## Feature Goal

Users must be able to:

- browse invoice and settlement rows by case
- issue an invoice from an approved and delivered report case
- record one or more payments
- track unpaid, partially paid, paid, settled, or written-off cases
- block final case closure until finance state is complete

## User Role

- primary user: finance operator
- secondary user: operations admin or partner reviewing financial status
- preconditions:
  - authenticated appraisal ERP session
  - finance permission on the target case set

## Entry and Scope

- route: `/appraisal?section=finance`
- optional search params:
  - `query`
  - `status`
  - `dateFrom`
  - `dateTo`
  - `assignedAppraiserId`
- out of scope:
  - general ledger
  - journal entries
  - tax filing workflows

## Data Contracts

### Main entities

`InvoiceSettlement`

- `invoiceNo`
- `caseKey`
- `caseNo`
- `orderNo`
- `clientName`
- `status`
- `issueDate`
- `dueDate`
- `supplyAmount`
- `taxAmount`
- `totalAmount`
- `receivedAmount`
- `outstandingAmount`
- `settledAt`
- `writeOffReason`

`PaymentRow`

- `paymentId`
- `invoiceNo`
- `receivedAt`
- `amount`
- `method`
- `memo`

### Read APIs

- `GET /api/appraisal/finance/invoices`
  - filters:
    - `query`
    - `status`
    - `date_from`
    - `date_to`
    - `assigned_appraiser_id`
    - `limit`
    - `offset`
  - response:
    - `rows`
    - `total`
    - `summary`

### Write APIs

- `POST /api/appraisal/finance/invoices`
  - payload:
    - `caseKey`
    - `issueDate`
    - `dueDate`
    - `supplyAmount`
    - `taxAmount`
    - optional initial `payments`

- `PATCH /api/appraisal/finance/invoices/:invoiceNo`
  - payload:
    - `status`
    - `payments`
    - `writeOffReason`

### Output or download APIs

- invoice document download by `invoiceNo`
- settlement export for the filtered list

## Caching and Persistence

- finance list cache key:
  - `appraisal-finance:list:${requestKey}`
- summary cards share the same cache signature as the list
- payment entry mutates the visible row in place and invalidates overview aging counters

## State Model

### Primary local state

- `query`
- `status`
- `dateFrom`
- `dateTo`
- `page`
- `sort`
- `rows`
- `total`
- `summary`
- `invoiceDrawerRow`
- `invoiceForm`
- `paymentDrawerRow`
- `paymentForm`
- `error`
- `notice`

### Derived state

- `requestKey`
- `activeFilterCount`
- `pagedRows`
- `agingBuckets`
- `canIssueInvoice`
- `canCloseCase`

## Business Rules

### Identifier rules

- finance mutations use `invoiceNo` and `caseKey`
- invoice rows must display `caseNo`, `orderNo`, and `invoiceNo` together

### Domain rules

- invoice issuance is blocked until:
  - the active report is `approved`
  - delivery status is `delivered` or `received`
- `receivedAmount` is the sum of all payment rows
- status resolution:
  - `draft` when invoice exists but not issued
  - `issued` when issued and `receivedAmount === 0`
  - `partially_paid` when `0 < receivedAmount < totalAmount`
  - `paid` when `receivedAmount >= totalAmount`
  - `settled` when payment reconciliation is confirmed
  - `written_off` when explicitly closed without full payment
- case `closed` is blocked until finance status is `settled` or `written_off`

### Validation rules

- `supplyAmount` and `taxAmount` must be non-negative
- `dueDate` cannot be earlier than `issueDate`
- payment amount must be greater than `0`
- write-off requires a non-empty reason

## UI Composition

### Main sections

- finance summary cards
- invoice aging table
- invoice list table
- invoice issue drawer
- payment drawer

### Modal and overlay structure

- invoice create or edit drawer
- payment entry drawer
- write-off confirmation modal

## Interaction Flows

### Initial load

1. resolve filters
2. hydrate finance cache if present
3. fetch invoice rows and summary rollups
4. derive aging buckets and visible rows
5. render finance workspace

### Invoice issue flow

1. user selects a case
2. finance screen validates approval and delivery gates
3. user enters issue date, due date, and amounts
4. save creates or updates `InvoiceSettlement`

### Payment and settlement flow

1. user opens payment drawer
2. adds one or more payment rows
3. row recomputes `receivedAmount` and `outstandingAmount`
4. status moves from `issued` to `partially_paid` to `paid`
5. finance confirms settlement and case-close eligibility

## Error Handling

- blocked invoice issuance shows an inline reason tied to approval or delivery state
- payment mutation failures keep entered rows intact for retry
- stale finance rows refetch before a settlement confirmation retry

## Non-Obvious Implementation Notes

- This module is intentionally case-level operational finance, not full accounting.
- Finance summary cards and overview aging metrics must derive from the same normalized invoice rows.
- Write-off is a terminal finance decision and must remain auditable alongside case closure.

## Recovery Checklist

- [ ] Finance list and summary cards render
- [ ] Invoice issuance is approval- and delivery-gated
- [ ] Partial payments recompute row state
- [ ] Settlement blocks or allows case closure correctly
- [ ] Write-off requires an explicit reason
- [ ] Finance status values align with `domain-model.md`

## Verification

- issue one invoice after approval and delivery, record partial payment, then settle it
- test one blocked invoice issuance before approval
- verify case-close eligibility changes only after settlement or write-off

