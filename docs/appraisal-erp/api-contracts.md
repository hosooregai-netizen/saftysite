# Appraisal ERP API Contracts

## Purpose

- Freeze the primary entity names and public endpoint surface for appraisal ERP v1.
- Give future implementers a stable contract layer before UI and storage details diverge.
- Keep delivery, approval, and finance transitions aligned across endpoints.

## Source Mapping

- The contract style reuses the safety ERP's split between list APIs, detail mutations, exports, and attachment endpoints.
- The nouns and workflow states are redefined for appraisal operations.
- Finance is promoted to a first-class API surface instead of a secondary metadata field.

## Data Contracts

### Public entities

```ts
type AppraisalCase = {
  caseKey: string;
  orderNo: string;
  clientOrderNo: string | null;
  clientId: string;
  requestingOrgId: string | null;
  purpose: string;
  baseDate: string | null;
  receivedDate: string;
  dueDate: string;
  status: string;
  assignedAppraiserId: string | null;
  reviewerId: string | null;
  approverId: string | null;
  subjectCount: number;
  reportVersion: number;
  deliveryStatus: string;
  invoiceStatus: string;
};

type CaseOrder = {
  orderNo: string;
  caseKey: string;
  requestedDeliverables: string[];
  billingMode: string;
  quotedAmount: number | null;
  taxMode: string;
  memo: string | null;
};

type PropertySubject = {
  subjectId: string;
  caseKey: string;
  subjectType: string;
  address: string;
  parcelRef: string | null;
  rightRelationSummary: string | null;
  status: string;
};

type CaseAssignment = {
  caseKey: string;
  assignedAppraiserId: string | null;
  reviewerId: string | null;
  approverId: string | null;
  assignedAt: string | null;
  assignmentNote: string | null;
};

type CaseSchedule = {
  scheduleId: string;
  caseKey: string;
  milestoneType: string;
  plannedDate: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  ownerUserId: string | null;
  status: string;
  changeReasonLabel: string | null;
  changeReasonMemo: string | null;
};

type AppraisalReport = {
  reportKey: string;
  caseKey: string;
  versionNo: number;
  title: string;
  status: string;
  baseDate: string | null;
  dueDate: string;
  purpose: string;
  subjectIds: string[];
  draftedBy: string | null;
  reviewRequestedAt: string | null;
  approvedAt: string | null;
  deliveredAt: string | null;
};

type ValuationWorksheet = {
  reportKey: string;
  valuationBasis: string | null;
  approachTypes: string[];
  conclusionValue: number | null;
  assumptions: string[];
};

type ComparableEntry = {
  comparableId: string;
  reportKey: string;
  category: string;
  sourceLabel: string;
  transactionDate: string | null;
  baseValue: number | null;
  adjustedValue: number | null;
};

type EvidenceAsset = {
  assetId: string;
  caseKey: string;
  reportKey: string | null;
  subjectId: string | null;
  assetKind: string;
  fileName: string;
  previewUrl: string;
  downloadUrl: string;
};

type ReviewApproval = {
  reportKey: string;
  reviewStatus: string;
  reviewerId: string | null;
  approverId: string | null;
  reviewRequestedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
};

type InvoiceSettlement = {
  invoiceNo: string;
  caseKey: string;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  totalAmount: number;
  receivedAmount: number;
  settledAt: string | null;
};
```

### Fixed primary endpoints

- `GET /api/appraisal/dashboard/overview`
- `GET /api/appraisal/cases`
- `POST /api/appraisal/cases`
- `GET /api/appraisal/schedules/calendar`
- `GET /api/appraisal/reports`
- `POST /api/appraisal/reports`
- `PATCH /api/appraisal/reports/:reportKey/review`
- `PATCH /api/appraisal/reports/:reportKey/delivery`
- `GET /api/appraisal/assets`
- `POST /api/appraisal/assets`
- `GET /api/appraisal/finance/invoices`
- `POST /api/appraisal/finance/invoices`

### Response envelopes

- list endpoints should return:
  - `rows`
  - `total`
  - `limit`
  - `offset`
  - `refreshedAt`
- detail-style mutations should return:
  - `ok`
  - updated entity
  - `notice` when user-facing confirmation matters

## Endpoint Notes

### `/api/appraisal/dashboard/overview`

- returns case summary KPIs
- returns due, review, delivery, and invoice aging rows
- returns appraiser workload rollups

### `/api/appraisal/cases`

- list filters:
  - `query`
  - `status`
  - `client_id`
  - `assigned_appraiser_id`
  - `reviewer_id`
  - `date_from`
  - `date_to`
- create payload includes:
  - order metadata
  - case header
  - initial subjects
  - initial assignment

### `/api/appraisal/schedules/calendar`

- filters:
  - `month`
  - `owner_user_id`
  - `view`
  - `status`
  - `query`
- response groups:
  - `rows`
  - `monthTotal`
  - `queueTotal`
  - `availableMonths`

### `/api/appraisal/reports`

- list filters:
  - `query`
  - `case_key`
  - `assigned_appraiser_id`
  - `review_status`
  - `delivery_status`
  - `date_from`
  - `date_to`
- create payload includes:
  - `caseKey`
  - `versionMode`
  - `subjectIds`
  - optional `seedFromApprovedReportKey`

### `/api/appraisal/reports/:reportKey/review`

- payload:
  - `reviewStatus`
  - `reviewerId`
  - `approverId`
  - `rejectionReason`
  - `note`

### `/api/appraisal/reports/:reportKey/delivery`

- payload:
  - `deliveryStatus`
  - `deliveryMethod`
  - `deliveredAt`
  - `receivedAt`
  - `recipientName`
  - `reissueReason`

### `/api/appraisal/assets`

- upload accepts:
  - `file`
  - `case_key`
  - optional `report_key`
  - optional `subject_id`
  - `asset_kind`
- list filters:
  - `case_key`
  - `report_key`
  - `subject_id`
  - `asset_kind`
  - `query`

### `/api/appraisal/finance/invoices`

- list filters:
  - `query`
  - `case_key`
  - `status`
  - `date_from`
  - `date_to`
- create or update payload includes:
  - `caseKey`
  - `issueDate`
  - `dueDate`
  - `supplyAmount`
  - `taxAmount`
  - `payments[]`

## State Model

- list APIs support section-cache hydration and paged list UIs
- report composition assumes autosave drafts over explicit final-submit only
- review, delivery, and finance mutations must return enough data to patch visible rows locally

## Business Rules

- Delivery completion states are blocked until the target report is approved.
- Invoice completion states are blocked until the target report is approved.
- Case-close automation may read from report, delivery, and finance endpoints, but no endpoint may bypass the shared lifecycle.
- Public contract names in this document are canonical and should be reused in code, specs, and tests.

## Interaction Flows

### Core transaction flow

1. Create case through `/api/appraisal/cases`.
2. Load overview and schedule board.
3. Create report through `/api/appraisal/reports`.
4. Review and approve through `/api/appraisal/reports/:reportKey/review`.
5. Deliver through `/api/appraisal/reports/:reportKey/delivery`.
6. Issue and settle through `/api/appraisal/finance/invoices`.

### Attachment flow

1. Upload evidence through `/api/appraisal/assets`.
2. Link it to case, subject, or report.
3. Reuse it from report composition or delivery bundles.

## Recovery Checklist

- [ ] Entity names match the implementation plan exactly.
- [ ] Fixed public endpoints match the implementation plan exactly.
- [ ] List, review, delivery, asset, and finance contracts can drive the reverse specs.
- [ ] Delivery and finance gating rules cannot conflict with `domain-model.md`.

