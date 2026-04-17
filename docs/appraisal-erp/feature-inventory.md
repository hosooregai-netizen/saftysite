# Appraisal ERP Feature Inventory

## Purpose

- Track which appraisal ERP features already have reconstruction-grade documents.
- Separate v1 core features from phase 2 references.
- Keep implementation priority visible without mixing in removed safety-only modules.

## Priority Model

- `core`: required for v1 backoffice and core authoring
- `support`: supporting reference or architecture document
- `phase2`: useful later, but not part of v1 delivery

## Core Features

| Feature | Priority | Status | Spec |
| --- | --- | --- | --- |
| Intake and case dashboard | `core` | `done` | [intake-and-case-dashboard-reverse-spec.md](./intake-and-case-dashboard-reverse-spec.md) |
| Case directory and detail shell | `core` | `done` | [case-directory-and-detail-shell-reverse-spec.md](./case-directory-and-detail-shell-reverse-spec.md) |
| Assignment schedule board | `core` | `done` | [assignment-schedule-board-reverse-spec.md](./assignment-schedule-board-reverse-spec.md) |
| Appraiser my-schedule board | `core` | `done` | [appraiser-my-schedule-board-reverse-spec.md](./appraiser-my-schedule-board-reverse-spec.md) |
| Appraisal report list and create flow | `core` | `done` | [appraisal-report-list-and-create-flow-reverse-spec.md](./appraisal-report-list-and-create-flow-reverse-spec.md) |
| Appraisal report composition flow | `core` | `done` | [appraisal-report-composition-flow-reverse-spec.md](./appraisal-report-composition-flow-reverse-spec.md) |
| Evidence upload and attachment flow | `core` | `done` | [evidence-upload-and-attachment-flow-reverse-spec.md](./evidence-upload-and-attachment-flow-reverse-spec.md) |
| Review, approval, and delivery center | `core` | `done` | [review-approval-delivery-center-reverse-spec.md](./review-approval-delivery-center-reverse-spec.md) |
| Fee, invoice, and settlement flow | `core` | `done` | [fee-invoice-and-settlement-flow-reverse-spec.md](./fee-invoice-and-settlement-flow-reverse-spec.md) |

## Support Documents

| Document | Priority | Status | Spec |
| --- | --- | --- | --- |
| Appraisal ERP pack guide | `support` | `done` | [README.md](./README.md) |
| Reverse spec template | `support` | `done` | [reverse-spec-template.md](./reverse-spec-template.md) |
| Feature mapping from safety ERP | `support` | `done` | [feature-mapping.md](./feature-mapping.md) |
| Domain model | `support` | `done` | [domain-model.md](./domain-model.md) |
| Routes and IA | `support` | `done` | [routes-and-ia.md](./routes-and-ia.md) |
| API contracts | `support` | `done` | [api-contracts.md](./api-contracts.md) |

## Deferred And Phase 2 References

| Feature | Priority | Status | Note |
| --- | --- | --- | --- |
| Mobile field-investigation shell | `phase2` | `seed` | Revisit after v1 backoffice and report authoring are stable |
| On-site photo-first capture UX | `phase2` | `seed` | Use evidence asset model from v1, but keep mobile shell separate |
| Legacy bootstrap and converter flows | `phase2` | `seed` | Consider only for migration-heavy customers |
| External registry and map connectors | `phase2` | `seed` | Keep as connector slots, not v1 blocking scope |

## Source Mapping

- The inventory derives from the safety-ERP reverse set, but only the structural patterns survive.
- The v1 appraisal set keeps:
  - overview and queue dashboards
  - directory and detail shells
  - calendar and assignment boards
  - document authoring and review
  - attachment, export, and settlement support
- The inventory deliberately excludes:
  - quarterly summary
  - bad workplace reporting
  - hazard step editors
  - education and measurement content workflows

## Data Contracts

The inventory is organized around these contract groups:

- case contracts
- schedule contracts
- report contracts
- evidence contracts
- review and delivery contracts
- invoice and settlement contracts

Each `done` feature must reference at least one of the public entities defined in [api-contracts.md](./api-contracts.md).

## State Model

- `support` documents define common vocabulary and lifecycle.
- `core` documents define reconstructable behavior for each feature slice.
- `phase2` rows are references only and must not be treated as v1 completion blockers.

## Business Rules

- A row can be marked `done` only when the linked document exists.
- `core` documents must include approval, delivery, and finance consequences when relevant.
- Any new feature added later must pick one priority class before implementation planning starts.

## Interaction Flows

### Pack maintenance flow

1. Add or revise a feature document.
2. Link it here.
3. Mark its priority.
4. Confirm it uses the shared lifecycle vocabulary.

### Implementation flow

1. Read the support documents.
2. Pick one `core` feature row.
3. Build against its reverse spec.
4. Use this inventory to track remaining work.

## Recovery Checklist

- [ ] Every `done` row links to a real file.
- [ ] Core v1 features cover intake, case, schedule, report, evidence, review, and finance.
- [ ] No removed safety-only module appears as a v1 feature row.
- [ ] Phase 2 references are visible but clearly out of scope for v1.

