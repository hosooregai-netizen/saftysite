# Appraisal ERP Spec Pack

## Purpose

- `docs/appraisal-erp` is a reconstruction-grade specification pack for a general appraisal-firm ERP.
- The pack is meant to preserve behavior strongly enough that a new implementation can be built later without rediscovering core workflows from scratch.
- Version 1 scope is fixed to backoffice and core authoring:
  - intake and case creation
  - case and subject management
  - assignment and schedules
  - appraisal report drafting
  - review and approval
  - delivery and receipt
  - fee, invoice, and settlement tracking

## Pack Structure

### Core reference documents

- [reverse-spec-template.md](./reverse-spec-template.md)
- [feature-inventory.md](./feature-inventory.md)
- [feature-mapping.md](./feature-mapping.md)
- [domain-model.md](./domain-model.md)
- [routes-and-ia.md](./routes-and-ia.md)
- [api-contracts.md](./api-contracts.md)

### Reverse specs

- [intake-and-case-dashboard-reverse-spec.md](./intake-and-case-dashboard-reverse-spec.md)
- [case-directory-and-detail-shell-reverse-spec.md](./case-directory-and-detail-shell-reverse-spec.md)
- [assignment-schedule-board-reverse-spec.md](./assignment-schedule-board-reverse-spec.md)
- [appraiser-my-schedule-board-reverse-spec.md](./appraiser-my-schedule-board-reverse-spec.md)
- [appraisal-report-list-and-create-flow-reverse-spec.md](./appraisal-report-list-and-create-flow-reverse-spec.md)
- [appraisal-report-composition-flow-reverse-spec.md](./appraisal-report-composition-flow-reverse-spec.md)
- [evidence-upload-and-attachment-flow-reverse-spec.md](./evidence-upload-and-attachment-flow-reverse-spec.md)
- [review-approval-delivery-center-reverse-spec.md](./review-approval-delivery-center-reverse-spec.md)
- [fee-invoice-and-settlement-flow-reverse-spec.md](./fee-invoice-and-settlement-flow-reverse-spec.md)

## Relationship To Existing Reverse Specs

- The current `docs/reverse-specs` folder documents a safety ERP.
- This folder does not duplicate those documents verbatim.
- Instead, it reuses proven shell patterns from the safety ERP and remaps them into appraisal-domain workflows.
- The exact carryover and removal decisions are documented in [feature-mapping.md](./feature-mapping.md).

## Source Mapping

- Reuse the current strengths of the codebase:
  - section-based admin shell
  - shared provider and store patterns
  - list, filter, sort, pagination, and cache patterns
  - document export, attachment, and notification flows
  - feature-contract smoke-test mindset
- Replace the current safety-domain nouns with appraisal-domain nouns:
  - `site` -> `case` and `property subject`
  - `technical guidance report` -> `appraisal report`
  - `dispatch` -> `delivery` and `receipt`
  - `assignee` -> `appraiser`, `reviewer`, `approver`
  - `visit round` -> `case milestone`
- Exclude from v1:
  - quarterly summary
  - bad workplace
  - hazard step editors
  - education and measurement inventory
  - technical-guidance projections
  - K2B-specific semantics

## Data Contracts

The public v1 entities are fixed to:

- `AppraisalCase`
- `CaseOrder`
- `PropertySubject`
- `CaseAssignment`
- `CaseSchedule`
- `AppraisalReport`
- `ValuationWorksheet`
- `ComparableEntry`
- `EvidenceAsset`
- `ReviewApproval`
- `InvoiceSettlement`

The primary public endpoints are fixed to:

- `/api/appraisal/dashboard/overview`
- `/api/appraisal/cases`
- `/api/appraisal/schedules/calendar`
- `/api/appraisal/reports`
- `/api/appraisal/reports/:reportKey/review`
- `/api/appraisal/reports/:reportKey/delivery`
- `/api/appraisal/assets`
- `/api/appraisal/finance/invoices`

## State Model

The pack assumes one shared case lifecycle across dashboard, case, schedule, report, and finance documents:

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

Documents in this folder must not invent a conflicting case-status vocabulary.

## Business Rules

- Delivery cannot complete before report approval.
- Invoice completion states cannot complete before report approval.
- Case close requires:
  - approved report
  - delivery received or explicitly waived
  - settlement completed or written off
- Mobile field-investigation UX is phase 2 only and must not leak into the v1 core feature set.
- External registry, map, and public-data integration are out of scope for v1 and remain connector slots only.

## Interaction Flows

### Primary implementation flow

1. Start at [domain-model.md](./domain-model.md) and [routes-and-ia.md](./routes-and-ia.md).
2. Lock API shapes with [api-contracts.md](./api-contracts.md).
3. Build list and dashboard flows from the case, schedule, report, review, and finance reverse specs.
4. Add attachments and export behavior using the evidence and report composition specs.
5. Use [feature-inventory.md](./feature-inventory.md) to track what is done versus deferred.

### Migration flow from the current safety ERP

1. Read [feature-mapping.md](./feature-mapping.md).
2. Reuse the structural patterns marked `재사용`.
3. Rename and remodel the areas marked `치환`.
4. Exclude the areas marked `제거`.
5. Keep `phase2` documents as references only.

## Recovery Checklist

- [ ] Core document set exists and is cross-linked.
- [ ] Every reverse spec uses the same case-status vocabulary.
- [ ] Public entity names match `api-contracts.md`.
- [ ] Future routes match `routes-and-ia.md`.
- [ ] Removed safety-domain features are not reintroduced into v1 by accident.
- [ ] Delivery and invoice gating rules stay consistent across dashboard, report, and finance specs.

