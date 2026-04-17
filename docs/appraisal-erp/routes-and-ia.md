# Appraisal ERP Routes And IA

## Purpose

- Define the future navigation structure for the appraisal ERP.
- Keep the section shell and detail routes stable while features evolve.
- Provide one shared IA reference for the reverse specs in this folder.

## Source Mapping

- The top-level IA reuses the current section-driven admin shell pattern from the safety ERP.
- The detail flows reuse the current list-to-detail-to-document route rhythm.
- Safety-only routes for quarterly, bad workplace, hazard demo, and mobile inspection are excluded from v1.

## Primary Routes

### Section shell

- `/appraisal?section=overview`
- `/appraisal?section=cases`
- `/appraisal?section=schedules`
- `/appraisal?section=reports`
- `/appraisal?section=finance`
- `/appraisal?section=settings`

### Detail routes

- `/appraisal/cases/[caseKey]`
- `/appraisal/reports/[reportKey]`

## IA Structure

| Route | Primary user goal | Core children or panels |
| --- | --- | --- |
| `/appraisal?section=overview` | See operational status at a glance | KPI cards, due queues, review queue, delivery aging, invoice aging |
| `/appraisal?section=cases` | Browse and manage cases | filters, case table, create modal, quick actions |
| `/appraisal/cases/[caseKey]` | Work one case end-to-end | summary, subjects, evidence, report list, delivery, finance, audit |
| `/appraisal?section=schedules` | Manage shared calendar board | month grid, milestone queue, assignment modal |
| `/appraisal?section=reports` | Manage report pipeline | report list, review queue, delivery center |
| `/appraisal/reports/[reportKey]` | Draft or review one appraisal report | document editor, comparables, worksheet, attachments, export |
| `/appraisal?section=finance` | Track invoice and settlement state | invoice list, aging table, payment drawer |
| `/appraisal?section=settings` | Manage lookups and policy | staff roles, numbering policies, template settings, connector slots |

## Query And Detail Conventions

- `section` controls the primary shell section.
- `month` controls schedule-board month.
- `view=me` scopes the schedule board to the current appraiser.
- `caseKey` is the stable route param for case detail.
- `reportKey` is the stable route param for report composition.
- Detail pages use local tabs or panels, not additional public route depth, for v1.

## Data Contracts

### Shell route contracts

- section shell routes must carry enough context to restore filters and local cache keys.
- detail routes must be resolvable from a single stable identifier without title lookups.

### Recommended search params

- overview:
  - `preset`
  - `dateFrom`
  - `dateTo`
- cases:
  - `query`
  - `status`
  - `clientId`
  - `appraiserId`
- schedules:
  - `month`
  - `ownerUserId`
  - `view`
  - `status`
- reports:
  - `query`
  - `reviewStatus`
  - `deliveryStatus`
- finance:
  - `query`
  - `invoiceStatus`
  - `dateFrom`
  - `dateTo`

## State Model

### Shell state

- `activeSection`
- section-level filters
- session-cache signatures by section
- selected row ids for list actions

### Detail state

- `activeCasePanel`
- `activeReportPanel`
- current approval banner
- current finance banner
- unsaved draft state where applicable

## Business Rules

- The top-level section set is fixed for v1 and should not fragment into many additional first-level routes.
- Case detail is the operational hub for one case.
- Report detail is the authoring hub for one report version.
- Settings remains a configuration surface and must not absorb transactional workflows.
- Worker-style schedule focus may live under `section=schedules&view=me`, but must still share the same calendar vocabulary as the controller board.

## Interaction Flows

### Backoffice flow

1. Open `/appraisal?section=overview`.
2. Drill into a case from a due or review queue.
3. Move to case detail for subjects, evidence, and report context.
4. Open report detail when drafting or reviewing.
5. Return to finance or overview after approval and delivery.

### Personal work flow

1. Open `/appraisal?section=schedules&view=me`.
2. Confirm investigation or drafting milestones.
3. Open the linked case or report.
4. Save schedule reason or progress note.

## Recovery Checklist

- [ ] Public v1 routes match the fixed route list.
- [ ] Case and report detail pages each use a single stable identifier.
- [ ] Section shell remains the main navigation model.
- [ ] Search-param conventions are consistent with future cache keys.
- [ ] No removed safety-only route leaks into appraisal v1.

