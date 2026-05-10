# AGENTS.md — A&C 기술사 ERP Codex Rules

## Purpose

This repository implements **A&C 기술사 ERP**, a construction safety engineering ERP for project management, contracts, inspection rounds, safety reports, checklist input, findings/actions, photo ledgers, webhard, mailbox, approvals, admin templates, and dashboard statistics.

## Source of truth

Before implementing any feature, always read:

- `docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md`
- `docs/aec-erp/00-overall/01_FUNCTION_INDEX.md`
- `docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md`
- `docs/aec-erp/00-overall/04_DOCUMENT_PACK_RULE.md`
- `docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md`
- `docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md`
- The target feature folder under `docs/aec-erp/{feature-folder}/`
- The target feature prompt folder under `codex-runbook/FEATURE_PROMPTS/{feature-folder}/`

## Critical containment rule

Feature folders are **implementation units**, not standalone top-level apps.

Actual ERP containment is:

```text
Project
├── Parties / Contacts
├── Contracts / Estimates
├── InspectionRounds
│   ├── Checklist
│   ├── Findings / CorrectiveActions
│   ├── PhotoLedger
│   ├── SafetyCostUsage
│   └── OwnerReportTasks
├── Documents / Reports
│   ├── Sections
│   ├── Findings / Actions section
│   ├── PhotoLedger section
│   ├── Approval / Signature
│   └── Submission
├── Webhard linked files
├── Mail linked threads
└── Activity / History
```

Do **not** build contracts, findings, photo ledgers, approvals, signatures, or submissions as detached standalone records. Global routes such as `/contracts`, `/approvals`, or `/submissions` may exist only as work queues, search pages, or inboxes.

## Data rules

- `Project` is the root entity.
- `Contract` and `Estimate` belong to `Project`.
- `InspectionRound` belongs to `Project`.
- `Checklist`, `Finding`, `CorrectiveAction`, `PhotoLedger`, and `SafetyCostUsage` belong to `InspectionRound`.
- Safety reports belong to `Project + InspectionRound + ownerPartyId`.
- `Approval`, `Signature`, and `Submission` belong to `DocumentInstance`.
- `Webhard` and `Mailbox` can be full-screen apps, but all files/messages must preserve project/document/submission linkage.
- Multiple owners must be modeled through `ProjectParty`.
- Owner-specific reports must use `ownerPartyId`.
- Document export must use the latest saved snapshot.
- AI-generated text must remain draft until user confirmation.
- Do not invent legal text, dates, amounts, organizations, or report facts.

## Implementation workflow

For every feature:

1. Run `00_PLAN_ONLY.md`.
2. Run `05_VALIDATE_PARENT_CHILD_PLACEMENT.md` before coding.
3. Run `01_IMPLEMENT_FEATURE.md`.
4. Run `02_DESIGN_PASS.md`.
5. Run tests.
6. Run `03_REVERSE_AUDIT.md`.
7. Run `04_PATCH_FROM_AUDIT.md` if the audit fails.
8. Do not move to the next feature until the current feature passes Reverse Map audit.

## Feature implementation order

```text
00 → 01 → 02 → 03 → 05 → 06 → 07 → 04 → 08 → 09 → 10 → 11 → 12 → 13 → 14
```

The report module `04` is implemented after `05~07` because it consumes checklist, findings/photo ledger, and safety cost data.
