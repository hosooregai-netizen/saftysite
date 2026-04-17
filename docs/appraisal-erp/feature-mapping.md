# Safety ERP To Appraisal ERP Feature Mapping

## Purpose

- Classify each existing reverse spec from `docs/reverse-specs` as `재사용`, `치환`, `제거`, or `phase2`.
- Make the carryover strategy explicit before implementation begins.
- Prevent accidental reuse of safety-domain business rules inside the appraisal ERP.

## Mapping Table

| Existing reverse spec | Classification | Appraisal carryover | Notes |
| --- | --- | --- | --- |
| `admin-overview-dashboard-reverse-spec.md` | `재사용` | overview shell, KPI cards, aging tables, export pattern | Replace safety KPI labels with intake, review, delivery, and finance signals |
| `admin-schedules-section-reverse-spec.md` | `재사용` | controller calendar board, queue, modal save, drag move | Rename schedule rows from visit rounds to case milestones |
| `admin-reports-list-and-review-reverse-spec.md` | `재사용` | global report table, filters, review modal, export actions | Replace dispatch logic with review, approval, delivery, and receipt logic |
| `worker-calendar-schedule-board-reverse-spec.md` | `재사용` | appraiser schedule board, reason capture, date-window rules | Keep worker-style personal schedule flow |
| `photo-upload-and-attachment-flow-reverse-spec.md` | `재사용` | asset upload, album list, attachment bridge, bundle download | Expand from photos to evidence assets |
| `admin-sites-list-and-edit-reverse-spec.md` | `치환` | directory, detail shell, CRUD, assignment modal | `site` becomes `case` plus `property subject` detail |
| `site-technical-guidance-report-list-reverse-spec.md` | `치환` | report list, create dialog, route into editor | `technical guidance report` becomes `appraisal report` |
| `quarterly-report-composition-flow-reverse-spec.md` | `제거` | none in v1 | Quarterly summary composition is outside appraisal v1 |
| `bad-workplace-report-composition-flow-reverse-spec.md` | `제거` | none in v1 | Bad-workplace reporting does not carry over |
| `mobile-inspection-session-shell-reverse-spec.md` | `phase2` | possible mobile shell ideas only | Keep outside v1 scope |
| `mobile-inspection-step7-doc7-reverse-spec.md` | `phase2` | none for v1 | Hazard-step semantics are not part of appraisal v1 |
| `admin-report-open-legacy-bootstrap-reverse-spec.md` | `phase2` | migration reference only | Revisit only if legacy appraisal migration becomes a requirement |

## Source Mapping

### Reuse rules

- Keep:
  - overview shell
  - list and detail table patterns
  - calendar board structure
  - report list and review flows
  - photo and asset pipeline
  - cache, export, and download behavior
  - admin section composition

### Replacement rules

- Rename:
  - `site` -> `case` and `property subject`
  - `technical guidance report` -> `appraisal report`
  - `dispatch` -> `delivery` and `receipt`
  - `assignee` -> `appraiser`, `reviewer`, `approver`
  - `visit round` -> `case milestone`

### Removal rules

- Remove:
  - quarterly summary
  - bad workplace
  - hazard and doc7 semantics
  - education and measurement inventory
  - technical-guidance projection logic
  - K2B-specific meaning

### Phase 2 rules

- Park:
  - mobile investigation shell
  - mobile hazard-style guided editors
  - legacy bootstrap and migration helper flows

## Data Contracts

### Contract remapping

| Safety-domain contract | Appraisal-domain contract |
| --- | --- |
| `SafetySite` | `AppraisalCase` plus `PropertySubject[]` |
| `SafetyInspectionSchedule` | `CaseSchedule` |
| `InspectionReportListItem` | `AppraisalReport` list item |
| `PhotoAlbumItem` | `EvidenceAsset` |
| `ReportDispatchMeta` | delivery and receipt metadata |

## State Model

- `재사용` means the UI and state structure survive with renamed entities.
- `치환` means the shell structure survives, but the primary entity and business rules change.
- `제거` means the behavior must not appear in v1 even if technically reusable.
- `phase2` means reference-only material that must not block v1.

## Business Rules

- Every existing reverse spec must appear exactly once in this document.
- `phase2` docs can influence later architecture, but cannot define v1 acceptance criteria.
- Removed safety-only semantics may still inspire layout or editor ergonomics, but not lifecycle rules.

## Interaction Flows

### Rebuild flow

1. Read this mapping.
2. Start from `재사용` documents for shell structure.
3. Apply `치환` documents for appraisal-domain remodels.
4. Ignore `제거` during v1 scope decisions.
5. Keep `phase2` as appendix references only.

### Audit flow

1. Count the existing reverse specs.
2. Confirm every one appears in the mapping table.
3. Confirm none is double-classified.

## Recovery Checklist

- [ ] All 12 existing reverse specs are listed exactly once.
- [ ] Reuse, replace, remove, and phase-2 boundaries match the implementation plan.
- [ ] Safety-only semantics are not silently carried into appraisal v1.
- [ ] Entity renames align with `domain-model.md` and `api-contracts.md`.

