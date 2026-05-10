# A&C ERP — All-in-one Markdown

이 파일은 프로젝트 준비용 문서팩의 모든 Markdown을 하나로 합친 버전이다.


---

## FILE: `AGENTS.md`

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


---

## FILE: `Agent.md`

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


---

## FILE: `CODEX_START_HERE.md`

# CODEX_START_HERE

이 파일부터 읽고 Codex 작업을 시작한다.

## 1. 프로젝트에 복사

이 패키지의 내용을 repo root에 그대로 복사한다.

```bash
cp -R AGENTS.md Agent.md CODEX_START_HERE.md codex-runbook docs /path/to/repo/
```

## 2. 첫 번째 Codex 입력

아래 파일을 그대로 Codex에 입력한다.

```text
codex-runbook/ROOT_PROMPTS/00_READ_AND_PLAN.md
```

## 3. 두 번째 Codex 입력

```text
codex-runbook/ROOT_PROMPTS/01_BOOTSTRAP_SKELETON.md
```

## 4. 세 번째 Codex 입력

```text
codex-runbook/ROOT_PROMPTS/02_BOOTSTRAP_REVERSE_AUDIT.md
```

## 5. 기능별 반복

각 기능은 아래 순서로 진행한다.

```text
00_PLAN_ONLY.md
05_VALIDATE_PARENT_CHILD_PLACEMENT.md
01_IMPLEMENT_FEATURE.md
02_DESIGN_PASS.md
03_REVERSE_AUDIT.md
04_PATCH_FROM_AUDIT.md
```

## 6. 구현 순서

```text
00-overall-bootstrap
01-project-field
02-contract-estimate
03-inspection-schedule
05-field-inspection-checklist
06-finding-action-photo-ledger
07-safety-cost-usage
04-safety-health-ledger-report
08-safety-management-plan
09-safety-health-ledger
10-webhard
11-mailbox
12-approval-signature-submission
13-admin-template-prompt
14-dashboard-statistics
```

## 7. 인덱스

- Markdown file list: `docs/aec-erp/_index/AEC_ERP_FILE_LIST.md`
- HTML index: `docs/aec-erp/_html/index.html`
- JSON file list: `docs/aec-erp/_json/file_list.json`
- Implementation sequence: `docs/aec-erp/_json/implementation_sequence.json`


---

## FILE: `COPY_TO_REPO.md`

# COPY_TO_REPO

## 전체 복사

```bash
unzip aec_erp_project_ready_docs_v1.zip -d /tmp/aec-docs
cp -R /tmp/aec-docs/aec_erp_project_ready_docs_v1/* /path/to/repo/
```

## 확인

```bash
ls AGENTS.md CODEX_START_HERE.md codex-runbook docs/aec-erp
cat docs/aec-erp/_json/implementation_sequence.json
```

## Codex 시작

```text
codex-runbook/ROOT_PROMPTS/00_READ_AND_PLAN.md
```


---

## FILE: `README.md`

# A&C ERP Project-ready Docs Pack

이 폴더는 프로젝트 루트에 그대로 복사해서 쓸 수 있는 A&C 기술사 ERP 문서/프롬프트 패키지다.

## 넣는 위치

```text
repo-root/
├── AGENTS.md
├── Agent.md
├── CODEX_START_HERE.md
├── codex-runbook/
└── docs/
    └── aec-erp/
```

## 시작 순서

1. `AGENTS.md`를 루트에 둔다.
2. `CODEX_START_HERE.md`를 열어 순서를 확인한다.
3. `codex-runbook/COPY_PASTE_SEQUENCE.md`의 순서대로 Codex에 프롬프트를 넣는다.
4. 각 기능은 `PLAN → CONTAINMENT CHECK → IMPLEMENT → DESIGN → REVERSE AUDIT → PATCH` 순서로 진행한다.

## 중요한 구조

기능 폴더는 구현 단위일 뿐, 실제 ERP는 다음 포함 구조를 따른다.

```text
Project → InspectionRound → DocumentInstance
```

계약/견적은 Project 안에 포함되고, 지적사항/조치/사진대지는 InspectionRound와 Document section 안에 포함되며, 결재/서명/제출은 DocumentInstance 안에 포함된다.


---

## FILE: `codex-runbook/COPY_PASTE_SEQUENCE.md`

# Codex Copy/Paste Sequence

## Root prompts

1. `codex-runbook/ROOT_PROMPTS/00_READ_AND_PLAN.md`
2. `codex-runbook/ROOT_PROMPTS/01_BOOTSTRAP_SKELETON.md`
3. `codex-runbook/ROOT_PROMPTS/02_BOOTSTRAP_REVERSE_AUDIT.md`
4. `codex-runbook/ROOT_PROMPTS/03_VALIDATE_CONTAINMENT_BEFORE_IMPLEMENTATION.md`

## Feature prompts

각 feature folder에서 아래 순서대로 실행한다.

```text
00_PLAN_ONLY.md
05_VALIDATE_PARENT_CHILD_PLACEMENT.md
01_IMPLEMENT_FEATURE.md
02_DESIGN_PASS.md
03_REVERSE_AUDIT.md
04_PATCH_FROM_AUDIT.md
```

## Recommended implementation order

```text
00-overall-bootstrap
01-project-field
02-contract-estimate
03-inspection-schedule
05-field-inspection-checklist
06-finding-action-photo-ledger
07-safety-cost-usage
04-safety-health-ledger-report
08-safety-management-plan
09-safety-health-ledger
10-webhard
11-mailbox
12-approval-signature-submission
13-admin-template-prompt
14-dashboard-statistics
```


---

## FILE: `codex-runbook/FEATURE_PROMPTS/00-overall-bootstrap/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 00 — 전체 골격 / Bootstrap
- featureId: 00-overall-bootstrap
- implementation folder: docs/aec-erp/00-overall
- actual parent/container: repository root / docs

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/00-overall/README.md if it exists
- docs/aec-erp/00-overall/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/00-overall/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/00-overall/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/00-overall/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/00-overall/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/00-overall-bootstrap/01_IMPLEMENT_FEATURE.md`

Implement Feature 00: 전체 골격 / Bootstrap for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/00-overall/README.md if it exists
- docs/aec-erp/00-overall/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/00-overall/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/00-overall/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/00-overall/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/00-overall/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: repository root / docs
- Primary UI location: Repository + ERP shell

Primary routes:
- /dashboard
- /projects
- /webhard
- /mail
- /admin

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/00-overall-bootstrap/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 00: 전체 골격 / Bootstrap.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/00-overall/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: repository root / docs.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/00-overall-bootstrap/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 00: 전체 골격 / Bootstrap.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/00-overall/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/00-overall-bootstrap/04_PATCH_FROM_AUDIT.md`

Patch Feature 00: 전체 골격 / Bootstrap based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: repository root / docs.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/00-overall/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/00-overall/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/00-overall-bootstrap/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 전체 골격 / Bootstrap.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/00-overall/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- repository root / docs
- Repository + ERP shell

Primary routes:
- /dashboard
- /projects
- /webhard
- /mail
- /admin

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/01-project-field/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 01 — 프로젝트/현장 원장 관리
- featureId: project.field.registry
- implementation folder: docs/aec-erp/01-project-field
- actual parent/container: Project root

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/01-project-field/README.md if it exists
- docs/aec-erp/01-project-field/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/01-project-field/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/01-project-field/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/01-project-field/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/01-project-field/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/01-project-field/01_IMPLEMENT_FEATURE.md`

Implement Feature 01: 프로젝트/현장 원장 관리 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/01-project-field/README.md if it exists
- docs/aec-erp/01-project-field/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/01-project-field/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/01-project-field/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/01-project-field/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/01-project-field/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: Project root
- Primary UI location: Project

Primary routes:
- /projects
- /projects/new
- /projects/[projectId]

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/01-project-field/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 01: 프로젝트/현장 원장 관리.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/01-project-field/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/01-project-field/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: Project root.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/01-project-field/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 01: 프로젝트/현장 원장 관리.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/01-project-field/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/01-project-field/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/01-project-field/04_PATCH_FROM_AUDIT.md`

Patch Feature 01: 프로젝트/현장 원장 관리 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Project root.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/01-project-field/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/01-project-field/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/01-project-field/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 프로젝트/현장 원장 관리.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/01-project-field/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- Project root
- Project

Primary routes:
- /projects
- /projects/new
- /projects/[projectId]

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/02-contract-estimate/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 02 — 계약/견적 관리
- featureId: contract.estimate.management
- implementation folder: docs/aec-erp/02-contract-estimate
- actual parent/container: Project

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/02-contract-estimate/README.md if it exists
- docs/aec-erp/02-contract-estimate/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/02-contract-estimate/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/02-contract-estimate/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/02-contract-estimate/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/02-contract-estimate/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/02-contract-estimate/01_IMPLEMENT_FEATURE.md`

Implement Feature 02: 계약/견적 관리 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/02-contract-estimate/README.md if it exists
- docs/aec-erp/02-contract-estimate/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/02-contract-estimate/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/02-contract-estimate/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/02-contract-estimate/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/02-contract-estimate/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: Project
- Primary UI location: Project Detail > Contracts tab

Primary routes:
- /projects/[projectId]/contracts
- /projects/[projectId]/contracts/new
- /contracts/[contractId]

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/02-contract-estimate/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 02: 계약/견적 관리.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/02-contract-estimate/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/02-contract-estimate/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: Project.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/02-contract-estimate/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 02: 계약/견적 관리.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/02-contract-estimate/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/02-contract-estimate/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/02-contract-estimate/04_PATCH_FROM_AUDIT.md`

Patch Feature 02: 계약/견적 관리 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Project.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/02-contract-estimate/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/02-contract-estimate/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/02-contract-estimate/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 계약/견적 관리.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/02-contract-estimate/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- Project
- Project Detail > Contracts tab

Primary routes:
- /projects/[projectId]/contracts
- /projects/[projectId]/contracts/new
- /contracts/[contractId]

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/03-inspection-schedule/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 03 — 점검회차/일정 관리
- featureId: inspection.schedule.management
- implementation folder: docs/aec-erp/03-inspection-schedule
- actual parent/container: Project

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/03-inspection-schedule/README.md if it exists
- docs/aec-erp/03-inspection-schedule/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/03-inspection-schedule/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/03-inspection-schedule/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/03-inspection-schedule/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/03-inspection-schedule/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/03-inspection-schedule/01_IMPLEMENT_FEATURE.md`

Implement Feature 03: 점검회차/일정 관리 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/03-inspection-schedule/README.md if it exists
- docs/aec-erp/03-inspection-schedule/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/03-inspection-schedule/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/03-inspection-schedule/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/03-inspection-schedule/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/03-inspection-schedule/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: Project
- Primary UI location: Project Detail > Inspection Rounds tab

Primary routes:
- /projects/[projectId]/inspections
- /inspections/[inspectionRoundId]
- /calendar/inspections

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/03-inspection-schedule/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 03: 점검회차/일정 관리.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/03-inspection-schedule/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/03-inspection-schedule/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: Project.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/03-inspection-schedule/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 03: 점검회차/일정 관리.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/03-inspection-schedule/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/03-inspection-schedule/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/03-inspection-schedule/04_PATCH_FROM_AUDIT.md`

Patch Feature 03: 점검회차/일정 관리 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Project.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/03-inspection-schedule/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/03-inspection-schedule/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/03-inspection-schedule/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 점검회차/일정 관리.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/03-inspection-schedule/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- Project
- Project Detail > Inspection Rounds tab

Primary routes:
- /projects/[projectId]/inspections
- /inspections/[inspectionRoundId]
- /calendar/inspections

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/04-safety-health-ledger-report/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 04 — 공사안전보건대장 이행확인 보고서 자동화
- featureId: document.safety_health_ledger_report
- implementation folder: docs/aec-erp/04-safety-health-ledger-report
- actual parent/container: Project + InspectionRound + OwnerParty

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/04-safety-health-ledger-report/README.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/04-safety-health-ledger-report/01_IMPLEMENT_FEATURE.md`

Implement Feature 04: 공사안전보건대장 이행확인 보고서 자동화 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/04-safety-health-ledger-report/README.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: Project + InspectionRound + OwnerParty
- Primary UI location: Project Detail > Documents; InspectionRound > Owner Report Tasks; DocumentInstance

Primary routes:
- /projects/[projectId]/documents/safety-reports
- /documents/safety-reports/[documentId]
- /inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/04-safety-health-ledger-report/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 04: 공사안전보건대장 이행확인 보고서 자동화.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/04-safety-health-ledger-report/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: Project + InspectionRound + OwnerParty.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/04-safety-health-ledger-report/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 04: 공사안전보건대장 이행확인 보고서 자동화.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/04-safety-health-ledger-report/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/04-safety-health-ledger-report/04_PATCH_FROM_AUDIT.md`

Patch Feature 04: 공사안전보건대장 이행확인 보고서 자동화 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Project + InspectionRound + OwnerParty.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/04-safety-health-ledger-report/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/04-safety-health-ledger-report/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 공사안전보건대장 이행확인 보고서 자동화.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/04-safety-health-ledger-report/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- Project + InspectionRound + OwnerParty
- Project Detail > Documents; InspectionRound > Owner Report Tasks; DocumentInstance

Primary routes:
- /projects/[projectId]/documents/safety-reports
- /documents/safety-reports/[documentId]
- /inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/05-field-inspection-checklist/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 05 — 현장점검 체크리스트
- featureId: inspection.checklist.management
- implementation folder: docs/aec-erp/05-field-inspection-checklist
- actual parent/container: InspectionRound

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/05-field-inspection-checklist/README.md if it exists
- docs/aec-erp/05-field-inspection-checklist/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/05-field-inspection-checklist/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/05-field-inspection-checklist/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/05-field-inspection-checklist/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/05-field-inspection-checklist/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/05-field-inspection-checklist/01_IMPLEMENT_FEATURE.md`

Implement Feature 05: 현장점검 체크리스트 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/05-field-inspection-checklist/README.md if it exists
- docs/aec-erp/05-field-inspection-checklist/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/05-field-inspection-checklist/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/05-field-inspection-checklist/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/05-field-inspection-checklist/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/05-field-inspection-checklist/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: InspectionRound
- Primary UI location: Inspection Round Detail > Checklist tab

Primary routes:
- /inspections/[inspectionRoundId]/checklist
- /inspections/[inspectionRoundId]/checklist/mobile
- /inspections/[inspectionRoundId]/checklist/review

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/05-field-inspection-checklist/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 05: 현장점검 체크리스트.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/05-field-inspection-checklist/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/05-field-inspection-checklist/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: InspectionRound.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/05-field-inspection-checklist/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 05: 현장점검 체크리스트.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/05-field-inspection-checklist/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/05-field-inspection-checklist/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/05-field-inspection-checklist/04_PATCH_FROM_AUDIT.md`

Patch Feature 05: 현장점검 체크리스트 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: InspectionRound.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/05-field-inspection-checklist/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/05-field-inspection-checklist/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/05-field-inspection-checklist/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 현장점검 체크리스트.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/05-field-inspection-checklist/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- InspectionRound
- Inspection Round Detail > Checklist tab

Primary routes:
- /inspections/[inspectionRoundId]/checklist
- /inspections/[inspectionRoundId]/checklist/mobile
- /inspections/[inspectionRoundId]/checklist/review

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/06-finding-action-photo-ledger/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 06 — 지적사항/조치현황/사진대지
- featureId: finding.action.photo_ledger
- implementation folder: docs/aec-erp/06-finding-action-photo-ledger
- actual parent/container: InspectionRound + Document section

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/06-finding-action-photo-ledger/README.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/06-finding-action-photo-ledger/01_IMPLEMENT_FEATURE.md`

Implement Feature 06: 지적사항/조치현황/사진대지 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/06-finding-action-photo-ledger/README.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: InspectionRound + Document section
- Primary UI location: Inspection Round Detail > Findings/Photo Ledger tabs; Document > photo_ledger section

Primary routes:
- /inspections/[inspectionRoundId]/findings
- /inspections/[inspectionRoundId]/photo-ledger
- /documents/safety-reports/[documentId]/sections/photo_ledger

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/06-finding-action-photo-ledger/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 06: 지적사항/조치현황/사진대지.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/06-finding-action-photo-ledger/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: InspectionRound + Document section.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/06-finding-action-photo-ledger/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 06: 지적사항/조치현황/사진대지.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/06-finding-action-photo-ledger/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/06-finding-action-photo-ledger/04_PATCH_FROM_AUDIT.md`

Patch Feature 06: 지적사항/조치현황/사진대지 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: InspectionRound + Document section.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/06-finding-action-photo-ledger/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/06-finding-action-photo-ledger/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 지적사항/조치현황/사진대지.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/06-finding-action-photo-ledger/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- InspectionRound + Document section
- Inspection Round Detail > Findings/Photo Ledger tabs; Document > photo_ledger section

Primary routes:
- /inspections/[inspectionRoundId]/findings
- /inspections/[inspectionRoundId]/photo-ledger
- /documents/safety-reports/[documentId]/sections/photo_ledger

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/07-safety-cost-usage/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 07 — 산업안전보건관리비 사용내용 확인
- featureId: safety_cost.usage
- implementation folder: docs/aec-erp/07-safety-cost-usage
- actual parent/container: InspectionRound + OwnerParty + Document section

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/07-safety-cost-usage/README.md if it exists
- docs/aec-erp/07-safety-cost-usage/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/07-safety-cost-usage/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/07-safety-cost-usage/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/07-safety-cost-usage/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/07-safety-cost-usage/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/07-safety-cost-usage/01_IMPLEMENT_FEATURE.md`

Implement Feature 07: 산업안전보건관리비 사용내용 확인 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/07-safety-cost-usage/README.md if it exists
- docs/aec-erp/07-safety-cost-usage/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/07-safety-cost-usage/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/07-safety-cost-usage/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/07-safety-cost-usage/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/07-safety-cost-usage/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: InspectionRound + OwnerParty + Document section
- Primary UI location: Inspection Round Detail > Safety Cost tab; Document > safety_cost_usage section

Primary routes:
- /projects/[projectId]/safety-costs
- /inspections/[inspectionRoundId]/safety-costs
- /documents/safety-reports/[documentId]/sections/safety_cost_usage

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/07-safety-cost-usage/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 07: 산업안전보건관리비 사용내용 확인.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/07-safety-cost-usage/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/07-safety-cost-usage/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: InspectionRound + OwnerParty + Document section.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/07-safety-cost-usage/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 07: 산업안전보건관리비 사용내용 확인.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/07-safety-cost-usage/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/07-safety-cost-usage/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/07-safety-cost-usage/04_PATCH_FROM_AUDIT.md`

Patch Feature 07: 산업안전보건관리비 사용내용 확인 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: InspectionRound + OwnerParty + Document section.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/07-safety-cost-usage/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/07-safety-cost-usage/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/07-safety-cost-usage/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 산업안전보건관리비 사용내용 확인.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/07-safety-cost-usage/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- InspectionRound + OwnerParty + Document section
- Inspection Round Detail > Safety Cost tab; Document > safety_cost_usage section

Primary routes:
- /projects/[projectId]/safety-costs
- /inspections/[inspectionRoundId]/safety-costs
- /documents/safety-reports/[documentId]/sections/safety_cost_usage

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/08-safety-management-plan/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 08 — 안전관리계획서 자동화
- featureId: document.safety_management_plan
- implementation folder: docs/aec-erp/08-safety-management-plan
- actual parent/container: Project Document

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/08-safety-management-plan/README.md if it exists
- docs/aec-erp/08-safety-management-plan/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/08-safety-management-plan/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/08-safety-management-plan/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/08-safety-management-plan/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/08-safety-management-plan/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/08-safety-management-plan/01_IMPLEMENT_FEATURE.md`

Implement Feature 08: 안전관리계획서 자동화 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/08-safety-management-plan/README.md if it exists
- docs/aec-erp/08-safety-management-plan/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/08-safety-management-plan/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/08-safety-management-plan/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/08-safety-management-plan/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/08-safety-management-plan/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: Project Document
- Primary UI location: Project Detail > Documents > Safety Management Plan

Primary routes:
- /projects/[projectId]/documents/safety-management-plans
- /documents/safety-management-plans/[documentId]

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/08-safety-management-plan/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 08: 안전관리계획서 자동화.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/08-safety-management-plan/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/08-safety-management-plan/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: Project Document.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/08-safety-management-plan/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 08: 안전관리계획서 자동화.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/08-safety-management-plan/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/08-safety-management-plan/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/08-safety-management-plan/04_PATCH_FROM_AUDIT.md`

Patch Feature 08: 안전관리계획서 자동화 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Project Document.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/08-safety-management-plan/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/08-safety-management-plan/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/08-safety-management-plan/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 안전관리계획서 자동화.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/08-safety-management-plan/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- Project Document
- Project Detail > Documents > Safety Management Plan

Primary routes:
- /projects/[projectId]/documents/safety-management-plans
- /documents/safety-management-plans/[documentId]

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/09-safety-health-ledger/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 09 — 안전보건대장 자동화
- featureId: document.safety_health_ledger
- implementation folder: docs/aec-erp/09-safety-health-ledger
- actual parent/container: Project Document / Project ledger

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/09-safety-health-ledger/README.md if it exists
- docs/aec-erp/09-safety-health-ledger/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/09-safety-health-ledger/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/09-safety-health-ledger/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/09-safety-health-ledger/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/09-safety-health-ledger/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/09-safety-health-ledger/01_IMPLEMENT_FEATURE.md`

Implement Feature 09: 안전보건대장 자동화 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/09-safety-health-ledger/README.md if it exists
- docs/aec-erp/09-safety-health-ledger/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/09-safety-health-ledger/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/09-safety-health-ledger/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/09-safety-health-ledger/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/09-safety-health-ledger/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: Project Document / Project ledger
- Primary UI location: Project Detail > Documents > Safety Health Ledger

Primary routes:
- /projects/[projectId]/documents/safety-health-ledgers
- /documents/safety-health-ledgers/[documentId]

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/09-safety-health-ledger/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 09: 안전보건대장 자동화.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/09-safety-health-ledger/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/09-safety-health-ledger/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: Project Document / Project ledger.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/09-safety-health-ledger/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 09: 안전보건대장 자동화.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/09-safety-health-ledger/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/09-safety-health-ledger/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/09-safety-health-ledger/04_PATCH_FROM_AUDIT.md`

Patch Feature 09: 안전보건대장 자동화 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Project Document / Project ledger.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/09-safety-health-ledger/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/09-safety-health-ledger/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/09-safety-health-ledger/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 안전보건대장 자동화.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/09-safety-health-ledger/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- Project Document / Project ledger
- Project Detail > Documents > Safety Health Ledger

Primary routes:
- /projects/[projectId]/documents/safety-health-ledgers
- /documents/safety-health-ledgers/[documentId]

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/10-webhard/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 10 — 웹하드
- featureId: webhard.files
- implementation folder: docs/aec-erp/10-webhard
- actual parent/container: Full-screen app + Project-linked file layer

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/10-webhard/README.md if it exists
- docs/aec-erp/10-webhard/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/10-webhard/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/10-webhard/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/10-webhard/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/10-webhard/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/10-webhard/01_IMPLEMENT_FEATURE.md`

Implement Feature 10: 웹하드 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/10-webhard/README.md if it exists
- docs/aec-erp/10-webhard/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/10-webhard/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/10-webhard/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/10-webhard/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/10-webhard/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: Full-screen app + Project-linked file layer
- Primary UI location: Webhard shell; Project Detail > Webhard tab

Primary routes:
- /webhard
- /webhard/projects/[projectId]
- /projects/[projectId]/webhard

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/10-webhard/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 10: 웹하드.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/10-webhard/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/10-webhard/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: Full-screen app + Project-linked file layer.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/10-webhard/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 10: 웹하드.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/10-webhard/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/10-webhard/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/10-webhard/04_PATCH_FROM_AUDIT.md`

Patch Feature 10: 웹하드 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Full-screen app + Project-linked file layer.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/10-webhard/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/10-webhard/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/10-webhard/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 웹하드.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/10-webhard/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- Full-screen app + Project-linked file layer
- Webhard shell; Project Detail > Webhard tab

Primary routes:
- /webhard
- /webhard/projects/[projectId]
- /projects/[projectId]/webhard

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/11-mailbox/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 11 — 메일함
- featureId: mailbox.messages
- implementation folder: docs/aec-erp/11-mailbox
- actual parent/container: Full-screen app + Project/Document/Submission linked communication layer

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/11-mailbox/README.md if it exists
- docs/aec-erp/11-mailbox/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/11-mailbox/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/11-mailbox/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/11-mailbox/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/11-mailbox/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/11-mailbox/01_IMPLEMENT_FEATURE.md`

Implement Feature 11: 메일함 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/11-mailbox/README.md if it exists
- docs/aec-erp/11-mailbox/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/11-mailbox/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/11-mailbox/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/11-mailbox/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/11-mailbox/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: Full-screen app + Project/Document/Submission linked communication layer
- Primary UI location: Mailbox 3-pane shell; Project Detail > Mail tab

Primary routes:
- /mail
- /mail/compose
- /projects/[projectId]/mail

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/11-mailbox/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 11: 메일함.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/11-mailbox/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/11-mailbox/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: Full-screen app + Project/Document/Submission linked communication layer.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/11-mailbox/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 11: 메일함.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/11-mailbox/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/11-mailbox/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/11-mailbox/04_PATCH_FROM_AUDIT.md`

Patch Feature 11: 메일함 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Full-screen app + Project/Document/Submission linked communication layer.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/11-mailbox/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/11-mailbox/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/11-mailbox/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 메일함.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/11-mailbox/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- Full-screen app + Project/Document/Submission linked communication layer
- Mailbox 3-pane shell; Project Detail > Mail tab

Primary routes:
- /mail
- /mail/compose
- /projects/[projectId]/mail

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/12-approval-signature-submission/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 12 — 결재/서명/제출
- featureId: approval.signature.submission
- implementation folder: docs/aec-erp/12-approval-signature-submission
- actual parent/container: DocumentInstance

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/12-approval-signature-submission/README.md if it exists
- docs/aec-erp/12-approval-signature-submission/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/12-approval-signature-submission/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/12-approval-signature-submission/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/12-approval-signature-submission/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/12-approval-signature-submission/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/12-approval-signature-submission/01_IMPLEMENT_FEATURE.md`

Implement Feature 12: 결재/서명/제출 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/12-approval-signature-submission/README.md if it exists
- docs/aec-erp/12-approval-signature-submission/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/12-approval-signature-submission/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/12-approval-signature-submission/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/12-approval-signature-submission/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/12-approval-signature-submission/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: DocumentInstance
- Primary UI location: Document Detail > Approval/Signature/Submission; global inbox as queue only

Primary routes:
- /documents/[documentId]/approval
- /documents/[documentId]/signature
- /documents/[documentId]/submission
- /approvals

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/12-approval-signature-submission/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 12: 결재/서명/제출.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/12-approval-signature-submission/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/12-approval-signature-submission/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: DocumentInstance.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/12-approval-signature-submission/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 12: 결재/서명/제출.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/12-approval-signature-submission/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/12-approval-signature-submission/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/12-approval-signature-submission/04_PATCH_FROM_AUDIT.md`

Patch Feature 12: 결재/서명/제출 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: DocumentInstance.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/12-approval-signature-submission/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/12-approval-signature-submission/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/12-approval-signature-submission/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 결재/서명/제출.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/12-approval-signature-submission/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- DocumentInstance
- Document Detail > Approval/Signature/Submission; global inbox as queue only

Primary routes:
- /documents/[documentId]/approval
- /documents/[documentId]/signature
- /documents/[documentId]/submission
- /approvals

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/13-admin-template-prompt/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 13 — 관리자/템플릿/프롬프트
- featureId: admin.template.prompt
- implementation folder: docs/aec-erp/13-admin-template-prompt
- actual parent/container: Admin module

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/13-admin-template-prompt/README.md if it exists
- docs/aec-erp/13-admin-template-prompt/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/13-admin-template-prompt/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/13-admin-template-prompt/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/13-admin-template-prompt/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/13-admin-template-prompt/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/13-admin-template-prompt/01_IMPLEMENT_FEATURE.md`

Implement Feature 13: 관리자/템플릿/프롬프트 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/13-admin-template-prompt/README.md if it exists
- docs/aec-erp/13-admin-template-prompt/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/13-admin-template-prompt/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/13-admin-template-prompt/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/13-admin-template-prompt/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/13-admin-template-prompt/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: Admin module
- Primary UI location: Admin shell

Primary routes:
- /admin
- /admin/templates
- /admin/prompts
- /admin/checklists

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/13-admin-template-prompt/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 13: 관리자/템플릿/프롬프트.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/13-admin-template-prompt/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/13-admin-template-prompt/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: Admin module.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/13-admin-template-prompt/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 13: 관리자/템플릿/프롬프트.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/13-admin-template-prompt/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/13-admin-template-prompt/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/13-admin-template-prompt/04_PATCH_FROM_AUDIT.md`

Patch Feature 13: 관리자/템플릿/프롬프트 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Admin module.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/13-admin-template-prompt/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/13-admin-template-prompt/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/13-admin-template-prompt/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 관리자/템플릿/프롬프트.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/13-admin-template-prompt/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- Admin module
- Admin shell

Primary routes:
- /admin
- /admin/templates
- /admin/prompts
- /admin/checklists

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/14-dashboard-statistics/00_PLAN_ONLY.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Target feature:
- 14 — 대시보드/통계
- featureId: dashboard.statistics
- implementation folder: docs/aec-erp/14-dashboard-statistics
- actual parent/container: Global dashboard + Project health summaries

Read first:
- AGENTS.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/14-dashboard-statistics/README.md if it exists
- docs/aec-erp/14-dashboard-statistics/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/14-dashboard-statistics/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/14-dashboard-statistics/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/14-dashboard-statistics/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/14-dashboard-statistics/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Task:
1. Summarize the feature.
2. Identify required backend models.
3. Identify required APIs.
4. Identify required frontend routes/components.
5. Identify actual parent-child placement.
6. Identify tests.
7. Identify risks.
8. Return an implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/14-dashboard-statistics/01_IMPLEMENT_FEATURE.md`

Implement Feature 14: 대시보드/통계 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/14-dashboard-statistics/README.md if it exists
- docs/aec-erp/14-dashboard-statistics/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/14-dashboard-statistics/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/14-dashboard-statistics/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/14-dashboard-statistics/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/14-dashboard-statistics/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: Global dashboard + Project health summaries
- Primary UI location: Dashboard shell

Primary routes:
- /dashboard
- /dashboard/projects
- /dashboard/documents
- /dashboard/findings

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/14-dashboard-statistics/02_DESIGN_PASS.md`

Improve the UI/UX for Feature 14: 대시보드/통계.

Read:
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/14-dashboard-statistics/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/14-dashboard-statistics/prompts/06_DESIGN_PROMPT.md if it exists

Focus only on UI/UX and interaction quality.

Rules:
- Preserve existing backend/API behavior.
- Preserve actual containment: Global dashboard + Project health summaries.
- Do not add unrelated future features.
- Keep dense Korean B2B ERP readability.
- Use status badges, missing-field panels, and A4/document previews where specified.

After changes:
- Run frontend type check.
- Report changed files.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/14-dashboard-statistics/03_REVERSE_AUDIT.md`

Act as a Reverse Mapping Auditor for Feature 14: 대시보드/통계.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/14-dashboard-statistics/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/14-dashboard-statistics/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/14-dashboard-statistics/04_PATCH_FROM_AUDIT.md`

Patch Feature 14: 대시보드/통계 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Global dashboard + Project health summaries.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/14-dashboard-statistics/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/14-dashboard-statistics/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.


---

## FILE: `codex-runbook/FEATURE_PROMPTS/14-dashboard-statistics/05_VALIDATE_PARENT_CHILD_PLACEMENT.md`

Validate parent-child placement before implementing 대시보드/통계.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/14-dashboard-statistics/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- Global dashboard + Project health summaries
- Dashboard shell

Primary routes:
- /dashboard
- /dashboard/projects
- /dashboard/documents
- /dashboard/findings

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.


---

## FILE: `codex-runbook/ROOT_PROMPTS/00_READ_AND_PLAN.md`

You are working on A&C 기술사 ERP.

Do not write code yet.

Read:
- AGENTS.md
- CODEX_START_HERE.md
- docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md
- docs/aec-erp/00-overall/01_FUNCTION_INDEX.md
- docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md
- docs/aec-erp/00-overall/04_DOCUMENT_PACK_RULE.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/_json/features.json
- docs/aec-erp/_json/implementation_sequence.json

Task:
1. Summarize the product architecture.
2. Explain actual containment: Project → InspectionRound → DocumentInstance.
3. Identify MVP implementation order.
4. Identify shared data models.
5. Identify implementation risks.
6. Return a phased implementation plan only.

Do not modify files yet.


---

## FILE: `codex-runbook/ROOT_PROMPTS/01_BOOTSTRAP_SKELETON.md`

You are implementing only the initial technical skeleton for A&C 기술사 ERP.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/_json/features.json
- docs/aec-erp/_json/containment_map.json

Implement:
1. Monorepo skeleton.
2. Next.js App Router frontend skeleton.
3. FastAPI backend skeleton.
4. Shared API client.
5. InMemory repository base.
6. Health check endpoint.
7. Basic ERP shell layout.
8. Placeholder navigation for all modules.
9. No full business module yet.

Rules:
- Do not implement all features.
- Use feature folders as implementation units, not standalone apps.
- Preserve Project → InspectionRound → DocumentInstance containment.
- Add basic tests for health check and app boot.

After coding:
- Run tests.
- Report changed files.
- Report what remains for Feature 01.


---

## FILE: `codex-runbook/ROOT_PROMPTS/02_BOOTSTRAP_REVERSE_AUDIT.md`

Act as a bootstrap QA and reverse mapping auditor.

Read:
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json

Review the current skeleton implementation.

Check:
1. Does the repository have frontend/backend skeletons?
2. Is AGENTS.md respected?
3. Does navigation show all modules without implementing them as detached apps?
4. Are Project-contained modules represented as project tabs or placeholders?
5. Are Webhard and Mailbox full-screen shells but still project-linkable?
6. Are tests present?

Return PASS/FAIL and a patch plan.
Do not modify files yet.


---

## FILE: `codex-runbook/ROOT_PROMPTS/03_VALIDATE_CONTAINMENT_BEFORE_IMPLEMENTATION.md`

Before implementing any feature, validate containment.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json

Task:
1. Confirm that feature folders are implementation units, not detached apps.
2. Identify each feature's actual parent container.
3. Identify primary routes and allowed global queue routes.
4. Identify data models that must include projectId, inspectionRoundId, ownerPartyId, or documentId.
5. Return any route/model design that would violate containment.

Do not modify files.


---

## FILE: `codex-runbook/ROOT_PROMPTS/04_SERVICE_AI_PROMPTS_SEED_LATER.md`

This prompt is for a later phase, after Feature 13 admin/template/prompt exists.

Task:
Implement PromptTemplate seed loading.

Read all files matching:
- docs/aec-erp/*/prompts/03_SERVICE_AI_PROMPT.md

Implement:
1. PromptTemplate model.
2. PromptVersion model.
3. Seed service AI prompts from docs.
4. Prompt list API.
5. Prompt detail API.
6. Mock provider for execution.

Rules:
- Do not call a real LLM yet.
- Service AI prompts are application runtime prompts, not Codex implementation instructions.


---

## FILE: `docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md`

# 00. Master Markdown — A&C 기술사 ERP

## 1. 서비스 정의

A&C 기술사 ERP는 건설안전기술사 사무소가 수행하는 프로젝트 관리, 계약 관리, 현장점검, 문서 자동화, 웹하드, 메일 제출, 결재/서명/제출 이력, 대시보드/통계을 하나의 시스템에서 처리하는 **문서 중심 ERP**이다.

이 서비스는 기존 기술지도보고서 SaaS를 그대로 복제하는 것이 아니라, A&C기술사사무소의 실제 업무 문서와 제출 흐름을 기준으로 설계한다.

## 2. 기존 서비스에서 가져올 것

### app에서 가져올 ERP 골격

```text
- 사이드바 기반 ERP Shell
- 프로젝트/현장 관리
- 보고서 작성 흐름
- 보고서 목록
- 메일함 진입 구조
- 설정/관리자 구조
```

### apps에서 가져올 SaaS 기능

```text
- 웹하드 full-screen shell
- 폴더/파일/메모/링크 관리
- 공유 링크
- 파일 상세 우측 패널
- 메일함 3-pane shell
- OAuth 기반 메일 연결
- 첨부파일 저장
```

## 3. 새 ERP에서 바꿀 것

기존 기술지도보고서 중심 구조를 다음 문서 자동화 중심으로 전환한다.

```text
- 기술용역계약서
- 안전관리계획서
- 안전보건대장
- 공사안전보건대장 이행확인 보고서
- 공사안전보건대장 이행 확인 점검표
- 공사안전보건대장 이행여부 확인서
- 유해·위험방지계획에 따른 위험성 감소대책 이행확인
- 추가 유해·위험요인 점검리스트
- 산업안전보건관리비 사용 내용 확인
- 지적사항/조치현황 사진대지
- 발주처별 제출 메일
- 웹하드 최종본 보관
```

## 4. 핵심 운영 흐름

```text
프로젝트 등록
→ 발주처/시공사/관계자 등록
→ 계약/견적 생성
→ 점검회차 생성
→ 현장점검
→ 체크리스트 입력
→ 지적사항 등록
→ 조치현황 등록
→ 사진대지 생성
→ 산업안전보건관리비 확인
→ 보고서 자동 생성
→ 내부 검토
→ 기술사 확인
→ 발주처별 최종본 생성
→ 메일 제출
→ 웹하드 보관
→ 제출 이력 저장
```

## 5. 핵심 불변 조건

1. 모든 데이터는 `Project`를 중심으로 연결한다.
2. 발주처가 여러 개인 경우 문자열 배열이 아니라 `Organization + ProjectParty`로 분리한다.
3. 같은 점검회차라도 발주처별 `DocumentInstance`가 생성될 수 있어야 한다.
4. 문서 export는 반드시 최신 저장본을 기준으로 한다.
5. AI 초안은 최종본이 아니다.
6. 날짜, 금액, 기관명, 법령 문구는 AI가 임의 확정하지 않는다.
7. 사진은 점검회차, 지적사항, 조치현황과 연결된다.
8. 메일 제출은 `Document`, `FileAsset`, `Submission`과 연결된다.
9. 웹하드는 단순 파일 저장소가 아니라 프로젝트 산출물 보관소다.
10. Reverse Map 없이 기능을 구현하지 않는다.

## 6. 핵심 모듈

| 번호 | 모듈 | 설명 | 우선순위 |
|---:|---|---|---|
| 01 | 프로젝트/현장 원장 | 공사개요, 발주처, 시공사, 담당자, 공정율 관리 | P0 |
| 02 | 계약/견적 | 기술용역계약서, 금액, 지급조건, 날인본 관리 | P0 |
| 03 | 점검회차/일정 | 3개월 이내 1회 등 반복 점검 일정 관리 | P0 |
| 04 | 보고서 자동화 | 공사안전보건대장 이행확인 보고서 생성 | P0 |
| 05 | 체크리스트 | 공통/건축토목/건설기계 점검표 입력 | P0 |
| 06 | 지적/조치/사진대지 | 지적사항, 조치현황, 전후 사진 매칭 | P0 |
| 07 | 산업안전보건관리비 | 계상금액, 사용금액, 사용률, 적정성 의견 | P0 |
| 08 | 안전관리계획서 | 공종별 위험요인, 감소대책, 비상대응 | P1 |
| 09 | 안전보건대장 | 위험요인, 조치이력, 점검이력 누적 | P1 |
| 10 | 웹하드 | 프로젝트 파일, 최종본, 공유 링크 | P1 |
| 11 | 메일함 | 프로젝트 메일, 첨부 저장, 제출 메일 | P1 |
| 12 | 결재/제출 | 검토, 승인, 날인, 제출 이력 | P1 |
| 13 | 관리자 | 사용자, 권한, 템플릿, 프롬프트 | P1 |
| 14 | 대시보드 | 오늘 업무, 미조치, 제출 예정, 리스크 | P1 |

## 7. 샘플 프로젝트 기준 데이터

```text
프로젝트명: 리움미술관 승강기 교체공사
현장명: 리움미술관
현장주소: 서울시 용산구 한남동 이태원로 55길 60-16
발주처: 삼성문화재단, 삼성생명공익재단
시공사: 현대엘리베이터(주)
엔지니어링사: A&C기술사사무소
공사기간: 2025.10 ~ 2028.02
점검주기: 3개월 이내 1회
총 점검회차: 10회
보고서 제출: 발주처별 제출
```

## 8. 산출물 생성 원칙

각 기능은 다음 8개 파일로 정리한다.

```text
XX-feature-name/
├── README.md
├── markdown/
│   ├── 01_PRODUCT_MARKDOWN.md
│   ├── 02_TECH_MARKDOWN.md
│   ├── 05_DESIGN_MARKDOWN.md
│   └── 07_REVERSE_MAP.md
└── prompts/
    ├── 03_SERVICE_AI_PROMPT.md
    ├── 04_CODEX_IMPLEMENTATION_PROMPT.md
    ├── 06_DESIGN_PROMPT.md
    └── 08_REVERSE_PROMPT.md
```


---

## FILE: `docs/aec-erp/00-overall/01_FUNCTION_INDEX.md`

# Function Index

## 기능 문서 작성 규칙

각 기능은 아래 8개 파일로 구성한다.

```text
XX-feature-name/
├── README.md
├── markdown/
│   ├── 01_PRODUCT_MARKDOWN.md
│   ├── 02_TECH_MARKDOWN.md
│   ├── 05_DESIGN_MARKDOWN.md
│   └── 07_REVERSE_MAP.md
└── prompts/
    ├── 03_SERVICE_AI_PROMPT.md
    ├── 04_CODEX_IMPLEMENTATION_PROMPT.md
    ├── 06_DESIGN_PROMPT.md
    └── 08_REVERSE_PROMPT.md
```

## 기능별 진행 순서

| 번호 | 기능 | 우선순위 | 현재 포함 |
|---:|---|---|---|
| 01 | 프로젝트/현장 원장 관리 | P0 | 포함 |
| 02 | 계약/견적 관리 | P0 | 포함 |
| 03 | 점검회차/일정 관리 | P0 | 포함 |
| 04 | 공사안전보건대장 이행확인 보고서 자동화 | P0 | 포함 |
| 05 | 현장점검 체크리스트 | P0 | 포함 |
| 06 | 지적사항/조치현황/사진대지 | P0 | 포함 |
| 07 | 산업안전보건관리비 사용내용 확인 | P0 | 포함 |
| 08 | 안전관리계획서 자동화 | P1 | 포함 |
| 09 | 안전보건대장 자동화 | P1 | 포함 |
| 10 | 웹하드 | P0.5 | 포함 |
| 11 | 메일함 | P0.5 | 포함 |
| 12 | 결재/서명/제출 | P1 | 포함 |
| 13 | 관리자/템플릿/프롬프트 | P1 | 포함 |
| 14 | 대시보드/통계 | P1 | 포함 |

## 현재 누적 패키지 핵심 흐름

```text
Project
→ Contract
→ InspectionSchedule / InspectionRound
→ ChecklistSession / ChecklistResult
→ FindingCandidate / Finding
→ CorrectiveAction / EvidencePhoto
→ PhotoLedger
→ SafetyCostUsage
→ SafetyManagementPlan
→ SafetyHealthLedger
→ SafetyReport
→ FileAsset / Folder / ShareLink
→ MailAccount / MailThread / MailMessage
→ ApprovalWorkflow / SignatureTask
→ FinalDocumentPackage / Submission
→ DocumentTemplate / PromptTemplate / AdminAuditLog
→ DashboardSnapshot / StatisticsMetric / AlertRule
```


---

## FILE: `docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md`

# 02. Global Design System — A&C 기술사 ERP

## 1. 디자인 원칙

### 1. 문서 중심

A&C ERP는 일반 SaaS보다 문서 정확성이 중요하다. 화면은 문서 생성, 표 검토, 사진대지 확인, 발주처 제출에 최적화한다.

### 2. ERP 밀도

현장명, 발주처, 공사금액, 공정율, 점검일, 담당자, 문서 상태 등 실무 정보가 많기 때문에 정보 밀도는 높게 유지하되, 상태 구분은 명확해야 한다.

### 3. 현장 입력 친화

모바일 점검, 사진 촬영, 지적사항 등록은 빠르게 입력할 수 있어야 한다. 버튼은 크고, 상태는 즉시 저장되며, 사진 업로드는 최소 단계로 처리한다.

### 4. 제출 신뢰감

발주처 제출용 문서 시스템이므로 공공문서 느낌의 단정한 디자인을 유지한다. 최종본과 초안의 시각적 구분을 분명히 한다.

### 5. AI 보조 구분

AI가 작성한 초안, 사용자가 확정한 본문, 최종 export 문서를 명확히 구분한다.

### 6. 연결성 가시화

프로젝트, 계약, 점검, 문서, 파일, 메일, 제출 이력이 서로 어떻게 연결되는지 화면에서 보여준다.

## 2. 컬러 토큰

### Primary

| Token | Hex | Use |
|---|---|---|
| primary-900 | `#102A5C` | 사이드바, 주요 헤더 |
| primary-800 | `#173B7A` | 강조 헤더 |
| primary-700 | `#1F4E9E` | Primary button |
| primary-600 | `#2F66C2` | 링크, 활성 탭 |
| primary-500 | `#3B7DDD` | 보조 강조 |

### Neutral

| Token | Hex | Use |
|---|---|---|
| neutral-950 | `#111827` | 본문 제목 |
| neutral-900 | `#1F2937` | 본문 강한 텍스트 |
| neutral-700 | `#374151` | 일반 텍스트 |
| neutral-500 | `#6B7280` | 보조 텍스트 |
| neutral-300 | `#D1D5DB` | border |
| neutral-200 | `#E5E7EB` | divider |
| neutral-100 | `#F3F4F6` | workspace background |
| neutral-50 | `#F9FAFB` | card background |
| white | `#FFFFFF` | paper/card |

### Semantic

| Token | Hex | Use |
|---|---|---|
| success | `#15803D` | 완료, 양호, 제출완료 |
| warning | `#D97706` | 주의, 기한임박, 누락 권장 |
| danger | `#DC2626` | 불량, 지연, 필수 누락 |
| info | `#2563EB` | 정보, 진행중 |
| review | `#7C3AED` | 검토중, AI 초안 |
| submitted | `#0F766E` | 제출 완료 |

## 3. 타이포그래피

| Role | Size | Line | Weight | Use |
|---|---:|---:|---:|---|
| Page Title | 24 | 32 | 700 | 페이지 제목 |
| Section Title | 18 | 28 | 700 | 카드/섹션 제목 |
| Body | 14 | 22 | 400 | 일반 본문 |
| Table Body | 13 | 20 | 400 | ERP 테이블 |
| Caption | 12 | 18 | 400 | 보조 설명, 사진 캡션 |
| Badge | 12 | 16 | 600 | 상태 배지 |

권장 폰트:

```text
Korean UI: Pretendard 또는 Noto Sans KR
Document Preview: Noto Serif KR 또는 Batang 계열
Numeric/Table: Tabular number 지원 폰트
```

## 4. Shell 규칙

### ERP Shell

```text
좌측 사이드바: 260px
상단바: 프로젝트 전환 / 검색 / 알림 / 사용자
중앙: 업무 화면
우측: AI 제안 / 누락정보 / 활동 로그 패널
```

적용 화면:

```text
대시보드, 프로젝트, 계약, 점검, 문서, 결재, 관리자
```

### Webhard Full-screen Shell

```text
좌측 자료함/프로젝트 필터
폴더 트리
파일 리스트/그리드
우측 파일 상세/미리보기 패널
상단 command bar: 업로드, 새 폴더, 공유 링크, 보기 전환
```

### Mailbox 3-pane Shell

```text
좌측 메일함/계정/프로젝트 필터
중앙 메일 목록
우측 메일 본문 또는 작성 패널
첨부파일 웹하드 저장 패널
프로젝트/문서/제출 연결 패널
```

## 5. 공통 컴포넌트

```text
AppShell
Sidebar
Topbar
ProjectSwitcher
GlobalSearch
PageHeader
Breadcrumb
DataTable
FilterBar
StatusBadge
ProgressBar
AmountCard
ContactCard
Timeline
MissingFieldPanel
ActivityLogPanel
DocumentPreview
A4Preview
FileAttachmentPanel
MailLinkPanel
ApprovalStepper
```

## 6. 상태 표시 규칙

### 문서 상태

| 상태 | Label | Color |
|---|---|---|
| draft | 초안 | neutral |
| ai_draft | AI 초안 | review |
| editing | 수정중 | info |
| review | 검토중 | review |
| confirmed | 확정 | primary |
| exported | 최종본 생성 | submitted |
| submitted | 제출완료 | success |
| archived | 보관 | neutral |

### 점검 결과

| 상태 | Label | Color |
|---|---|---|
| good | 양호 | success |
| caution | 주의 | warning |
| bad | 불량 | danger |
| not_applicable | 해당없음 | neutral |
| not_checked | 미점검 | neutral outline |

### 지적사항 상태

| 상태 | Label | Color |
|---|---|---|
| open | 미조치 | danger |
| action_requested | 조치요청 | warning |
| action_submitted | 조치등록 | info |
| verification_requested | 확인요청 | review |
| verified | 확인완료 | success |
| closed | 종결 | submitted |
| rejected | 반려 | danger |

## 7. A4 문서 미리보기 규칙

- 흰색 A4 paper를 회색 workspace 위에 표시한다.
- 초안은 watermark를 표시한다.
- 표가 페이지를 넘어가면 warning을 표시한다.
- 사진대지는 지적사진/조치사진 한 쌍을 명확히 보여준다.
- export 전 누락정보와 검토 경고를 우측 패널에 표시한다.


---

## FILE: `docs/aec-erp/00-overall/03_GLOBAL_REVERSE_PROMPT.md`

# 03. Global Reverse Prompt

## 목적

기능 명세를 입력받아 다음 항목을 역추적한다.

```text
기능
→ 화면
→ 컴포넌트
→ API
→ 데이터 모델
→ 서비스 AI 프롬프트
→ 구현 프롬프트
→ 디자인 프롬프트
→ 테스트
→ 리스크
```

## Reverse Mapping Agent Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

입력:
- 기능명
- 기능 설명
- 사용자
- 업무 흐름
- 화면 요구사항
- 데이터 요구사항
- AI 사용 여부
- 문서 출력 여부
- 파일/메일 연동 여부
- 발주처별 분기 여부
- 테스트 요구사항

해야 할 일:
1. 기능을 featureId로 정의한다.
2. 필요한 route를 정의한다.
3. 필요한 UI component를 나열한다.
4. 필요한 API endpoint를 정의한다.
5. 필요한 data model을 나열한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 codex implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 정의한다.
10. 구현 누락 가능성이 큰 위험을 warnings에 적는다.

출력 형식:
{
  "featureId": "",
  "featureName": "",
  "priority": "P0 | P1 | P2",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

규칙:
- 기능이 Project와 연결되면 반드시 projectId를 포함한다.
- 발주처 분기가 있으면 ownerPartyId 또는 projectPartyId를 포함한다.
- 문서 export가 있으면 save-before-export 테스트를 포함한다.
- 파일 연동이 있으면 FileAsset 모델을 포함한다.
- 메일 제출이 있으면 MailThread와 Submission 모델을 포함한다.
- AI가 작성한 내용은 draft 상태로만 저장한다.
- 법령, 금액, 날짜, 기관명은 AI가 임의 확정하지 않는다.
- 웹하드/메일함은 독립 기능이 아니라 프로젝트와 문서의 연결 레이어로 본다.
```

## Reverse Map 품질 체크리스트

- [ ] featureId가 고유한가?
- [ ] route가 실제 화면 작업 단위와 맞는가?
- [ ] 컴포넌트가 너무 추상적이지 않은가?
- [ ] API가 데이터 모델과 연결되는가?
- [ ] 발주처별 분기가 누락되지 않았는가?
- [ ] AI 프롬프트와 구현 프롬프트가 분리되어 있는가?
- [ ] 디자인 프롬프트가 기능별로 존재하는가?
- [ ] 테스트가 happy path만이 아니라 edge case를 포함하는가?
- [ ] 다음 기능과의 연결점이 명시되어 있는가?


---

## FILE: `docs/aec-erp/00-overall/04_DOCUMENT_PACK_RULE.md`

# 04. Document Pack Rule

## 1. 기본 원칙

이 프로젝트의 산출물은 기능별 문서팩으로 관리한다. 각 기능팩은 명세, 프롬프트, 디자인, 리버스맵을 함께 가진다.

## 2. 파일 번호 규칙

| 번호 | 파일 | 목적 |
|---:|---|---|
| 01 | PRODUCT_MARKDOWN | 제품/업무 명세 |
| 02 | TECH_MARKDOWN | 기술/API/모델 명세 |
| 03 | SERVICE_AI_PROMPT | 서비스 내부 AI 프롬프트 |
| 04 | CODEX_IMPLEMENTATION_PROMPT | 구현 에이전트 프롬프트 |
| 05 | DESIGN_MARKDOWN | 화면/UX/컴포넌트 명세 |
| 06 | DESIGN_PROMPT | 디자인 생성 프롬프트 |
| 07 | REVERSE_MAP | 기능 역추적 지도 |
| 08 | REVERSE_PROMPT | Reverse Map 생성/검증 프롬프트 |

## 3. ZIP 분리 규칙

### Markdown ZIP

포함:

```text
README.md
SOURCE_CHAT_SUMMARY.md
FILE_TREE.txt
MANIFEST.json
00-overall/*.md
XX-feature/README.md
XX-feature/markdown/*.md
```

### Prompt ZIP

포함:

```text
README.md
SOURCE_CHAT_SUMMARY.md
FILE_TREE.txt
MANIFEST.json
00-overall/03_GLOBAL_REVERSE_PROMPT.md
00-overall/02_GLOBAL_DESIGN_SYSTEM.md
XX-feature/README.md
XX-feature/prompts/*.md
```

### Full ZIP

포함:

```text
전체 파일
```

## 4. 내용 밀도 기준

각 기능의 `01_PRODUCT_MARKDOWN.md`에는 최소 다음 항목이 있어야 한다.

- 기능 정의
- 이 기능이 필요한 이유
- 주요 사용자
- 핵심 화면
- 사용자 흐름
- 핵심 데이터
- 상태
- 권한
- 완료 기준
- 다음 모듈 연결

각 기능의 `02_TECH_MARKDOWN.md`에는 최소 다음 항목이 있어야 한다.

- Frontend routes
- Components
- Backend APIs
- Data models
- Repository interfaces
- Validation rules
- Service rules
- API response example
- Tests

각 기능의 디자인 산출물에는 반드시 전체 디자인 시스템과 별개로 **기능별 디자인 마크다운 + 기능별 디자인 프롬프트**가 있어야 한다.


---

## FILE: `docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md`

# 05. Module Containment Map — A&C 기술사 ERP

## 1. 왜 이 문서가 필요한가

기능은 구현과 문서 관리를 위해 00~14로 분리되어 있지만, 실제 ERP 화면에서는 대부분의 기능이 `Project`, `InspectionRound`, `DocumentInstance` 안에 포함된다.

따라서 Codex가 각 기능을 독립 메뉴/독립 데이터로 구현하지 않도록 포함 관계를 명확히 한다.

## 2. 실제 ERP 포함 구조

```text
A&C ERP
├── Dashboard
├── Projects
│   └── Project Detail
│       ├── Overview
│       ├── Parties / Contacts
│       ├── Contract / Estimate
│       ├── Inspection Rounds
│       │   └── Inspection Round Detail
│       │       ├── Checklist
│       │       ├── Findings / Corrective Actions
│       │       ├── Photo Ledger
│       │       ├── Safety Cost Usage
│       │       └── Owner Report Tasks
│       ├── Documents / Reports
│       │   └── Document Detail
│       │       ├── Sections
│       │       ├── Variables
│       │       ├── Findings / Actions Section
│       │       ├── Photo Ledger Section
│       │       ├── Approval / Signature
│       │       └── Submission
│       ├── Webhard
│       ├── Mail Threads
│       └── Activity / History
├── Webhard Full-screen App
├── Mailbox 3-pane App
├── Admin
└── Global Dashboard / Statistics
```

## 3. 기능 번호와 실제 포함 위치

| 기능 번호 | 기능명 | 실제 포함 위치 | 전역 바로가기 가능 여부 | 핵심 부모 키 |
|---:|---|---|---|---|
| 00 | 전체 골격 | 루트 / 공통 | 예 | 없음 |
| 01 | 프로젝트/현장 원장 | Project Detail 루트 | 예 | projectId |
| 02 | 계약/견적 | Project Detail > 계약/견적 | 예, 계약 전체 목록 | projectId, contractId |
| 03 | 점검회차/일정 | Project Detail > 점검회차 | 예, 캘린더 | projectId, inspectionRoundId |
| 04 | 이행확인 보고서 | Project > Documents, InspectionRound > OwnerReportTask | 예, 문서함 | projectId, inspectionRoundId, ownerPartyId, documentId |
| 05 | 현장점검 체크리스트 | InspectionRound Detail > Checklist | 아니오 또는 점검 바로가기 | projectId, inspectionRoundId, sessionId |
| 06 | 지적/조치/사진대지 | InspectionRound Detail 및 Document Detail 내부 | 예, 미조치 목록 | projectId, inspectionRoundId, findingId, photoLedgerId |
| 07 | 산업안전보건관리비 | InspectionRound/OwnerReport/Document Section 내부 | 예, 비용 현황 | projectId, ownerPartyId, inspectionRoundId |
| 08 | 안전관리계획서 | Project > Documents | 예, 문서함 | projectId, documentId |
| 09 | 안전보건대장 | Project > Documents / Ledger | 예, 문서함 | projectId, ledgerId |
| 10 | 웹하드 | Project Detail > Webhard + Full-screen Webhard | 예 | projectId, folderId, fileId |
| 11 | 메일함 | Project Detail > Mail + Full-screen Mailbox | 예 | projectId, mailThreadId |
| 12 | 결재/서명/제출 | Document Detail 내부 + 제출 현황 | 예, 결재함 | documentId, approvalWorkflowId, submissionId |
| 13 | 관리자/템플릿/프롬프트 | Admin | 예 | templateId, promptId |
| 14 | 대시보드/통계 | Global Dashboard + Project Dashboard | 예 | projectId optional |

## 4. 핵심 containment rules

### 4.1 계약/견적은 프로젝트 안에 포함된다

맞다. 계약/견적 관리는 프로젝트 밖의 독립 기능이 아니라 프로젝트 상세 안의 탭/섹션이어야 한다.

기본 route:

```text
/projects/[projectId]/contracts
/projects/[projectId]/contracts/new
/contracts/[contractId]
```

`/contracts` 같은 전역 route는 전체 계약 목록, 검색, 미수금, 날인본 누락 같은 업무 큐 용도로만 사용한다.

### 4.2 지적사항/조치사항/사진대지는 보고서 안에도 포함된다

맞다. 기능 06은 독립 기능으로 분리했지만 실제로는 다음 위치에 모두 나타난다.

```text
/inspections/[inspectionRoundId]/findings
/inspections/[inspectionRoundId]/photo-ledger
/documents/safety-reports/[documentId]/sections/photo_ledger
/documents/safety-reports/[documentId]/sections/implementation_confirmation
```

즉, 지적/조치/사진대지는 원본 업무 모듈이면서 동시에 보고서 섹션이다.

### 4.3 결재/서명/제출은 문서 내부에 포함된다

맞다. 기능 12는 독립 메뉴처럼 보일 수 있지만 실제 부모는 `DocumentInstance`다.

기본 route:

```text
/documents/[documentId]/approval
/documents/[documentId]/submission
```

전역 `/approvals`는 결재함, `/submissions`는 제출 현황 큐다.

### 4.4 웹하드와 메일함은 앱이지만 Project linkage를 잃으면 안 된다

웹하드와 메일함은 full-screen app으로 분리될 수 있지만 모든 파일/메일은 가능한 한 projectId, documentId, findingId, submissionId와 연결되어야 한다.

## 5. 데이터 소유권 구조

```text
Project
├── Contract
├── Estimate
├── InspectionSchedule
├── InspectionRound
│   ├── ChecklistSession
│   ├── ChecklistResult
│   ├── Finding
│   │   ├── CorrectiveAction
│   │   └── EvidencePhoto
│   ├── PhotoLedger
│   ├── SafetyCostUsage
│   └── OwnerReportTask
├── DocumentInstance
│   ├── SafetyReportSection
│   ├── ApprovalWorkflow
│   ├── SignatureTask
│   └── Submission
├── FileAsset
└── MailThread
```

## 6. Codex가 구현 전 반드시 확인할 질문

1. 이 기능의 parent entity는 무엇인가?
2. projectId가 필요한가?
3. inspectionRoundId가 필요한가?
4. ownerPartyId가 필요한가?
5. documentId가 필요한가?
6. 이 기능은 전역 메뉴인가, 프로젝트 내부 탭인가, 문서 내부 섹션인가?
7. top-level route가 있다면 project linkage를 보존하는가?
8. 관련 파일/메일/제출/감사로그 연결이 필요한가?

## 7. 결론

기능은 분리되어 있지만, 실제 ERP에서는 다음 원칙이 맞다.

```text
계약/견적은 프로젝트 안에 포함된다.
점검/체크리스트/지적/사진대지는 점검회차 안에 포함된다.
지적/조치/사진대지는 보고서 섹션에도 포함된다.
결재/서명/제출은 문서 안에 포함된다.
웹하드/메일함은 전역 앱이지만 프로젝트와 문서에 연결된다.
```


---

## FILE: `docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md`

# 10. Global Reverse Map — 00~14 누적

## 목적

A&C ERP의 모든 기능을 화면, 컴포넌트, API, 데이터 모델, 프롬프트, 테스트까지 역추적한다.

## Global Map

| Feature ID | 기능 | 대표 Route | 핵심 모델 | 핵심 프롬프트 |
|---|---|---|---|---|
| project.field.registry | 프로젝트/현장 원장 | `/projects/[projectId]` | Project, Organization, ProjectParty, Contact | project-info-extraction |
| contract.estimate.management | 계약/견적 관리 | `/projects/[projectId]/contracts` | Contract, ContractParty, PaymentTerm | contract-draft-generation |
| inspection.schedule.management | 점검회차/일정 | `/projects/[projectId]/inspections` | InspectionSchedule, InspectionRound, InspectionOwnerReportTask | inspection-schedule-generation |
| document.safety_health_ledger_report | 이행확인 보고서 | `/documents/safety-reports/[documentId]` | DocumentInstance, SafetyReportSnapshot | safety-report-generation |
| inspection.checklist.management | 현장점검 체크리스트 | `/inspections/[inspectionRoundId]/checklist` | ChecklistSession, ChecklistResult, FindingCandidate | checklist-summary-and-finding-candidate |
| finding.action.photo_ledger | 지적/조치/사진대지 | `/inspections/[inspectionRoundId]/photo-ledger` | Finding, CorrectiveAction, EvidencePhoto, PhotoLedger | finding-action-photo-ledger |
| safety_cost.usage_confirmation | 산업안전보건관리비 | `/inspections/[inspectionRoundId]/safety-costs` | SafetyCostUsage, SafetyCostEvidence, SafetyCostReview | safety-cost-usage-comment |
| safety_management_plan.automation | 안전관리계획서 자동화 | `/projects/[projectId]/safety-management-plans` | SafetyManagementPlan, SafetyManagementRiskItem, SafetyManagementPlanSection | safety-management-plan-generation |
| safety_health_ledger.automation | 안전보건대장 자동화 | `/projects/[projectId]/safety-health-ledgers` | SafetyHealthLedger, LedgerRiskItem, LedgerInspectionHistory | safety-health-ledger-generation |
| webhard.file_management | 웹하드 | `/webhard/projects/[projectId]` | Folder, FileAsset, FileVersion, ShareLink | webhard-file-classification |
| mailbox.project_communication | 메일함 | `/mail` | MailAccount, MailThread, MailMessage, MailAttachment | mail-draft-and-classification |
| approval.signature.submission | 결재/서명/제출 | `/documents/[documentId]/approval` | ApprovalWorkflow, ApprovalStep, SignatureTask, Submission | approval-submission-readiness |
| admin.template.prompt | 관리자/템플릿/프롬프트 | `/admin/templates` | DocumentTemplate, TemplateVersion, PromptTemplate, PromptVersion | template-variable-mapping-and-prompt-governance |
| dashboard.statistics | 대시보드/통계 | `/dashboard` | DashboardSnapshot, ProjectHealthMetric, StatisticsMetric, AlertRule | dashboard-insight-summary |

## 핵심 연결키

| 연결키 | 사용 위치 |
|---|---|
| projectId | 모든 모듈의 루트, 웹하드 프로젝트 폴더 기준 |
| ownerPartyId | 발주처별 계약, 보고서, 사진대지, 안전관리비, 파일 분기 |
| inspectionRoundId | 체크리스트, 지적사항, 사진대지, 안전관리비, 보고서, 회차별 폴더 기준 |
| documentId | 보고서, 사진대지, 안전관리비 sync-to-report, export 파일 연결 |
| planId | 안전관리계획서 섹션, 위험요인, 첨부, export 기준 |
| ledgerId | 안전보건대장 섹션, 위험요인, 점검이력, export 기준 |
| fileId | 웹하드, 사진, 증빙파일, 최종본, 메일첨부, 공유 링크 |
| folderId | 웹하드 폴더 트리, 업로드 위치, 자동 저장 위치 |
| mailMessageId | 메일 첨부파일 저장 및 제출 이력 연결 |
| approvalId | 문서 내부 검토, 기술사 승인, 반려 이력 연결 |
| signatureTaskId | 서명/날인 필요 항목, 서명본/날인본 파일 확인 연결 |
| submissionId | 제출본 파일, 제출 메일, 발주처 제출 이력 연결 |
| templateId | 문서 템플릿, 체크리스트 템플릿, 메일 템플릿 연결 |
| promptId | 서비스 AI 프롬프트, Codex 프롬프트, 디자인/Reverse Prompt 연결 |
| templateVersionId | 문서 생성 시점의 템플릿 버전 추적 |
| promptVersionId | AI 실행 시점의 프롬프트 버전 추적 |
| dashboardSnapshotId | 특정 시점의 KPI/위험/업무 요약 스냅샷 추적 |
| alertRuleId | 지연·미제출·미조치 등 업무 알림 규칙 추적 |

## 구현 불변 조건

- 발주처가 분기되는 기능은 반드시 `ownerPartyId`를 포함한다.
- 프로젝트 단위 누적 기능은 반드시 `projectId`를 기준으로 한다.
- 회차별 보고서는 `inspectionRoundId + ownerPartyId`, 안전보건대장은 `projectId` 기준임을 구분한다.
- 보고서와 대장 export는 최신 저장 snapshot을 기준으로 한다.
- AI 초안은 최종본이 아니며 사용자 확정이 필요하다.
- 사진, 증빙, 최종본 파일은 `FileAsset`으로 연결한다.
- 문서 export 파일은 웹하드 `FileAsset`으로 저장하고 `DocumentInstance`와 연결한다.
- 메일 첨부파일은 웹하드 저장 시 `MailMessage`, `MailAttachment`, `FileAsset`을 연결한다.
- 보고서 제출 메일은 `DocumentInstance`, `FileAsset`, `MailMessage`, `Submission`을 연결한다.
- 제출 전 문서는 `ApprovalWorkflow` 완료와 `SignatureTask` 완료 여부를 검증한다.
- 발주처별 제출은 `ownerPartyId + documentId + finalFileId` 조합으로 추적한다.
- 조치요청 메일은 `Finding`, `CorrectiveAction`, `MailThread`를 연결한다.
- 공유 링크는 만료/폐기/권한/접근 로그를 가진다.
- 기능 구현 전 해당 기능의 Reverse Map을 먼저 확인한다.

- 템플릿과 프롬프트는 publish 전 테스트케이스를 통과해야 한다.
- 문서/프롬프트/법령 문구 수정은 `AdminAuditLog`를 남긴다.
- 법령/고시 문구는 권한 있는 관리자만 수정할 수 있다.

- 대시보드는 원본 업무 데이터를 수정하지 않고 집계/요약/알림만 수행한다.
- 통계 수치는 원본 모델 기준의 계산식을 명시하고, 수동 입력값과 계산값이 다르면 경고한다.


---

## FILE: `docs/aec-erp/01-project-field/README.md`

# 01 — 프로젝트/현장 원장 관리

프로젝트/현장 원장 관리는 A&C 기술사 ERP의 첫 번째 기능이며, 모든 하위 모듈의 기준 데이터다.

이 기능에서 정확히 잡아야 하는 핵심 구조는 다음과 같다.

```text
Project
├── Organization
├── ProjectParty
└── Contact
```

## 왜 01번이 중요한가

계약서, 점검회차, 체크리스트, 공사안전보건대장 이행확인 보고서, 사진대지, 산업안전보건관리비, 웹하드, 메일 제출은 모두 프로젝트 원장 데이터를 반복해서 사용한다.

특히 A&C 문서 구조는 단순 프로젝트 1개가 아니라 다음 구조를 가진다.

```text
하나의 현장
→ 복수 발주처
→ 발주처별 공사금액/비율
→ 발주처별 보고서 제출
→ 같은 점검회차의 발주처별 DocumentInstance
```

따라서 발주처를 문자열로 저장하면 안 되고, 반드시 `Organization + ProjectParty`로 관리해야 한다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 핵심 연결

```text
Project
→ Contract
→ InspectionRound
→ ChecklistSession
→ Finding
→ PhotoLedger
→ SafetyReport
→ FileAsset
→ MailThread
→ Submission
```


---

## FILE: `docs/aec-erp/01-project-field/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 프로젝트/현장 원장 관리

## 1. 기능 정의

프로젝트/현장 원장 관리는 A&C 기술사 ERP의 기준 데이터 기능이다.

이 기능은 계약서, 총괄현황, 점검표, 이행여부 확인서, 산업안전보건관리비 확인, 사진대지, 제출 메일에 반복 사용되는 공사개요 정보를 한 곳에서 관리한다.

단순히 프로젝트명을 등록하는 기능이 아니라, 다음 정보를 구조화한다.

```text
Project: 현장/공사 자체
Organization: 발주처, 시공사, 엔지니어링사, 협력사 등 조직
ProjectParty: 특정 프로젝트 안에서 조직이 맡는 역할
Contact: 조직과 프로젝트에 연결된 담당자
```

## 2. 이 기능이 필요한 이유

A&C 업무 문서에서는 같은 정보가 여러 문서에 반복된다.

```text
- 사업명
- 현장명
- 현장주소
- 발주자
- 시공사
- 엔지니어링사
- 공사금액
- 발주처별 금액
- 공사기간
- 실착공일
- 공정율
- 규모
- 담당자 연락처
- 점검주기
- 점검회차
- 발주처별 보고서 제출 여부
```

이 정보를 프로젝트 원장으로 관리하지 않으면 다음 문제가 생긴다.

| 문제 | 영향 |
|---|---|
| 공사개요 중복 입력 | 계약서/보고서마다 내용 불일치 |
| 발주처 문자열 저장 | 발주처별 보고서 분기 불가 |
| 시공사/발주처 담당자 분리 누락 | 메일, 제출, 조치 요청 연결 불가 |
| 공사금액 총액과 발주처별 금액 혼동 | 계약/안전관리비/보고서 오류 |
| 점검주기와 총 회차 누락 | 점검회차 자동 생성 불가 |
| 공정율 누락 | 보고서 공사개요 필드 누락 |

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 대표/기술사 | 프로젝트 전체 현황, 주요 발주처, 문서 제출 상태 검토 |
| 상무/점검 담당자 | 점검일, 공정율, 현장 연락처, 시공사 담당자 확인 |
| 문서 작성자 | 보고서 공사개요, 발주처별 문서 변수 자동 입력 |
| 계약/행정 담당자 | 계약서, 견적서, 발주처별 금액과 지급조건 관리 |
| 관리자 | 프로젝트 상태, 권한, 보관 정책, 템플릿 연결 관리 |

## 4. 핵심 화면

### 4.1 프로젝트 목록

프로젝트 전체를 조회하고 진행/문서/점검 상태를 빠르게 파악한다.

표시 항목:

```text
- 프로젝트명
- 현장주소
- 발주처
- 시공사
- 공사기간
- 공정율
- 상태
- 최근 점검일
- 다음 점검일
- 미제출 문서 수
- 미조치 지적사항 수
- 최근 메일/파일 활동
```

필터:

```text
- 프로젝트 상태
- 발주처
- 시공사
- 점검 담당자
- 문서 미제출 여부
- 미조치 지적사항 여부
- 공사기간
```

### 4.2 프로젝트 생성/수정

입력 섹션:

```text
1. 기본정보
2. 공사정보
3. 발주처
4. 시공사
5. 엔지니어링사 / A&C 담당자
6. 담당자 연락처
7. 점검 조건
8. 보고서 제출 조건
9. 웹하드/메일 연결 설정
```

### 4.3 프로젝트 상세

탭 구조:

```text
개요
관계자
계약/견적
점검회차
문서
사진/증빙
웹하드
메일
이력
```

상단 요약 카드:

```text
- 총 공사금액
- 발주처 수
- 발주처별 보고서 대상 수
- 총 점검회차
- 다음 점검일
- 미제출 보고서
- 미조치 지적사항
- 최근 파일/메일 활동
```

## 5. 사용자 흐름

### 5.1 직접 등록

```text
프로젝트 생성 클릭
→ 공사개요 입력
→ 발주처 추가
→ 시공사 추가
→ A&C 담당자 지정
→ 담당자 연락처 입력
→ 공사기간/실착공일 입력
→ 공사금액/발주처별 금액 입력
→ 점검주기/총 회차 입력
→ 발주처별 보고서 제출 여부 설정
→ 저장
→ 프로젝트 상세 진입
```

### 5.2 문서에서 정보 추출

```text
계약서 또는 총괄현황 업로드
→ AI 프로젝트 정보 추출
→ 추출 결과 확인
→ 누락정보 보완
→ 발주처/시공사/담당자 매핑
→ 사용자 승인
→ 프로젝트 원장 반영
```

### 5.3 다음 모듈로 이어지는 흐름

```text
Project 생성
→ ProjectParty 등록
→ Contract 생성
→ InspectionSchedule 생성
→ InspectionRound 생성
→ SafetyReport 생성
→ Webhard 폴더 생성
→ MailThread 연결
→ Submission 이력 생성
```

## 6. 핵심 데이터 필드

### Project

```text
projectName
siteName
siteAddress
constructionType
constructionDescription
totalAmount
startDate
endDate
actualStartDate
progressRate
inspectionCycleText
totalInspectionRounds
status
memo
```

### Organization

```text
name
type: owner | contractor | engineer | subcontractor | authority | other
businessNumber
representativeName
address
phone
email
```

### ProjectParty

```text
projectId
organizationId
role: owner | contractor | engineer | subcontractor | authority | other
shareRatio
shareAmount
requiresSeparateReport
reportRecipient
invoiceRecipient
displayOrder
note
```

### Contact

```text
projectId
organizationId
name
position
phone
email
roleDescription
isPrimary
receivesReport
receivesActionRequest
```

## 7. 상태

| 상태 | 의미 |
|---|---|
| planning | 등록/준비 |
| active | 진행중 |
| paused | 일시중지 |
| completed | 준공/완료 |
| archived | 보관 |

## 8. 권한

| 권한 | 가능 작업 |
|---|---|
| admin | 전체 생성/수정/삭제, 권한 관리 |
| principal_engineer | 프로젝트 조회, 최종 검토, 상태 변경 |
| engineer | 프로젝트 조회, 점검정보 수정, 연락처 관리 |
| writer | 프로젝트 조회, 문서 생성에 필요한 필드 수정 |
| contract_manager | 계약/발주처/금액 수정 |
| viewer | 조회만 가능 |

## 9. 필수 누락정보 기준

보고서 생성 전 필수:

```text
- 프로젝트명
- 현장주소
- 발주처
- 시공사
- 공사기간
- 점검회차
- 점검일
- 공정율
- 발주처별 보고서 필요 여부
```

계약서 생성 전 필수:

```text
- 발주처 조직 정보
- A&C 조직 정보
- 계약명
- 계약금액
- VAT 포함 여부
- 지급조건
```

메일 제출 전 권장:

```text
- 발주처 담당자 이메일
- 제출 문서명
- 최종본 파일
- 첨부파일 확인
```

## 10. 샘플 데이터 방향

리움미술관 승강기 교체공사는 다음처럼 저장한다.

```text
Project: 리움미술관 승강기 교체공사
Organization(owner): 삼성문화재단
Organization(owner): 삼성생명공익재단
Organization(contractor): 현대엘리베이터(주)
Organization(engineer): A&C기술사사무소
ProjectParty(owner): 삼성문화재단, requiresSeparateReport=true
ProjectParty(owner): 삼성생명공익재단, requiresSeparateReport=true
ProjectParty(contractor): 현대엘리베이터(주)
ProjectParty(engineer): A&C기술사사무소
```

## 11. 완료 기준

- 프로젝트를 생성/조회/수정할 수 있다.
- 발주처를 여러 개 등록할 수 있다.
- 발주처별 분담금액과 보고서 제출 여부를 설정할 수 있다.
- 시공사와 엔지니어링사를 등록할 수 있다.
- 담당자 연락처를 여러 명 등록할 수 있다.
- 공사기간, 실착공일, 공정율, 점검주기를 관리할 수 있다.
- 프로젝트 상세에서 관련 계약, 점검, 문서, 파일, 메일로 이동할 수 있다.
- 프로젝트 정보 변경 시 ActivityLog가 남는다.
- 문서 생성 전 누락정보를 확인할 수 있다.
- ProjectParty 기반으로 발주처별 보고서 분기를 지원한다.

## 12. 다음 모듈 연결

| 다음 모듈 | 연결 방식 |
|---|---|
| 계약/견적 | `projectId`, `ProjectParty`, `Contact` |
| 점검회차/일정 | `projectId`, `inspectionCycleText`, `totalInspectionRounds` |
| 보고서 자동화 | `projectId`, `ownerPartyId`, `ProjectParty.requiresSeparateReport` |
| 체크리스트 | `projectId`, `inspectionRoundId` |
| 지적/조치/사진대지 | `projectId`, `inspectionRoundId`, `ownerPartyId` |
| 산업안전보건관리비 | `projectId`, `ownerPartyId` |
| 웹하드 | `projectId`, 프로젝트 폴더 |
| 메일함 | `projectId`, 담당자 이메일 |
| 결재/제출 | `projectId`, `ownerPartyId`, `Submission` |


---

## FILE: `docs/aec-erp/01-project-field/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 프로젝트/현장 원장 관리

## 1. Frontend Routes

```text
/projects
/projects/new
/projects/[projectId]
/projects/[projectId]/overview
/projects/[projectId]/parties
/projects/[projectId]/contacts
/projects/[projectId]/requirements
/projects/[projectId]/related
/projects/[projectId]/history
/projects/[projectId]/settings
```

## 2. Frontend Components

```text
ProjectListPage
ProjectCreatePage
ProjectDetailPage
ProjectOverviewTab
ProjectPartyTab
ProjectContactTab
ProjectRequirementTab
ProjectRelatedTab
ProjectHistoryTab

ProjectTable
ProjectFilterBar
ProjectStatusBadge
ProjectSummaryCard
ProjectForm
ProjectRequiredFieldPanel
ProjectPartyTable
ProjectPartyForm
OwnerPartyCard
ContractorPartyCard
EngineerPartyCard
ContactTable
ContactForm
ContactCard
ConstructionAmountCard
InspectionSummaryCard
RelatedWorkTabs
ProjectActivityTimeline
ProjectImpactWarningPanel
```

## 3. Backend APIs

### Projects

```text
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/{projectId}
PATCH  /api/v1/projects/{projectId}
DELETE /api/v1/projects/{projectId}
GET    /api/v1/projects/{projectId}/summary
GET    /api/v1/projects/{projectId}/requirements
GET    /api/v1/projects/{projectId}/related-counts
GET    /api/v1/projects/{projectId}/history
```

### Organizations

```text
GET    /api/v1/organizations
POST   /api/v1/organizations
GET    /api/v1/organizations/{organizationId}
PATCH  /api/v1/organizations/{organizationId}
DELETE /api/v1/organizations/{organizationId}
```

### Project Parties

```text
GET    /api/v1/projects/{projectId}/parties
POST   /api/v1/projects/{projectId}/parties
PATCH  /api/v1/project-parties/{partyId}
DELETE /api/v1/project-parties/{partyId}
POST   /api/v1/projects/{projectId}/parties/reorder
POST   /api/v1/projects/{projectId}/parties/calculate-share
```

### Contacts

```text
GET    /api/v1/projects/{projectId}/contacts
POST   /api/v1/projects/{projectId}/contacts
PATCH  /api/v1/contacts/{contactId}
DELETE /api/v1/contacts/{contactId}
POST   /api/v1/projects/{projectId}/contacts/set-primary
```

### Extraction

```text
POST /api/v1/projects/extract-from-document
POST /api/v1/projects/{projectId}/apply-extracted-info
POST /api/v1/projects/{projectId}/validate-extracted-info
```

## 4. Data Models

### Project

```ts
type ProjectStatus =
  | 'planning'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived'

type Project = {
  id: string
  projectCode?: string
  projectName: string
  siteName: string
  siteAddress: string
  constructionType: string
  constructionDescription?: string
  totalAmount?: number
  startDate?: string
  endDate?: string
  actualStartDate?: string
  progressRate?: number
  inspectionCycleText?: string
  totalInspectionRounds?: number
  status: ProjectStatus
  memo?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
}
```

### Organization

```ts
type OrganizationType =
  | 'owner'
  | 'contractor'
  | 'engineer'
  | 'subcontractor'
  | 'authority'
  | 'other'

type Organization = {
  id: string
  name: string
  type: OrganizationType
  businessNumber?: string
  representativeName?: string
  address?: string
  phone?: string
  email?: string
  createdAt: string
  updatedAt: string
}
```

### ProjectParty

```ts
type ProjectPartyRole =
  | 'owner'
  | 'contractor'
  | 'engineer'
  | 'subcontractor'
  | 'authority'
  | 'other'

type ProjectParty = {
  id: string
  projectId: string
  organizationId: string
  role: ProjectPartyRole
  shareRatio?: number
  shareAmount?: number
  requiresSeparateReport: boolean
  reportRecipient: boolean
  invoiceRecipient: boolean
  displayOrder: number
  note?: string
  createdAt: string
  updatedAt: string
}
```

### Contact

```ts
type Contact = {
  id: string
  projectId: string
  organizationId: string
  name: string
  position?: string
  phone?: string
  email?: string
  roleDescription?: string
  isPrimary?: boolean
  receivesReport?: boolean
  receivesActionRequest?: boolean
  createdAt: string
  updatedAt: string
}
```

### ProjectRequirementStatus

```ts
type ProjectRequirementStatus = {
  projectId: string
  forSafetyReport: MissingField[]
  forContract: MissingField[]
  forInspectionSchedule: MissingField[]
  forSubmissionMail: MissingField[]
  warnings: RequirementWarning[]
}

type MissingField = {
  field: string
  label: string
  severity: 'required' | 'recommended' | 'optional'
  reason: string
  sourceEntity: 'Project' | 'ProjectParty' | 'Organization' | 'Contact'
}
```

### ProjectActivityLog

```ts
type ProjectActivityLog = {
  id: string
  projectId: string
  eventType:
    | 'created'
    | 'updated'
    | 'party_added'
    | 'party_updated'
    | 'contact_added'
    | 'requirement_changed'
    | 'document_created'
    | 'file_uploaded'
    | 'mail_linked'
    | 'archived'
  message: string
  actorId?: string
  diff?: Record<string, unknown>
  createdAt: string
}
```

## 5. Repository Interfaces

```ts
interface ProjectRepository {
  list(filter: ProjectListFilter): Promise<Project[]>
  getById(projectId: string): Promise<Project | null>
  create(input: ProjectCreateInput): Promise<Project>
  update(projectId: string, input: ProjectUpdateInput): Promise<Project>
  archive(projectId: string): Promise<Project>
}

interface OrganizationRepository {
  list(filter: OrganizationListFilter): Promise<Organization[]>
  getById(organizationId: string): Promise<Organization | null>
  findByName(name: string): Promise<Organization | null>
  create(input: OrganizationCreateInput): Promise<Organization>
  update(organizationId: string, input: OrganizationUpdateInput): Promise<Organization>
}

interface ProjectPartyRepository {
  listByProject(projectId: string): Promise<ProjectParty[]>
  getById(partyId: string): Promise<ProjectParty | null>
  create(input: ProjectPartyCreateInput): Promise<ProjectParty>
  update(partyId: string, input: ProjectPartyUpdateInput): Promise<ProjectParty>
  delete(partyId: string): Promise<void>
}

interface ContactRepository {
  listByProject(projectId: string): Promise<Contact[]>
  listByOrganization(organizationId: string): Promise<Contact[]>
  create(input: ContactCreateInput): Promise<Contact>
  update(contactId: string, input: ContactUpdateInput): Promise<Contact>
  delete(contactId: string): Promise<void>
}
```

## 6. Validation Rules

### Project

- `projectName`은 필수다.
- `siteAddress`는 보고서 생성 전 필수다.
- `startDate`가 `endDate`보다 늦을 수 없다.
- `progressRate`는 0 이상 100 이하만 허용한다.
- `totalAmount`는 0 이상이어야 한다.
- `totalInspectionRounds`는 0 이상 정수다.
- 관련 문서가 있으면 삭제가 아니라 archive를 사용한다.

### Organization

- `name`은 필수다.
- 같은 `name + type` 조합은 중복 등록 경고를 띄운다.
- 사업자등록번호는 optional이지만 계약서 생성 전 권장한다.

### ProjectParty

- 보고서 생성 전 owner 역할이 하나 이상 있어야 한다.
- 점검표/보고서 생성 전 contractor 역할이 하나 이상 권장된다.
- A&C 담당 문서에는 engineer 역할이 하나 이상 권장된다.
- `requiresSeparateReport = true`인 owner는 보고서 생성 시 분기 대상이다.
- `shareRatio` 합계가 100을 초과하면 warning을 표시한다.
- `shareAmount` 합계가 `Project.totalAmount`와 크게 다르면 warning을 표시한다.

### Contact

- `name`은 필수다.
- `phone` 또는 `email` 중 하나 이상을 권장한다.
- `receivesReport = true`이면 email을 권장한다.
- `receivesActionRequest = true`이면 email 또는 phone을 권장한다.

## 7. Service Rules

### 프로젝트 생성 후 자동 작업

```text
1. Project 생성
2. ProjectActivityLog 생성
3. 기본 웹하드 폴더 생성 이벤트 발행
4. 프로젝트 필수정보 상태 계산
5. 점검회차 생성 가능 여부 계산
6. 발주처별 보고서 생성 가능 여부 계산
```

### ProjectParty 추가 후 자동 작업

```text
1. Organization 존재 여부 확인
2. ProjectParty 생성
3. owner인 경우 reportRecipient 기본값 true
4. requiresSeparateReport가 true이면 보고서 분기 대상으로 표시
5. 관련 문서 생성 가능 여부 재계산
6. ProjectActivityLog 생성
```

### 프로젝트 수정 후 영향도 계산

다음 필드가 변경되면 하위 모듈에 영향을 준다.

| 변경 필드 | 영향 모듈 |
|---|---|
| projectName | 웹하드 표시명, 보고서 제목, 메일 제목 |
| siteAddress | 보고서 공사개요, 계약서 |
| totalAmount | 계약/견적, 안전관리비, 보고서 |
| startDate/endDate | 점검회차, 계약서, 보고서 |
| progressRate | 보고서 공사개요 |
| owner party | 발주처별 보고서, 제출 메일 |
| contact email | 메일 제출, 조치요청 |

## 8. API Response Example

```json
{
  "project": {
    "id": "project_leeum_elevator_2026",
    "projectName": "리움미술관 승강기 교체공사",
    "siteName": "리움미술관",
    "siteAddress": "서울시 용산구 한남동 이태원로 55길 60-16",
    "constructionType": "승강기 교체공사",
    "totalAmount": 9130000000,
    "startDate": "2025-10-01",
    "endDate": "2028-02-29",
    "actualStartDate": "2025-11-03",
    "progressRate": 3.9,
    "inspectionCycleText": "3개월 이내 1회",
    "totalInspectionRounds": 10,
    "status": "active"
  },
  "parties": [
    {
      "id": "party_samsung_culture",
      "role": "owner",
      "organizationName": "삼성문화재단",
      "requiresSeparateReport": true,
      "displayOrder": 1
    },
    {
      "id": "party_samsung_public",
      "role": "owner",
      "organizationName": "삼성생명공익재단",
      "requiresSeparateReport": true,
      "displayOrder": 2
    }
  ],
  "relatedCounts": {
    "contracts": 1,
    "inspectionRounds": 10,
    "documents": 2,
    "files": 0,
    "mailThreads": 0,
    "openFindings": 0
  }
}
```

## 9. Seed Data

```json
{
  "project": {
    "id": "project_leeum_elevator_2026",
    "projectName": "리움미술관 승강기 교체공사",
    "siteName": "리움미술관",
    "siteAddress": "서울시 용산구 한남동 이태원로 55길 60-16",
    "constructionType": "승강기 교체공사",
    "totalAmount": 9130000000,
    "startDate": "2025-10-01",
    "endDate": "2028-02-29",
    "actualStartDate": "2025-11-03",
    "progressRate": 3.9,
    "inspectionCycleText": "3개월 이내 1회",
    "totalInspectionRounds": 10,
    "status": "active"
  },
  "organizations": [
    { "name": "삼성문화재단", "type": "owner" },
    { "name": "삼성생명공익재단", "type": "owner" },
    { "name": "현대엘리베이터(주)", "type": "contractor" },
    { "name": "A&C기술사사무소", "type": "engineer" }
  ],
  "projectParties": [
    { "organizationName": "삼성문화재단", "role": "owner", "requiresSeparateReport": true, "displayOrder": 1 },
    { "organizationName": "삼성생명공익재단", "role": "owner", "requiresSeparateReport": true, "displayOrder": 2 },
    { "organizationName": "현대엘리베이터(주)", "role": "contractor", "requiresSeparateReport": false, "displayOrder": 3 },
    { "organizationName": "A&C기술사사무소", "role": "engineer", "requiresSeparateReport": false, "displayOrder": 4 }
  ]
}
```

## 10. Tests

```text
test_project_create_success
test_project_requires_project_name
test_project_update_success
test_project_progress_rate_range
test_project_date_range_validation
test_project_total_inspection_rounds_non_negative
test_project_soft_archive_when_related_documents_exist
test_organization_duplicate_warning
test_project_party_multiple_owners
test_project_party_owner_requires_separate_report
test_project_party_share_ratio_warning
test_project_party_share_amount_warning
test_contact_create_success
test_contact_report_recipient_requires_email_warning
test_project_requirements_for_safety_report
test_project_related_counts
test_project_activity_log_created_on_update
test_project_extraction_preview_does_not_apply_without_confirmation
test_project_apply_extracted_info_creates_parties_and_contacts
```


---

## FILE: `docs/aec-erp/01-project-field/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 프로젝트/현장 원장 관리

## 1. 화면 목표

프로젝트/현장 원장 화면은 A&C ERP의 기준 화면이다.

사용자는 이 화면에서 공사개요, 발주처, 시공사, 담당자, 공사금액, 공사기간, 공정율, 점검주기, 보고서 제출 조건을 확인하고 수정한다.

이 화면은 이후 계약, 점검, 보고서, 웹하드, 메일, 결재로 진입하는 허브 역할을 한다.

## 2. 화면 목록

### 2.1 프로젝트 목록

Route:

```text
/projects
```

주요 영역:

```text
- 좌측 ERP 사이드바
- 상단 Page Header
- 프로젝트 검색
- 상태 필터
- 발주처 필터
- 시공사 필터
- 점검 담당자 필터
- 프로젝트 테이블
- 우측 빠른 작업 패널
```

테이블 컬럼:

| 컬럼 | 설명 |
|---|---|
| 프로젝트명 | 프로젝트 상세 이동 |
| 현장주소 | 짧게 표시, hover 전체 |
| 발주처 | 복수 발주처 badge |
| 시공사 | 대표 시공사 |
| 공사기간 | 시작~종료 |
| 공정율 | progress bar + 숫자 |
| 다음 점검 | 예정일 또는 미정 |
| 미조치 | open finding 수 |
| 문서 | 초안/검토/제출 상태 요약 |
| 상태 | active 등 |

### 2.2 프로젝트 생성/수정

Route:

```text
/projects/new
/projects/[projectId]/settings
```

폼 섹션:

```text
1. 기본정보
2. 공사정보
3. 발주처
4. 시공사
5. 엔지니어링사
6. 담당자
7. 점검조건
8. 보고서 제출조건
9. 저장 전 검증
```

핵심 UX:

- 발주처를 여러 개 추가할 수 있어야 한다.
- 발주처별 보고서 제출 여부 toggle을 제공한다.
- 공사금액 총액과 발주처별 분담금액을 구분한다.
- 담당자는 소속 조직별 카드로 관리한다.

### 2.3 프로젝트 상세

Route:

```text
/projects/[projectId]
```

상단 요약:

```text
- 프로젝트명
- 현장주소
- 공사기간
- 공정율
- 상태
- 발주처 수
- 다음 점검일
- 미조치 지적사항 수
- 제출 예정 문서 수
```

탭:

```text
개요
관계자
계약/견적
점검회차
문서
사진/증빙
웹하드
메일
이력
```

### 2.4 관계자 탭

Route:

```text
/projects/[projectId]/parties
```

구성:

```text
- 발주처 카드 영역
- 시공사 카드 영역
- 엔지니어링사 카드 영역
- 담당자 연락처 테이블
- 발주처별 보고서 설정 패널
```

### 2.5 누락정보 탭

Route:

```text
/projects/[projectId]/requirements
```

표시 그룹:

```text
- 보고서 생성 전 필수정보
- 계약서 생성 전 필수정보
- 점검회차 생성 전 필수정보
- 메일 제출 전 필수정보
```

## 3. UX 규칙

1. 발주처가 여러 개인 경우 badge로 표시한다.
2. 발주처별 보고서 필요 여부는 눈에 잘 띄게 표시한다.
3. 공사금액은 총액과 발주처별 금액을 구분한다.
4. 공정율은 숫자와 progress bar를 함께 표시한다.
5. 누락된 필수 정보는 우측 Missing Field Panel에 표시한다.
6. 보고서 생성에 필요한 필드가 부족하면 경고한다.
7. 프로젝트 삭제는 관련 문서가 있으면 막거나 archive 처리한다.
8. 시공사/발주처 담당자는 연락처 카드로 표시한다.
9. 변경 시 하위 문서에 영향이 큰 필드는 impact warning을 표시한다.
10. AI 추출 결과는 사용자 승인 전에는 저장하지 않는다.

## 4. 컴포넌트 상세

### ProjectSummaryCard

표시 항목:

```text
- 현장주소
- 공사기간
- 실착공일
- 총 공사금액
- 공정율
- 점검주기
- 총 점검회차
- 다음 점검일
```

### OwnerPartyCard

표시 항목:

```text
- 발주처명
- 분담금액
- 분담비율
- 보고서 별도 제출 여부
- 보고서 수신 담당자
- 청구 수신 여부
```

### ContactCard

표시 항목:

```text
- 이름
- 직책
- 소속
- 전화번호
- 이메일
- 역할
- 보고서 수신 여부
- 조치요청 수신 여부
```

### MissingFieldPanel

문서 생성 전 필요한 누락정보를 표시한다.

예:

```text
- 현장주소 없음
- 발주처 담당자 이메일 없음
- 공사기간 종료일 없음
- 공정율 없음
- 발주처별 보고서 제출 여부 미설정
```

### ProjectImpactWarningPanel

프로젝트 정보 변경이 하위 모듈에 영향을 줄 때 표시한다.

예:

```text
공사금액이 변경되었습니다.
계약/견적, 산업안전보건관리비, 발주처별 보고서 금액에 영향을 줄 수 있습니다.
```

## 5. Empty State

프로젝트가 없을 때:

```text
등록된 프로젝트가 없습니다.
첫 프로젝트를 생성하거나 계약서/총괄현황 문서에서 프로젝트 정보를 추출하세요.
```

버튼:

```text
- 프로젝트 직접 생성
- 문서에서 정보 추출
```

## 6. Warning State

### 발주처 없음

```text
보고서 생성을 위해 최소 1개 이상의 발주처가 필요합니다.
```

### 발주처별 보고서 설정 없음

```text
발주처별 보고서 제출 여부가 설정되지 않았습니다.
동일 점검회차에서 발주처별 보고서가 필요한 경우 별도 제출을 활성화하세요.
```

### 담당자 이메일 없음

```text
보고서 제출 메일을 자동 작성하려면 발주처 담당자 이메일을 등록하세요.
```

## 7. Responsive

### Desktop

- 목록은 table 중심
- 상세는 2-column layout
- 우측 missing field/activity panel 사용
- 관계자/담당자는 카드 + 테이블 혼합

### Tablet

- summary card stack
- table horizontal scroll
- 관계자 카드는 2-column

### Mobile

- 프로젝트 카드 목록
- 주요 필드만 표시
- 연락처 전화 버튼 강조
- 현장점검 진입 버튼 강조


---

## FILE: `docs/aec-erp/01-project-field/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 프로젝트/현장 원장 관리

## 1. Feature

```yaml
featureId: project.field.registry
featureName: 프로젝트/현장 원장 관리
priority: P0
module: project-field
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 프로젝트 목록 | `/projects` | 전체 프로젝트 조회/검색/필터 |
| 프로젝트 생성 | `/projects/new` | 프로젝트 기본정보 등록 |
| 프로젝트 상세 | `/projects/[projectId]` | 프로젝트 요약 및 관련 업무 진입 |
| 개요 탭 | `/projects/[projectId]/overview` | 공사개요, 금액, 공정율 |
| 관계자 탭 | `/projects/[projectId]/parties` | 발주처, 시공사, 엔지니어링사 |
| 연락처 탭 | `/projects/[projectId]/contacts` | 담당자 연락처 |
| 누락정보 탭 | `/projects/[projectId]/requirements` | 문서/계약/점검/메일 필수정보 |
| 관련업무 탭 | `/projects/[projectId]/related` | 계약, 점검, 문서, 파일, 메일 카운트 |
| 이력 탭 | `/projects/[projectId]/history` | 변경 이력 |
| 설정 | `/projects/[projectId]/settings` | 보관, 권한, 알림, 폴더 정책 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/projects` | ProjectTable, ProjectFilterBar, ProjectStatusBadge |
| `/projects/new` | ProjectForm, ProjectPartyForm, ContactForm, ProjectRequiredFieldPanel |
| `/projects/[projectId]` | ProjectSummaryCard, RelatedWorkTabs, MissingFieldPanel |
| `/projects/[projectId]/overview` | ConstructionAmountCard, InspectionSummaryCard |
| `/projects/[projectId]/parties` | ProjectPartyTable, OwnerPartyCard, ContractorPartyCard, EngineerPartyCard |
| `/projects/[projectId]/contacts` | ContactTable, ContactCard, ContactForm |
| `/projects/[projectId]/requirements` | ProjectRequiredFieldPanel, ProjectImpactWarningPanel |
| `/projects/[projectId]/related` | RelatedWorkTabs, RelatedCountCards |
| `/projects/[projectId]/history` | ProjectActivityTimeline |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| ProjectTable | `GET /api/v1/projects` |
| ProjectForm | `POST /api/v1/projects`, `PATCH /api/v1/projects/{projectId}` |
| ProjectSummaryCard | `GET /api/v1/projects/{projectId}/summary` |
| ProjectPartyTable | `GET /api/v1/projects/{projectId}/parties` |
| ProjectPartyForm | `POST /api/v1/projects/{projectId}/parties` |
| OwnerPartyCard | `GET /api/v1/projects/{projectId}/parties` |
| ContactTable | `GET /api/v1/projects/{projectId}/contacts` |
| ContactForm | `POST /api/v1/projects/{projectId}/contacts` |
| ProjectRequiredFieldPanel | `GET /api/v1/projects/{projectId}/requirements` |
| RelatedWorkTabs | `GET /api/v1/projects/{projectId}/related-counts` |
| ProjectActivityTimeline | `GET /api/v1/projects/{projectId}/history` |
| ProjectExtractionPreview | `POST /api/v1/projects/extract-from-document` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| `GET /projects` | Project |
| `POST /projects` | Project, ProjectActivityLog |
| `GET /projects/{projectId}` | Project, ProjectParty, Contact |
| `GET /projects/{projectId}/summary` | Project, ProjectParty, RelatedCounts |
| `GET /projects/{projectId}/requirements` | ProjectRequirementStatus |
| `GET /projects/{projectId}/parties` | ProjectParty, Organization |
| `POST /projects/{projectId}/parties` | ProjectParty, Organization, ProjectActivityLog |
| `GET /projects/{projectId}/contacts` | Contact, Organization |
| `POST /projects/{projectId}/contacts` | Contact, ProjectActivityLog |
| `POST /projects/extract-from-document` | ProjectExtractionResult |
| `POST /projects/{projectId}/apply-extracted-info` | Project, Organization, ProjectParty, Contact |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| Project | `project-info-extraction` |
| Organization | `project-info-extraction` |
| ProjectParty | `project-info-extraction` |
| Contact | `project-info-extraction` |
| ProjectRequirementStatus | `project-info-extraction` |

## 7. 프롬프트 → 테스트

| 프롬프트 | 테스트 |
|---|---|
| `project-info-extraction` | `test_extract_project_from_contract` |
| `project-info-extraction` | `test_extract_multiple_owners` |
| `project-info-extraction` | `test_extract_contacts` |
| `project-info-extraction` | `test_missing_unknown_fields_are_null` |
| `project-info-extraction` | `test_extraction_preview_does_not_persist` |

## 8. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 프로젝트 생성 | `test_project_create_success` |
| 프로젝트명 필수 | `test_project_requires_project_name` |
| 프로젝트 수정 | `test_project_update_success` |
| 공정율 검증 | `test_project_progress_rate_range` |
| 날짜 범위 검증 | `test_project_date_range_validation` |
| 총 점검회차 검증 | `test_project_total_inspection_rounds_non_negative` |
| 삭제 제한 | `test_project_soft_archive_when_related_documents_exist` |
| 복수 발주처 | `test_project_party_multiple_owners` |
| 발주처별 보고서 | `test_project_party_owner_requires_separate_report` |
| 분담비율 경고 | `test_project_party_share_ratio_warning` |
| 분담금액 경고 | `test_project_party_share_amount_warning` |
| 담당자 등록 | `test_contact_create_success` |
| 보고서 수신 이메일 | `test_contact_report_recipient_requires_email_warning` |
| 누락정보 | `test_project_requirements_for_safety_report` |
| 관련 카운트 | `test_project_related_counts` |
| 변경 이력 | `test_project_activity_log_created_on_update` |
| 추출 preview | `test_project_extraction_preview_does_not_apply_without_confirmation` |
| 추출 반영 | `test_project_apply_extracted_info_creates_parties_and_contacts` |

## 9. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 계약/견적 | `projectId`, `ProjectParty`, `Contact` |
| 점검회차/일정 | `inspectionCycleText`, `totalInspectionRounds`, `startDate`, `endDate` |
| 보고서 자동화 | `projectId`, `ownerPartyId`, `requiresSeparateReport` |
| 체크리스트 | `projectId`, `inspectionRoundId` |
| 지적사항/조치현황 | `projectId`, `ownerPartyId` |
| 사진대지 | `projectId`, `inspectionRoundId`, `ownerPartyId` |
| 산업안전보건관리비 | `projectId`, `ownerPartyId` |
| 웹하드 | project folder event, `FileAsset.projectId` |
| 메일함 | `Contact.email`, `MailThread.projectId` |
| 결재/제출 | `Submission.projectId`, `ownerPartyId` |

## 10. 리스크

| 리스크 | 대응 |
|---|---|
| 발주처/시공사/엔지니어링사 구분 오류 | Organization type과 ProjectParty role을 분리 |
| 발주처별 보고서 분기 누락 | `requiresSeparateReport` 필드 필수 |
| 총 공사금액과 발주처별 금액 혼동 | `Project.totalAmount`와 `ProjectParty.shareAmount` 분리 |
| 문서 생성 필수값 누락 | `ProjectRequiredFieldPanel` 제공 |
| 프로젝트명 변경 시 웹하드 폴더명 불일치 | 폴더 displayName과 projectId 분리 |
| AI 추출 결과 오적용 | preview → 사용자 확인 → apply 단계 분리 |
| 하위 문서 생성 후 프로젝트 변경 | impact warning + ActivityLog |


---

## FILE: `docs/aec-erp/01-project-field/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 프로젝트 정보 추출

## Prompt ID

`project-info-extraction`

## 목적

계약서, 총괄현황, 보고서, 메일 본문, 첨부파일 설명에서 프로젝트/현장 원장 정보를 추출한다.

## Prompt

```text
너는 A&C기술사 ERP의 프로젝트 정보 추출 엔진이다.

입력 문서는 다음 중 하나일 수 있다.

- 기술용역계약서
- 공사개요 및 연락망
- 총괄현황
- 공사안전보건대장 이행확인 보고서
- 발주처 메일 본문
- 시공사 제출자료
- 사용자가 직접 붙여넣은 메모

목표:
프로젝트/현장 원장에 저장할 정보를 구조화한다.

반드시 추출할 항목:
1. 프로젝트명
2. 현장명
3. 현장주소
4. 공사유형
5. 공사내용
6. 공사금액 총액
7. 발주처 목록
8. 발주처별 금액 또는 비율
9. 시공사
10. 엔지니어링사
11. 공사기간
12. 실착공일
13. 공정율
14. 점검주기
15. 총 점검회차
16. 발주처별 보고서 제출 여부
17. 담당자 이름/직책/연락처/이메일

작성 규칙:
- 입력에 없는 값은 추정하지 말고 null로 둔다.
- 모호한 값은 confidence를 낮게 표시한다.
- 발주처가 여러 개인 경우 projectParties 배열로 분리한다.
- 발주처별 보고서 제출 문구가 있으면 requiresSeparateReport를 true로 둔다.
- 공사금액 총액과 발주처별 금액을 구분한다.
- 전화번호는 원문 표기를 유지한다.
- 날짜는 가능하면 YYYY-MM-DD로 정규화하고, 불가능하면 rawText를 함께 둔다.
- 공정율은 숫자로 변환하되 원문도 보존한다.
- 법령 문구는 프로젝트 설명에 넣지 않는다.
- 추출 결과는 바로 저장하지 않고 사용자 확인용 preview로 반환한다.

출력 JSON:
{
  "project": {
    "projectName": "",
    "siteName": "",
    "siteAddress": "",
    "constructionType": "",
    "constructionDescription": "",
    "totalAmount": null,
    "startDate": null,
    "endDate": null,
    "actualStartDate": null,
    "progressRate": null,
    "inspectionCycleText": "",
    "totalInspectionRounds": null,
    "status": "active"
  },
  "organizations": [
    {
      "name": "",
      "type": "owner | contractor | engineer | subcontractor | authority | other",
      "businessNumber": null,
      "representativeName": null,
      "address": null,
      "phone": null,
      "email": null
    }
  ],
  "projectParties": [
    {
      "organizationName": "",
      "role": "owner | contractor | engineer | subcontractor | authority | other",
      "shareRatio": null,
      "shareAmount": null,
      "requiresSeparateReport": false,
      "reportRecipient": false,
      "invoiceRecipient": false,
      "note": ""
    }
  ],
  "contacts": [
    {
      "organizationName": "",
      "name": "",
      "position": "",
      "phone": "",
      "email": null,
      "roleDescription": "",
      "receivesReport": false,
      "receivesActionRequest": false
    }
  ],
  "missingFields": [
    {
      "field": "",
      "label": "",
      "reason": ""
    }
  ],
  "warnings": [
    {
      "type": "",
      "message": ""
    }
  ],
  "confidence": 0.0
}
```

## Few-shot 기준

### 입력 예시

```text
리움미술관 승강기 교체공사
공사기간 2025.10 ~ 2028.02
공사금액 91.3억
발주사 1 삼성문화재단
발주사 2 삼성생명공익재단
시공사 현대엘리베이터(주)
엔지니어링사 A&C기술사사무소
공사안전보건대장 이행점검: 3개월 이내 1회
발주사별 보고서 제출
총 10회 이행점검
```

### 출력 방향

```text
Project는 1개
owner ProjectParty는 2개
contractor ProjectParty는 1개
engineer ProjectParty는 1개
삼성문화재단, 삼성생명공익재단은 requiresSeparateReport true
totalInspectionRounds는 10
inspectionCycleText는 원문 그대로 보존
```

## 금지사항

- 발주처를 단일 문자열로 합치지 않는다.
- 공사금액 총액과 발주처별 금액을 혼동하지 않는다.
- 누락된 담당자 이메일을 임의 생성하지 않는다.
- 보고서 제출 대상 여부를 근거 없이 true로 만들지 않는다.
- 추출 결과를 사용자 확인 없이 저장하지 않는다.


---

## FILE: `docs/aec-erp/01-project-field/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 프로젝트/현장 원장 관리

## Prompt

```text
You are implementing the Project and Field Registry module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. The Project module is the root data layer for contracts, inspections, documents, webhard files, mailbox messages, approvals, and submissions.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Project and Field Registry module.

Existing global concepts:
- User
- AuditLog
- FileAsset
- MailThread
- DocumentInstance

Required backend models:
- Project
- Organization
- ProjectParty
- Contact
- ProjectRequirementStatus
- ProjectActivityLog
- ProjectExtractionResult

Required backend APIs:

Projects:
- GET /api/v1/projects
- POST /api/v1/projects
- GET /api/v1/projects/{projectId}
- PATCH /api/v1/projects/{projectId}
- DELETE /api/v1/projects/{projectId}
- GET /api/v1/projects/{projectId}/summary
- GET /api/v1/projects/{projectId}/requirements
- GET /api/v1/projects/{projectId}/related-counts
- GET /api/v1/projects/{projectId}/history

Organizations:
- GET /api/v1/organizations
- POST /api/v1/organizations
- GET /api/v1/organizations/{organizationId}
- PATCH /api/v1/organizations/{organizationId}
- DELETE /api/v1/organizations/{organizationId}

Project Parties:
- GET /api/v1/projects/{projectId}/parties
- POST /api/v1/projects/{projectId}/parties
- PATCH /api/v1/project-parties/{partyId}
- DELETE /api/v1/project-parties/{partyId}
- POST /api/v1/projects/{projectId}/parties/reorder
- POST /api/v1/projects/{projectId}/parties/calculate-share

Contacts:
- GET /api/v1/projects/{projectId}/contacts
- POST /api/v1/projects/{projectId}/contacts
- PATCH /api/v1/contacts/{contactId}
- DELETE /api/v1/contacts/{contactId}
- POST /api/v1/projects/{projectId}/contacts/set-primary

Extraction:
- POST /api/v1/projects/extract-from-document
- POST /api/v1/projects/{projectId}/validate-extracted-info
- POST /api/v1/projects/{projectId}/apply-extracted-info

Required frontend routes:
- /projects
- /projects/new
- /projects/[projectId]
- /projects/[projectId]/overview
- /projects/[projectId]/parties
- /projects/[projectId]/contacts
- /projects/[projectId]/requirements
- /projects/[projectId]/related
- /projects/[projectId]/history
- /projects/[projectId]/settings

Required frontend components:
- ProjectTable
- ProjectFilterBar
- ProjectStatusBadge
- ProjectSummaryCard
- ProjectForm
- ProjectRequiredFieldPanel
- ProjectPartyTable
- ProjectPartyForm
- OwnerPartyCard
- ContractorPartyCard
- EngineerPartyCard
- ContactTable
- ContactForm
- ContactCard
- ConstructionAmountCard
- InspectionSummaryCard
- RelatedWorkTabs
- ProjectActivityTimeline
- ProjectImpactWarningPanel

Validation:
1. projectName is required.
2. progressRate must be between 0 and 100.
3. Project must support multiple owner parties.
4. owner parties may require separate reports.
5. totalInspectionRounds must be a non-negative integer.
6. startDate must not be later than endDate.
7. Project deletion should be soft-archive or blocked if related documents exist.
8. shareRatio sum over 100 must produce warning.
9. shareAmount sum mismatch against totalAmount must produce warning.
10. receivesReport contact should have email warning when missing.

Business requirements:
1. Project is the root entity.
2. All later modules must be able to reference projectId.
3. Multiple owners must be represented through ProjectParty.
4. A project can have one or more contractors.
5. A project can have one or more engineer organizations.
6. Contacts are connected to both project and organization.
7. The project detail page must show counts for:
   - contracts
   - inspection rounds
   - documents
   - files
   - mail threads
   - open findings
8. When project data changes, create a ProjectActivityLog entry.
9. If totalInspectionRounds and inspectionCycleText exist, expose a field for schedule generation but do not implement schedule generation in this module.
10. When owner party requiresSeparateReport is true, expose this flag to the Document module.
11. Project extraction must return preview data and must not apply changes until user confirmation.
12. Creating a project should emit an event or service call for default webhard folder creation, but the webhard module may implement the actual folder creation later.

Seed data:
Create a demo project:
- projectName: 리움미술관 승강기 교체공사
- siteName: 리움미술관
- siteAddress: 서울시 용산구 한남동 이태원로 55길 60-16
- constructionType: 승강기 교체공사
- totalAmount: 9130000000
- startDate: 2025-10-01
- endDate: 2028-02-29
- actualStartDate: 2025-11-03
- progressRate: 3.9
- inspectionCycleText: 3개월 이내 1회
- totalInspectionRounds: 10
- owners: 삼성문화재단, 삼성생명공익재단
- contractor: 현대엘리베이터(주)
- engineer: A&C기술사사무소
- owner parties require separate reports: true

Tests:
- test_project_create_success
- test_project_requires_project_name
- test_project_update_success
- test_project_progress_rate_range
- test_project_date_range_validation
- test_project_total_inspection_rounds_non_negative
- test_project_soft_archive_when_related_documents_exist
- test_organization_duplicate_warning
- test_project_party_multiple_owners
- test_project_party_owner_requires_separate_report
- test_project_party_share_ratio_warning
- test_project_party_share_amount_warning
- test_contact_create_success
- test_contact_report_recipient_requires_email_warning
- test_project_requirements_for_safety_report
- test_project_related_counts
- test_project_activity_log_created_on_update
- test_project_extraction_preview_does_not_apply_without_confirmation
- test_project_apply_extracted_info_creates_parties_and_contacts

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Requirement validation service
- Project extraction preview service
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```


---

## FILE: `docs/aec-erp/01-project-field/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 프로젝트/현장 원장 관리

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "프로젝트/현장 원장 관리" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 프로젝트, 발주처, 시공사, 점검회차, 보고서, 웹하드, 메일을 통합 관리하는 ERP
- 기술지도보고서 SaaS가 아니라 안전관리계획서, 안전보건대장, 공사안전보건대장 이행확인 보고서 자동화 중심
- 프로젝트 원장은 모든 문서 자동화의 기준 데이터
- 동일 프로젝트 안에 삼성문화재단, 삼성생명공익재단처럼 여러 발주처가 있을 수 있고, 발주처별 보고서가 따로 생성될 수 있어야 한다.

화면 1: 프로젝트 목록
- 좌측 ERP 사이드바
- 상단 프로젝트 검색, 상태 필터, 발주처 필터, 시공사 필터
- 중앙 프로젝트 테이블
- 테이블 컬럼:
  - 프로젝트명
  - 현장주소
  - 발주처
  - 시공사
  - 공사기간
  - 공정율
  - 다음 점검
  - 미조치 지적사항
  - 문서 상태
  - 프로젝트 상태
- 우측에는 "오늘 필요한 작업" 패널
- 프로젝트가 없으면 "프로젝트 직접 생성"과 "문서에서 정보 추출" 버튼을 보여준다.

화면 2: 프로젝트 상세
- 상단에 프로젝트명, 현장주소, 공사기간, 공정율, 상태 표시
- 바로 아래 요약 카드:
  - 총 공사금액
  - 발주처 수
  - 발주처별 보고서 대상 수
  - 점검회차
  - 다음 점검일
  - 미제출 문서
  - 미조치 지적사항
- 탭:
  - 개요
  - 관계자
  - 계약/견적
  - 점검회차
  - 문서
  - 사진/증빙
  - 웹하드
  - 메일
  - 이력
- 개요 탭에는 공사개요 표와 발주처별 금액 카드를 보여준다.
- 관계자 탭에는 발주처, 시공사, A&C 담당자를 연락처 카드로 보여준다.
- 발주처가 여러 개일 때는 badge와 card를 모두 사용해 명확히 구분한다.

화면 3: 프로젝트 생성/수정
- 단계형 폼 또는 섹션형 폼
- 섹션:
  - 기본정보
  - 공사정보
  - 발주처
  - 시공사
  - 엔지니어링사
  - 담당자
  - 점검조건
  - 보고서 제출조건
  - 저장 전 검증
- 발주처를 여러 개 추가할 수 있어야 한다.
- 발주처별 보고서 제출 여부 toggle을 제공한다.
- 공사금액 총액과 발주처별 분담금액을 구분한다.
- 담당자별 보고서 수신 여부와 조치요청 수신 여부를 설정할 수 있게 한다.

화면 4: 누락정보/영향도 패널
- 보고서 생성 전 필수정보
- 계약서 생성 전 필수정보
- 점검회차 생성 전 필수정보
- 메일 제출 전 필수정보
- 프로젝트 정보 변경 시 하위 모듈 영향도 warning 표시

디자인 스타일:
- 공공/대기업 제출 문서 시스템처럼 신뢰감 있는 B2B ERP 스타일
- Primary color는 짙은 블루
- 배경은 밝은 회색
- 카드와 테이블은 단정하고 정보 밀도가 높게
- 상태 badge는 명확하게
- 발주처별 보고서 대상은 강조 badge 사용
- 문서 자동화에 필요한 누락 필드는 우측 패널에서 경고
- 한글 가독성을 최우선으로 한다.

상태 표현:
- 진행중: blue
- 완료: green
- 지연: red
- 검토중: purple
- 누락정보: orange
- 보관: gray

결과물:
- 프로젝트 목록 화면
- 프로젝트 상세 화면
- 프로젝트 생성/수정 화면
- 복수 발주처 등록 UI
- 발주처별 보고서 제출 toggle UI
- 담당자 연락처 카드 UI
- 누락정보/영향도 패널 UI
```


---

## FILE: `docs/aec-erp/01-project-field/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 프로젝트/현장 원장 관리

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
프로젝트/현장 원장 관리

기능 설명:
프로젝트/현장 원장은 공사개요, 현장주소, 발주처, 시공사, 엔지니어링사, 담당자, 공사금액, 공사기간, 공정율, 점검주기, 총 점검회차, 발주처별 보고서 제출 여부를 관리하는 기준 데이터 기능이다.

업무 맥락:
- 계약서, 총괄현황, 보고서, 점검표, 사진대지, 제출 메일은 모두 Project 데이터를 사용한다.
- 발주처가 여러 개인 경우 ProjectParty로 분리한다.
- 같은 프로젝트라도 발주처별 보고서가 따로 생성될 수 있다.
- 시공사와 A&C 담당자는 연락망에 사용된다.
- 공사기간과 점검주기는 점검회차 생성에 사용된다.
- 담당자 이메일은 보고서 제출 메일과 조치요청 메일에 사용된다.
- 프로젝트 정보 변경은 하위 문서와 웹하드 폴더, 제출 이력에 영향을 줄 수 있다.

입력:
{
  "featureName": "프로젝트/현장 원장 관리",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `project.field.registry`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 계약/견적
    - 점검회차
    - 보고서 자동화
    - 체크리스트
    - 지적사항/조치현황
    - 웹하드
    - 메일함
    - 결재/제출

출력 JSON:
{
  "featureId": "project.field.registry",
  "featureName": "프로젝트/현장 원장 관리",
  "priority": "P0",
  "routes": [
    "/projects",
    "/projects/new",
    "/projects/[projectId]",
    "/projects/[projectId]/overview",
    "/projects/[projectId]/parties",
    "/projects/[projectId]/contacts",
    "/projects/[projectId]/requirements",
    "/projects/[projectId]/related",
    "/projects/[projectId]/history",
    "/projects/[projectId]/settings"
  ],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 models:
- Project
- Organization
- ProjectParty
- Contact
- ProjectRequirementStatus
- ProjectActivityLog
- ProjectExtractionResult

반드시 포함할 prompts:
- project-info-extraction
- project-field implementation prompt
- project-field design prompt

반드시 포함할 tests:
- test_project_create_success
- test_project_requires_project_name
- test_project_update_success
- test_project_progress_rate_range
- test_project_date_range_validation
- test_project_total_inspection_rounds_non_negative
- test_project_party_multiple_owners
- test_project_party_owner_requires_separate_report
- test_contact_create_success
- test_project_requirements_for_safety_report
- test_project_activity_log_created_on_update
- test_project_extraction_preview_does_not_apply_without_confirmation

주의:
- 발주처는 Organization이지만 프로젝트 안에서의 역할은 ProjectParty로 표현해야 한다.
- 발주처별 보고서가 필요한 경우 requiresSeparateReport가 true여야 한다.
- 공사금액 총액과 발주처별 분담금액을 혼동하지 않는다.
- projectId는 이후 모든 모듈의 필수 연결키다.
- AI 추출 결과는 바로 저장하지 말고 사용자 확인 후 적용한다.
- Project 삭제는 하위 문서가 있으면 archive 처리한다.
- 웹하드 폴더명은 projectId 기반으로 연결하고 displayName만 프로젝트명을 따라간다.
```


---

## FILE: `docs/aec-erp/02-contract-estimate/README.md`

# 기능 02 — 계약/견적 관리

이 폴더는 A&C 기술사 ERP의 두 번째 기능인 **계약/견적 관리** 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

계약/견적 관리는 기술용역계약서, 견적서, 계약금액, VAT 포함 여부, 발주처별 분담비율, 지급조건, 최종본, 날인본, 계약 변경 이력을 관리한다.

샘플 기준 핵심 구조:

```text
프로젝트: 리움미술관 승강기 교체공사
용역: 공사안전보건대장 이행점검 기술용역
계약금액: 11,000,000원, VAT 포함
발주처 1: 삼성문화재단, 60%, 6,600,000원
발주처 2: 삼성생명공익재단, 40%, 4,400,000원
점검횟수: 총 10회
지급조건: 1차기성, 준공금
```

## 핵심 연결

```text
ProjectParty.owner
→ ContractParty.client
→ PaymentSplitItem
→ PaymentTerm
→ ContractVersion
→ FileAsset
→ Webhard 00_계약_견적
→ MailThread / Submission
```


---

## FILE: `docs/aec-erp/02-contract-estimate/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 계약/견적 관리

## 1. 기능 정의

계약/견적 관리는 A&C 기술사 ERP에서 기술용역계약서, 견적서, 계약금액, 발주처별 분담비율, 지급조건, 계약기간, 납품항목, 최종본, 날인본을 관리하는 기능이다.

이 기능은 프로젝트 원장과 연결되어야 하며, 이후 점검회차, 보고서 자동화, 웹하드, 메일 제출, 결재/날인 흐름의 기준 데이터가 된다.

## 2. 이 기능이 필요한 이유

A&C 기술사 업무에서는 계약서의 정보가 이후 모든 문서와 업무에 반복 사용된다.

- 계약자/발주자 정보
- 계약상대자 정보
- 용역명
- 용역범위
- 계약금액
- VAT 포함 여부
- 발주처별 분담비율
- 발주처별 지급금액
- 계약기간
- 공사기간
- 납품항목
- 점검 횟수
- 지급조건
- 계약 변경 조건
- 최종본/날인본 파일

따라서 계약/견적 기능은 단순 계약서 보관이 아니라 프로젝트 업무 시작점이다.

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 대표/건설안전기술사 | 계약 조건 최종 검토, 서명/날인 확인 |
| 계약/행정 담당자 | 계약서 작성, 견적서 작성, 지급조건 관리 |
| 문서 작성자 | 계약 정보를 보고서와 제출 메일에 반영 |
| 점검 담당자 | 계약기간, 점검횟수, 납품항목 확인 |
| 관리자 | 계약 템플릿, 표준 문구, 금액 단위, 권한 관리 |

## 4. 핵심 업무 흐름

### 4.1 계약서 생성 흐름

```text
프로젝트 선택
→ 계약/견적 탭 진입
→ 계약서 생성 클릭
→ 계약 유형 선택
→ ProjectParty에서 발주처/수행자 불러오기
→ 용역명/용역범위 입력
→ 계약금액/VAT 입력
→ 발주처별 분담비율 입력
→ 지급조건 입력
→ 납품항목 입력
→ AI 계약서 초안 생성
→ 사용자 검토/수정
→ 내부 검토 요청
→ 최종본 생성
→ 날인본 업로드
→ 웹하드 저장
```

### 4.2 견적서 생성 흐름

```text
프로젝트 선택
→ 견적서 생성 클릭
→ 견적 항목 입력
→ 수량/단가/VAT 계산
→ 발주처별 분담비율 적용
→ 견적서 미리보기
→ PDF/HWPX 출력
→ 발주처 메일 발송
→ 제출 이력 저장
→ 수락 시 계약으로 전환
```

## 5. 핵심 기능

### 5.1 계약 목록

프로젝트별 계약서를 조회한다.

표시 항목:

- 계약명
- 프로젝트명
- 발주처
- 계약상대자
- 계약금액
- VAT 포함 여부
- 계약기간
- 지급상태
- 계약상태
- 최종본 파일
- 날인본 파일

### 5.2 계약서 생성

프로젝트 원장 정보를 불러와 기술용역계약서를 생성한다.

자동 반영 항목:

- 발주처 정보
- 계약상대자 정보
- 용역명
- 용역범위
- 계약금액
- 계약기간
- 공사기간
- 납품항목
- 지급조건
- 발주처별 분담비율
- 발주처별 지급금액

### 5.3 견적서 생성

견적 항목:

- 용역명
- 용역범위
- 점검횟수
- 단가
- 수량
- 공급가
- 부가세
- 합계
- 발주처별 분담금액

### 5.4 지급조건 관리

계약금액의 지급 구조를 관리한다.

예시:

```text
계약금액: 11,000,000원
1차기성: 4,400,000원
준공금: 6,600,000원
```

각 지급조건은 다음 정보를 가진다.

- 지급명
- 지급시점
- 지급금액
- 지급비율
- 발주처별 지급금액
- 지급상태
- 청구일
- 입금일
- 증빙파일

### 5.5 발주처별 분담비율

복수 발주처 계약에서는 분담비율과 분담금액을 구조화한다.

예시:

| 발주처 | 비율 | 계약 분담금액 | 1차기성 | 준공금 |
|---|---:|---:|---:|---:|
| 삼성문화재단 | 60% | 6,600,000 | 2,640,000 | 3,960,000 |
| 삼성생명공익재단 | 40% | 4,400,000 | 1,760,000 | 2,640,000 |

### 5.6 최종본/날인본 관리

계약서 파일은 상태별로 구분한다.

```text
초안
→ 검토본
→ 최종본
→ 발송본
→ 날인본
→ 보관
```

최종본과 날인본은 혼동하지 않는다.

- `finalFileId`: 확정된 최종본
- `signedFileId`: 실제 서명/날인된 파일

### 5.7 계약 변경 관리

계약 변경 사유, 변경금액, 변경기간, 변경범위, 변경문서 파일을 관리한다.

변경 사유 예시:

- 사업계획 변경
- 설계변경
- 점검횟수 변경
- 계약금액 변경
- 계약기간 변경
- 발주처 분담비율 변경

## 6. 핵심 데이터

### Contract

- 계약 ID
- 프로젝트 ID
- 계약명
- 계약유형
- 용역명
- 용역범위
- 계약금액
- VAT 포함 여부
- 계약기간
- 공사기간
- 납품항목
- 점검횟수
- 계약상태
- 최종본 파일
- 날인본 파일

### ContractParty

- 계약 ID
- 조직 ID
- 프로젝트 역할 ID
- 계약 내 역할
- 표시명
- 대표자
- 사업자등록번호
- 주소
- 분담비율
- 분담금액
- 지급 필요 여부
- 서명/날인 필요 여부

### PaymentTerm

- 계약 ID
- 지급명
- 지급시점
- 지급금액
- 지급비율
- 지급상태
- 청구일
- 입금일
- 증빙파일
- 발주처별 splitItems

### Estimate

- 프로젝트 ID
- 견적명
- 견적번호
- 유효기간
- 견적상태
- 공급가
- 부가세
- 합계
- 견적항목
- 최종본 파일

## 7. 상태

### ContractStatus

| 상태 | 의미 |
|---|---|
| draft | 초안 |
| review | 검토중 |
| sent | 발송 |
| signed | 날인완료 |
| cancelled | 취소 |
| archived | 보관 |

### PaymentStatus

| 상태 | 의미 |
|---|---|
| planned | 예정 |
| requested | 청구 |
| paid | 입금완료 |
| overdue | 지연 |
| cancelled | 취소 |

### EstimateStatus

| 상태 | 의미 |
|---|---|
| draft | 초안 |
| sent | 발송 |
| accepted | 수락 |
| rejected | 거절 |
| converted | 계약 전환 |

## 8. 권한

| 권한 | 가능 작업 |
|---|---|
| admin | 전체 생성/수정/삭제/상태변경 |
| contract_manager | 계약/견적 생성, 지급조건, 파일 관리 |
| engineer | 계약 조회, 점검횟수/납품항목 확인 |
| writer | 계약정보 조회, 문서 자동화 변수 사용 |
| viewer | 조회만 가능 |

## 9. 완료 기준

- 프로젝트에서 계약서를 생성할 수 있다.
- 복수 발주처 계약을 지원한다.
- 발주처별 분담비율과 분담금액을 계산할 수 있다.
- 지급조건을 1개 이상 등록할 수 있다.
- 지급조건별 발주처 분담금액을 계산할 수 있다.
- 계약서 초안을 자동 생성할 수 있다.
- 견적서를 생성하고 계약으로 전환할 수 있다.
- 계약서 최종본과 날인본을 파일로 관리할 수 있다.
- 계약 파일은 웹하드의 `00_계약_견적` 폴더에 저장된다.
- 계약기간과 점검횟수는 점검회차 생성에 연결된다.
- 계약서 발송/제출은 메일함 및 제출 이력과 연결된다.


---

## FILE: `docs/aec-erp/02-contract-estimate/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 계약/견적 관리

## 1. 기술 스택

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory Repository
- V1 Storage: MongoDB Repository Adapter
- File Layer: Local Storage MVP → Object Storage V1
- API namespace: `/api/v1`

## 2. Frontend Routes

```text
/projects/[projectId]/contracts
/projects/[projectId]/contracts/new
/contracts/[contractId]
/contracts/[contractId]/edit
/contracts/[contractId]/preview
/contracts/[contractId]/payments
/contracts/[contractId]/files
/contracts/[contractId]/changes

/projects/[projectId]/estimates
/projects/[projectId]/estimates/new
/estimates/[estimateId]
/estimates/[estimateId]/preview
```

## 3. Frontend Components

```text
ContractListPage
ContractCreatePage
ContractDetailPage
ContractPreviewPage
ContractPaymentPage
ContractFilePage
ContractChangePage

ContractTable
ContractForm
ContractPartyTable
ContractPartySplitEditor
PaymentTermTable
PaymentTermForm
PaymentSplitMatrix
ContractAmountSummary
ContractStatusBadge
ContractPreviewA4
ContractVersionHistory
SignedFileUploader
ContractFileList
ContractChangeTimeline

EstimateTable
EstimateForm
EstimateItemTable
EstimatePreviewA4
EstimateConvertButton
```

## 4. Backend APIs

### Contracts

```text
GET    /api/v1/projects/{projectId}/contracts
POST   /api/v1/projects/{projectId}/contracts
GET    /api/v1/contracts/{contractId}
PATCH  /api/v1/contracts/{contractId}
DELETE /api/v1/contracts/{contractId}

POST   /api/v1/contracts/{contractId}/generate
POST   /api/v1/contracts/{contractId}/preview
POST   /api/v1/contracts/{contractId}/export
POST   /api/v1/contracts/{contractId}/mark-sent
POST   /api/v1/contracts/{contractId}/mark-signed
```

### Contract Parties

```text
GET    /api/v1/contracts/{contractId}/parties
POST   /api/v1/contracts/{contractId}/parties
PATCH  /api/v1/contract-parties/{contractPartyId}
DELETE /api/v1/contract-parties/{contractPartyId}
POST   /api/v1/contracts/{contractId}/parties/apply-project-parties
```

### Payment Terms

```text
GET    /api/v1/contracts/{contractId}/payment-terms
POST   /api/v1/contracts/{contractId}/payment-terms
PATCH  /api/v1/payment-terms/{paymentTermId}
DELETE /api/v1/payment-terms/{paymentTermId}
POST   /api/v1/contracts/{contractId}/payment-terms/calculate-split
```

### Estimates

```text
GET    /api/v1/projects/{projectId}/estimates
POST   /api/v1/projects/{projectId}/estimates
GET    /api/v1/estimates/{estimateId}
PATCH  /api/v1/estimates/{estimateId}
DELETE /api/v1/estimates/{estimateId}

POST   /api/v1/estimates/{estimateId}/generate
POST   /api/v1/estimates/{estimateId}/export
POST   /api/v1/estimates/{estimateId}/convert-to-contract
```

### Files

```text
POST /api/v1/contracts/{contractId}/files/upload
GET  /api/v1/contracts/{contractId}/files
POST /api/v1/contracts/{contractId}/files/{fileId}/set-final
POST /api/v1/contracts/{contractId}/files/{fileId}/set-signed
```

## 5. Data Models

### Contract

```ts
type ContractStatus =
  | 'draft'
  | 'review'
  | 'sent'
  | 'signed'
  | 'cancelled'
  | 'archived'

type ContractType =
  | 'technical_service'
  | 'inspection'
  | 'consulting'
  | 'other'

type Contract = {
  id: string
  projectId: string
  contractNo?: string
  contractTitle: string
  contractType: ContractType
  serviceName: string
  serviceScope: string
  contractAmount: number
  vatIncluded: boolean
  vatAmount?: number
  supplyAmount?: number
  contractStartDate?: string
  contractEndDate?: string
  constructionStartDate?: string
  constructionEndDate?: string
  deliverables: string[]
  inspectionCount?: number
  paymentSummary?: string
  status: ContractStatus
  finalFileId?: string
  signedFileId?: string
  createdAt: string
  updatedAt: string
}
```

### ContractParty

```ts
type ContractPartyRole =
  | 'client'
  | 'client_1'
  | 'client_2'
  | 'contractor'
  | 'service_provider'
  | 'payer'
  | 'observer'

type ContractParty = {
  id: string
  contractId: string
  organizationId: string
  projectPartyId?: string
  role: ContractPartyRole
  displayName: string
  representativeName?: string
  businessNumber?: string
  address?: string
  phone?: string
  shareRatio?: number
  shareAmount?: number
  paymentRequired: boolean
  signingRequired: boolean
  displayOrder: number
}
```

### PaymentTerm

```ts
type PaymentStatus =
  | 'planned'
  | 'requested'
  | 'paid'
  | 'overdue'
  | 'cancelled'

type PaymentTerm = {
  id: string
  contractId: string
  label: string
  triggerText: string
  dueDate?: string
  amount: number
  ratio?: number
  status: PaymentStatus
  requestDate?: string
  paidDate?: string
  evidenceFileId?: string
  splitItems: PaymentSplitItem[]
  createdAt: string
  updatedAt: string
}

type PaymentSplitItem = {
  organizationId: string
  projectPartyId?: string
  label: string
  ratio: number
  amount: number
}
```

### Estimate

```ts
type EstimateStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'converted'

type Estimate = {
  id: string
  projectId: string
  estimateNo?: string
  title: string
  serviceName: string
  validUntil?: string
  status: EstimateStatus
  supplyAmount: number
  vatAmount: number
  totalAmount: number
  items: EstimateItem[]
  finalFileId?: string
  createdAt: string
  updatedAt: string
}

type EstimateItem = {
  id: string
  name: string
  description?: string
  quantity: number
  unit: string
  unitPrice: number
  supplyAmount: number
  vatAmount: number
  totalAmount: number
}
```

### ContractVersion

```ts
type ContractVersion = {
  id: string
  contractId: string
  versionNo: number
  status: 'draft' | 'review' | 'final' | 'signed'
  contentSnapshot: Record<string, unknown>
  fileId?: string
  createdBy: string
  createdAt: string
}
```

### ContractChange

```ts
type ContractChange = {
  id: string
  contractId: string
  changeNo: number
  reason: string
  previousAmount?: number
  changedAmount?: number
  previousEndDate?: string
  changedEndDate?: string
  changedScope?: string
  agreementFileId?: string
  approvedAt?: string
  createdAt: string
}
```

## 6. Repository Interface

```ts
interface ContractRepository {
  listByProject(projectId: string): Promise<Contract[]>
  getById(contractId: string): Promise<Contract | null>
  create(input: ContractCreateInput): Promise<Contract>
  update(contractId: string, input: ContractUpdateInput): Promise<Contract>
  delete(contractId: string): Promise<void>
}

interface PaymentTermRepository {
  listByContract(contractId: string): Promise<PaymentTerm[]>
  create(input: PaymentTermCreateInput): Promise<PaymentTerm>
  update(paymentTermId: string, input: PaymentTermUpdateInput): Promise<PaymentTerm>
  delete(paymentTermId: string): Promise<void>
}
```

## 7. Validation Rules

### Contract

- `projectId`는 필수다.
- `contractTitle`은 필수다.
- `contractAmount`는 0보다 커야 한다.
- `contractStartDate`가 `contractEndDate`보다 늦을 수 없다.
- `inspectionCount`는 0 이상 정수다.
- `signed` 상태로 변경하려면 `signedFileId`가 필요하다.
- 관련 문서나 제출 이력이 있으면 삭제는 soft delete 또는 차단을 기본으로 한다.

### ContractParty

- client 또는 client_1/client_2가 하나 이상 필요하다.
- service_provider는 하나 이상 필요하다.
- shareRatio 합계가 100이 아니면 warning을 표시한다.
- shareAmount 합계가 contractAmount와 다르면 warning을 표시한다.
- signingRequired가 true인 party는 날인본 확인 대상이다.

### PaymentTerm

- amount는 0보다 커야 한다.
- splitItems의 합계는 amount와 일치해야 한다.
- paid 상태로 변경하려면 paidDate가 필요하다.
- paid 상태에서는 evidenceFileId를 권장한다.

### Estimate

- export에는 item이 1개 이상 필요하다.
- quantity와 unitPrice는 0 이상이어야 한다.
- totalAmount는 item 합계와 일치해야 한다.

## 8. Service Rules

### ProjectParty 적용

```text
ProjectParty.role = owner      → ContractParty.role = client/client_1/client_2
ProjectParty.role = engineer   → ContractParty.role = service_provider
ProjectParty.role = contractor → ContractParty.role = observer 또는 contractor
```

### 발주처별 분담금액 계산

```text
shareAmount = contractAmount * shareRatio / 100
```

원 단위 반올림이 필요한 경우 마지막 항목에서 보정한다.

### 지급조건 분할 계산

```text
paymentSplitAmount = paymentTerm.amount * contractParty.shareRatio / 100
```

### 계약서 생성

```text
1. Project 조회
2. Contract 조회
3. ContractParty 조회
4. PaymentTerm 조회
5. DocumentTemplate 조회
6. 변수 매핑
7. 누락정보 검출
8. AI 초안 생성
9. ContractVersion 저장
10. 미리보기 반환
```

### Export

```text
1. 현재 계약서 draft 저장
2. 최신 ContractVersion 재조회
3. PDF/HWPX 생성
4. FileAsset 생성
5. 웹하드 /프로젝트명/00_계약_견적 저장
6. finalFileId 또는 signedFileId 연결
7. AuditLog 기록
```

## 9. API Response Example

```json
{
  "contract": {
    "id": "contract_leeum_safety_2026",
    "projectId": "project_leeum_elevator_2026",
    "contractTitle": "리움미술관 승강기 교체공사 공사안전보건대장 이행점검 기술용역계약서",
    "contractType": "technical_service",
    "serviceName": "한남동 승강기 교체공사(리움미술관) 기술용역",
    "serviceScope": "공사안전보건대장 이행점검 결과보고서 작성 및 제출",
    "contractAmount": 11000000,
    "vatIncluded": true,
    "inspectionCount": 10,
    "status": "signed"
  },
  "parties": [
    {"displayName": "삼성문화재단", "role": "client_1", "shareRatio": 60, "shareAmount": 6600000},
    {"displayName": "삼성생명공익재단", "role": "client_2", "shareRatio": 40, "shareAmount": 4400000},
    {"displayName": "A&C기술사사무소", "role": "service_provider"}
  ],
  "paymentTerms": [
    {"label": "1차기성", "amount": 4400000},
    {"label": "준공금", "amount": 6600000}
  ]
}
```

## 10. Tests

```text
test_contract_create_success
test_contract_requires_project
test_contract_amount_must_be_positive
test_contract_apply_project_parties
test_contract_multiple_clients_supported
test_contract_share_ratio_calculation
test_contract_share_amount_sum_warning
test_payment_term_split_by_ratio
test_payment_term_split_sum_matches_amount
test_contract_generate_creates_version
test_contract_export_uses_latest_version
test_contract_mark_signed_requires_signed_file
test_estimate_create_and_convert_to_contract
test_contract_file_saved_to_webhard_contract_folder
test_contract_status_change_creates_audit_log
```


---

## FILE: `docs/aec-erp/02-contract-estimate/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 계약/견적 관리

## 1. 화면 목표

계약/견적 관리 화면은 A&C ERP에서 프로젝트별 계약 조건, 발주처별 분담금액, 지급조건, 계약서 초안/최종본/날인본을 한눈에 관리하는 화면이다.

단순 문서 보관 화면이 아니라, 계약 정보가 이후 점검회차, 보고서 자동화, 웹하드, 제출 메일로 이어지는 업무 허브 역할을 해야 한다.

## 2. 화면 목록

### 2.1 프로젝트 계약 목록

Route:

```text
/projects/[projectId]/contracts
```

주요 영역:

- 프로젝트 요약 헤더
- 계약 상태 필터
- 계약 목록 테이블
- 계약금액 요약 카드
- 지급상태 요약 카드
- 새 계약서 생성 버튼
- 견적서 생성 버튼

테이블 컬럼:

| 컬럼 | 설명 |
|---|---|
| 계약명 | 계약 상세 이동 |
| 계약유형 | 기술용역, 점검, 컨설팅 등 |
| 발주처 | 복수 발주처 badge |
| 계약상대자 | A&C 등 |
| 계약금액 | VAT 포함 여부 표시 |
| 계약기간 | 시작~종료 |
| 지급상태 | 예정/청구/입금 |
| 문서상태 | 초안/검토/발송/날인 |
| 최종본 | 파일 링크 |
| 날인본 | 파일 링크 |

### 2.2 계약 생성/수정

Route:

```text
/projects/[projectId]/contracts/new
/contracts/[contractId]/edit
```

폼 섹션:

- 기본정보
- 계약 당사자
- 용역범위
- 계약금액
- 발주처별 분담비율
- 지급조건
- 계약기간
- 납품항목
- 특약/기타사항

### 2.3 계약 상세

Route:

```text
/contracts/[contractId]
```

상단 요약:

- 계약명
- 프로젝트명
- 계약금액
- VAT 포함 여부
- 계약상태
- 계약기간
- 날인본 여부

탭:

```text
개요
계약 당사자
지급조건
문서 미리보기
파일
변경 이력
```

### 2.4 지급조건 화면

Route:

```text
/contracts/[contractId]/payments
```

주요 UI:

- 지급조건 테이블
- 발주처별 분담금액 matrix
- 지급상태 badge
- 청구일/입금일 입력
- 증빙파일 업로드

### 2.5 계약서 미리보기

Route:

```text
/contracts/[contractId]/preview
```

구성:

- 좌측 변수/누락정보 패널
- 중앙 A4 계약서 미리보기
- 우측 AI 초안/검토 경고 패널
- 하단 export/검토요청/최종본 생성 버튼

### 2.6 견적서 화면

Route:

```text
/projects/[projectId]/estimates
/estimates/[estimateId]
```

주요 UI:

- 견적항목 테이블
- 수량/단가/공급가/VAT/합계
- 발주처별 분담금액
- 견적서 미리보기
- 계약 전환 버튼

## 3. UX 규칙

1. 계약금액은 항상 VAT 포함 여부를 함께 표시한다.
2. 발주처가 여러 개인 경우 분담비율과 분담금액을 나란히 표시한다.
3. 지급조건 합계가 계약금액과 다르면 경고한다.
4. 발주처별 지급금액 합계가 지급조건 금액과 다르면 경고한다.
5. `signed` 상태는 날인본 파일이 있어야 가능하다.
6. 최종본과 날인본은 서로 다른 badge로 구분한다.
7. 계약정보 변경 시 관련 문서 영향도를 보여준다.
8. 계약서 미리보기는 A4 비율로 표시한다.
9. AI 초안 생성 버튼은 계약서 본문 영역 근처에 배치한다.
10. 계약 변경 내역은 timeline으로 표시한다.

## 4. 컴포넌트 상세

### ContractAmountSummary

표시 항목:

- 계약금액
- 공급가
- VAT
- VAT 포함 여부
- 지급조건 합계
- 발주처별 분담금액 합계

### ContractPartySplitEditor

기능:

- 발주처 추가
- 분담비율 입력
- 분담금액 자동 계산
- 합계 검증
- ProjectParty에서 불러오기

### PaymentTermTable

컬럼:

| 컬럼 | 설명 |
|---|---|
| 지급명 | 1차기성, 준공금 등 |
| 지급조건 | 지급 시점 설명 |
| 지급금액 | 총 지급금액 |
| 삼성문화재단 지급금액 | 발주처별 split |
| 삼성생명공익재단 지급금액 | 발주처별 split |
| 지급상태 | planned/requested/paid |
| 청구일 | requestDate |
| 입금일 | paidDate |
| 증빙 | evidenceFileId |

### ContractPreviewA4

구성:

- 계약서 제목
- 계약자 정보 표
- 계약내용 표
- 일반조건
- 지급조건 표
- 서명/날인 영역

### SignedFileUploader

기능:

- 날인본 업로드
- 원본 파일명 표시
- 업로드일 표시
- 최종본/날인본 구분
- 웹하드 저장 위치 표시

## 5. Empty State

```text
등록된 계약서가 없습니다.
프로젝트 원장 정보를 기반으로 기술용역계약서 또는 견적서를 생성하세요.
```

버튼:

- 계약서 생성
- 견적서 생성
- 계약서 파일 업로드

## 6. Warning State

### 분담비율 합계 오류

```text
발주처별 분담비율 합계가 100%가 아닙니다.
계약금액 분배와 지급조건 계산에 영향을 줄 수 있습니다.
```

### 지급조건 합계 오류

```text
지급조건 합계가 계약금액과 일치하지 않습니다.
1차기성/준공금 등 지급조건 금액을 확인하세요.
```

### 날인본 누락

```text
계약서를 signed 상태로 변경하려면 날인본 파일이 필요합니다.
```

## 7. Responsive

### Desktop

- 계약 상세는 summary + tabs + right warning panel
- 지급조건은 matrix table 사용
- 계약서 미리보기는 A4 preview 사용

### Tablet

- 지급조건 matrix는 horizontal scroll
- 계약당사자는 card layout

### Mobile

- 계약 목록은 card list
- 금액/상태/파일 중심 표시
- 지급조건은 accordion


---

## FILE: `docs/aec-erp/02-contract-estimate/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 계약/견적 관리

## 1. Feature

```yaml
featureId: contract.estimate.management
featureName: 계약/견적 관리
priority: P0
module: contract-estimate
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 계약 목록 | `/projects/[projectId]/contracts` | 프로젝트별 계약서 조회 |
| 계약 생성 | `/projects/[projectId]/contracts/new` | 신규 계약서 생성 |
| 계약 상세 | `/contracts/[contractId]` | 계약 요약 및 관련 업무 |
| 계약 수정 | `/contracts/[contractId]/edit` | 계약정보 수정 |
| 계약 미리보기 | `/contracts/[contractId]/preview` | A4 계약서 미리보기 |
| 지급조건 | `/contracts/[contractId]/payments` | 지급조건/분담금액 관리 |
| 계약 파일 | `/contracts/[contractId]/files` | 최종본/날인본 관리 |
| 계약 변경 | `/contracts/[contractId]/changes` | 변경 이력 관리 |
| 견적 목록 | `/projects/[projectId]/estimates` | 프로젝트별 견적서 조회 |
| 견적 생성 | `/projects/[projectId]/estimates/new` | 견적서 작성 |
| 견적 상세 | `/estimates/[estimateId]` | 견적서 상세/계약 전환 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/projects/[projectId]/contracts` | ContractTable, ContractStatusBadge, ContractAmountSummary |
| `/projects/[projectId]/contracts/new` | ContractForm, ContractPartySplitEditor, PaymentTermForm |
| `/contracts/[contractId]` | ContractSummaryCard, ContractTabs, ContractVersionHistory |
| `/contracts/[contractId]/edit` | ContractForm, ContractPartyTable, PaymentTermTable |
| `/contracts/[contractId]/preview` | ContractPreviewA4, MissingFieldPanel, AIDraftPanel |
| `/contracts/[contractId]/payments` | PaymentTermTable, PaymentSplitMatrix, PaymentStatusBadge |
| `/contracts/[contractId]/files` | SignedFileUploader, ContractFileList |
| `/contracts/[contractId]/changes` | ContractChangeTimeline, ContractChangeForm |
| `/projects/[projectId]/estimates` | EstimateTable, EstimateStatusBadge |
| `/projects/[projectId]/estimates/new` | EstimateForm, EstimateItemTable |
| `/estimates/[estimateId]` | EstimatePreviewA4, EstimateConvertButton |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| ContractTable | GET `/api/v1/projects/{projectId}/contracts` |
| ContractForm | POST `/api/v1/projects/{projectId}/contracts`, PATCH `/api/v1/contracts/{contractId}` |
| ContractPartySplitEditor | GET/POST `/api/v1/contracts/{contractId}/parties` |
| PaymentTermTable | GET `/api/v1/contracts/{contractId}/payment-terms` |
| PaymentTermForm | POST `/api/v1/contracts/{contractId}/payment-terms` |
| PaymentSplitMatrix | POST `/api/v1/contracts/{contractId}/payment-terms/calculate-split` |
| ContractPreviewA4 | POST `/api/v1/contracts/{contractId}/preview` |
| AIDraftPanel | POST `/api/v1/contracts/{contractId}/generate` |
| SignedFileUploader | POST `/api/v1/contracts/{contractId}/files/upload` |
| EstimateTable | GET `/api/v1/projects/{projectId}/estimates` |
| EstimateForm | POST `/api/v1/projects/{projectId}/estimates` |
| EstimateConvertButton | POST `/api/v1/estimates/{estimateId}/convert-to-contract` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET `/projects/{projectId}/contracts` | Contract |
| POST `/projects/{projectId}/contracts` | Contract |
| GET `/contracts/{contractId}` | Contract, ContractParty, PaymentTerm, ContractVersion |
| POST `/contracts/{contractId}/parties/apply-project-parties` | ProjectParty, ContractParty |
| POST `/contracts/{contractId}/payment-terms/calculate-split` | PaymentTerm, PaymentSplitItem |
| POST `/contracts/{contractId}/generate` | Contract, ContractVersion, PromptTemplate |
| POST `/contracts/{contractId}/export` | ContractVersion, FileAsset |
| POST `/contracts/{contractId}/mark-signed` | Contract, FileAsset, AuditLog |
| POST `/estimates/{estimateId}/convert-to-contract` | Estimate, Contract |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| Contract | contract-draft-generation |
| ContractParty | contract-draft-generation |
| PaymentTerm | contract-draft-generation |
| Estimate | contract-draft-generation |
| Project | contract-draft-generation |
| ProjectParty | contract-draft-generation |

## 7. 프롬프트 → 테스트

| 프롬프트 | 테스트 |
|---|---|
| contract-draft-generation | test_contract_generate_draft |
| contract-draft-generation | test_contract_multiple_clients_prompt_output |
| contract-draft-generation | test_contract_payment_split_prompt_output |
| contract-draft-generation | test_contract_missing_fields_are_separated |
| contract-draft-generation | test_contract_does_not_invent_legal_terms |

## 8. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 계약 생성 | test_contract_create_success |
| 계약금액 검증 | test_contract_amount_must_be_positive |
| 복수 발주처 | test_contract_multiple_clients_supported |
| ProjectParty 적용 | test_contract_apply_project_parties |
| 분담비율 계산 | test_contract_share_ratio_calculation |
| 지급조건 분할 | test_payment_term_split_by_ratio |
| 지급조건 합계 검증 | test_payment_term_split_sum_matches_amount |
| 계약서 초안 생성 | test_contract_generate_creates_version |
| 계약서 export | test_contract_export_uses_latest_version |
| 날인 상태 변경 | test_contract_mark_signed_requires_signed_file |
| 견적서 계약 전환 | test_estimate_create_and_convert_to_contract |
| 웹하드 저장 | test_contract_file_saved_to_webhard_contract_folder |
| 상태 변경 이력 | test_contract_status_change_creates_audit_log |

## 9. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ProjectParty |
| 점검회차/일정 | contractStartDate, contractEndDate, inspectionCount |
| 보고서 자동화 | serviceScope, deliverables, owner parties |
| 웹하드 | finalFileId, signedFileId, FileAsset |
| 메일함 | 계약서/견적서 발송 메일 |
| 결재/제출 | 계약 검토, 날인, 제출 이력 |
| 관리자/템플릿 | 계약서 템플릿, 일반조건 문구 |

## 10. 리스크

| 리스크 | 대응 |
|---|---|
| 발주처별 분담비율과 지급조건 금액 불일치 | PaymentSplitMatrix에서 즉시 검증 |
| 계약금액과 지급조건 합계 불일치 | ContractAmountSummary warning |
| 최종본/날인본 혼동 | finalFileId와 signedFileId 분리 |
| AI가 법률/일반조건 문구를 임의 생성 | templateText 기반 문구만 사용 |
| 복수 발주처 계약 누락 | ContractParty 다중 client 지원 |
| 점검횟수 누락으로 일정 생성 불가 | inspectionCount 필드 필수 권장 |
| 계약서 export 시 오래된 초안 사용 | latest ContractVersion 재조회 |


---

## FILE: `docs/aec-erp/02-contract-estimate/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 계약/견적 초안 생성

## Prompt ID

`contract-draft-generation`

## 목적

프로젝트 정보, 발주처 정보, 계약금액, 지급조건, 용역범위, 납품항목을 바탕으로 기술용역계약서 또는 견적서 초안을 생성한다.

## Prompt

```text
너는 A&C기술사사무소 ERP의 계약/견적 문서 작성 보조 엔진이다.

입력:
- project
- projectParties
- organizations
- contacts
- contract
- contractParties
- paymentTerms
- estimate
- templateText
- userInstruction

작성 대상:
1. 기술용역계약서
2. 계약일반조건
3. 견적서
4. 지급조건표
5. 계약변경합의서

해야 할 일:
1. 프로젝트 원장 정보를 계약서 변수에 매핑한다.
2. 발주처가 여러 개인 경우 계약자 또는 발주자 항목을 분리한다.
3. 계약상대자는 A&C기술사사무소 등 용역 수행자로 표시한다.
4. 계약금액, VAT 포함 여부, 지급조건을 표로 정리한다.
5. 발주처별 분담비율과 분담금액을 별도 표로 정리한다.
6. 1차기성, 준공금 등 지급조건별 금액을 계산한다.
7. 용역범위와 납품항목을 문서 본문에 반영한다.
8. 누락된 정보는 본문에 임의 삽입하지 말고 missingFields로 분리한다.
9. 법률 문구 또는 일반조건은 templateText에 있는 문구만 사용한다.
10. 최종 계약서가 아니라 검토용 초안으로 작성한다.

작성 규칙:
- 금액은 원 단위 쉼표 표기를 사용한다.
- VAT 포함 여부를 명확히 표시한다.
- 날짜는 입력값 기준으로만 작성한다.
- 대표자명, 사업자등록번호, 주소, 전화번호는 입력값이 있을 때만 사용한다.
- 발주처별 지급비율 합계가 100이 아니면 warnings에 표시한다.
- 지급조건 합계가 계약금액과 다르면 warnings에 표시한다.
- 사용자가 제공하지 않은 특약사항을 생성하지 않는다.
- 계약 당사자명은 축약하지 않는다.
- 문체는 한국어 계약 실무 문체를 따른다.

출력 JSON:
{
  "documentTitle": "",
  "documentType": "technical_service_contract | estimate | contract_change",
  "sections": [
    {
      "sectionTitle": "",
      "body": ""
    }
  ],
  "tables": [
    {
      "tableTitle": "",
      "columns": [],
      "rows": []
    }
  ],
  "variablesUsed": [
    {
      "variable": "",
      "value": "",
      "source": ""
    }
  ],
  "paymentSummary": {
    "contractAmount": null,
    "vatIncluded": true,
    "splitTotal": null,
    "paymentTermTotal": null
  },
  "missingFields": [
    {
      "field": "",
      "label": "",
      "reason": ""
    }
  ],
  "warnings": [
    {
      "type": "",
      "message": ""
    }
  ]
}
```

## 계약서 표준 섹션

1. 계약 당사자
2. 용역명
3. 용역범위
4. 계약금액
5. 계약기간
6. 납품항목
7. 지급조건
8. 발주처별 분담비율
9. 계약 변경
10. 계약 완료
11. 계약 해지
12. 보안 및 비밀유지
13. 기타사항
14. 서명/날인

## Few-shot 기준

입력 요약 예시:

```json
{
  "contractAmount": 11000000,
  "vatIncluded": true,
  "parties": [
    {"name": "삼성문화재단", "role": "client_1", "shareRatio": 60},
    {"name": "삼성생명공익재단", "role": "client_2", "shareRatio": 40},
    {"name": "A&C기술사사무소", "role": "service_provider"}
  ],
  "paymentTerms": [
    {"label": "1차기성", "amount": 4400000},
    {"label": "준공금", "amount": 6600000}
  ]
}
```

출력 방향:

- 계약금액은 `일금 일천일백만원정(₩11,000,000, VAT 포함)`으로 표시한다.
- 공사 지분비율은 삼성문화재단 60%, 삼성생명공익재단 40%로 표시한다.
- 1차기성 4,400,000원은 각각 2,640,000원 / 1,760,000원으로 분할한다.
- 준공금 6,600,000원은 각각 3,960,000원 / 2,640,000원으로 분할한다.

## 금지사항

- 입력에 없는 일반조건이나 특약사항을 임의 작성하지 않는다.
- 계약금액과 공사금액을 혼동하지 않는다.
- 발주처별 계약 분담금액과 지급조건별 지급금액을 혼동하지 않는다.
- AI 초안을 최종 계약서처럼 표현하지 않는다.
```


---

## FILE: `docs/aec-erp/02-contract-estimate/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 계약/견적 관리

## Prompt

```text
You are implementing the Contract and Estimate Management module for A&C 기술사 ERP.

The service is a construction safety engineering ERP for A&C 기술사사무소. The Contract module manages technical service contracts, estimates, payment terms, owner payment split, final contract files, and signed files.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Contract and Estimate module.

Existing root concepts:
- Project
- Organization
- ProjectParty
- Contact
- FileAsset
- Folder
- AuditLog

Required backend models:
- Contract
- ContractParty
- PaymentTerm
- PaymentSplitItem
- Estimate
- EstimateItem
- ContractVersion
- ContractChange
- ContractFileLink

Required backend APIs:

Contracts:
- GET /api/v1/projects/{projectId}/contracts
- POST /api/v1/projects/{projectId}/contracts
- GET /api/v1/contracts/{contractId}
- PATCH /api/v1/contracts/{contractId}
- DELETE /api/v1/contracts/{contractId}
- POST /api/v1/contracts/{contractId}/generate
- POST /api/v1/contracts/{contractId}/preview
- POST /api/v1/contracts/{contractId}/export
- POST /api/v1/contracts/{contractId}/mark-sent
- POST /api/v1/contracts/{contractId}/mark-signed

Contract Parties:
- GET /api/v1/contracts/{contractId}/parties
- POST /api/v1/contracts/{contractId}/parties
- PATCH /api/v1/contract-parties/{contractPartyId}
- DELETE /api/v1/contract-parties/{contractPartyId}
- POST /api/v1/contracts/{contractId}/parties/apply-project-parties

Payment Terms:
- GET /api/v1/contracts/{contractId}/payment-terms
- POST /api/v1/contracts/{contractId}/payment-terms
- PATCH /api/v1/payment-terms/{paymentTermId}
- DELETE /api/v1/payment-terms/{paymentTermId}
- POST /api/v1/contracts/{contractId}/payment-terms/calculate-split

Estimates:
- GET /api/v1/projects/{projectId}/estimates
- POST /api/v1/projects/{projectId}/estimates
- GET /api/v1/estimates/{estimateId}
- PATCH /api/v1/estimates/{estimateId}
- DELETE /api/v1/estimates/{estimateId}
- POST /api/v1/estimates/{estimateId}/generate
- POST /api/v1/estimates/{estimateId}/export
- POST /api/v1/estimates/{estimateId}/convert-to-contract

Files:
- POST /api/v1/contracts/{contractId}/files/upload
- GET /api/v1/contracts/{contractId}/files
- POST /api/v1/contracts/{contractId}/files/{fileId}/set-final
- POST /api/v1/contracts/{contractId}/files/{fileId}/set-signed

Required frontend routes:
- /projects/[projectId]/contracts
- /projects/[projectId]/contracts/new
- /contracts/[contractId]
- /contracts/[contractId]/edit
- /contracts/[contractId]/preview
- /contracts/[contractId]/payments
- /contracts/[contractId]/files
- /contracts/[contractId]/changes
- /projects/[projectId]/estimates
- /projects/[projectId]/estimates/new
- /estimates/[estimateId]
- /estimates/[estimateId]/preview

Required frontend components:
- ContractTable
- ContractForm
- ContractPartyTable
- ContractPartySplitEditor
- PaymentTermTable
- PaymentTermForm
- PaymentSplitMatrix
- ContractAmountSummary
- ContractStatusBadge
- ContractPreviewA4
- ContractVersionHistory
- SignedFileUploader
- EstimateTable
- EstimateForm
- EstimateItemTable
- EstimatePreviewA4

Business requirements:
1. A Contract must belong to a Project.
2. Contract can have multiple client parties.
3. ProjectParty owner records can be applied to ContractParty records.
4. ContractParty shareRatio must be used to calculate shareAmount.
5. PaymentTerm splitItems must be calculated by ContractParty shareRatio.
6. PaymentTerm split sum must match PaymentTerm amount.
7. ContractParty shareAmount sum should match Contract amount; if not, show warning.
8. Contract can be generated as a draft using the service AI prompt `contract-draft-generation`.
9. Contract export must use the latest saved ContractVersion.
10. Signed status requires a signed file.
11. Final and signed contract files must be stored in the webhard folder `/프로젝트명/00_계약_견적`.
12. Estimate can be converted to Contract.
13. All status changes should create AuditLog.
14. Contract period and inspectionCount must be exposed to the inspection schedule module.
15. Deliverables must be exposed to the document automation module.

Validation:
1. contractAmount > 0.
2. contractTitle is required.
3. contractStartDate <= contractEndDate.
4. inspectionCount is a non-negative integer.
5. paid PaymentTerm requires paidDate.
6. signed Contract requires signedFileId.
7. Estimate requires at least one item to export.
8. Estimate total must equal item totals.

Seed data:
Create a demo contract for the Leeum elevator replacement project:
- contractTitle: 리움미술관 승강기 교체공사 공사안전보건대장 이행점검 기술용역계약서
- serviceName: 한남동 승강기 교체공사(리움미술관) 기술용역
- serviceScope: 공사안전보건대장 이행점검 결과보고서 작성 및 제출
- contractAmount: 11000000
- vatIncluded: true
- inspectionCount: 10
- client_1: 삼성문화재단, shareRatio 60, shareAmount 6600000
- client_2: 삼성생명공익재단, shareRatio 40, shareAmount 4400000
- service_provider: A&C기술사사무소
- payment term 1: 1차기성, 4400000
- payment term 2: 준공금, 6600000

Tests:
- test_contract_create_success
- test_contract_amount_must_be_positive
- test_contract_apply_project_parties
- test_contract_multiple_clients_supported
- test_contract_share_ratio_calculation
- test_payment_term_split_by_ratio
- test_payment_term_split_sum_matches_amount
- test_contract_generate_creates_version
- test_contract_export_uses_latest_version
- test_contract_mark_signed_requires_signed_file
- test_estimate_create_and_convert_to_contract
- test_contract_file_saved_to_webhard_contract_folder
- test_contract_status_change_creates_audit_log

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```


---

## FILE: `docs/aec-erp/02-contract-estimate/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 계약/견적 관리

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "계약/견적 관리" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 프로젝트, 계약, 점검, 보고서, 웹하드, 메일 제출을 통합 관리하는 ERP
- 계약/견적 화면은 기술용역계약서, 견적서, 지급조건, 발주처별 분담비율, 날인본을 관리하는 업무 화면
- 단순 문서 보관이 아니라 이후 점검회차와 보고서 자동화의 기준 데이터가 되는 화면

화면 1: 프로젝트 계약 목록
- 좌측 ERP 사이드바
- 상단 프로젝트 요약 헤더
- 계약금액 요약 카드
- 지급상태 요약 카드
- 계약 상태 필터
- 중앙 계약 목록 테이블
- 우측 빠른 작업 패널
- 버튼:
  - 계약서 생성
  - 견적서 생성
  - 계약서 파일 업로드

계약 목록 테이블 컬럼:
- 계약명
- 계약유형
- 발주처
- 계약상대자
- 계약금액
- VAT 포함 여부
- 계약기간
- 지급상태
- 문서상태
- 최종본
- 날인본

화면 2: 계약 생성/수정
- 섹션형 폼
- 섹션:
  - 기본정보
  - 계약 당사자
  - 용역범위
  - 계약금액
  - 발주처별 분담비율
  - 지급조건
  - 계약기간
  - 납품항목
  - 기타사항
- 발주처별 분담비율 editor를 제공한다.
- 분담비율 입력 시 분담금액을 자동 계산한다.
- 지급조건 입력 시 발주처별 지급금액을 자동 계산한다.
- 합계가 맞지 않으면 즉시 warning을 표시한다.

화면 3: 계약 상세
- 상단에 계약명, 프로젝트명, 계약금액, 계약상태, 계약기간, 날인본 여부 표시
- 탭:
  - 개요
  - 계약 당사자
  - 지급조건
  - 문서 미리보기
  - 파일
  - 변경 이력
- 개요 탭에는 계약금액, VAT, 용역범위, 납품항목, 점검횟수를 표시한다.
- 계약 당사자 탭에는 발주자 1, 발주자 2, 계약상대자를 카드로 표시한다.
- 지급조건 탭에는 1차기성, 준공금 같은 지급조건과 발주처별 분담금액 matrix를 표시한다.

화면 4: 계약서 미리보기
- 중앙 A4 계약서 미리보기
- 좌측 변수 입력/누락정보 패널
- 우측 AI 초안/검토 경고 패널
- 하단 버튼:
  - AI 초안 생성
  - 저장
  - 검토 요청
  - PDF/HWPX 내보내기
  - 날인본 업로드
- 최종본과 날인본은 badge로 명확히 구분한다.

화면 5: 견적서
- 견적항목 테이블
- 항목명, 수량, 단위, 단가, 공급가, VAT, 합계
- 발주처별 분담금액 표시
- 견적서 미리보기
- 계약 전환 버튼

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- 계약서/문서 영역은 흰색 A4 느낌
- 테이블은 정보 밀도가 높고 정돈되어야 한다.
- 금액은 오른쪽 정렬
- 상태 badge는 명확하게
- 경고는 주황색 또는 빨간색으로 표시
- 발주처별 분담비율은 시각적으로 비교하기 쉽게 bar 또는 compact table 사용
- 한글 계약서 문서 시스템처럼 신뢰감 있게 디자인한다.

상태 표현:
- 초안: gray
- 검토중: purple
- 발송: blue
- 날인완료: green
- 취소: red
- 보관: gray

결과물:
- 계약 목록 화면
- 계약 생성/수정 화면
- 계약 상세 화면
- 지급조건 matrix 화면
- 계약서 A4 미리보기 화면
- 견적서 작성 화면
- 날인본 업로드 UI
```


---

## FILE: `docs/aec-erp/02-contract-estimate/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 계약/견적 관리

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
계약/견적 관리

기능 설명:
계약/견적 관리는 기술용역계약서, 견적서, 계약금액, VAT 포함 여부, 발주처별 분담비율, 지급조건, 계약기간, 납품항목, 최종본, 날인본, 계약 변경 이력을 관리하는 기능이다.

업무 맥락:
- 계약은 Project에 속한다.
- ProjectParty owner는 ContractParty client로 전환될 수 있다.
- 발주처가 여러 개인 경우 분담비율과 분담금액을 관리해야 한다.
- 지급조건은 1차기성, 준공금 등으로 구성될 수 있다.
- 계약서 초안은 AI가 작성할 수 있지만 사용자가 검토해야 한다.
- 계약서 최종본과 날인본은 웹하드에 저장되어야 한다.
- 계약기간과 점검횟수는 점검회차 생성에 사용된다.
- 계약서 발송은 메일함 및 제출 이력과 연결될 수 있다.

입력:
{
  "featureName": "계약/견적 관리",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "mailRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `contract.estimate.management`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 점검회차/일정
    - 보고서 자동화
    - 웹하드
    - 메일함
    - 결재/제출
    - 관리자/템플릿

출력 JSON:
{
  "featureId": "contract.estimate.management",
  "featureName": "계약/견적 관리",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /projects/[projectId]/contracts
- /projects/[projectId]/contracts/new
- /contracts/[contractId]
- /contracts/[contractId]/edit
- /contracts/[contractId]/preview
- /contracts/[contractId]/payments
- /contracts/[contractId]/files
- /contracts/[contractId]/changes
- /projects/[projectId]/estimates
- /projects/[projectId]/estimates/new
- /estimates/[estimateId]

반드시 포함할 models:
- Contract
- ContractParty
- PaymentTerm
- PaymentSplitItem
- Estimate
- EstimateItem
- ContractVersion
- ContractChange
- FileAsset
- AuditLog

반드시 포함할 prompts:
- contract-draft-generation
- contract-estimate-management implementation prompt
- contract-estimate design prompt

반드시 포함할 tests:
- test_contract_create_success
- test_contract_multiple_clients_supported
- test_contract_share_ratio_calculation
- test_payment_term_split_by_ratio
- test_contract_generate_creates_version
- test_contract_export_uses_latest_version
- test_contract_mark_signed_requires_signed_file
- test_estimate_create_and_convert_to_contract
- test_contract_file_saved_to_webhard_contract_folder

주의:
- Contract는 Project 없이 생성될 수 없다.
- ProjectParty와 ContractParty를 혼동하지 않는다.
- 계약금액 총액과 발주처별 분담금액을 혼동하지 않는다.
- 지급조건 합계와 계약금액 합계가 맞는지 검증해야 한다.
- signed 상태는 날인본 파일이 있어야 한다.
- AI가 생성한 계약서 문구는 draft 상태로만 저장한다.
- 법률/일반조건 문구는 등록된 템플릿 문구만 사용한다.
- 계약서 export는 최신 ContractVersion을 기준으로 한다.
```


---

## FILE: `docs/aec-erp/03-inspection-schedule/README.md`

# 03 — 점검회차/일정 관리

이 기능은 A&C 기술사 ERP의 세 번째 누적 기능이다. 프로젝트/현장 원장과 계약/견적 정보를 기준으로 점검회차를 만들고, 회차별 업무·발주처별 보고서 생성·제출 상태를 관리한다.

## 핵심 요약

```text
Project / Contract
→ InspectionSchedule
→ InspectionRound
→ InspectionTask
→ InspectionOwnerReportTask
→ ChecklistSession / SafetyReport / Submission
```

## 샘플 기준

- 프로젝트: 리움미술관 승강기 교체공사
- 점검주기: 3개월 이내 1회
- 총 점검회차: 10회
- 대표 일정: 2026년 1·4·7·10월, 2027년 1·4·7·10월, 2028년 1·2월
- 발주처별 보고서: 삼성문화재단 / 삼성생명공익재단
- 4회차: 1차기성 milestone 연결 가능
- 10회차: 준공금 milestone 연결 가능

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```


---

## FILE: `docs/aec-erp/03-inspection-schedule/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 점검회차/일정 관리

## 1. 기능 정의

점검회차/일정 관리는 프로젝트의 공사기간, 계약기간, 점검주기, 총 점검횟수, 발주처별 보고서 제출 조건을 기준으로 현장점검 일정을 생성하고 관리하는 기능이다.

이 기능은 단순한 캘린더가 아니라 다음 업무의 기준키를 만든다.

```text
점검회차
→ 현장점검 체크리스트
→ 지적사항
→ 조치현황
→ 사진대지
→ 공사안전보건대장 이행확인 보고서
→ 발주처별 제출 메일
→ 제출 이력
```

## 2. 이 기능이 필요한 이유

A&C 업무에서는 하나의 프로젝트가 여러 회차의 이행점검으로 나뉘고, 각 회차마다 체크리스트, 지적사항, 사진대지, 보고서, 제출 이력이 생성된다.

리움미술관 승강기 교체공사 예시:

| 항목 | 값 |
|---|---|
| 공사기간 | 2025.10 ~ 2028.02 |
| 점검주기 | 3개월 이내 1회 |
| 총 점검회차 | 10회 |
| 2026년 | 1회, 2회, 3회, 4회 |
| 2027년 | 5회, 6회, 7회, 8회 |
| 2028년 | 9회, 10회 |
| 보고서 | 발주처별 제출 |

따라서 ERP는 날짜만 저장하는 것이 아니라, 회차별로 다음 상태를 함께 관리해야 한다.

- 예정월
- 예정일
- 실제 점검일
- 문서번호
- 점검 담당자
- 확인자
- 시공사 참석자
- 체크리스트 입력 상태
- 지적사항 수
- 조치완료 상태
- 사진대지 상태
- 보고서 초안/검토/최종본 상태
- 발주처별 제출 상태
- 계약 지급 milestone
- 웹하드 회차 폴더

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 대표/기술사 | 회차별 점검 및 보고서 제출 현황 검토 |
| 상무/점검 담당자 | 점검일 확정, 현장점검 수행, 체크리스트 입력 |
| 문서 작성자 | 회차 기준 보고서 생성, 사진대지 정리, 누락정보 확인 |
| 계약/행정 담당자 | 계약상 점검횟수, 기성/준공 지급조건과 회차 연결 |
| 발주처 담당자 | 해당 회차 보고서 수신 및 확인 |
| 관리자 | 반복 일정 규칙, 알림, 권한, 업무 템플릿 관리 |

## 4. 핵심 기능

### 4.1 점검 일정 생성

프로젝트 또는 계약의 기준값을 불러와 점검회차를 생성한다.

입력 기준:

- Project.startDate / Project.endDate
- Contract.contractStartDate / Contract.contractEndDate
- Contract.inspectionCount
- Project.inspectionCycleText
- 사용자가 지정한 회차별 예정월/예정일
- ProjectParty.requiresSeparateReport

생성 결과:

| 회차 | 예정월 | 예정일 | 문서번호 | milestone |
|---:|---|---|---|---|
| 1 | 2026-01 | 2026-01-23 | 제2026-01호 | - |
| 2 | 2026-04 | 미정 | 제2026-02호 | - |
| 3 | 2026-07 | 미정 | 제2026-03호 | - |
| 4 | 2026-10 | 미정 | 제2026-04호 | 1차기성 |
| 5 | 2027-01 | 미정 | 제2027-05호 | - |
| 6 | 2027-04 | 미정 | 제2027-06호 | - |
| 7 | 2027-07 | 미정 | 제2027-07호 | - |
| 8 | 2027-10 | 미정 | 제2027-08호 | - |
| 9 | 2028-01 | 미정 | 제2028-09호 | - |
| 10 | 2028-02 | 미정 | 제2028-10호 | 준공금 |

### 4.2 점검회차 상태 관리

| 상태 | 의미 |
|---|---|
| planned | 예정만 생성됨 |
| scheduled | 점검일 확정 |
| in_progress | 현장점검 진행중 |
| checked | 체크리스트 입력 완료 |
| review | 보고서 검토중 |
| report_ready | 최종본 생성 가능 |
| submitted | 발주처 제출 완료 |
| closed | 회차 종료 |
| cancelled | 취소 |

### 4.3 발주처별 보고서 업무 생성

발주처가 여러 개이고 `requiresSeparateReport = true`이면, 같은 점검회차 안에서 발주처별 보고서 업무를 만든다.

```text
제1회 점검
├── 삼성문화재단 보고서 업무
└── 삼성생명공익재단 보고서 업무
```

각 업무는 다음 상태를 가진다.

| 상태 | 의미 |
|---|---|
| not_started | 생성 전/미시작 |
| drafting | 초안 작성중 |
| review | 검토중 |
| exported | 최종본 생성 |
| submitted | 제출 완료 |
| confirmed | 발주처 확인 |
| cancelled | 취소 |

### 4.4 회차별 업무 자동 생성

점검회차가 생성되면 회차별 할 일을 자동 생성한다.

| 업무 | 기본 마감 |
|---|---|
| 점검 일정 확인 | D-30 |
| 발주처 일정 협의 | D-14 |
| 시공사 일정 협의 | D-14 |
| 점검 준비자료 확인 | D-7 |
| 현장점검 | D-Day |
| 체크리스트 입력 완료 | D+1 |
| 지적사항 정리 | D+3 |
| 사진대지 정리 | D+5 |
| 보고서 초안 작성 | D+7 |
| 내부 검토 | D+10 |
| 발주처별 보고서 제출 | D+14 |

### 4.5 점검 일정 캘린더

월/주/리스트/연도 타임라인으로 점검 일정을 보여준다.

필터:

- 프로젝트
- 점검 담당자
- 발주처
- 회차 상태
- 제출기한
- 미제출 보고서
- 미조치 지적사항
- 계약 milestone

### 4.6 일정 변경 관리

점검일이 변경되면 변경 이력을 남긴다.

필수 기록:

- 기존 예정일
- 변경 예정일
- 기존 실제 점검일
- 변경 실제 점검일
- 변경 사유
- 변경 요청자
- 변경 승인자
- 관련 메일/파일
- 알림 발송 여부

### 4.7 공사일정 첨부 연결

회차별 또는 연도별 공사일정 파일을 연결한다.

연결 대상:

- Project
- InspectionRound
- WorkScheduleAttachment
- FileAsset

## 5. 사용자 흐름

### 5.1 점검회차 자동 생성

```text
프로젝트 선택
→ 점검회차 탭 진입
→ 점검 일정 생성 클릭
→ 기준 선택: 프로젝트 공사기간 / 계약기간 / 수동
→ 점검주기 입력
→ 총 회차 입력
→ 발주처별 보고서 생성 여부 확인
→ 일정 미리보기
→ 저장
→ 회차별 업무 생성
→ 회차별 웹하드 폴더 생성 이벤트
```

### 5.2 점검일 확정

```text
점검회차 선택
→ 예정월 확인
→ 실제 점검일 입력
→ 점검 담당자 지정
→ 발주처 확인자 지정
→ 시공사 참석자 지정
→ 저장
→ 일정 협의/리마인드 업무 갱신
```

### 5.3 회차 종료

```text
체크리스트 입력 완료
→ 지적사항 등록
→ 조치현황 확인
→ 사진대지 완료
→ 보고서 초안 생성
→ 내부 검토
→ 발주처별 최종본 export
→ 메일 제출
→ 제출완료
→ 회차 종료
```

## 6. 핵심 데이터

### InspectionSchedule

프로젝트 전체 점검 일정의 상위 묶음이다.

- scheduleId
- projectId
- contractId
- scheduleName
- basisType
- cycleText
- totalRounds
- startDate
- endDate
- status

### InspectionRound

점검회차 단위다.

- inspectionRoundId
- projectId
- scheduleId
- roundNo
- documentNo
- plannedMonth
- plannedDate
- actualInspectionDate
- inspectorUserId
- confirmerContactId
- contractorContactId
- status
- reportDueDate
- milestoneLabel
- memo

### InspectionOwnerReportTask

발주처별 보고서 업무다.

- taskId
- inspectionRoundId
- ownerPartyId
- documentInstanceId
- status
- exportedFileId
- submittedAt
- mailThreadId

### InspectionTask

회차별 할 일이다.

- taskId
- inspectionRoundId
- taskType
- title
- dueDate
- assigneeId
- status
- linkedEntityType
- linkedEntityId

### WorkScheduleAttachment

공사일정 도면/첨부자료 연결이다.

- attachmentId
- projectId
- inspectionRoundId
- year
- title
- fileId
- highlightedArea
- note

## 7. 완료 기준

- 프로젝트 기준으로 점검회차를 자동 생성할 수 있다.
- 계약기간/공사기간/수동 입력 기준을 모두 지원한다.
- 총 10회 같은 고정 회차 일정을 지원한다.
- 예정월, 예정일, 실제 점검일을 분리하여 저장한다.
- 발주처별 보고서 업무가 자동 생성된다.
- 회차별 기본 업무가 자동 생성된다.
- 점검 일정 변경 이력이 남는다.
- 공사일정 첨부자료를 연도별/회차별로 연결할 수 있다.
- 보고서 제출 완료 시 회차와 발주처별 업무 상태가 갱신된다.


---

## FILE: `docs/aec-erp/03-inspection-schedule/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 점검회차/일정 관리

## 1. Frontend Routes

```text
/projects/[projectId]/inspections
/projects/[projectId]/inspections/schedule
/projects/[projectId]/inspections/new
/inspections/[inspectionRoundId]
/inspections/[inspectionRoundId]/edit
/inspections/[inspectionRoundId]/tasks
/inspections/[inspectionRoundId]/owner-reports
/inspections/[inspectionRoundId]/attachments
/calendar/inspections
```

## 2. Frontend Components

```text
InspectionSchedulePage
InspectionCalendarPage
InspectionRoundDetailPage
InspectionRoundCreatePage
InspectionRoundEditPage

InspectionTimeline
InspectionYearGrid
InspectionMonthGrid
InspectionRoundCard
InspectionRoundTable
InspectionStatusBadge
InspectionScheduleGenerator
InspectionSchedulePreview
OwnerReportTaskList
OwnerReportStatusMatrix
InspectionTaskChecklist
InspectionReminderPanel
InspectionRescheduleModal
WorkScheduleAttachmentPanel
WorkSchedulePreview
RoundDependencyStatus
MilestoneBadge
```

## 3. Backend APIs

### Schedule

```text
GET    /api/v1/projects/{projectId}/inspection-schedules
POST   /api/v1/projects/{projectId}/inspection-schedules
GET    /api/v1/inspection-schedules/{scheduleId}
PATCH  /api/v1/inspection-schedules/{scheduleId}
DELETE /api/v1/inspection-schedules/{scheduleId}

POST   /api/v1/projects/{projectId}/inspection-schedules/preview
POST   /api/v1/projects/{projectId}/inspection-schedules/generate
```

### Rounds

```text
GET    /api/v1/projects/{projectId}/inspection-rounds
POST   /api/v1/projects/{projectId}/inspection-rounds
GET    /api/v1/inspection-rounds/{inspectionRoundId}
PATCH  /api/v1/inspection-rounds/{inspectionRoundId}
DELETE /api/v1/inspection-rounds/{inspectionRoundId}

POST   /api/v1/inspection-rounds/{inspectionRoundId}/confirm-date
POST   /api/v1/inspection-rounds/{inspectionRoundId}/reschedule
POST   /api/v1/inspection-rounds/{inspectionRoundId}/close
```

### Owner Report Tasks

```text
GET    /api/v1/inspection-rounds/{inspectionRoundId}/owner-report-tasks
POST   /api/v1/inspection-rounds/{inspectionRoundId}/owner-report-tasks/generate
PATCH  /api/v1/owner-report-tasks/{taskId}
POST   /api/v1/owner-report-tasks/{taskId}/link-document
POST   /api/v1/owner-report-tasks/{taskId}/mark-exported
POST   /api/v1/owner-report-tasks/{taskId}/mark-submitted
```

### Inspection Tasks

```text
GET    /api/v1/inspection-rounds/{inspectionRoundId}/tasks
POST   /api/v1/inspection-rounds/{inspectionRoundId}/tasks
PATCH  /api/v1/inspection-tasks/{taskId}
POST   /api/v1/inspection-rounds/{inspectionRoundId}/tasks/generate-defaults
```

### Attachments

```text
GET    /api/v1/inspection-rounds/{inspectionRoundId}/attachments
POST   /api/v1/inspection-rounds/{inspectionRoundId}/attachments
PATCH  /api/v1/work-schedule-attachments/{attachmentId}
DELETE /api/v1/work-schedule-attachments/{attachmentId}
```

### Calendar

```text
GET /api/v1/calendar/inspection-rounds
GET /api/v1/calendar/inspection-tasks
```

## 4. Data Models

### InspectionSchedule

```ts
type InspectionScheduleStatus = 'draft' | 'active' | 'completed' | 'archived'

type InspectionScheduleBasisType =
  | 'project_period'
  | 'contract_period'
  | 'manual'

type InspectionSchedule = {
  id: string
  projectId: string
  contractId?: string
  scheduleName: string
  basisType: InspectionScheduleBasisType
  cycleText: string
  totalRounds: number
  startDate?: string
  endDate?: string
  status: InspectionScheduleStatus
  createdAt: string
  updatedAt: string
}
```

### InspectionRound

```ts
type InspectionRoundStatus =
  | 'planned'
  | 'scheduled'
  | 'in_progress'
  | 'checked'
  | 'review'
  | 'report_ready'
  | 'submitted'
  | 'closed'
  | 'cancelled'

type InspectionRound = {
  id: string
  projectId: string
  scheduleId?: string
  roundNo: number
  documentNo?: string
  plannedMonth?: string
  plannedDate?: string
  actualInspectionDate?: string
  inspectorUserId?: string
  confirmerContactId?: string
  contractorContactId?: string
  status: InspectionRoundStatus
  reportDueDate?: string
  milestoneLabel?: string
  memo?: string
  createdAt: string
  updatedAt: string
}
```

### InspectionOwnerReportTask

```ts
type OwnerReportTaskStatus =
  | 'not_started'
  | 'drafting'
  | 'review'
  | 'exported'
  | 'submitted'
  | 'confirmed'
  | 'cancelled'

type InspectionOwnerReportTask = {
  id: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId: string
  documentInstanceId?: string
  status: OwnerReportTaskStatus
  exportedFileId?: string
  submittedAt?: string
  mailThreadId?: string
  createdAt: string
  updatedAt: string
}
```

### InspectionTask

```ts
type InspectionTaskType =
  | 'schedule_confirm'
  | 'owner_coordination'
  | 'contractor_coordination'
  | 'prepare_materials'
  | 'site_inspection'
  | 'checklist_input'
  | 'finding_summary'
  | 'photo_ledger'
  | 'report_draft'
  | 'internal_review'
  | 'owner_submission'
  | 'follow_up'

type InspectionTaskStatus =
  | 'todo'
  | 'in_progress'
  | 'done'
  | 'blocked'
  | 'cancelled'

type InspectionTask = {
  id: string
  projectId: string
  inspectionRoundId: string
  taskType: InspectionTaskType
  title: string
  dueDate?: string
  assigneeId?: string
  status: InspectionTaskStatus
  linkedEntityType?: string
  linkedEntityId?: string
  createdAt: string
  updatedAt: string
}
```

### WorkScheduleAttachment

```ts
type WorkScheduleAttachment = {
  id: string
  projectId: string
  inspectionRoundId?: string
  year?: number
  title: string
  fileId: string
  highlightedArea?: Record<string, unknown>
  note?: string
  createdAt: string
  updatedAt: string
}
```

### InspectionRescheduleLog

```ts
type InspectionRescheduleLog = {
  id: string
  inspectionRoundId: string
  previousPlannedDate?: string
  nextPlannedDate?: string
  previousActualDate?: string
  nextActualDate?: string
  reason: string
  requestedBy?: string
  approvedBy?: string
  createdAt: string
}
```

## 5. Repository Interfaces

```ts
interface InspectionScheduleRepository {
  listByProject(projectId: string): Promise<InspectionSchedule[]>
  getById(scheduleId: string): Promise<InspectionSchedule | null>
  create(input: InspectionScheduleCreateInput): Promise<InspectionSchedule>
  update(scheduleId: string, input: InspectionScheduleUpdateInput): Promise<InspectionSchedule>
  delete(scheduleId: string): Promise<void>
}

interface InspectionRoundRepository {
  listByProject(projectId: string): Promise<InspectionRound[]>
  listBySchedule(scheduleId: string): Promise<InspectionRound[]>
  getById(inspectionRoundId: string): Promise<InspectionRound | null>
  create(input: InspectionRoundCreateInput): Promise<InspectionRound>
  update(inspectionRoundId: string, input: InspectionRoundUpdateInput): Promise<InspectionRound>
  delete(inspectionRoundId: string): Promise<void>
}

interface OwnerReportTaskRepository {
  listByRound(inspectionRoundId: string): Promise<InspectionOwnerReportTask[]>
  create(input: OwnerReportTaskCreateInput): Promise<InspectionOwnerReportTask>
  update(taskId: string, input: OwnerReportTaskUpdateInput): Promise<InspectionOwnerReportTask>
}

interface InspectionTaskRepository {
  listByRound(inspectionRoundId: string): Promise<InspectionTask[]>
  create(input: InspectionTaskCreateInput): Promise<InspectionTask>
  update(taskId: string, input: InspectionTaskUpdateInput): Promise<InspectionTask>
}
```

## 6. Validation Rules

### InspectionSchedule

- `projectId`는 필수다.
- `totalRounds`는 1 이상 정수다.
- `basisType = project_period`이면 Project의 startDate/endDate가 필요하다.
- `basisType = contract_period`이면 Contract의 contractStartDate/contractEndDate가 필요하다.
- 미리보기 API는 데이터를 저장하지 않는다.

### InspectionRound

- `roundNo`는 1 이상 정수다.
- 같은 `projectId` 안에서 `roundNo`는 중복될 수 없다.
- `plannedMonth`, `plannedDate`, `actualInspectionDate`를 분리한다.
- `submitted` 상태가 되려면 발주처별 보고서 업무가 모두 submitted 또는 confirmed여야 한다.
- `closed` 상태가 되려면 체크리스트, 지적사항, 사진대지, 보고서 종속 조건을 통과해야 한다.

### OwnerReportTask

- `ownerPartyId`는 ProjectParty 중 role이 owner인 대상이어야 한다.
- `requiresSeparateReport = true`인 owner는 자동 생성 대상이다.
- `submitted` 상태는 `submittedAt` 또는 `mailThreadId`가 있어야 한다.

## 7. Service Rules

### Schedule Preview

```text
1. Project 조회
2. Contract 선택 시 Contract 조회
3. basisType 확인
4. startDate/endDate 확인
5. cycleText/totalRounds 확인
6. 기본 회차 후보 생성
7. 발주처별 보고서 업무 후보 생성
8. 사용자에게 preview 반환
```

### Schedule Generate

```text
1. InspectionSchedule 생성
2. InspectionRound N개 생성
3. 각 round별 OwnerReportTask 생성
4. 각 round별 기본 InspectionTask 생성
5. 회차별 웹하드 폴더 생성 이벤트 발행
6. AuditLog 기록
```

### OwnerReportTask 자동 생성

```text
ProjectParty where role = owner and requiresSeparateReport = true
→ InspectionOwnerReportTask 생성
```

### Document Number 생성

기본 규칙:

```text
제{year}-{roundNo padded 2}호
```

예시:

```text
제2026-01호
```

단, 문서번호는 사용자가 직접 수정할 수 있어야 한다.

### Default Task Due Date

점검일이 있는 경우:

| 업무 | 기준 |
|---|---|
| schedule_confirm | D-30 |
| owner_coordination | D-14 |
| contractor_coordination | D-14 |
| prepare_materials | D-7 |
| site_inspection | D-Day |
| checklist_input | D+1 |
| finding_summary | D+3 |
| photo_ledger | D+5 |
| report_draft | D+7 |
| internal_review | D+10 |
| owner_submission | D+14 |

점검 예정일이 없고 예정월만 있으면 dueDate는 null로 두고 warning을 표시한다.

## 8. API Response Example

```json
{
  "schedule": {
    "id": "schedule_leeum_2026_2028",
    "projectId": "project_leeum_elevator_2026",
    "scheduleName": "리움미술관 승강기 교체공사 공사안전보건대장 이행점검",
    "basisType": "contract_period",
    "cycleText": "3개월 이내 1회",
    "totalRounds": 10,
    "startDate": "2026-01-01",
    "endDate": "2028-02-29",
    "status": "active"
  },
  "rounds": [
    {
      "roundNo": 1,
      "documentNo": "제2026-01호",
      "plannedMonth": "2026-01",
      "plannedDate": "2026-01-23",
      "actualInspectionDate": "2026-01-23",
      "status": "submitted"
    },
    {
      "roundNo": 2,
      "documentNo": "제2026-02호",
      "plannedMonth": "2026-04",
      "status": "planned"
    }
  ],
  "ownerReportTasks": [
    {
      "roundNo": 1,
      "ownerName": "삼성문화재단",
      "status": "submitted"
    },
    {
      "roundNo": 1,
      "ownerName": "삼성생명공익재단",
      "status": "submitted"
    }
  ]
}
```

## 9. Tests

```text
test_inspection_schedule_preview_success
test_inspection_schedule_preview_does_not_persist
test_inspection_schedule_generate_10_rounds
test_inspection_round_no_unique_per_project
test_inspection_round_document_no_generation
test_inspection_schedule_generates_owner_report_tasks
test_owner_report_task_created_only_for_separate_report_owner
test_inspection_task_defaults_created
test_inspection_reschedule_creates_log
test_round_submitted_requires_all_owner_reports_submitted
test_round_closed_requires_checklist_and_documents
test_work_schedule_attachment_linked_to_round
test_calendar_returns_inspection_rounds
test_milestone_labels_are_exposed
```


---

## FILE: `docs/aec-erp/03-inspection-schedule/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 점검회차/일정 관리

## 1. 화면 목표

점검회차/일정 관리 화면은 프로젝트의 전체 점검 흐름을 한눈에 보여주고, 각 회차별 준비·점검·보고서·제출 상태를 관리하는 화면이다.

단순 캘린더가 아니라 다음 정보를 동시에 보여줘야 한다.

- 전체 점검회차
- 예정월/예정일/실제점검일
- 발주처별 보고서 상태
- 체크리스트 입력 상태
- 지적사항 수
- 조치현황 상태
- 사진대지 상태
- 보고서 생성/제출 상태
- 계약 지급조건 milestone
- 공사일정 첨부자료

## 2. 화면 목록

### 2.1 프로젝트 점검회차 목록

Route:

```text
/projects/[projectId]/inspections
```

주요 영역:

- 프로젝트 요약 헤더
- 점검 진행률 카드
- 다음 점검 카드
- 미제출 보고서 카드
- 미조치 지적사항 카드
- 점검회차 테이블
- 점검 타임라인

테이블 컬럼:

| 컬럼 | 설명 |
|---|---|
| 회차 | 1회, 2회 등 |
| 문서번호 | 제2026-01호 |
| 예정월 | 2026.01 |
| 점검일 | 실제 점검일 |
| 담당자 | 점검 담당자 |
| 발주처 보고서 | 발주처별 상태 badge |
| 체크리스트 | 입력 상태 |
| 지적사항 | open/closed 수 |
| 사진대지 | 완료 여부 |
| 보고서 | 초안/검토/제출 |
| milestone | 1차기성/준공금 등 |
| 상태 | planned 등 |

### 2.2 점검 일정 생성 화면

Route:

```text
/projects/[projectId]/inspections/schedule
```

구성:

- 기준 선택: 프로젝트 공사기간 / 계약기간 / 수동
- 점검주기 입력
- 총 점검회차 입력
- 회차별 예정월 grid
- 첫 점검일 입력
- 문서번호 규칙
- 발주처별 보고서 생성 toggle
- 일정 미리보기
- 생성 버튼

### 2.3 점검회차 상세

Route:

```text
/inspections/[inspectionRoundId]
```

상단 요약:

- 회차
- 문서번호
- 프로젝트명
- 예정월
- 점검일
- 담당자
- 확인자
- 상태
- 제출 진행률
- milestone

탭:

```text
개요
업무
발주처별 보고서
체크리스트
지적사항
사진대지
공사일정 첨부
이력
```

### 2.4 발주처별 보고서 상태

Route:

```text
/inspections/[inspectionRoundId]/owner-reports
```

표시:

- 발주처명
- 보고서 제목
- 문서 상태
- 최종본 파일
- 제출일
- 제출 메일
- 확인 상태

### 2.5 일정 캘린더

Route:

```text
/calendar/inspections
```

표시 방식:

- 월간 캘린더
- 주간 캘린더
- 리스트
- 연도 타임라인

필터:

- 프로젝트
- 담당자
- 발주처
- 상태
- 미제출
- 지연

### 2.6 공사일정 첨부 화면

Route:

```text
/inspections/[inspectionRoundId]/attachments
```

구성:

- 연도별 공사일정 첨부
- 도면/이미지 미리보기
- 회차 연결
- 강조 영역 표시
- 파일 출처
- 웹하드 위치

## 3. UX 규칙

1. 점검회차는 timeline으로 전체 흐름을 보여준다.
2. 10회처럼 고정된 회차는 연도/월 grid로 표시한다.
3. 발주처별 보고서가 필요한 경우 회차 카드 안에 발주처 badge를 표시한다.
4. 제출 완료와 보고서 생성 완료를 구분한다.
5. 점검일이 미정이면 예정월만 표시한다.
6. 점검일이 지나고 체크리스트가 미완료면 warning을 표시한다.
7. 점검일이 지나고 보고서 미제출이면 danger를 표시한다.
8. 일정 변경은 reschedule modal에서 사유를 필수 입력한다.
9. 공사일정 첨부자료는 이미지 preview와 파일정보를 함께 보여준다.
10. 계약 지급조건과 연결된 회차는 milestone badge를 표시한다.

## 4. 컴포넌트 상세

### InspectionTimeline

- 연도별 구분
- 월별 회차 표시
- 현재 회차 강조
- 완료 회차와 예정 회차 구분
- milestone 표시

### InspectionRoundCard

표시 항목:

- 회차
- 문서번호
- 예정월
- 실제 점검일
- 담당자
- 상태
- 발주처별 보고서 badge
- 체크리스트 상태
- 지적사항 수
- 제출 상태
- milestone

### InspectionScheduleGenerator

입력 항목:

- 기준 기간
- 점검주기
- 총 회차
- 회차별 예정월
- 첫 점검일
- 문서번호 규칙
- 발주처별 보고서 자동 생성 여부

### OwnerReportStatusMatrix

행:

- 회차

열:

- 발주처
- 초안
- 검토
- 최종본
- 제출
- 확인

### InspectionTaskChecklist

업무 목록:

- 일정 확인
- 발주처 협의
- 시공사 협의
- 준비자료 확인
- 현장점검
- 체크리스트 입력
- 지적사항 정리
- 사진대지 정리
- 보고서 초안
- 내부 검토
- 발주처 제출

### WorkSchedulePreview

표시:

- 공사일정 이미지
- 연도
- 회차 연결
- 강조 영역
- 메모
- 웹하드 파일 위치

## 5. Empty State

### 점검회차가 없을 때

```text
등록된 점검회차가 없습니다.
계약기간과 점검주기를 기준으로 점검 일정을 생성하세요.
```

버튼:

- 점검 일정 생성
- 수동 회차 추가

## 6. Warning State

### 점검일 미확정

```text
이 회차는 예정월만 등록되어 있습니다.
점검일을 확정해야 알림과 업무 마감일을 생성할 수 있습니다.
```

### 보고서 미제출

```text
점검일 이후 보고서가 아직 제출되지 않았습니다.
발주처별 보고서 상태를 확인하세요.
```

### 일정 충돌

```text
같은 날짜에 다른 점검 일정이 있습니다.
담당자 일정과 발주처 협의 여부를 확인하세요.
```

## 7. Responsive

### Desktop

- timeline + table 동시 제공
- 우측 detail panel 사용
- owner report matrix 표시

### Tablet

- timeline 중심
- table horizontal scroll
- round detail drawer

### Mobile

- round card list
- 오늘/이번주 점검 우선 표시
- 전화/메일/사진 업로드 버튼 강조


---

## FILE: `docs/aec-erp/03-inspection-schedule/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 점검회차/일정 관리

## 1. Feature

```yaml
featureId: inspection.schedule.management
featureName: 점검회차/일정 관리
priority: P0
module: inspection-schedule
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 점검회차 목록 | `/projects/[projectId]/inspections` | 프로젝트별 점검회차 조회 |
| 점검 일정 생성 | `/projects/[projectId]/inspections/schedule` | 자동/수동 일정 생성 |
| 회차 수동 추가 | `/projects/[projectId]/inspections/new` | 점검회차 수동 등록 |
| 회차 상세 | `/inspections/[inspectionRoundId]` | 회차별 업무/상태 |
| 회차 수정 | `/inspections/[inspectionRoundId]/edit` | 점검일, 담당자, 상태 수정 |
| 회차 업무 | `/inspections/[inspectionRoundId]/tasks` | 준비/보고/제출 업무 관리 |
| 발주처별 보고서 | `/inspections/[inspectionRoundId]/owner-reports` | 발주처별 문서 상태 |
| 공사일정 첨부 | `/inspections/[inspectionRoundId]/attachments` | 공사일정 파일 연결 |
| 점검 캘린더 | `/calendar/inspections` | 전체 점검 일정 캘린더 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/projects/[projectId]/inspections` | InspectionTimeline, InspectionRoundTable, InspectionRoundCard, MilestoneBadge |
| `/projects/[projectId]/inspections/schedule` | InspectionScheduleGenerator, InspectionSchedulePreview |
| `/projects/[projectId]/inspections/new` | InspectionRoundForm |
| `/inspections/[inspectionRoundId]` | InspectionRoundSummary, RoundDependencyStatus |
| `/inspections/[inspectionRoundId]/edit` | InspectionRoundForm, InspectionRescheduleModal |
| `/inspections/[inspectionRoundId]/tasks` | InspectionTaskChecklist, InspectionReminderPanel |
| `/inspections/[inspectionRoundId]/owner-reports` | OwnerReportTaskList, OwnerReportStatusMatrix |
| `/inspections/[inspectionRoundId]/attachments` | WorkScheduleAttachmentPanel, WorkSchedulePreview |
| `/calendar/inspections` | InspectionCalendar, InspectionFilterBar |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| InspectionTimeline | GET `/api/v1/projects/{projectId}/inspection-rounds` |
| InspectionRoundTable | GET `/api/v1/projects/{projectId}/inspection-rounds` |
| InspectionScheduleGenerator | POST `/api/v1/projects/{projectId}/inspection-schedules/preview` |
| InspectionSchedulePreview | POST `/api/v1/projects/{projectId}/inspection-schedules/generate` |
| InspectionRoundForm | POST/PATCH `/api/v1/inspection-rounds` |
| InspectionRescheduleModal | POST `/api/v1/inspection-rounds/{inspectionRoundId}/reschedule` |
| InspectionTaskChecklist | GET/PATCH `/api/v1/inspection-tasks` |
| OwnerReportTaskList | GET `/api/v1/inspection-rounds/{inspectionRoundId}/owner-report-tasks` |
| OwnerReportStatusMatrix | PATCH `/api/v1/owner-report-tasks/{taskId}` |
| WorkScheduleAttachmentPanel | POST `/api/v1/inspection-rounds/{inspectionRoundId}/attachments` |
| InspectionCalendar | GET `/api/v1/calendar/inspection-rounds` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET `/inspection-schedules` | InspectionSchedule |
| POST `/inspection-schedules/preview` | Project, Contract, ProjectParty |
| POST `/inspection-schedules/generate` | InspectionSchedule, InspectionRound, InspectionTask, InspectionOwnerReportTask |
| GET `/inspection-rounds` | InspectionRound |
| PATCH `/inspection-rounds/{id}` | InspectionRound, AuditLog |
| POST `/inspection-rounds/{id}/reschedule` | InspectionRound, InspectionRescheduleLog |
| GET `/owner-report-tasks` | InspectionOwnerReportTask, ProjectParty |
| POST `/owner-report-tasks/{id}/link-document` | InspectionOwnerReportTask, DocumentInstance |
| POST `/owner-report-tasks/{id}/mark-submitted` | InspectionOwnerReportTask, MailThread, Submission |
| POST `/attachments` | WorkScheduleAttachment, FileAsset |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| InspectionSchedule | inspection-schedule-generation |
| InspectionRound | inspection-schedule-generation |
| InspectionTask | inspection-schedule-generation |
| InspectionOwnerReportTask | inspection-schedule-generation |
| Project | inspection-schedule-generation |
| Contract | inspection-schedule-generation |
| ProjectParty | inspection-schedule-generation |

## 7. 프롬프트 → 테스트

| 프롬프트 | 테스트 |
|---|---|
| inspection-schedule-generation | test_inspection_schedule_preview_success |
| inspection-schedule-generation | test_inspection_schedule_generate_10_rounds |
| inspection-schedule-generation | test_owner_report_tasks_generated |
| inspection-schedule-generation | test_missing_dates_are_not_invented |
| inspection-schedule-generation | test_existing_round_conflict_detected |

## 8. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 일정 미리보기 | test_inspection_schedule_preview_success |
| 미리보기 저장 방지 | test_inspection_schedule_preview_does_not_persist |
| 10회 생성 | test_inspection_schedule_generate_10_rounds |
| 회차 중복 방지 | test_inspection_round_no_unique_per_project |
| 문서번호 생성 | test_inspection_round_document_no_generation |
| 발주처별 업무 생성 | test_inspection_schedule_generates_owner_report_tasks |
| 별도보고 발주처 필터 | test_owner_report_task_created_only_for_separate_report_owner |
| 기본 업무 생성 | test_inspection_task_defaults_created |
| 일정 변경 이력 | test_inspection_reschedule_creates_log |
| 제출 상태 조건 | test_round_submitted_requires_all_owner_reports_submitted |
| 회차 종료 조건 | test_round_closed_requires_dependencies |
| 공사일정 첨부 | test_work_schedule_attachment_linked_to_round |
| 캘린더 조회 | test_calendar_returns_inspection_rounds |
| milestone 표시 | test_milestone_labels_are_exposed |

## 9. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ProjectParty, Contact |
| 계약/견적 | contractId, inspectionCount, payment milestone |
| 현장점검 체크리스트 | inspectionRoundId |
| 보고서 자동화 | inspectionRoundId, ownerPartyId |
| 지적사항/사진대지 | inspectionRoundId |
| 산업안전보건관리비 | inspectionRoundId 또는 ownerPartyId |
| 웹하드 | 회차별 폴더, 공사일정 첨부 |
| 메일함 | 일정 협의 메일, 제출 메일 |
| 결재/제출 | ownerReportTask, Submission |
| 대시보드 | 다음 점검, 미제출, 지연 상태 |

## 10. 리스크

| 리스크 | 대응 |
|---|---|
| 예정월과 실제 점검일 혼동 | plannedMonth, plannedDate, actualInspectionDate 분리 |
| 발주처별 보고서 업무 누락 | ProjectParty.requiresSeparateReport 기준 자동 생성 |
| 회차 중복 | projectId + roundNo unique |
| 일정 변경 추적 누락 | InspectionRescheduleLog 필수 |
| 점검 완료와 보고서 제출 완료 혼동 | round status와 ownerReportTask status 분리 |
| 일정 생성 preview가 바로 저장됨 | preview endpoint와 generate endpoint 분리 |
| 공사일정 첨부가 프로젝트 전체/회차별 중복 | WorkScheduleAttachment에서 inspectionRoundId optional |
| 문서번호 자동 생성 오류 | 사용자가 수정 가능한 documentNo 제공 |


---

## FILE: `docs/aec-erp/03-inspection-schedule/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 점검회차/일정 생성

## Prompt ID

`inspection-schedule-generation`

## 목적

프로젝트 정보, 계약 정보, 공사기간, 점검주기, 총 점검회차, 발주처별 보고서 제출 조건을 바탕으로 점검회차와 회차별 업무를 생성한다.

## Prompt

```text
너는 A&C기술사 ERP의 점검회차/일정 생성 엔진이다.

입력:
- project
- contract
- projectParties
- contacts
- existingInspectionRounds
- existingTasks
- userInstruction
- schedulePolicy

목표:
프로젝트의 공사안전보건대장 이행점검 일정을 생성하거나 검토한다.

해야 할 일:
1. 프로젝트의 공사기간과 계약기간을 확인한다.
2. 점검주기와 총 점검횟수를 확인한다.
3. 사용자 지시가 있으면 해당 월/일정을 우선한다.
4. 점검회차별 예정월, 예정일, 문서번호를 생성한다.
5. 발주처별 보고서 제출이 필요한 경우 ownerReportTasks를 생성한다.
6. 각 회차별 기본 업무를 생성한다.
7. 계약 지급조건과 연결되는 회차가 있으면 milestone으로 표시한다.
8. 일정 충돌, 누락정보, 과거일, 불명확한 날짜를 warnings에 표시한다.
9. 입력에 없는 날짜는 임의로 확정하지 말고 plannedMonth 또는 missingFields로 표시한다.
10. 이미 존재하는 회차와 중복되지 않도록 conflicts로 표시한다.
11. 결과는 저장용이 아니라 사용자 검토용 preview로 반환한다.

작성 규칙:
- 날짜가 명확하면 YYYY-MM-DD로 출력한다.
- 월만 있는 경우 YYYY-MM로 출력하고 plannedDate는 null로 둔다.
- 문서번호는 기본적으로 `제{연도}-{회차 2자리}호` 형식을 사용한다.
- 발주처별 보고서 제출 문구가 있거나 ProjectParty.requiresSeparateReport가 true이면 발주처별 업무를 생성한다.
- 회차별 업무는 점검 준비, 점검, 체크리스트, 보고서, 제출 단계로 나눈다.
- 법령 해석이나 계약조건을 새로 만들지 않는다.
- 기존 회차가 있으면 overwrite하지 말고 conflict로 표시한다.

출력 JSON:
{
  "schedulePreview": {
    "projectId": "",
    "contractId": null,
    "scheduleName": "",
    "basisType": "project_period | contract_period | manual",
    "cycleText": "",
    "totalRounds": null,
    "startDate": null,
    "endDate": null
  },
  "rounds": [
    {
      "roundNo": 1,
      "documentNo": "",
      "plannedMonth": "",
      "plannedDate": null,
      "actualInspectionDate": null,
      "status": "planned",
      "milestones": [],
      "notes": []
    }
  ],
  "ownerReportTasks": [
    {
      "roundNo": 1,
      "ownerPartyId": "",
      "ownerName": "",
      "status": "not_started",
      "reason": ""
    }
  ],
  "inspectionTasks": [
    {
      "roundNo": 1,
      "taskType": "",
      "title": "",
      "dueDate": null,
      "assigneeHint": "",
      "status": "todo"
    }
  ],
  "missingFields": [
    {
      "field": "",
      "label": "",
      "reason": ""
    }
  ],
  "conflicts": [
    {
      "type": "",
      "message": "",
      "relatedRoundNo": null
    }
  ],
  "warnings": [
    {
      "type": "",
      "message": ""
    }
  ]
}
```

## 기본 업무 생성 규칙

점검 예정일이 있는 경우 다음 업무를 생성한다.

```text
D-30 점검 일정 확인
D-14 발주처 일정 협의
D-14 시공사 일정 협의
D-7 점검 준비자료 확인
D-Day 현장점검
D+1 체크리스트 입력 완료
D+3 지적사항 정리
D+5 사진대지 정리
D+7 보고서 초안 작성
D+10 내부 검토
D+14 발주처별 보고서 제출
```

점검 예정일이 없고 예정월만 있는 경우 dueDate는 null로 두고 title에 예정월을 포함한다.

## Few-shot 기준

입력 예시:

```json
{
  "project": {
    "projectName": "리움미술관 승강기 교체공사",
    "startDate": "2025-10-01",
    "endDate": "2028-02-29",
    "inspectionCycleText": "3개월 이내 1회",
    "totalInspectionRounds": 10
  },
  "projectParties": [
    {
      "id": "party_culture",
      "organizationName": "삼성문화재단",
      "role": "owner",
      "requiresSeparateReport": true
    },
    {
      "id": "party_public",
      "organizationName": "삼성생명공익재단",
      "role": "owner",
      "requiresSeparateReport": true
    }
  ],
  "userInstruction": "2026년 1월, 4월, 7월, 10월 / 2027년 1월, 4월, 7월, 10월 / 2028년 1월, 2월 총 10회로 생성"
}
```

출력 방향:

```text
1회: 2026-01
2회: 2026-04
3회: 2026-07
4회: 2026-10, milestone: 1차기성
5회: 2027-01
6회: 2027-04
7회: 2027-07
8회: 2027-10
9회: 2028-01
10회: 2028-02, milestone: 준공금
```

각 회차마다 삼성문화재단, 삼성생명공익재단 ownerReportTask를 생성한다.

## 금지사항

- 입력에 없는 실제 점검일을 확정하지 않는다.
- 기존 회차를 사용자 확인 없이 덮어쓰지 않는다.
- 발주처별 보고서가 필요한 owner를 누락하지 않는다.
- 점검 완료와 보고서 제출 완료를 같은 상태로 취급하지 않는다.


---

## FILE: `docs/aec-erp/03-inspection-schedule/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 점검회차/일정 관리

## Prompt

```text
You are implementing the Inspection Schedule and Rounds module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module manages inspection schedules, inspection rounds, owner-specific report tasks, round tasks, rescheduling logs, milestone labels, calendar views, and work schedule attachments.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Inspection Schedule and Rounds module.

Existing concepts:
- Project
- Contract
- Organization
- ProjectParty
- Contact
- FileAsset
- Folder
- AuditLog
- DocumentInstance

Required backend models:
- InspectionSchedule
- InspectionRound
- InspectionOwnerReportTask
- InspectionTask
- WorkScheduleAttachment
- InspectionRescheduleLog
- InspectionRoundMilestone

Required backend APIs:

Schedule:
- GET /api/v1/projects/{projectId}/inspection-schedules
- POST /api/v1/projects/{projectId}/inspection-schedules
- GET /api/v1/inspection-schedules/{scheduleId}
- PATCH /api/v1/inspection-schedules/{scheduleId}
- DELETE /api/v1/inspection-schedules/{scheduleId}
- POST /api/v1/projects/{projectId}/inspection-schedules/preview
- POST /api/v1/projects/{projectId}/inspection-schedules/generate

Rounds:
- GET /api/v1/projects/{projectId}/inspection-rounds
- POST /api/v1/projects/{projectId}/inspection-rounds
- GET /api/v1/inspection-rounds/{inspectionRoundId}
- PATCH /api/v1/inspection-rounds/{inspectionRoundId}
- DELETE /api/v1/inspection-rounds/{inspectionRoundId}
- POST /api/v1/inspection-rounds/{inspectionRoundId}/confirm-date
- POST /api/v1/inspection-rounds/{inspectionRoundId}/reschedule
- POST /api/v1/inspection-rounds/{inspectionRoundId}/close

Owner Report Tasks:
- GET /api/v1/inspection-rounds/{inspectionRoundId}/owner-report-tasks
- POST /api/v1/inspection-rounds/{inspectionRoundId}/owner-report-tasks/generate
- PATCH /api/v1/owner-report-tasks/{taskId}
- POST /api/v1/owner-report-tasks/{taskId}/link-document
- POST /api/v1/owner-report-tasks/{taskId}/mark-exported
- POST /api/v1/owner-report-tasks/{taskId}/mark-submitted

Inspection Tasks:
- GET /api/v1/inspection-rounds/{inspectionRoundId}/tasks
- POST /api/v1/inspection-rounds/{inspectionRoundId}/tasks
- PATCH /api/v1/inspection-tasks/{taskId}
- POST /api/v1/inspection-rounds/{inspectionRoundId}/tasks/generate-defaults

Attachments:
- GET /api/v1/inspection-rounds/{inspectionRoundId}/attachments
- POST /api/v1/inspection-rounds/{inspectionRoundId}/attachments
- PATCH /api/v1/work-schedule-attachments/{attachmentId}
- DELETE /api/v1/work-schedule-attachments/{attachmentId}

Calendar:
- GET /api/v1/calendar/inspection-rounds
- GET /api/v1/calendar/inspection-tasks

Required frontend routes:
- /projects/[projectId]/inspections
- /projects/[projectId]/inspections/schedule
- /projects/[projectId]/inspections/new
- /inspections/[inspectionRoundId]
- /inspections/[inspectionRoundId]/edit
- /inspections/[inspectionRoundId]/tasks
- /inspections/[inspectionRoundId]/owner-reports
- /inspections/[inspectionRoundId]/attachments
- /calendar/inspections

Required frontend components:
- InspectionTimeline
- InspectionYearGrid
- InspectionMonthGrid
- InspectionRoundCard
- InspectionRoundTable
- InspectionStatusBadge
- InspectionScheduleGenerator
- InspectionSchedulePreview
- OwnerReportTaskList
- OwnerReportStatusMatrix
- InspectionTaskChecklist
- InspectionReminderPanel
- InspectionRescheduleModal
- WorkScheduleAttachmentPanel
- WorkSchedulePreview
- RoundDependencyStatus
- MilestoneBadge

Business requirements:
1. InspectionSchedule belongs to Project.
2. InspectionRound belongs to Project and optionally to InspectionSchedule.
3. A project cannot have duplicated roundNo.
4. InspectionSchedule preview must not persist data.
5. InspectionSchedule generate must create:
   - one InspectionSchedule
   - N InspectionRound records
   - OwnerReportTask records for owner ProjectParty where requiresSeparateReport is true
   - default InspectionTask records for each round
6. OwnerReportTask is created per owner party per round.
7. Round documentNo defaults to `제{year}-{roundNo two digits}호`.
8. actualInspectionDate, plannedDate, plannedMonth must be separated.
9. Rescheduling must create InspectionRescheduleLog.
10. Submitted round status requires all owner report tasks to be submitted or confirmed.
11. Closed round status should require checklist/documents/photos to be completed when those modules exist.
12. WorkScheduleAttachment links FileAsset to Project and optionally to InspectionRound.
13. Calendar endpoint returns rounds and tasks in a date range.
14. All status changes should create AuditLog.
15. Milestone labels such as `1차기성` and `준공금` should be exposed on round cards.

Seed data:
Create inspection schedule for the Leeum elevator replacement project:
- scheduleName: 리움미술관 승강기 교체공사 공사안전보건대장 이행점검
- basisType: contract_period
- cycleText: 3개월 이내 1회
- totalRounds: 10
- rounds:
  - 1: 2026-01, plannedDate 2026-01-23, actualInspectionDate 2026-01-23, documentNo 제2026-01호
  - 2: 2026-04
  - 3: 2026-07
  - 4: 2026-10, milestone 1차기성
  - 5: 2027-01
  - 6: 2027-04
  - 7: 2027-07
  - 8: 2027-10
  - 9: 2028-01
  - 10: 2028-02, milestone 준공금
- owner report tasks for:
  - 삼성문화재단
  - 삼성생명공익재단

Validation:
1. projectId is required.
2. totalRounds must be greater than 0.
3. roundNo must be unique in the project.
4. ownerPartyId must refer to a ProjectParty with role owner.
5. mark-submitted requires submittedAt or mailThreadId.
6. reschedule requires reason.
7. close requires dependency check.
8. preview endpoint must not mutate repositories.

Tests:
- test_inspection_schedule_preview_success
- test_inspection_schedule_preview_does_not_persist
- test_inspection_schedule_generate_10_rounds
- test_inspection_round_no_unique_per_project
- test_inspection_round_document_no_generation
- test_inspection_schedule_generates_owner_report_tasks
- test_owner_report_task_created_only_for_separate_report_owner
- test_inspection_task_defaults_created
- test_inspection_reschedule_creates_log
- test_round_submitted_requires_all_owner_reports_submitted
- test_round_closed_requires_dependencies
- test_work_schedule_attachment_linked_to_round
- test_calendar_returns_inspection_rounds
- test_milestone_labels_are_exposed

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```


---

## FILE: `docs/aec-erp/03-inspection-schedule/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 점검회차/일정 관리

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "점검회차/일정 관리" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 프로젝트, 계약, 점검회차, 보고서, 웹하드, 메일 제출을 통합 관리하는 ERP
- 점검회차/일정 화면은 공사안전보건대장 이행점검의 전체 회차와 발주처별 보고서 제출 상태를 관리하는 업무 화면
- 단순 캘린더가 아니라 점검회차, 업무, 보고서, 사진대지, 제출 이력이 연결된 화면

화면 1: 프로젝트 점검회차 목록
- 좌측 ERP 사이드바
- 상단 프로젝트 요약 헤더
- 요약 카드:
  - 총 점검회차
  - 완료 회차
  - 다음 점검
  - 미제출 보고서
  - 미조치 지적사항
- 중앙에는 연도/월 timeline
- 아래에는 점검회차 table
- 우측에는 오늘 필요한 업무 패널

점검회차 table 컬럼:
- 회차
- 문서번호
- 예정월
- 점검일
- 담당자
- 발주처별 보고서 상태
- 체크리스트 상태
- 지적사항 수
- 사진대지
- 보고서 상태
- milestone
- 회차 상태

화면 2: 점검 일정 생성
- 기준 선택 card:
  - 프로젝트 공사기간 기준
  - 계약기간 기준
  - 수동 입력
- 점검주기 입력
- 총 점검회차 입력
- 회차별 예정월 grid
- 첫 점검일 입력
- 발주처별 보고서 자동 생성 toggle
- 일정 미리보기 panel
- 생성 버튼
- 누락정보 warning panel

화면 3: 점검회차 상세
- 상단에 회차, 문서번호, 프로젝트명, 점검일, 상태 표시
- 탭:
  - 개요
  - 업무
  - 발주처별 보고서
  - 체크리스트
  - 지적사항
  - 사진대지
  - 공사일정 첨부
  - 이력
- 개요 탭에는 점검일, 담당자, 확인자, 시공사 참석자, 회차 상태를 보여준다.
- 업무 탭에는 D-30부터 D+14까지 업무 checklist를 보여준다.
- 발주처별 보고서 탭에는 삼성문화재단, 삼성생명공익재단 같은 발주처별 문서 상태를 matrix로 보여준다.

화면 4: 캘린더
- 월간 캘린더
- 주간 캘린더
- 리스트 보기
- 프로젝트/담당자/발주처/상태 필터
- 점검일, 보고서 마감일, 조치 마감일을 다른 badge로 표시

화면 5: 공사일정 첨부
- 공사일정 이미지 또는 도면 preview
- 연도별 attachment list
- 회차 연결
- 강조 영역 표시
- 웹하드 위치 표시

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- timeline은 명확하고 정돈된 형태
- 일정 지연과 미제출은 빨간색/주황색으로 강조
- 완료 상태는 초록색
- 검토중은 보라색
- 정보 밀도는 높되 상태 badge로 빠르게 파악 가능하게 한다.
- 공공/대기업 제출 업무에 어울리는 신뢰감 있는 디자인
- 한글 가독성을 최우선으로 한다.

상태 표현:
- planned: gray
- scheduled: blue
- in_progress: blue outline
- checked: teal
- review: purple
- report_ready: indigo
- submitted: green
- closed: dark green
- cancelled: gray
- delayed: red

결과물:
- 점검회차 목록 화면
- 점검 일정 생성 화면
- 점검회차 상세 화면
- 발주처별 보고서 상태 matrix
- 일정 캘린더 화면
- 공사일정 첨부 preview 화면
- 일정 변경 modal
```


---

## FILE: `docs/aec-erp/03-inspection-schedule/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 점검회차/일정 관리

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
점검회차/일정 관리

기능 설명:
점검회차/일정 관리는 프로젝트의 공사기간, 계약기간, 점검주기, 총 점검회차, 발주처별 보고서 제출 조건을 기준으로 공사안전보건대장 이행점검 일정을 생성하고 관리하는 기능이다.

업무 맥락:
- 점검회차는 Project에 속한다.
- 점검회차는 Contract의 점검횟수, 계약기간, 지급조건 milestone과 연결될 수 있다.
- 발주처가 여러 개인 경우 회차마다 발주처별 보고서 업무가 생성되어야 한다.
- 같은 회차라도 삼성문화재단 보고서와 삼성생명공익재단 보고서가 별도 생성될 수 있다.
- 점검회차는 체크리스트, 지적사항, 사진대지, 보고서 자동화, 메일 제출의 기준키다.
- 공사일정 도면이나 첨부자료는 Project 또는 InspectionRound에 연결될 수 있다.
- 일정 변경은 이력을 남겨야 한다.

입력:
{
  "featureName": "점검회차/일정 관리",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "mailRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `inspection.schedule.management`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 계약/견적
    - 현장점검 체크리스트
    - 보고서 자동화
    - 지적사항/사진대지
    - 산업안전보건관리비
    - 웹하드
    - 메일함
    - 결재/제출
    - 대시보드

출력 JSON:
{
  "featureId": "inspection.schedule.management",
  "featureName": "점검회차/일정 관리",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /projects/[projectId]/inspections
- /projects/[projectId]/inspections/schedule
- /projects/[projectId]/inspections/new
- /inspections/[inspectionRoundId]
- /inspections/[inspectionRoundId]/edit
- /inspections/[inspectionRoundId]/tasks
- /inspections/[inspectionRoundId]/owner-reports
- /inspections/[inspectionRoundId]/attachments
- /calendar/inspections

반드시 포함할 models:
- InspectionSchedule
- InspectionRound
- InspectionOwnerReportTask
- InspectionTask
- WorkScheduleAttachment
- InspectionRescheduleLog
- InspectionRoundMilestone
- Project
- Contract
- ProjectParty
- FileAsset
- AuditLog

반드시 포함할 prompts:
- inspection-schedule-generation
- inspection-schedule implementation prompt
- inspection-schedule design prompt

반드시 포함할 tests:
- test_inspection_schedule_preview_success
- test_inspection_schedule_preview_does_not_persist
- test_inspection_schedule_generate_10_rounds
- test_inspection_round_no_unique_per_project
- test_inspection_round_document_no_generation
- test_inspection_schedule_generates_owner_report_tasks
- test_owner_report_task_created_only_for_separate_report_owner
- test_inspection_task_defaults_created
- test_inspection_reschedule_creates_log
- test_round_submitted_requires_all_owner_reports_submitted
- test_round_closed_requires_dependencies
- test_work_schedule_attachment_linked_to_round
- test_calendar_returns_inspection_rounds
- test_milestone_labels_are_exposed

주의:
- InspectionRound는 Project 없이 생성될 수 없다.
- 예정월, 예정일, 실제 점검일을 혼동하지 않는다.
- 발주처별 보고서 업무는 InspectionRound와 ownerPartyId를 모두 가져야 한다.
- 회차 상태와 발주처별 보고서 상태를 혼동하지 않는다.
- 일정 미리보기는 저장하지 않는다.
- 일정 변경은 반드시 InspectionRescheduleLog를 남긴다.
- 문서번호는 자동 생성하되 사용자가 수정할 수 있어야 한다.
- 점검회차는 체크리스트, 지적사항, 사진대지, 보고서 자동화의 핵심 연결키다.
```


---

## FILE: `docs/aec-erp/04-safety-health-ledger-report/README.md`

# 기능 04 — 공사안전보건대장 이행확인 보고서 자동화

이 폴더는 A&C 기술사 ERP의 네 번째 기능인 `공사안전보건대장 이행확인 보고서 자동화` 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

공사안전보건대장 이행확인 보고서 자동화는 프로젝트 원장, 계약, 점검회차, 발주처, 체크리스트, 지적사항, 조치현황, 사진대지, 산업안전보건관리비, 공사일정 첨부자료를 조합하여 **발주처별 제출용 보고서**를 생성하는 기능이다.

샘플 문서 기준 핵심 구조:

- 문서번호: 제2026-01호
- 점검회차: 제1회
- 점검일: 2026.01.23
- 보고서 분기: 삼성문화재단 / 삼성생명공익재단
- 주요 섹션: 표지, 공사개요, 점검표, 이행여부 확인서, 위험성 감소대책, 추가 유해·위험요인, 산업안전보건관리비, 사진대지, 공사일정 첨부

핵심 연결키는 `inspectionRoundId + ownerPartyId`이다. 같은 회차라도 발주처별 보고서가 따로 생성되어야 한다.


---

## FILE: `docs/aec-erp/04-safety-health-ledger-report/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 공사안전보건대장 이행확인 보고서 자동화

## 1. 기능 정의

공사안전보건대장 이행확인 보고서 자동화는 A&C 기술사 ERP의 핵심 문서 생성 기능이다.

이 기능은 하나의 `InspectionRound`와 하나의 `ownerPartyId`를 기준으로 발주처별 보고서 초안을 만들고, 섹션별 검토·수정·확정·export·제출까지 연결한다.

```text
Project
→ ProjectParty(owner)
→ InspectionRound
→ ChecklistSession / ChecklistResult
→ Finding / CorrectiveAction / EvidencePhoto
→ SafetyCostUsage
→ SafetyReport DocumentInstance
→ FileAsset
→ Submission / MailThread
```

## 2. 이 기능이 필요한 이유

A&C 업무에서는 동일한 현장과 동일한 점검회차라도 발주처별로 보고서가 분리된다.

```text
제1회 점검 / 2026.01.23
├── 삼성문화재단 보고서
└── 삼성생명공익재단 보고서
```

두 보고서는 프로젝트명, 점검일, 시공사, 일부 점검표 결과처럼 공통 데이터를 공유하지만 다음 값은 발주처별로 달라질 수 있다.

- 발주자명
- 확인자
- 발주처별 공사내용 또는 관리 범위
- 발주처별 공사금액
- 발주처별 공정율
- 산업안전보건관리비 계상금액
- 산업안전보건관리비 사용금액
- 산업안전보건관리비 사용률
- 보완 필요 사항
- 사진대지에 들어갈 지적/조치 항목
- 제출 메일 수신자와 제출 이력

따라서 보고서 생성 기준은 단순히 `projectId`가 아니라 반드시 `inspectionRoundId + ownerPartyId` 조합이어야 한다.

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 대표/건설안전기술사 | 보고서 최종 검토, 서명/날인, 제출 승인 |
| 점검 담당자 | 점검 결과, 강평, 지적사항, 조치현황, 사진 확인 |
| 문서 작성자 | 보고서 초안 생성, 섹션별 편집, 누락정보 보완, export |
| 계약/행정 담당자 | 발주처별 최종본 관리, 제출 메일 작성, 웹하드 보관 |
| 발주처 담당자 | 해당 발주처 보고서 수신 및 확인 |

## 4. 핵심 문서 구조

샘플 보고서 기준 섹션은 다음과 같다.

```text
1. 표지
2. 공사안전보건대장 이행 확인 점검표
3. 공사개요
4. 현장전경 및 점검사항/강평
5. 공통 점검표
6. 건축·토목 점검표
7. 건설기계 점검표
8. 공사안전보건대장 이행여부 확인서
9. 유해·위험방지계획에 따른 위험성 감소대책 이행확인
10. 추가 유해·위험요인 점검리스트
11. 산업안전보건관리비 사용 내용 확인
12. 발주자 참여 현장 안전보건활동
13. 발주자의 근로자 상담
14. 발주자가 고용한 안전보건 전문가 현황
15. 중대재해 관리
16. 지적사항/조치현황 사진대지
17. 공사일정 첨부
```

## 5. 핵심 기능

### 5.1 보고서 생성 마법사

```text
프로젝트 선택
→ 점검회차 선택
→ 발주처 선택
→ 템플릿 선택
→ 연결 데이터 확인
→ 누락정보 확인
→ 보고서 초안 생성
→ 섹션별 검토
→ 확정
→ PDF/HWPX export
→ 웹하드 저장
→ 메일 제출
```

### 5.2 발주처별 보고서 분기

`ProjectParty.requiresSeparateReport = true`인 발주처는 발주처별 보고서 생성 대상이다.

발주처별 분기 변수 예시:

```text
owner.name
owner.contact
owner.confirmName
owner.constructionScope
owner.shareAmount
owner.progressRate
owner.safetyCost.calculatedAmount
owner.safetyCost.usedAmount
owner.safetyCost.usedRate
owner.findings
owner.photoLedger
```

### 5.3 누락정보 패널

보고서 생성 전 다음 필드를 확인한다.

- 프로젝트명
- 현장주소
- 시공사
- 발주처
- 발주처별 확인자
- 점검일
- 공사기간
- 공정율
- 총 공사금액
- 발주처별 공사금액
- 점검표 결과
- 총평
- 산업안전보건관리비 사용내역
- 사진대지 지적사진/조치사진
- 서명/날인 정보

### 5.4 섹션별 편집

보고서는 섹션 단위로 편집하고 확정한다.

```text
not_started
→ ai_draft
→ edited
→ review
→ confirmed
→ locked
```

각 섹션은 원본 데이터와 연결되어야 하며, 원본이 변경되면 `stale_linked_data` 경고를 띄운다.

### 5.5 점검표 자동 반영

현장점검 체크리스트 결과를 보고서 점검표에 반영한다.

```text
good           → 양호
caution        → 주의
bad            → 불량
not_applicable → 해당없음
not_checked    → 미점검
```

주의/불량 항목은 `FindingCandidate` 또는 기존 `Finding`과 연결한다.

### 5.6 총평 자동 작성

총평은 다음 구조를 기본으로 한다.

```text
1. 현장관리
   1) 안전관리 체계
   2) 신규자 관리

2. 문서관리
   1) 이행 점검
   2) 법적 서류
   3) 예산 관리

3. 보완 필요
   1) 지적사항 요약
   2) 조치 필요사항
```

### 5.7 산업안전보건관리비 자동 반영

입력값:

- 계상금액
- 사용금액
- 기준월/기준일
- 사용률
- 관련근거
- 적정성 의견

자동 계산:

```text
usedRate = usedAmount / calculatedAmount * 100
```

계산값과 입력값이 다르면 경고한다.

### 5.8 사진대지 자동 반영

`Finding`과 `CorrectiveAction`에 연결된 사진을 보고서 사진대지로 배치한다.

사진대지 항목:

- 회차명
- 점검일
- 지적사항
- 조치현황
- 지적사진
- 조치사진
- 마크업 정보
- 캡션

### 5.9 Export 및 제출

지원 형식:

- PDF
- HWPX
- DOCX optional
- Markdown internal snapshot
- JSON document snapshot

Export 후 처리:

```text
DocumentInstance.status = exported
FileAsset 생성
웹하드 /프로젝트명/08_최종본 저장
InspectionOwnerReportTask.exportedFileId 연결
Submission 또는 MailThread 연결
```

## 6. 문서 상태

| 상태 | 의미 |
|---|---|
| draft | 초안 생성 |
| ai_draft | AI 초안 포함 |
| editing | 사용자 수정중 |
| review | 내부 검토중 |
| confirmed | 확정 |
| exported | 최종본 생성 |
| submitted | 발주처 제출 완료 |
| archived | 보관 |

## 7. 완료 기준

- 점검회차와 발주처를 선택하여 보고서 초안을 생성할 수 있다.
- 동일 회차에서 발주처별 보고서가 따로 생성된다.
- 공사개요, 점검표, 이행여부 확인서, 위험성 감소대책, 추가 유해·위험요인, 산업안전보건관리비, 사진대지를 포함한다.
- 누락정보가 있으면 export를 막거나 경고한다.
- AI 초안은 사용자가 검토·확정해야 한다.
- 최신 저장본 기준으로 export한다.
- export 파일은 웹하드 최종본 폴더에 저장된다.
- 제출 메일과 Submission 이력으로 연결된다.


---

## FILE: `docs/aec-erp/04-safety-health-ledger-report/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 공사안전보건대장 이행확인 보고서 자동화

## 1. Frontend Routes

```text
/projects/[projectId]/documents/safety-reports
/projects/[projectId]/documents/safety-reports/new
/documents/safety-reports/[documentId]
/documents/safety-reports/[documentId]/edit
/documents/safety-reports/[documentId]/preview
/documents/safety-reports/[documentId]/sections
/documents/safety-reports/[documentId]/variables
/documents/safety-reports/[documentId]/export
/documents/safety-reports/[documentId]/submission
/inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document
```

## 2. Frontend Components

```text
SafetyReportListPage
SafetyReportCreatePage
SafetyReportEditorPage
SafetyReportPreviewPage
SafetyReportExportPage
SafetyReportWizard
InspectionRoundSelector
OwnerPartySelector
ReportTemplateSelector
ReportRequiredDataPanel
MissingFieldPanel
OwnerReportBranchNotice
DocumentSectionNavigator
DocumentSectionEditor
A4ReportPreview
ReportVariablePanel
ReportGenerateButton
ReportSaveBar
ReportExportBar
ReportVersionHistory
ReportStatusBadge
CoverSectionEditor
ProjectSummarySectionEditor
SitePhotoSummarySectionEditor
ChecklistSectionEditor
ConfirmationSectionEditor
RiskReductionChecklistEditor
AdditionalHazardChecklistEditor
SafetyCostSectionEditor
PhotoLedgerSectionEditor
ScheduleAttachmentSectionEditor
```

## 3. Backend APIs

### Safety Reports

```text
GET    /api/v1/projects/{projectId}/safety-reports
POST   /api/v1/safety-reports/draft
GET    /api/v1/safety-reports/{documentId}
PATCH  /api/v1/safety-reports/{documentId}
DELETE /api/v1/safety-reports/{documentId}
POST   /api/v1/safety-reports/{documentId}/generate
POST   /api/v1/safety-reports/{documentId}/validate
POST   /api/v1/safety-reports/{documentId}/save-section
POST   /api/v1/safety-reports/{documentId}/sections/{sectionKey}/regenerate
POST   /api/v1/safety-reports/{documentId}/confirm
POST   /api/v1/safety-reports/{documentId}/export
POST   /api/v1/safety-reports/{documentId}/clone-for-owner
```

### Required Data

```text
GET /api/v1/inspection-rounds/{inspectionRoundId}/safety-report-required-data
GET /api/v1/inspection-rounds/{inspectionRoundId}/owner-report-branches
GET /api/v1/safety-reports/{documentId}/missing-fields
GET /api/v1/safety-reports/{documentId}/variables
```

### Linked Data

```text
GET  /api/v1/safety-reports/{documentId}/checklist-results
GET  /api/v1/safety-reports/{documentId}/findings
GET  /api/v1/safety-reports/{documentId}/photo-ledger
GET  /api/v1/safety-reports/{documentId}/safety-cost
POST /api/v1/safety-reports/{documentId}/refresh-linked-data
```

### Submission Link

```text
POST /api/v1/safety-reports/{documentId}/link-owner-report-task
POST /api/v1/safety-reports/{documentId}/mark-submitted
```

## 4. Data Models

### SafetyReportDraftRequest

```ts
type SafetyReportDraftRequest = {
  projectId: string
  inspectionRoundId: string
  ownerPartyId: string
  templateId: string
  ownerReportTaskId?: string
  generationMode: 'from_linked_data' | 'blank' | 'clone_from_existing'
  cloneFromDocumentId?: string
}
```

### DocumentInstance

```ts
type DocumentStatus =
  | 'draft'
  | 'ai_draft'
  | 'editing'
  | 'review'
  | 'confirmed'
  | 'exported'
  | 'submitted'
  | 'archived'

type DocumentInstance = {
  id: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId: string
  ownerReportTaskId?: string
  templateId: string
  documentType: 'safety_health_ledger_inspection_report'
  title: string
  documentNo?: string
  roundNo: number
  status: DocumentStatus
  contentSnapshot: SafetyReportSnapshot
  latestVersionNo: number
  exportedFileId?: string
  submittedAt?: string
  createdAt: string
  updatedAt: string
}
```

### SafetyReportSnapshot

```ts
type SafetyReportSnapshot = {
  meta: SafetyReportMeta
  variables: Record<string, unknown>
  sections: SafetyReportSection[]
  missingFields: MissingField[]
  reviewWarnings: ReviewWarning[]
  sourceLinks: SourceLink[]
}
```

### SafetyReportSection

```ts
type SafetyReportSectionKey =
  | 'cover'
  | 'project_summary'
  | 'site_photo_summary'
  | 'inspection_checklist'
  | 'implementation_confirmation'
  | 'risk_reduction_checklist'
  | 'additional_hazard_checklist'
  | 'safety_cost_usage'
  | 'owner_safety_activity'
  | 'worker_consultation'
  | 'hired_safety_expert'
  | 'serious_accident_management'
  | 'photo_ledger'
  | 'schedule_attachments'

type SafetyReportSection = {
  id: string
  key: SafetyReportSectionKey
  title: string
  status: 'not_started' | 'ai_draft' | 'edited' | 'review' | 'confirmed' | 'locked'
  order: number
  content: Record<string, unknown>
  sourceEntityRefs: SourceLink[]
  updatedAt: string
}
```

### MissingField

```ts
type MissingField = {
  field: string
  label: string
  severity: 'required' | 'recommended' | 'optional'
  sectionKey: SafetyReportSectionKey
  reason: string
  sourceEntityType?: string
  sourceEntityId?: string
}
```

### ReviewWarning

```ts
type ReviewWarning = {
  type:
    | 'missing_required_data'
    | 'owner_specific_data_mismatch'
    | 'stale_linked_data'
    | 'photo_pair_missing'
    | 'safety_cost_rate_mismatch'
    | 'checklist_finding_mismatch'
    | 'legal_text_review_required'
  message: string
  sectionKey?: SafetyReportSectionKey
  severity: 'info' | 'warning' | 'danger'
}
```

### SafetyReportVersion

```ts
type SafetyReportVersion = {
  id: string
  documentId: string
  versionNo: number
  contentSnapshot: SafetyReportSnapshot
  createdBy: string
  createdAt: string
  changeSummary?: string
}
```

## 5. Validation Rules

### Draft Creation

- `projectId`는 필수다.
- `inspectionRoundId`는 필수다.
- `ownerPartyId`는 필수다.
- `ownerPartyId`는 해당 project의 owner ProjectParty여야 한다.
- 같은 `inspectionRoundId + ownerPartyId` 조합의 active 문서가 이미 있으면 중복 생성 경고 또는 차단을 제공한다.

### Required Fields

최종 export 전 필수:

```text
projectName
siteAddress
contractorName
ownerName
inspectionDate
roundNo
documentNo
writerName
confirmerName
constructionPeriod
constructionAmount
ownerConstructionAmount
progressRate
checklistResults
safetyCostUsage
```

### Export Validation

- required missingFields가 있으면 final export를 막는다.
- 필수 섹션이 `not_started`이면 export를 막는다.
- export는 최신 저장 `contentSnapshot` 기준으로 수행한다.
- exported 파일은 `FileAsset`으로 생성되어야 한다.

## 6. Service Rules

### Draft Generation Flow

```text
1. Project 조회
2. InspectionRound 조회
3. Owner ProjectParty 조회
4. Contract / Contact 조회
5. ChecklistResult 조회
6. Finding / CorrectiveAction 조회
7. EvidencePhoto 조회
8. SafetyCostUsage 조회
9. WorkScheduleAttachment 조회
10. 변수 매핑
11. 누락정보 검출
12. AI 초안 생성
13. DocumentInstance 생성
14. SafetyReportVersion 1 생성
15. OwnerReportTask 연결
```

### Clone For Owner

```text
기존 DocumentInstance 선택
→ targetOwnerPartyId 선택
→ 공통 섹션 복사
→ owner-specific 변수 교체
→ owner-specific missingFields 재검증
→ 새 DocumentInstance 생성
```

### Export Flow

```text
1. editor state 저장
2. 최신 DocumentInstance 재조회
3. validate 실행
4. export renderer 호출
5. PDF/HWPX 파일 생성
6. FileAsset 생성
7. 웹하드 /프로젝트명/08_최종본 저장
8. DocumentInstance.exportedFileId 업데이트
9. OwnerReportTask.status = exported
10. AuditLog 기록
```

## 7. Report Section Data Sources

| 섹션 | 주요 데이터 소스 |
|---|---|
| cover | Project, InspectionRound, ProjectParty, Contact |
| project_summary | Project, ProjectParty, Organization, InspectionRound |
| site_photo_summary | EvidencePhoto, InspectionRound, AI summary |
| inspection_checklist | ChecklistResult, ChecklistItem, Finding |
| implementation_confirmation | Project, OwnerParty, SafetyCostUsage, Finding |
| risk_reduction_checklist | RiskReductionItem, InspectionResult |
| additional_hazard_checklist | Finding, AdditionalRiskItem |
| safety_cost_usage | SafetyCostUsage |
| owner_safety_activity | OwnerSafetyActivity |
| worker_consultation | WorkerConsultation |
| hired_safety_expert | ProjectParty, Contract |
| serious_accident_management | SeriousAccidentRecord |
| photo_ledger | Finding, CorrectiveAction, EvidencePhoto |
| schedule_attachments | WorkScheduleAttachment, FileAsset |

## 8. Tests

```text
test_safety_report_draft_create_success
test_safety_report_requires_project_round_owner
test_safety_report_prevents_duplicate_active_owner_report
test_safety_report_generates_owner_specific_document
test_safety_report_missing_required_fields
test_safety_report_clone_for_owner_replaces_owner_specific_values
test_safety_report_checklist_results_mapped
test_safety_report_finding_photo_ledger_mapped
test_safety_report_safety_cost_rate_calculated
test_safety_report_export_blocked_when_required_missing
test_safety_report_export_uses_latest_saved_snapshot
test_safety_report_export_creates_file_asset
test_safety_report_links_owner_report_task
test_safety_report_mark_submitted_updates_owner_report_task
test_safety_report_refresh_linked_data_detects_stale_source
```


---

## FILE: `docs/aec-erp/04-safety-health-ledger-report/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 공사안전보건대장 이행확인 보고서 자동화

## 1. 화면 목표

공사안전보건대장 이행확인 보고서 자동화 화면은 사용자가 발주처별 보고서 초안을 생성하고, 섹션별로 검토하고, A4 미리보기에서 최종 문서 형태를 확인한 뒤 export/제출까지 수행하는 문서 작업 화면이다.

핵심은 다음 세 가지다.

1. 발주처별 분기 명확화
2. 누락정보와 검토 경고 명확화
3. A4 제출 문서 미리보기 중심 작업

## 2. 화면 목록

### 2.1 보고서 목록

Route:

```text
/projects/[projectId]/documents/safety-reports
```

표시 항목:

| 컬럼 | 설명 |
|---|---|
| 문서번호 | 제2026-01호 |
| 회차 | 제1회 |
| 점검일 | 2026.01.23 |
| 발주처 | 삼성문화재단 등 |
| 문서상태 | draft/review/exported/submitted |
| 누락정보 | required missing count |
| 최종본 | 파일 링크 |
| 제출일 | submittedAt |
| 작성자 | 담당자 |

### 2.2 보고서 생성 마법사

Route:

```text
/projects/[projectId]/documents/safety-reports/new
```

Step:

```text
1. 점검회차 선택
2. 발주처 선택
3. 템플릿 선택
4. 연결 데이터 확인
5. 누락정보 확인
6. 초안 생성
```

### 2.3 보고서 편집

Route:

```text
/documents/safety-reports/[documentId]/edit
```

Layout:

```text
┌─────────────────────────────────────────────────────────┐
│ Top: 문서번호 / 회차 / 발주처 / 상태 / 저장 / export      │
├──────────────┬────────────────────────┬─────────────────┤
│ Section Nav  │ Section Editor         │ A4 Preview      │
│ 240px        │ fluid                  │ 520~720px       │
├──────────────┴────────────────────────┴─────────────────┤
│ Bottom Save Bar / Version / Validation                   │
└─────────────────────────────────────────────────────────┘
```

### 2.4 A4 미리보기

Route:

```text
/documents/safety-reports/[documentId]/preview
```

기능:

- 페이지별 미리보기
- 섹션 이동
- 확대/축소
- 출력 여백 확인
- 표/사진 페이지 깨짐 경고
- 최종본/초안 watermark 표시

### 2.5 변수/누락정보 화면

Route:

```text
/documents/safety-reports/[documentId]/variables
```

표시:

- 변수명
- 값
- 데이터 출처
- 발주처별 값 여부
- 필수 여부
- 수정 가능 여부

### 2.6 Export 화면

Route:

```text
/documents/safety-reports/[documentId]/export
```

구성:

- export 전 체크리스트
- 누락정보
- 검토 경고
- 저장 상태
- output format 선택
- 웹하드 저장 위치
- 최종 파일명 preview
- export 버튼

## 3. UX 규칙

1. 상단에는 항상 `문서번호 / 회차 / 발주처 / 상태`를 표시한다.
2. 발주처별 보고서임을 badge로 명확히 표시한다.
3. AI 초안 섹션은 `AI Draft` badge를 표시한다.
4. 사용자가 수정한 섹션은 `Edited` badge를 표시한다.
5. 확정 섹션은 잠금 아이콘을 표시한다.
6. required missing field가 있으면 final export 버튼을 비활성화한다.
7. linked data가 변경되면 `원본 데이터 변경됨` 경고를 표시한다.
8. A4 미리보기는 실제 제출 문서와 최대한 유사해야 한다.
9. 사진대지는 지적사진/조치사진 한 쌍을 명확히 보여준다.
10. 발주처별 금액과 총 공사금액은 시각적으로 구분한다.

## 4. 핵심 컴포넌트

### SafetyReportWizard

- 점검회차 선택
- 발주처 선택
- 템플릿 선택
- 연결 데이터 확인
- 누락정보 확인
- 초안 생성

### OwnerReportBranchNotice

표시 예:

```text
이 문서는 제1회 점검의 삼성문화재단 제출용 보고서입니다.
같은 회차에 삼성생명공익재단 보고서도 생성할 수 있습니다.
```

### DocumentSectionNavigator

섹션 목록:

```text
표지
공사개요
점검표
이행여부 확인서
위험성 감소대책
추가 유해·위험요인
산업안전보건관리비
사진대지
공사일정 첨부
```

각 섹션 옆에 상태 badge를 표시한다.

### MissingFieldPanel

필드 그룹:

```text
프로젝트 정보
발주처 정보
점검회차 정보
점검표
사진대지
산업안전보건관리비
서명/날인
```

### A4ReportPreview

- 흰색 A4 paper
- 회색 workspace background
- 페이지 그림자
- 페이지 번호
- 초안 watermark
- 확대/축소

### PhotoLedgerSectionEditor

- 지적사항 카드
- 지적 사진
- 조치 사진
- 캡션
- 누락사진 warning
- 사진 순서 변경

## 5. Warning State

### 발주처별 값 누락

```text
이 발주처의 공사금액 또는 산업안전보건관리비 정보가 누락되었습니다.
발주처별 보고서에는 발주처 전용 금액이 필요합니다.
```

### 사진대지 누락

```text
지적사항에 연결된 조치사진이 없습니다.
최종본 export 전에 사진대지 구성을 확인하세요.
```

### 원본 데이터 변경

```text
보고서 생성 이후 점검표 또는 지적사항 데이터가 변경되었습니다.
보고서에 최신 데이터를 반영할지 선택하세요.
```

## 6. Responsive

### Desktop

- Section Nav + Editor + A4 Preview 3-column
- 우측 preview 고정
- 하단 save/export bar 고정

### Tablet

- Section Nav는 drawer
- Editor와 Preview toggle

### Mobile

- 섹션별 카드 편집
- 미리보기는 별도 화면
- export는 제한하거나 검토 전용으로 사용


---

## FILE: `docs/aec-erp/04-safety-health-ledger-report/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 공사안전보건대장 이행확인 보고서 자동화

## 1. Feature

```yaml
featureId: document.safety_health_ledger_report
featureName: 공사안전보건대장 이행확인 보고서 자동화
priority: P0
module: safety-health-ledger-report
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 보고서 목록 | `/projects/[projectId]/documents/safety-reports` | 프로젝트별 이행확인 보고서 조회 |
| 보고서 생성 | `/projects/[projectId]/documents/safety-reports/new` | 점검회차/발주처 선택 후 초안 생성 |
| 보고서 상세 | `/documents/safety-reports/[documentId]` | 문서 요약 및 상태 |
| 보고서 편집 | `/documents/safety-reports/[documentId]/edit` | 섹션별 편집 |
| 보고서 미리보기 | `/documents/safety-reports/[documentId]/preview` | A4 미리보기 |
| 섹션 관리 | `/documents/safety-reports/[documentId]/sections` | 섹션별 상태/재생성 |
| 변수 관리 | `/documents/safety-reports/[documentId]/variables` | 변수와 데이터 출처 확인 |
| Export | `/documents/safety-reports/[documentId]/export` | 최종본 생성 |
| 제출 | `/documents/safety-reports/[documentId]/submission` | 메일 제출/이력 |
| 발주처 업무 연결 | `/inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document` | 회차별 발주처 보고서 업무에서 문서 생성 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| 보고서 목록 | SafetyReportTable, ReportStatusBadge, OwnerReportBranchBadge |
| 보고서 생성 | SafetyReportWizard, InspectionRoundSelector, OwnerPartySelector, ReportTemplateSelector |
| 보고서 상세 | SafetyReportSummaryCard, ReportVersionHistory, ReportLinkedDataPanel |
| 보고서 편집 | DocumentSectionNavigator, DocumentSectionEditor, A4ReportPreview, ReportSaveBar |
| 미리보기 | A4ReportPreview, PageNavigator, PrintLayoutWarningPanel |
| 섹션 관리 | SectionStatusTable, SectionRegenerateButton |
| 변수 관리 | ReportVariablePanel, MissingFieldPanel |
| Export | ReportExportChecklist, ReportExportBar, WebhardSaveLocation |
| 제출 | SubmissionHistory, MailDraftButton, SubmittedFileCard |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| SafetyReportTable | GET `/api/v1/projects/{projectId}/safety-reports` |
| SafetyReportWizard | POST `/api/v1/safety-reports/draft` |
| InspectionRoundSelector | GET `/api/v1/projects/{projectId}/inspection-rounds` |
| OwnerPartySelector | GET `/api/v1/inspection-rounds/{inspectionRoundId}/owner-report-branches` |
| ReportRequiredDataPanel | GET `/api/v1/inspection-rounds/{inspectionRoundId}/safety-report-required-data` |
| MissingFieldPanel | GET `/api/v1/safety-reports/{documentId}/missing-fields` |
| DocumentSectionEditor | POST `/api/v1/safety-reports/{documentId}/save-section` |
| SectionRegenerateButton | POST `/api/v1/safety-reports/{documentId}/sections/{sectionKey}/regenerate` |
| A4ReportPreview | GET `/api/v1/safety-reports/{documentId}` |
| ReportVariablePanel | GET `/api/v1/safety-reports/{documentId}/variables` |
| RefreshLinkedDataButton | POST `/api/v1/safety-reports/{documentId}/refresh-linked-data` |
| ReportExportBar | POST `/api/v1/safety-reports/{documentId}/export` |
| MailDraftButton | POST `/api/v1/safety-reports/{documentId}/mark-submitted` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| POST `/safety-reports/draft` | DocumentInstance, SafetyReportSnapshot, SafetyReportVersion |
| POST `/safety-reports/{id}/generate` | DocumentInstance, SafetyReportSection, SourceLink |
| POST `/safety-reports/{id}/validate` | MissingField, ReviewWarning |
| POST `/safety-reports/{id}/save-section` | SafetyReportSection, SafetyReportVersion |
| POST `/safety-reports/{id}/export` | DocumentInstance, SafetyReportExportJob, FileAsset |
| POST `/safety-reports/{id}/clone-for-owner` | DocumentInstance, ProjectParty |
| GET `/required-data` | Project, InspectionRound, ProjectParty, ChecklistResult, Finding, SafetyCostUsage |
| POST `/refresh-linked-data` | SourceLink, ReviewWarning, SafetyReportSection |
| POST `/mark-submitted` | DocumentInstance, InspectionOwnerReportTask, Submission, MailThread |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| DocumentInstance | safety-report-generation |
| SafetyReportSnapshot | safety-report-generation |
| SafetyReportSection | safety-report-generation |
| Project | safety-report-generation |
| ProjectParty | safety-report-generation |
| InspectionRound | safety-report-generation |
| ChecklistResult | safety-report-generation |
| Finding | safety-report-generation |
| CorrectiveAction | safety-report-generation |
| EvidencePhoto | safety-report-generation |
| SafetyCostUsage | safety-report-generation |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 초안 생성 | test_safety_report_draft_create_success |
| 필수 연결키 검증 | test_safety_report_requires_project_round_owner |
| 중복 방지 | test_safety_report_prevents_duplicate_active_owner_report |
| 발주처별 분기 | test_safety_report_generates_owner_specific_document |
| 누락정보 | test_safety_report_missing_required_fields |
| 타 발주처 복제 | test_safety_report_clone_for_owner_replaces_owner_specific_values |
| 점검표 매핑 | test_safety_report_checklist_results_mapped |
| 사진대지 매핑 | test_safety_report_finding_photo_ledger_mapped |
| 안전관리비 계산 | test_safety_report_safety_cost_rate_calculated |
| export 차단 | test_safety_report_export_blocked_when_required_missing |
| 최신 저장본 export | test_safety_report_export_uses_latest_saved_snapshot |
| 웹하드 저장 | test_safety_report_export_creates_file_asset |
| 발주처 업무 연결 | test_safety_report_links_owner_report_task |
| 제출 상태 | test_safety_report_mark_submitted_updates_owner_report_task |
| 원본 변경 감지 | test_safety_report_refresh_linked_data_detects_stale_source |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ProjectParty, Contact |
| 계약/견적 | contractId, serviceScope, deliverables |
| 점검회차/일정 | inspectionRoundId, ownerReportTaskId |
| 현장점검 체크리스트 | checklistResults |
| 지적사항/조치현황 | Finding, CorrectiveAction |
| 사진대지 | EvidencePhoto, FileAsset |
| 산업안전보건관리비 | SafetyCostUsage |
| 웹하드 | exportedFileId, final folder |
| 메일함 | 제출 메일, MailThread |
| 결재/제출 | Approval, Submission |
| 관리자/템플릿 | DocumentTemplate, PromptTemplate |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 동일 회차 발주처별 보고서 혼동 | inspectionRoundId + ownerPartyId unique active rule |
| 발주처별 금액/공정율 오기 | owner-specific variable validation |
| AI가 법령 문구 생성 | templateSections의 문구만 허용 |
| 점검표와 지적사항 불일치 | checklist_finding_mismatch warning |
| 사진대지 지적/조치 사진 누락 | photo_pair_missing warning |
| 오래된 원본 데이터로 export | stale_linked_data 감지 및 save-before-export |
| 최종본/초안 혼동 | status badge와 Draft watermark |
| 웹하드 저장 누락 | export 후 FileAsset 생성 필수 |


---

## FILE: `docs/aec-erp/04-safety-health-ledger-report/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 공사안전보건대장 이행확인 보고서 생성

## Prompt ID

`safety-report-generation`

## 목적

프로젝트, 점검회차, 발주처, 점검표, 지적사항, 조치현황, 사진, 산업안전보건관리비, 공사일정 첨부자료를 바탕으로 공사안전보건대장 이행확인 보고서 초안을 생성한다.

## Prompt

```text
너는 A&C기술사사무소 ERP의 공사안전보건대장 이행확인 보고서 작성 보조 엔진이다.

입력:
- project
- ownerParty
- ownerOrganization
- contractorOrganization
- engineerOrganization
- contacts
- contract
- inspectionRound
- checklistResults
- findings
- correctiveActions
- evidencePhotos
- safetyCostUsage
- ownerSafetyActivities
- workerConsultations
- hiredSafetyExperts
- seriousAccidentRecords
- workScheduleAttachments
- templateSections
- userInstruction

목표:
선택한 점검회차와 발주처 기준으로 공사안전보건대장 이행확인 보고서 초안을 생성한다.

반드시 생성할 섹션:
1. 표지
2. 공사개요
3. 현장전경 및 점검사항/강평
4. 공사안전보건대장 이행 확인 점검표
5. 공사안전보건대장 이행여부 확인서
6. 유해·위험방지계획에 따른 위험성 감소대책 이행확인
7. 추가 유해·위험요인 점검리스트
8. 산업안전보건관리비 사용 내용 확인
9. 발주자 참여 현장 안전보건활동
10. 발주자의 근로자 상담
11. 발주자가 고용한 안전보건 전문가 현황
12. 중대재해 관리
13. 지적사항/조치현황 사진대지
14. 공사일정 첨부

작성 규칙:
- 입력에 없는 사실을 만들지 않는다.
- 날짜, 금액, 기관명, 법령 문구는 입력값 또는 템플릿값만 사용한다.
- 법령 문구는 templateSections에 있는 문구를 그대로 사용한다.
- 발주처별로 다른 값은 반드시 ownerParty 기준으로 작성한다.
- 같은 점검회차라도 ownerParty가 다르면 발주자명, 확인자, 공사내용, 발주처별 공사금액, 산업안전보건관리비를 분리한다.
- 점검표 결과는 양호/주의/불량/해당없음/미점검 중 하나로 표시한다.
- 주의/불량 항목은 지적사항 및 의견에 반영한다.
- 총평은 현장관리, 문서관리, 보완 필요로 나누어 작성한다.
- 사진대지는 지적사항과 조치현황이 한 쌍이 되도록 구성한다.
- 지적 사진 또는 조치 사진이 누락되면 warnings에 표시한다.
- 산업안전보건관리비 사용률은 계산값과 입력값이 다르면 warnings에 표시한다.
- 확인자 이름이나 연락처가 없으면 missingFields에 표시한다.
- 최종본이 아니라 검토용 초안으로 작성한다.

출력 JSON:
{
  "documentTitle": "",
  "documentNo": "",
  "roundNo": null,
  "inspectionDate": null,
  "ownerName": "",
  "sections": [
    {
      "sectionKey": "cover",
      "title": "",
      "status": "ai_draft",
      "content": {}
    }
  ],
  "tables": [
    {
      "sectionKey": "",
      "tableTitle": "",
      "columns": [],
      "rows": []
    }
  ],
  "photoLedger": [
    {
      "findingId": "",
      "findingTitle": "",
      "findingCaption": "",
      "actionCaption": "",
      "findingPhotoIds": [],
      "actionPhotoIds": [],
      "warnings": []
    }
  ],
  "variablesUsed": [
    {
      "variable": "",
      "value": "",
      "sourceEntityType": "",
      "sourceEntityId": ""
    }
  ],
  "missingFields": [
    {
      "field": "",
      "label": "",
      "sectionKey": "",
      "severity": "required | recommended | optional",
      "reason": ""
    }
  ],
  "reviewWarnings": [
    {
      "type": "",
      "sectionKey": "",
      "severity": "info | warning | danger",
      "message": ""
    }
  ]
}
```

## 섹션별 작성 기준

### 1. 표지

```text
documentNo
보고서명
roundNo
inspectionDate
writerName
writerRole
confirmerOrganization
confirmerName
projectName
footerTitle
```

### 2. 공사개요

```text
사업명
현장주소
시공사
공사금액
발주처별 공사금액
발주자
공사기간
실착공일
규모
공정율
현장전경
총평
```

### 3. 점검표

점검 분야:

```text
공통
건축·토목
건설기계
```

확인결과:

```text
양호
주의
불량
해당없음
미점검
```

### 4. 이행여부 확인서 총평

```text
1. 현장관리
  1) 안전관리 체계
  2) 신규자 관리

2. 문서관리
  1) 이행 점검
  2) 법적 서류
  3) 예산 관리

3. 보완 필요
  1) ...
  2) ...
```

### 5. 산업안전보건관리비

```text
계상금액 ￦{calculatedAmount} 중 {usedAmount}원 {usedRate}% ({basisMonth} 기준)
관련근거: {basisDocument}
적정성: {appropriatenessComment}
```

### 6. 사진대지

```text
제{roundNo}회({inspectionDate}) 공사안전보건대장 이행여부 확인
지적 사항: {findingTitle}
조치 현황: {correctiveActionDetail}
```

## 금지사항

- 입력에 없는 법률 조항을 새로 쓰지 않는다.
- 실제 점검하지 않은 항목을 양호로 단정하지 않는다.
- 발주처별 금액을 총 공사금액과 혼동하지 않는다.
- 사진이 없는 지적사항에 사진이 있는 것처럼 작성하지 않는다.
- 조치가 확인되지 않은 항목을 조치완료로 표현하지 않는다.
- AI 초안을 최종본처럼 표현하지 않는다.


---

## FILE: `docs/aec-erp/04-safety-health-ledger-report/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 공사안전보건대장 이행확인 보고서 자동화

## Prompt

```text
You are implementing the Safety Health Ledger Inspection Report Automation module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module creates owner-specific construction safety health ledger inspection reports from project, inspection round, checklist, finding, corrective action, photo, safety cost, and schedule attachment data.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Safety Report Automation module.

Existing concepts:
- Project
- Organization
- ProjectParty
- Contact
- Contract
- InspectionRound
- InspectionOwnerReportTask
- ChecklistItem
- ChecklistResult
- Finding
- CorrectiveAction
- EvidencePhoto
- SafetyCostUsage
- FileAsset
- Folder
- MailThread
- Submission
- AuditLog

Required backend models:
- DocumentInstance
- SafetyReportSnapshot
- SafetyReportMeta
- SafetyReportSection
- SafetyReportVersion
- MissingField
- ReviewWarning
- SourceLink
- SafetyReportExportJob

Required backend APIs:

Safety Reports:
- GET /api/v1/projects/{projectId}/safety-reports
- POST /api/v1/safety-reports/draft
- GET /api/v1/safety-reports/{documentId}
- PATCH /api/v1/safety-reports/{documentId}
- DELETE /api/v1/safety-reports/{documentId}
- POST /api/v1/safety-reports/{documentId}/generate
- POST /api/v1/safety-reports/{documentId}/validate
- POST /api/v1/safety-reports/{documentId}/save-section
- POST /api/v1/safety-reports/{documentId}/sections/{sectionKey}/regenerate
- POST /api/v1/safety-reports/{documentId}/confirm
- POST /api/v1/safety-reports/{documentId}/export
- POST /api/v1/safety-reports/{documentId}/clone-for-owner

Required Data:
- GET /api/v1/inspection-rounds/{inspectionRoundId}/safety-report-required-data
- GET /api/v1/inspection-rounds/{inspectionRoundId}/owner-report-branches
- GET /api/v1/safety-reports/{documentId}/missing-fields
- GET /api/v1/safety-reports/{documentId}/variables

Linked Data:
- GET /api/v1/safety-reports/{documentId}/checklist-results
- GET /api/v1/safety-reports/{documentId}/findings
- GET /api/v1/safety-reports/{documentId}/photo-ledger
- GET /api/v1/safety-reports/{documentId}/safety-cost
- POST /api/v1/safety-reports/{documentId}/refresh-linked-data

Submission Link:
- POST /api/v1/safety-reports/{documentId}/link-owner-report-task
- POST /api/v1/safety-reports/{documentId}/mark-submitted

Required frontend routes:
- /projects/[projectId]/documents/safety-reports
- /projects/[projectId]/documents/safety-reports/new
- /documents/safety-reports/[documentId]
- /documents/safety-reports/[documentId]/edit
- /documents/safety-reports/[documentId]/preview
- /documents/safety-reports/[documentId]/sections
- /documents/safety-reports/[documentId]/variables
- /documents/safety-reports/[documentId]/export
- /documents/safety-reports/[documentId]/submission
- /inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document

Required frontend components:
- SafetyReportWizard
- InspectionRoundSelector
- OwnerPartySelector
- ReportTemplateSelector
- ReportRequiredDataPanel
- MissingFieldPanel
- OwnerReportBranchNotice
- DocumentSectionNavigator
- DocumentSectionEditor
- A4ReportPreview
- ReportVariablePanel
- ReportGenerateButton
- ReportSaveBar
- ReportExportBar
- ReportVersionHistory
- ReportStatusBadge
- PhotoLedgerSectionEditor
- SafetyCostSectionEditor

Business requirements:
1. A Safety Report must belong to Project, InspectionRound, and owner ProjectParty.
2. Same inspectionRoundId can have multiple reports, one per ownerPartyId.
3. Duplicate active document for inspectionRoundId + ownerPartyId should show warning or be blocked.
4. Report generation must collect linked data from Project, OwnerParty, InspectionRound, Checklist, Findings, Actions, Photos, SafetyCost, and Attachments.
5. Report sections must be editable independently.
6. Missing required fields must be shown before generation and export.
7. AI generated text is draft only.
8. Legal text must come from template section text, not invented by AI.
9. Export must use the latest saved contentSnapshot.
10. Export must create FileAsset in webhard final folder.
11. Export should update OwnerReportTask.status to exported.
12. Mark submitted should update DocumentInstance and OwnerReportTask.
13. Clone-for-owner should copy common sections and replace owner-specific variables.
14. Refresh linked data should detect stale source data and let user apply changes.

Validation:
1. projectId, inspectionRoundId, ownerPartyId, templateId are required.
2. ownerPartyId must be an owner ProjectParty in the project.
3. Required fields must be present before final export.
4. safetyCost usedRate must be recalculated and compared.
5. photo ledger requires finding/action pair for final export unless user confirms exception.
6. section status must not be not_started for required sections.
7. submitted status requires exportedFileId.

Seed data:
Create two demo report branches for Leeum elevator replacement project:
- inspectionRound: roundNo 1, documentNo 제2026-01호, inspectionDate 2026-01-23
- owner branch 1: 삼성문화재단
- owner branch 2: 삼성생명공익재단

Tests:
- test_safety_report_draft_create_success
- test_safety_report_requires_project_round_owner
- test_safety_report_prevents_duplicate_active_owner_report
- test_safety_report_generates_owner_specific_document
- test_safety_report_missing_required_fields
- test_safety_report_clone_for_owner_replaces_owner_specific_values
- test_safety_report_checklist_results_mapped
- test_safety_report_finding_photo_ledger_mapped
- test_safety_report_safety_cost_rate_calculated
- test_safety_report_export_blocked_when_required_missing
- test_safety_report_export_uses_latest_saved_snapshot
- test_safety_report_export_creates_file_asset
- test_safety_report_links_owner_report_task
- test_safety_report_mark_submitted_updates_owner_report_task
- test_safety_report_refresh_linked_data_detects_stale_source

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Safety report generation service
- Validation service
- Export service adapter placeholder
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```


---

## FILE: `docs/aec-erp/04-safety-health-ledger-report/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 공사안전보건대장 이행확인 보고서 자동화

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "공사안전보건대장 이행확인 보고서 자동화" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 프로젝트, 점검회차, 체크리스트, 지적사항, 사진대지, 산업안전보건관리비를 기반으로 발주처별 제출용 보고서를 생성하는 ERP
- 이 화면은 단순 문서 편집기가 아니라 발주처별 보고서 생성, 검토, export, 제출을 처리하는 문서 자동화 작업실
- 동일 점검회차에서 삼성문화재단, 삼성생명공익재단처럼 발주처별 보고서가 분리될 수 있어야 한다.

화면 1: 보고서 목록
- 좌측 ERP 사이드바
- 상단 프로젝트 요약 헤더
- 필터:
  - 점검회차
  - 발주처
  - 문서상태
  - 제출여부
  - 누락정보
- 중앙 보고서 테이블
- 컬럼:
  - 문서번호
  - 회차
  - 점검일
  - 발주처
  - 문서상태
  - 누락정보
  - 최종본
  - 제출일
  - 작성자
- 우측 빠른 작업 패널:
  - 보고서 생성
  - 발주처별 일괄 생성
  - 미제출 보고서

화면 2: 보고서 생성 마법사
- Step 1: 점검회차 선택
- Step 2: 발주처 선택
- Step 3: 템플릿 선택
- Step 4: 연결 데이터 확인
- Step 5: 누락정보 확인
- Step 6: 초안 생성
- 점검회차 카드에는 회차, 점검일, 문서번호, 체크리스트 상태, 사진대지 상태를 표시한다.
- 발주처 선택에서는 발주처별 보고서 필요 여부 badge를 표시한다.
- 누락정보가 있으면 주황색 warning panel을 표시한다.

화면 3: 보고서 편집
- 상단 sticky header:
  - 문서번호
  - 제 N회
  - 점검일
  - 발주처
  - 상태 badge
  - 저장 버튼
  - 검토요청 버튼
  - export 버튼
- 3-column layout:
  - 좌측: 문서 섹션 navigation
  - 중앙: 섹션 편집기
  - 우측: A4 문서 미리보기
- 섹션 navigation:
  - 표지
  - 공사개요
  - 점검표
  - 이행여부 확인서
  - 위험성 감소대책
  - 추가 유해·위험요인
  - 산업안전보건관리비
  - 사진대지
  - 공사일정 첨부
- 각 섹션에 상태 badge를 표시한다:
  - 미작성
  - AI 초안
  - 수정됨
  - 검토중
  - 확정

화면 4: A4 미리보기
- 실제 제출 문서처럼 흰색 A4 페이지를 보여준다.
- 페이지 그림자와 회색 배경을 사용한다.
- 표지, 공사개요, 점검표, 사진대지가 페이지별로 보인다.
- 초안 상태일 때는 Draft watermark를 표시한다.
- 사진대지는 지적사진과 조치사진이 상하로 배치된다.
- 표가 페이지를 넘치면 빨간 warning을 표시한다.

화면 5: Export 전 체크리스트
- 저장 상태
- 필수 누락정보
- 검토 경고
- 발주처별 값 확인
- 사진대지 매칭 확인
- 산업안전보건관리비 계산 확인
- 웹하드 저장 위치
- 파일명 미리보기
- PDF/HWPX export 버튼

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- 문서 미리보기는 흰색 A4 paper
- 화면 배경은 밝은 회색
- 표와 문서는 공공 제출 문서처럼 단정하게
- 정보 밀도는 높지만 섹션 구조가 명확해야 한다.
- 상태 badge는 명확하게 구분한다.
- 누락정보는 주황색, export 불가 오류는 빨간색
- 완료/확정은 초록색
- 검토중은 보라색
- AI 초안은 연보라 또는 파란 outline badge

결과물:
- 보고서 목록 화면
- 보고서 생성 마법사 화면
- 보고서 편집 화면
- A4 미리보기 화면
- 섹션 편집기 UI
- 누락정보 패널 UI
- 사진대지 섹션 UI
- Export 전 체크리스트 화면
```


---

## FILE: `docs/aec-erp/04-safety-health-ledger-report/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 공사안전보건대장 이행확인 보고서 자동화

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
공사안전보건대장 이행확인 보고서 자동화

기능 설명:
공사안전보건대장 이행확인 보고서 자동화는 프로젝트, 점검회차, 발주처, 점검표, 지적사항, 조치현황, 사진대지, 산업안전보건관리비, 공사일정 첨부자료를 조합하여 발주처별 제출용 보고서를 생성하는 기능이다.

업무 맥락:
- 보고서는 Project에 속한다.
- 보고서는 InspectionRound에 속한다.
- 보고서는 ownerPartyId 기준으로 발주처별 분기된다.
- 같은 제1회 점검이라도 삼성문화재단 보고서와 삼성생명공익재단 보고서가 따로 생성될 수 있다.
- 보고서에는 표지, 공사개요, 점검표, 이행여부 확인서, 위험성 감소대책, 추가 유해·위험요인, 산업안전보건관리비, 사진대지, 공사일정 첨부가 포함된다.
- 점검표 결과, 지적사항, 조치현황, 사진은 원본 데이터와 연결되어야 한다.
- AI 초안은 최종본이 아니며, 사용자가 검토·확정해야 한다.
- export는 최신 저장 snapshot 기준으로 수행되어야 한다.
- export 파일은 웹하드 최종본 폴더에 저장되어야 한다.
- 제출 시 OwnerReportTask, Submission, MailThread와 연결되어야 한다.

입력:
{
  "featureName": "공사안전보건대장 이행확인 보고서 자동화",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "mailRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `document.safety_health_ledger_report`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 계약/견적
    - 점검회차/일정
    - 현장점검 체크리스트
    - 지적사항/조치현황
    - 사진대지
    - 산업안전보건관리비
    - 웹하드
    - 메일함
    - 결재/제출
    - 관리자/템플릿

출력 JSON:
{
  "featureId": "document.safety_health_ledger_report",
  "featureName": "공사안전보건대장 이행확인 보고서 자동화",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /projects/[projectId]/documents/safety-reports
- /projects/[projectId]/documents/safety-reports/new
- /documents/safety-reports/[documentId]
- /documents/safety-reports/[documentId]/edit
- /documents/safety-reports/[documentId]/preview
- /documents/safety-reports/[documentId]/sections
- /documents/safety-reports/[documentId]/variables
- /documents/safety-reports/[documentId]/export
- /documents/safety-reports/[documentId]/submission
- /inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document

반드시 포함할 models:
- DocumentInstance
- SafetyReportSnapshot
- SafetyReportMeta
- SafetyReportSection
- SafetyReportVersion
- MissingField
- ReviewWarning
- SourceLink
- SafetyReportExportJob
- Project
- ProjectParty
- InspectionRound
- InspectionOwnerReportTask
- ChecklistResult
- Finding
- CorrectiveAction
- EvidencePhoto
- SafetyCostUsage
- FileAsset
- Submission
- MailThread

반드시 포함할 prompts:
- safety-report-generation
- safety-health-ledger-report implementation prompt
- safety-health-ledger-report design prompt

반드시 포함할 tests:
- test_safety_report_draft_create_success
- test_safety_report_requires_project_round_owner
- test_safety_report_prevents_duplicate_active_owner_report
- test_safety_report_generates_owner_specific_document
- test_safety_report_missing_required_fields
- test_safety_report_clone_for_owner_replaces_owner_specific_values
- test_safety_report_checklist_results_mapped
- test_safety_report_finding_photo_ledger_mapped
- test_safety_report_safety_cost_rate_calculated
- test_safety_report_export_blocked_when_required_missing
- test_safety_report_export_uses_latest_saved_snapshot
- test_safety_report_export_creates_file_asset
- test_safety_report_links_owner_report_task
- test_safety_report_mark_submitted_updates_owner_report_task
- test_safety_report_refresh_linked_data_detects_stale_source

주의:
- 보고서는 Project 없이 생성될 수 없다.
- 보고서는 InspectionRound 없이 생성될 수 없다.
- 보고서는 ownerPartyId 없이 생성될 수 없다.
- 같은 회차에서 발주처별 보고서를 분리해야 한다.
- 총 공사금액과 발주처별 공사금액을 혼동하지 않는다.
- AI가 법령 문구를 임의 생성하지 못하게 한다.
- 사진대지는 지적사항과 조치현황이 매칭되어야 한다.
- 산업안전보건관리비 사용률은 계산값을 검증해야 한다.
- export는 최신 저장 snapshot 기준이어야 한다.
- export 파일은 FileAsset과 웹하드 위치를 가져야 한다.
- submitted 상태는 Submission 또는 MailThread와 연결되어야 한다.
```


---

## FILE: `docs/aec-erp/05-field-inspection-checklist/README.md`

# 기능 05 — 현장점검 체크리스트

이 폴더는 A&C 기술사 ERP의 다섯 번째 기능인 `현장점검 체크리스트` 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

현장점검 체크리스트는 점검자가 현장에서 공통/건축·토목/건설기계 항목과 위험성 감소대책, 추가 유해·위험요인을 입력하고, 그 결과를 지적사항·조치현황·사진대지·보고서 자동화로 연결하는 기능이다.

```text
InspectionRound
→ ChecklistSession
→ ChecklistResult
→ FindingCandidate
→ Finding
→ CorrectiveAction
→ PhotoLedger
→ SafetyReport
```

## 핵심 설계 포인트

- 점검 결과는 `양호 / 주의 / 불량 / 해당없음 / 미점검`으로 표준화한다.
- `주의`와 `불량`은 지적사항 후보로 자동 전환할 수 있어야 한다.
- 체크리스트 항목은 보고서 표와 1:1 매핑되어야 한다.
- 모바일 현장 입력과 데스크톱 검토 화면을 모두 지원한다.
- 입력된 결과는 보고서의 점검표, 이행여부 확인서, 위험성 감소대책, 추가 유해·위험요인 섹션으로 전달된다.


---

## FILE: `docs/aec-erp/05-field-inspection-checklist/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 현장점검 체크리스트

## 1. 기능 정의

현장점검 체크리스트는 A&C 기술사 ERP에서 점검 담당자가 공사안전보건대장 이행점검 결과를 현장에서 입력하고, 그 결과를 지적사항·조치관리·사진대지·보고서 자동화로 연결하는 기능이다.

이 기능은 단순 체크박스 입력이 아니라 다음 문서 섹션의 원천 데이터가 된다.

- 공사안전보건대장 이행 확인 점검표
- 공사안전보건대장 이행여부 확인서
- 유해·위험방지계획에 따른 위험성 감소대책 이행확인
- 추가 유해·위험요인 점검리스트
- 지적사항 및 의견
- 사진대지
- 점검사항/강평

## 2. 필요한 이유

A&C 샘플 보고서에는 점검표가 여러 레이어로 구성되어 있다. 공통, 건축·토목, 건설기계, 위험성 감소대책, 추가 유해·위험요인 항목이 분리되어 있으며, 각 항목은 `양호 / 주의 / 불량 / 해당없음`으로 기록된다. `주의` 또는 `불량` 항목은 지적사항 및 의견으로 이어진다.

예시 흐름:

```text
전기 안전관리 항목에서 주의 선택
→ 지적사항: 가설전선 피복관리, 콘센트 및 케이블릴 감김 상태 관리 미흡
→ 지적사항 후보 생성
→ 현장사진 등록
→ 시공사 조치 등록
→ 조치사진 등록
→ 사진대지 자동 반영
→ 보고서 점검표와 총평 자동 반영
```

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 점검 담당자 | 현장점검 중 체크리스트 입력, 사진 등록, 지적사항 메모 |
| 건설안전기술사 | 체크리스트 결과 검토, 보고서 반영 여부 확인 |
| 문서 작성자 | 점검표 결과를 보고서에 반영, 누락정보 확인 |
| 시공사 담당자 | 지적사항 확인, 조치계획/조치현황 제출 |
| 관리자 | 체크리스트 템플릿, 항목 버전, 표준 문구 관리 |

## 4. 핵심 기능

### 4.1 점검 세션 생성

점검회차를 기준으로 체크리스트 세션을 생성한다.

```text
InspectionRound
→ ChecklistSession
→ ChecklistCategory
→ ChecklistItem
→ ChecklistResult
```

세션 생성 기준:

- 프로젝트
- 점검회차
- 점검일
- 점검 담당자
- 발주처 optional
- 템플릿 버전
- 공종/작업 유형

### 4.2 표준 점검표 입력

점검 결과값:

| 값 | 화면 표시 | 의미 |
|---|---|---|
| good | 양호 | 적정 |
| caution | 주의 | 보완 권장 또는 경미한 미흡 |
| bad | 불량 | 조치 필요 |
| not_applicable | 해당없음 | 현장 조건상 제외 |
| not_checked | 미점검 | 아직 입력되지 않음 |

항목별 입력값:

- 확인결과
- 지적사항 및 의견
- 사진
- 현장 메모
- 조치 필요 여부
- 시공사 담당자
- 조치기한
- 보고서 반영 여부

### 4.3 공통 점검표

기본 항목:

1. 안전관리 계획 수립 및 이행 적정 여부
2. 근로자 안전교육, 개인보호구 지급 및 착용상태
3. 안전관리조직도 편성, 비상연락망 구축
4. 재해·재난 대비 상태, 비상대응 계획 및 훈련
5. 현장 근로자 휴게시설 적정 여부

### 4.4 건축·토목 점검표

기본 항목:

1. 추락 및 낙하·비래 안전관리
2. 시스템 또는 강관 비계 설치 상태
3. 가설통로 등 근로자 이동통로 안전관리
4. 공사장 조도 적정성, 조명시설 설치 상태
5. 충돌, 협착 안전관리
6. 전기 안전관리
7. 화재/질식 안전관리
8. 위험물 취급 및 관리
9. 흙막이 가시설 설치 상태
10. 동바리 설치 상태
11. 공사장 주변 안전조치
12. 굴착, 비탈면 상태
13. 현장 배수로, 침사지, 집수정, 맨홀 등 설치 및 관리 상태
14. 주변 지반 이상 유무
15. 가스관, 상하수도관, 전기·통신 케이블관 등 지하매설물 상태

### 4.5 건설기계 점검표

기본 항목:

- 건설기계 관리 상태
- 안전장치 상태
- 안전점검 상태
- 작업장소 상태
- 혼재구간 유도 및 신호수 배치

### 4.6 유해·위험방지계획 위험성 감소대책 이행확인

승강기 교체 설치작업 기준 기본 항목:

1. 가설분전반
2. 가설전선
3. 가설전선
4. 사다리
5. 말비계
6. 화기취급
7. 이동식 크레인
8. 지게차
9. 고속절단기
10. 용접기
11. 체인블럭 및 레버블럭
12. 밀폐공간
13. 공기매개 감염병
14. 위험물질
15. 온열질환
16. 근골격계
17. 소음작업
18. 조도
19. 근로자 휴게시설
20. 응급처치

각 항목은 `분야 / 유형 / 시공자 이행계획 / 점검사항 / 점검 결과 / 이행 여부 / 비고`를 가진다.

### 4.7 추가 유해·위험요인 점검리스트

예시:

- 방우형 콘센트 덮개 파손으로 인한 감전사고 우려
- 가설분전함 전선배선 피복 노출부 임시 보완처리 미비
- 케이블 릴 전선 풀림상태 안전조치 미비
- 이동식 사다리 아웃트리거 설치조치 미비
- 가설분전함 정·부 책임자 지정 미비
- 용접작업시 불티로 인한 화재발생 우려

### 4.8 지적사항 후보 자동 생성

체크리스트에서 주의 또는 불량을 선택하면 지적사항 후보가 생성된다.

자동 생성 항목:

- findingTitle
- findingDetail
- riskType
- requiredAction
- relatedChecklistItemId
- relatedPhotoIds
- responsibleParty
- dueDate

사용자는 후보를 검토하여 정식 `Finding`으로 전환한다.

### 4.9 모바일 현장 입력

모바일 입력 방식:

- 회차 선택
- 카테고리 선택
- 항목 카드 보기
- 양호/주의/불량/해당없음 빠른 선택
- 사진 촬영
- 음성 메모 optional
- 지적사항 메모
- 임시저장
- 오프라인 임시저장 optional

### 4.10 데스크톱 검토

검토 항목:

- 미입력 항목
- 주의/불량 항목
- 지적사항 후보
- 사진 누락
- 보고서 반영 여부
- 발주처별 보고서 반영 여부

## 5. 사용자 흐름

```text
오늘의 점검 선택
→ 점검회차 진입
→ 체크리스트 세션 시작
→ 공통 항목 입력
→ 건축·토목 항목 입력
→ 건설기계 항목 입력
→ 위험성 감소대책 이행확인 입력
→ 추가 유해·위험요인 입력
→ 주의/불량 항목 사진 등록
→ 지적사항 후보 확인
→ 세션 완료
→ 데스크톱 검토 요청
```

## 6. 핵심 데이터

### ChecklistSession

- sessionId
- projectId
- inspectionRoundId
- templateId
- inspectorUserId
- inspectionDate
- status
- startedAt / completedAt

### ChecklistItem

- itemId
- category
- discipline
- title
- detail
- reportLabel
- displayOrder
- isRequired

### ChecklistResult

- resultId
- sessionId
- checklistItemId
- result
- comment
- photoIds
- actionRequired
- findingCandidateId
- findingId
- reportMappingStatus

### FindingCandidate

- candidateId
- checklistResultId
- title
- detail
- requiredAction
- riskType
- status

## 7. 완료 기준

- 점검회차 기준 체크리스트 세션을 생성할 수 있다.
- 공통/건축토목/건설기계 점검표를 입력할 수 있다.
- 위험성 감소대책 20개 항목을 입력할 수 있다.
- 추가 유해·위험요인을 등록할 수 있다.
- 주의 또는 불량 결과는 지적사항 후보가 된다.
- 체크리스트 항목별 사진을 등록할 수 있다.
- 미입력/사진누락/지적사항 미전환 상태를 검토할 수 있다.
- 결과가 보고서 자동화 모듈로 전달된다.
- 모바일 현장 입력과 데스크톱 검토를 모두 지원한다.


---

## FILE: `docs/aec-erp/05-field-inspection-checklist/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 현장점검 체크리스트

## 1. Frontend Routes

```text
/projects/[projectId]/checklist-templates
/projects/[projectId]/inspections/[inspectionRoundId]/checklist
/inspections/[inspectionRoundId]/checklist
/inspections/[inspectionRoundId]/checklist/mobile
/inspections/[inspectionRoundId]/checklist/review
/checklist-sessions/[sessionId]
/checklist-sessions/[sessionId]/results
/checklist-sessions/[sessionId]/finding-candidates
/checklist-sessions/[sessionId]/photos
/admin/checklist-templates
/admin/checklist-templates/[templateId]
```

## 2. Frontend Components

```text
ChecklistSessionPage
ChecklistMobilePage
ChecklistReviewPage
ChecklistTemplateAdminPage
ChecklistSessionHeader
ChecklistProgressBar
ChecklistCategoryTabs
ChecklistItemCard
ChecklistResultRadioGroup
ChecklistResultTable
ChecklistResultMatrix
ChecklistCommentField
ChecklistPhotoUploader
ChecklistFindingCandidateDrawer
ChecklistFindingCandidateTable
ChecklistBulkActionBar
ChecklistMissingInputPanel
ChecklistReportMappingPanel
ChecklistVersionBadge
RiskReductionChecklistTable
AdditionalHazardChecklistTable
MobileChecklistBottomBar
OfflineDraftIndicator
```

## 3. Backend APIs

### Templates

```text
GET    /api/v1/checklist-templates
POST   /api/v1/checklist-templates
GET    /api/v1/checklist-templates/{templateId}
PATCH  /api/v1/checklist-templates/{templateId}
DELETE /api/v1/checklist-templates/{templateId}
POST   /api/v1/checklist-templates/{templateId}/publish
POST   /api/v1/checklist-templates/{templateId}/clone
```

### Template Items

```text
GET    /api/v1/checklist-templates/{templateId}/items
POST   /api/v1/checklist-templates/{templateId}/items
PATCH  /api/v1/checklist-items/{itemId}
DELETE /api/v1/checklist-items/{itemId}
POST   /api/v1/checklist-templates/{templateId}/items/reorder
```

### Checklist Sessions

```text
GET    /api/v1/inspection-rounds/{inspectionRoundId}/checklist-sessions
POST   /api/v1/inspection-rounds/{inspectionRoundId}/checklist-sessions
GET    /api/v1/checklist-sessions/{sessionId}
PATCH  /api/v1/checklist-sessions/{sessionId}
POST   /api/v1/checklist-sessions/{sessionId}/start
POST   /api/v1/checklist-sessions/{sessionId}/pause
POST   /api/v1/checklist-sessions/{sessionId}/complete
POST   /api/v1/checklist-sessions/{sessionId}/review
POST   /api/v1/checklist-sessions/{sessionId}/lock
```

### Results

```text
GET   /api/v1/checklist-sessions/{sessionId}/results
POST  /api/v1/checklist-sessions/{sessionId}/results
PATCH /api/v1/checklist-results/{resultId}
POST  /api/v1/checklist-sessions/{sessionId}/results/bulk-save
POST  /api/v1/checklist-sessions/{sessionId}/results/fill-not-applicable
POST  /api/v1/checklist-sessions/{sessionId}/results/validate
```

### Finding Candidates

```text
GET  /api/v1/checklist-sessions/{sessionId}/finding-candidates
POST /api/v1/checklist-results/{resultId}/finding-candidate
POST /api/v1/finding-candidates/{candidateId}/accept
POST /api/v1/finding-candidates/{candidateId}/dismiss
POST /api/v1/finding-candidates/{candidateId}/convert-to-finding
```

### Photos / Report / Mobile

```text
POST /api/v1/checklist-results/{resultId}/photos/upload
GET  /api/v1/checklist-results/{resultId}/photos
POST /api/v1/checklist-results/{resultId}/photos/link
POST /api/v1/checklist-photos/{photoId}/unlink
GET  /api/v1/checklist-sessions/{sessionId}/report-mapping
POST /api/v1/checklist-sessions/{sessionId}/summarize
POST /api/v1/checklist-sessions/{sessionId}/sync-to-report
POST /api/v1/checklist-sessions/{sessionId}/mobile-drafts
GET  /api/v1/checklist-sessions/{sessionId}/mobile-drafts/{draftId}
POST /api/v1/checklist-sessions/{sessionId}/mobile-drafts/{draftId}/commit
```

## 4. Data Models

```ts
type ChecklistTemplateStatus = 'draft' | 'published' | 'archived'
type ChecklistCategoryKey = 'common' | 'architecture_civil' | 'construction_machine' | 'risk_reduction' | 'additional_hazard' | 'custom'
type ChecklistSessionStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'reviewed' | 'locked'
type ChecklistResultValue = 'not_checked' | 'good' | 'caution' | 'bad' | 'not_applicable'
type FindingCandidateStatus = 'candidate' | 'accepted' | 'dismissed' | 'converted'

type ChecklistTemplate = {
  id: string
  name: string
  description?: string
  projectType?: string
  documentType: 'safety_health_ledger_inspection_report'
  version: string
  status: ChecklistTemplateStatus
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

type ChecklistItem = {
  id: string
  templateId: string
  categoryId: string
  categoryKey: ChecklistCategoryKey
  discipline?: string
  title: string
  detail?: string
  reportLabel?: string
  defaultApplicability: boolean
  isRequired: boolean
  findingRequiredWhen?: 'caution' | 'bad' | 'caution_or_bad' | 'never'
  sourceSectionKey?: string
  displayOrder: number
}

type ChecklistSession = {
  id: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId?: string
  templateId: string
  templateVersion: string
  inspectorUserId?: string
  inspectionDate?: string
  status: ChecklistSessionStatus
  startedAt?: string
  completedAt?: string
  reviewedAt?: string
  lockedAt?: string
}

type ChecklistResult = {
  id: string
  sessionId: string
  projectId: string
  inspectionRoundId: string
  checklistItemId: string
  result: ChecklistResultValue
  comment?: string
  reportComment?: string
  actionRequired: boolean
  responsiblePartyId?: string
  dueDate?: string
  photoIds: string[]
  findingCandidateId?: string
  findingId?: string
  reportMappingStatus: 'not_mapped' | 'mapped' | 'excluded'
}

type FindingCandidate = {
  id: string
  projectId: string
  inspectionRoundId: string
  sessionId: string
  checklistResultId: string
  title: string
  detail: string
  riskType?: string
  requiredAction: string
  status: FindingCandidateStatus
  convertedFindingId?: string
  dismissedReason?: string
}

type AdditionalHazardItem = {
  id: string
  sessionId: string
  no: number
  hazardDescription: string
  contractorPlan?: string
  checkPoint?: string
  implementationStatus: 'implemented' | 'not_implemented' | 'not_applicable' | 'not_checked'
  note?: string
  photoIds: string[]
  findingCandidateId?: string
  findingId?: string
}
```

## 5. Validation Rules

- `ChecklistSession.projectId`, `inspectionRoundId`, `templateId`는 필수다.
- `locked` 상태에서는 결과를 수정할 수 없다.
- `completed` 상태가 되려면 필수 항목이 모두 입력되어야 한다.
- `caution` 또는 `bad`는 comment 입력을 권장한다.
- `caution` 또는 `bad`에서 조건이 충족되면 FindingCandidate를 생성한다.
- `not_applicable`은 사유 입력을 권장한다.
- 추가 유해·위험요인 `not_implemented`는 FindingCandidate 생성을 권장한다.

## 6. Service Rules

### Checklist Session 생성

```text
1. InspectionRound 조회
2. Project 조회
3. published ChecklistTemplate 조회
4. ChecklistSession 생성
5. Template의 ChecklistItem 기준으로 ChecklistResult 초기 생성
6. RiskReduction 기본 20개 항목 생성
7. AuditLog 기록
```

### 결과 저장

```text
1. session status 확인
2. locked 여부 확인
3. result validation
4. ChecklistResult 저장
5. caution/bad이면 FindingCandidate 생성 또는 갱신
6. reportMappingStatus 갱신
7. session progress 재계산
```

### 보고서 매핑

| Checklist Category | Report Section |
|---|---|
| common | inspection_checklist |
| architecture_civil | inspection_checklist |
| construction_machine | inspection_checklist |
| risk_reduction | risk_reduction_checklist |
| additional_hazard | additional_hazard_checklist, photo_ledger |

## 7. Seed Template Items

기본 템플릿명: `공사안전보건대장 이행확인 표준 점검표`

- common: 안전관리 계획, 교육/PPE, 안전관리조직/비상연락망, 재해·재난 대비, 휴게시설
- architecture_civil: 추락/낙하, 비계, 가설통로, 조도, 충돌/협착, 전기, 화재/질식, 위험물, 흙막이, 동바리, 주변 안전, 굴착/비탈면, 배수로, 주변 지반, 지하매설물
- construction_machine: 건설기계 관리 상태
- risk_reduction: 가설분전반, 가설전선, 사다리, 말비계, 화기취급, 이동식 크레인, 지게차, 고속절단기, 용접기 등 20개

## 8. Tests

```text
test_checklist_template_create_success
test_checklist_session_create_from_template
test_checklist_session_initializes_results
test_checklist_session_generates_risk_reduction_items
test_checklist_result_save_good
test_checklist_result_caution_creates_finding_candidate
test_checklist_result_bad_creates_finding_candidate
test_checklist_result_not_applicable_requires_reason_warning
test_checklist_bulk_save_success
test_checklist_locked_session_prevents_update
test_additional_hazard_create_success
test_additional_hazard_not_implemented_creates_candidate
test_checklist_photo_upload_links_result
test_checklist_complete_requires_required_items
test_checklist_summary_generates_report_mapping
test_checklist_mobile_draft_commit
test_checklist_report_sync_to_safety_report
```


---

## FILE: `docs/aec-erp/05-field-inspection-checklist/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 현장점검 체크리스트

## 1. 화면 목표

현장점검 체크리스트 화면은 점검 담당자가 현장에서 빠르게 점검 결과를 입력하고, 데스크톱에서 그 결과를 검토하여 지적사항·사진대지·보고서로 연결하는 작업 화면이다.

핵심 목표:

- 현장에서는 빠른 입력
- 사무실에서는 정확한 검토
- 보고서에는 원본 데이터 그대로 반영
- 주의/불량은 지적사항으로 자연스럽게 전환
- 사진 누락과 미입력 항목을 명확히 경고

## 2. 화면 목록

### 2.1 점검회차 체크리스트 화면

Route: `/inspections/[inspectionRoundId]/checklist`

구성:

- 점검회차 헤더
- 진행률 카드
- 카테고리 탭
- 체크리스트 테이블
- 지적사항 후보 패널
- 누락정보 패널
- 보고서 반영 패널

상단 표시:

- 프로젝트명
- 점검회차
- 점검일
- 점검 담당자
- 세션 상태
- 입력 진행률
- 주의/불량 수
- 사진 누락 수

### 2.2 모바일 현장 입력 화면

Route: `/inspections/[inspectionRoundId]/checklist/mobile`

구성:

- 상단 프로젝트/회차 sticky header
- 카테고리 progress
- 항목 카드
- 결과 버튼: 양호 / 주의 / 불량 / 해당없음
- 사진 촬영 버튼
- 메모 입력
- 지적사항 후보 drawer
- 하단 저장 bar

### 2.3 데스크톱 검토 화면

Route: `/inspections/[inspectionRoundId]/checklist/review`

구성:

- 결과 matrix
- 미입력 항목
- 주의/불량 항목
- 지적사항 후보
- 사진 누락
- 보고서 반영 여부
- 세션 완료/잠금 버튼

### 2.4 지적사항 후보 화면

Route: `/checklist-sessions/[sessionId]/finding-candidates`

구성:

- 후보 목록
- 원본 체크리스트 항목
- 지적사항 제목
- 상세
- 권장 조치
- 사진
- 전환/보류/제외 버튼

## 3. UX 규칙

- 모바일에서는 한 화면에 한 항목을 카드로 보여준다.
- 데스크톱에서는 표 형태로 많은 항목을 빠르게 검토할 수 있어야 한다.
- 주의 또는 불량 선택 시 지적사항 메모 입력을 유도한다.
- 주의 또는 불량 선택 시 사진 등록 버튼을 강조한다.
- 해당없음 선택 시 사유 입력을 권장한다.
- 필수 항목이 미점검이면 세션 완료를 막는다.
- locked 상태에서는 수정할 수 없다.
- 지적사항 후보는 사용자가 승인해야 실제 Finding으로 전환된다.
- 보고서 반영 여부를 항목별로 표시한다.

## 4. 디자인 컴포넌트

### ChecklistSessionHeader

표시 항목:

- 프로젝트명
- 점검회차
- 점검일
- 점검자
- 상태 badge
- 저장 상태
- 완료 버튼

### ChecklistProgressBar

표시 항목:

- 전체 항목 수
- 입력 완료 수
- 양호 수
- 주의 수
- 불량 수
- 해당없음 수
- 미점검 수

### ChecklistCategoryTabs

카테고리:

```text
공통
건축·토목
건설기계
위험성 감소대책
추가 유해·위험요인
사진
지적사항 후보
```

### ChecklistItemCard

모바일용 카드 구성:

- 카테고리 badge
- 항목명
- 상세 점검내용
- 결과 버튼 4개
- 메모
- 사진
- 지적사항 후보 상태

### ChecklistResultRadioGroup

버튼 스타일:

- 양호: green
- 주의: orange
- 불량: red
- 해당없음: gray
- 미점검: outline gray

### ChecklistResultTable

| 컬럼 | 설명 |
|---|---|
| 분야 | 공통/건축토목/건설기계 |
| 항목 | 점검 항목 |
| 양호 | radio |
| 주의 | radio |
| 불량 | radio |
| 해당없음 | radio |
| 지적사항 및 의견 | text |
| 사진 | count |
| 지적후보 | status |

### RiskReductionChecklistTable

| NO | 분야 | 유형 | 시공자 이행계획 | 점검사항 | 이행여부 | 비고 |
|---|---|---|---|---|---|---|

### AdditionalHazardChecklistTable

| NO | 유해·위험요인 | 시공자 이행계획 | 점검사항 | 이행여부 | 비고 | 사진 | 지적후보 |
|---|---|---|---|---|---|---|---|

## 5. Warning State

### 필수 항목 미입력

```text
필수 점검 항목이 아직 입력되지 않았습니다.
세션 완료 전에 모든 필수 항목을 확인하세요.
```

### 주의/불량 사진 누락

```text
주의 또는 불량 항목에 사진이 연결되지 않았습니다.
보고서 사진대지 반영을 위해 사진 등록을 권장합니다.
```

### 지적사항 후보 미처리

```text
주의/불량 항목 중 지적사항으로 전환되지 않은 후보가 있습니다.
```

## 6. Responsive

### Desktop

- 표 입력 중심
- 좌측 카테고리 또는 상단 탭
- 우측 지적사항 후보/누락정보 패널

### Mobile

- 한 항목 카드 입력
- 큰 터치 버튼
- sticky bottom save bar
- 사진 촬영 버튼 강조
- 오프라인 임시저장 표시


---

## FILE: `docs/aec-erp/05-field-inspection-checklist/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 현장점검 체크리스트

## 1. Feature

```yaml
featureId: inspection.checklist.management
featureName: 현장점검 체크리스트
priority: P0
module: field-inspection-checklist
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 체크리스트 템플릿 목록 | `/projects/[projectId]/checklist-templates` | 프로젝트에서 사용 가능한 템플릿 조회 |
| 점검회차 체크리스트 | `/inspections/[inspectionRoundId]/checklist` | 점검회차별 체크리스트 입력 |
| 모바일 입력 | `/inspections/[inspectionRoundId]/checklist/mobile` | 현장 모바일 카드 입력 |
| 데스크톱 검토 | `/inspections/[inspectionRoundId]/checklist/review` | 입력 결과 검토 |
| 세션 상세 | `/checklist-sessions/[sessionId]` | 체크리스트 세션 상태 |
| 결과 목록 | `/checklist-sessions/[sessionId]/results` | 항목별 결과 |
| 지적사항 후보 | `/checklist-sessions/[sessionId]/finding-candidates` | 주의/불량 후보 검토 |
| 사진 목록 | `/checklist-sessions/[sessionId]/photos` | 결과별 사진 |
| 템플릿 관리자 | `/admin/checklist-templates` | 표준 점검표 관리 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| checklist | ChecklistSessionHeader, ChecklistCategoryTabs, ChecklistResultTable |
| mobile | ChecklistItemCard, ChecklistResultRadioGroup, MobileChecklistBottomBar |
| review | ChecklistResultMatrix, ChecklistMissingInputPanel, ChecklistReportMappingPanel |
| finding-candidates | ChecklistFindingCandidateTable, ChecklistFindingCandidateDrawer |
| photos | ChecklistPhotoUploader, ChecklistPhotoGrid |
| admin | ChecklistTemplateTable, ChecklistTemplateEditor, ChecklistItemEditor |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| ChecklistSessionHeader | GET `/api/v1/checklist-sessions/{sessionId}` |
| ChecklistCategoryTabs | GET `/api/v1/checklist-templates/{templateId}/items` |
| ChecklistResultTable | GET `/api/v1/checklist-sessions/{sessionId}/results` |
| ChecklistResultRadioGroup | PATCH `/api/v1/checklist-results/{resultId}` |
| ChecklistPhotoUploader | POST `/api/v1/checklist-results/{resultId}/photos/upload` |
| ChecklistFindingCandidateDrawer | POST `/api/v1/finding-candidates/{candidateId}/convert-to-finding` |
| ChecklistMissingInputPanel | POST `/api/v1/checklist-sessions/{sessionId}/results/validate` |
| ChecklistReportMappingPanel | GET `/api/v1/checklist-sessions/{sessionId}/report-mapping` |
| MobileChecklistBottomBar | POST `/api/v1/checklist-sessions/{sessionId}/mobile-drafts/{draftId}/commit` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET checklist-templates | ChecklistTemplate |
| GET checklist-template items | ChecklistCategory, ChecklistItem |
| POST checklist-sessions | ChecklistSession, ChecklistResult, RiskReductionChecklistItem |
| PATCH checklist-results | ChecklistResult, FindingCandidate |
| convert-to-finding | FindingCandidate, Finding |
| photos/upload | ChecklistPhoto, FileAsset |
| summarize | ChecklistReportMapping |
| sync-to-report | ChecklistReportMapping, DocumentInstance |
| mobile-drafts commit | ChecklistMobileDraft, ChecklistResult, ChecklistPhoto |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| ChecklistSession | checklist-summary-and-finding-candidate |
| ChecklistResult | checklist-summary-and-finding-candidate |
| RiskReductionChecklistItem | checklist-summary-and-finding-candidate |
| AdditionalHazardItem | checklist-summary-and-finding-candidate |
| ChecklistPhoto | checklist-summary-and-finding-candidate |
| FindingCandidate | checklist-summary-and-finding-candidate |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 템플릿 생성 | test_checklist_template_create_success |
| 세션 생성 | test_checklist_session_create_from_template |
| 결과 초기화 | test_checklist_session_initializes_results |
| 위험성 감소대책 초기화 | test_checklist_session_generates_risk_reduction_items |
| 주의 지적후보 | test_checklist_result_caution_creates_finding_candidate |
| 불량 지적후보 | test_checklist_result_bad_creates_finding_candidate |
| 잠금 수정 방지 | test_checklist_locked_session_prevents_update |
| 추가위험 등록 | test_additional_hazard_create_success |
| 사진 연결 | test_checklist_photo_upload_links_result |
| 보고서 매핑 | test_checklist_summary_generates_report_mapping |
| 모바일 임시저장 | test_checklist_mobile_draft_commit |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId |
| 점검회차/일정 | inspectionRoundId |
| 보고서 자동화 | ChecklistReportMapping, DocumentInstance |
| 지적사항/조치현황 | FindingCandidate → Finding |
| 사진대지 | ChecklistPhoto, EvidencePhoto |
| 웹하드 | 사진 파일 FileAsset |
| 메일함 | 지적사항 조치요청 메일 |
| 관리자/템플릿 | ChecklistTemplate, ChecklistItem |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 현장 입력과 보고서 표 불일치 | ChecklistItem.sourceSectionKey와 reportLabel 유지 |
| 주의/불량 지적사항 누락 | FindingCandidate 자동 생성 |
| 사진 누락 | caution/bad 사진누락 warning |
| 해당없음 남발 | 사유 입력 권장 및 검토 패널 표시 |
| 템플릿 변경으로 기존 세션 훼손 | session에 templateVersion snapshot 저장 |
| 모바일 오프라인 충돌 | mobile draft version 비교 |
| 보고서 생성 후 결과 변경 | reportMapping stale 상태 표시 |


---

## FILE: `docs/aec-erp/05-field-inspection-checklist/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 체크리스트 결과 요약 및 지적사항 후보 생성

## Prompt ID

`checklist-summary-and-finding-candidate`

## 목적

현장점검 체크리스트 결과를 보고서에 들어갈 점검표 요약, 지적사항 후보, 총평 후보, 사진대지 연결 후보로 정리한다.

## Prompt

```text
너는 A&C기술사 ERP의 현장점검 체크리스트 결과 정리 엔진이다.

입력:
- project
- inspectionRound
- ownerParty
- checklistSession
- checklistItems
- checklistResults
- riskReductionItems
- additionalHazardItems
- checklistPhotos
- existingFindings
- existingCorrectiveActions
- userInstruction

목표:
현장점검 체크리스트 결과를 보고서 자동화와 지적사항 관리에 사용할 수 있도록 구조화한다.

해야 할 일:
1. 공통, 건축·토목, 건설기계 점검표 결과를 요약한다.
2. 양호/주의/불량/해당없음 결과를 보고서 표에 맞는 형태로 변환한다.
3. 주의 또는 불량 항목은 지적사항 후보를 만든다.
4. 추가 유해·위험요인 중 미이행 또는 보완 필요 항목은 지적사항 후보를 만든다.
5. 위험성 감소대책 20개 항목의 이행상태를 요약한다.
6. 지적사항 및 의견 문구를 보고서용 문장으로 정리한다.
7. 사진이 있는 항목은 대표사진 후보를 추천한다.
8. 기존 Finding과 중복되는 항목은 duplicateCandidate로 표시한다.
9. 총평 후보를 현장관리, 문서관리, 보완 필요로 나누어 작성한다.
10. 입력에 없는 사실은 만들지 않는다.

작성 규칙:
- 결과값은 good/caution/bad/not_applicable/not_checked를 유지한다.
- 보고서 표시값은 양호/주의/불량/해당없음/미점검으로 변환한다.
- 지적사항 제목은 간결하게 작성한다.
- 조치요청 문구는 실행 가능한 표현으로 작성한다.
- 사진이 없으면 사진이 있다고 쓰지 않는다.
- 조치가 확인되지 않았으면 조치완료로 표현하지 않는다.
- 법령 문구를 임의로 만들지 않는다.
- 발주처별로 다른 내용이 있으면 ownerParty 기준으로 분리한다.

출력 JSON:
{
  "sessionSummary": {
    "inspectionRoundId": "",
    "ownerPartyId": null,
    "totalItems": 0,
    "goodCount": 0,
    "cautionCount": 0,
    "badCount": 0,
    "notApplicableCount": 0,
    "notCheckedCount": 0,
    "actionRequiredCount": 0
  },
  "reportChecklistRows": [],
  "riskReductionRows": [],
  "additionalHazardRows": [],
  "findingCandidates": [],
  "summaryDraft": {
    "fieldManagement": [],
    "documentManagement": [],
    "needsImprovement": []
  },
  "photoRecommendations": [],
  "missingFields": [],
  "warnings": []
}
```

## 금지사항

- 입력되지 않은 체크리스트 결과를 양호로 채우지 않는다.
- 사진이 없는 항목에 대표사진을 임의 배정하지 않는다.
- 조치가 확인되지 않은 항목을 완료로 표시하지 않는다.
- 위험요인을 과장하거나 법령 조항을 임의 추가하지 않는다.


---

## FILE: `docs/aec-erp/05-field-inspection-checklist/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 현장점검 체크리스트

## Prompt

```text
You are implementing the Field Inspection Checklist module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module manages checklist templates, checklist sessions, checklist results, risk reduction checklist items, additional hazard items, photos, finding candidates, mobile input, and report mapping.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Field Inspection Checklist module.

Existing concepts:
- Project
- ProjectParty
- InspectionRound
- InspectionOwnerReportTask
- Finding
- CorrectiveAction
- EvidencePhoto
- FileAsset
- DocumentInstance
- AuditLog

Required backend models:
- ChecklistTemplate
- ChecklistCategory
- ChecklistItem
- ChecklistSession
- ChecklistResult
- FindingCandidate
- RiskReductionChecklistItem
- AdditionalHazardItem
- ChecklistPhoto
- ChecklistMobileDraft
- ChecklistReportMapping

Required backend APIs:
Templates:
- GET /api/v1/checklist-templates
- POST /api/v1/checklist-templates
- GET /api/v1/checklist-templates/{templateId}
- PATCH /api/v1/checklist-templates/{templateId}
- DELETE /api/v1/checklist-templates/{templateId}
- POST /api/v1/checklist-templates/{templateId}/publish
- POST /api/v1/checklist-templates/{templateId}/clone

Template Items:
- GET /api/v1/checklist-templates/{templateId}/items
- POST /api/v1/checklist-templates/{templateId}/items
- PATCH /api/v1/checklist-items/{itemId}
- DELETE /api/v1/checklist-items/{itemId}
- POST /api/v1/checklist-templates/{templateId}/items/reorder

Checklist Sessions:
- GET /api/v1/inspection-rounds/{inspectionRoundId}/checklist-sessions
- POST /api/v1/inspection-rounds/{inspectionRoundId}/checklist-sessions
- GET /api/v1/checklist-sessions/{sessionId}
- PATCH /api/v1/checklist-sessions/{sessionId}
- POST /api/v1/checklist-sessions/{sessionId}/start
- POST /api/v1/checklist-sessions/{sessionId}/pause
- POST /api/v1/checklist-sessions/{sessionId}/complete
- POST /api/v1/checklist-sessions/{sessionId}/review
- POST /api/v1/checklist-sessions/{sessionId}/lock

Results:
- GET /api/v1/checklist-sessions/{sessionId}/results
- POST /api/v1/checklist-sessions/{sessionId}/results
- PATCH /api/v1/checklist-results/{resultId}
- POST /api/v1/checklist-sessions/{sessionId}/results/bulk-save
- POST /api/v1/checklist-sessions/{sessionId}/results/fill-not-applicable
- POST /api/v1/checklist-sessions/{sessionId}/results/validate

Finding Candidates:
- GET /api/v1/checklist-sessions/{sessionId}/finding-candidates
- POST /api/v1/checklist-results/{resultId}/finding-candidate
- POST /api/v1/finding-candidates/{candidateId}/accept
- POST /api/v1/finding-candidates/{candidateId}/dismiss
- POST /api/v1/finding-candidates/{candidateId}/convert-to-finding

Photos / Report / Mobile:
- POST /api/v1/checklist-results/{resultId}/photos/upload
- GET /api/v1/checklist-results/{resultId}/photos
- POST /api/v1/checklist-results/{resultId}/photos/link
- GET /api/v1/checklist-sessions/{sessionId}/report-mapping
- POST /api/v1/checklist-sessions/{sessionId}/summarize
- POST /api/v1/checklist-sessions/{sessionId}/sync-to-report
- POST /api/v1/checklist-sessions/{sessionId}/mobile-drafts
- POST /api/v1/checklist-sessions/{sessionId}/mobile-drafts/{draftId}/commit

Required frontend routes:
- /projects/[projectId]/checklist-templates
- /projects/[projectId]/inspections/[inspectionRoundId]/checklist
- /inspections/[inspectionRoundId]/checklist
- /inspections/[inspectionRoundId]/checklist/mobile
- /inspections/[inspectionRoundId]/checklist/review
- /checklist-sessions/[sessionId]
- /checklist-sessions/[sessionId]/results
- /checklist-sessions/[sessionId]/finding-candidates
- /checklist-sessions/[sessionId]/photos
- /admin/checklist-templates
- /admin/checklist-templates/[templateId]

Business requirements:
1. ChecklistSession must belong to Project and InspectionRound.
2. ChecklistSession must be created from a published ChecklistTemplate.
3. Creating a session initializes ChecklistResult records for template items.
4. Creating a session initializes risk reduction items for the elevator replacement template.
5. Result values are not_checked, good, caution, bad, not_applicable.
6. caution or bad results create or update FindingCandidate.
7. not_applicable should support reason/comment.
8. locked sessions cannot be modified.
9. completed sessions require all required items to be checked.
10. Photos can be linked to checklist results and additional hazards.
11. AdditionalHazardItem with not_implemented should create FindingCandidate.
12. Checklist summaries must map to report sections.
13. Mobile draft commit must support conflict detection.
14. All status changes should create AuditLog.

Tests:
- test_checklist_template_create_success
- test_checklist_session_create_from_template
- test_checklist_session_initializes_results
- test_checklist_session_generates_risk_reduction_items
- test_checklist_result_save_good
- test_checklist_result_caution_creates_finding_candidate
- test_checklist_result_bad_creates_finding_candidate
- test_checklist_locked_session_prevents_update
- test_additional_hazard_not_implemented_creates_candidate
- test_checklist_photo_upload_links_result
- test_checklist_complete_requires_required_items
- test_checklist_summary_generates_report_mapping
- test_checklist_mobile_draft_commit
- test_checklist_report_sync_to_safety_report

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Checklist template seed service
- Finding candidate service
- Report mapping service
- Mobile draft commit service
- Frontend pages and components
- API client functions
- Type definitions
- Tests
```


---

## FILE: `docs/aec-erp/05-field-inspection-checklist/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 현장점검 체크리스트

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "현장점검 체크리스트" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 공사안전보건대장 이행점검을 수행하고 보고서를 자동 생성하는 ERP
- 현장점검 체크리스트는 점검자가 모바일에서 빠르게 입력하고, 사무실에서 데스크톱으로 검토하여 보고서에 반영하는 핵심 기능
- 체크리스트 결과는 공사안전보건대장 이행확인 보고서, 지적사항, 조치현황, 사진대지로 이어진다.

화면 1: 점검회차 체크리스트 데스크톱 화면
- 좌측 ERP 사이드바
- 상단에는 프로젝트명, 제 N회 점검, 점검일, 점검자, 세션 상태 표시
- 상단 요약 카드:
  - 전체 항목
  - 입력완료
  - 양호
  - 주의
  - 불량
  - 해당없음
  - 미점검
  - 사진누락
- 중앙에는 체크리스트 table
- 상단 category tabs:
  - 공통
  - 건축·토목
  - 건설기계
  - 위험성 감소대책
  - 추가 유해·위험요인
  - 사진
  - 지적사항 후보
- 우측에는 누락정보/지적사항 후보/보고서 반영 패널

화면 2: 모바일 현장 입력 화면
- 상단 sticky header:
  - 프로젝트명
  - 점검회차
  - 현재 카테고리
  - 진행률
- 항목은 카드 형태로 표시
- 각 카드에는 다음을 포함:
  - 항목명
  - 상세 점검내용
  - 양호/주의/불량/해당없음 큰 버튼
  - 사진 촬영 버튼
  - 메모 입력
  - 지적사항 후보 생성 상태
- 하단 sticky bar:
  - 이전
  - 임시저장
  - 다음
  - 완료
- 주의 또는 불량 선택 시 지적사항 메모 drawer를 자동으로 열어준다.
- 장갑을 낀 상태에서도 누를 수 있도록 버튼은 크고 명확하게 만든다.

화면 3: 위험성 감소대책 이행확인 화면
- 표 형태로 20개 항목을 표시
- 컬럼:
  - NO
  - 분야
  - 유형
  - 시공자 이행계획
  - 점검사항
  - 이행여부
  - 비고
- 이행여부는 이행/미이행/해당없음/미점검 badge 또는 radio로 표시

화면 4: 추가 유해·위험요인 점검리스트 화면
- 유해·위험요인별 카드 또는 table
- 항목:
  - 유해·위험요인
  - 시공자 이행계획
  - 점검사항
  - 이행여부
  - 비고
  - 사진
  - 지적사항 후보
- 새 위험요인 추가 버튼 제공
- 미이행 항목은 빨간색으로 강조하고 지적사항 후보 생성을 제안한다.

화면 5: 지적사항 후보 검토 화면
- 좌측 후보 목록
- 중앙 후보 상세
- 우측 원본 체크리스트/사진
- 액션:
  - Finding으로 전환
  - 보류
  - 제외
  - 내용 수정

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- 현장 입력 화면은 버튼이 크고 명확해야 한다.
- 데스크톱 검토 화면은 정보 밀도 높은 표 중심
- 양호는 초록색, 주의는 주황색, 불량은 빨간색, 해당없음은 회색
- 사진 누락과 미입력은 주황색 warning
- 한글 가독성을 최우선으로 한다.
- 보고서에 들어가는 표 구조와 최대한 유사하게 table을 구성한다.

결과물:
- 점검회차 체크리스트 데스크톱 화면
- 모바일 현장 입력 화면
- 위험성 감소대책 이행확인 화면
- 추가 유해·위험요인 점검리스트 화면
- 지적사항 후보 검토 화면
- 관리자 템플릿 화면
```


---

## FILE: `docs/aec-erp/05-field-inspection-checklist/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 현장점검 체크리스트

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
현장점검 체크리스트

기능 설명:
현장점검 체크리스트는 점검자가 공사안전보건대장 이행점검 현장에서 공통, 건축·토목, 건설기계, 위험성 감소대책, 추가 유해·위험요인 항목을 입력하고, 주의/불량 결과를 지적사항 후보로 전환하며, 사진과 보고서 자동화에 연결하는 기능이다.

업무 맥락:
- ChecklistSession은 Project와 InspectionRound에 속한다.
- ChecklistResult는 보고서의 공사안전보건대장 이행 확인 점검표에 반영된다.
- RiskReductionChecklistItem은 보고서의 유해·위험방지계획에 따른 위험성 감소대책 이행확인에 반영된다.
- AdditionalHazardItem은 추가 유해·위험요인 점검리스트와 사진대지에 반영된다.
- 주의 또는 불량 결과는 FindingCandidate로 생성되어야 한다.
- FindingCandidate는 사용자의 승인 후 Finding으로 전환된다.
- 모바일 현장 입력과 데스크톱 검토 화면을 모두 지원해야 한다.
- 보고서 생성 이후 체크리스트가 변경되면 stale mapping 경고가 필요하다.

출력 JSON:
{
  "featureId": "inspection.checklist.management",
  "featureName": "현장점검 체크리스트",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /projects/[projectId]/checklist-templates
- /projects/[projectId]/inspections/[inspectionRoundId]/checklist
- /inspections/[inspectionRoundId]/checklist
- /inspections/[inspectionRoundId]/checklist/mobile
- /inspections/[inspectionRoundId]/checklist/review
- /checklist-sessions/[sessionId]
- /checklist-sessions/[sessionId]/results
- /checklist-sessions/[sessionId]/finding-candidates
- /checklist-sessions/[sessionId]/photos
- /admin/checklist-templates
- /admin/checklist-templates/[templateId]

반드시 포함할 models:
- ChecklistTemplate
- ChecklistCategory
- ChecklistItem
- ChecklistSession
- ChecklistResult
- FindingCandidate
- RiskReductionChecklistItem
- AdditionalHazardItem
- ChecklistPhoto
- ChecklistMobileDraft
- ChecklistReportMapping
- Project
- InspectionRound
- Finding
- FileAsset
- DocumentInstance
- AuditLog

반드시 포함할 prompts:
- checklist-summary-and-finding-candidate
- field-inspection-checklist implementation prompt
- field-inspection-checklist design prompt

주의:
- ChecklistSession은 Project와 InspectionRound 없이 생성될 수 없다.
- ChecklistResult의 결과값은 표준 enum을 사용해야 한다.
- 주의/불량 항목은 FindingCandidate 생성 대상이다.
- FindingCandidate는 자동으로 Finding 확정되면 안 된다.
- 사진이 없는 항목에 사진이 있다고 표시하지 않는다.
- 보고서 매핑은 체크리스트 결과 변경 시 stale 상태를 표시해야 한다.
- locked 세션은 수정할 수 없다.
- 템플릿 변경은 기존 세션을 훼손하면 안 된다.
```


---

## FILE: `docs/aec-erp/06-finding-action-photo-ledger/README.md`

# 기능 06 — 지적사항/조치현황/사진대지

이 문서팩은 A&C 기술사 ERP의 여섯 번째 기능인 `지적사항/조치현황/사진대지`를 기능 단위로 정리한 패키지다.

## 목적

현장점검 체크리스트의 주의·불량 항목 또는 추가 유해·위험요인을 `Finding`으로 전환하고, 시공사 조치현황과 지적 전/조치 후 사진을 매칭하여 공사안전보건대장 이행확인 보고서의 `photo_ledger` 섹션으로 반영한다.

## 핵심 데이터 흐름

```text
ChecklistResult
→ FindingCandidate
→ Finding
→ CorrectiveAction
→ EvidencePhoto
→ PhotoLedgerEntry
→ PhotoLedger
→ SafetyReport.photo_ledger
```

## 포함 파일

```text
06-finding-action-photo-ledger/
├── README.md
├── FILE_TREE.txt
├── MANIFEST.json
├── markdown/
│   ├── 01_PRODUCT_MARKDOWN.md
│   ├── 02_TECH_MARKDOWN.md
│   ├── 05_DESIGN_MARKDOWN.md
│   └── 07_REVERSE_MAP.md
└── prompts/
    ├── 03_SERVICE_AI_PROMPT.md
    ├── 04_CODEX_IMPLEMENTATION_PROMPT.md
    ├── 06_DESIGN_PROMPT.md
    └── 08_REVERSE_PROMPT.md
```

## 이번 기능의 핵심 설계 포인트

- `Finding`은 반드시 `projectId`, `inspectionRoundId`를 가진다.
- 발주처별 사진대지가 다를 수 있으므로 `ownerPartyId`를 지원한다.
- 지적사진과 조치사진은 매칭되어야 하며 대표사진을 지정할 수 있어야 한다.
- 조치 완료는 시공사 제출만으로 끝나지 않고 기술사 또는 담당자 확인이 필요하다.
- 원본 사진은 수정하지 않고 `markupInfo` overlay metadata로 노란 점선 타원형 등 마크업을 저장한다.
- 사진대지 export 전 지적사진 누락, 조치사진 누락, 캡션 누락, 미확인 조치, 발주처 불일치를 검증한다.


---

## FILE: `docs/aec-erp/06-finding-action-photo-ledger/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 지적사항/조치현황/사진대지

## 1. 기능 정의

지적사항/조치현황/사진대지는 A&C 기술사 ERP에서 현장점검 중 발견된 위험요인, 보완 필요사항, 미이행 항목을 등록하고, 시공사 조치현황과 증빙사진을 연결하여 공사안전보건대장 이행확인 보고서의 사진대지와 총평에 자동 반영하는 기능이다.

이 기능은 다음 데이터 흐름의 중심이다.

```text
ChecklistResult
→ FindingCandidate
→ Finding
→ CorrectiveAction
→ EvidencePhoto
→ PhotoLedgerEntry
→ PhotoLedger
→ SafetyReport
```

## 2. 이 기능이 필요한 이유

A&C 샘플 업무에서 사진대지는 단순한 사진 모음이 아니다. 보고서의 각 사진대지 항목은 아래 구조를 가진다.

```text
제N회(YYYY.M.D.) 공사안전보건대장 이행여부 확인
지적 사항: {finding.title}
지적사진
조치 현황: {correctiveAction.actionDetail}
조치사진
```

동일한 점검회차라도 발주처별 보고서에 들어가는 지적사항과 사진대지가 달라질 수 있다. 따라서 `Finding`, `EvidencePhoto`, `PhotoLedgerEntry`는 점검회차뿐 아니라 필요 시 `ownerPartyId` 기준으로 필터링되어야 한다.

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 점검 담당자 | 현장 지적사항 등록, 지적사진 촬영, 조치 확인 |
| 건설안전기술사 | 조치 적정성 검토, 사진대지 확정, 최종 보고서 검토 |
| 문서 작성자 | 사진대지 구성, 캡션 보정, 보고서 반영 |
| 시공사 담당자 | 조치내용 입력, 조치사진 제출, 재조치 대응 |
| 발주처 담당자 | 지적사항 및 조치 완료 여부 확인 |

## 4. 핵심 기능

### 4.1 지적사항 등록

지적사항은 다음 경로로 생성된다.

1. 체크리스트 주의/불량 항목에서 자동 생성
2. 추가 유해·위험요인에서 자동 생성
3. 위험성 감소대책 미이행 항목에서 자동 생성
4. 현장사진에서 수동 생성
5. 사용자가 직접 수동 등록
6. 메일/파일 첨부자료에서 수동 등록

입력 필드:

- 제목
- 상세 내용
- 위험 유형
- 관련 체크리스트 항목
- 관련 추가 유해·위험요인
- 관련 위험성 감소대책 항목
- 발주처
- 책임 조직
- 조치 요청사항
- 조치기한
- 지적사진
- 보고서 반영 여부

### 4.2 조치현황 등록

조치현황은 `Finding`에 연결된다.

입력 필드:

- 조치 내용
- 조치일
- 조치 담당자
- 조치 조직
- 조치사진
- 조치 근거자료
- 확인자
- 확인일
- 확인 의견
- 조치 적정성 상태

### 4.3 조치 상태 관리

기본 상태 흐름:

```text
open
→ action_requested
→ action_submitted
→ verification_requested
→ verified
→ closed
```

반려 흐름:

```text
action_submitted
→ rejected
→ action_requested
```

| 상태 | 의미 |
|---|---|
| open | 지적사항만 등록됨 |
| action_requested | 시공사 조치 요청됨 |
| action_submitted | 시공사가 조치내용/사진 제출 |
| verification_requested | 기술사 또는 담당자 확인 대기 |
| verified | 조치 적정성 확인 |
| closed | 보고서 반영 후 종결 |
| rejected | 조치 미흡으로 반려 |
| cancelled | 지적사항 취소 또는 병합 |

### 4.4 사진 관리

사진 유형:

- `finding_photo`: 지적사진
- `action_photo`: 조치사진
- `site_context_photo`: 현장전경 또는 맥락사진
- `detail_photo`: 세부 확대사진
- `schedule_photo`: 공사일정/도면 관련 사진
- `other`: 기타

사진 정보:

- 원본 파일
- 썸네일
- 촬영일
- 업로드자
- 연결 지적사항
- 연결 조치현황
- 마크업 정보
- 캡션
- 대표사진 여부
- 보고서 반영 여부

### 4.5 사진 마크업

보고서 사진대지에서는 문제 지점을 표시하기 위해 노란 점선 원형/타원형 마크업이 필요하다. ERP는 다음 마크업을 지원한다.

- 원형/타원 표시
- 사각형 표시
- 화살표
- 텍스트 라벨
- 자유선
- 강조 색상
- 점선/실선

마크업은 원본 사진을 훼손하지 않고 `markupInfo` overlay metadata로 저장한다.

### 4.6 사진대지 자동 구성

사진대지는 지적사항과 조치현황을 한 쌍으로 구성한다.

기본 레이아웃:

```text
상단 제목: 제N회(YYYY.M.D.) 공사안전보건대장 이행여부 확인
1행: 지적 사항 / {finding.title}
2행: 지적사진
3행: 조치 현황 / {correctiveAction.actionDetail}
4행: 조치사진
```

레이아웃 옵션:

- `one_entry_per_page`: 한 페이지에 1개 지적사항
- `two_entries_per_page`: 한 페이지에 2개 지적사항

### 4.7 발주처별 사진대지

같은 점검회차라도 발주처별 보고서에 반영되는 지적사항이 다를 수 있다.

설계 원칙:

- `PhotoLedger`는 `inspectionRoundId`와 선택적 `ownerPartyId`를 가진다.
- `PhotoLedgerEntry`도 선택적 `ownerPartyId`를 가진다.
- 발주처가 지정된 사진대지에는 동일 `ownerPartyId`의 지적사항/사진만 기본 표시한다.
- 발주처 불일치 항목을 수동으로 넣는 경우 danger warning을 표시한다.

### 4.8 조치요청 메일 연동

지적사항을 선택하여 시공사에 조치 요청 메일을 작성할 수 있다.

메일 포함 항목:

- 프로젝트명
- 점검회차
- 지적사항 목록
- 지적사진
- 요청 조치내용
- 조치기한
- 회신 요청 문구
- 첨부파일

### 4.9 보고서 반영

사진대지는 다음 보고서 섹션에 반영된다.

- 공사안전보건대장 이행여부 확인서의 보완 필요
- 유해·위험방지계획에 따른 위험성 감소대책 이행확인
- 추가 유해·위험요인 점검리스트
- 지적사항/조치현황 사진대지
- 총평

### 4.10 검증

사진대지 export 전 검증 항목:

- 지적사항 제목 누락
- 조치현황 누락
- 지적사진 누락
- 조치사진 누락
- 사진 캡션 누락
- 조치 확인자 누락
- 조치일 누락
- 발주처별 보고서 반영 대상 미설정
- 사진 원본 파일 손실
- 마크업 좌표 오류
- 조치 미확인 상태
- 발주처 불일치

## 5. 사용자 흐름

### 지적사항 등록 흐름

```text
체크리스트 주의/불량 선택
→ 지적사항 후보 생성
→ 후보 확인
→ 제목/상세/조치요청 수정
→ 책임 조직 지정
→ 조치기한 지정
→ 지적사진 연결
→ Finding 생성
```

### 조치현황 등록 흐름

```text
Finding 선택
→ 조치내용 입력
→ 조치사진 업로드
→ 조치일 입력
→ 제출
→ 확인 요청
→ 기술사/담당자 확인
→ verified 또는 rejected
```

### 사진대지 구성 흐름

```text
점검회차 선택
→ 발주처 선택
→ 지적사항 목록 확인
→ 지적사진/조치사진 매칭
→ 캡션 자동 생성
→ 순서 조정
→ A4 사진대지 미리보기
→ 보고서 반영
```

## 6. 핵심 데이터

### Finding

- 지적사항 ID
- 프로젝트 ID
- 점검회차 ID
- 발주처 ID
- 제목
- 상세
- 위험유형
- 조치요청
- 책임 조직
- 조치기한
- 상태
- 관련 체크리스트 결과
- 관련 추가 위험요인
- 보고서 반영 여부

### CorrectiveAction

- 조치 ID
- 지적사항 ID
- 조치내용
- 조치일
- 조치 조직
- 제출자
- 확인자
- 확인일
- 확인 의견
- 상태

### EvidencePhoto

- 사진 ID
- 프로젝트 ID
- 점검회차 ID
- 발주처 ID
- 지적사항 ID
- 조치 ID
- 파일 ID
- 사진 유형
- 캡션
- 마크업 정보
- 대표사진 여부
- 보고서 반영 여부

### PhotoLedgerEntry

- 사진대지 항목 ID
- 점검회차 ID
- 발주처 ID
- 지적사항 ID
- 조치 ID
- 지적사진 ID 목록
- 조치사진 ID 목록
- 지적 캡션
- 조치 캡션
- 표시 순서
- 페이지 번호
- 보고서 문서 ID

## 7. 완료 기준

- 체크리스트 결과에서 지적사항을 생성할 수 있다.
- 지적사항에 지적사진을 연결할 수 있다.
- 시공사 조치내용과 조치사진을 등록할 수 있다.
- 조치 확인/반려 상태를 관리할 수 있다.
- 지적사진과 조치사진을 매칭할 수 있다.
- 사진에 마크업 정보를 저장할 수 있다.
- 발주처별 사진대지를 구성할 수 있다.
- 사진대지 A4 미리보기를 제공한다.
- 보고서 자동화 모듈에 사진대지를 전달한다.
- 조치요청 메일 초안을 작성할 수 있다.


---

## FILE: `docs/aec-erp/06-finding-action-photo-ledger/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 지적사항/조치현황/사진대지

## 1. Frontend Routes

```text
/projects/[projectId]/findings
/projects/[projectId]/findings/new
/inspections/[inspectionRoundId]/findings
/inspections/[inspectionRoundId]/findings/new
/findings/[findingId]
/findings/[findingId]/edit
/findings/[findingId]/actions
/findings/[findingId]/photos
/findings/[findingId]/verify

/inspections/[inspectionRoundId]/photo-ledger
/inspections/[inspectionRoundId]/photo-ledger/new
/photo-ledgers/[photoLedgerId]
/photo-ledgers/[photoLedgerId]/edit
/photo-ledgers/[photoLedgerId]/preview
/photo-ledgers/[photoLedgerId]/export
```

## 2. Frontend Components

```text
FindingListPage
FindingDetailPage
FindingFormPage
CorrectiveActionPage
PhotoLedgerBuilderPage
PhotoLedgerPreviewPage

FindingTable
FindingStatusBadge
FindingRiskBadge
FindingForm
FindingSourceLinkPanel
FindingTimeline
FindingPhotoGallery
CorrectiveActionForm
CorrectiveActionTable
CorrectiveActionStatusBadge
VerificationPanel
ActionRequestMailButton

PhotoUploader
PhotoGrid
PhotoPairMatcher
PhotoMarkupEditor
PhotoCaptionEditor
PhotoLedgerEntryCard
PhotoLedgerEntryTable
PhotoLedgerA4Preview
PhotoLedgerExportChecklist
OwnerPhotoLedgerFilter
MissingPhotoWarningPanel
```

## 3. Backend APIs

### Findings

```text
GET    /api/v1/projects/{projectId}/findings
POST   /api/v1/projects/{projectId}/findings
GET    /api/v1/inspection-rounds/{inspectionRoundId}/findings
POST   /api/v1/inspection-rounds/{inspectionRoundId}/findings
GET    /api/v1/findings/{findingId}
PATCH  /api/v1/findings/{findingId}
DELETE /api/v1/findings/{findingId}

POST   /api/v1/findings/{findingId}/request-action
POST   /api/v1/findings/{findingId}/verify
POST   /api/v1/findings/{findingId}/reject
POST   /api/v1/findings/{findingId}/close
POST   /api/v1/findings/{findingId}/link-checklist-result
POST   /api/v1/findings/{findingId}/link-owner
```

### Corrective Actions

```text
GET    /api/v1/findings/{findingId}/actions
POST   /api/v1/findings/{findingId}/actions
GET    /api/v1/corrective-actions/{actionId}
PATCH  /api/v1/corrective-actions/{actionId}
DELETE /api/v1/corrective-actions/{actionId}

POST   /api/v1/corrective-actions/{actionId}/submit
POST   /api/v1/corrective-actions/{actionId}/verify
POST   /api/v1/corrective-actions/{actionId}/reject
```

### Photos

```text
GET    /api/v1/findings/{findingId}/photos
POST   /api/v1/findings/{findingId}/photos/upload
POST   /api/v1/findings/{findingId}/photos/link
PATCH  /api/v1/evidence-photos/{photoId}
DELETE /api/v1/evidence-photos/{photoId}

POST   /api/v1/evidence-photos/{photoId}/markup
POST   /api/v1/evidence-photos/{photoId}/set-caption
POST   /api/v1/evidence-photos/{photoId}/set-representative
```

### Photo Ledger

```text
GET    /api/v1/inspection-rounds/{inspectionRoundId}/photo-ledgers
POST   /api/v1/inspection-rounds/{inspectionRoundId}/photo-ledgers
GET    /api/v1/photo-ledgers/{photoLedgerId}
PATCH  /api/v1/photo-ledgers/{photoLedgerId}
DELETE /api/v1/photo-ledgers/{photoLedgerId}

POST   /api/v1/photo-ledgers/{photoLedgerId}/generate-entries
GET    /api/v1/photo-ledgers/{photoLedgerId}/entries
POST   /api/v1/photo-ledgers/{photoLedgerId}/entries
PATCH  /api/v1/photo-ledger-entries/{entryId}
DELETE /api/v1/photo-ledger-entries/{entryId}
POST   /api/v1/photo-ledgers/{photoLedgerId}/reorder
POST   /api/v1/photo-ledgers/{photoLedgerId}/validate
POST   /api/v1/photo-ledgers/{photoLedgerId}/export
POST   /api/v1/photo-ledgers/{photoLedgerId}/sync-to-report
```

### Mail Integration

```text
POST /api/v1/findings/action-request-mail/draft
POST /api/v1/findings/action-request-mail/send
```

## 4. Data Models

### Finding

```ts
type FindingStatus =
  | 'open'
  | 'action_requested'
  | 'action_submitted'
  | 'verification_requested'
  | 'verified'
  | 'closed'
  | 'rejected'
  | 'cancelled'

type FindingRiskType =
  | 'fall'
  | 'electric'
  | 'fire'
  | 'struck_by'
  | 'caught_between'
  | 'chemical'
  | 'health'
  | 'equipment'
  | 'document'
  | 'other'

type Finding = {
  id: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId?: string
  title: string
  detail: string
  riskType?: FindingRiskType
  requiredAction: string
  responsiblePartyId?: string
  dueDate?: string
  status: FindingStatus
  sourceType?: 'checklist_result' | 'additional_hazard' | 'risk_reduction' | 'manual' | 'photo' | 'mail'
  sourceId?: string
  checklistResultId?: string
  additionalHazardItemId?: string
  riskReductionItemId?: string
  reportInclude: boolean
  reportOrder?: number
  createdBy?: string
  createdAt: string
  updatedAt: string
}
```

### CorrectiveAction

```ts
type CorrectiveActionStatus =
  | 'draft'
  | 'submitted'
  | 'verification_requested'
  | 'verified'
  | 'rejected'
  | 'cancelled'

type CorrectiveAction = {
  id: string
  findingId: string
  projectId: string
  inspectionRoundId: string
  actionDetail: string
  actionDate?: string
  actionOrganizationId?: string
  submittedBy?: string
  submittedAt?: string
  verifiedBy?: string
  verifiedAt?: string
  verificationComment?: string
  rejectedReason?: string
  status: CorrectiveActionStatus
  createdAt: string
  updatedAt: string
}
```

### EvidencePhoto

```ts
type EvidencePhotoType =
  | 'finding_photo'
  | 'action_photo'
  | 'site_context_photo'
  | 'detail_photo'
  | 'schedule_photo'
  | 'other'

type EvidencePhoto = {
  id: string
  projectId: string
  inspectionRoundId?: string
  ownerPartyId?: string
  findingId?: string
  correctiveActionId?: string
  fileId: string
  photoType: EvidencePhotoType
  caption?: string
  takenAt?: string
  uploadedBy?: string
  isRepresentative: boolean
  reportInclude: boolean
  markupInfo?: PhotoMarkupInfo
  createdAt: string
  updatedAt: string
}
```

### PhotoMarkupInfo

```ts
type PhotoMarkupShapeType =
  | 'ellipse'
  | 'rectangle'
  | 'arrow'
  | 'text'
  | 'freehand'

type PhotoMarkupShape = {
  id: string
  type: PhotoMarkupShapeType
  x: number
  y: number
  width?: number
  height?: number
  points?: Array<{ x: number; y: number }>
  text?: string
  strokeColor?: string
  strokeStyle?: 'solid' | 'dashed'
  strokeWidth?: number
}

type PhotoMarkupInfo = {
  version: number
  imageWidth: number
  imageHeight: number
  shapes: PhotoMarkupShape[]
}
```

### PhotoLedger

```ts
type PhotoLedgerStatus =
  | 'draft'
  | 'review'
  | 'confirmed'
  | 'exported'
  | 'synced_to_report'

type PhotoLedger = {
  id: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId?: string
  documentId?: string
  title: string
  status: PhotoLedgerStatus
  layoutType: 'one_entry_per_page' | 'two_entries_per_page'
  createdAt: string
  updatedAt: string
}
```

### PhotoLedgerEntry

```ts
type PhotoLedgerEntry = {
  id: string
  photoLedgerId: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId?: string
  findingId: string
  correctiveActionId?: string
  findingTitle: string
  actionTitle?: string
  findingCaption: string
  actionCaption?: string
  findingPhotoIds: string[]
  actionPhotoIds: string[]
  representativeFindingPhotoId?: string
  representativeActionPhotoId?: string
  pageNo?: number
  displayOrder: number
  warnings: PhotoLedgerWarning[]
  createdAt: string
  updatedAt: string
}
```

### PhotoLedgerWarning

```ts
type PhotoLedgerWarning = {
  type:
    | 'missing_finding_photo'
    | 'missing_action_photo'
    | 'missing_action'
    | 'missing_caption'
    | 'unverified_action'
    | 'owner_mismatch'
    | 'file_missing'
    | 'markup_invalid'
  message: string
  severity: 'info' | 'warning' | 'danger'
}
```

## 5. Validation Rules

### Finding

- `projectId`는 필수다.
- `inspectionRoundId`는 필수다.
- `title`은 필수다.
- `requiredAction`은 `action_requested` 상태 전 필수다.
- `ownerPartyId`가 있으면 해당 project의 owner ProjectParty여야 한다.
- `closed` 상태가 되려면 verified 상태의 CorrectiveAction이 하나 이상 있어야 한다.

### CorrectiveAction

- `findingId`는 필수다.
- `actionDetail`은 submitted 상태 전 필수다.
- `verified` 상태가 되려면 `verifiedBy`와 `verifiedAt`이 필요하다.
- `rejected` 상태가 되려면 `rejectedReason`이 필요하다.

### EvidencePhoto

- `fileId`는 필수다.
- `photoType = action_photo`이면 `correctiveActionId`를 권장한다.
- `photoType = finding_photo`이면 `findingId`를 권장한다.
- `reportInclude = true`이면 `caption`을 권장한다.

### PhotoLedger

- `inspectionRoundId`는 필수다.
- entry는 최소 1개 이상이어야 export 가능하다.
- 각 entry는 `findingId`를 가져야 한다.
- `confirmed` 상태가 되려면 danger warning이 없어야 한다.
- `synced_to_report` 상태가 되려면 `documentId`가 필요하다.

## 6. Service Rules

### Finding 생성

```text
1. Project 확인
2. InspectionRound 확인
3. ownerPartyId 확인
4. sourceType/sourceId 중복 확인
5. Finding 저장
6. 지적사진 연결
7. FindingTimelineEvent 생성
8. AuditLog 기록
```

### 조치 요청

```text
1. Finding 상태 확인
2. responsiblePartyId 확인
3. requiredAction 확인
4. status = action_requested
5. 조치요청 메일 초안 생성 가능
6. timeline event 생성
```

### 조치 등록

```text
1. CorrectiveAction 생성
2. 조치사진 연결
3. Finding.status = action_submitted
4. timeline event 생성
```

### 조치 확인

```text
1. CorrectiveAction 확인
2. actionDetail, actionPhoto 확인
3. verifiedBy, verifiedAt 저장
4. CorrectiveAction.status = verified
5. Finding.status = verified
6. timeline event 생성
```

### 사진대지 항목 생성

```text
1. InspectionRound의 Findings 조회
2. reportInclude = true 항목 필터
3. ownerPartyId 조건 적용
4. 각 Finding의 대표 지적사진 조회
5. verified CorrectiveAction 조회
6. 대표 조치사진 조회
7. PhotoLedgerEntry 생성
8. caption 자동 생성
9. warning 검증
```

### 보고서 동기화

```text
1. PhotoLedger validate
2. DocumentInstance 조회
3. photo_ledger section 교체 또는 갱신
4. DocumentVersion 생성
5. PhotoLedger.status = synced_to_report
6. OwnerReportTask 업데이트
```

## 7. Report Mapping

| Source | Target Report Section |
|---|---|
| Finding.title | photo_ledger.findingCaption |
| CorrectiveAction.actionDetail | photo_ledger.actionCaption |
| EvidencePhoto.finding_photo | photo_ledger.findingPhoto |
| EvidencePhoto.action_photo | photo_ledger.actionPhoto |
| Finding.title | implementation_confirmation.needsImprovement |
| Finding.source additional_hazard | additional_hazard_checklist |
| Finding.source risk_reduction | risk_reduction_checklist |

## 8. Seed Findings

### 삼성문화재단

1. 엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치 미비
   - 조치: 엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치

2. 가설분전함 정·부 책임자 지정 미비
   - 조치: 가설분전함 정·부 책임자 지정 및 지정관리자가 지속적 관리

### 삼성생명공익재단

1. 방우형 콘센트 덮개 파손으로 인해 감전사고 우려
   - 조치: 파손된 방우형 콘센트 교체하여 사용

2. 가설분전함의 전선배선 피복 노출부 임시 보완처리 미비
   - 조치: 가설분전함의 전선배선 피복 노출부 전기용 절연테이프로 보완조치

3. 케이블 릴 전선 풀림상태 안전조치 미비
   - 조치: 케이블 릴 전선 2줄 이상 감김 상태 유지 확인

## 9. Tests

```text
test_finding_create_success
test_finding_requires_project_and_round
test_finding_owner_party_must_be_owner
test_finding_from_checklist_candidate
test_finding_prevent_duplicate_source
test_finding_request_action_changes_status
test_corrective_action_submit_success
test_corrective_action_verify_success
test_corrective_action_reject_requires_reason
test_finding_close_requires_verified_action
test_evidence_photo_upload_link_finding
test_evidence_photo_markup_saved
test_photo_ledger_create_success
test_photo_ledger_generate_entries_from_findings
test_photo_ledger_warns_missing_action_photo
test_photo_ledger_warns_unverified_action
test_photo_ledger_owner_filter
test_photo_ledger_reorder_entries
test_photo_ledger_export_uses_confirmed_entries
test_photo_ledger_sync_to_safety_report
test_action_request_mail_draft_includes_findings
```


---

## FILE: `docs/aec-erp/06-finding-action-photo-ledger/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 지적사항/조치현황/사진대지

## 1. 화면 목표

지적사항/조치현황/사진대지 화면은 현장점검에서 발견된 문제를 조치 완료까지 추적하고, 보고서에 들어갈 사진대지를 구성하는 작업 화면이다.

핵심 목표:

- 지적사항과 조치현황의 1:1 또는 1:N 관계를 명확히 보여준다.
- 지적사진과 조치사진을 쉽게 매칭한다.
- 조치 확인 전/후 상태를 명확히 구분한다.
- A4 사진대지 미리보기에서 최종 보고서 형태를 확인한다.
- 발주처별 보고서에 반영될 사진대지를 분리한다.
- 원본 사진을 훼손하지 않는 overlay 마크업 방식을 사용한다.

## 2. 화면 목록

### 2.1 지적사항 목록

Route:

```text
/inspections/[inspectionRoundId]/findings
```

주요 영역:

- 점검회차 헤더
- 발주처 필터
- 상태 필터
- 위험유형 필터
- 지적사항 테이블
- 미조치/조치대기/확인대기 요약 카드
- 조치요청 메일 버튼

테이블 컬럼:

| 컬럼 | 설명 |
|---|---|
| 상태 | open/action_requested/verified 등 |
| 발주처 | 해당 발주처 |
| 지적사항 | 제목 |
| 위험유형 | 전기/화재/추락 등 |
| 책임 조직 | 시공사 등 |
| 조치기한 | due date |
| 지적사진 | count |
| 조치사진 | count |
| 조치상태 | submitted/verified |
| 보고서 반영 | 포함 여부 |

### 2.2 지적사항 상세

Route:

```text
/findings/[findingId]
```

구성:

- 상단 지적사항 요약
- 상태 stepper
- 원본 체크리스트/추가위험 연결
- 지적사진 갤러리
- 조치현황 목록
- 조치사진 갤러리
- 확인/반려 패널
- timeline

### 2.3 조치현황 입력

Route:

```text
/findings/[findingId]/actions
```

구성:

- 조치내용 입력
- 조치일 입력
- 조치 담당자/조직
- 조치사진 업로드
- 제출 버튼
- 재조치 요청/반려 사유 입력
- 확인 버튼과 반려 버튼 분리

### 2.4 사진 관리/마크업

Route:

```text
/findings/[findingId]/photos
```

구성:

- 지적사진 탭
- 조치사진 탭
- 현장전경/상세사진 탭
- 사진 업로드
- 사진 grid
- 선택한 사진 큰 preview
- 마크업 toolbar
- 캡션 편집
- 대표사진 선택
- 보고서 반영 toggle

마크업 toolbar:

- 노란 점선 원형/타원
- 사각형
- 화살표
- 텍스트
- 자유선
- 삭제
- 저장

### 2.5 사진대지 빌더

Route:

```text
/inspections/[inspectionRoundId]/photo-ledger
```

구성:

```text
Left: 지적사항 목록 / 발주처 필터 / 상태 필터
Center: PhotoLedgerEntry cards / 지적사진·조치사진 매칭
Right: 캡션 편집 / warning / A4 미리보기
```

기능:

- drag-and-drop 순서 변경
- 대표 지적사진 선택
- 대표 조치사진 선택
- 캡션 자동 생성
- warning badge 표시
- 발주처별 필터링

### 2.6 사진대지 미리보기

Route:

```text
/photo-ledgers/[photoLedgerId]/preview
```

표시:

- A4 페이지
- 제N회 제목
- 지적사항 행
- 지적사진
- 조치현황 행
- 조치사진
- 페이지 번호
- 초안 watermark
- 마크업 overlay

## 3. UX 규칙

1. 지적사항은 상태별 색상 badge를 표시한다.
2. 지적사진과 조치사진을 명확히 구분한다.
3. 조치 확인 전에는 `조치 확인 필요` badge를 표시한다.
4. 조치사진이 없으면 사진대지 export 전 warning을 표시한다.
5. 조치가 verified가 아니면 사진대지 반영 시 warning을 표시한다.
6. 발주처별 필터를 제공한다.
7. 발주처가 다른 사진 또는 지적사항이 섞이면 danger warning을 표시한다.
8. 원본 사진은 수정하지 않고 overlay metadata로만 마크업한다.
9. A4 preview는 실제 사진대지처럼 상단 제목, 지적사항, 조치현황, 사진 영역을 보여준다.
10. 사진대지 동기화 시 보고서 version을 새로 만든다.

## 4. 컴포넌트 상세

### FindingTable

컬럼:

- 상태
- 발주처
- 지적사항
- 위험유형
- 책임조직
- 조치기한
- 지적사진 수
- 조치사진 수
- 조치상태
- 보고서 반영

### FindingTimeline

이벤트:

- 생성
- 사진 추가
- 조치 요청
- 조치 제출
- 확인 요청
- 확인 완료
- 반려
- 보고서 반영

### PhotoPairMatcher

표시:

- Finding Photo column
- Action Photo column
- Match status
- 대표사진 선택
- 캡션 입력
- warning badge

### PhotoMarkupEditor

도구:

- ellipse
- rectangle
- arrow
- text
- freehand
- undo
- redo
- clear
- save markup

기본 강조 스타일:

```text
yellow dashed ellipse
```

### PhotoLedgerEntryCard

표시:

- 회차 제목
- 지적사항
- 조치현황
- 지적사진 썸네일
- 조치사진 썸네일
- warning badge
- 순서 핸들
- 보고서 반영 여부

### PhotoLedgerA4Preview

A4 구조:

```text
상단: 제1회(2026.1.23.) 공사안전보건대장 이행여부 확인
지적 사항: ...
지적사진
조치 현황: ...
조치사진
```

## 5. Empty State

### 지적사항이 없을 때

```text
등록된 지적사항이 없습니다.
체크리스트의 주의/불량 항목에서 지적사항을 생성하거나 직접 등록하세요.
```

버튼:

- 지적사항 직접 등록
- 체크리스트 후보 확인

### 조치현황이 없을 때

```text
아직 등록된 조치현황이 없습니다.
시공사에 조치를 요청하거나 조치내용을 직접 등록하세요.
```

버튼:

- 조치요청 메일 작성
- 조치현황 등록

### 사진대지 항목이 없을 때

```text
사진대지에 반영할 지적사항이 없습니다.
보고서 반영 대상 지적사항을 선택하세요.
```

## 6. Warning State

### 조치사진 누락

```text
조치사진이 등록되지 않았습니다.
사진대지에는 지적사진과 조치사진이 함께 표시되는 것을 권장합니다.
```

### 조치 미확인

```text
조치가 제출되었지만 아직 확인되지 않았습니다.
확인 전 사진대지 반영 시 검토 경고가 표시됩니다.
```

### 발주처 불일치

```text
선택한 사진 또는 지적사항의 발주처가 현재 사진대지 발주처와 다릅니다.
```

### 원본 파일 누락

```text
사진 원본 파일을 찾을 수 없습니다.
웹하드 파일 연결 상태를 확인하세요.
```

## 7. Responsive

### Desktop

- 지적사항 목록은 table
- 상세는 2-column
- 사진대지 빌더는 3-column
- A4 미리보기 고정

### Tablet

- 사진대지 빌더는 list + preview toggle
- 사진 마크업은 modal

### Mobile

- 지적사항 card list
- 사진 업로드/촬영 중심
- 조치 등록 form 간소화
- A4 미리보기는 별도 화면


---

## FILE: `docs/aec-erp/06-finding-action-photo-ledger/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 지적사항/조치현황/사진대지

## 1. Feature

```yaml
featureId: finding.action.photo_ledger
featureName: 지적사항/조치현황/사진대지
priority: P0
module: finding-action-photo-ledger
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 프로젝트 지적사항 | `/projects/[projectId]/findings` | 프로젝트 전체 지적사항 |
| 점검회차 지적사항 | `/inspections/[inspectionRoundId]/findings` | 회차별 지적사항 |
| 지적사항 생성 | `/inspections/[inspectionRoundId]/findings/new` | 수동 지적사항 등록 |
| 지적사항 상세 | `/findings/[findingId]` | 지적/조치/사진/이력 |
| 지적사항 수정 | `/findings/[findingId]/edit` | 제목/상세/기한 수정 |
| 조치현황 | `/findings/[findingId]/actions` | 조치 등록/확인 |
| 사진 관리 | `/findings/[findingId]/photos` | 지적사진/조치사진 |
| 조치 확인 | `/findings/[findingId]/verify` | 확인/반려 |
| 사진대지 목록 | `/inspections/[inspectionRoundId]/photo-ledger` | 회차별 사진대지 |
| 사진대지 생성 | `/inspections/[inspectionRoundId]/photo-ledger/new` | 발주처별 사진대지 생성 |
| 사진대지 편집 | `/photo-ledgers/[photoLedgerId]/edit` | 매칭/캡션/순서 |
| 사진대지 미리보기 | `/photo-ledgers/[photoLedgerId]/preview` | A4 미리보기 |
| 사진대지 export | `/photo-ledgers/[photoLedgerId]/export` | PDF/HWPX 또는 보고서 동기화 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/projects/[projectId]/findings` | FindingTable, FindingStatusBadge, FindingRiskBadge |
| `/inspections/[inspectionRoundId]/findings` | FindingTable, OwnerPhotoLedgerFilter |
| `/findings/[findingId]` | FindingSourceLinkPanel, FindingTimeline, FindingPhotoGallery |
| `/findings/[findingId]/actions` | CorrectiveActionForm, CorrectiveActionTable, VerificationPanel |
| `/findings/[findingId]/photos` | PhotoUploader, PhotoGrid, PhotoMarkupEditor, PhotoCaptionEditor |
| `/inspections/[inspectionRoundId]/photo-ledger` | PhotoPairMatcher, PhotoLedgerEntryTable, PhotoLedgerA4Preview |
| `/photo-ledgers/[photoLedgerId]/edit` | PhotoLedgerEntryCard, PhotoCaptionEditor, MissingPhotoWarningPanel |
| `/photo-ledgers/[photoLedgerId]/preview` | PhotoLedgerA4Preview, PhotoLedgerExportChecklist |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| FindingTable | GET `/api/v1/inspection-rounds/{inspectionRoundId}/findings` |
| FindingForm | POST `/api/v1/inspection-rounds/{inspectionRoundId}/findings` |
| FindingStatusBadge | GET `/api/v1/findings/{findingId}` |
| CorrectiveActionForm | POST `/api/v1/findings/{findingId}/actions` |
| VerificationPanel | POST `/api/v1/corrective-actions/{actionId}/verify`, POST `/api/v1/corrective-actions/{actionId}/reject` |
| PhotoUploader | POST `/api/v1/findings/{findingId}/photos/upload` |
| PhotoMarkupEditor | POST `/api/v1/evidence-photos/{photoId}/markup` |
| PhotoCaptionEditor | POST `/api/v1/evidence-photos/{photoId}/set-caption` |
| PhotoPairMatcher | PATCH `/api/v1/photo-ledger-entries/{entryId}` |
| PhotoLedgerA4Preview | GET `/api/v1/photo-ledgers/{photoLedgerId}` |
| PhotoLedgerExportChecklist | POST `/api/v1/photo-ledgers/{photoLedgerId}/validate` |
| ActionRequestMailButton | POST `/api/v1/findings/action-request-mail/draft` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET `/findings` | Finding |
| POST `/findings` | Finding, FindingTimelineEvent |
| POST `/request-action` | Finding, MailDraft |
| POST `/actions` | CorrectiveAction, FindingTimelineEvent |
| POST `/verify` | CorrectiveAction, Finding |
| POST `/photos/upload` | EvidencePhoto, FileAsset |
| POST `/markup` | EvidencePhoto, PhotoMarkupInfo |
| POST `/photo-ledgers` | PhotoLedger |
| POST `/generate-entries` | PhotoLedgerEntry, Finding, CorrectiveAction, EvidencePhoto |
| POST `/validate` | PhotoLedgerWarning |
| POST `/sync-to-report` | PhotoLedger, DocumentInstance, SafetyReportVersion |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| Finding | finding-action-photo-ledger |
| CorrectiveAction | finding-action-photo-ledger |
| EvidencePhoto | finding-action-photo-ledger |
| PhotoLedgerEntry | finding-action-photo-ledger |
| PhotoLedger | finding-action-photo-ledger |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 지적사항 생성 | test_finding_create_success |
| 필수 연결키 | test_finding_requires_project_and_round |
| 발주처 검증 | test_finding_owner_party_must_be_owner |
| 체크리스트 후보 전환 | test_finding_from_checklist_candidate |
| 중복 방지 | test_finding_prevent_duplicate_source |
| 조치 요청 | test_finding_request_action_changes_status |
| 조치 제출 | test_corrective_action_submit_success |
| 조치 확인 | test_corrective_action_verify_success |
| 조치 반려 | test_corrective_action_reject_requires_reason |
| 종결 조건 | test_finding_close_requires_verified_action |
| 사진 연결 | test_evidence_photo_upload_link_finding |
| 사진 마크업 | test_evidence_photo_markup_saved |
| 사진대지 생성 | test_photo_ledger_create_success |
| 사진대지 항목 자동 생성 | test_photo_ledger_generate_entries_from_findings |
| 조치사진 누락 경고 | test_photo_ledger_warns_missing_action_photo |
| 미확인 조치 경고 | test_photo_ledger_warns_unverified_action |
| 발주처 필터 | test_photo_ledger_owner_filter |
| 순서 변경 | test_photo_ledger_reorder_entries |
| export | test_photo_ledger_export_uses_confirmed_entries |
| 보고서 동기화 | test_photo_ledger_sync_to_safety_report |
| 조치요청 메일 | test_action_request_mail_draft_includes_findings |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ownerPartyId |
| 점검회차/일정 | inspectionRoundId |
| 현장점검 체크리스트 | FindingCandidate, ChecklistResult |
| 보고서 자동화 | photo_ledger section, needsImprovement |
| 산업안전보건관리비 | 총평의 문서관리/예산관리와 함께 표시 |
| 웹하드 | EvidencePhoto.fileId, exported PhotoLedger |
| 메일함 | 조치요청 메일, 시공사 회신 |
| 결재/제출 | 보고서 최종본 export 전 확인 |
| 관리자/템플릿 | 사진대지 레이아웃 템플릿 |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 지적사진과 조치사진 매칭 오류 | PhotoPairMatcher와 대표사진 선택 |
| 조치 미확인 상태가 완료로 표시 | verified 상태만 완료 표현 |
| 발주처별 사진대지 혼동 | ownerPartyId 필터 |
| 원본 사진 훼손 | markupInfo overlay 저장 |
| 사진대지 export 전 사진 누락 | validate endpoint와 warning |
| 기존 보고서와 사진대지 불일치 | sync-to-report 후 DocumentVersion 생성 |
| 중복 지적사항 | sourceType + sourceId 중복 검증 |
| 메일 조치요청 누락 | ActionRequestMailDraft 생성 |


---

## FILE: `docs/aec-erp/06-finding-action-photo-ledger/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 지적사항/조치현황/사진대지 캡션 생성

## Prompt ID

`finding-action-photo-ledger`

## 목적

지적사항, 조치현황, 지적사진, 조치사진을 보고서 사진대지에 들어갈 문구와 구조로 정리한다.

## Prompt

```text
너는 A&C기술사 ERP의 지적사항/조치현황/사진대지 작성 보조 엔진이다.

입력:
- project
- inspectionRound
- ownerParty
- finding
- correctiveActions
- evidencePhotos
- checklistResult
- additionalHazardItem
- riskReductionItem
- existingPhotoLedgerEntries
- userInstruction

목표:
지적사항과 조치현황을 공사안전보건대장 이행확인 보고서의 사진대지 형식으로 정리한다.

해야 할 일:
1. 지적사항 제목을 보고서용 문구로 정리한다.
2. 조치현황을 완료형 문장으로 정리한다.
3. 지적사진과 조치사진을 매칭한다.
4. 사진대지 캡션을 작성한다.
5. 지적사항이 총평의 보완 필요 항목에 들어갈 문구를 작성한다.
6. 추가 유해·위험요인 또는 위험성 감소대책과 연결된 경우 해당 표에 들어갈 문구도 제안한다.
7. 조치가 확인되지 않았으면 조치완료로 표현하지 않는다.
8. 사진이 없으면 사진 누락 warning을 표시한다.
9. 발주처가 다른 사진 또는 지적사항이 섞이면 owner_mismatch warning을 표시한다.
10. 문구는 간결한 한국어 실무 보고서 문체로 작성한다.

작성 규칙:
- 입력에 없는 사실을 만들지 않는다.
- 사진이 없는 경우 사진이 있다고 쓰지 않는다.
- 조치가 submitted 상태라도 verified가 아니면 "조치 확인 필요"로 표시한다.
- 조치가 rejected 상태이면 "재조치 필요"로 표시한다.
- 지적사항 문구는 명사형 또는 간결한 서술형으로 작성한다.
- 조치현황 문구는 실제 조치내용 기반으로 작성한다.
- 법령 문구를 임의로 추가하지 않는다.
- 발주처별 보고서인 경우 ownerParty 기준으로만 작성한다.

출력 JSON:
{
  "findingSummary": {
    "findingId": "",
    "findingCaption": "",
    "findingReportPhrase": "",
    "needsImprovementPhrase": "",
    "riskType": "",
    "ownerPartyId": null
  },
  "actionSummary": {
    "correctiveActionId": null,
    "actionCaption": "",
    "actionReportPhrase": "",
    "verificationStatus": "not_submitted | submitted | verified | rejected | unknown",
    "verificationComment": ""
  },
  "photoPair": {
    "findingPhotoIds": [],
    "actionPhotoIds": [],
    "representativeFindingPhotoId": null,
    "representativeActionPhotoId": null,
    "pairingConfidence": 0.0
  },
  "photoLedgerEntryDraft": {
    "title": "",
    "header": "",
    "findingLabel": "지적 사항",
    "findingCaption": "",
    "actionLabel": "조치 현황",
    "actionCaption": "",
    "displayOrderHint": null
  },
  "reportMappings": {
    "implementationConfirmation": [],
    "riskReductionChecklist": [],
    "additionalHazardChecklist": [],
    "photoLedger": []
  },
  "missingFields": [
    {
      "field": "",
      "label": "",
      "reason": ""
    }
  ],
  "warnings": [
    {
      "type": "missing_finding_photo | missing_action_photo | missing_action | unverified_action | owner_mismatch | duplicate_entry | file_missing | markup_invalid",
      "severity": "info | warning | danger",
      "message": ""
    }
  ]
}
```

## Few-shot 기준

### 입력 예시 1

```json
{
  "finding": {
    "title": "방우형 콘센트 덮개 파손으로 인해 감전사고 우려"
  },
  "correctiveActions": [
    {
      "actionDetail": "파손된 방우형 콘센트 교체하여 사용",
      "status": "verified"
    }
  ]
}
```

출력 방향:

```text
지적 사항: 방우형 콘센트 덮개 파손으로 인해 감전사고 우려
조치 현황: 파손된 방우형 콘센트 교체하여 사용
```

### 입력 예시 2

```json
{
  "finding": {
    "title": "엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치 미비"
  },
  "correctiveActions": [
    {
      "actionDetail": "엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치",
      "status": "verified"
    }
  ]
}
```

출력 방향:

```text
지적 사항: 엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치 미비
조치 현황: 엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치
```

## 금지사항

- 조치사진이 없는데 조치사진이 있다고 표시하지 않는다.
- 조치 미확인 상태를 조치완료로 표현하지 않는다.
- 발주처가 다른 지적사항을 같은 사진대지에 섞지 않는다.
- 입력에 없는 원인이나 법적 판단을 추가하지 않는다.
```


---

## FILE: `docs/aec-erp/06-finding-action-photo-ledger/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 지적사항/조치현황/사진대지

## Prompt

```text
You are implementing the Finding, Corrective Action, and Photo Ledger module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module manages findings, corrective actions, evidence photos, photo markups, photo ledger entries, action request mails, and synchronization to safety reports.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Finding/Corrective Action/Photo Ledger module.

Existing concepts:
- Project
- ProjectParty
- InspectionRound
- ChecklistResult
- FindingCandidate
- AdditionalHazardItem
- RiskReductionChecklistItem
- DocumentInstance
- FileAsset
- Folder
- MailThread
- Submission
- AuditLog

Required backend models:
- Finding
- CorrectiveAction
- EvidencePhoto
- PhotoMarkupInfo
- PhotoMarkupShape
- PhotoLedger
- PhotoLedgerEntry
- PhotoLedgerWarning
- FindingTimelineEvent
- ActionRequestMailDraft

Required backend APIs:

Findings:
- GET /api/v1/projects/{projectId}/findings
- POST /api/v1/projects/{projectId}/findings
- GET /api/v1/inspection-rounds/{inspectionRoundId}/findings
- POST /api/v1/inspection-rounds/{inspectionRoundId}/findings
- GET /api/v1/findings/{findingId}
- PATCH /api/v1/findings/{findingId}
- DELETE /api/v1/findings/{findingId}
- POST /api/v1/findings/{findingId}/request-action
- POST /api/v1/findings/{findingId}/verify
- POST /api/v1/findings/{findingId}/reject
- POST /api/v1/findings/{findingId}/close
- POST /api/v1/findings/{findingId}/link-checklist-result
- POST /api/v1/findings/{findingId}/link-owner

Corrective Actions:
- GET /api/v1/findings/{findingId}/actions
- POST /api/v1/findings/{findingId}/actions
- GET /api/v1/corrective-actions/{actionId}
- PATCH /api/v1/corrective-actions/{actionId}
- DELETE /api/v1/corrective-actions/{actionId}
- POST /api/v1/corrective-actions/{actionId}/submit
- POST /api/v1/corrective-actions/{actionId}/verify
- POST /api/v1/corrective-actions/{actionId}/reject

Photos:
- GET /api/v1/findings/{findingId}/photos
- POST /api/v1/findings/{findingId}/photos/upload
- POST /api/v1/findings/{findingId}/photos/link
- PATCH /api/v1/evidence-photos/{photoId}
- DELETE /api/v1/evidence-photos/{photoId}
- POST /api/v1/evidence-photos/{photoId}/markup
- POST /api/v1/evidence-photos/{photoId}/set-caption
- POST /api/v1/evidence-photos/{photoId}/set-representative

Photo Ledger:
- GET /api/v1/inspection-rounds/{inspectionRoundId}/photo-ledgers
- POST /api/v1/inspection-rounds/{inspectionRoundId}/photo-ledgers
- GET /api/v1/photo-ledgers/{photoLedgerId}
- PATCH /api/v1/photo-ledgers/{photoLedgerId}
- DELETE /api/v1/photo-ledgers/{photoLedgerId}
- POST /api/v1/photo-ledgers/{photoLedgerId}/generate-entries
- GET /api/v1/photo-ledgers/{photoLedgerId}/entries
- POST /api/v1/photo-ledgers/{photoLedgerId}/entries
- PATCH /api/v1/photo-ledger-entries/{entryId}
- DELETE /api/v1/photo-ledger-entries/{entryId}
- POST /api/v1/photo-ledgers/{photoLedgerId}/reorder
- POST /api/v1/photo-ledgers/{photoLedgerId}/validate
- POST /api/v1/photo-ledgers/{photoLedgerId}/export
- POST /api/v1/photo-ledgers/{photoLedgerId}/sync-to-report

Mail Integration:
- POST /api/v1/findings/action-request-mail/draft
- POST /api/v1/findings/action-request-mail/send

Required frontend routes:
- /projects/[projectId]/findings
- /projects/[projectId]/findings/new
- /inspections/[inspectionRoundId]/findings
- /inspections/[inspectionRoundId]/findings/new
- /findings/[findingId]
- /findings/[findingId]/edit
- /findings/[findingId]/actions
- /findings/[findingId]/photos
- /findings/[findingId]/verify
- /inspections/[inspectionRoundId]/photo-ledger
- /inspections/[inspectionRoundId]/photo-ledger/new
- /photo-ledgers/[photoLedgerId]
- /photo-ledgers/[photoLedgerId]/edit
- /photo-ledgers/[photoLedgerId]/preview
- /photo-ledgers/[photoLedgerId]/export

Required frontend components:
- FindingTable
- FindingStatusBadge
- FindingRiskBadge
- FindingForm
- FindingSourceLinkPanel
- FindingTimeline
- FindingPhotoGallery
- CorrectiveActionForm
- CorrectiveActionTable
- CorrectiveActionStatusBadge
- VerificationPanel
- ActionRequestMailButton
- PhotoUploader
- PhotoGrid
- PhotoPairMatcher
- PhotoMarkupEditor
- PhotoCaptionEditor
- PhotoLedgerEntryCard
- PhotoLedgerEntryTable
- PhotoLedgerA4Preview
- PhotoLedgerExportChecklist
- OwnerPhotoLedgerFilter
- MissingPhotoWarningPanel

Business requirements:
1. Finding must belong to Project and InspectionRound.
2. Finding may belong to ownerPartyId for owner-specific reports.
3. Finding can be created from FindingCandidate, ChecklistResult, AdditionalHazardItem, RiskReductionChecklistItem, photo, mail, or manual input.
4. sourceType + sourceId duplication should be prevented.
5. CorrectiveAction must belong to Finding.
6. Finding cannot be closed unless at least one CorrectiveAction is verified.
7. EvidencePhoto must be linked to FileAsset.
8. Photo markup must be saved as overlay metadata and must not modify the original image.
9. Yellow dashed ellipse should be supported as the default markup style.
10. PhotoLedger should generate entries from reportInclude=true findings.
11. PhotoLedger owner filter must respect ownerPartyId.
12. PhotoLedger validation must warn missing finding photo, missing action photo, missing action, unverified action, owner mismatch, file missing, and invalid markup.
13. PhotoLedger sync-to-report should update DocumentInstance photo_ledger section and create a new document version.
14. Action request mail draft should include selected findings, required actions, due dates, and photos.
15. All status transitions should create timeline events and audit logs.

Seed data:
Create demo findings for the Leeum elevator replacement project:

Owner: 삼성문화재단
- Finding: 엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치 미비
  Action: 엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치
- Finding: 가설분전함 정·부 책임자 지정 미비
  Action: 가설분전함 정·부 책임자 지정 및 지정관리자가 지속적 관리

Owner: 삼성생명공익재단
- Finding: 방우형 콘센트 덮개 파손으로 인해 감전사고 우려
  Action: 파손된 방우형 콘센트 교체하여 사용
- Finding: 가설분전함의 전선배선 피복 노출부 임시 보완처리 미비
  Action: 가설분전함의 전선배선 피복 노출부 전기용 절연테이프로 보완조치
- Finding: 케이블 릴 전선 풀림상태 안전조치 미비
  Action: 케이블 릴 전선 2줄 이상 감김 상태 유지 확인

Validation:
1. projectId is required for Finding.
2. inspectionRoundId is required for Finding.
3. ownerPartyId must be an owner ProjectParty if provided.
4. title is required.
5. requiredAction is required before action_requested status.
6. CorrectiveAction submit requires actionDetail.
7. CorrectiveAction verify requires verifiedBy and verifiedAt.
8. CorrectiveAction reject requires rejectedReason.
9. EvidencePhoto requires fileId.
10. PhotoLedger export requires at least one entry.
11. PhotoLedger confirmed status cannot have danger warnings.
12. sync-to-report requires documentId.

Tests:
- test_finding_create_success
- test_finding_requires_project_and_round
- test_finding_owner_party_must_be_owner
- test_finding_from_checklist_candidate
- test_finding_prevent_duplicate_source
- test_finding_request_action_changes_status
- test_corrective_action_submit_success
- test_corrective_action_verify_success
- test_corrective_action_reject_requires_reason
- test_finding_close_requires_verified_action
- test_evidence_photo_upload_link_finding
- test_evidence_photo_markup_saved
- test_photo_ledger_create_success
- test_photo_ledger_generate_entries_from_findings
- test_photo_ledger_warns_missing_action_photo
- test_photo_ledger_warns_unverified_action
- test_photo_ledger_owner_filter
- test_photo_ledger_reorder_entries
- test_photo_ledger_export_uses_confirmed_entries
- test_photo_ledger_sync_to_safety_report
- test_action_request_mail_draft_includes_findings

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Photo ledger generation service
- Photo ledger validation service
- Photo markup metadata service
- Action request mail draft service
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```


---

## FILE: `docs/aec-erp/06-finding-action-photo-ledger/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 지적사항/조치현황/사진대지

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "지적사항/조치현황/사진대지" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 현장점검 중 발견한 지적사항을 시공사 조치현황과 연결하고, 보고서 사진대지로 자동 구성하는 ERP
- 지적사항은 체크리스트 주의/불량 항목 또는 추가 유해·위험요인에서 생성된다.
- 사진대지는 공사안전보건대장 이행확인 보고서에 들어가는 제출용 페이지다.
- 같은 점검회차라도 발주처별 사진대지가 다를 수 있다.

화면 1: 지적사항 목록
- 좌측 ERP 사이드바
- 상단 프로젝트/점검회차 헤더
- 요약 카드:
  - 전체 지적사항
  - 미조치
  - 조치요청
  - 조치제출
  - 확인완료
  - 사진누락
- 필터:
  - 발주처
  - 상태
  - 위험유형
  - 책임조직
  - 보고서 반영 여부
- 중앙 지적사항 table
- 우측 빠른 작업 패널:
  - 조치요청 메일 작성
  - 사진대지 생성
  - 미확인 조치
  - 사진 누락

테이블 컬럼:
- 상태
- 발주처
- 지적사항
- 위험유형
- 책임조직
- 조치기한
- 지적사진 수
- 조치사진 수
- 조치상태
- 보고서 반영

화면 2: 지적사항 상세
- 상단에 지적사항 제목, 상태, 발주처, 점검회차, 위험유형 표시
- 상태 stepper:
  - 지적 등록
  - 조치 요청
  - 조치 제출
  - 확인 요청
  - 확인 완료
  - 종결
- 본문 2-column:
  - 좌측: 지적사항 상세, 원본 체크리스트, 지적사진
  - 우측: 조치현황, 조치사진, 확인/반려 패널
- 하단 timeline:
  - 생성
  - 사진 추가
  - 조치 요청
  - 조치 제출
  - 확인
  - 보고서 반영

화면 3: 조치현황 등록
- 조치내용 입력
- 조치일 입력
- 조치 담당자/조직
- 조치사진 업로드
- 제출 버튼
- 반려 사유 입력 UI
- 확인 버튼과 반려 버튼을 명확히 구분한다.

화면 4: 사진 관리/마크업
- 지적사진 탭
- 조치사진 탭
- 사진 grid
- 선택한 사진 큰 preview
- 마크업 toolbar:
  - 노란 점선 원형
  - 사각형
  - 화살표
  - 텍스트
  - 삭제
  - 저장
- 캡션 입력
- 대표사진 선택
- 보고서 반영 toggle

화면 5: 사진대지 빌더
- 좌측: 지적사항 목록
- 중앙: 지적사진/조치사진 매칭 영역
- 우측: 캡션 편집, warning, 발주처 필터
- 하단 또는 우측에 A4 사진대지 미리보기
- drag-and-drop으로 순서 변경
- 지적사진과 조치사진이 없는 항목은 warning 표시

화면 6: A4 사진대지 미리보기
- 실제 보고서처럼 흰색 A4 paper
- 상단 제목:
  - 제1회(2026.1.23.) 공사안전보건대장 이행여부 확인
- 지적 사항 행
- 지적사진
- 조치 현황 행
- 조치사진
- 페이지 번호
- 초안 watermark
- 사진 마크업은 노란 점선 원형으로 보이게 한다.

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- 배경은 밝은 회색
- 지적사항은 주황/빨강 계열로 강조
- 조치완료는 초록색
- 확인대기는 보라색
- 사진대지 미리보기는 공공 제출 문서처럼 단정하게
- 사진 썸네일과 상태 badge가 한눈에 보이게 한다.
- 한글 가독성을 최우선으로 한다.
- 사진대지 페이지는 샘플 보고서처럼 표와 사진 영역이 명확해야 한다.

상태 표현:
- open: red
- action_requested: orange
- action_submitted: blue
- verification_requested: purple
- verified: green
- closed: dark green
- rejected: red outline
- missing_photo: orange
- owner_mismatch: red

결과물:
- 지적사항 목록 화면
- 지적사항 상세 화면
- 조치현황 등록 화면
- 사진 관리/마크업 화면
- 사진대지 빌더 화면
- A4 사진대지 미리보기 화면
- 조치요청 메일 작성 진입 UI
```


---

## FILE: `docs/aec-erp/06-finding-action-photo-ledger/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 지적사항/조치현황/사진대지

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
지적사항/조치현황/사진대지

기능 설명:
지적사항/조치현황/사진대지는 현장점검 체크리스트의 주의·불량 항목 또는 추가 유해·위험요인에서 생성된 지적사항을 조치요청, 시공사 조치현황, 조치사진, 기술사 확인, 사진대지, 보고서 반영으로 연결하는 기능이다.

업무 맥락:
- Finding은 Project와 InspectionRound에 속한다.
- Finding은 ownerPartyId를 가질 수 있다.
- Finding은 ChecklistResult, AdditionalHazardItem, RiskReductionChecklistItem에서 생성될 수 있다.
- CorrectiveAction은 Finding에 속한다.
- EvidencePhoto는 Finding 또는 CorrectiveAction에 연결된다.
- PhotoLedger는 InspectionRound와 ownerPartyId 기준으로 생성된다.
- PhotoLedgerEntry는 지적사진과 조치사진을 매칭한다.
- 사진대지는 공사안전보건대장 이행확인 보고서의 photo_ledger section에 동기화된다.
- 조치요청은 메일함과 연결될 수 있다.
- 사진 원본은 웹하드 FileAsset과 연결되어야 한다.
- 사진 마크업은 원본을 훼손하지 않고 overlay metadata로 저장한다.

입력:
{
  "featureName": "지적사항/조치현황/사진대지",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "mailRequirements": [],
  "reportRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `finding.action.photo_ledger`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 점검회차/일정
    - 현장점검 체크리스트
    - 공사안전보건대장 이행확인 보고서 자동화
    - 산업안전보건관리비
    - 웹하드
    - 메일함
    - 결재/제출
    - 관리자/템플릿

출력 JSON:
{
  "featureId": "finding.action.photo_ledger",
  "featureName": "지적사항/조치현황/사진대지",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /projects/[projectId]/findings
- /projects/[projectId]/findings/new
- /inspections/[inspectionRoundId]/findings
- /inspections/[inspectionRoundId]/findings/new
- /findings/[findingId]
- /findings/[findingId]/edit
- /findings/[findingId]/actions
- /findings/[findingId]/photos
- /findings/[findingId]/verify
- /inspections/[inspectionRoundId]/photo-ledger
- /inspections/[inspectionRoundId]/photo-ledger/new
- /photo-ledgers/[photoLedgerId]
- /photo-ledgers/[photoLedgerId]/edit
- /photo-ledgers/[photoLedgerId]/preview
- /photo-ledgers/[photoLedgerId]/export

반드시 포함할 models:
- Finding
- CorrectiveAction
- EvidencePhoto
- PhotoMarkupInfo
- PhotoMarkupShape
- PhotoLedger
- PhotoLedgerEntry
- PhotoLedgerWarning
- FindingTimelineEvent
- ActionRequestMailDraft
- Project
- ProjectParty
- InspectionRound
- ChecklistResult
- FindingCandidate
- FileAsset
- DocumentInstance
- MailThread
- AuditLog

반드시 포함할 prompts:
- finding-action-photo-ledger
- finding-action-photo-ledger implementation prompt
- finding-action-photo-ledger design prompt

반드시 포함할 tests:
- test_finding_create_success
- test_finding_requires_project_and_round
- test_finding_owner_party_must_be_owner
- test_finding_from_checklist_candidate
- test_finding_prevent_duplicate_source
- test_finding_request_action_changes_status
- test_corrective_action_submit_success
- test_corrective_action_verify_success
- test_corrective_action_reject_requires_reason
- test_finding_close_requires_verified_action
- test_evidence_photo_upload_link_finding
- test_evidence_photo_markup_saved
- test_photo_ledger_create_success
- test_photo_ledger_generate_entries_from_findings
- test_photo_ledger_warns_missing_action_photo
- test_photo_ledger_warns_unverified_action
- test_photo_ledger_owner_filter
- test_photo_ledger_reorder_entries
- test_photo_ledger_export_uses_confirmed_entries
- test_photo_ledger_sync_to_safety_report
- test_action_request_mail_draft_includes_findings

주의:
- Finding은 Project와 InspectionRound 없이 생성될 수 없다.
- ownerPartyId가 있으면 owner ProjectParty인지 검증해야 한다.
- 지적사진과 조치사진은 구분되어야 한다.
- 조치 미확인 상태를 완료로 표시하면 안 된다.
- 원본 사진을 수정하지 말고 markupInfo overlay를 저장해야 한다.
- 발주처별 사진대지가 섞이면 owner_mismatch danger warning을 표시해야 한다.
- 사진대지 export는 confirmed entry 기준으로 수행되어야 한다.
- 보고서 동기화 후 DocumentVersion을 생성해야 한다.
- 조치요청 메일은 선택된 Finding과 dueDate, requiredAction, 사진을 포함해야 한다.
```


---

## FILE: `docs/aec-erp/07-safety-cost-usage/README.md`

# 기능 07 — 산업안전보건관리비 사용내용 확인

이 폴더는 A&C 기술사 ERP의 일곱 번째 기능인 `산업안전보건관리비 사용내용 확인` 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

산업안전보건관리비 사용내용 확인은 발주처별 계상금액, 사용금액, 사용률, 기준월, 관련근거, 적정성 의견, 증빙파일을 관리하고 공사안전보건대장 이행확인 보고서에 자동 반영하는 기능이다.

## 샘플 보고서 기준 데이터

### 삼성문화재단

- 계상금액: 99,462,613원
- 사용금액: 37,978,000원
- 사용률: 38.2%
- 기준: 1월말
- 관련근거: 산업안전보건관리비 사용내역서
- 적정성: 공사 특수성을 반영, 적정하게 사용 중으로 판단됨

### 삼성생명공익재단

- 계상금액: 66,928,618원
- 사용금액: 27,117,450원
- 사용률: 40.5%
- 기준: 1월말
- 관련근거: 산업안전보건관리비 사용내역서
- 적정성: 공사 특수성을 반영, 적정하게 사용 중으로 판단됨

## 핵심 설계 포인트

- 산업안전보건관리비는 Project 전체 값이 아니라 `projectId + inspectionRoundId + ownerPartyId` 기준 발주처별 값이 필요하다.
- 사용률은 시스템이 계산해야 하며, 입력 사용률과 계산 사용률이 다르면 warning을 표시한다.
- 기준월과 관련근거 파일이 없으면 보고서 export 전 경고한다.
- 적정성 의견은 입력자료와 점검결과에 근거한 검토용 문구로 작성해야 한다.
- 보고서의 공사개요 총평, 이행여부 확인서, 산업안전보건관리비 사용내용 확인 섹션에 동시에 반영된다.
- 증빙파일은 웹하드의 회차별 또는 안전관리비 폴더에 저장되어야 한다.


---

## FILE: `docs/aec-erp/07-safety-cost-usage/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 산업안전보건관리비 사용내용 확인

## 1. 기능 정의

산업안전보건관리비 사용내용 확인 기능은 A&C 기술사 ERP에서 발주처별 산업안전보건관리비 계상금액, 사용금액, 사용률, 기준월, 관련근거, 사용 적정성 의견, 증빙파일을 관리하고 이를 공사안전보건대장 이행확인 보고서에 자동 반영하는 기능이다.

이 기능은 단순 금액 입력 기능이 아니라 다음 보고서 항목의 원천 데이터다.

```text
공사개요 총평
→ 산업안전보건관리비 사용내역 사용률 문구

공사안전보건대장 이행여부 확인서
→ 문서관리 / 예산관리 총평

산업안전보건관리비 사용 내용 확인
→ 계상금액, 사용금액, 사용률, 관련근거, 적정성
```

## 2. 이 기능이 필요한 이유

샘플 보고서에서는 동일 프로젝트라도 발주처별 산업안전보건관리비 값이 다르다.

### 삼성문화재단

```text
계상금액 99,462,613원 중 37,978,000원 사용
사용률 38.2% / 1월말 기준
```

### 삼성생명공익재단

```text
계상금액 66,928,618원 중 27,117,450원 사용
사용률 40.5% / 1월말 기준
```

따라서 ERP는 프로젝트 전체의 단일 금액이 아니라 `projectId + ownerPartyId + inspectionRoundId` 기준으로 안전관리비 사용내역을 관리해야 한다.

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 점검 담당자 | 현장점검 시 사용내역 확인, 적정성 의견 작성 |
| 건설안전기술사 | 사용률과 관련근거 검토, 최종 의견 확정 |
| 문서 작성자 | 보고서 금액/사용률/적정성 문구 자동 반영 |
| 계약/행정 담당자 | 사용내역서 증빙파일 수집, 웹하드 보관 |
| 발주처 담당자 | 자기 발주처의 사용내역 확인 |
| 시공사 담당자 | 산업안전보건관리비 사용내역서 제출 |

## 4. 핵심 기능

### 4.1 발주처별 안전관리비 원장

각 발주처별로 다음 값을 관리한다.

- 계상금액
- 사용금액
- 사용률
- 기준월 또는 기준일
- 관련근거
- 적정성 의견
- 증빙파일
- 확인자
- 확인일
- 보고서 반영 여부

### 4.2 사용률 자동 계산

사용률은 시스템이 계산한다.

```text
usedRate = usedAmount / calculatedAmount * 100
```

표시 규칙:

```text
계상금액 ￦99,462,613 중 37,978,000원 38.2% (1월말 기준)
```

계산 규칙:

- `calculatedAmount`가 0보다 커야 한다.
- `usedAmount`는 0 이상이어야 한다.
- 사용률은 소수점 1자리 반올림을 기본값으로 한다.
- 사용금액이 계상금액을 초과하면 danger warning을 표시한다.
- 사용자가 입력한 사용률과 계산값이 다르면 rate_mismatch warning을 표시한다.

### 4.3 입력값 검증

검증 항목:

- 계상금액이 0보다 큰지
- 사용금액이 0 이상인지
- 사용금액이 계상금액을 초과하지 않는지
- 입력 사용률과 계산 사용률이 일치하는지
- 기준월이 있는지
- 관련근거가 있는지
- 증빙파일이 연결되어 있는지
- 발주처별 데이터가 누락되지 않았는지

### 4.4 증빙파일 관리

증빙파일 유형:

```text
safety_cost_usage_statement
receipt
invoice
photo_evidence
internal_summary
owner_submitted_file
other
```

증빙파일은 웹하드에 저장되고 `SafetyCostEvidence`로 연결된다.

권장 폴더:

```text
/프로젝트명/04_현장점검/제N회/산업안전보건관리비
/프로젝트명/02_시공사_제출자료/산업안전보건관리비
```

### 4.5 적정성 의견 작성

기본 문구:

```text
공사 특수성을 반영, 적정하게 사용 중으로 판단됨
```

다만 이 문구는 사용자가 검토해야 한다. AI는 입력된 사용률, 관련근거, 점검결과, 특이사항을 바탕으로 검토용 초안만 제안한다.

### 4.6 보고서 자동 반영

| 보고서 섹션 | 반영 내용 |
|---|---|
| 공사개요 총평 | 사용내역 사용률과 적정성 요약 |
| 이행여부 확인서 총평 | 문서관리 > 예산관리 문구 |
| 산업안전보건관리비 사용 내용 확인 | 계상금액, 사용금액, 사용률, 관련근거, 적정성 |
| 누락정보 패널 | 관련근거/증빙파일 누락 경고 |

### 4.7 회차별 사용내역

산업안전보건관리비는 회차별로 확인할 수 있어야 한다.

```text
제1회 / 2026.01.23 / 1월말 기준
제2회 / 2026.04 / 4월말 기준
...
```

### 4.8 발주처별 비교

| 발주처 | 계상금액 | 사용금액 | 사용률 | 기준월 | 적정성 |
|---|---:|---:|---:|---|---|
| 삼성문화재단 | 99,462,613 | 37,978,000 | 38.2% | 1월말 | 적정 |
| 삼성생명공익재단 | 66,928,618 | 27,117,450 | 40.5% | 1월말 | 적정 |

### 4.9 변경 이력

금액, 관련근거, 적정성 의견이 변경되면 이력을 남긴다.

- 변경 전 계상금액
- 변경 후 계상금액
- 변경 전 사용금액
- 변경 후 사용금액
- 변경자
- 변경일
- 변경 사유
- 관련 파일

## 5. 사용자 흐름

### 안전관리비 입력 흐름

```text
점검회차 선택
→ 발주처 선택
→ 산업안전보건관리비 입력
→ 계상금액 입력
→ 사용금액 입력
→ 기준월 입력
→ 관련근거 선택
→ 증빙파일 업로드
→ 사용률 자동 계산
→ 적정성 의견 초안 생성
→ 사용자 검토/확정
→ 보고서 반영
```

### 증빙파일 수집 흐름

```text
시공사 메일 수신
→ 첨부파일 웹하드 저장
→ 안전관리비 증빙파일로 연결
→ 기준월/발주처 매핑
→ 사용내역 확인
```

### 보고서 반영 흐름

```text
SafetyCostUsage 확정
→ 보고서 자동화 모듈에서 데이터 조회
→ 산업안전보건관리비 섹션 반영
→ 공사개요 총평 문구 반영
→ 이행여부 확인서 예산관리 문구 반영
```

## 6. 핵심 데이터

### SafetyCostUsage

- usageId
- projectId
- inspectionRoundId
- ownerPartyId
- calculatedAmount
- usedAmount
- usedRateCalculated
- userEnteredRate
- basisMonth
- basisDate
- basisDocumentText
- appropriatenessComment
- appropriatenessStatus
- status
- confirmedBy
- confirmedAt
- reportInclude
- syncedDocumentId

### SafetyCostEvidence

- evidenceId
- safetyCostUsageId
- projectId
- inspectionRoundId
- ownerPartyId
- fileId
- evidenceType
- fileName
- issuedDate
- submittedBy
- memo

### SafetyCostReview

- reviewId
- safetyCostUsageId
- reviewerId
- reviewedAt
- reviewComment
- appropriatenessStatus
- aiDraftComment

### SafetyCostHistoryEvent

- eventId
- safetyCostUsageId
- eventType
- beforeValues
- afterValues
- actorId
- reason
- createdAt

## 7. 완료 기준

- 점검회차와 발주처 기준으로 안전관리비 사용내역을 생성할 수 있다.
- 사용률을 자동 계산한다.
- 입력 사용률과 계산 사용률 불일치를 표시한다.
- 관련근거와 증빙파일을 연결할 수 있다.
- AI가 적정성 의견 초안을 생성한다.
- 사용자가 적정성 의견을 확정한다.
- 보고서 자동화 모듈로 반영할 수 있다.
- 변경 이력이 남는다.
- 발주처별 비교 matrix를 제공한다.
- 보고서 export 전 누락/미확정 경고를 제공한다.


---

## FILE: `docs/aec-erp/07-safety-cost-usage/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 산업안전보건관리비 사용내용 확인

## 1. Frontend Routes

```text
/projects/[projectId]/safety-costs
/projects/[projectId]/safety-costs/owner-matrix
/inspections/[inspectionRoundId]/safety-costs
/inspections/[inspectionRoundId]/safety-costs/new
/safety-costs/[usageId]
/safety-costs/[usageId]/edit
/safety-costs/[usageId]/evidence
/safety-costs/[usageId]/review
/safety-costs/[usageId]/preview
/safety-costs/[usageId]/history
/documents/safety-reports/[documentId]/safety-cost-usage
```

## 2. Frontend Components

```text
SafetyCostUsageListPage
SafetyCostUsageDetailPage
SafetyCostUsageFormPage
SafetyCostOwnerMatrixPage
SafetyCostEvidencePage
SafetyCostReviewPage
SafetyCostPreviewPage

SafetyCostSummaryCard
SafetyCostUsageForm
SafetyCostUsageRateGauge
SafetyCostOwnerMatrix
SafetyCostEvidenceUploader
SafetyCostEvidenceTable
SafetyCostCommentGeneratorPanel
SafetyCostReviewPanel
SafetyCostStatusBadge
SafetyCostWarningPanel
SafetyCostReportPreviewCard
SafetyCostHistoryTimeline
SafetyCostSyncToReportButton
```

## 3. Backend APIs

### Usage

```text
GET    /api/v1/projects/{projectId}/safety-cost-usages
GET    /api/v1/inspection-rounds/{inspectionRoundId}/safety-cost-usages
POST   /api/v1/inspection-rounds/{inspectionRoundId}/safety-cost-usages
GET    /api/v1/safety-cost-usages/{usageId}
PATCH  /api/v1/safety-cost-usages/{usageId}
DELETE /api/v1/safety-cost-usages/{usageId}

POST   /api/v1/safety-cost-usages/{usageId}/calculate-rate
POST   /api/v1/safety-cost-usages/{usageId}/validate
POST   /api/v1/safety-cost-usages/{usageId}/generate-comment
POST   /api/v1/safety-cost-usages/{usageId}/review
POST   /api/v1/safety-cost-usages/{usageId}/confirm
POST   /api/v1/safety-cost-usages/{usageId}/sync-to-report
GET    /api/v1/projects/{projectId}/safety-cost-usages/owner-matrix
```

### Evidence

```text
GET    /api/v1/safety-cost-usages/{usageId}/evidence
POST   /api/v1/safety-cost-usages/{usageId}/evidence/upload
POST   /api/v1/safety-cost-usages/{usageId}/evidence/link-file
PATCH  /api/v1/safety-cost-evidence/{evidenceId}
DELETE /api/v1/safety-cost-evidence/{evidenceId}
```

### History / Report

```text
GET  /api/v1/safety-cost-usages/{usageId}/history
GET  /api/v1/documents/{documentId}/safety-cost-usage
POST /api/v1/documents/{documentId}/safety-cost-usage/refresh
```

## 4. Data Models

```ts
type SafetyCostUsageStatus =
  | 'draft'
  | 'needs_evidence'
  | 'review'
  | 'confirmed'
  | 'synced_to_report'
  | 'rejected'
  | 'archived'

type SafetyCostAppropriatenessStatus =
  | 'not_reviewed'
  | 'appropriate'
  | 'needs_review'
  | 'insufficient_evidence'
  | 'inappropriate'

type SafetyCostUsage = {
  id: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId: string
  calculatedAmount: number
  usedAmount: number
  usedRateCalculated: number
  userEnteredRate?: number
  basisMonth?: string
  basisDate?: string
  basisDocumentText?: string
  appropriatenessComment?: string
  appropriatenessStatus: SafetyCostAppropriatenessStatus
  status: SafetyCostUsageStatus
  confirmedBy?: string
  confirmedAt?: string
  reportInclude: boolean
  syncedDocumentId?: string
  createdAt: string
  updatedAt: string
}

type SafetyCostEvidenceType =
  | 'safety_cost_usage_statement'
  | 'receipt'
  | 'invoice'
  | 'photo_evidence'
  | 'internal_summary'
  | 'owner_submitted_file'
  | 'other'

type SafetyCostEvidence = {
  id: string
  safetyCostUsageId: string
  projectId: string
  inspectionRoundId: string
  ownerPartyId: string
  fileId: string
  evidenceType: SafetyCostEvidenceType
  fileName: string
  issuedDate?: string
  submittedBy?: string
  memo?: string
  createdAt: string
  updatedAt: string
}

type SafetyCostReview = {
  id: string
  safetyCostUsageId: string
  reviewerId: string
  reviewedAt: string
  reviewComment: string
  appropriatenessStatus: SafetyCostAppropriatenessStatus
  aiDraftComment?: string
}

type SafetyCostValidationWarning = {
  type:
    | 'rate_mismatch'
    | 'used_amount_exceeds_calculated'
    | 'missing_basis_month'
    | 'missing_basis_document'
    | 'missing_evidence'
    | 'owner_mismatch'
    | 'not_confirmed'
  severity: 'info' | 'warning' | 'danger'
  message: string
}
```

## 5. Validation Rules

1. `projectId`, `inspectionRoundId`, `ownerPartyId`는 필수다.
2. `ownerPartyId`는 해당 프로젝트의 발주처 ProjectParty여야 한다.
3. `calculatedAmount`는 0보다 커야 한다.
4. `usedAmount`는 0 이상이어야 한다.
5. `usedAmount > calculatedAmount`이면 danger warning이다.
6. `usedRateCalculated = usedAmount / calculatedAmount * 100`, 소수점 1자리 반올림.
7. `userEnteredRate`가 계산값과 다르면 rate_mismatch warning이다.
8. `basisMonth` 또는 `basisDate`는 확정 전 필수다.
9. `basisDocumentText` 또는 evidenceItems 1개 이상은 확정 전 필수다.
10. AI draft comment는 최종 적정성 의견이 아니다.
11. 발주처별 금액이 섞이면 danger warning이다.

## 6. Service Rules

### 안전관리비 생성

```text
1. Project 확인
2. InspectionRound 확인
3. ownerPartyId 확인
4. 동일 inspectionRoundId + ownerPartyId 중복 확인
5. 사용률 계산
6. SafetyCostUsage 저장
7. HistoryEvent 생성
8. AuditLog 기록
```

### 적정성 의견 생성

```text
1. SafetyCostUsage 조회
2. Evidence 조회
3. 관련 Checklist/Finding 요약 조회
4. 사용률과 기준월 확인
5. service-ai prompt 호출
6. appropriatenessComment draft 저장
7. status = review
```

### 확정

```text
1. validate 실행
2. danger warning 확인
3. reviewer 또는 confirmer 확인
4. appropriatenessStatus 저장
5. status = confirmed
6. HistoryEvent 생성
```

### 보고서 동기화

```text
1. SafetyCostUsage confirmed 확인
2. DocumentInstance 조회
3. safety_cost_usage section 업데이트
4. project_summary 총평의 사용률 문구 업데이트
5. implementation_confirmation 예산관리 문구 업데이트
6. DocumentVersion 생성
7. SafetyCostUsage.status = synced_to_report
```

## 7. Report Mapping

| Source | Target Report Section |
|---|---|
| calculatedAmount | safety_cost_usage.calculatedAmount |
| usedAmount | safety_cost_usage.usedAmount |
| usedRate | safety_cost_usage.usedRate |
| basisMonth | safety_cost_usage.basisMonth |
| basisDocumentText | safety_cost_usage.basisDocument |
| appropriatenessComment | safety_cost_usage.appropriateness |
| usedRate | project_summary.generalComment |
| appropriatenessComment | implementation_confirmation.documentManagement.budget |

## 8. Seed Data

```json
{
  "culture": {
    "ownerName": "삼성문화재단",
    "calculatedAmount": 99462613,
    "usedAmount": 37978000,
    "usedRate": 38.2,
    "basisMonth": "1월말",
    "basisDocumentText": "산업안전보건관리비 사용내역서",
    "appropriatenessComment": "공사 특수성을 반영, 적정하게 사용 중으로 판단됨"
  },
  "public": {
    "ownerName": "삼성생명공익재단",
    "calculatedAmount": 66928618,
    "usedAmount": 27117450,
    "usedRate": 40.5,
    "basisMonth": "1월말",
    "basisDocumentText": "산업안전보건관리비 사용내역서",
    "appropriatenessComment": "공사 특수성을 반영, 적정하게 사용 중으로 판단됨"
  }
}
```

## 9. Tests

```text
test_safety_cost_create_success
test_safety_cost_requires_project_round_owner
test_safety_cost_owner_party_must_be_owner
test_safety_cost_calculates_used_rate
test_safety_cost_rate_mismatch_warning
test_safety_cost_used_amount_exceeds_calculated_amount_warning
test_safety_cost_requires_basis_for_confirm
test_safety_cost_evidence_upload_link_file
test_safety_cost_generate_comment
test_safety_cost_review_create_success
test_safety_cost_confirm_success
test_safety_cost_confirm_blocked_without_evidence
test_safety_cost_sync_to_report_updates_sections
test_safety_cost_history_created_on_amount_update
test_safety_cost_owner_matrix_returns_all_owners
test_safety_cost_report_export_missing_warning
```


---

## FILE: `docs/aec-erp/07-safety-cost-usage/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 산업안전보건관리비 사용내용 확인

## 1. 화면 목표

산업안전보건관리비 사용내용 확인 화면은 발주처별 계상금액, 사용금액, 사용률, 관련근거, 적정성 의견을 보고서 표 형태로 입력·검토·확정하는 화면이다.

단순 입력폼이 아니라 다음 상태를 한 화면에서 확인해야 한다.

- 발주처별 금액
- 사용률 계산값
- 입력값 불일치 warning
- 관련근거/증빙파일
- AI 초안과 사용자 확정 의견
- 보고서 반영 상태
- 변경 이력

## 2. 화면 목록

### 2.1 프로젝트 안전관리비 목록

Route: `/projects/[projectId]/safety-costs`

표시:

- 프로젝트명
- 점검회차
- 발주처
- 계상금액
- 사용금액
- 사용률
- 기준월
- 적정성 상태
- 증빙파일 수
- 보고서 반영 상태

### 2.2 발주처별 매트릭스

Route: `/projects/[projectId]/safety-costs/owner-matrix`

| 발주처 | 계상금액 | 사용금액 | 사용률 | 기준월 | 관련근거 | 증빙 | 적정성 | 보고서 |
|---|---:|---:|---:|---|---|---:|---|---|

### 2.3 점검회차 안전관리비 입력

Route: `/inspections/[inspectionRoundId]/safety-costs/new`

입력 섹션:

- 발주처 선택
- 계상금액
- 사용금액
- 사용률 자동 계산
- 사용자 입력 사용률 optional
- 기준월/기준일
- 관련근거
- 증빙파일
- 적정성 의견
- 검토자/확인자

### 2.4 상세/검토 화면

Route: `/safety-costs/[usageId]`

Layout:

```text
Sticky Header
- 제2026-01호
- 제1회
- 발주처
- 상태
- 저장 / 확정 / 보고서 반영

Main
- 계상금액
- 사용금액
- 사용률 gauge
- 기준월
- 관련근거
- 적정성 의견

Right Panel
- 증빙파일
- 누락정보
- 금액 warning
- owner mismatch warning
- A4 preview
```

### 2.5 증빙파일 화면

Route: `/safety-costs/[usageId]/evidence`

기능:

- drag & drop upload
- 웹하드에서 선택
- 메일 첨부에서 가져오기
- 증빙 유형 선택
- 파일 미리보기
- 파일 교체/삭제
- 웹하드 저장 위치 확인

### 2.6 보고서 문구 미리보기

Route: `/safety-costs/[usageId]/preview`

미리보기 문구 예:

```text
산업안전보건관리비 사용 실적
계상금액 ￦99,462,613 중 37,978,000원 38.2% (1월말 기준)
관련근거 산업안전보건관리비 사용내역서
적정성 공사 특수성을 반영, 적정하게 사용 중으로 판단됨
```

## 3. UX Rules

1. 금액은 오른쪽 정렬하고 원 단위 쉼표를 사용한다.
2. 사용률은 자동 계산하고 progress/gauge로 표시한다.
3. 입력 사용률과 계산 사용률이 다르면 warning을 표시한다.
4. 관련근거와 증빙파일 누락을 명확히 표시한다.
5. AI 초안과 확정 의견을 구분한다.
6. 발주처별 금액이 섞이면 danger warning을 표시한다.
7. A4 preview는 실제 보고서 표와 유사해야 한다.
8. 증빙파일이 없으면 노란 warning badge를 표시한다.
9. 사용금액이 계상금액을 초과하면 빨간 danger badge를 표시한다.
10. 보고서 반영 후에는 `synced_to_report` badge를 표시한다.

## 4. 디자인 컴포넌트

### SafetyCostSummaryCard

표시 항목:

- 발주처명
- 계상금액
- 사용금액
- 사용률
- 기준월
- 적정성 상태
- 증빙파일 수
- 보고서 반영 상태

### SafetyCostUsageRateGauge

표시:

- 사용률 숫자
- progress bar
- 계산 기준 tooltip
- rate mismatch warning

### SafetyCostOwnerMatrix

컬럼:

```text
발주처 / 계상금액 / 사용금액 / 사용률 / 기준월 / 관련근거 / 증빙 / 적정성 / 보고서
```

### SafetyCostEvidenceUploader

기능:

- drag & drop upload
- 웹하드에서 선택
- 증빙 유형 선택
- 파일명 표시
- 미리보기
- 삭제/교체

### SafetyCostReportPreviewCard

보고서 문구 미리보기:

```text
산업안전보건관리비 사용 실적
계상금액 ￦99,462,613 중 37,978,000원 38.2% (1월말 기준)
관련근거 산업안전보건관리비 사용내역서
적정성 공사 특수성을 반영, 적정하게 사용 중으로 판단됨
```

### SafetyCostReviewPanel

표시:

- AI 초안 badge
- 검토 의견
- 적정성 상태 선택
- 확정 버튼
- 추가 증빙 요청 버튼

## 5. Empty State

```text
이 점검회차의 산업안전보건관리비 사용내역이 등록되지 않았습니다.
발주처별 계상금액과 사용금액을 입력하세요.
```

버튼:

- 사용내역 입력
- 시공사 제출파일에서 가져오기
- 웹하드 파일 연결

## 6. Warning State

### 증빙파일 누락

```text
사용내역서 또는 관련 증빙파일이 연결되지 않았습니다.
보고서 export 전 증빙파일 확인을 권장합니다.
```

### 사용률 불일치

```text
입력 사용률과 시스템 계산 사용률이 다릅니다.
계상금액과 사용금액을 다시 확인하세요.
```

### 발주처 값 혼동

```text
이 사용내역은 선택한 발주처와 다른 발주처 파일 또는 금액을 참조하고 있을 수 있습니다.
ownerPartyId와 증빙파일 출처를 확인하세요.
```

## 7. Responsive

### Desktop

- 좌측 메인 입력폼
- 우측 증빙/경고/A4 preview panel
- 발주처별 matrix table

### Tablet

- 입력폼과 preview toggle
- matrix horizontal scroll

### Mobile

- 금액 입력 카드
- 증빙 업로드 중심
- 최종 확정은 데스크톱 권장


---

## FILE: `docs/aec-erp/07-safety-cost-usage/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 산업안전보건관리비 사용내용 확인

## 1. Feature

```yaml
featureId: safety_cost.usage_confirmation
featureName: 산업안전보건관리비 사용내용 확인
priority: P0
module: safety-cost-usage
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 프로젝트 안전관리비 목록 | `/projects/[projectId]/safety-costs` | 프로젝트 전체 사용내역 조회 |
| 발주처별 매트릭스 | `/projects/[projectId]/safety-costs/owner-matrix` | 발주처별 비교 |
| 회차별 사용내역 | `/inspections/[inspectionRoundId]/safety-costs` | 점검회차 기준 조회 |
| 사용내역 생성 | `/inspections/[inspectionRoundId]/safety-costs/new` | 발주처별 사용내역 입력 |
| 상세 | `/safety-costs/[usageId]` | 사용내역 상세 |
| 수정 | `/safety-costs/[usageId]/edit` | 금액/기준/의견 수정 |
| 증빙 | `/safety-costs/[usageId]/evidence` | 증빙파일 관리 |
| 검토 | `/safety-costs/[usageId]/review` | 적정성 의견 검토/확정 |
| 미리보기 | `/safety-costs/[usageId]/preview` | 보고서 문구 미리보기 |
| 이력 | `/safety-costs/[usageId]/history` | 변경 이력 |
| 보고서 섹션 | `/documents/safety-reports/[documentId]/safety-cost-usage` | 보고서 반영 섹션 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| safety-costs | SafetyCostSummaryCard, SafetyCostUsageTable, SafetyCostStatusBadge |
| owner-matrix | SafetyCostOwnerMatrix, SafetyCostUsageRateGauge |
| new/edit | SafetyCostUsageForm, SafetyCostWarningPanel |
| evidence | SafetyCostEvidenceUploader, SafetyCostEvidenceTable |
| review | SafetyCostCommentGeneratorPanel, SafetyCostReviewPanel |
| preview | SafetyCostReportPreviewCard |
| history | SafetyCostHistoryTimeline |
| report section | SafetyCostSyncToReportButton, SafetyCostReportPreviewCard |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| SafetyCostUsageTable | GET `/api/v1/projects/{projectId}/safety-cost-usages` |
| SafetyCostOwnerMatrix | GET `/api/v1/projects/{projectId}/safety-cost-usages/owner-matrix` |
| SafetyCostUsageForm | POST/PATCH `/api/v1/safety-cost-usages` |
| SafetyCostUsageRateGauge | POST `/api/v1/safety-cost-usages/{usageId}/calculate-rate` |
| SafetyCostWarningPanel | POST `/api/v1/safety-cost-usages/{usageId}/validate` |
| SafetyCostEvidenceUploader | POST `/api/v1/safety-cost-usages/{usageId}/evidence/upload` |
| SafetyCostCommentGeneratorPanel | POST `/api/v1/safety-cost-usages/{usageId}/generate-comment` |
| SafetyCostReviewPanel | POST `/api/v1/safety-cost-usages/{usageId}/review`, POST `/confirm` |
| SafetyCostSyncToReportButton | POST `/api/v1/safety-cost-usages/{usageId}/sync-to-report` |
| SafetyCostHistoryTimeline | GET `/api/v1/safety-cost-usages/{usageId}/history` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET safety-cost-usages | SafetyCostUsage |
| POST safety-cost-usages | SafetyCostUsage, SafetyCostHistoryEvent |
| calculate-rate | SafetyCostUsage, SafetyCostValidationWarning |
| validate | SafetyCostValidationWarning |
| evidence/upload | SafetyCostEvidence, FileAsset |
| generate-comment | SafetyCostReview, SafetyCostUsage |
| confirm | SafetyCostUsage, SafetyCostReview, AuditLog |
| sync-to-report | SafetyCostUsage, DocumentInstance, SafetyCostReportMapping |
| owner-matrix | ProjectParty, SafetyCostUsage |
| history | SafetyCostHistoryEvent |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| SafetyCostUsage | safety-cost-usage-comment |
| SafetyCostEvidence | safety-cost-usage-comment |
| SafetyCostReview | safety-cost-usage-comment |
| ChecklistSummary | safety-cost-usage-comment |
| Finding | safety-cost-usage-comment |
| ProjectParty | safety-cost-usage-comment |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 생성 | test_safety_cost_create_success |
| 필수키 | test_safety_cost_requires_project_round_owner |
| 발주처 검증 | test_safety_cost_owner_party_must_be_owner |
| 사용률 계산 | test_safety_cost_calculates_used_rate |
| 사용률 불일치 | test_safety_cost_rate_mismatch_warning |
| 사용금액 초과 | test_safety_cost_used_amount_exceeds_calculated_amount_warning |
| 확정 기준 | test_safety_cost_requires_basis_for_confirm |
| 증빙 업로드 | test_safety_cost_evidence_upload_link_file |
| 의견 생성 | test_safety_cost_generate_comment |
| 검토 | test_safety_cost_review_create_success |
| 확정 | test_safety_cost_confirm_success |
| 증빙 없는 확정 차단 | test_safety_cost_confirm_blocked_without_evidence |
| 보고서 동기화 | test_safety_cost_sync_to_report_updates_sections |
| 이력 생성 | test_safety_cost_history_created_on_amount_update |
| 발주처 매트릭스 | test_safety_cost_owner_matrix_returns_all_owners |
| export 경고 | test_safety_cost_report_export_missing_warning |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ownerPartyId |
| 점검회차/일정 | inspectionRoundId |
| 보고서 자동화 | safety_cost_usage section, project_summary, implementation_confirmation |
| 웹하드 | SafetyCostEvidence.fileId |
| 메일함 | 시공사 제출 메일 첨부파일 저장 |
| 결재/제출 | 보고서 export 전 확정 여부 검증 |
| 관리자/템플릿 | 적정성 표준문구, 증빙유형 관리 |
| 대시보드 | 증빙 누락, 미확정, 보고서 미반영 알림 |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 총 공사금액과 계상금액 혼동 | SafetyCostUsage.calculatedAmount 별도 모델 |
| 발주처별 값 혼동 | ownerPartyId 필수 |
| 입력 사용률 오류 | 시스템 계산값 우선 |
| 증빙파일 누락 | evidence_required 상태와 export warning |
| AI 적정성 단정 | 검토용 초안 badge와 사용자 확정 필요 |
| 보고서 반영 누락 | sync-to-report 상태 관리 |
| 금액 수정 이력 누락 | SafetyCostHistoryEvent 필수 |
| 파일과 회차 연결 누락 | SafetyCostEvidence에 inspectionRoundId 저장 |


---

## FILE: `docs/aec-erp/07-safety-cost-usage/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 산업안전보건관리비 적정성 의견 생성

## Prompt ID

`safety-cost-usage-comment`

## 목적

산업안전보건관리비 계상금액, 사용금액, 사용률, 기준월, 관련근거, 증빙파일, 점검결과를 바탕으로 보고서에 들어갈 사용내용 확인 문구와 적정성 의견 초안을 생성한다.

## Prompt

```text
너는 A&C 기술사 ERP의 산업안전보건관리비 사용내용 확인 보조 엔진이다.

입력:
- project
- inspectionRound
- ownerParty
- safetyCostUsage
- safetyCostEvidence
- checklistSummary
- findings
- userInstruction

목표:
발주처별 산업안전보건관리비 사용내용을 보고서에 들어갈 표와 검토용 의견으로 정리한다.

해야 할 일:
1. 계상금액과 사용금액을 확인한다.
2. 사용률을 계산한다.
3. 입력 사용률과 계산 사용률이 다른지 확인한다.
4. 기준월 또는 기준일을 확인한다.
5. 관련근거와 증빙파일을 확인한다.
6. 보고서 표에 들어갈 행을 작성한다.
7. 공사개요 총평에 들어갈 짧은 요약 문구를 작성한다.
8. 이행여부 확인서의 문서관리/예산관리 문구를 작성한다.
9. 적정성 의견 초안을 작성한다.
10. 누락정보와 검토 경고를 분리한다.

작성 규칙:
- 사용률은 usedAmount / calculatedAmount * 100으로 계산하고 소수점 1자리로 반올림한다.
- 금액은 원 단위 쉼표 표기를 사용한다.
- 발주처별 금액을 프로젝트 전체 공사금액과 혼동하지 않는다.
- 증빙파일이 없으면 적정하다고 단정하지 말고 증빙 확인 필요로 표시한다.
- 입력된 관련근거가 없으면 관련근거 확인 필요로 표시한다.
- 적정성 의견은 검토용 초안이며 최종 의견이 아니다.
- 법령 문구를 임의로 추가하지 않는다.
- 사용금액이 계상금액보다 크면 danger warning을 표시한다.

출력 JSON:
{
  "calculation": {
    "calculatedAmount": null,
    "usedAmount": null,
    "usedRateCalculated": null,
    "userEnteredRate": null,
    "rateMatched": true
  },
  "reportRows": [
    {
      "ownerName": "",
      "calculatedAmountText": "",
      "usedAmountText": "",
      "usedRateText": "",
      "basisText": "",
      "basisDocumentText": "",
      "appropriatenessText": ""
    }
  ],
  "summaryPhrases": {
    "projectSummary": "",
    "implementationConfirmationBudget": "",
    "safetyCostUsageSection": ""
  },
  "appropriatenessDraft": "",
  "missingFields": [],
  "warnings": []
}
```

## Few-shot 기준

입력 예시:

```json
{
  "ownerParty": { "ownerName": "삼성문화재단" },
  "safetyCostUsage": {
    "calculatedAmount": 99462613,
    "usedAmount": 37978000,
    "basisMonth": "1월말",
    "basisDocumentText": "산업안전보건관리비 사용내역서"
  }
}
```

출력 방향:

```text
계상금액 ￦99,462,613 중 37,978,000원 사용, 사용률 38.2% (1월말 기준)
관련근거: 산업안전보건관리비 사용내역서
적정성 의견 초안: 공사 특수성을 반영, 적정하게 사용 중으로 판단됨
```

## 금지사항

- 증빙파일이 없는데 증빙 확인 완료라고 쓰지 않는다.
- 계산값과 입력값이 불일치하는데 정상이라고 쓰지 않는다.
- 발주처별 금액을 총 공사금액과 혼동하지 않는다.
- AI 초안을 최종 확정 의견처럼 표현하지 않는다.
```


---

## FILE: `docs/aec-erp/07-safety-cost-usage/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 산업안전보건관리비 사용내용 확인

## Prompt

```text
You are implementing the Safety Cost Usage Confirmation module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module manages owner-specific safety cost calculated amount, used amount, used rate, basis month/date, basis documents, evidence files, review comments, confirmation, and synchronization to safety reports.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Safety Cost Usage module.

Existing concepts:
- Project
- ProjectParty
- InspectionRound
- DocumentInstance
- FileAsset
- Folder
- MailThread
- Submission
- AuditLog

Required backend models:
- SafetyCostUsage
- SafetyCostEvidence
- SafetyCostReview
- SafetyCostHistoryEvent
- SafetyCostValidationWarning
- SafetyCostReportMapping

Required backend APIs:
Usage:
- GET /api/v1/projects/{projectId}/safety-cost-usages
- GET /api/v1/inspection-rounds/{inspectionRoundId}/safety-cost-usages
- POST /api/v1/inspection-rounds/{inspectionRoundId}/safety-cost-usages
- GET /api/v1/safety-cost-usages/{usageId}
- PATCH /api/v1/safety-cost-usages/{usageId}
- DELETE /api/v1/safety-cost-usages/{usageId}
- POST /api/v1/safety-cost-usages/{usageId}/calculate-rate
- POST /api/v1/safety-cost-usages/{usageId}/validate
- POST /api/v1/safety-cost-usages/{usageId}/generate-comment
- POST /api/v1/safety-cost-usages/{usageId}/review
- POST /api/v1/safety-cost-usages/{usageId}/confirm
- POST /api/v1/safety-cost-usages/{usageId}/sync-to-report
- GET /api/v1/projects/{projectId}/safety-cost-usages/owner-matrix

Evidence:
- GET /api/v1/safety-cost-usages/{usageId}/evidence
- POST /api/v1/safety-cost-usages/{usageId}/evidence/upload
- POST /api/v1/safety-cost-usages/{usageId}/evidence/link-file
- PATCH /api/v1/safety-cost-evidence/{evidenceId}
- DELETE /api/v1/safety-cost-evidence/{evidenceId}

History / Report:
- GET /api/v1/safety-cost-usages/{usageId}/history
- GET /api/v1/documents/{documentId}/safety-cost-usage
- POST /api/v1/documents/{documentId}/safety-cost-usage/refresh

Required frontend routes:
- /projects/[projectId]/safety-costs
- /projects/[projectId]/safety-costs/owner-matrix
- /inspections/[inspectionRoundId]/safety-costs
- /inspections/[inspectionRoundId]/safety-costs/new
- /safety-costs/[usageId]
- /safety-costs/[usageId]/edit
- /safety-costs/[usageId]/evidence
- /safety-costs/[usageId]/review
- /safety-costs/[usageId]/preview
- /safety-costs/[usageId]/history
- /documents/safety-reports/[documentId]/safety-cost-usage

Required frontend components:
- SafetyCostSummaryCard
- SafetyCostUsageForm
- SafetyCostUsageRateGauge
- SafetyCostOwnerMatrix
- SafetyCostEvidenceUploader
- SafetyCostEvidenceTable
- SafetyCostCommentGeneratorPanel
- SafetyCostReviewPanel
- SafetyCostStatusBadge
- SafetyCostWarningPanel
- SafetyCostReportPreviewCard
- SafetyCostHistoryTimeline
- SafetyCostSyncToReportButton

Business requirements:
1. SafetyCostUsage must belong to Project, InspectionRound, and owner ProjectParty.
2. Same inspectionRoundId + ownerPartyId should have at most one active usage record.
3. usedRateCalculated is calculated by the system.
4. userEnteredRate mismatch must generate warning.
5. usedAmount exceeding calculatedAmount must generate danger warning.
6. Confirmation requires basis month/date and basis document or evidence file.
7. AI generated appropriateness comment is draft only.
8. Evidence upload must create FileAsset or link existing FileAsset.
9. Sync-to-report updates safety_cost_usage section, project_summary summary phrase, and implementation_confirmation budget phrase.
10. Amount/comment/evidence changes must create SafetyCostHistoryEvent and AuditLog.
11. Owner matrix should return all owner parties for a project and round.
12. Report export should warn if confirmed safety cost usage is missing.

Seed data:
- 삼성문화재단: calculatedAmount 99462613, usedAmount 37978000, usedRate 38.2, basisMonth 1월말, basisDocument 산업안전보건관리비 사용내역서
- 삼성생명공익재단: calculatedAmount 66928618, usedAmount 27117450, usedRate 40.5, basisMonth 1월말, basisDocument 산업안전보건관리비 사용내역서

Tests:
- test_safety_cost_create_success
- test_safety_cost_requires_project_round_owner
- test_safety_cost_owner_party_must_be_owner
- test_safety_cost_calculates_used_rate
- test_safety_cost_rate_mismatch_warning
- test_safety_cost_used_amount_exceeds_calculated_amount_warning
- test_safety_cost_requires_basis_for_confirm
- test_safety_cost_evidence_upload_link_file
- test_safety_cost_generate_comment
- test_safety_cost_review_create_success
- test_safety_cost_confirm_success
- test_safety_cost_confirm_blocked_without_evidence
- test_safety_cost_sync_to_report_updates_sections
- test_safety_cost_history_created_on_amount_update
- test_safety_cost_owner_matrix_returns_all_owners
- test_safety_cost_report_export_missing_warning

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Rate calculation service
- Validation service
- Evidence upload/link service
- Comment generation service
- Sync-to-report service
- Frontend pages and components
- API client functions
- Type definitions
- Tests
```


---

## FILE: `docs/aec-erp/07-safety-cost-usage/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 산업안전보건관리비 사용내용 확인

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "산업안전보건관리비 사용내용 확인" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 공사안전보건대장 이행확인 보고서를 자동 생성하는 ERP
- 산업안전보건관리비 화면은 점검회차와 발주처별로 계상금액, 사용금액, 사용률, 관련근거, 적정성 의견, 증빙파일을 관리하는 화면
- 사용내역은 보고서의 산업안전보건관리비 섹션, 공사개요 총평, 이행여부 확인서 예산관리 문구에 반영된다.

화면 1: 프로젝트 안전관리비 목록
- 좌측 ERP 사이드바
- 상단 프로젝트 요약 헤더
- 필터:
  - 점검회차
  - 발주처
  - 확정 여부
  - 증빙 누락
  - 보고서 반영 여부
- 중앙 table:
  - 회차
  - 점검일
  - 발주처
  - 계상금액
  - 사용금액
  - 사용률
  - 기준월
  - 관련근거
  - 증빙
  - 적정성
  - 보고서 반영
- 우측 빠른 작업 패널:
  - 사용내역 입력
  - 증빙파일 연결
  - 미확정 항목
  - 보고서 미반영 항목

화면 2: 발주처별 매트릭스
- 같은 점검회차에서 삼성문화재단과 삼성생명공익재단을 나란히 비교한다.
- 컬럼:
  - 발주처
  - 계상금액
  - 사용금액
  - 사용률
  - 기준월
  - 관련근거
  - 증빙파일
  - 적정성 상태
  - 보고서 반영 상태
- 사용률은 progress bar 또는 gauge로 표시한다.

화면 3: 안전관리비 입력/검토
- Sticky header:
  - 문서번호
  - 제 N회
  - 점검일
  - 발주처
  - 상태 badge
  - 저장
  - 확정
  - 보고서 반영
- Main form:
  - 계상금액
  - 사용금액
  - 자동 계산 사용률
  - 입력 사용률 optional
  - 기준월/기준일
  - 관련근거
  - 적정성 의견
- Right panel:
  - 증빙파일
  - 누락정보
  - 계산 warning
  - 발주처 mismatch warning
  - 보고서 문구 preview

화면 4: 증빙파일 관리
- Drag & drop upload
- 웹하드에서 선택
- 메일 첨부에서 가져오기
- 증빙 유형 선택
- 파일 preview
- 웹하드 저장 위치 표시
- 삭제/교체 버튼

화면 5: 보고서 미리보기
- A4 preview card
- 산업안전보건관리비 사용 실적 표
- 계상금액, 사용금액, 사용률, 기준월, 관련근거, 적정성 의견 표시
- AI 초안과 확정 의견을 badge로 구분한다.

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- 금액은 오른쪽 정렬
- 원 단위 쉼표 표기
- 사용률 gauge는 명확하고 차분하게
- warning은 주황색, danger는 빨간색
- 확정/적정은 초록색
- AI 초안은 파란색 또는 보라색 outline badge
- 보고서 미리보기는 흰색 A4 paper card
- 한글 가독성을 최우선으로 한다.

상태 표현:
- draft: gray
- needs_evidence: orange
- review: purple
- confirmed: green
- synced_to_report: teal
- rejected: red
- archived: gray

결과물:
- 안전관리비 목록 화면
- 발주처별 매트릭스 화면
- 입력/검토 화면
- 증빙파일 관리 화면
- 보고서 문구 미리보기 화면
- 사용률 gauge 컴포넌트
- warning panel
```


---

## FILE: `docs/aec-erp/07-safety-cost-usage/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 산업안전보건관리비 사용내용 확인

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
산업안전보건관리비 사용내용 확인

기능 설명:
산업안전보건관리비 사용내용 확인은 점검회차와 발주처별로 계상금액, 사용금액, 사용률, 기준월, 관련근거, 적정성 의견, 증빙파일을 관리하고 공사안전보건대장 이행확인 보고서에 반영하는 기능이다.

업무 맥락:
- SafetyCostUsage는 Project, InspectionRound, ownerPartyId에 속한다.
- 같은 점검회차라도 삼성문화재단과 삼성생명공익재단의 계상금액/사용금액/사용률이 다를 수 있다.
- 사용률은 시스템이 계산한다.
- 증빙파일은 FileAsset과 연결된다.
- 적정성 의견은 AI가 초안을 작성할 수 있지만 사용자 확정이 필요하다.
- 보고서에는 산업안전보건관리비 사용 내용 확인 섹션, 공사개요 총평, 이행여부 확인서 예산관리 문구로 반영된다.
- 보고서 export 전에는 확정 여부, 관련근거, 증빙파일 누락을 검증해야 한다.

입력:
{
  "featureName": "산업안전보건관리비 사용내용 확인",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "reportRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `safety_cost.usage_confirmation`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.

출력 JSON:
{
  "featureId": "safety_cost.usage_confirmation",
  "featureName": "산업안전보건관리비 사용내용 확인",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /projects/[projectId]/safety-costs
- /projects/[projectId]/safety-costs/owner-matrix
- /inspections/[inspectionRoundId]/safety-costs
- /inspections/[inspectionRoundId]/safety-costs/new
- /safety-costs/[usageId]
- /safety-costs/[usageId]/edit
- /safety-costs/[usageId]/evidence
- /safety-costs/[usageId]/review
- /safety-costs/[usageId]/preview
- /safety-costs/[usageId]/history
- /documents/safety-reports/[documentId]/safety-cost-usage

반드시 포함할 models:
- SafetyCostUsage
- SafetyCostEvidence
- SafetyCostReview
- SafetyCostHistoryEvent
- SafetyCostValidationWarning
- SafetyCostReportMapping
- Project
- ProjectParty
- InspectionRound
- DocumentInstance
- FileAsset
- AuditLog

반드시 포함할 prompts:
- safety-cost-usage-comment
- safety-cost-usage implementation prompt
- safety-cost-usage design prompt

반드시 포함할 tests:
- test_safety_cost_create_success
- test_safety_cost_requires_project_round_owner
- test_safety_cost_owner_party_must_be_owner
- test_safety_cost_calculates_used_rate
- test_safety_cost_rate_mismatch_warning
- test_safety_cost_used_amount_exceeds_calculated_amount_warning
- test_safety_cost_requires_basis_for_confirm
- test_safety_cost_evidence_upload_link_file
- test_safety_cost_generate_comment
- test_safety_cost_review_create_success
- test_safety_cost_confirm_success
- test_safety_cost_confirm_blocked_without_evidence
- test_safety_cost_sync_to_report_updates_sections
- test_safety_cost_history_created_on_amount_update
- test_safety_cost_owner_matrix_returns_all_owners
- test_safety_cost_report_export_missing_warning

주의:
- SafetyCostUsage는 Project와 InspectionRound와 ownerPartyId 없이 생성될 수 없다.
- ownerPartyId는 발주처 ProjectParty여야 한다.
- 사용률은 사용자가 아니라 시스템 계산값을 기준으로 한다.
- AI 적정성 의견은 draft이고 사용자 확정이 필요하다.
- 증빙파일이 없으면 확정 또는 export 전 warning을 표시해야 한다.
- 발주처별 금액이 섞이면 danger warning이다.
- 보고서 동기화 시 project_summary와 implementation_confirmation도 함께 갱신한다.
```


---

## FILE: `docs/aec-erp/08-safety-management-plan/README.md`

# 기능 08 — 안전관리계획서 자동화

이 폴더는 A&C 기술사 ERP의 여덟 번째 기능인 `안전관리계획서 자동화` 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

안전관리계획서 자동화는 프로젝트 원장, 계약, 공정표, 작업공법, 위험성평가, 조직도, 비상연락망, 교육계획, 점검계획, 산업안전보건관리비 사용계획, 첨부자료를 기반으로 안전관리계획서 초안을 작성하고 A4 미리보기와 PDF/HWPX export를 제공하는 기능이다.

```text
Project
→ ProjectParty / Contact / Contract
→ WorkScheduleAttachment
→ WorkType
→ RiskRegister / RiskItem
→ SafetyManagementPlan
→ SafetyManagementPlanSection
→ A4 Preview
→ FileAsset / Submission
```

## 핵심 설계 포인트

- 안전관리계획서는 기본적으로 `projectId` 기준 프로젝트 단위 계획 문서다.
- 특정 회차에서 개정하거나 보완한 경우 `inspectionRoundId`를 optional revision link로 연결할 수 있다.
- AI는 공사개요, 공종별 위험요인, 감소대책, 교육·점검계획의 초안만 작성한다.
- 법령·표준 문구는 관리자 템플릿에 등록된 문구만 사용한다.
- 최종 export는 최신 저장 snapshot 기준으로 수행한다.
- 리움미술관 승강기 교체공사처럼 승강기/에스컬레이터 교체, 가설전기, 사다리, 화기, 양중, 밀폐공간 등 작업위험을 WorkType + RiskItem으로 구조화한다.


---

## FILE: `docs/aec-erp/08-safety-management-plan/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 안전관리계획서 자동화

## 1. 기능 정의

안전관리계획서 자동화는 A&C 기술사 ERP에서 프로젝트 단위의 안전관리계획서를 작성·검토·미리보기·내보내기 하는 문서 자동화 기능이다.

이 기능은 기존의 공사안전보건대장 이행확인 보고서와 달리, 점검 결과를 사후 정리하는 문서가 아니라 공사 수행 전 또는 공사 초기 단계에서 안전관리 체계, 작업계획, 위험요인, 감소대책, 비상대응, 교육·점검계획을 구조화하는 계획 문서다.

## 2. 이 기능이 필요한 이유

A&C 기술사사무소가 작성하는 문서 자동화의 핵심 대상은 기술지도보고서가 아니라 안전관리계획서, 안전보건대장, 공사안전보건대장 등 기술사 업무 문서다. 안전관리계획서는 이후 체크리스트, 위험성 감소대책, 추가 유해·위험요인, 공사안전보건대장 이행점검 보고서의 상위 계획 자료가 된다.

예시 흐름:

```text
안전관리계획서의 공종별 위험요인/감소대책
→ 현장점검 체크리스트 기준
→ 이행확인 보고서 위험성 감소대책 섹션
→ 지적사항/조치현황
→ 안전보건대장 누적 이력
```

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 건설안전기술사 | 안전관리계획서 검토, 위험요인 및 감소대책 확정 |
| 문서 작성자 | 프로젝트 자료를 기반으로 계획서 초안 작성, A4 미리보기, export |
| 점검 담당자 | 계획서의 위험요인과 점검계획을 현장점검 기준으로 활용 |
| 계약/행정 담당자 | 발주처/시공사/담당자/계약기간/첨부자료 연결 |
| 관리자 | 안전관리계획서 템플릿, 표준 문구, 법령 문구, 공종 라이브러리 관리 |

## 4. 핵심 문서 구조

기본 목차는 아래를 기준으로 한다. 실제 발주처 템플릿이 들어오면 섹션 순서와 표 제목은 템플릿 버전별로 조정한다.

```text
1. 공사개요
2. 현장 조직 및 책임
3. 공정표 및 작업계획
4. 공종별 작업공법
5. 공종별 유해·위험요인
6. 위험성 평가 및 감소대책
7. 안전관리조직도 및 비상연락망
8. 근로자 안전교육 계획
9. 보호구 지급 및 착용관리
10. 장비·가설·전기·화재 안전관리
11. 밀폐공간·양중·고소작업 등 중점위험 관리
12. 비상대응 및 사고보고 체계
13. 정기점검 및 기록관리 계획
14. 산업안전보건관리비 사용계획
15. 첨부자료
```

## 5. 핵심 기능

### 5.1 계획서 생성 마법사

```text
프로젝트 선택
→ 계약/공사기간 확인
→ 발주처/시공사/담당자 확인
→ 공정표/작업범위 파일 연결
→ 주요 공종 선택
→ 위험요인/감소대책 입력
→ 교육/점검/비상대응 계획 입력
→ 누락정보 확인
→ AI 초안 생성
→ 섹션별 검토
→ PDF/HWPX export
→ 웹하드 저장
```

### 5.2 프로젝트 원장 연동

자동 반영 항목:

- 프로젝트명
- 현장명
- 현장주소
- 발주처
- 시공사
- A&C 담당자
- 공사기간
- 계약기간
- 공사금액
- 주요 연락처
- 웹하드 첨부자료

### 5.3 작업공법/공종 관리

승강기 교체공사 예시 공종:

- 승강기 철거
- 승강기 설치
- 에스컬레이터 교체
- 양중 및 반입
- 전기·가설전기 작업
- 용접·화기 작업
- 이동식 사다리/말비계 작업
- 승강로·피트 등 밀폐 또는 협소공간 작업
- 폐기물 반출
- 야간/휴관일 작업 optional

각 공종은 `WorkType`으로 관리하고, 위험요인과 감소대책을 연결한다.

### 5.4 위험요인 및 감소대책 관리

위험요인은 `SafetyManagementRiskItem`으로 관리한다.

입력 항목:

- 공종
- 작업내용
- 유해·위험요인
- 위험유형
- 위험도
- 감소대책
- 책임조직
- 점검방법
- 관련 사진/도면
- 보고서 반영 여부

### 5.5 교육계획/점검계획

교육계획:

- 신규자 교육
- 정기안전교육
- 특별안전교육
- TBM/작업 전 교육
- 위험작업 전 교육
- 교육 기록관리

점검계획:

- 일일점검
- 주간점검
- 월간점검
- 특별점검
- 기술사 점검
- 발주처/시공사 합동점검
- 점검 기록관리

### 5.6 비상대응 계획

비상대응 항목:

- 비상연락망
- 사고보고 절차
- 응급처치 체계
- 화재 대응
- 감전 대응
- 추락/협착/끼임 대응
- 밀폐공간 구조 대응
- 대피동선
- 병원/소방/관계기관 연락처

### 5.7 첨부자료 관리

첨부자료는 웹하드 `FileAsset`으로 연결한다.

대표 첨부:

- 공정표
- 작업계획서
- 현장 배치도
- 안전관리조직도
- 비상연락망
- 위험성평가표
- 장비 제원/검사증
- 교육자료
- 보호구 지급대장
- 산업안전보건관리비 사용계획서

### 5.8 섹션별 AI 초안

AI는 다음 섹션의 초안을 작성할 수 있다.

- 공사개요 요약
- 공종별 위험요인 표
- 위험성 감소대책 표
- 안전교육 계획
- 비상대응 계획
- 점검 및 기록관리 계획
- 첨부 필요 자료 목록

AI 초안은 `ai_draft` 상태이며 사용자가 확정해야 `confirmed`가 된다.

### 5.9 Export

지원 형식:

- PDF
- HWPX
- DOCX optional
- Markdown snapshot
- JSON snapshot

Export 후 처리:

```text
SafetyManagementPlan.status = exported
FileAsset 생성
웹하드 /프로젝트명/06_보고서_초안 또는 /08_최종본 저장
문서 버전 기록
Submission optional 연결
```

## 6. 상태

| 상태 | 의미 |
|---|---|
| draft | 초안 생성 전 또는 빈 문서 |
| input_required | 필수 입력값 부족 |
| ai_draft | AI 초안 생성됨 |
| editing | 사용자 편집중 |
| review | 내부 검토중 |
| confirmed | 확정 |
| exported | 최종본 생성 |
| submitted | 제출 완료 |
| archived | 보관 |

## 7. 완료 기준

- 프로젝트 기준 안전관리계획서를 생성할 수 있다.
- Project, ProjectParty, Contact, Contract, FileAsset 데이터를 불러올 수 있다.
- 작업공종과 위험요인/감소대책을 등록할 수 있다.
- 조직도, 비상연락망, 교육계획, 점검계획을 작성할 수 있다.
- 섹션별 AI 초안과 사용자 확정 상태를 구분한다.
- A4 미리보기와 PDF/HWPX export를 제공한다.
- export 파일은 웹하드에 저장된다.
- 안전보건대장, 체크리스트, 이행확인 보고서와 연결 가능한 RiskRegister를 남긴다.


---

## FILE: `docs/aec-erp/08-safety-management-plan/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 안전관리계획서 자동화

## 1. Frontend Routes

```text
/projects/[projectId]/safety-management-plans
/projects/[projectId]/safety-management-plans/new
/safety-management-plans/[planId]
/safety-management-plans/[planId]/edit
/safety-management-plans/[planId]/preview
/safety-management-plans/[planId]/sections
/safety-management-plans/[planId]/risks
/safety-management-plans/[planId]/organization
/safety-management-plans/[planId]/education
/safety-management-plans/[planId]/emergency
/safety-management-plans/[planId]/attachments
/safety-management-plans/[planId]/export
```

## 2. Frontend Components

```text
SafetyManagementPlanListPage
SafetyManagementPlanCreatePage
SafetyManagementPlanEditorPage
SafetyManagementPlanPreviewPage

SafetyManagementPlanWizard
PlanTemplateSelector
PlanRequiredDataPanel
PlanSectionNavigator
PlanSectionEditor
PlanA4Preview
PlanVariablePanel
PlanExportChecklist
PlanStatusBadge
PlanVersionHistory

WorkTypeTable
WorkTypeForm
RiskRegisterTable
RiskItemForm
RiskMatrixBadge
ReductionMeasureEditor
SafetyOrganizationEditor
EmergencyContactTable
EducationPlanTable
InspectionPlanTable
PpePlanTable
AttachmentLinkPanel
StaleSourceWarningPanel
```

## 3. Backend APIs

### Plans

```text
GET    /api/v1/projects/{projectId}/safety-management-plans
POST   /api/v1/projects/{projectId}/safety-management-plans
GET    /api/v1/safety-management-plans/{planId}
PATCH  /api/v1/safety-management-plans/{planId}
DELETE /api/v1/safety-management-plans/{planId}

POST   /api/v1/safety-management-plans/{planId}/generate
POST   /api/v1/safety-management-plans/{planId}/validate
POST   /api/v1/safety-management-plans/{planId}/save-section
POST   /api/v1/safety-management-plans/{planId}/sections/{sectionKey}/regenerate
POST   /api/v1/safety-management-plans/{planId}/confirm
POST   /api/v1/safety-management-plans/{planId}/export
POST   /api/v1/safety-management-plans/{planId}/refresh-linked-data
```

### Work Types and Risks

```text
GET    /api/v1/safety-management-plans/{planId}/work-types
POST   /api/v1/safety-management-plans/{planId}/work-types
PATCH  /api/v1/safety-management-work-types/{workTypeId}
DELETE /api/v1/safety-management-work-types/{workTypeId}

GET    /api/v1/safety-management-plans/{planId}/risks
POST   /api/v1/safety-management-plans/{planId}/risks
PATCH  /api/v1/safety-management-risks/{riskItemId}
DELETE /api/v1/safety-management-risks/{riskItemId}
POST   /api/v1/safety-management-plans/{planId}/risks/generate-from-work-types
POST   /api/v1/safety-management-plans/{planId}/risks/import-from-checklist
```

### Supporting Sections

```text
GET    /api/v1/safety-management-plans/{planId}/organization
PATCH  /api/v1/safety-management-plans/{planId}/organization
GET    /api/v1/safety-management-plans/{planId}/education
PATCH  /api/v1/safety-management-plans/{planId}/education
GET    /api/v1/safety-management-plans/{planId}/emergency
PATCH  /api/v1/safety-management-plans/{planId}/emergency
GET    /api/v1/safety-management-plans/{planId}/attachments
POST   /api/v1/safety-management-plans/{planId}/attachments/link
DELETE /api/v1/safety-management-plan-attachments/{attachmentId}
```

## 4. Data Models

### SafetyManagementPlan

```ts
type SafetyManagementPlanStatus =
  | 'draft'
  | 'input_required'
  | 'ai_draft'
  | 'editing'
  | 'review'
  | 'confirmed'
  | 'exported'
  | 'submitted'
  | 'archived'

type SafetyManagementPlan = {
  id: string
  projectId: string
  contractId?: string
  inspectionRoundId?: string
  templateId: string
  planNo?: string
  title: string
  status: SafetyManagementPlanStatus
  projectSnapshot: SafetyManagementProjectSnapshot
  sections: SafetyManagementPlanSection[]
  workTypes: SafetyManagementWorkType[]
  riskItems: SafetyManagementRiskItem[]
  organization?: SafetyOrganizationPlan
  educationPlan?: SafetyEducationPlan
  emergencyPlan?: SafetyEmergencyPlan
  inspectionPlan?: SafetyInspectionPlan
  attachments: SafetyManagementPlanAttachment[]
  missingFields: MissingField[]
  warnings: PlanWarning[]
  stale: boolean
  latestVersionNo: number
  exportedFileId?: string
  submittedAt?: string
  createdAt: string
  updatedAt: string
}
```

### SafetyManagementPlanSection

```ts
type SafetyManagementPlanSectionKey =
  | 'cover'
  | 'project_overview'
  | 'construction_schedule'
  | 'safety_organization'
  | 'work_method'
  | 'risk_assessment'
  | 'reduction_measures'
  | 'safety_education'
  | 'ppe_management'
  | 'equipment_temporary_electric_fire'
  | 'emergency_response'
  | 'inspection_record_management'
  | 'safety_cost_plan'
  | 'attachments'

type SafetyManagementPlanSection = {
  id: string
  planId: string
  key: SafetyManagementPlanSectionKey
  title: string
  status: 'not_started' | 'ai_draft' | 'edited' | 'review' | 'confirmed' | 'locked'
  order: number
  content: Record<string, unknown>
  sourceEntityRefs: SourceLink[]
  updatedAt: string
}
```

### SafetyManagementWorkType

```ts
type SafetyManagementWorkType = {
  id: string
  planId: string
  projectId: string
  name: string
  description?: string
  location?: string
  periodStart?: string
  periodEnd?: string
  manpower?: number
  equipment?: string[]
  displayOrder: number
  createdAt: string
  updatedAt: string
}
```

### SafetyManagementRiskItem

```ts
type SafetyManagementRiskLevel = 'low' | 'medium' | 'high' | 'critical'

type SafetyManagementRiskItem = {
  id: string
  planId: string
  projectId: string
  workTypeId?: string
  workTypeName: string
  taskDescription?: string
  hazardDescription: string
  riskType?: 'fall' | 'electric' | 'fire' | 'caught_between' | 'struck_by' | 'confined_space' | 'equipment' | 'health' | 'other'
  riskLevel?: SafetyManagementRiskLevel
  reductionMeasure: string
  responsiblePartyId?: string
  checkMethod?: string
  sourceType?: 'manual' | 'template' | 'additional_hazard' | 'inspection_checklist' | 'safety_health_ledger'
  sourceId?: string
  reportInclude: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}
```

### Supporting Models

```ts
type SafetyOrganizationPlan = {
  planId: string
  managerName?: string
  managerRole?: string
  organizationChartFileId?: string
  responsibilities: Array<{ role: string; organizationId?: string; name?: string; responsibility: string }>
}

type SafetyEducationPlan = {
  planId: string
  items: Array<{ educationType: string; target: string; cycle: string; content: string; recordMethod: string }>
}

type SafetyEmergencyPlan = {
  planId: string
  contacts: Array<{ type: string; name: string; phone?: string; organization?: string; note?: string }>
  responseProcedures: Array<{ accidentType: string; procedure: string; responsibleRole?: string }>
  evacuationRouteFileId?: string
}

type SafetyInspectionPlan = {
  planId: string
  items: Array<{ inspectionType: string; cycle: string; inspectorRole: string; recordMethod: string; linkedChecklistTemplateId?: string }>
}

type SafetyManagementPlanAttachment = {
  id: string
  planId: string
  projectId: string
  fileId: string
  attachmentType: 'schedule' | 'drawing' | 'organization_chart' | 'emergency_contact' | 'risk_assessment' | 'equipment_certificate' | 'education_material' | 'safety_cost_plan' | 'other'
  title: string
  required: boolean
  createdAt: string
}
```

## 5. Validation Rules

### Draft Creation

- projectId는 필수다.
- templateId는 필수다.
- plan title은 필수다.
- 같은 projectId에서 active plan이 이미 있으면 새 개정본 생성 또는 중복 생성 경고를 표시한다.

### Required Fields Before Export

```text
projectName
siteAddress
ownerParties
contractorName
constructionPeriod
safetyOrganization
emergencyContacts
workTypes
riskItems
reductionMeasures
educationPlan
inspectionPlan
attachmentsRequired
```

### Risk Register

- workTypeName은 필수다.
- hazardDescription은 필수다.
- reductionMeasure는 필수다.
- high/critical 위험은 responsiblePartyId 또는 responsible role이 필요하다.

### Export

- required missingFields가 있으면 최종 export를 막는다.
- 필수 섹션 status가 not_started이면 export를 막는다.
- export는 최신 저장 snapshot 기준으로 수행한다.
- exported 파일은 FileAsset으로 저장되어야 한다.

## 6. Service Rules

### Plan Draft Flow

```text
1. Project 조회
2. ProjectParty/Contact 조회
3. Contract 조회 optional
4. WorkScheduleAttachment/FileAsset 조회
5. 기본 WorkType 후보 생성
6. RiskItem 후보 생성
7. MissingField 검출
8. AI 초안 생성 optional
9. SafetyManagementPlan 생성
10. SafetyManagementPlanVersion 1 생성
11. AuditLog 기록
```

### Generate Risks From Work Types

```text
WorkType 선택
→ 공종 라이브러리 조회
→ 기본 위험요인 후보 생성
→ 사용자가 선택/수정
→ SafetyManagementRiskItem 저장
```

### Refresh Linked Data

```text
Project/Contract/Contact/FileAsset 변경 감지
→ stale = true
→ 변경된 source link 표시
→ 사용자가 반영 선택
→ PlanVersion 생성
```

### Export Flow

```text
1. editor state 저장
2. 최신 Plan snapshot 재조회
3. validate 실행
4. export renderer 호출
5. PDF/HWPX 파일 생성
6. FileAsset 생성
7. 웹하드 저장
8. SafetyManagementPlan.exportedFileId 업데이트
9. AuditLog 기록
```

## 7. Tests

```text
test_safety_management_plan_create_success
test_safety_management_plan_requires_project_and_template
test_safety_management_plan_prevents_duplicate_active_without_revision
test_safety_management_plan_loads_project_snapshot
test_safety_management_plan_work_type_create_success
test_safety_management_plan_risk_item_requires_hazard_and_measure
test_safety_management_plan_generate_risks_from_work_types
test_safety_management_plan_import_risks_from_checklist
test_safety_management_plan_missing_required_fields
test_safety_management_plan_section_regenerate_ai_draft
test_safety_management_plan_export_blocked_when_required_missing
test_safety_management_plan_export_uses_latest_saved_snapshot
test_safety_management_plan_export_creates_file_asset
test_safety_management_plan_refresh_linked_data_sets_stale
test_safety_management_plan_version_created_on_save
```


---

## FILE: `docs/aec-erp/08-safety-management-plan/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 안전관리계획서 자동화

## 1. 화면 목표

안전관리계획서 자동화 화면은 프로젝트의 안전관리계획서를 섹션별로 작성하고, 위험요인/감소대책을 표로 관리하며, A4 제출 문서 형태로 미리보고 export하는 문서 작업 화면이다.

핵심 UX 목표:

1. 프로젝트 원장 데이터 자동 반영
2. 공종별 위험요인/감소대책 표 작성
3. 안전조직·비상연락망·교육·점검계획을 누락 없이 작성
4. A4 문서 미리보기 중심의 검토
5. AI 초안과 확정본의 명확한 구분

## 2. 화면 목록

### 2.1 계획서 목록

Route:

```text
/projects/[projectId]/safety-management-plans
```

표시 컬럼:

| 컬럼 | 설명 |
|---|---|
| 계획서명 | 문서 상세 이동 |
| 프로젝트 | 프로젝트명 |
| 템플릿 | 안전관리계획서 템플릿 버전 |
| 상태 | draft/review/exported 등 |
| 위험요인 | 등록된 risk item 수 |
| 누락정보 | required missing count |
| 최종본 | FileAsset 링크 |
| 수정일 | updatedAt |

### 2.2 계획서 생성 마법사

Route:

```text
/projects/[projectId]/safety-management-plans/new
```

Step:

```text
1. 템플릿 선택
2. 프로젝트/계약 정보 확인
3. 첨부자료 연결
4. 주요 공종 선택
5. 위험요인 후보 생성
6. 누락정보 확인
7. 초안 생성
```

### 2.3 계획서 편집

Route:

```text
/safety-management-plans/[planId]/edit
```

Layout:

```text
┌─────────────────────────────────────────────────────────┐
│ Top: 계획서명 / 프로젝트 / 상태 / 저장 / 검토요청 / export │
├──────────────┬────────────────────────┬─────────────────┤
│ Section Nav  │ Section Editor         │ A4 Preview      │
│ 240px        │ fluid                  │ 520~720px       │
└──────────────┴────────────────────────┴─────────────────┘
```

### 2.4 위험요인/감소대책 화면

Route:

```text
/safety-management-plans/[planId]/risks
```

구성:

- 공종 필터
- 위험유형 필터
- 위험도 필터
- RiskRegister table
- 위험요인 추가/수정 drawer
- AI 위험요인 후보 생성 버튼
- 체크리스트/지적사항에서 불러오기 버튼

RiskRegister 컬럼:

| 컬럼 | 설명 |
|---|---|
| 공종 | 승강기 설치 등 |
| 작업내용 | 상세 작업 |
| 유해·위험요인 | 위험 설명 |
| 위험유형 | 추락/감전/화재 등 |
| 위험도 | low/medium/high/critical |
| 감소대책 | 조치 계획 |
| 책임조직 | 시공사/A&C/발주처 등 |
| 점검방법 | 점검·기록 방식 |
| 출처 | manual/template/checklist |

### 2.5 조직/비상/교육 화면

Route:

```text
/safety-management-plans/[planId]/organization
/safety-management-plans/[planId]/education
/safety-management-plans/[planId]/emergency
```

각 화면은 표 입력과 파일 연결을 함께 제공한다.

### 2.6 A4 미리보기/Export

Route:

```text
/safety-management-plans/[planId]/preview
/safety-management-plans/[planId]/export
```

Export 전 체크리스트:

- 필수 프로젝트 정보
- 안전조직
- 위험요인/감소대책
- 교육계획
- 점검계획
- 비상연락망
- 필수 첨부자료
- 최신 저장 여부
- 웹하드 저장 위치

## 3. UX 규칙

- 상단에는 항상 `계획서명 / 프로젝트명 / 상태 / 저장상태`를 표시한다.
- AI 초안 섹션은 `AI Draft` badge를 표시한다.
- 사용자가 수정한 섹션은 `Edited` badge를 표시한다.
- 확정 섹션은 lock icon을 표시한다.
- 위험도 high/critical은 시각적으로 강조한다.
- 필수 첨부자료가 없으면 export 전 warning을 표시한다.
- 법령/표준 문구는 편집권한과 변경이력을 표시한다.
- A4 미리보기는 실제 출력 여백과 페이지 구성을 최대한 보여준다.

## 4. 주요 컴포넌트

### SafetyManagementPlanWizard

- 템플릿 선택
- 프로젝트 데이터 확인
- 공정표/첨부자료 연결
- 공종 선택
- 위험요인 후보 생성
- 누락정보 확인
- 초안 생성

### PlanSectionNavigator

섹션 목록과 상태 badge를 표시한다.

### RiskRegisterTable

공종별 위험요인과 감소대책을 관리하는 핵심 표다.

### SafetyOrganizationEditor

안전관리조직도, 역할/책임, 담당자 연락처를 관리한다.

### EmergencyContactTable

비상연락망, 사고유형별 대응절차, 병원/소방/관계기관 연락처를 관리한다.

### AttachmentLinkPanel

웹하드 FileAsset을 계획서 첨부로 연결한다.

## 5. Warning State

### 위험요인 없음

```text
등록된 공종별 위험요인이 없습니다.
안전관리계획서 export 전에 주요 공종과 위험요인을 입력하세요.
```

### 필수 첨부 누락

```text
공정표 또는 안전관리조직도 첨부가 누락되었습니다.
웹하드에서 파일을 연결하거나 새로 업로드하세요.
```

### 원본 데이터 변경

```text
프로젝트 원장 또는 계약 정보가 계획서 생성 이후 변경되었습니다.
최신 데이터 반영 여부를 확인하세요.
```

## 6. Responsive

### Desktop

- Section Nav + Editor + A4 Preview 3-column
- RiskRegister는 table 중심
- 우측 MissingField/Warning panel

### Tablet

- Section Nav drawer
- Editor/Preview toggle
- Risk table horizontal scroll

### Mobile

- 검토 중심
- 위험요인/첨부 상태 확인
- 본격 편집은 데스크톱 권장


---

## FILE: `docs/aec-erp/08-safety-management-plan/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 안전관리계획서 자동화

## 1. Feature

```yaml
featureId: safety_management_plan.automation
featureName: 안전관리계획서 자동화
priority: P1
module: safety-management-plan
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 계획서 목록 | `/projects/[projectId]/safety-management-plans` | 프로젝트별 안전관리계획서 조회 |
| 계획서 생성 | `/projects/[projectId]/safety-management-plans/new` | 템플릿/자료 선택 후 초안 생성 |
| 계획서 상세 | `/safety-management-plans/[planId]` | 계획서 요약 및 상태 |
| 계획서 편집 | `/safety-management-plans/[planId]/edit` | 섹션별 편집 |
| 미리보기 | `/safety-management-plans/[planId]/preview` | A4 미리보기 |
| 섹션 관리 | `/safety-management-plans/[planId]/sections` | 섹션별 상태/재생성 |
| 위험요인 | `/safety-management-plans/[planId]/risks` | 공종별 위험요인/감소대책 |
| 조직 | `/safety-management-plans/[planId]/organization` | 안전관리조직도/책임 |
| 교육 | `/safety-management-plans/[planId]/education` | 안전교육 계획 |
| 비상대응 | `/safety-management-plans/[planId]/emergency` | 비상연락망/사고대응 |
| 첨부자료 | `/safety-management-plans/[planId]/attachments` | 웹하드 파일 연결 |
| Export | `/safety-management-plans/[planId]/export` | 최종본 생성 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| 목록 | SafetyManagementPlanTable, PlanStatusBadge, PlanFilterBar |
| 생성 | SafetyManagementPlanWizard, PlanTemplateSelector, PlanRequiredDataPanel |
| 상세 | PlanSummaryCard, PlanVersionHistory, StaleSourceWarningPanel |
| 편집 | PlanSectionNavigator, PlanSectionEditor, PlanA4Preview |
| 위험요인 | WorkTypeTable, RiskRegisterTable, RiskItemForm, RiskMatrixBadge |
| 조직 | SafetyOrganizationEditor, ContactPicker, OrganizationRoleTable |
| 교육 | EducationPlanTable, EducationPlanForm |
| 비상대응 | EmergencyContactTable, EmergencyProcedureEditor |
| 첨부자료 | AttachmentLinkPanel, WebhardFilePicker |
| Export | PlanExportChecklist, WebhardSaveLocation, ExportFormatSelector |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| SafetyManagementPlanTable | GET `/api/v1/projects/{projectId}/safety-management-plans` |
| SafetyManagementPlanWizard | POST `/api/v1/projects/{projectId}/safety-management-plans` |
| PlanSectionEditor | POST `/api/v1/safety-management-plans/{planId}/save-section` |
| SectionRegenerateButton | POST `/api/v1/safety-management-plans/{planId}/sections/{sectionKey}/regenerate` |
| RiskRegisterTable | GET `/api/v1/safety-management-plans/{planId}/risks` |
| RiskItemForm | POST/PATCH `/api/v1/safety-management-risks/{riskItemId}` |
| GenerateRisksButton | POST `/api/v1/safety-management-plans/{planId}/risks/generate-from-work-types` |
| ImportChecklistButton | POST `/api/v1/safety-management-plans/{planId}/risks/import-from-checklist` |
| SafetyOrganizationEditor | GET/PATCH `/api/v1/safety-management-plans/{planId}/organization` |
| EducationPlanTable | GET/PATCH `/api/v1/safety-management-plans/{planId}/education` |
| EmergencyContactTable | GET/PATCH `/api/v1/safety-management-plans/{planId}/emergency` |
| AttachmentLinkPanel | POST `/api/v1/safety-management-plans/{planId}/attachments/link` |
| PlanExportChecklist | POST `/api/v1/safety-management-plans/{planId}/validate` |
| ExportButton | POST `/api/v1/safety-management-plans/{planId}/export` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| POST `/safety-management-plans` | SafetyManagementPlan, SafetyManagementProjectSnapshot |
| POST `/generate` | SafetyManagementPlanSection, SafetyManagementRiskItem |
| POST `/save-section` | SafetyManagementPlanSection, SafetyManagementPlanVersion |
| POST `/risks/generate-from-work-types` | SafetyManagementWorkType, SafetyManagementRiskItem |
| POST `/risks/import-from-checklist` | ChecklistResult, Finding, SafetyManagementRiskItem |
| PATCH `/organization` | SafetyOrganizationPlan, Contact |
| PATCH `/education` | SafetyEducationPlan |
| PATCH `/emergency` | SafetyEmergencyPlan |
| POST `/attachments/link` | SafetyManagementPlanAttachment, FileAsset |
| POST `/export` | SafetyManagementPlan, FileAsset, AuditLog |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| SafetyManagementPlan | safety-management-plan-generation |
| SafetyManagementPlanSection | safety-management-plan-generation |
| SafetyManagementWorkType | safety-management-plan-generation |
| SafetyManagementRiskItem | safety-management-plan-generation |
| SafetyOrganizationPlan | safety-management-plan-generation |
| SafetyEducationPlan | safety-management-plan-generation |
| SafetyEmergencyPlan | safety-management-plan-generation |
| Project | safety-management-plan-generation |
| Contract | safety-management-plan-generation |
| ProjectParty | safety-management-plan-generation |
| Contact | safety-management-plan-generation |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 계획서 생성 | test_safety_management_plan_create_success |
| 필수 연결 검증 | test_safety_management_plan_requires_project_and_template |
| 중복 방지 | test_safety_management_plan_prevents_duplicate_active_without_revision |
| 프로젝트 snapshot | test_safety_management_plan_loads_project_snapshot |
| 공종 생성 | test_safety_management_plan_work_type_create_success |
| 위험요인 검증 | test_safety_management_plan_risk_item_requires_hazard_and_measure |
| 위험요인 후보 생성 | test_safety_management_plan_generate_risks_from_work_types |
| 체크리스트 import | test_safety_management_plan_import_risks_from_checklist |
| 누락정보 | test_safety_management_plan_missing_required_fields |
| AI 섹션 재생성 | test_safety_management_plan_section_regenerate_ai_draft |
| export 차단 | test_safety_management_plan_export_blocked_when_required_missing |
| 최신 저장본 export | test_safety_management_plan_export_uses_latest_saved_snapshot |
| 웹하드 저장 | test_safety_management_plan_export_creates_file_asset |
| 원본 변경 감지 | test_safety_management_plan_refresh_linked_data_sets_stale |
| 버전 생성 | test_safety_management_plan_version_created_on_save |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ProjectParty, Contact |
| 계약/견적 | contractId, 공사기간, 용역범위 |
| 점검회차/일정 | inspectionRoundId optional revision link |
| 현장점검 체크리스트 | 위험요인/점검계획 기준, Risk import/export |
| 지적사항/사진대지 | 추가 유해위험요인과 보완대책 연결 |
| 안전보건대장 | RiskRegister와 감소대책을 장기 대장으로 이관 |
| 웹하드 | 첨부자료, export 파일 FileAsset |
| 메일함 | 안전관리계획서 제출 메일 |
| 결재/제출 | 검토, 확정, 제출 이력 |
| 관리자/템플릿 | DocumentTemplate, standard legal text, PromptTemplate |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 안전관리계획서 원본 템플릿 부재 | 템플릿 버전 구조를 먼저 만들고, 세부 목차는 템플릿 수령 후 조정 |
| AI가 법령 문구 생성 | templateSections 문구만 사용 |
| 현장 특수성 없는 일반문구 남발 | `현장 확인 필요`와 missingFields로 분리 |
| 계획서 위험요인과 체크리스트 불일치 | RiskRegister ↔ ChecklistTemplate mapping |
| 프로젝트 원장 변경 후 계획서 stale | refresh-linked-data와 stale warning |
| export 시 이전 snapshot 사용 | save-before-export 테스트 필수 |
| 첨부자료 누락 | required attachment validation |


---

## FILE: `docs/aec-erp/08-safety-management-plan/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 안전관리계획서 초안 생성

## Prompt ID

`safety-management-plan-generation`

## 목적

프로젝트 원장, 계약, 발주처/시공사/담당자, 공정표, 작업공법, 위험요인, 교육·점검계획, 비상연락망, 첨부자료를 바탕으로 건설안전기술사가 검토할 안전관리계획서 초안을 생성한다.

## Prompt

```text
너는 A&C기술사사무소 ERP의 안전관리계획서 작성 보조 엔진이다.

입력:
- project
- projectParties
- contacts
- contract
- workScheduleAttachments
- workTypes
- riskItems
- safetyOrganization
- educationPlan
- emergencyPlan
- inspectionPlan
- ppePlan
- equipmentPlan
- safetyCostPlan
- attachments
- templateSections
- userInstruction

목표:
선택한 프로젝트 기준으로 안전관리계획서 초안을 생성한다.

반드시 생성할 섹션:
1. 공사개요
2. 현장 조직 및 책임
3. 공정표 및 작업계획
4. 공종별 작업공법
5. 공종별 유해·위험요인
6. 위험성 평가 및 감소대책
7. 안전관리조직도 및 비상연락망
8. 근로자 안전교육 계획
9. 보호구 지급 및 착용관리
10. 장비·가설·전기·화재 안전관리
11. 밀폐공간·양중·고소작업 등 중점위험 관리
12. 비상대응 및 사고보고 체계
13. 정기점검 및 기록관리 계획
14. 산업안전보건관리비 사용계획
15. 첨부자료

작성 규칙:
- 입력에 없는 사실을 만들지 않는다.
- 법령·고시·표준 문구는 templateSections에 있는 문구만 사용한다.
- 현장 특수성이 없으면 일반 문구로 단정하지 말고 "현장 확인 필요"로 표시한다.
- 공종별 위험요인과 감소대책은 표로 작성한다.
- 위험도가 높거나 중대한 위험은 reviewWarnings에 표시한다.
- 날짜, 금액, 기관명, 담당자명은 입력값 그대로 사용한다.
- 첨부자료가 필요한데 없는 경우 missingFields에 표시한다.
- 최종본이 아니라 기술사 검토용 초안으로 작성한다.
- 같은 프로젝트에 발주처가 여러 개인 경우 발주처 공통 계획과 발주처별 확인 필요 사항을 구분한다.

출력 JSON:
{
  "documentTitle": "",
  "tableOfContents": [],
  "sections": [
    {
      "sectionKey": "project_overview",
      "title": "",
      "status": "ai_draft",
      "body": "",
      "tables": []
    }
  ],
  "riskRegister": [
    {
      "workType": "",
      "taskDescription": "",
      "hazardDescription": "",
      "riskType": "",
      "riskLevel": "low | medium | high | critical | unknown",
      "reductionMeasure": "",
      "responsiblePartyHint": "",
      "checkMethod": "",
      "source": "manual | template | linked_data"
    }
  ],
  "educationPlanDraft": [],
  "inspectionPlanDraft": [],
  "emergencyPlanDraft": [],
  "attachmentsRequired": [
    {
      "attachmentType": "",
      "title": "",
      "reason": "",
      "required": true
    }
  ],
  "variablesUsed": [
    {
      "variable": "",
      "value": "",
      "sourceEntityType": "",
      "sourceEntityId": ""
    }
  ],
  "missingFields": [
    {
      "field": "",
      "label": "",
      "sectionKey": "",
      "severity": "required | recommended | optional",
      "reason": ""
    }
  ],
  "reviewWarnings": [
    {
      "type": "missing_template_text | high_risk_item | missing_attachment | unclear_work_method | legal_text_review_required",
      "sectionKey": "",
      "severity": "info | warning | danger",
      "message": ""
    }
  ]
}
```

## 공종별 위험요인 작성 기준

승강기/에스컬레이터 교체공사에서 자주 필요한 위험요인 후보:

```text
- 승강기 철거: 추락, 낙하·비래, 협착, 중량물 취급
- 승강기 설치: 양중, 끼임, 고소작업, 전기작업
- 에스컬레이터 교체: 중량물 반입, 절단, 화기, 협착
- 가설전기: 감전, 누전, 분전반 관리 미흡
- 사다리/말비계: 추락, 전도
- 용접/화기: 화재, 불티 비산, 질식
- 승강로/피트: 밀폐공간, 환기, 구조 곤란
- 폐기물 반출: 낙하, 충돌, 보행자 동선 간섭
```

## 금지사항

- 입력되지 않은 공사 규모나 작업방법을 임의로 확정하지 않는다.
- 법령 조항을 새로 만들어 쓰지 않는다.
- 발주처 또는 시공사 책임을 임의로 단정하지 않는다.
- 위험요인이 없다고 단정하지 않는다.
- 첨부파일이 없는데 첨부된 것처럼 표시하지 않는다.
```


---

## FILE: `docs/aec-erp/08-safety-management-plan/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 안전관리계획서 자동화

## Prompt

```text
You are implementing the Safety Management Plan Automation module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module creates project-level safety management plans from project registry, contract, parties, contacts, schedules, work types, risk register, safety organization, education plan, emergency plan, inspection plan, and attachments.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Safety Management Plan module.

Existing concepts:
- Project
- Organization
- ProjectParty
- Contact
- Contract
- WorkScheduleAttachment
- ChecklistTemplate
- ChecklistResult
- Finding
- FileAsset
- Folder
- Submission
- AuditLog
- PromptTemplate

Required backend models:
- SafetyManagementPlan
- SafetyManagementProjectSnapshot
- SafetyManagementPlanSection
- SafetyManagementPlanVersion
- SafetyManagementWorkType
- SafetyManagementRiskItem
- SafetyOrganizationPlan
- SafetyEducationPlan
- SafetyEmergencyPlan
- SafetyInspectionPlan
- SafetyManagementPlanAttachment
- SafetyManagementExportJob
- MissingField
- PlanWarning
- SourceLink

Required backend APIs:

Plans:
- GET /api/v1/projects/{projectId}/safety-management-plans
- POST /api/v1/projects/{projectId}/safety-management-plans
- GET /api/v1/safety-management-plans/{planId}
- PATCH /api/v1/safety-management-plans/{planId}
- DELETE /api/v1/safety-management-plans/{planId}
- POST /api/v1/safety-management-plans/{planId}/generate
- POST /api/v1/safety-management-plans/{planId}/validate
- POST /api/v1/safety-management-plans/{planId}/save-section
- POST /api/v1/safety-management-plans/{planId}/sections/{sectionKey}/regenerate
- POST /api/v1/safety-management-plans/{planId}/confirm
- POST /api/v1/safety-management-plans/{planId}/export
- POST /api/v1/safety-management-plans/{planId}/refresh-linked-data

Work Types and Risks:
- GET /api/v1/safety-management-plans/{planId}/work-types
- POST /api/v1/safety-management-plans/{planId}/work-types
- PATCH /api/v1/safety-management-work-types/{workTypeId}
- DELETE /api/v1/safety-management-work-types/{workTypeId}
- GET /api/v1/safety-management-plans/{planId}/risks
- POST /api/v1/safety-management-plans/{planId}/risks
- PATCH /api/v1/safety-management-risks/{riskItemId}
- DELETE /api/v1/safety-management-risks/{riskItemId}
- POST /api/v1/safety-management-plans/{planId}/risks/generate-from-work-types
- POST /api/v1/safety-management-plans/{planId}/risks/import-from-checklist

Supporting Sections:
- GET /api/v1/safety-management-plans/{planId}/organization
- PATCH /api/v1/safety-management-plans/{planId}/organization
- GET /api/v1/safety-management-plans/{planId}/education
- PATCH /api/v1/safety-management-plans/{planId}/education
- GET /api/v1/safety-management-plans/{planId}/emergency
- PATCH /api/v1/safety-management-plans/{planId}/emergency
- GET /api/v1/safety-management-plans/{planId}/attachments
- POST /api/v1/safety-management-plans/{planId}/attachments/link
- DELETE /api/v1/safety-management-plan-attachments/{attachmentId}

Required frontend routes:
- /projects/[projectId]/safety-management-plans
- /projects/[projectId]/safety-management-plans/new
- /safety-management-plans/[planId]
- /safety-management-plans/[planId]/edit
- /safety-management-plans/[planId]/preview
- /safety-management-plans/[planId]/sections
- /safety-management-plans/[planId]/risks
- /safety-management-plans/[planId]/organization
- /safety-management-plans/[planId]/education
- /safety-management-plans/[planId]/emergency
- /safety-management-plans/[planId]/attachments
- /safety-management-plans/[planId]/export

Required frontend components:
- SafetyManagementPlanWizard
- PlanTemplateSelector
- PlanRequiredDataPanel
- PlanSectionNavigator
- PlanSectionEditor
- PlanA4Preview
- PlanExportChecklist
- WorkTypeTable
- RiskRegisterTable
- RiskItemForm
- RiskMatrixBadge
- ReductionMeasureEditor
- SafetyOrganizationEditor
- EmergencyContactTable
- EducationPlanTable
- InspectionPlanTable
- AttachmentLinkPanel
- StaleSourceWarningPanel

Business requirements:
1. SafetyManagementPlan must belong to Project.
2. SafetyManagementPlan can optionally link to Contract and InspectionRound for revisions.
3. Plan creation must snapshot Project, ProjectParty, Contact, and Contract data.
4. WorkType and RiskItem are first-class records.
5. AI-generated sections must be draft only.
6. Legal/template text must come from registered template sections.
7. Export must use the latest saved snapshot.
8. Export must create FileAsset and save it to webhard.
9. Risk register can be generated from work types or imported from checklist/additional hazard data.
10. Refresh linked data must detect stale source data.
11. All status changes and exports create AuditLog.

Seed data for Leeum elevator replacement project:
- workTypes: 승강기 철거, 승강기 설치, 에스컬레이터 교체, 가설전기, 용접·화기, 이동식 사다리/말비계, 승강로·피트 작업, 폐기물 반출
- risk examples: 추락, 감전, 화재, 협착, 낙하·비래, 밀폐공간, 중량물 양중

Tests:
- test_safety_management_plan_create_success
- test_safety_management_plan_requires_project_and_template
- test_safety_management_plan_prevents_duplicate_active_without_revision
- test_safety_management_plan_loads_project_snapshot
- test_safety_management_plan_work_type_create_success
- test_safety_management_plan_risk_item_requires_hazard_and_measure
- test_safety_management_plan_generate_risks_from_work_types
- test_safety_management_plan_import_risks_from_checklist
- test_safety_management_plan_missing_required_fields
- test_safety_management_plan_section_regenerate_ai_draft
- test_safety_management_plan_export_blocked_when_required_missing
- test_safety_management_plan_export_uses_latest_saved_snapshot
- test_safety_management_plan_export_creates_file_asset
- test_safety_management_plan_refresh_linked_data_sets_stale
- test_safety_management_plan_version_created_on_save

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Risk generation service
- Plan generation service
- Export service adapter placeholder
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```


---

## FILE: `docs/aec-erp/08-safety-management-plan/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 안전관리계획서 자동화

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "안전관리계획서 자동화" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 프로젝트 원장, 계약, 공정표, 작업공법, 위험성평가, 조직도, 비상연락망, 교육·점검계획을 기반으로 안전관리계획서를 자동 작성하는 ERP
- 이 화면은 사후 점검보고서가 아니라 프로젝트 단위 계획 문서를 작성하는 문서 자동화 작업실
- 안전관리계획서의 공종별 위험요인과 감소대책은 이후 현장점검 체크리스트, 공사안전보건대장 이행확인 보고서, 안전보건대장으로 이어지는 원천 데이터

화면 1: 계획서 목록
- 좌측 ERP 사이드바
- 상단 프로젝트 요약 헤더
- 필터:
  - 계획서 상태
  - 템플릿 버전
  - 누락정보
  - 최종본 여부
- 중앙 계획서 테이블
- 컬럼:
  - 계획서명
  - 프로젝트
  - 템플릿
  - 상태
  - 위험요인 수
  - 누락정보
  - 최종본
  - 수정일
- 우측 빠른 작업 패널:
  - 새 안전관리계획서
  - 공정표 연결
  - 위험요인 후보 생성

화면 2: 계획서 생성 마법사
- Step 1 템플릿 선택
- Step 2 프로젝트/계약 정보 확인
- Step 3 공정표/첨부자료 연결
- Step 4 주요 공종 선택
- Step 5 위험요인 후보 생성
- Step 6 누락정보 확인
- Step 7 초안 생성
- 각 단계는 card 형태로 구성하고, 완료/미완료 상태를 badge로 표시한다.

화면 3: 계획서 편집
- 상단 sticky header:
  - 계획서명
  - 프로젝트명
  - 상태 badge
  - 저장
  - 검토요청
  - PDF/HWPX export
- 3-column layout:
  - 좌측: 섹션 navigation
  - 중앙: 섹션 편집기
  - 우측: A4 문서 미리보기
- 섹션 navigation:
  - 공사개요
  - 현장 조직 및 책임
  - 공정표 및 작업계획
  - 공종별 작업공법
  - 위험성 평가 및 감소대책
  - 안전교육 계획
  - 보호구 관리
  - 장비·가설·전기·화재 관리
  - 비상대응
  - 점검 및 기록관리
  - 첨부자료
- 각 섹션에 상태 badge를 표시한다.

화면 4: 위험요인/감소대책
- 공종별 RiskRegister table
- 필터:
  - 공종
  - 위험유형
  - 위험도
  - 출처
- 컬럼:
  - 공종
  - 작업내용
  - 유해·위험요인
  - 위험유형
  - 위험도
  - 감소대책
  - 책임조직
  - 점검방법
  - 출처
- high/critical 위험도는 빨간색 또는 진한 주황색으로 강조한다.
- AI 위험요인 후보 생성 버튼과 체크리스트에서 불러오기 버튼을 제공한다.

화면 5: 비상연락망/교육/점검계획
- 연락망 table
- 교육계획 table
- 점검계획 table
- 첨부파일 연결 패널
- 누락 필드는 우측 warning panel에 표시한다.

화면 6: A4 미리보기와 Export
- 흰색 A4 paper preview
- 회색 workspace background
- 페이지별 navigation
- Draft watermark
- 표 페이지 깨짐 warning
- export 전 체크리스트:
  - 필수정보
  - 위험요인
  - 교육계획
  - 비상연락망
  - 첨부자료
  - 최신 저장 여부
  - 웹하드 저장 위치

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- 문서 미리보기는 흰색 A4 paper
- 화면 배경은 밝은 회색
- 표와 문서는 공공/대기업 제출 문서처럼 단정하게
- 위험도와 누락정보는 명확한 색상으로 표시
- AI 초안은 파란색 또는 보라색 outline badge
- 확정은 초록색, 검토중은 보라색, 오류는 빨간색, 경고는 주황색
- 한글 가독성을 최우선으로 한다.

결과물:
- 안전관리계획서 목록 화면
- 계획서 생성 마법사 화면
- 계획서 섹션 편집 화면
- 위험요인/감소대책 관리 화면
- 비상연락망/교육/점검계획 화면
- A4 미리보기 화면
- Export 전 체크리스트 화면
```


---

## FILE: `docs/aec-erp/08-safety-management-plan/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 안전관리계획서 자동화

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
안전관리계획서 자동화

기능 설명:
안전관리계획서 자동화는 프로젝트 원장, 계약, 발주처/시공사/담당자, 공정표, 작업공법, 위험요인, 감소대책, 안전관리조직, 비상연락망, 교육계획, 점검계획, 첨부자료를 기반으로 안전관리계획서 초안을 생성하고 A4 미리보기와 PDF/HWPX export를 제공하는 기능이다.

업무 맥락:
- 안전관리계획서는 기본적으로 Project 단위 문서다.
- 필요 시 Contract와 연결된다.
- 필요 시 InspectionRound에 개정본 또는 보완본으로 연결될 수 있다.
- 공종별 위험요인과 감소대책은 현장점검 체크리스트와 안전보건대장의 원천 데이터가 된다.
- AI 초안은 최종본이 아니며 사용자가 검토·확정해야 한다.
- 법령/표준 문구는 등록된 템플릿 문구만 사용해야 한다.
- export는 최신 저장 snapshot 기준으로 수행되어야 한다.
- export 파일은 웹하드 FileAsset으로 저장되어야 한다.

입력:
{
  "featureName": "안전관리계획서 자동화",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `safety_management_plan.automation`으로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 계약/견적
    - 점검회차/일정
    - 현장점검 체크리스트
    - 지적사항/조치현황
    - 안전보건대장
    - 웹하드
    - 메일함
    - 결재/제출
    - 관리자/템플릿

출력 JSON:
{
  "featureId": "safety_management_plan.automation",
  "featureName": "안전관리계획서 자동화",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /projects/[projectId]/safety-management-plans
- /projects/[projectId]/safety-management-plans/new
- /safety-management-plans/[planId]
- /safety-management-plans/[planId]/edit
- /safety-management-plans/[planId]/preview
- /safety-management-plans/[planId]/sections
- /safety-management-plans/[planId]/risks
- /safety-management-plans/[planId]/organization
- /safety-management-plans/[planId]/education
- /safety-management-plans/[planId]/emergency
- /safety-management-plans/[planId]/attachments
- /safety-management-plans/[planId]/export

반드시 포함할 models:
- SafetyManagementPlan
- SafetyManagementProjectSnapshot
- SafetyManagementPlanSection
- SafetyManagementPlanVersion
- SafetyManagementWorkType
- SafetyManagementRiskItem
- SafetyOrganizationPlan
- SafetyEducationPlan
- SafetyEmergencyPlan
- SafetyInspectionPlan
- SafetyManagementPlanAttachment
- SafetyManagementExportJob
- Project
- ProjectParty
- Contact
- Contract
- FileAsset
- AuditLog

반드시 포함할 prompts:
- safety-management-plan-generation
- safety-management-plan implementation prompt
- safety-management-plan design prompt

반드시 포함할 tests:
- test_safety_management_plan_create_success
- test_safety_management_plan_requires_project_and_template
- test_safety_management_plan_prevents_duplicate_active_without_revision
- test_safety_management_plan_loads_project_snapshot
- test_safety_management_plan_work_type_create_success
- test_safety_management_plan_risk_item_requires_hazard_and_measure
- test_safety_management_plan_generate_risks_from_work_types
- test_safety_management_plan_import_risks_from_checklist
- test_safety_management_plan_missing_required_fields
- test_safety_management_plan_section_regenerate_ai_draft
- test_safety_management_plan_export_blocked_when_required_missing
- test_safety_management_plan_export_uses_latest_saved_snapshot
- test_safety_management_plan_export_creates_file_asset
- test_safety_management_plan_refresh_linked_data_sets_stale
- test_safety_management_plan_version_created_on_save

주의:
- 안전관리계획서는 Project 없이 생성될 수 없다.
- 원본 템플릿이 없는 경우 일반 목차를 최종 템플릿으로 확정하지 않는다.
- AI가 법령 문구를 임의 생성하지 못하게 한다.
- 공종별 위험요인과 감소대책은 구조화된 RiskItem으로 저장한다.
- 첨부자료가 없는 경우 첨부된 것처럼 표시하지 않는다.
- export는 최신 저장 snapshot 기준이어야 한다.
- export 파일은 FileAsset과 웹하드 위치를 가져야 한다.
```


---

## FILE: `docs/aec-erp/09-safety-health-ledger/README.md`

# 기능 09 — 안전보건대장 자동화

이 폴더는 A&C 기술사 ERP의 아홉 번째 기능인 `안전보건대장 자동화` 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

안전보건대장 자동화는 프로젝트의 유해·위험요인, 위험성 감소대책, 안전관리계획서, 점검회차, 체크리스트, 지적사항, 조치이력, 산업안전보건관리비, 첨부자료를 장기 누적 대장으로 관리하는 기능이다.

이 기능은 **제출 회차별 결과보고서**가 아니라, 프로젝트 전체 기간 동안 유지되는 **기준 대장**이다.

```text
Project
→ SafetyManagementPlan
→ RiskRegister
→ SafetyHealthLedger
→ InspectionRound History
→ Finding / CorrectiveAction History
→ SafetyCostUsage History
→ Attachment / FileAsset
→ LedgerVersion / Export
```

## 기존 기능과의 관계

- 08 안전관리계획서: 공종별 위험요인과 감소대책의 초기 입력원
- 04 이행확인 보고서: 회차별 점검 결과와 제출본의 연결점
- 05 체크리스트: 실제 점검 결과 입력원
- 06 지적/조치/사진대지: 지적사항 및 조치이력 입력원
- 07 산업안전보건관리비: 비용 사용 이력 입력원

## 핵심 설계 포인트

- `SafetyHealthLedger`는 `projectId` 기준으로 생성한다.
- 필요하면 발주처별 보조 section을 둘 수 있지만, 기본은 프로젝트 단위 누적 대장이다.
- 회차별 보고서와 연결되는 항목은 `inspectionRoundId`를 유지한다.
- 같은 위험요인이 여러 회차에서 반복되면 재발/반복 항목으로 표시한다.
- 조치 완료 이력은 확인자, 확인일, 증빙사진을 포함해야 한다.
- export는 최신 저장 snapshot 기준으로 수행한다.


---

## FILE: `docs/aec-erp/09-safety-health-ledger/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 안전보건대장 자동화

## 1. 기능 정의

안전보건대장 자동화는 A&C 기술사 ERP에서 프로젝트 전체 기간 동안 관리해야 하는 안전보건 관련 기준정보와 이력을 하나의 대장으로 누적 관리하는 기능이다.

이 기능은 회차별로 생성되는 `공사안전보건대장 이행확인 보고서`와 다르다. 보고서가 특정 점검회차와 발주처 기준의 제출 문서라면, 안전보건대장은 프로젝트 전체의 위험요인, 예방조치, 점검 이력, 지적사항, 조치 이력, 산업안전보건관리비, 첨부문서를 누적하는 장기 기록 문서다.

## 2. 이 기능이 필요한 이유

A&C 기술사 ERP의 앞선 기능들은 각각의 업무 단위를 다룬다.

```text
안전관리계획서 → 공종별 위험요인과 감소대책 계획
점검회차 → 언제 무엇을 점검했는지
체크리스트 → 회차별 점검 결과
지적사항 → 발견된 문제
조치현황 → 시공사 조치 및 확인 결과
산업안전보건관리비 → 사용내역과 적정성
보고서 → 발주처별 제출 문서
```

안전보건대장은 이 데이터를 장기 이력으로 묶어서, 프로젝트가 진행되는 동안 위험요인이 어떻게 관리되고 있는지 추적한다.

특히 다음 질문에 답해야 한다.

- 이 프로젝트의 주요 유해·위험요인은 무엇인가?
- 각 위험요인에 대해 어떤 감소대책이 수립되었는가?
- 점검회차별로 어떤 항목이 반복 지적되었는가?
- 조치가 완료된 항목과 미완료 항목은 무엇인가?
- 산업안전보건관리비는 어떤 기준으로 확인되었는가?
- 최종 제출 또는 감사 시 어떤 증빙자료가 연결되어 있는가?

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 건설안전기술사 | 대장 전체 검토, 위험요인 및 조치 이력 확인, 최종 확정 |
| 점검 담당자 | 회차별 점검 결과와 지적사항 이력 확인 |
| 문서 작성자 | 안전보건대장 초안 생성, 섹션 보완, export |
| 계약/행정 담당자 | 제출본, 첨부자료, 웹하드 보관 이력 확인 |
| 관리자 | 대장 템플릿, 위험요인 라이브러리, 표준 문구 관리 |

## 4. 안전보건대장 기본 구조

```text
1. 기본정보
2. 공사개요
3. 발주자·시공자·전문가 정보
4. 주요 유해·위험요인
5. 위험성 감소대책
6. 설계/계획 단계 검토사항
7. 시공 단계 확인사항
8. 점검 이력
9. 지적사항 이력
10. 조치 완료 이력
11. 산업안전보건관리비 확인 이력
12. 첨부문서
13. 변경/개정 이력
```

## 5. 핵심 기능

### 5.1 대장 생성

프로젝트 원장 기준으로 안전보건대장을 생성한다.

생성 방식:

```text
프로젝트 선택
→ 템플릿 선택
→ 안전관리계획서 연결 여부 선택
→ 기존 점검/지적/비용 데이터 연결 여부 선택
→ 누락정보 확인
→ 초안 생성
```

### 5.2 안전관리계획서에서 위험요인 가져오기

08번 기능에서 생성한 안전관리계획서의 공종별 위험요인과 감소대책을 안전보건대장의 초기 위험요인 register로 가져온다.

가져오는 항목:

- 공종
- 작업내용
- 유해·위험요인
- 위험유형
- 위험도
- 감소대책
- 책임조직
- 점검방법
- 첨부자료

### 5.3 위험요인 register 관리

프로젝트 단위 위험요인을 관리한다.

입력 필드:

- 공종
- 작업내용
- 유해·위험요인
- 위험유형
- 위험도
- 감소대책
- 책임조직
- 관련 점검항목
- 최초 등록일
- 최근 점검일
- 상태
- 반복 지적 여부
- 관련 사진/파일

상태:

```text
identified
planned
in_control
needs_action
repeated
closed
```

### 5.4 점검 이력 누적

점검회차별 결과를 안전보건대장에 누적한다.

누적 정보:

- 회차
- 문서번호
- 점검일
- 점검 담당자
- 발주처별 보고서 제출 여부
- 체크리스트 요약
- 주의/불량 항목 수
- 지적사항 수
- 조치 완료 수
- 미조치 수
- 관련 보고서 파일

### 5.5 지적사항/조치이력 누적

06번 기능의 `Finding`과 `CorrectiveAction`을 안전보건대장에 반영한다.

표시 정보:

- 지적사항 제목
- 위험유형
- 발생 회차
- 책임 조직
- 조치 요청사항
- 조치 내용
- 조치 상태
- 확인자
- 확인일
- 증빙사진
- 반복 여부

### 5.6 반복 위험요인 표시

같은 위험유형, 유사 제목, 같은 공종 또는 같은 체크리스트 항목에서 반복 지적이 발생하면 `반복/재발 항목`으로 표시한다.

예시:

```text
전기 안전관리 관련 지적사항이 1회, 2회, 3회 점검에서 반복 발생
→ 반복 위험요인 표시
→ 총평 및 대장 검토 경고에 반영
```

### 5.7 산업안전보건관리비 확인 이력

07번 기능의 `SafetyCostUsage`를 회차별·발주처별로 누적한다.

표시 정보:

- 기준월
- 발주처
- 계상금액
- 사용금액
- 사용률
- 관련근거
- 적정성 의견
- 증빙파일
- 보고서 반영 여부

### 5.8 첨부문서 관리

대장에 연결할 첨부자료를 관리한다.

첨부 유형:

- 안전관리계획서
- 공사안전보건대장 이행확인 보고서
- 점검표
- 사진대지
- 산업안전보건관리비 사용내역서
- 공사일정표
- 회의록
- 교육자료
- 기타 증빙

### 5.9 대장 개정/버전 관리

대장은 프로젝트 진행 중 여러 번 갱신될 수 있다.

버전 상태:

```text
draft
review
confirmed
exported
archived
```

개정 이력에는 다음을 남긴다.

- 버전 번호
- 변경 사유
- 변경된 섹션
- 변경자
- 변경일
- 연결 원본 데이터
- export 파일

### 5.10 Export

지원 형식:

- PDF
- HWPX
- DOCX optional
- Markdown internal
- JSON snapshot

Export 후 처리:

```text
SafetyHealthLedger.status = exported
LedgerVersion 생성
FileAsset 생성
웹하드 /프로젝트명/08_최종본 또는 /프로젝트명/07_검토본 저장
AuditLog 기록
```

## 6. 사용자 흐름

### 대장 초안 생성

```text
프로젝트 선택
→ 안전보건대장 메뉴 진입
→ 대장 생성 클릭
→ 템플릿 선택
→ 안전관리계획서 위험요인 불러오기
→ 점검/지적/조치/안전관리비 데이터 연결
→ 누락정보 확인
→ AI 초안 생성
→ 섹션별 검토
```

### 회차 데이터 반영

```text
점검회차 종료
→ 체크리스트/지적사항/조치현황 확정
→ 안전보건대장 업데이트 알림
→ 변경 항목 미리보기
→ 대장에 반영
→ LedgerVersion 생성
```

### 최종본 생성

```text
대장 검토
→ 필수 누락정보 확인
→ 반복 위험요인 확인
→ 조치 미완료 항목 확인
→ export 전 저장
→ PDF/HWPX 생성
→ 웹하드 저장
```

## 7. 완료 기준

- 프로젝트 기준 안전보건대장을 생성할 수 있다.
- 안전관리계획서의 위험요인을 대장 register로 가져올 수 있다.
- 점검회차별 체크리스트 요약을 누적할 수 있다.
- 지적사항과 조치이력을 누적할 수 있다.
- 반복 지적사항을 표시할 수 있다.
- 산업안전보건관리비 사용 이력을 누적할 수 있다.
- 첨부자료를 대장 섹션과 연결할 수 있다.
- 대장 버전과 개정 이력을 관리할 수 있다.
- 최신 저장 snapshot 기준으로 export할 수 있다.


---

## FILE: `docs/aec-erp/09-safety-health-ledger/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 안전보건대장 자동화

## 1. Frontend Routes

```text
/projects/[projectId]/safety-health-ledgers
/projects/[projectId]/safety-health-ledgers/new
/safety-health-ledgers/[ledgerId]
/safety-health-ledgers/[ledgerId]/edit
/safety-health-ledgers/[ledgerId]/risks
/safety-health-ledgers/[ledgerId]/measures
/safety-health-ledgers/[ledgerId]/inspections
/safety-health-ledgers/[ledgerId]/findings
/safety-health-ledgers/[ledgerId]/safety-costs
/safety-health-ledgers/[ledgerId]/attachments
/safety-health-ledgers/[ledgerId]/preview
/safety-health-ledgers/[ledgerId]/export
/safety-health-ledgers/[ledgerId]/versions
```

## 2. Frontend Components

```text
SafetyHealthLedgerListPage
SafetyHealthLedgerCreatePage
SafetyHealthLedgerDetailPage
SafetyHealthLedgerEditorPage
SafetyHealthLedgerPreviewPage

LedgerWizard
LedgerStatusBadge
LedgerSectionNavigator
LedgerSectionEditor
LedgerA4Preview
LedgerMissingFieldPanel
LedgerReviewWarningPanel
LedgerVersionHistory
LedgerExportChecklist

LedgerRiskRegisterTable
LedgerRiskItemForm
LedgerRiskStatusBadge
RiskReductionMeasureTable
RiskRecurrenceBadge

LedgerInspectionHistoryTable
LedgerFindingHistoryTable
LedgerActionHistoryTimeline
LedgerSafetyCostHistoryTable
LedgerAttachmentPanel
LedgerSourceLinkPanel
LedgerSyncPreviewModal
```

## 3. Backend APIs

### Ledgers

```text
GET    /api/v1/projects/{projectId}/safety-health-ledgers
POST   /api/v1/projects/{projectId}/safety-health-ledgers
GET    /api/v1/safety-health-ledgers/{ledgerId}
PATCH  /api/v1/safety-health-ledgers/{ledgerId}
DELETE /api/v1/safety-health-ledgers/{ledgerId}

POST   /api/v1/safety-health-ledgers/{ledgerId}/generate
POST   /api/v1/safety-health-ledgers/{ledgerId}/validate
POST   /api/v1/safety-health-ledgers/{ledgerId}/confirm
POST   /api/v1/safety-health-ledgers/{ledgerId}/export
POST   /api/v1/safety-health-ledgers/{ledgerId}/archive
```

### Sections

```text
GET   /api/v1/safety-health-ledgers/{ledgerId}/sections
POST  /api/v1/safety-health-ledgers/{ledgerId}/sections/{sectionKey}/save
POST  /api/v1/safety-health-ledgers/{ledgerId}/sections/{sectionKey}/regenerate
PATCH /api/v1/safety-health-ledger-sections/{sectionId}
```

### Risk Register

```text
GET    /api/v1/safety-health-ledgers/{ledgerId}/risks
POST   /api/v1/safety-health-ledgers/{ledgerId}/risks
PATCH  /api/v1/safety-health-ledger-risks/{riskId}
DELETE /api/v1/safety-health-ledger-risks/{riskId}
POST   /api/v1/safety-health-ledgers/{ledgerId}/risks/import-from-plan
POST   /api/v1/safety-health-ledgers/{ledgerId}/risks/detect-recurrence
```

### Measures

```text
GET   /api/v1/safety-health-ledgers/{ledgerId}/measures
POST  /api/v1/safety-health-ledgers/{ledgerId}/measures
PATCH /api/v1/safety-health-ledger-measures/{measureId}
DELETE /api/v1/safety-health-ledger-measures/{measureId}
```

### Histories

```text
GET  /api/v1/safety-health-ledgers/{ledgerId}/inspection-history
POST /api/v1/safety-health-ledgers/{ledgerId}/inspection-history/sync

GET  /api/v1/safety-health-ledgers/{ledgerId}/finding-history
POST /api/v1/safety-health-ledgers/{ledgerId}/finding-history/sync

GET  /api/v1/safety-health-ledgers/{ledgerId}/safety-cost-history
POST /api/v1/safety-health-ledgers/{ledgerId}/safety-cost-history/sync
```

### Attachments / Versions

```text
GET  /api/v1/safety-health-ledgers/{ledgerId}/attachments
POST /api/v1/safety-health-ledgers/{ledgerId}/attachments
DELETE /api/v1/safety-health-ledger-attachments/{attachmentId}

GET  /api/v1/safety-health-ledgers/{ledgerId}/versions
GET  /api/v1/safety-health-ledger-versions/{versionId}
POST /api/v1/safety-health-ledgers/{ledgerId}/versions
```

## 4. Data Models

### SafetyHealthLedger

```ts
type SafetyHealthLedgerStatus =
  | 'draft'
  | 'review'
  | 'confirmed'
  | 'exported'
  | 'archived'

type SafetyHealthLedger = {
  id: string
  projectId: string
  templateId: string
  title: string
  status: SafetyHealthLedgerStatus
  currentVersionNo: number
  latestSnapshot: SafetyHealthLedgerSnapshot
  exportedFileId?: string
  createdAt: string
  updatedAt: string
}
```

### SafetyHealthLedgerSnapshot

```ts
type SafetyHealthLedgerSnapshot = {
  meta: LedgerMeta
  sections: SafetyHealthLedgerSection[]
  riskItems: LedgerRiskItem[]
  measures: LedgerRiskReductionMeasure[]
  inspectionHistory: LedgerInspectionHistory[]
  findingHistory: LedgerFindingHistory[]
  safetyCostHistory: LedgerSafetyCostHistory[]
  attachments: LedgerAttachment[]
  missingFields: LedgerMissingField[]
  reviewWarnings: LedgerReviewWarning[]
  sourceLinks: LedgerSourceLink[]
}
```

### LedgerMeta

```ts
type LedgerMeta = {
  projectName: string
  siteName?: string
  siteAddress?: string
  constructionType?: string
  ownerNames: string[]
  contractorName?: string
  engineerName?: string
  constructionStartDate?: string
  constructionEndDate?: string
  latestInspectionRoundNo?: number
  latestUpdatedAt?: string
}
```

### SafetyHealthLedgerSection

```ts
type LedgerSectionKey =
  | 'basic_info'
  | 'project_summary'
  | 'stakeholders'
  | 'hazard_risk_register'
  | 'risk_reduction_measures'
  | 'design_stage_review'
  | 'construction_stage_review'
  | 'inspection_history'
  | 'finding_history'
  | 'corrective_action_history'
  | 'safety_cost_history'
  | 'attachments'
  | 'revision_history'

type SafetyHealthLedgerSection = {
  id: string
  ledgerId: string
  key: LedgerSectionKey
  title: string
  order: number
  status: 'not_started' | 'ai_draft' | 'edited' | 'review' | 'confirmed' | 'locked'
  content: Record<string, unknown>
  sourceLinks: LedgerSourceLink[]
  updatedAt: string
}
```

### LedgerRiskItem

```ts
type LedgerRiskStatus =
  | 'identified'
  | 'planned'
  | 'in_control'
  | 'needs_action'
  | 'repeated'
  | 'closed'

type LedgerRiskItem = {
  id: string
  ledgerId: string
  projectId: string
  sourceType?: 'safety_management_plan' | 'checklist' | 'finding' | 'manual'
  sourceId?: string
  workType?: string
  workDescription?: string
  hazardDescription: string
  riskType?: string
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  reductionMeasureSummary?: string
  responsibleOrganizationId?: string
  relatedChecklistItemIds: string[]
  relatedFindingIds: string[]
  recurrenceCount: number
  status: LedgerRiskStatus
  firstDetectedAt?: string
  lastDetectedAt?: string
  createdAt: string
  updatedAt: string
}
```

### LedgerRiskReductionMeasure

```ts
type LedgerRiskReductionMeasure = {
  id: string
  ledgerId: string
  riskItemId: string
  measureDetail: string
  responsibleOrganizationId?: string
  inspectionMethod?: string
  dueDate?: string
  status: 'planned' | 'in_progress' | 'implemented' | 'verified' | 'ineffective' | 'cancelled'
  verifiedBy?: string
  verifiedAt?: string
  sourceLinks: LedgerSourceLink[]
}
```

### LedgerInspectionHistory

```ts
type LedgerInspectionHistory = {
  id: string
  ledgerId: string
  inspectionRoundId: string
  roundNo: number
  documentNo?: string
  inspectionDate?: string
  checklistSessionId?: string
  summary: string
  goodCount: number
  cautionCount: number
  badCount: number
  findingCount: number
  verifiedActionCount: number
  openFindingCount: number
  linkedReportIds: string[]
  sourceLinks: LedgerSourceLink[]
}
```

### LedgerFindingHistory

```ts
type LedgerFindingHistory = {
  id: string
  ledgerId: string
  findingId: string
  inspectionRoundId: string
  ownerPartyId?: string
  title: string
  riskType?: string
  status: string
  actionSummary?: string
  verifiedAt?: string
  evidencePhotoIds: string[]
  isRepeated: boolean
  recurrenceGroupId?: string
  sourceLinks: LedgerSourceLink[]
}
```

### LedgerSafetyCostHistory

```ts
type LedgerSafetyCostHistory = {
  id: string
  ledgerId: string
  safetyCostUsageId: string
  inspectionRoundId?: string
  ownerPartyId?: string
  ownerName?: string
  basisMonth?: string
  calculatedAmount: number
  usedAmount: number
  usedRate: number
  appropriatenessStatus?: string
  evidenceFileIds: string[]
  sourceLinks: LedgerSourceLink[]
}
```

### LedgerAttachment / Version

```ts
type LedgerAttachment = {
  id: string
  ledgerId: string
  fileId: string
  attachmentType:
    | 'safety_management_plan'
    | 'safety_report'
    | 'checklist'
    | 'photo_ledger'
    | 'safety_cost'
    | 'schedule'
    | 'education'
    | 'meeting'
    | 'other'
  title: string
  linkedEntityType?: string
  linkedEntityId?: string
  createdAt: string
}

type SafetyHealthLedgerVersion = {
  id: string
  ledgerId: string
  versionNo: number
  status: 'draft' | 'review' | 'confirmed' | 'exported'
  changeReason?: string
  changedSectionKeys: LedgerSectionKey[]
  snapshot: SafetyHealthLedgerSnapshot
  exportedFileId?: string
  createdBy?: string
  createdAt: string
}
```

## 5. Validation Rules

### Ledger Creation

- `projectId`는 필수다.
- 같은 프로젝트의 active 안전보건대장은 기본 1개만 허용한다.
- 템플릿이 없으면 기본 템플릿을 사용한다.

### Risk Register

- `hazardDescription`은 필수다.
- 위험요인을 안전관리계획서에서 가져온 경우 `sourceType=safety_management_plan`과 `sourceId`를 유지한다.
- 같은 위험요인이 반복 발생하면 `recurrenceCount`를 갱신한다.

### Sync

- 점검 이력 동기화는 `InspectionRound` 기준으로 수행한다.
- 지적사항 이력 동기화는 `Finding`과 `CorrectiveAction` 기준으로 수행한다.
- 안전관리비 이력 동기화는 `SafetyCostUsage` 기준으로 수행한다.
- 원본 데이터 변경 시 stale warning을 표시한다.

### Export

- required missing field가 있으면 final export를 막는다.
- 미완료 조치가 있으면 warning을 표시한다.
- 반복 위험요인이 있으면 warning을 표시한다.
- export는 최신 저장 snapshot을 기준으로 한다.

## 6. Service Rules

### Create From Project

```text
1. Project 조회
2. ProjectParty / Contact 조회
3. 기본 SafetyHealthLedger 생성
4. 기본 sections 생성
5. SafetyManagementPlan이 있으면 risk import 후보 생성
6. LedgerVersion 1 생성
7. AuditLog 기록
```

### Import From Safety Management Plan

```text
1. SafetyManagementPlan 조회
2. RiskItem / WorkType / Section 조회
3. LedgerRiskItem 생성 또는 갱신
4. RiskReductionMeasure 생성 또는 갱신
5. sourceLinks 저장
6. recurrence 초기화
```

### Sync From Inspection Data

```text
1. InspectionRound 목록 조회
2. ChecklistSession / ChecklistResult 요약
3. Finding / CorrectiveAction 이력 조회
4. SafetyCostUsage 이력 조회
5. LedgerInspectionHistory 갱신
6. LedgerFindingHistory 갱신
7. LedgerSafetyCostHistory 갱신
8. 반복 위험요인 감지
9. LedgerVersion 생성
```

### Recurrence Detection

반복 지적 판단 기준:

```text
same riskType
or same checklistItemId
or similar normalized finding title
or same workType + same hazard keyword
```

결과:

```text
LedgerRiskItem.status = repeated
LedgerFindingHistory.isRepeated = true
reviewWarnings에 repeated_risk 추가
```

### Export Flow

```text
1. editor state 저장
2. 최신 ledger snapshot 재조회
3. validate 실행
4. PDF/HWPX renderer 호출
5. FileAsset 생성
6. 웹하드 저장
7. SafetyHealthLedger.exportedFileId 업데이트
8. SafetyHealthLedgerVersion 생성
9. AuditLog 기록
```

## 7. Tests

```text
test_safety_health_ledger_create_success
test_safety_health_ledger_prevents_duplicate_active_ledger
test_safety_health_ledger_imports_risks_from_safety_management_plan
test_ledger_risk_requires_hazard_description
test_ledger_syncs_inspection_history
test_ledger_syncs_finding_action_history
test_ledger_syncs_safety_cost_history
test_ledger_detects_repeated_risks
test_ledger_version_created_on_sync
test_ledger_export_blocked_when_required_missing
test_ledger_export_uses_latest_saved_snapshot
test_ledger_export_creates_file_asset
test_ledger_attachment_links_file_asset
test_ledger_stale_source_warning_created
```


---

## FILE: `docs/aec-erp/09-safety-health-ledger/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 안전보건대장 자동화

## 1. 화면 목표

안전보건대장 자동화 화면은 프로젝트 전체 기간의 위험요인, 감소대책, 점검이력, 지적사항, 조치이력, 안전관리비, 첨부자료를 장기 누적 대장 형태로 관리하는 화면이다.

이 화면은 회차별 보고서 편집기보다 더 장기적인 관점의 `대장 workspace`로 설계한다.

핵심 목표:

1. 프로젝트 전체 위험요인을 한눈에 확인한다.
2. 안전관리계획서에서 온 계획 데이터와 현장점검에서 온 실행 데이터를 구분한다.
3. 반복 지적사항과 미조치 항목을 빠르게 찾는다.
4. 회차별 점검·보고서·사진대지·안전관리비 이력을 연결한다.
5. 대장 export 전 누락정보와 검토 경고를 명확히 보여준다.

## 2. 화면 목록

### 2.1 안전보건대장 목록

Route:

```text
/projects/[projectId]/safety-health-ledgers
```

표시 항목:

| 컬럼 | 설명 |
|---|---|
| 대장명 | 프로젝트 안전보건대장 |
| 상태 | draft/review/confirmed/exported |
| 위험요인 | 전체/반복/미조치 수 |
| 점검이력 | 반영된 점검회차 수 |
| 지적사항 | open/verified/closed 수 |
| 안전관리비 | 최근 기준월/사용률 |
| 최종본 | exported file |
| 최근 갱신 | updatedAt |

### 2.2 대장 생성 마법사

Route:

```text
/projects/[projectId]/safety-health-ledgers/new
```

Step:

```text
1. 프로젝트 확인
2. 템플릿 선택
3. 안전관리계획서 연결
4. 위험요인 가져오기
5. 점검/지적/안전관리비 데이터 연결
6. 누락정보 확인
7. 초안 생성
```

### 2.3 대장 상세/편집

Route:

```text
/safety-health-ledgers/[ledgerId]/edit
```

Layout:

```text
┌─────────────────────────────────────────────────────────┐
│ Top: 대장명 / 프로젝트 / 상태 / 저장 / 동기화 / export    │
├──────────────┬────────────────────────┬─────────────────┤
│ Section Nav  │ Ledger Editor          │ Review Panel    │
│ 240px        │ fluid                  │ 360px           │
└──────────────┴────────────────────────┴─────────────────┘
```

섹션:

```text
기본정보
공사개요
관계자
주요 유해·위험요인
위험성 감소대책
설계/계획 단계 검토사항
시공 단계 확인사항
점검 이력
지적사항 이력
조치 완료 이력
산업안전보건관리비 이력
첨부문서
개정 이력
```

### 2.4 위험요인 Register

Route:

```text
/safety-health-ledgers/[ledgerId]/risks
```

컬럼:

| 컬럼 | 설명 |
|---|---|
| 공종 | 승강기 철거 등 |
| 작업내용 | 작업 단위 |
| 유해·위험요인 | 추락, 감전, 화재 등 |
| 위험도 | low/medium/high/critical |
| 감소대책 | 요약 |
| 책임조직 | 시공사 등 |
| 관련 점검항목 | ChecklistItem |
| 반복 | recurrence badge |
| 상태 | identified/planned/in_control/needs_action/repeated/closed |

### 2.5 점검이력 화면

Route:

```text
/safety-health-ledgers/[ledgerId]/inspections
```

표시:

- 회차
- 문서번호
- 점검일
- 체크리스트 요약
- 주의/불량 수
- 지적사항 수
- 미조치 수
- 연결 보고서
- 연결 사진대지

### 2.6 지적/조치 이력 화면

Route:

```text
/safety-health-ledgers/[ledgerId]/findings
```

표시:

- 지적사항
- 위험유형
- 발생 회차
- 발주처
- 조치 상태
- 조치내용
- 확인일
- 증빙사진
- 반복 여부

### 2.7 산업안전보건관리비 이력 화면

Route:

```text
/safety-health-ledgers/[ledgerId]/safety-costs
```

표시:

- 기준월
- 발주처
- 계상금액
- 사용금액
- 사용률
- 적정성 의견
- 증빙파일
- 보고서 반영 여부

### 2.8 A4 미리보기 / Export

Route:

```text
/safety-health-ledgers/[ledgerId]/preview
/safety-health-ledgers/[ledgerId]/export
```

Export 전 체크리스트:

- 필수 기본정보
- 위험요인 누락
- 감소대책 누락
- 미조치 지적사항
- 반복 위험요인
- 안전관리비 증빙 누락
- 첨부자료 누락
- 최신 동기화 여부
- 웹하드 저장 위치

## 3. UX 규칙

1. 대장은 프로젝트 단위 문서임을 상단에 명확히 표시한다.
2. 회차별 보고서와 다르다는 것을 설명하는 안내 배너를 제공한다.
3. 계획 데이터와 실행 데이터를 다른 badge로 구분한다.
4. 반복 위험요인은 별도 badge와 warning으로 강조한다.
5. 미조치 지적사항은 export 전 warning으로 표시한다.
6. 최신 동기화가 필요한 경우 `원본 데이터 변경됨` 배지를 표시한다.
7. 위험요인 register는 표 중심으로 정보 밀도 높게 구성한다.
8. 대장 미리보기는 A4 문서 형식으로 제공한다.
9. 사용자가 직접 수정한 섹션과 AI 초안 섹션을 구분한다.
10. 원본 sourceLink를 클릭하면 관련 점검회차, 지적사항, 보고서로 이동할 수 있어야 한다.

## 4. 컴포넌트 상세

### LedgerWizard

- 프로젝트 확인
- 템플릿 선택
- 안전관리계획서 연결
- 위험요인 import
- 이력 데이터 sync
- 누락정보 확인
- 초안 생성

### LedgerRiskRegisterTable

- 공종/위험요인/감소대책/책임조직/상태/반복 여부
- inline edit
- source link
- 반복 위험요인 필터

### LedgerSyncPreviewModal

- 새로 반영될 점검회차
- 새로 반영될 지적사항
- 변경된 조치상태
- 새 안전관리비 이력
- 충돌/중복 항목

### LedgerReviewWarningPanel

그룹:

```text
필수 누락정보
반복 위험요인
미조치 지적사항
증빙 누락
원본 변경
export 전 확인
```

### LedgerA4Preview

- 대장 문서 preview
- 섹션별 페이지 이동
- 표 넘침 경고
- 초안 watermark
- 최종본 파일명 preview

## 5. Empty State

대장이 없을 때:

```text
등록된 안전보건대장이 없습니다.
프로젝트 원장과 안전관리계획서를 기반으로 안전보건대장 초안을 생성하세요.
```

버튼:

- 안전보건대장 생성
- 안전관리계획서에서 생성
- 템플릿 선택

## 6. Responsive

### Desktop

- section nav + editor + review panel
- 위험요인 register는 full table
- A4 preview 별도 탭

### Tablet

- review panel은 drawer
- table horizontal scroll

### Mobile

- 조회 중심
- 위험요인/지적사항 card list
- export는 데스크톱 권장


---

## FILE: `docs/aec-erp/09-safety-health-ledger/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 안전보건대장 자동화

## 1. Feature

```yaml
featureId: safety_health_ledger.automation
featureName: 안전보건대장 자동화
priority: P1
module: safety-health-ledger
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 대장 목록 | `/projects/[projectId]/safety-health-ledgers` | 프로젝트 안전보건대장 조회 |
| 대장 생성 | `/projects/[projectId]/safety-health-ledgers/new` | 프로젝트/템플릿/원본 연결 |
| 대장 상세 | `/safety-health-ledgers/[ledgerId]` | 대장 요약 및 상태 |
| 대장 편집 | `/safety-health-ledgers/[ledgerId]/edit` | 섹션별 편집 |
| 위험요인 register | `/safety-health-ledgers/[ledgerId]/risks` | 위험요인 관리 |
| 감소대책 | `/safety-health-ledgers/[ledgerId]/measures` | 감소대책 관리 |
| 점검이력 | `/safety-health-ledgers/[ledgerId]/inspections` | 점검회차 누적 이력 |
| 지적/조치이력 | `/safety-health-ledgers/[ledgerId]/findings` | 지적사항 및 조치 누적 |
| 안전관리비 이력 | `/safety-health-ledgers/[ledgerId]/safety-costs` | 비용 확인 이력 |
| 첨부자료 | `/safety-health-ledgers/[ledgerId]/attachments` | 연결 파일 관리 |
| 미리보기 | `/safety-health-ledgers/[ledgerId]/preview` | A4 문서 preview |
| Export | `/safety-health-ledgers/[ledgerId]/export` | 최종본 생성 |
| 버전 | `/safety-health-ledgers/[ledgerId]/versions` | 개정/버전 이력 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| 대장 목록 | SafetyHealthLedgerTable, LedgerStatusBadge |
| 대장 생성 | LedgerWizard, LedgerMissingFieldPanel |
| 대장 상세 | LedgerSummaryCard, LedgerReviewWarningPanel |
| 대장 편집 | LedgerSectionNavigator, LedgerSectionEditor, LedgerSourceLinkPanel |
| 위험요인 register | LedgerRiskRegisterTable, LedgerRiskItemForm, RiskRecurrenceBadge |
| 감소대책 | RiskReductionMeasureTable, LedgerRiskStatusBadge |
| 점검이력 | LedgerInspectionHistoryTable, LedgerSyncPreviewModal |
| 지적/조치이력 | LedgerFindingHistoryTable, LedgerActionHistoryTimeline |
| 안전관리비 이력 | LedgerSafetyCostHistoryTable |
| 첨부자료 | LedgerAttachmentPanel |
| 미리보기 | LedgerA4Preview |
| Export | LedgerExportChecklist |
| 버전 | LedgerVersionHistory |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| SafetyHealthLedgerTable | GET `/api/v1/projects/{projectId}/safety-health-ledgers` |
| LedgerWizard | POST `/api/v1/projects/{projectId}/safety-health-ledgers` |
| LedgerSectionEditor | POST `/api/v1/safety-health-ledgers/{ledgerId}/sections/{sectionKey}/save` |
| LedgerRiskRegisterTable | GET `/api/v1/safety-health-ledgers/{ledgerId}/risks` |
| LedgerRiskItemForm | POST/PATCH `/api/v1/safety-health-ledger-risks` |
| RiskReductionMeasureTable | GET `/api/v1/safety-health-ledgers/{ledgerId}/measures` |
| LedgerInspectionHistoryTable | GET `/api/v1/safety-health-ledgers/{ledgerId}/inspection-history` |
| LedgerFindingHistoryTable | GET `/api/v1/safety-health-ledgers/{ledgerId}/finding-history` |
| LedgerSafetyCostHistoryTable | GET `/api/v1/safety-health-ledgers/{ledgerId}/safety-cost-history` |
| LedgerAttachmentPanel | GET/POST `/api/v1/safety-health-ledgers/{ledgerId}/attachments` |
| LedgerSyncPreviewModal | POST sync endpoints |
| LedgerA4Preview | GET `/api/v1/safety-health-ledgers/{ledgerId}` |
| LedgerExportChecklist | POST `/api/v1/safety-health-ledgers/{ledgerId}/validate`, POST `/export` |
| LedgerVersionHistory | GET `/api/v1/safety-health-ledgers/{ledgerId}/versions` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| POST `/safety-health-ledgers` | SafetyHealthLedger, SafetyHealthLedgerVersion |
| POST `/generate` | SafetyHealthLedgerSnapshot, SafetyHealthLedgerSection |
| POST `/risks/import-from-plan` | SafetyManagementPlan, LedgerRiskItem, LedgerRiskReductionMeasure |
| POST `/inspection-history/sync` | InspectionRound, ChecklistSession, LedgerInspectionHistory |
| POST `/finding-history/sync` | Finding, CorrectiveAction, LedgerFindingHistory |
| POST `/safety-cost-history/sync` | SafetyCostUsage, LedgerSafetyCostHistory |
| POST `/risks/detect-recurrence` | LedgerRiskItem, LedgerFindingHistory, LedgerReviewWarning |
| POST `/export` | SafetyHealthLedgerVersion, FileAsset, AuditLog |
| POST `/attachments` | LedgerAttachment, FileAsset |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| SafetyHealthLedger | safety-health-ledger-generation |
| SafetyHealthLedgerSnapshot | safety-health-ledger-generation |
| LedgerRiskItem | safety-health-ledger-generation |
| LedgerRiskReductionMeasure | safety-health-ledger-generation |
| LedgerInspectionHistory | safety-health-ledger-generation |
| LedgerFindingHistory | safety-health-ledger-generation |
| LedgerSafetyCostHistory | safety-health-ledger-generation |
| Project | safety-health-ledger-generation |
| SafetyManagementPlan | safety-health-ledger-generation |
| Finding | safety-health-ledger-generation |
| CorrectiveAction | safety-health-ledger-generation |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 대장 생성 | test_safety_health_ledger_create_success |
| 중복 방지 | test_safety_health_ledger_prevents_duplicate_active_ledger |
| 위험요인 import | test_safety_health_ledger_imports_risks_from_safety_management_plan |
| 위험요인 검증 | test_ledger_risk_requires_hazard_description |
| 점검 이력 sync | test_ledger_syncs_inspection_history |
| 지적/조치 이력 sync | test_ledger_syncs_finding_action_history |
| 안전관리비 sync | test_ledger_syncs_safety_cost_history |
| 반복 위험 감지 | test_ledger_detects_repeated_risks |
| 버전 생성 | test_ledger_version_created_on_sync |
| export 차단 | test_ledger_export_blocked_when_required_missing |
| 최신 snapshot export | test_ledger_export_uses_latest_saved_snapshot |
| 파일 생성 | test_ledger_export_creates_file_asset |
| 첨부 연결 | test_ledger_attachment_links_file_asset |
| 원본 변경 warning | test_ledger_stale_source_warning_created |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ProjectParty, Contact |
| 안전관리계획서 | SafetyManagementPlan, SafetyManagementRiskItem |
| 점검회차/일정 | InspectionRound, LedgerInspectionHistory |
| 현장점검 체크리스트 | ChecklistSession, ChecklistResult |
| 지적사항/조치현황 | Finding, CorrectiveAction |
| 사진대지 | EvidencePhoto, FileAsset |
| 산업안전보건관리비 | SafetyCostUsage |
| 이행확인 보고서 | DocumentInstance, linkedReportIds |
| 웹하드 | LedgerAttachment, exportedFileId |
| 결재/제출 | export 후 Submission optional |
| 관리자/템플릿 | LedgerTemplate, PromptTemplate |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 회차별 보고서와 대장 혼동 | 대장은 projectId 기준, 보고서는 inspectionRoundId+ownerPartyId 기준으로 구분 |
| 원본 데이터 변경 후 대장 미갱신 | stale source warning 및 sync preview 제공 |
| 반복 위험요인 누락 | riskType/checklistItem/title keyword 기반 recurrence detection |
| 조치 미확인 항목을 완료로 표시 | verified CorrectiveAction만 완료로 표시 |
| 안전관리계획서 위험요인과 실제 점검 결과 불일치 | sourceLink와 mismatch warning 제공 |
| export 시 오래된 snapshot 사용 | save-before-export invariant 적용 |
| 첨부자료 누락 | LedgerAttachment validation 및 warning |


---

## FILE: `docs/aec-erp/09-safety-health-ledger/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 안전보건대장 초안 생성 및 이력 정리

## Prompt ID

`safety-health-ledger-generation`

## 목적

프로젝트 정보, 안전관리계획서, 점검회차, 체크리스트, 지적사항, 조치현황, 산업안전보건관리비, 첨부자료를 바탕으로 안전보건대장 초안과 누적 이력을 정리한다.

## Prompt

```text
너는 A&C기술사사무소 ERP의 안전보건대장 작성 보조 엔진이다.

입력:
- project
- projectParties
- contacts
- contract
- safetyManagementPlan
- safetyManagementRiskItems
- inspectionRounds
- checklistSessions
- checklistResults
- findings
- correctiveActions
- evidencePhotos
- safetyCostUsages
- documentInstances
- fileAssets
- existingLedger
- templateSections
- userInstruction

목표:
프로젝트 단위 안전보건대장을 작성하고, 위험요인·감소대책·점검이력·지적사항·조치이력·산업안전보건관리비·첨부자료를 누적 정리한다.

해야 할 일:
1. 프로젝트 기본정보와 관계자 정보를 대장 기본정보로 정리한다.
2. 안전관리계획서의 공종별 위험요인을 위험요인 register로 정리한다.
3. 각 위험요인에 대응하는 감소대책을 정리한다.
4. 점검회차별 이력을 inspectionHistory로 누적한다.
5. 지적사항과 조치현황을 findingActionHistory로 정리한다.
6. 같은 위험요인 또는 유사 지적사항이 반복되면 repeatedRisk로 표시한다.
7. 산업안전보건관리비 사용 이력을 발주처/회차/기준월 기준으로 정리한다.
8. 첨부자료를 유형별로 분류한다.
9. 누락된 필수값은 missingFields로 분리한다.
10. 원본 데이터와 연결되는 항목은 sourceLinks를 유지한다.

작성 규칙:
- 입력에 없는 정보를 만들지 않는다.
- 날짜, 금액, 기관명, 법령 문구는 입력값 또는 템플릿 문구만 사용한다.
- 회차별 보고서와 연결되는 항목은 inspectionRoundId를 유지한다.
- 발주처별 데이터는 ownerPartyId를 유지한다.
- 지적사항이 verified되지 않았으면 조치완료로 표현하지 않는다.
- 같은 위험요인이 반복되면 반복 횟수와 관련 회차를 표시한다.
- 사진이나 첨부가 없는 경우 있다고 작성하지 않는다.
- 최종본이 아니라 검토용 초안으로 작성한다.

출력 JSON:
{
  "ledgerTitle": "",
  "meta": {
    "projectName": "",
    "siteName": "",
    "siteAddress": "",
    "ownerNames": [],
    "contractorName": "",
    "engineerName": "",
    "constructionPeriod": ""
  },
  "sections": [
    {
      "sectionKey": "basic_info",
      "title": "",
      "status": "ai_draft",
      "content": {},
      "sourceLinks": []
    }
  ],
  "riskRegister": [
    {
      "workType": "",
      "workDescription": "",
      "hazardDescription": "",
      "riskType": "",
      "riskLevel": "low | medium | high | critical | unknown",
      "reductionMeasureSummary": "",
      "responsibleOrganizationName": "",
      "status": "identified | planned | in_control | needs_action | repeated | closed",
      "recurrenceCount": 0,
      "relatedInspectionRoundIds": [],
      "relatedFindingIds": [],
      "sourceLinks": []
    }
  ],
  "inspectionHistory": [
    {
      "inspectionRoundId": "",
      "roundNo": null,
      "documentNo": "",
      "inspectionDate": null,
      "summary": "",
      "cautionCount": 0,
      "badCount": 0,
      "findingCount": 0,
      "openFindingCount": 0,
      "linkedReportIds": []
    }
  ],
  "findingActionHistory": [
    {
      "findingId": "",
      "inspectionRoundId": "",
      "ownerPartyId": null,
      "title": "",
      "riskType": "",
      "findingStatus": "",
      "actionSummary": "",
      "actionVerified": false,
      "verifiedAt": null,
      "evidencePhotoIds": [],
      "isRepeated": false
    }
  ],
  "safetyCostHistory": [
    {
      "safetyCostUsageId": "",
      "inspectionRoundId": null,
      "ownerPartyId": null,
      "ownerName": "",
      "basisMonth": "",
      "calculatedAmount": null,
      "usedAmount": null,
      "usedRate": null,
      "appropriatenessComment": "",
      "evidenceFileIds": []
    }
  ],
  "attachments": [
    {
      "fileId": "",
      "attachmentType": "",
      "title": "",
      "linkedEntityType": "",
      "linkedEntityId": ""
    }
  ],
  "missingFields": [
    {
      "field": "",
      "label": "",
      "sectionKey": "",
      "severity": "required | recommended | optional",
      "reason": ""
    }
  ],
  "reviewWarnings": [
    {
      "type": "repeated_risk | open_finding | missing_evidence | stale_source | safety_cost_gap | review_required",
      "severity": "info | warning | danger",
      "message": ""
    }
  ]
}
```

## 반복 위험요인 판단 기준

다음 중 하나에 해당하면 반복 위험요인 후보로 표시한다.

```text
- 동일 riskType이 2회 이상 반복
- 동일 checklistItemId에서 caution/bad가 2회 이상 발생
- 지적사항 제목의 핵심 키워드가 반복
- 동일 공종 + 동일 위험 키워드가 반복
```

## 금지사항

- 입력에 없는 위험요인을 새로 만들지 않는다.
- 조치가 verified되지 않았는데 완료로 쓰지 않는다.
- 첨부파일이 없는데 첨부된 것으로 표현하지 않는다.
- 법령 문구나 법적 판단을 임의로 추가하지 않는다.
- 발주처별 금액과 총액을 혼동하지 않는다.
```


---

## FILE: `docs/aec-erp/09-safety-health-ledger/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 안전보건대장 자동화

## Prompt

```text
You are implementing the Safety Health Ledger Automation module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module creates and maintains a project-level SafetyHealthLedger by accumulating risk register items, reduction measures, inspection history, finding/action history, safety cost history, attachments, versions, and export snapshots.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Safety Health Ledger module.

Existing concepts:
- Project
- Organization
- ProjectParty
- Contact
- Contract
- SafetyManagementPlan
- SafetyManagementRiskItem
- InspectionRound
- ChecklistSession
- ChecklistResult
- Finding
- CorrectiveAction
- EvidencePhoto
- SafetyCostUsage
- DocumentInstance
- FileAsset
- Folder
- AuditLog

Required backend models:
- SafetyHealthLedger
- SafetyHealthLedgerSnapshot
- LedgerMeta
- SafetyHealthLedgerSection
- LedgerRiskItem
- LedgerRiskReductionMeasure
- LedgerInspectionHistory
- LedgerFindingHistory
- LedgerSafetyCostHistory
- LedgerAttachment
- SafetyHealthLedgerVersion
- LedgerMissingField
- LedgerReviewWarning
- LedgerSourceLink

Required backend APIs:

Ledgers:
- GET /api/v1/projects/{projectId}/safety-health-ledgers
- POST /api/v1/projects/{projectId}/safety-health-ledgers
- GET /api/v1/safety-health-ledgers/{ledgerId}
- PATCH /api/v1/safety-health-ledgers/{ledgerId}
- DELETE /api/v1/safety-health-ledgers/{ledgerId}
- POST /api/v1/safety-health-ledgers/{ledgerId}/generate
- POST /api/v1/safety-health-ledgers/{ledgerId}/validate
- POST /api/v1/safety-health-ledgers/{ledgerId}/confirm
- POST /api/v1/safety-health-ledgers/{ledgerId}/export
- POST /api/v1/safety-health-ledgers/{ledgerId}/archive

Sections:
- GET /api/v1/safety-health-ledgers/{ledgerId}/sections
- POST /api/v1/safety-health-ledgers/{ledgerId}/sections/{sectionKey}/save
- POST /api/v1/safety-health-ledgers/{ledgerId}/sections/{sectionKey}/regenerate
- PATCH /api/v1/safety-health-ledger-sections/{sectionId}

Risk Register:
- GET /api/v1/safety-health-ledgers/{ledgerId}/risks
- POST /api/v1/safety-health-ledgers/{ledgerId}/risks
- PATCH /api/v1/safety-health-ledger-risks/{riskId}
- DELETE /api/v1/safety-health-ledger-risks/{riskId}
- POST /api/v1/safety-health-ledgers/{ledgerId}/risks/import-from-plan
- POST /api/v1/safety-health-ledgers/{ledgerId}/risks/detect-recurrence

Measures:
- GET /api/v1/safety-health-ledgers/{ledgerId}/measures
- POST /api/v1/safety-health-ledgers/{ledgerId}/measures
- PATCH /api/v1/safety-health-ledger-measures/{measureId}
- DELETE /api/v1/safety-health-ledger-measures/{measureId}

Histories:
- GET /api/v1/safety-health-ledgers/{ledgerId}/inspection-history
- POST /api/v1/safety-health-ledgers/{ledgerId}/inspection-history/sync
- GET /api/v1/safety-health-ledgers/{ledgerId}/finding-history
- POST /api/v1/safety-health-ledgers/{ledgerId}/finding-history/sync
- GET /api/v1/safety-health-ledgers/{ledgerId}/safety-cost-history
- POST /api/v1/safety-health-ledgers/{ledgerId}/safety-cost-history/sync

Attachments and versions:
- GET /api/v1/safety-health-ledgers/{ledgerId}/attachments
- POST /api/v1/safety-health-ledgers/{ledgerId}/attachments
- DELETE /api/v1/safety-health-ledger-attachments/{attachmentId}
- GET /api/v1/safety-health-ledgers/{ledgerId}/versions
- GET /api/v1/safety-health-ledger-versions/{versionId}
- POST /api/v1/safety-health-ledgers/{ledgerId}/versions

Required frontend routes:
- /projects/[projectId]/safety-health-ledgers
- /projects/[projectId]/safety-health-ledgers/new
- /safety-health-ledgers/[ledgerId]
- /safety-health-ledgers/[ledgerId]/edit
- /safety-health-ledgers/[ledgerId]/risks
- /safety-health-ledgers/[ledgerId]/measures
- /safety-health-ledgers/[ledgerId]/inspections
- /safety-health-ledgers/[ledgerId]/findings
- /safety-health-ledgers/[ledgerId]/safety-costs
- /safety-health-ledgers/[ledgerId]/attachments
- /safety-health-ledgers/[ledgerId]/preview
- /safety-health-ledgers/[ledgerId]/export
- /safety-health-ledgers/[ledgerId]/versions

Required frontend components:
- LedgerWizard
- LedgerStatusBadge
- LedgerSectionNavigator
- LedgerSectionEditor
- LedgerA4Preview
- LedgerMissingFieldPanel
- LedgerReviewWarningPanel
- LedgerVersionHistory
- LedgerExportChecklist
- LedgerRiskRegisterTable
- LedgerRiskItemForm
- LedgerRiskStatusBadge
- RiskReductionMeasureTable
- RiskRecurrenceBadge
- LedgerInspectionHistoryTable
- LedgerFindingHistoryTable
- LedgerActionHistoryTimeline
- LedgerSafetyCostHistoryTable
- LedgerAttachmentPanel
- LedgerSourceLinkPanel
- LedgerSyncPreviewModal

Business requirements:
1. SafetyHealthLedger belongs to Project.
2. There should be one active ledger per Project by default.
3. Ledger can import risk items from SafetyManagementPlan.
4. Ledger can sync inspection history from InspectionRound and ChecklistSession.
5. Ledger can sync finding/action history from Finding and CorrectiveAction.
6. Ledger can sync safety cost history from SafetyCostUsage.
7. Ledger must keep sourceLinks to original entities.
8. Repeated risk detection should mark recurrence in LedgerRiskItem and LedgerFindingHistory.
9. Ledger export must use the latest saved snapshot.
10. Export must create FileAsset and update exportedFileId.
11. Sync actions must create a new SafetyHealthLedgerVersion.
12. Required missing fields block final export.
13. Open findings and repeated risks show warnings, not automatic blocking unless configured.
14. AI-generated content is draft only.

Validation:
1. projectId is required.
2. hazardDescription is required for LedgerRiskItem.
3. riskItemId is required for LedgerRiskReductionMeasure.
4. attachment fileId must reference FileAsset.
5. export requires latest snapshot validation.
6. active duplicate ledger should be blocked or warned.

Seed data:
Create a demo SafetyHealthLedger for the Leeum elevator replacement project. Import risk items from the safety management plan candidate set:
- 승강기 철거: 추락, 낙하·비래
- 승강기 설치: 협착, 중량물 양중
- 에스컬레이터 교체: 추락, 협착
- 전기·가설전기 작업: 감전
- 용접·화기 작업: 화재
- 이동식 사다리/말비계 작업: 추락
- 승강로·피트 작업: 밀폐 또는 협소공간

Tests:
- test_safety_health_ledger_create_success
- test_safety_health_ledger_prevents_duplicate_active_ledger
- test_safety_health_ledger_imports_risks_from_safety_management_plan
- test_ledger_risk_requires_hazard_description
- test_ledger_syncs_inspection_history
- test_ledger_syncs_finding_action_history
- test_ledger_syncs_safety_cost_history
- test_ledger_detects_repeated_risks
- test_ledger_version_created_on_sync
- test_ledger_export_blocked_when_required_missing
- test_ledger_export_uses_latest_saved_snapshot
- test_ledger_export_creates_file_asset
- test_ledger_attachment_links_file_asset
- test_ledger_stale_source_warning_created

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Ledger generation service
- Risk import service
- History sync service
- Recurrence detection service
- Export service adapter placeholder
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```


---

## FILE: `docs/aec-erp/09-safety-health-ledger/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 안전보건대장 자동화

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "안전보건대장 자동화" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 프로젝트 전체 기간 동안 안전보건대장을 생성하고 관리하는 ERP
- 안전보건대장은 회차별 결과보고서가 아니라 프로젝트 전체의 위험요인, 감소대책, 점검이력, 지적사항, 조치이력, 산업안전보건관리비, 첨부자료를 누적하는 장기 대장
- 안전관리계획서의 계획 데이터와 현장점검/보고서의 실행 데이터를 연결한다.

화면 1: 안전보건대장 목록
- 좌측 ERP 사이드바
- 상단 프로젝트 요약 헤더
- 중앙 대장 목록 table
- 요약 카드:
  - 위험요인 수
  - 반복 위험요인 수
  - 미조치 지적사항 수
  - 반영된 점검회차 수
  - 최근 안전관리비 기준월
- 버튼:
  - 안전보건대장 생성
  - 안전관리계획서에서 생성
  - 최신 이력 동기화

화면 2: 대장 생성 마법사
- Step 1 프로젝트 확인
- Step 2 템플릿 선택
- Step 3 안전관리계획서 연결
- Step 4 위험요인 가져오기
- Step 5 점검/지적/안전관리비 데이터 연결
- Step 6 누락정보 확인
- Step 7 초안 생성
- 각 단계는 완료/주의/누락 badge를 표시한다.

화면 3: 대장 편집 workspace
- 상단 sticky header:
  - 대장명
  - 프로젝트명
  - 상태 badge
  - 저장
  - 이력 동기화
  - 검토요청
  - export
- 3-column layout:
  - 좌측 section navigation
  - 중앙 editor
  - 우측 review warning/source link panel
- section navigation:
  - 기본정보
  - 공사개요
  - 관계자
  - 주요 유해·위험요인
  - 위험성 감소대책
  - 설계/계획 단계 검토사항
  - 시공 단계 확인사항
  - 점검 이력
  - 지적사항 이력
  - 조치 완료 이력
  - 산업안전보건관리비 이력
  - 첨부문서
  - 개정 이력

화면 4: 위험요인 Register
- 공종/작업내용/유해·위험요인/위험도/감소대책/책임조직/반복여부/상태 table
- 위험도는 low/medium/high/critical badge로 표시
- 반복 위험요인은 붉은 outline badge로 표시
- source link를 클릭하면 안전관리계획서, 체크리스트, 지적사항으로 이동한다.
- 필터:
  - 반복 위험요인
  - 미조치
  - 고위험
  - 공종
  - 책임조직

화면 5: 점검이력 / 지적조치 이력
- 점검이력은 회차별 timeline + table로 표시
- 지적조치 이력은 지적사항, 조치상태, 확인일, 사진, 반복여부를 table로 표시
- 미조치 항목은 빨간색으로 강조
- verified 조치는 초록색으로 표시

화면 6: A4 미리보기 및 Export
- 실제 대장 문서처럼 흰색 A4 preview 제공
- 섹션별 페이지 이동
- 표 넘침 경고
- export 전 체크리스트:
  - 필수 누락정보
  - 반복 위험요인
  - 미조치 지적사항
  - 증빙 누락
  - 원본 변경
  - 웹하드 저장 위치
- PDF/HWPX export 버튼

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- 배경은 밝은 회색
- register와 history는 정보 밀도 높은 table 중심
- A4 preview는 흰색 paper 형태
- 반복 위험요인은 주황/빨강으로 강조
- verified/closed는 초록색
- review는 보라색
- draft는 회색
- source link는 파란색 link badge로 표시
- 한글 가독성을 최우선으로 한다.

결과물:
- 안전보건대장 목록 화면
- 대장 생성 마법사 화면
- 대장 편집 workspace
- 위험요인 register 화면
- 점검이력 화면
- 지적/조치 이력 화면
- 산업안전보건관리비 이력 화면
- A4 미리보기/export 화면
```


---

## FILE: `docs/aec-erp/09-safety-health-ledger/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 안전보건대장 자동화

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
안전보건대장 자동화

기능 설명:
안전보건대장 자동화는 프로젝트 전체 기간 동안 유해·위험요인, 위험성 감소대책, 점검 이력, 지적사항 이력, 조치 완료 이력, 산업안전보건관리비 확인 이력, 첨부문서를 누적 관리하고 대장 문서로 export하는 기능이다.

업무 맥락:
- 안전보건대장은 Project에 속한다.
- 회차별 이행확인 보고서와 달리 프로젝트 전체 누적 대장이다.
- 안전관리계획서의 공종별 위험요인과 감소대책을 초기 데이터로 가져올 수 있다.
- 점검회차, 체크리스트, 지적사항, 조치현황, 산업안전보건관리비를 누적 이력으로 반영한다.
- 같은 위험요인이 반복되면 반복/재발 위험요인으로 표시한다.
- 조치 완료 이력은 verified CorrectiveAction만 완료로 표현한다.
- export는 최신 저장 snapshot 기준으로 수행한다.
- export 파일은 FileAsset과 웹하드 위치를 가져야 한다.

입력:
{
  "featureName": "안전보건대장 자동화",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `safety_health_ledger.automation`으로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 안전관리계획서
    - 점검회차/일정
    - 현장점검 체크리스트
    - 지적사항/조치현황
    - 사진대지
    - 산업안전보건관리비
    - 이행확인 보고서
    - 웹하드
    - 결재/제출
    - 관리자/템플릿

출력 JSON:
{
  "featureId": "safety_health_ledger.automation",
  "featureName": "안전보건대장 자동화",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /projects/[projectId]/safety-health-ledgers
- /projects/[projectId]/safety-health-ledgers/new
- /safety-health-ledgers/[ledgerId]
- /safety-health-ledgers/[ledgerId]/edit
- /safety-health-ledgers/[ledgerId]/risks
- /safety-health-ledgers/[ledgerId]/measures
- /safety-health-ledgers/[ledgerId]/inspections
- /safety-health-ledgers/[ledgerId]/findings
- /safety-health-ledgers/[ledgerId]/safety-costs
- /safety-health-ledgers/[ledgerId]/attachments
- /safety-health-ledgers/[ledgerId]/preview
- /safety-health-ledgers/[ledgerId]/export
- /safety-health-ledgers/[ledgerId]/versions

반드시 포함할 models:
- SafetyHealthLedger
- SafetyHealthLedgerSnapshot
- LedgerMeta
- SafetyHealthLedgerSection
- LedgerRiskItem
- LedgerRiskReductionMeasure
- LedgerInspectionHistory
- LedgerFindingHistory
- LedgerSafetyCostHistory
- LedgerAttachment
- SafetyHealthLedgerVersion
- LedgerMissingField
- LedgerReviewWarning
- LedgerSourceLink
- Project
- SafetyManagementPlan
- InspectionRound
- ChecklistSession
- Finding
- CorrectiveAction
- SafetyCostUsage
- FileAsset
- AuditLog

반드시 포함할 prompts:
- safety-health-ledger-generation
- safety-health-ledger implementation prompt
- safety-health-ledger design prompt

반드시 포함할 tests:
- test_safety_health_ledger_create_success
- test_safety_health_ledger_prevents_duplicate_active_ledger
- test_safety_health_ledger_imports_risks_from_safety_management_plan
- test_ledger_risk_requires_hazard_description
- test_ledger_syncs_inspection_history
- test_ledger_syncs_finding_action_history
- test_ledger_syncs_safety_cost_history
- test_ledger_detects_repeated_risks
- test_ledger_version_created_on_sync
- test_ledger_export_blocked_when_required_missing
- test_ledger_export_uses_latest_saved_snapshot
- test_ledger_export_creates_file_asset
- test_ledger_attachment_links_file_asset
- test_ledger_stale_source_warning_created

주의:
- 안전보건대장은 회차별 보고서가 아니라 프로젝트 단위 누적 대장이다.
- projectId 없이 생성될 수 없다.
- 원본 데이터와 연결되는 항목은 sourceLinks를 유지해야 한다.
- 조치가 verified되지 않은 항목을 완료로 표현하지 않는다.
- 반복 위험요인 탐지는 사용자를 위한 경고이며 임의로 위험을 확정하지 않는다.
- AI 초안은 draft 상태로만 저장한다.
- export는 최신 저장 snapshot 기준이어야 한다.
```


---

## FILE: `docs/aec-erp/10-webhard/README.md`

# 기능 10 — 웹하드

이 폴더는 A&C 기술사 ERP의 열 번째 기능인 `웹하드` 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

웹하드는 A&C 기술사 ERP 안에서 프로젝트별 계약서, 발주처 제공자료, 시공사 제출자료, 공사개요/공정표, 현장점검 자료, 현장사진, 보고서 초안, 검토본, 최종본, 제출본을 관리하는 full-screen 파일관리자 모듈이다.

기존 apps의 웹하드처럼 **폴더 트리 + 파일 리스트/그리드 + 우측 상세 패널 + 공유 링크** 구조를 사용하되, ERP의 프로젝트·점검회차·문서·메일·제출 이력과 강하게 연결한다.

```text
Project
→ Folder
→ FileAsset
→ FileVersion
→ ShareLink
→ FileActivity
→ DocumentInstance / InspectionRound / Finding / MailMessage / Submission
```

## 핵심 설계 포인트

- 웹하드는 단순 파일 저장소가 아니라 ERP 산출물 보관소다.
- 모든 파일은 가능하면 `projectId`를 가진다.
- 파일은 폴더 안에 저장되지만, 문서·점검·지적사항·메일·제출 이력에도 연결될 수 있다.
- 보고서 export 결과는 자동으로 `/프로젝트명/08_최종본`에 저장된다.
- 메일 첨부파일은 사용자가 선택한 웹하드 폴더에 저장하고, 원본 메일과 연결한다.
- 사진 파일은 원본과 보고서용 압축/마크업 정보를 분리한다.
- 공유 링크는 만료일, 권한, 접근 로그, 폐기 기능을 가진다.
- 파일 삭제는 실제 삭제보다 보관/휴지통/감사로그를 우선한다.


---

## FILE: `docs/aec-erp/10-webhard/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 웹하드

## 1. 기능 정의

웹하드는 A&C 기술사 ERP에서 프로젝트별 파일, 문서, 사진, 메일 첨부, 보고서 최종본, 날인본, 공유 링크를 통합 관리하는 파일관리 기능이다.

이 기능은 기존 apps의 웹하드 full-screen 자료함 경험을 ERP 안으로 가져오되, 단순 파일 저장소가 아니라 다음 업무와 연결된 **프로젝트 산출물 저장소**로 동작한다.

```text
프로젝트/현장 원장
계약/견적
점검회차/일정
현장점검 체크리스트
지적사항/조치현황/사진대지
산업안전보건관리비
안전관리계획서
안전보건대장
공사안전보건대장 이행확인 보고서
메일함
결재/제출
```

## 2. 이 기능이 필요한 이유

A&C 업무에서는 파일이 여러 경로로 계속 생성된다.

- 계약서 원본, 최종본, 날인본
- 발주처 제공자료
- 시공사 제출자료
- 공사개요, 공정표, 공사일정 첨부
- 현장점검 사진
- 지적사항 사진
- 조치현황 사진
- 산업안전보건관리비 사용내역서 및 증빙
- 안전관리계획서 초안/검토본/최종본
- 안전보건대장 초안/검토본/최종본
- 공사안전보건대장 이행확인 보고서 발주처별 제출본
- 메일 첨부파일

이 파일들이 단순 다운로드 폴더나 개인 PC에 흩어지면 다음 문제가 생긴다.

- 최종본과 초안이 혼동된다.
- 발주처별 제출본을 찾기 어렵다.
- 메일 첨부파일과 ERP 데이터가 분리된다.
- 사진대지에 사용한 사진 원본을 추적하기 어렵다.
- 계약서 날인본, 보고서 제출본, 증빙파일의 버전 이력이 사라진다.
- 공유 링크를 누가 언제 열었는지 알 수 없다.

따라서 웹하드는 프로젝트의 모든 산출물을 구조적으로 보관하고, 문서/메일/제출 이력과 연결해야 한다.

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 대표/기술사 | 최종본, 날인본, 제출본, 주요 증빙 확인 |
| 점검 담당자 | 현장사진, 지적사진, 조치사진 업로드 및 조회 |
| 문서 작성자 | 보고서 초안/검토본/최종본 관리, 사진/첨부 연결 |
| 계약/행정 담당자 | 계약서, 견적서, 날인본, 제출 메일 첨부파일 관리 |
| 관리자 | 폴더 정책, 공유 링크 정책, 삭제/보관 정책 관리 |
| 외부 수신자 | 공유 링크로 파일 열람 또는 다운로드 |

## 4. 기본 폴더 구조

프로젝트 생성 시 기본 폴더를 자동 생성한다.

```text
/프로젝트명
├── 00_계약_견적
├── 01_발주처_제공자료
├── 02_시공사_제출자료
├── 03_공사개요_공정표
├── 04_현장점검
│   ├── 제1회
│   ├── 제2회
│   └── ...
├── 05_현장사진
│   ├── 원본
│   ├── 지적사항
│   └── 조치현황
├── 06_보고서_초안
├── 07_검토본
├── 08_최종본
├── 09_메일첨부
└── 99_기타
```

## 5. 핵심 기능

### 5.1 프로젝트 폴더 자동 생성

프로젝트 생성 시 표준 폴더 트리를 자동 생성한다.

생성 기준:

- projectId
- projectName
- ownerParty 목록
- inspectionRound 목록
- folderPolicy

폴더명은 사용자가 바꿀 수 있지만, 내부 연결은 `folderId`와 `projectId` 기준으로 유지한다.

### 5.2 파일 업로드

지원 업로드 방식:

- drag & drop
- 파일 선택
- 폴더 업로드 optional
- 메일 첨부 저장
- 문서 export 자동 저장
- 사진 촬영/업로드
- 외부 링크 등록
- 메모 파일 생성

업로드 시 사용자가 선택하거나 시스템이 추정하는 값:

- 프로젝트
- 폴더
- 태그
- 연결 대상
- 파일 상태
- 발주처
- 점검회차
- 문서
- 지적사항
- 제출 이력

### 5.3 파일 분류/태깅

기본 태그:

```text
contract
estimate
signed
owner_material
contractor_material
schedule
site_photo
finding_photo
action_photo
checklist
safety_cost
draft_report
review_report
final_report
submitted
mail_attachment
photo_ledger
safety_management_plan
safety_health_ledger
other
```

자동 분류 예시:

| 파일명/상황 | 추천 폴더 | 추천 태그 |
|---|---|---|
| 계약서, 견적서 | 00_계약_견적 | contract, estimate |
| 날인본 | 00_계약_견적 | signed |
| 공정표, 공사일정 | 03_공사개요_공정표 | schedule |
| 현장사진 | 05_현장사진/원본 | site_photo |
| 지적사진 | 05_현장사진/지적사항 | finding_photo |
| 조치사진 | 05_현장사진/조치현황 | action_photo |
| 사용내역서 | 02_시공사_제출자료 또는 07_검토본 | safety_cost |
| 보고서 초안 | 06_보고서_초안 | draft_report |
| 검토본 | 07_검토본 | review_report |
| 최종본 | 08_최종본 | final_report |
| 메일 첨부 저장 | 09_메일첨부 | mail_attachment |

### 5.4 파일 상세 패널

우측 상세 패널에는 다음을 표시한다.

- 파일명
- 확장자
- 크기
- 업로드자
- 업로드일
- 버전
- 폴더 위치
- 태그
- 연결 프로젝트
- 연결 점검회차
- 연결 문서
- 연결 지적사항
- 연결 메일
- 연결 제출 이력
- 공유 링크
- 활동 이력

### 5.5 버전 관리

같은 파일 또는 같은 문서의 버전을 관리한다.

버전 유형:

```text
original
working
review
final
signed
submitted
archived
```

예시:

```text
계약서_v1_초안.hwp
계약서_v2_검토본.hwp
계약서_v3_최종본.pdf
계약서_v4_날인본.pdf
```

### 5.6 공유 링크

공유 링크 기능:

- 단일 파일 공유
- 폴더 공유
- 읽기 전용
- 다운로드 허용/차단
- 만료일 설정
- 비밀번호 optional
- 링크 폐기
- 접근 로그

공유 링크는 발주처/시공사에 자료를 전달하거나, 보고서 최종본을 확인하게 할 때 사용할 수 있다.

### 5.7 메일 첨부파일 저장

메일함에서 첨부파일 저장 시 웹하드로 이동한다.

흐름:

```text
메일 선택
→ 첨부파일 선택
→ 프로젝트 선택
→ 폴더 추천
→ 태그 추천
→ 저장
→ FileAsset 생성
→ MailMessage와 연결
```

### 5.8 문서 export 자동 저장

보고서/계약서/대장 export 시 웹하드에 자동 저장한다.

| 문서 | 저장 폴더 |
|---|---|
| 계약서 최종본/날인본 | 00_계약_견적 |
| 공사안전보건대장 이행확인 보고서 초안 | 06_보고서_초안 |
| 공사안전보건대장 이행확인 보고서 검토본 | 07_검토본 |
| 공사안전보건대장 이행확인 보고서 최종본 | 08_최종본 |
| 안전관리계획서 | 08_최종본 또는 별도 문서 폴더 |
| 안전보건대장 | 08_최종본 또는 별도 문서 폴더 |

### 5.9 사진 원본/마크업 분리

사진은 원본 파일을 보존한다. 마크업은 원본을 수정하지 않고 별도 메타데이터로 저장한다.

```text
FileAsset: 원본 사진
EvidencePhoto.markupInfo: 타원/화살표/텍스트 등 마크업
Generated Preview: 보고서용 렌더링 이미지
```

### 5.10 삭제/보관/복구

삭제 정책:

- 일반 사용자는 휴지통 이동만 가능
- 관리자만 영구 삭제 가능
- 제출본/최종본/날인본은 삭제 제한
- 삭제/복구/영구삭제는 AuditLog 기록

## 6. 파일 상태

| 상태 | 의미 |
|---|---|
| active | 정상 파일 |
| archived | 보관 파일 |
| deleted | 휴지통 |
| locked | 제출본/최종본 등 잠금 |
| processing | 업로드/미리보기 생성중 |
| failed | 업로드 또는 변환 실패 |

## 7. 완료 기준

- 프로젝트 생성 시 기본 폴더가 자동 생성된다.
- 프로젝트별 폴더 트리와 파일 리스트를 볼 수 있다.
- 파일을 업로드하고 태그/연결 대상을 지정할 수 있다.
- 문서 export 파일이 자동으로 올바른 폴더에 저장된다.
- 메일 첨부파일을 웹하드에 저장할 수 있다.
- 파일 버전을 관리할 수 있다.
- 파일 상세에서 관련 문서/점검/메일/제출 이력을 확인할 수 있다.
- 공유 링크를 생성/폐기할 수 있다.
- 최종본/날인본/제출본 삭제를 제한할 수 있다.


---

## FILE: `docs/aec-erp/10-webhard/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 웹하드

## 1. Frontend Routes

```text
/webhard
/webhard/projects/[projectId]
/webhard/projects/[projectId]/folders/[folderId]
/webhard/recent
/webhard/shared
/webhard/trash
/webhard/search
/files/[fileId]
/files/[fileId]/versions
/files/[fileId]/activity
/share/[token]
```

## 2. Frontend Components

```text
WebhardShell
WebhardCommandBar
WebhardLeftRail
ProjectFolderTree
FolderBreadcrumb
FileList
FileGrid
FileRow
FileCard
FilePreviewPanel
FileDetailPanel
FileTagEditor
FileLinkTargetPanel
FileVersionPanel
FileActivityTimeline
UploadDropzone
UploadQueue
NewFolderModal
RenameModal
MoveCopyModal
ShareLinkModal
ShareLinkList
PublicShareView
TrashTable
StorageUsageCard
FileClassificationSuggestionPanel
MailAttachmentSavePanel
```

## 3. Backend APIs

### Folders

```text
GET    /api/v1/folders
POST   /api/v1/folders
GET    /api/v1/folders/{folderId}
PATCH  /api/v1/folders/{folderId}
DELETE /api/v1/folders/{folderId}
POST   /api/v1/projects/{projectId}/folders/bootstrap
POST   /api/v1/folders/{folderId}/move
GET    /api/v1/projects/{projectId}/folder-tree
```

### Files

```text
GET    /api/v1/files
POST   /api/v1/files/upload
GET    /api/v1/files/{fileId}
PATCH  /api/v1/files/{fileId}
DELETE /api/v1/files/{fileId}
POST   /api/v1/files/{fileId}/restore
POST   /api/v1/files/{fileId}/archive
POST   /api/v1/files/{fileId}/lock
POST   /api/v1/files/{fileId}/unlock
POST   /api/v1/files/{fileId}/move
POST   /api/v1/files/{fileId}/copy
GET    /api/v1/files/{fileId}/download
GET    /api/v1/files/{fileId}/preview
POST   /api/v1/files/bulk-action
```

### Versions

```text
GET  /api/v1/files/{fileId}/versions
POST /api/v1/files/{fileId}/versions
GET  /api/v1/file-versions/{versionId}/download
POST /api/v1/file-versions/{versionId}/restore-as-current
```

### Share Links

```text
GET    /api/v1/share-links
POST   /api/v1/share-links
GET    /api/v1/share-links/{shareLinkId}
PATCH  /api/v1/share-links/{shareLinkId}
DELETE /api/v1/share-links/{shareLinkId}
POST   /api/v1/share-links/{shareLinkId}/revoke
GET    /api/v1/public/share/{token}
GET    /api/v1/public/share/{token}/download
```

### Linking

```text
GET  /api/v1/files/{fileId}/links
POST /api/v1/files/{fileId}/links
DELETE /api/v1/files/{fileId}/links/{linkId}
POST /api/v1/files/{fileId}/classify
POST /api/v1/files/{fileId}/apply-classification
```

### Mail Attachment Save

```text
POST /api/v1/mail/messages/{messageId}/attachments/save-to-webhard
GET  /api/v1/mail/messages/{messageId}/attachments/save-suggestions
```

### Activities and Search

```text
GET /api/v1/files/{fileId}/activities
GET /api/v1/webhard/activities
GET /api/v1/webhard/search
GET /api/v1/webhard/storage-usage
```

## 4. Data Models

### Folder

```ts
type FolderType =
  | 'project_root'
  | 'contract'
  | 'owner_material'
  | 'contractor_material'
  | 'schedule'
  | 'inspection'
  | 'site_photo'
  | 'draft_report'
  | 'review_report'
  | 'final_report'
  | 'mail_attachment'
  | 'trash'
  | 'custom'

type Folder = {
  id: string
  projectId?: string
  parentFolderId?: string
  name: string
  type: FolderType
  path: string
  displayOrder: number
  isSystem: boolean
  isArchived: boolean
  createdBy?: string
  createdAt: string
  updatedAt: string
}
```

### FileAsset

```ts
type FileAssetStatus =
  | 'active'
  | 'archived'
  | 'deleted'
  | 'locked'
  | 'processing'
  | 'failed'

type FileSource =
  | 'upload'
  | 'mail_attachment'
  | 'generated_document'
  | 'photo_capture'
  | 'external_link'
  | 'system'

type FileAsset = {
  id: string
  projectId?: string
  folderId: string
  ownerPartyId?: string
  inspectionRoundId?: string
  fileName: string
  originalFileName: string
  extension: string
  mimeType: string
  sizeBytes: number
  storageKey: string
  checksum?: string
  source: FileSource
  status: FileAssetStatus
  tags: string[]
  linkedEntityType?: string
  linkedEntityId?: string
  currentVersionId?: string
  previewStatus: 'none' | 'processing' | 'ready' | 'failed'
  uploadedBy?: string
  createdAt: string
  updatedAt: string
}
```

### FileVersion

```ts
type FileVersionKind =
  | 'original'
  | 'working'
  | 'review'
  | 'final'
  | 'signed'
  | 'submitted'
  | 'archived'

type FileVersion = {
  id: string
  fileId: string
  versionNo: number
  versionKind: FileVersionKind
  fileName: string
  storageKey: string
  sizeBytes: number
  checksum?: string
  changeSummary?: string
  createdBy?: string
  createdAt: string
}
```

### FileEntityLink

```ts
type FileEntityLink = {
  id: string
  fileId: string
  projectId?: string
  entityType:
    | 'project'
    | 'contract'
    | 'inspection_round'
    | 'checklist_session'
    | 'finding'
    | 'corrective_action'
    | 'evidence_photo'
    | 'document_instance'
    | 'safety_cost_usage'
    | 'mail_message'
    | 'submission'
    | 'approval'
  entityId: string
  relationType:
    | 'source'
    | 'attachment'
    | 'exported_file'
    | 'evidence'
    | 'photo'
    | 'final_output'
    | 'signed_copy'
  createdAt: string
}
```

### ShareLink

```ts
type ShareLinkPermission = 'view' | 'download' | 'view_and_download'

type ShareLink = {
  id: string
  fileId?: string
  folderId?: string
  projectId?: string
  tokenHash: string
  title?: string
  permission: ShareLinkPermission
  expiresAt?: string
  passwordHash?: string
  isRevoked: boolean
  createdBy?: string
  createdAt: string
  revokedAt?: string
}
```

### ShareLinkAccessLog

```ts
type ShareLinkAccessLog = {
  id: string
  shareLinkId: string
  accessedAt: string
  ipHash?: string
  userAgent?: string
  action: 'view' | 'download' | 'denied' | 'expired'
}
```

### FileActivity

```ts
type FileActivity = {
  id: string
  fileId?: string
  folderId?: string
  projectId?: string
  activityType:
    | 'uploaded'
    | 'downloaded'
    | 'previewed'
    | 'renamed'
    | 'moved'
    | 'copied'
    | 'tagged'
    | 'linked'
    | 'unlinked'
    | 'version_added'
    | 'shared'
    | 'share_revoked'
    | 'archived'
    | 'deleted'
    | 'restored'
    | 'locked'
  actorId?: string
  message: string
  metadata?: Record<string, unknown>
  createdAt: string
}
```

### FileClassificationSuggestion

```ts
type FileClassificationSuggestion = {
  fileId?: string
  fileName: string
  recommendedProjectId?: string
  recommendedFolderId?: string
  recommendedTags: string[]
  linkedEntityType?: string
  linkedEntityId?: string
  confidence: number
  reasons: string[]
  needsUserConfirmation: boolean
}
```

## 5. Validation Rules

### Folder

- system folder는 일반 사용자가 삭제할 수 없다.
- project folder는 projectId를 가져야 한다.
- 같은 parentFolderId 안에서 folder name 중복은 경고한다.
- 프로젝트명 변경은 folder path display만 갱신하고 내부 연결키는 projectId를 유지한다.

### FileAsset

- folderId는 필수다.
- fileName은 필수다.
- sizeBytes는 0보다 커야 한다.
- locked 파일은 삭제/이동/이름변경을 제한한다.
- final_report, submitted, signed 태그가 있는 파일은 삭제 제한 대상이다.
- generated_document는 linkedEntityType=document_instance를 권장한다.
- mail_attachment는 linkedEntityType=mail_message를 권장한다.
- finding_photo/action_photo는 inspectionRoundId와 findingId 연결을 권장한다.

### ShareLink

- fileId 또는 folderId 중 하나는 필수다.
- expiresAt이 과거이면 접근할 수 없다.
- isRevoked=true이면 접근할 수 없다.
- 공개 링크 다운로드는 permission에 따라 제한한다.
- 접근 시 ShareLinkAccessLog를 기록한다.

## 6. Service Rules

### Project Folder Bootstrap

```text
1. Project 조회
2. project_root Folder 생성
3. 표준 하위 폴더 생성
4. 기존 InspectionRound가 있으면 04_현장점검/제N회 폴더 생성
5. AuditLog 기록
```

### Upload Flow

```text
1. upload request 수신
2. folder/project 권한 확인
3. storage adapter에 파일 저장
4. FileAsset 생성
5. FileVersion v1 생성
6. classification suggestion 생성
7. linkedEntity가 있으면 FileEntityLink 생성
8. FileActivity 기록
9. preview job 생성 optional
```

### Generated Document Save

```text
1. Document export service에서 file stream 수신
2. documentType/status 기준 target folder 결정
3. FileAsset source=generated_document 생성
4. FileEntityLink(document_instance, exported_file) 생성
5. DocumentInstance.exportedFileId 업데이트
6. FileActivity 기록
```

### Mail Attachment Save

```text
1. MailMessage와 attachment 확인
2. project/folder suggestion 생성
3. 사용자 확인
4. storage adapter에 저장
5. FileAsset source=mail_attachment 생성
6. FileEntityLink(mail_message, attachment) 생성
7. MailMessage.savedAttachmentIds 업데이트
8. FileActivity 기록
```

### Share Link Create

```text
1. file/folder 권한 확인
2. random token 생성
3. token hash 저장
4. ShareLink 생성
5. FileActivity shared 기록
6. 사용자에게 public URL 반환
```

## 7. Folder Policy

| Source | Target Folder |
|---|---|
| contract final/signed | 00_계약_견적 |
| owner material | 01_발주처_제공자료 |
| contractor material | 02_시공사_제출자료 |
| schedule attachment | 03_공사개요_공정표 |
| inspection material | 04_현장점검/제N회 |
| site photo original | 05_현장사진/원본 |
| finding photo | 05_현장사진/지적사항 |
| action photo | 05_현장사진/조치현황 |
| draft report | 06_보고서_초안 |
| review report | 07_검토본 |
| final/submitted report | 08_최종본 |
| mail attachment | 09_메일첨부 |
| unknown | 99_기타 |

## 8. Tests

```text
test_project_folder_bootstrap_creates_default_tree
test_folder_system_folder_delete_blocked
test_file_upload_creates_asset_and_version
test_file_upload_records_activity
test_file_classification_contract_folder
test_file_classification_site_photo_folder
test_generated_document_saved_to_final_folder
test_mail_attachment_save_links_mail_message
test_file_version_add_success
test_file_move_updates_folder
test_locked_file_cannot_be_deleted
test_final_report_delete_blocked
test_share_link_create_success
test_share_link_revoke_blocks_access
test_share_link_expired_blocks_access
test_share_link_access_log_created
test_file_entity_link_document_instance
test_webhard_search_by_tag_and_project
test_trash_restore_file
```


---

## FILE: `docs/aec-erp/10-webhard/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 웹하드

## 1. 화면 목표

웹하드 화면은 A&C ERP 안에서 프로젝트 파일을 빠르게 찾고, 업로드하고, 연결하고, 공유할 수 있는 full-screen 파일관리자다.

일반 ERP 탭처럼 좁게 넣지 않고, 기존 apps 웹하드 경험처럼 넓은 화면을 사용한다.

핵심 목표:

- 프로젝트별 폴더 구조를 명확하게 보여준다.
- 파일 목록과 우측 상세 패널을 동시에 보여준다.
- 업로드/새 폴더/공유 링크/버전관리를 빠르게 수행한다.
- 문서·점검·지적사항·메일·제출 이력과 연결된 파일임을 표시한다.
- 최종본/날인본/제출본을 초안과 혼동하지 않게 만든다.

## 2. 화면 목록

### 2.1 웹하드 홈

Route:

```text
/webhard
```

구성:

- 좌측 full-screen webhard rail
- 최근 파일
- 프로젝트별 폴더
- 공유된 파일
- 중요 파일
- 휴지통
- 저장공간 요약

### 2.2 프로젝트 웹하드

Route:

```text
/webhard/projects/[projectId]
```

Layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Command Bar: Upload / New Folder / New Memo / Share / Search │
├──────────────┬──────────────────────┬────────────────────────┤
│ Left Rail    │ Folder Tree          │ File List/Grid         │
│              │                      │ + Right Detail Panel   │
└──────────────┴──────────────────────┴────────────────────────┘
```

### 2.3 폴더 상세

Route:

```text
/webhard/projects/[projectId]/folders/[folderId]
```

표시:

- breadcrumb
- 정렬/필터
- list/grid toggle
- 파일 목록
- 선택 파일 상세
- 업로드 queue

### 2.4 파일 상세

Route:

```text
/files/[fileId]
```

탭:

```text
미리보기
상세정보
연결정보
버전
공유
활동이력
```

### 2.5 공유 링크 공개 화면

Route:

```text
/share/[token]
```

표시:

- 파일명 또는 폴더명
- 공유자
- 만료일
- 미리보기
- 다운로드 버튼
- 비밀번호 입력 optional
- 만료/폐기 상태 안내

## 3. UX 규칙

1. 웹하드는 full-screen shell을 사용한다.
2. 좌측에는 자료함/최근/공유/휴지통을 표시한다.
3. 프로젝트 폴더 트리는 두 번째 column에 표시한다.
4. 파일 리스트와 우측 상세 패널을 동시에 보여준다.
5. 파일을 선택하면 우측 패널에서 연결 문서, 점검회차, 메일, 제출 이력을 확인한다.
6. 최종본, 제출본, 날인본에는 강한 badge와 lock icon을 표시한다.
7. drag & drop 업로드 영역은 현재 폴더를 기준으로 동작한다.
8. 업로드 후 AI 분류 추천을 보여주되 사용자가 확정하게 한다.
9. 공유 링크 생성 시 만료일과 다운로드 권한을 명확히 설정하게 한다.
10. 삭제는 즉시 영구 삭제가 아니라 휴지통 이동이 기본이다.

## 4. 핵심 컴포넌트

### WebhardShell

- full-screen layout
- ERP topbar와 구분되는 command bar
- 파일 작업에 최적화된 넓은 화면

### WebhardCommandBar

버튼:

- 업로드
- 새 폴더
- 새 메모
- 링크 등록
- 공유
- 이동
- 복사
- 삭제
- 보기 전환
- 검색

### ProjectFolderTree

기본 폴더:

```text
00_계약_견적
01_발주처_제공자료
02_시공사_제출자료
03_공사개요_공정표
04_현장점검
05_현장사진
06_보고서_초안
07_검토본
08_최종본
09_메일첨부
99_기타
```

### FileList

컬럼:

| 컬럼 | 설명 |
|---|---|
| 이름 | 파일명/폴더명 |
| 태그 | 계약서, 최종본, 메일첨부 등 |
| 연결 | 문서/점검/메일 연결 badge |
| 크기 | 파일 크기 |
| 수정일 | 마지막 수정일 |
| 작성자 | 업로드자 |
| 공유 | 공유 링크 여부 |
| 상태 | active/locked/deleted |

### FileDetailPanel

섹션:

- 미리보기
- 기본정보
- 태그
- 연결 대상
- 버전
- 공유 링크
- 활동 이력

### FileClassificationSuggestionPanel

표시:

- 추천 폴더
- 추천 태그
- 연결 대상 후보
- 신뢰도
- 적용 버튼
- 직접 수정 버튼

### ShareLinkModal

입력:

- 공유 대상 파일/폴더
- 권한: 보기/다운로드
- 만료일
- 비밀번호 optional
- 링크 생성
- 링크 복사
- 폐기

## 5. 상태 표시

### 파일 상태

| 상태 | 색상 | 의미 |
|---|---|---|
| active | blue/neutral | 정상 |
| locked | purple/dark | 최종본/제출본 잠금 |
| archived | gray | 보관 |
| deleted | red/gray | 휴지통 |
| processing | blue | 처리중 |
| failed | red | 실패 |

### 태그 badge

- 계약서: blue
- 날인본: green
- 초안: gray
- 검토본: purple
- 최종본: green
- 제출본: teal
- 메일첨부: orange
- 지적사진: red outline
- 조치사진: green outline

## 6. Empty State

### 프로젝트 폴더가 없을 때

```text
이 프로젝트의 웹하드 폴더가 아직 생성되지 않았습니다.
표준 폴더 구조를 생성하세요.
```

버튼:

- 표준 폴더 생성

### 파일이 없을 때

```text
이 폴더에 파일이 없습니다.
파일을 업로드하거나 메일 첨부파일을 저장하세요.
```

버튼:

- 파일 업로드
- 메일 첨부 가져오기

## 7. Warning State

### 삭제 제한

```text
이 파일은 최종본 또는 제출본으로 연결되어 있어 삭제할 수 없습니다.
관리자 권한으로 보관 처리하거나 새 버전을 업로드하세요.
```

### 공유 링크 만료

```text
이 공유 링크는 만료되었습니다.
새 공유 링크를 생성하세요.
```

### 분류 확신 낮음

```text
파일 유형을 확정하기 어렵습니다.
추천 폴더와 태그를 확인한 뒤 저장하세요.
```

## 8. Responsive

### Desktop

- full-screen 3~4 column layout
- folder tree + file list + detail panel
- drag & drop upload

### Tablet

- folder tree drawer
- detail panel slide-over

### Mobile

- 파일 목록 중심
- 폴더 트리 접기
- 상세는 별도 화면
- 대량 업로드/버전관리는 제한적으로 제공


---

## FILE: `docs/aec-erp/10-webhard/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 웹하드

## 1. Feature

```yaml
featureId: webhard.file_management
featureName: 웹하드
priority: P0.5
module: webhard
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 웹하드 홈 | `/webhard` | 최근 파일, 프로젝트 폴더, 공유 파일 |
| 프로젝트 웹하드 | `/webhard/projects/[projectId]` | 프로젝트 폴더 트리와 파일 관리 |
| 폴더 상세 | `/webhard/projects/[projectId]/folders/[folderId]` | 특정 폴더 파일 목록 |
| 최근 파일 | `/webhard/recent` | 최근 업로드/수정 파일 |
| 공유 파일 | `/webhard/shared` | 공유 링크가 있는 파일 |
| 휴지통 | `/webhard/trash` | 삭제 파일 복구/영구삭제 |
| 검색 | `/webhard/search` | 파일 검색 |
| 파일 상세 | `/files/[fileId]` | 파일 미리보기/상세/연결 |
| 파일 버전 | `/files/[fileId]/versions` | 버전 목록/복원 |
| 파일 활동 | `/files/[fileId]/activity` | 활동 이력 |
| 공개 공유 링크 | `/share/[token]` | 외부 공유 보기 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/webhard` | WebhardShell, WebhardLeftRail, StorageUsageCard |
| `/webhard/projects/[projectId]` | ProjectFolderTree, FileList, FileGrid, FileDetailPanel |
| `/webhard/projects/[projectId]/folders/[folderId]` | FolderBreadcrumb, FileList, UploadDropzone |
| `/files/[fileId]` | FilePreviewPanel, FileDetailPanel, FileTagEditor, FileLinkTargetPanel |
| `/files/[fileId]/versions` | FileVersionPanel |
| `/files/[fileId]/activity` | FileActivityTimeline |
| `/webhard/shared` | ShareLinkList, ShareLinkModal |
| `/webhard/trash` | TrashTable |
| `/share/[token]` | PublicShareView |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| ProjectFolderTree | GET `/api/v1/projects/{projectId}/folder-tree` |
| WebhardCommandBar | POST `/api/v1/files/upload`, POST `/api/v1/folders` |
| FileList | GET `/api/v1/files` |
| FileGrid | GET `/api/v1/files` |
| FileDetailPanel | GET `/api/v1/files/{fileId}` |
| FilePreviewPanel | GET `/api/v1/files/{fileId}/preview` |
| FileTagEditor | PATCH `/api/v1/files/{fileId}` |
| FileLinkTargetPanel | GET/POST `/api/v1/files/{fileId}/links` |
| FileVersionPanel | GET/POST `/api/v1/files/{fileId}/versions` |
| UploadDropzone | POST `/api/v1/files/upload` |
| FileClassificationSuggestionPanel | POST `/api/v1/files/{fileId}/classify` |
| ShareLinkModal | POST `/api/v1/share-links` |
| ShareLinkList | GET `/api/v1/share-links`, POST `/api/v1/share-links/{id}/revoke` |
| PublicShareView | GET `/api/v1/public/share/{token}` |
| TrashTable | POST `/api/v1/files/{fileId}/restore` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| POST `/projects/{projectId}/folders/bootstrap` | Folder, FileActivity |
| GET `/projects/{projectId}/folder-tree` | Folder |
| POST `/files/upload` | FileAsset, FileVersion, FileActivity |
| GET `/files/{fileId}` | FileAsset, FileVersion, FileEntityLink, ShareLink |
| POST `/files/{fileId}/versions` | FileVersion, FileActivity |
| POST `/files/{fileId}/links` | FileEntityLink, FileActivity |
| POST `/files/{fileId}/classify` | FileClassificationSuggestion |
| POST `/share-links` | ShareLink, FileActivity |
| GET `/public/share/{token}` | ShareLink, ShareLinkAccessLog |
| POST `/mail/messages/{messageId}/attachments/save-to-webhard` | FileAsset, FileEntityLink, MailMessage |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| FileAsset | webhard-file-classification |
| Folder | webhard-file-classification |
| FileEntityLink | webhard-file-classification |
| MailMessage | webhard-file-classification |
| DocumentInstance | webhard-file-classification |
| InspectionRound | webhard-file-classification |
| Finding | webhard-file-classification |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 기본 폴더 생성 | test_project_folder_bootstrap_creates_default_tree |
| 시스템 폴더 삭제 제한 | test_folder_system_folder_delete_blocked |
| 파일 업로드 | test_file_upload_creates_asset_and_version |
| 활동 이력 | test_file_upload_records_activity |
| 계약서 분류 | test_file_classification_contract_folder |
| 현장사진 분류 | test_file_classification_site_photo_folder |
| 문서 export 저장 | test_generated_document_saved_to_final_folder |
| 메일첨부 저장 | test_mail_attachment_save_links_mail_message |
| 버전 추가 | test_file_version_add_success |
| 파일 이동 | test_file_move_updates_folder |
| 잠금 삭제 제한 | test_locked_file_cannot_be_deleted |
| 최종본 삭제 제한 | test_final_report_delete_blocked |
| 공유 링크 생성 | test_share_link_create_success |
| 공유 링크 폐기 | test_share_link_revoke_blocks_access |
| 공유 링크 만료 | test_share_link_expired_blocks_access |
| 접근 로그 | test_share_link_access_log_created |
| 문서 연결 | test_file_entity_link_document_instance |
| 검색 | test_webhard_search_by_tag_and_project |
| 휴지통 복구 | test_trash_restore_file |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, 기본 폴더 생성 |
| 계약/견적 | 계약서/견적서/날인본 FileAsset |
| 점검회차/일정 | 회차별 폴더, 공사일정 첨부 |
| 현장점검 체크리스트 | 체크리스트 사진/첨부 |
| 지적사항/사진대지 | 지적사진, 조치사진, 마크업 원본 |
| 산업안전보건관리비 | 사용내역서, 증빙파일 |
| 안전관리계획서 | 계획서 초안/최종본/첨부 |
| 안전보건대장 | 대장 최종본/첨부/개정본 |
| 이행확인 보고서 | 발주처별 최종본/제출본 |
| 메일함 | 첨부파일 저장, 발송 첨부 선택 |
| 결재/제출 | 최종본, 날인본, 제출 파일 |
| 관리자/템플릿 | 폴더 정책, 파일 태그 정책 |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 프로젝트명 변경으로 폴더 경로 깨짐 | 내부 연결은 projectId/folderId 유지 |
| 최종본/초안 혼동 | versionKind, tags, locked status 분리 |
| 메일 첨부 저장 후 원본 메일 추적 불가 | FileEntityLink(mail_message) 필수 |
| 보고서 export 파일이 웹하드에 누락 | export service에서 FileAsset 생성 필수 |
| 공유 링크 무기한 노출 | 만료일/폐기/접근 로그 제공 |
| 사진 원본 훼손 | 원본 FileAsset과 markupInfo 분리 |
| 시스템 폴더 삭제 | isSystem folder 삭제 제한 |
| 권한 없는 외부 접근 | token hash, expiry, permission 검증 |


---

## FILE: `docs/aec-erp/10-webhard/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 웹하드 파일 분류/연결 추천

## Prompt ID

`webhard-file-classification`

## 목적

파일명, 확장자, 업로드 위치, 메일 첨부 정보, 프로젝트 문맥, 사용자의 설명을 바탕으로 웹하드 저장 폴더, 태그, 연결 대상, 사용자 확인 필요 여부를 추천한다.

## Prompt

```text
너는 A&C 기술사 ERP의 웹하드 파일 분류 엔진이다.

입력:
- fileName
- extension
- mimeType
- fileSize
- uploadContext
- currentFolder
- project
- inspectionRound
- ownerParty
- relatedDocument
- relatedFinding
- mailMessage
- attachmentInfo
- userDescription
- existingFolders
- existingTags

목표:
파일을 가장 적절한 웹하드 폴더에 저장하고, ERP 엔티티와 연결할 수 있도록 분류 추천을 만든다.

해야 할 일:
1. 파일명을 분석하여 파일 유형을 판단한다.
2. 프로젝트가 명확하면 recommendedProjectId를 설정한다.
3. 저장할 폴더를 추천한다.
4. 태그를 추천한다.
5. 연결할 ERP 엔티티가 있으면 linkedEntityType과 linkedEntityId를 추천한다.
6. 발주처별 파일이면 ownerPartyId를 추천한다.
7. 점검회차별 파일이면 inspectionRoundId를 추천한다.
8. 확신이 낮으면 needsUserConfirmation을 true로 둔다.
9. 파일명이 모호하면 후보 폴더를 여러 개 제안한다.
10. 입력에 없는 프로젝트, 발주처, 회차를 임의로 만들지 않는다.

분류 기준:
- 계약서, 견적서, 날인본 → 00_계약_견적
- 발주처 제공자료 → 01_발주처_제공자료
- 시공사 제출자료, 사용내역서 → 02_시공사_제출자료
- 공사개요, 공정표, 공사일정 → 03_공사개요_공정표
- 점검표, 회차 자료 → 04_현장점검/제N회
- 현장사진 원본 → 05_현장사진/원본
- 지적사진 → 05_현장사진/지적사항
- 조치사진 → 05_현장사진/조치현황
- 보고서 초안 → 06_보고서_초안
- 검토본 → 07_검토본
- 최종본, 제출본 → 08_최종본
- 메일 첨부파일 → 09_메일첨부
- 판단 불가 → 99_기타

출력 JSON:
{
  "classification": {
    "fileName": "",
    "detectedFileType": "contract | estimate | signed_contract | owner_material | contractor_material | schedule | site_photo | finding_photo | action_photo | checklist | safety_cost | draft_report | review_report | final_report | submitted_report | mail_attachment | other",
    "recommendedProjectId": null,
    "recommendedFolderId": null,
    "recommendedFolderPath": "",
    "recommendedTags": [],
    "ownerPartyId": null,
    "inspectionRoundId": null,
    "linkedEntityType": null,
    "linkedEntityId": null,
    "confidence": 0.0,
    "needsUserConfirmation": true
  },
  "candidateFolders": [
    {
      "folderId": "",
      "folderPath": "",
      "reason": "",
      "confidence": 0.0
    }
  ],
  "warnings": [
    {
      "type": "ambiguous_project | ambiguous_round | duplicate_file | unknown_type | low_confidence | restricted_file",
      "message": ""
    }
  ],
  "reasons": []
}
```

## 작성 규칙

- 입력에 없는 프로젝트를 생성하지 않는다.
- 파일명만으로 확정할 수 없으면 사용자 확인을 요구한다.
- 최종본/제출본/날인본으로 보이는 파일은 locked 후보로 표시한다.
- 메일 첨부파일은 MailMessage와 연결할 수 있게 추천한다.
- 사진 파일은 업로드 위치와 문맥을 우선한다.
- `제1회`, `1차`, `2026-01` 같은 표현이 있으면 inspectionRound 후보로 표시한다.
- `[삼성문화재단]`, `[삼성생명공익재단]` 같은 표현이 있으면 ownerParty 후보로 표시한다.

## Few-shot 기준

입력 예시 1:

```json
{
  "fileName": "[삼성문화재단] 제1회(2026.1.23.) 공사안전보건대장 이행점검 결과보고서 1부.pdf",
  "project": { "projectName": "리움미술관 승강기 교체공사" }
}
```

출력 방향:

```text
detectedFileType: final_report 또는 submitted_report
recommendedFolderPath: /프로젝트명/08_최종본
recommendedTags: final_report, submitted, safety_health_ledger_report
ownerPartyId: 삼성문화재단 후보
inspectionRoundId: 제1회 후보
linkedEntityType: document_instance 후보
needsUserConfirmation: true 또는 false depending context
```

입력 예시 2:

```json
{
  "fileName": "9. 리움 승강기 교체공사 안전보건대장 이행점검 계약서_문화,공익 날인본.pdf"
}
```

출력 방향:

```text
detectedFileType: signed_contract
recommendedFolderPath: /프로젝트명/00_계약_견적
recommendedTags: contract, signed
```


---

## FILE: `docs/aec-erp/10-webhard/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 웹하드

## Prompt

```text
You are implementing the Webhard module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. The Webhard module is a full-screen project file manager that stores contracts, owner materials, contractor submissions, schedules, inspection files, photos, draft reports, review reports, final reports, signed documents, mail attachments, and share links.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: local file storage + InMemory repositories
- V1 Storage: MongoDB repository adapter + object storage
- API namespace: /api/v1

Implement only the Webhard module.

Existing concepts:
- Project
- ProjectParty
- InspectionRound
- Contract
- DocumentInstance
- Finding
- CorrectiveAction
- EvidencePhoto
- SafetyCostUsage
- MailMessage
- Submission
- Approval
- AuditLog

Required backend models:
- Folder
- FileAsset
- FileVersion
- FileEntityLink
- ShareLink
- ShareLinkAccessLog
- FileActivity
- FileClassificationSuggestion
- StorageObject
- UploadSession

Required backend APIs:

Folders:
- GET /api/v1/folders
- POST /api/v1/folders
- GET /api/v1/folders/{folderId}
- PATCH /api/v1/folders/{folderId}
- DELETE /api/v1/folders/{folderId}
- POST /api/v1/projects/{projectId}/folders/bootstrap
- POST /api/v1/folders/{folderId}/move
- GET /api/v1/projects/{projectId}/folder-tree

Files:
- GET /api/v1/files
- POST /api/v1/files/upload
- GET /api/v1/files/{fileId}
- PATCH /api/v1/files/{fileId}
- DELETE /api/v1/files/{fileId}
- POST /api/v1/files/{fileId}/restore
- POST /api/v1/files/{fileId}/archive
- POST /api/v1/files/{fileId}/lock
- POST /api/v1/files/{fileId}/unlock
- POST /api/v1/files/{fileId}/move
- POST /api/v1/files/{fileId}/copy
- GET /api/v1/files/{fileId}/download
- GET /api/v1/files/{fileId}/preview
- POST /api/v1/files/bulk-action

Versions:
- GET /api/v1/files/{fileId}/versions
- POST /api/v1/files/{fileId}/versions
- GET /api/v1/file-versions/{versionId}/download
- POST /api/v1/file-versions/{versionId}/restore-as-current

Share Links:
- GET /api/v1/share-links
- POST /api/v1/share-links
- GET /api/v1/share-links/{shareLinkId}
- PATCH /api/v1/share-links/{shareLinkId}
- DELETE /api/v1/share-links/{shareLinkId}
- POST /api/v1/share-links/{shareLinkId}/revoke
- GET /api/v1/public/share/{token}
- GET /api/v1/public/share/{token}/download

Linking:
- GET /api/v1/files/{fileId}/links
- POST /api/v1/files/{fileId}/links
- DELETE /api/v1/files/{fileId}/links/{linkId}
- POST /api/v1/files/{fileId}/classify
- POST /api/v1/files/{fileId}/apply-classification

Mail Attachment Save:
- POST /api/v1/mail/messages/{messageId}/attachments/save-to-webhard
- GET /api/v1/mail/messages/{messageId}/attachments/save-suggestions

Activities and Search:
- GET /api/v1/files/{fileId}/activities
- GET /api/v1/webhard/activities
- GET /api/v1/webhard/search
- GET /api/v1/webhard/storage-usage

Required frontend routes:
- /webhard
- /webhard/projects/[projectId]
- /webhard/projects/[projectId]/folders/[folderId]
- /webhard/recent
- /webhard/shared
- /webhard/trash
- /webhard/search
- /files/[fileId]
- /files/[fileId]/versions
- /files/[fileId]/activity
- /share/[token]

Required frontend components:
- WebhardShell
- WebhardCommandBar
- WebhardLeftRail
- ProjectFolderTree
- FolderBreadcrumb
- FileList
- FileGrid
- FileRow
- FileCard
- FilePreviewPanel
- FileDetailPanel
- FileTagEditor
- FileLinkTargetPanel
- FileVersionPanel
- FileActivityTimeline
- UploadDropzone
- UploadQueue
- NewFolderModal
- RenameModal
- MoveCopyModal
- ShareLinkModal
- ShareLinkList
- PublicShareView
- TrashTable
- StorageUsageCard
- FileClassificationSuggestionPanel
- MailAttachmentSavePanel

Business requirements:
1. Webhard uses a full-screen shell, not a narrow tab.
2. Project folder bootstrap creates the default A&C folder tree.
3. Files can be linked to Project, Contract, InspectionRound, DocumentInstance, Finding, CorrectiveAction, SafetyCostUsage, MailMessage, Submission, and Approval.
4. Upload creates FileAsset, FileVersion v1, and FileActivity.
5. Generated document export creates FileAsset with source=generated_document.
6. Mail attachment save creates FileAsset with source=mail_attachment and links MailMessage.
7. Final reports, submitted reports, and signed files should be locked or deletion-restricted.
8. Share links support token, expiration, permission, revoke, and access log.
9. Search supports project, folder, tag, file type, linked entity, and text query.
10. Folder display names can change without breaking projectId and folderId links.
11. File classification uses the service AI prompt `webhard-file-classification` and must require user confirmation when confidence is low.
12. All upload, move, delete, share, revoke, download, and restore actions should create FileActivity or AuditLog.

Validation:
1. folderId is required for upload.
2. File size must be greater than 0.
3. System folders cannot be deleted by normal users.
4. Locked files cannot be deleted, moved, or renamed unless admin override is used.
5. ShareLink must target either fileId or folderId.
6. Revoked or expired share links must not be accessible.
7. generated_document should link to DocumentInstance.
8. mail_attachment should link to MailMessage.

Seed data:
Create the default folder tree for the Leeum elevator replacement project:
- 00_계약_견적
- 01_발주처_제공자료
- 02_시공사_제출자료
- 03_공사개요_공정표
- 04_현장점검/제1회 ... 제10회
- 05_현장사진/원본
- 05_현장사진/지적사항
- 05_현장사진/조치현황
- 06_보고서_초안
- 07_검토본
- 08_최종본
- 09_메일첨부
- 99_기타

Tests:
- test_project_folder_bootstrap_creates_default_tree
- test_folder_system_folder_delete_blocked
- test_file_upload_creates_asset_and_version
- test_file_upload_records_activity
- test_file_classification_contract_folder
- test_file_classification_site_photo_folder
- test_generated_document_saved_to_final_folder
- test_mail_attachment_save_links_mail_message
- test_file_version_add_success
- test_file_move_updates_folder
- test_locked_file_cannot_be_deleted
- test_final_report_delete_blocked
- test_share_link_create_success
- test_share_link_revoke_blocks_access
- test_share_link_expired_blocks_access
- test_share_link_access_log_created
- test_file_entity_link_document_instance
- test_webhard_search_by_tag_and_project
- test_trash_restore_file

Deliverables:
- Backend models and repositories
- Local storage adapter
- Backend API routes and services
- File classification service
- Share link service
- Frontend full-screen webhard shell
- File list/grid/detail panels
- Upload queue
- API client functions
- Type definitions
- Tests
- README note for this module
```


---

## FILE: `docs/aec-erp/10-webhard/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 웹하드

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "웹하드" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 프로젝트별 계약서, 공사자료, 현장사진, 지적/조치사진, 보고서 초안, 검토본, 최종본, 메일 첨부파일을 관리하는 ERP
- 웹하드는 일반 탭이 아니라 full-screen 파일관리자 shell이다.
- 기존 apps 웹하드처럼 폴더 트리, 파일 목록, 우측 상세 패널, 공유 링크 기능을 제공하되 ERP의 프로젝트/문서/메일/제출 이력과 연결된다.

화면 1: 웹하드 홈
- full-screen layout
- 좌측 rail:
  - 내 자료함
  - 프로젝트
  - 최근 항목
  - 공유됨
  - 중요
  - 휴지통
- 중앙에는 최근 파일, 프로젝트별 폴더, 저장공간 요약 표시
- 상단 command bar:
  - 업로드
  - 새 폴더
  - 새 메모
  - 공유 링크
  - 검색

화면 2: 프로젝트 웹하드
- 좌측 rail은 유지
- 두 번째 column에는 프로젝트 폴더 트리 표시
- 폴더 구조:
  - 00_계약_견적
  - 01_발주처_제공자료
  - 02_시공사_제출자료
  - 03_공사개요_공정표
  - 04_현장점검
  - 05_현장사진
  - 06_보고서_초안
  - 07_검토본
  - 08_최종본
  - 09_메일첨부
  - 99_기타
- 중앙에는 파일 리스트 또는 grid
- 우측에는 파일 상세/미리보기 패널

파일 리스트 컬럼:
- 파일명
- 태그
- 연결 대상
- 크기
- 수정일
- 업로드자
- 공유 여부
- 상태

화면 3: 파일 상세 패널
- 상단 파일 미리보기
- 파일명, 확장자, 크기, 업로드일
- 태그 editor
- 연결 대상:
  - 프로젝트
  - 점검회차
  - 문서
  - 지적사항
  - 메일
  - 제출 이력
- 버전 목록
- 공유 링크 목록
- 활동 이력

화면 4: 업로드 경험
- drag & drop 업로드 영역
- 업로드 queue 표시
- 업로드 완료 후 AI 분류 추천 패널 표시
- 추천 내용:
  - 추천 폴더
  - 추천 태그
  - 연결 대상 후보
  - 신뢰도
- 사용자가 적용 또는 직접 수정할 수 있게 한다.

화면 5: 공유 링크 modal
- 파일/폴더명 표시
- 권한 선택:
  - 보기만
  - 다운로드 허용
- 만료일 선택
- 비밀번호 optional
- 링크 생성
- 링크 복사
- 링크 폐기
- 접근 로그 보기

화면 6: 공개 공유 링크 화면
- 깔끔한 외부 열람 페이지
- 파일명, 공유자, 만료일 표시
- 미리보기 영역
- 다운로드 버튼
- 만료 또는 폐기 상태 안내

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- 배경은 밝은 회색
- 파일 리스트는 높은 정보 밀도
- 우측 상세 패널은 흰색 카드 기반
- 최종본/제출본/날인본은 lock icon과 강한 badge로 표시
- 메일첨부는 주황색 badge
- 지적사진은 빨간 outline badge
- 조치사진은 초록 outline badge
- 공유 링크는 teal 또는 blue badge
- 삭제/만료/권한오류는 빨간색 warning

결과물:
- 웹하드 홈 화면
- 프로젝트 웹하드 full-screen 화면
- 폴더 트리 UI
- 파일 리스트/grid UI
- 파일 상세 패널 UI
- 업로드 queue + 분류 추천 UI
- 공유 링크 modal
- 공개 공유 링크 화면
- 휴지통 화면
```


---

## FILE: `docs/aec-erp/10-webhard/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 웹하드

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
웹하드

기능 설명:
웹하드는 프로젝트별 계약서, 발주처 제공자료, 시공사 제출자료, 공사개요/공정표, 현장점검 자료, 현장사진, 지적사진, 조치사진, 보고서 초안, 검토본, 최종본, 메일 첨부파일, 공유 링크를 관리하는 full-screen 파일관리 기능이다.

업무 맥락:
- 웹하드는 단순 파일 저장소가 아니라 ERP 산출물 저장소다.
- 모든 파일은 가능하면 Project와 연결된다.
- 파일은 Folder 안에 저장되지만 DocumentInstance, InspectionRound, Finding, MailMessage, Submission 등과도 연결될 수 있다.
- 문서 export 결과는 웹하드에 자동 저장되어야 한다.
- 메일 첨부파일은 웹하드에 저장되고 MailMessage와 연결되어야 한다.
- 최종본, 제출본, 날인본은 삭제 제한과 lock 상태가 필요하다.
- 공유 링크는 만료일, 권한, 폐기, 접근 로그를 가져야 한다.
- 파일 분류는 AI가 추천하되, 확신이 낮으면 사용자 확인이 필요하다.

입력:
{
  "featureName": "웹하드",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "shareRequirements": [],
  "mailRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `webhard.file_management`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 계약/견적
    - 점검회차/일정
    - 현장점검 체크리스트
    - 지적사항/사진대지
    - 산업안전보건관리비
    - 안전관리계획서
    - 안전보건대장
    - 공사안전보건대장 이행확인 보고서
    - 메일함
    - 결재/제출
    - 관리자/템플릿

출력 JSON:
{
  "featureId": "webhard.file_management",
  "featureName": "웹하드",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /webhard
- /webhard/projects/[projectId]
- /webhard/projects/[projectId]/folders/[folderId]
- /webhard/recent
- /webhard/shared
- /webhard/trash
- /webhard/search
- /files/[fileId]
- /files/[fileId]/versions
- /files/[fileId]/activity
- /share/[token]

반드시 포함할 models:
- Folder
- FileAsset
- FileVersion
- FileEntityLink
- ShareLink
- ShareLinkAccessLog
- FileActivity
- FileClassificationSuggestion
- StorageObject
- UploadSession
- Project
- DocumentInstance
- InspectionRound
- Finding
- MailMessage
- Submission
- AuditLog

반드시 포함할 prompts:
- webhard-file-classification
- webhard implementation prompt
- webhard design prompt

반드시 포함할 tests:
- test_project_folder_bootstrap_creates_default_tree
- test_folder_system_folder_delete_blocked
- test_file_upload_creates_asset_and_version
- test_file_upload_records_activity
- test_file_classification_contract_folder
- test_file_classification_site_photo_folder
- test_generated_document_saved_to_final_folder
- test_mail_attachment_save_links_mail_message
- test_file_version_add_success
- test_file_move_updates_folder
- test_locked_file_cannot_be_deleted
- test_final_report_delete_blocked
- test_share_link_create_success
- test_share_link_revoke_blocks_access
- test_share_link_expired_blocks_access
- test_share_link_access_log_created
- test_file_entity_link_document_instance
- test_webhard_search_by_tag_and_project
- test_trash_restore_file

주의:
- 웹하드는 full-screen shell로 설계한다.
- 폴더명 변경이 데이터 연결을 깨뜨리면 안 된다.
- 파일은 폴더뿐 아니라 ERP 엔티티와도 연결되어야 한다.
- 최종본/제출본/날인본은 삭제 제한 대상이다.
- 공유 링크 token 원문을 저장하지 말고 hash를 저장한다.
- 공유 링크 접근은 만료/폐기/권한을 반드시 검증한다.
- 메일 첨부 저장 시 MailMessage와 FileAsset 연결을 남긴다.
- 문서 export 저장 시 DocumentInstance와 FileAsset 연결을 남긴다.
- AI 파일 분류는 추천일 뿐이며 확신이 낮으면 사용자가 확인해야 한다.
```


---

## FILE: `docs/aec-erp/11-mailbox/README.md`

# 기능 11 — 메일함

이 폴더는 A&C 기술사 ERP의 열한 번째 기능인 `메일함` 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

메일함은 A&C 기술사 ERP 안에서 프로젝트별 업무 메일을 관리하고, 발주처별 보고서 제출, 시공사 조치요청, 자료요청, 일정협의, 계약/견적 발송, 첨부파일 웹하드 저장, 제출 이력 연결을 수행하는 3-pane 업무 메일 모듈이다.

```text
MailAccount
→ MailThread
→ MailMessage
→ MailAttachment
→ Project / InspectionRound / DocumentInstance / Finding / Submission
→ Webhard FileAsset
```

## 핵심 설계 포인트

- 메일함은 단순 받은편지함이 아니라 프로젝트 커뮤니케이션 저장소다.
- OAuth 연결 전에는 guest draft mode로 메일 초안 작성과 복사 기능을 제공한다.
- OAuth 연결 후에는 메일 sync/send를 지원한다.
- 메일은 프로젝트, 점검회차, 발주처, 문서, 지적사항, 제출 이력과 연결될 수 있다.
- 메일 첨부파일은 웹하드 폴더에 저장하고 원본 메일과 연결한다.
- 보고서 제출 메일은 Submission을 생성하거나 갱신한다.
- 조치요청 메일은 Finding/CorrectiveAction 상태와 연결한다.
- AI 메일 초안은 발송 전 사용자가 반드시 검토해야 한다.


---

## FILE: `docs/aec-erp/11-mailbox/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 메일함

## 1. 기능 정의

메일함은 A&C 기술사 ERP에서 프로젝트 관련 메일을 송수신·분류·연결·보관하는 기능이다.

기존 apps의 메일함 3-pane shell을 ERP 안에 통합하되, 단순 이메일 클라이언트가 아니라 다음 업무를 처리하는 프로젝트 커뮤니케이션 모듈로 설계한다.

```text
프로젝트별 메일 관리
보고서 제출 메일 작성
자료요청 메일 작성
조치요청 메일 작성
일정협의 메일 작성
계약/견적 발송 메일 작성
첨부파일 웹하드 저장
메일-문서-파일-제출 이력 연결
```

## 2. 이 기능이 필요한 이유

A&C 업무에서 메일은 단순 연락 수단이 아니라 제출 증빙이다.

예를 들어 공사안전보건대장 이행확인 보고서를 발주처별로 제출할 때, 다음 정보가 함께 남아야 한다.

- 어떤 프로젝트의 메일인지
- 어느 점검회차의 제출인지
- 어느 발주처에 보낸 것인지
- 어떤 최종본 파일을 첨부했는지
- PDF/HWPX 등 제출 파일이 웹하드 어디에 저장되어 있는지
- 발송일과 수신자가 누구인지
- 회신이 왔는지
- 발주처 확인 상태가 무엇인지

시공사에 지적사항 조치를 요청할 때도 다음 정보가 연결되어야 한다.

- 지적사항 목록
- 조치요청 내용
- 지적사진
- 요청기한
- 시공사 담당자
- 회신 메일
- 조치사진
- 조치 완료 여부

따라서 메일함은 보고서 제출, 조치요청, 자료요청, 일정협의, 계약/견적 발송 이력을 ERP 데이터와 연결해야 한다.

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 대표/기술사 | 제출 메일 확인, 중요 회신 검토, 최종본 발송 승인 |
| 점검 담당자 | 일정협의, 현장자료 요청, 조치요청 메일 작성 |
| 문서 작성자 | 보고서 제출 메일 작성, 첨부파일 확인, 회신 반영 |
| 계약/행정 담당자 | 계약/견적 발송, 자료요청, 발주처 연락 관리 |
| 관리자 | 메일 계정, OAuth, 서명, 템플릿, 권한 관리 |

## 4. 핵심 메일 유형

| 메일 유형 | 설명 | 연결 대상 |
|---|---|---|
| report_submission | 보고서 제출 | DocumentInstance, FileAsset, Submission, OwnerReportTask |
| action_request | 지적사항 조치 요청 | Finding, CorrectiveAction, EvidencePhoto |
| material_request | 자료 요청 | Project, InspectionRound, FileAsset |
| schedule_coordination | 점검 일정 협의 | InspectionRound, InspectionTask |
| contract_estimate | 계약서/견적서 발송 | Contract, Estimate, FileAsset |
| general_reply | 일반 회신 | Project, MailThread |
| safety_cost_request | 산업안전보건관리비 자료 요청 | SafetyCostUsage, FileAsset |
| approval_request | 내부 검토/승인 요청 | Approval, DocumentInstance |

## 5. 핵심 기능

### 5.1 메일 계정 연결

지원 모드:

```text
guest_draft_mode
connected_oauth_mode
```

Guest draft mode:

- OAuth 연결 없이 메일 초안 작성
- 제목/본문/첨부 체크리스트 생성
- 사용자가 외부 메일 클라이언트에 복사
- 제출 이력은 수동 등록 가능

Connected OAuth mode:

- 메일 계정 연결
- 받은편지함/보낸메일함/임시보관함 sync
- 메일 발송
- 첨부파일 저장
- 프로젝트 자동/수동 연결
- 발송 후 Submission 자동 생성

### 5.2 3-pane 메일함

기본 구조:

```text
좌측: 메일함 / 계정 / 프로젝트 필터
중앙: 메일 목록 / 스레드 목록
우측: 메일 상세 또는 작성 패널
하단/우측: 첨부파일 웹하드 저장, 프로젝트 연결, AI 초안 패널
```

### 5.3 프로젝트별 메일 연결

메일은 다음 방식으로 프로젝트와 연결된다.

- 수동 연결
- 제목/본문의 프로젝트명 기반 추천
- 발주처/시공사 담당자 이메일 기반 추천
- 첨부파일명 기반 추천
- 문서번호/회차 기반 추천

연결 가능한 대상:

```text
Project
InspectionRound
DocumentInstance
Finding
CorrectiveAction
SafetyCostUsage
Contract
Estimate
Submission
FileAsset
```

### 5.4 보고서 제출 메일

보고서 제출 메일 작성 시 포함 항목:

- 프로젝트명
- 발주처명
- 점검회차
- 점검일
- 문서번호
- 제출 문서명
- 첨부파일명
- 검토 요청 문구
- 회신 요청 문구
- 담당자 서명

발송 후 처리:

```text
MailMessage 저장
Submission 생성 또는 갱신
DocumentInstance.status = submitted
OwnerReportTask.status = submitted
submittedAt 저장
첨부파일 FileAsset 연결
```

### 5.5 조치요청 메일

지적사항 선택 후 조치요청 메일을 작성한다.

포함 항목:

- 프로젝트명
- 점검회차
- 지적사항 표
- 요청 조치내용
- 조치기한
- 지적사진
- 회신 요청 문구

지적사항 표 기본 컬럼:

```text
번호
지적사항
위험유형
요청 조치내용
조치기한
첨부사진
```

### 5.6 자료요청 메일

예시 요청자료:

- 공사일정표
- 공정표
- 산업안전보건관리비 사용내역서
- 세금계산서/영수증
- 안전교육 자료
- 안전관리조직도
- 비상연락망
- 조치사진
- 발주처 확인자료

### 5.7 첨부파일 웹하드 저장

메일 첨부파일을 웹하드에 저장할 수 있다.

저장 시 선택 항목:

- 프로젝트
- 폴더
- 태그
- 연결 대상
- 파일 설명
- 중복 파일 처리 방식

저장 후 처리:

```text
MailAttachment.savedFileId = FileAsset.id
FileAsset.source = mail_attachment
FileAsset.linkedEntityType = mail_message
FileAsset.linkedEntityId = MailMessage.id
FileActivityLog 생성
```

### 5.8 메일 초안 AI 작성

AI가 작성하는 초안 유형:

- 보고서 제출 메일
- 조치요청 메일
- 자료요청 메일
- 일정협의 메일
- 계약/견적 발송 메일
- 회신 메일

AI 작성 원칙:

- 공손하고 실무적인 한국어
- 첨부파일명 명확히 표시
- 발주처/시공사/프로젝트명 오기 방지
- 입력에 없는 첨부파일이나 날짜를 만들지 않음
- 발송 전 사용자 확인 필수

### 5.9 메일 템플릿

템플릿 변수:

```text
{{project.name}}
{{project.siteAddress}}
{{owner.name}}
{{inspection.roundNo}}
{{inspection.date}}
{{document.title}}
{{document.documentNo}}
{{file.names}}
{{finding.table}}
{{dueDate}}
{{sender.name}}
{{sender.signature}}
```

## 6. 상태

### MailAccount 상태

| 상태 | 의미 |
|---|---|
| guest | OAuth 미연결 초안 모드 |
| connected | OAuth 연결됨 |
| sync_error | 동기화 오류 |
| disconnected | 연결 해제 |

### MailMessage 상태

| 상태 | 의미 |
|---|---|
| received | 수신 |
| draft | 초안 |
| queued | 발송 대기 |
| sent | 발송됨 |
| failed | 발송 실패 |
| archived | 보관 |

### MailLink 상태

| 상태 | 의미 |
|---|---|
| suggested | 시스템 추천 |
| confirmed | 사용자 확인 |
| rejected | 사용자 제외 |

## 7. 완료 기준

- 메일함 3-pane shell을 제공한다.
- Guest draft mode에서 메일 초안을 작성할 수 있다.
- OAuth 연결 모드에서 계정 연결, sync, send를 지원할 수 있다.
- 메일을 프로젝트, 점검회차, 문서, 지적사항, 제출 이력과 연결할 수 있다.
- 첨부파일을 웹하드에 저장할 수 있다.
- 보고서 제출 메일 발송 후 Submission 이력이 생성된다.
- 지적사항 조치요청 메일을 작성할 수 있다.
- 자료요청/일정협의/계약발송 메일 템플릿을 지원한다.
- AI 초안은 발송 전 사용자 검토가 필요하다.


---

## FILE: `docs/aec-erp/11-mailbox/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 메일함

## 1. Frontend Routes

```text
/mail
/mail/inbox
/mail/sent
/mail/drafts
/mail/compose
/mail/threads/[threadId]
/mail/messages/[messageId]
/mail/accounts
/mail/settings

/projects/[projectId]/mail
/projects/[projectId]/mail/compose
/inspections/[inspectionRoundId]/mail
/documents/[documentId]/submission-mail
/findings/[findingId]/action-request-mail
/contracts/[contractId]/send-mail
/settings/mail-accounts
/settings/mail-templates
```

## 2. Frontend Components

```text
MailboxShell
MailLeftPane
MailAccountSelector
MailFolderList
ProjectMailFilter
MailSearchBar
MailThreadList
MailMessageListItem
MailDetailPane
MailMessageHeader
MailBodyViewer
MailAttachmentList
MailAttachmentSavePanel
MailProjectLinker
MailEntityLinker
ComposePanel
MailRecipientInput
MailTemplateSelector
MailAIDraftPanel
MailSendChecklist
SubmissionMailComposer
ActionRequestMailComposer
MaterialRequestMailComposer
ScheduleCoordinationMailComposer
ContractEstimateMailComposer
OAuthConnectCard
MailSyncStatusBadge
MailSyncLogPanel
MailSignatureEditor
MailTemplateEditor
```

## 3. Backend APIs

### Mail Accounts

```text
GET    /api/v1/mail/accounts
POST   /api/v1/mail/accounts/guest
GET    /api/v1/mail/accounts/{accountId}
PATCH  /api/v1/mail/accounts/{accountId}
DELETE /api/v1/mail/accounts/{accountId}

POST   /api/v1/mail/oauth/google/start
GET    /api/v1/mail/oauth/google/callback
POST   /api/v1/mail/accounts/{accountId}/disconnect
POST   /api/v1/mail/accounts/{accountId}/sync
GET    /api/v1/mail/accounts/{accountId}/sync-jobs
```

### Threads and Messages

```text
GET   /api/v1/mail/threads
GET   /api/v1/mail/threads/{threadId}
PATCH /api/v1/mail/threads/{threadId}
POST  /api/v1/mail/threads/{threadId}/archive

GET   /api/v1/mail/messages
GET   /api/v1/mail/messages/{messageId}
PATCH /api/v1/mail/messages/{messageId}
POST  /api/v1/mail/messages/{messageId}/mark-read
POST  /api/v1/mail/messages/{messageId}/link-entity
POST  /api/v1/mail/messages/{messageId}/classify
```

### Draft and Send

```text
POST /api/v1/mail/drafts
GET  /api/v1/mail/drafts/{draftId}
PATCH /api/v1/mail/drafts/{draftId}
POST /api/v1/mail/drafts/{draftId}/generate
POST /api/v1/mail/drafts/{draftId}/validate
POST /api/v1/mail/drafts/{draftId}/send
POST /api/v1/mail/send
```

### Attachments

```text
GET  /api/v1/mail/messages/{messageId}/attachments
POST /api/v1/mail/attachments/{attachmentId}/save-to-webhard
POST /api/v1/mail/attachments/save-bulk-to-webhard
POST /api/v1/mail/attachments/{attachmentId}/link-file
```

### Context-specific Drafts

```text
POST /api/v1/documents/{documentId}/submission-mail/draft
POST /api/v1/findings/action-request-mail/draft
POST /api/v1/projects/{projectId}/material-request-mail/draft
POST /api/v1/inspection-rounds/{inspectionRoundId}/schedule-coordination-mail/draft
POST /api/v1/contracts/{contractId}/send-mail/draft
POST /api/v1/estimates/{estimateId}/send-mail/draft
```

### Templates and Signatures

```text
GET    /api/v1/mail/templates
POST   /api/v1/mail/templates
GET    /api/v1/mail/templates/{templateId}
PATCH  /api/v1/mail/templates/{templateId}
DELETE /api/v1/mail/templates/{templateId}

GET   /api/v1/mail/signatures
POST  /api/v1/mail/signatures
PATCH /api/v1/mail/signatures/{signatureId}
```

## 4. Data Models

### MailAccount

```ts
type MailProvider = 'guest' | 'google' | 'manual_smtp' | 'mock'

type MailAccountStatus =
  | 'guest'
  | 'connected'
  | 'sync_error'
  | 'disconnected'

type MailAccount = {
  id: string
  provider: MailProvider
  email?: string
  displayName?: string
  status: MailAccountStatus
  oauthTokenRef?: string
  lastSyncedAt?: string
  defaultSignatureId?: string
  createdAt: string
  updatedAt: string
}
```

### MailThread

```ts
type MailThreadStatus = 'active' | 'archived' | 'muted'

type MailThread = {
  id: string
  accountId: string
  providerThreadId?: string
  projectId?: string
  subject: string
  participants: string[]
  lastMessageAt?: string
  status: MailThreadStatus
  linkedEntityRefs: MailEntityLink[]
  createdAt: string
  updatedAt: string
}
```

### MailMessage

```ts
type MailMessageDirection = 'inbound' | 'outbound'

type MailMessageStatus =
  | 'received'
  | 'draft'
  | 'queued'
  | 'sent'
  | 'failed'
  | 'archived'

type MailMessage = {
  id: string
  accountId: string
  threadId?: string
  providerMessageId?: string
  projectId?: string
  direction: MailMessageDirection
  status: MailMessageStatus
  from: MailAddress
  to: MailAddress[]
  cc: MailAddress[]
  bcc: MailAddress[]
  subject: string
  bodyText?: string
  bodyHtml?: string
  sentAt?: string
  receivedAt?: string
  attachments: MailAttachment[]
  linkedEntityRefs: MailEntityLink[]
  createdAt: string
  updatedAt: string
}

type MailAddress = {
  name?: string
  email: string
  contactId?: string
  organizationId?: string
}
```

### MailAttachment

```ts
type MailAttachment = {
  id: string
  messageId: string
  fileName: string
  contentType?: string
  size?: number
  providerAttachmentId?: string
  tempObjectKey?: string
  savedFileId?: string
  saveStatus: 'not_saved' | 'saving' | 'saved' | 'failed'
  recommendedFolderId?: string
  recommendedTags: string[]
}
```

### MailDraft

```ts
type MailPurpose =
  | 'report_submission'
  | 'action_request'
  | 'material_request'
  | 'schedule_coordination'
  | 'contract_estimate'
  | 'safety_cost_request'
  | 'approval_request'
  | 'general_reply'

type MailDraft = {
  id: string
  accountId?: string
  purpose: MailPurpose
  projectId?: string
  inspectionRoundId?: string
  ownerPartyId?: string
  documentId?: string
  findingIds: string[]
  submissionId?: string
  subject: string
  bodyText: string
  bodyHtml?: string
  to: MailAddress[]
  cc: MailAddress[]
  bcc: MailAddress[]
  attachmentFileIds: string[]
  generatedByAi: boolean
  validationWarnings: MailWarning[]
  status: 'draft' | 'validated' | 'sent' | 'cancelled'
  createdAt: string
  updatedAt: string
}
```

### MailEntityLink

```ts
type MailEntityType =
  | 'project'
  | 'inspection_round'
  | 'document_instance'
  | 'finding'
  | 'corrective_action'
  | 'safety_cost_usage'
  | 'contract'
  | 'estimate'
  | 'file_asset'
  | 'submission'

type MailLinkStatus = 'suggested' | 'confirmed' | 'rejected'

type MailEntityLink = {
  id: string
  mailThreadId?: string
  mailMessageId?: string
  entityType: MailEntityType
  entityId: string
  status: MailLinkStatus
  confidence?: number
  reason?: string
  createdAt: string
  confirmedAt?: string
}
```

### Submission

```ts
type Submission = {
  id: string
  projectId: string
  inspectionRoundId?: string
  ownerPartyId?: string
  documentId: string
  submittedFileIds: string[]
  mailMessageId?: string
  recipientEmails: string[]
  submittedAt?: string
  status: 'draft' | 'submitted' | 'confirmed' | 'rejected'
  createdAt: string
  updatedAt: string
}
```

## 5. Validation Rules

### MailDraft

- subject는 필수다.
- to는 최소 1명 이상이어야 한다.
- report_submission 목적이면 documentId와 attachmentFileIds가 필요하다.
- report_submission 목적이면 ownerPartyId 또는 발주처 수신자가 필요하다.
- action_request 목적이면 findingIds가 1개 이상 필요하다.
- material_request 목적이면 요청자료 목록이 필요하다.
- OAuth 미연결 상태에서는 실제 send 대신 copy/export draft만 가능하다.
- 첨부파일이 FileAsset으로 존재하지 않으면 발송 전 warning을 표시한다.

### MailAttachment

- save-to-webhard 시 projectId와 targetFolderId가 필요하다.
- 같은 폴더에 같은 파일명이 있으면 version 생성 또는 rename 정책을 적용한다.
- 저장 완료 후 savedFileId를 기록한다.

### Submission Mail

- 제출본 FileAsset이 있어야 한다.
- DocumentInstance.status가 exported 또는 confirmed 이상이어야 한다.
- 제출 후 DocumentInstance.status, OwnerReportTask.status, Submission.status를 동기화한다.

## 6. Service Rules

### Project Mail Classification

```text
1. subject/body에서 projectName, siteName, documentNo, roundNo 추출
2. sender/recipient 이메일을 Contact와 비교
3. attachment filename을 Webhard classification 규칙과 비교
4. 후보 Project, InspectionRound, DocumentInstance, Finding을 추천
5. confidence와 reason 반환
6. 사용자가 confirmed/rejected 처리
```

### Report Submission Mail Flow

```text
1. DocumentInstance 조회
2. exportedFileId 확인
3. OwnerParty/Contact 조회
4. 제출 메일 템플릿 선택
5. AI 초안 생성
6. 첨부파일 체크
7. 사용자 검토
8. send 또는 guest copy
9. MailMessage 저장
10. Submission 생성/갱신
11. DocumentInstance.status = submitted
12. OwnerReportTask.status = submitted
13. AuditLog 기록
```

### Action Request Mail Flow

```text
1. Finding 목록 선택
2. 책임 조직/담당자 확인
3. 지적사진 FileAsset 확인
4. 조치요청 메일 초안 생성
5. 사용자 검토
6. 발송
7. Finding.status = action_requested
8. MailThread 연결
9. AuditLog 기록
```

### Attachment Save Flow

```text
1. MailAttachment 선택
2. Project/Folder 선택
3. 중복 파일명 확인
4. FileAsset 생성
5. StorageObject 저장
6. MailAttachment.savedFileId 업데이트
7. MailMessage와 FileAsset link 생성
8. FileActivityLog 생성
```

## 7. Seed Mail Templates

### 보고서 제출

```text
제목: [{ownerName}] 제{roundNo}회 {projectName} 공사안전보건대장 이행점검 결과보고서 제출
본문 구성:
- 인사말
- 제출 문서 안내
- 점검일 및 회차
- 첨부파일 목록
- 검토 요청 문구
- 서명
```

### 조치요청

```text
제목: [{projectName}] 제{roundNo}회 점검 지적사항 조치 요청
본문 구성:
- 인사말
- 지적사항 표
- 조치기한
- 첨부사진 안내
- 회신 요청 문구
- 서명
```

### 자료요청

```text
제목: [{projectName}] 공사안전보건대장 이행점검 자료 요청
본문 구성:
- 요청 배경
- 요청자료 목록
- 제출기한
- 제출방법
- 서명
```

## 8. Tests

```text
test_mail_account_guest_create
test_mail_oauth_start_returns_auth_url
test_mail_sync_creates_threads_and_messages
test_mail_project_classification_by_subject
test_mail_project_classification_by_contact_email
test_mail_draft_create_report_submission
test_mail_draft_report_submission_requires_exported_file
test_mail_draft_action_request_requires_findings
test_mail_draft_validate_recipients
test_mail_send_connected_mode_success
test_mail_send_guest_mode_blocked_or_copy_only
test_mail_attachment_save_to_webhard
test_mail_attachment_duplicate_creates_file_version
test_report_submission_mail_creates_submission
test_report_submission_mail_updates_document_status
test_action_request_mail_updates_finding_status
test_mail_message_link_entity_confirmed
test_mail_template_variable_mapping
```


---

## FILE: `docs/aec-erp/11-mailbox/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 메일함

## 1. 화면 목표

메일함 화면은 A&C ERP 안에서 프로젝트 메일을 빠르게 확인하고, 문서 제출·조치요청·자료요청·일정협의 메일을 작성하며, 첨부파일을 웹하드에 저장하고, 메일을 ERP 업무 데이터와 연결하는 3-pane 업무 화면이다.

핵심 목표:

- 받은편지함과 보낸메일함을 프로젝트 중심으로 탐색
- 메일이 어떤 프로젝트/문서/지적사항과 연결되어 있는지 즉시 표시
- 첨부파일을 웹하드로 저장하는 흐름을 단순화
- 보고서 제출 메일과 Submission 이력을 자동 연결
- 조치요청 메일과 Finding 상태를 연결
- OAuth 미연결 상태에서도 초안 작성 가능

## 2. 화면 목록

### 2.1 통합 메일함

Route:

```text
/mail
/mail/inbox
/mail/sent
/mail/drafts
```

Layout:

```text
┌────────────────────────────────────────────────────────────┐
│ Toolbar: Sync / Compose / Project Filter / Search           │
├──────────────┬─────────────────────┬───────────────────────┤
│ Left Pane    │ Thread List         │ Message Detail         │
│ accounts     │ message summary     │ body / attachments     │
│ folders      │ project badge       │ project linker         │
│ project      │ status badge        │ attachment save panel  │
└──────────────┴─────────────────────┴───────────────────────┘
```

### 2.2 프로젝트별 메일

Route:

```text
/projects/[projectId]/mail
```

표시:

- 프로젝트 관련 메일만 필터링
- 발주처/시공사/내부 메일 구분
- 회차별 필터
- 문서별 필터
- 제출 메일 강조
- 미저장 첨부파일 경고

### 2.3 메일 작성

Route:

```text
/mail/compose
/projects/[projectId]/mail/compose
```

구성:

- 수신자/참조자 입력
- 메일 목적 선택
- 템플릿 선택
- AI 초안 생성
- 제목/본문 편집
- 첨부파일 선택
- 발송 전 체크리스트

### 2.4 보고서 제출 메일

Route:

```text
/documents/[documentId]/submission-mail
```

구성:

- 문서 정보 카드
- 발주처 카드
- 최종본 첨부파일 카드
- 수신자 확인
- 제출 메일 본문
- 제출 후 Submission 생성 안내

### 2.5 조치요청 메일

Route:

```text
/findings/[findingId]/action-request-mail
```

또는 복수 Finding 선택 시:

```text
/findings/action-request-mail
```

구성:

- 지적사항 표
- 지적사진 첨부
- 요청기한 입력
- 시공사 담당자 선택
- 조치요청 메일 본문

### 2.6 첨부파일 웹하드 저장 패널

메시지 상세 우측 또는 하단에 표시한다.

표시:

- 첨부파일명
- 크기
- 저장 여부
- 추천 프로젝트
- 추천 폴더
- 추천 태그
- 저장 버튼
- 이미 저장된 FileAsset 링크

### 2.7 메일 계정 설정

Route:

```text
/settings/mail-accounts
```

표시:

- Guest draft mode
- OAuth 연결 카드
- 연결 계정 목록
- 동기화 상태
- 서명 설정
- 템플릿 설정

## 3. UX 규칙

1. 메일은 3-pane 구조를 기본으로 한다.
2. 프로젝트 연결이 없는 메일은 `미분류` badge를 표시한다.
3. 시스템 추천 연결은 `추천` 상태로 표시하고, 사용자가 확인해야 `확정`이 된다.
4. 보고서 제출 메일은 첨부파일 누락 시 발송 버튼을 비활성화한다.
5. OAuth 미연결 상태에서는 `발송` 대신 `초안 복사` 또는 `외부 메일로 복사` 버튼을 표시한다.
6. 첨부파일이 웹하드에 저장되지 않았으면 `저장 필요` badge를 표시한다.
7. 보낸메일 중 제출 메일은 Submission 상태를 함께 표시한다.
8. 조치요청 메일 발송 후 관련 Finding 상태 변화를 명확히 보여준다.
9. AI가 작성한 본문은 `AI 초안` badge를 표시한다.
10. 발송 전 수신자, 첨부파일, 연결 문서, 제출 상태를 체크리스트로 보여준다.

## 4. 주요 컴포넌트

### MailboxShell

- Left Pane
- Thread List
- Message Detail
- Compose Overlay
- Attachment Save Panel

### MailLeftPane

항목:

```text
계정
받은편지함
보낸메일함
임시보관함
중요
미분류
프로젝트별
발주처별
```

### MailThreadList

컬럼/정보:

- 읽음 상태
- 보낸 사람
- 제목
- 프로젝트 badge
- 연결 엔티티 badge
- 첨부파일 아이콘
- 마지막 수신/발신 시간

### MailDetailPane

표시:

- 제목
- 보낸 사람/받는 사람/참조
- 프로젝트 연결 상태
- 본문
- 첨부파일
- 관련 업무
- 회신/전달/프로젝트 연결 버튼

### MailAttachmentSavePanel

기능:

- 파일별 저장 상태
- 추천 폴더
- 저장 위치 변경
- 태그 선택
- 중복 파일 처리
- 웹하드 열기

### ComposePanel

구성:

- 목적 선택
- 템플릿 선택
- AI 초안 생성
- 수신자/참조자
- 제목
- 본문 editor
- 첨부파일
- 발송 전 체크리스트

### SubmissionMailComposer

보고서 제출 전용:

- 문서번호
- 발주처
- 점검회차
- 최종본 파일
- Submission 생성 여부

### ActionRequestMailComposer

조치요청 전용:

- 지적사항 표
- 조치기한
- 지적사진 첨부
- 시공사 담당자

## 5. Warning State

### 프로젝트 미연결

```text
이 메일은 아직 프로젝트와 연결되지 않았습니다.
제목, 수신자, 첨부파일 기준으로 추천 프로젝트를 확인하세요.
```

### 첨부파일 미저장

```text
첨부파일이 웹하드에 저장되지 않았습니다.
제출 증빙으로 보관하려면 프로젝트 폴더에 저장하세요.
```

### 제출파일 누락

```text
보고서 제출 메일에는 최종본 파일이 필요합니다.
먼저 보고서를 export하고 웹하드 최종본 파일을 첨부하세요.
```

### OAuth 미연결

```text
메일 계정이 연결되어 있지 않습니다.
현재는 초안 작성 및 복사만 가능합니다.
```

## 6. Responsive

### Desktop

- 3-pane shell 기본
- 첨부파일 저장 패널 우측 고정
- 작성 패널은 우측 drawer 또는 전체 overlay

### Tablet

- Left Pane collapse
- Thread List + Detail 2-pane
- Compose full-screen drawer

### Mobile

- 메일 목록과 상세 분리
- 작성은 full-screen
- 첨부파일 저장은 step 방식


---

## FILE: `docs/aec-erp/11-mailbox/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 메일함

## 1. Feature

```yaml
featureId: mailbox.project_communication
featureName: 메일함
priority: P0.5
module: mailbox
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 통합 메일함 | `/mail` | 받은편지함/보낸메일함/임시보관함 통합 |
| 받은편지함 | `/mail/inbox` | 수신 메일 |
| 보낸메일함 | `/mail/sent` | 발송 메일 |
| 임시보관함 | `/mail/drafts` | 작성 중 초안 |
| 메일 작성 | `/mail/compose` | 일반 메일 작성 |
| 스레드 상세 | `/mail/threads/[threadId]` | 대화 스레드 |
| 메시지 상세 | `/mail/messages/[messageId]` | 개별 메일 |
| 프로젝트 메일 | `/projects/[projectId]/mail` | 프로젝트별 메일 필터 |
| 프로젝트 메일 작성 | `/projects/[projectId]/mail/compose` | 프로젝트 context compose |
| 회차 메일 | `/inspections/[inspectionRoundId]/mail` | 점검회차 일정협의/제출 메일 |
| 보고서 제출 메일 | `/documents/[documentId]/submission-mail` | 문서 제출 전용 메일 |
| 조치요청 메일 | `/findings/[findingId]/action-request-mail` | 지적사항 조치요청 |
| 계약 발송 메일 | `/contracts/[contractId]/send-mail` | 계약서/견적서 발송 |
| 메일 계정 설정 | `/settings/mail-accounts` | OAuth/guest 설정 |
| 메일 템플릿 설정 | `/settings/mail-templates` | 템플릿/서명 관리 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/mail` | MailboxShell, MailLeftPane, MailThreadList, MailDetailPane |
| `/mail/compose` | ComposePanel, MailRecipientInput, MailTemplateSelector, MailAIDraftPanel |
| `/projects/[projectId]/mail` | ProjectMailFilter, MailThreadList, MailEntityLinker |
| `/documents/[documentId]/submission-mail` | SubmissionMailComposer, MailSendChecklist, MailAttachmentList |
| `/findings/[findingId]/action-request-mail` | ActionRequestMailComposer, FindingMailTable, MailAttachmentList |
| `/mail/messages/[messageId]` | MailMessageHeader, MailBodyViewer, MailAttachmentSavePanel |
| `/settings/mail-accounts` | OAuthConnectCard, MailSyncStatusBadge, MailSyncLogPanel |
| `/settings/mail-templates` | MailTemplateEditor, MailSignatureEditor |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| MailAccountSelector | GET `/api/v1/mail/accounts` |
| OAuthConnectCard | POST `/api/v1/mail/oauth/google/start` |
| MailSyncStatusBadge | POST `/api/v1/mail/accounts/{accountId}/sync` |
| MailThreadList | GET `/api/v1/mail/threads` |
| MailDetailPane | GET `/api/v1/mail/messages/{messageId}` |
| MailEntityLinker | POST `/api/v1/mail/messages/{messageId}/link-entity` |
| MailAttachmentSavePanel | POST `/api/v1/mail/attachments/{attachmentId}/save-to-webhard` |
| ComposePanel | POST `/api/v1/mail/drafts`, POST `/api/v1/mail/drafts/{draftId}/send` |
| MailAIDraftPanel | POST `/api/v1/mail/drafts/{draftId}/generate` |
| MailSendChecklist | POST `/api/v1/mail/drafts/{draftId}/validate` |
| SubmissionMailComposer | POST `/api/v1/documents/{documentId}/submission-mail/draft` |
| ActionRequestMailComposer | POST `/api/v1/findings/action-request-mail/draft` |
| MaterialRequestMailComposer | POST `/api/v1/projects/{projectId}/material-request-mail/draft` |
| ScheduleCoordinationMailComposer | POST `/api/v1/inspection-rounds/{inspectionRoundId}/schedule-coordination-mail/draft` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET `/mail/accounts` | MailAccount |
| POST `/mail/accounts/{id}/sync` | MailSyncJob, MailThread, MailMessage |
| GET `/mail/threads` | MailThread, MailEntityLink |
| GET `/mail/messages/{id}` | MailMessage, MailAttachment |
| POST `/mail/messages/{id}/classify` | MailEntityLink, Project, Contact |
| POST `/mail/drafts` | MailDraft |
| POST `/mail/drafts/{id}/generate` | MailDraft, MailTemplate |
| POST `/mail/drafts/{id}/send` | MailMessage, MailThread, AuditLog |
| POST `/attachments/{id}/save-to-webhard` | MailAttachment, FileAsset, Folder |
| POST `/documents/{id}/submission-mail/draft` | DocumentInstance, FileAsset, Submission, MailDraft |
| POST `/findings/action-request-mail/draft` | Finding, EvidencePhoto, MailDraft |
| POST `/mail/templates` | MailTemplate |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| MailDraft | mail-draft-and-classification |
| MailMessage | mail-draft-and-classification |
| MailAttachment | mail-draft-and-classification |
| DocumentInstance | mail-draft-and-classification |
| Finding | mail-draft-and-classification |
| FileAsset | mail-draft-and-classification |
| Submission | mail-draft-and-classification |
| Project | mail-draft-and-classification |
| Contact | mail-draft-and-classification |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| guest 계정 생성 | test_mail_account_guest_create |
| OAuth 시작 | test_mail_oauth_start_returns_auth_url |
| 메일 sync | test_mail_sync_creates_threads_and_messages |
| 제목 기반 프로젝트 분류 | test_mail_project_classification_by_subject |
| 연락처 기반 프로젝트 분류 | test_mail_project_classification_by_contact_email |
| 보고서 제출 초안 | test_mail_draft_create_report_submission |
| 제출파일 필수 | test_mail_draft_report_submission_requires_exported_file |
| 조치요청 지적사항 필수 | test_mail_draft_action_request_requires_findings |
| 수신자 검증 | test_mail_draft_validate_recipients |
| 연결 모드 발송 | test_mail_send_connected_mode_success |
| guest mode 발송 차단 | test_mail_send_guest_mode_blocked_or_copy_only |
| 첨부 웹하드 저장 | test_mail_attachment_save_to_webhard |
| 첨부 중복 버전 | test_mail_attachment_duplicate_creates_file_version |
| 제출 이력 생성 | test_report_submission_mail_creates_submission |
| 문서 상태 업데이트 | test_report_submission_mail_updates_document_status |
| 지적사항 상태 업데이트 | test_action_request_mail_updates_finding_status |
| 엔티티 연결 확정 | test_mail_message_link_entity_confirmed |
| 템플릿 변수 매핑 | test_mail_template_variable_mapping |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, Contact, Organization |
| 계약/견적 | 계약서/견적서 발송 메일, finalFileId |
| 점검회차/일정 | 일정협의 메일, inspectionRoundId |
| 보고서 자동화 | DocumentInstance 제출 메일, exportedFileId |
| 체크리스트 | 자료요청/점검 준비 메일 |
| 지적사항/조치현황 | 조치요청 메일, Finding 상태 변경 |
| 산업안전보건관리비 | 사용내역서 요청/첨부 저장 |
| 웹하드 | 첨부파일 저장, FileAsset 연결 |
| 결재/제출 | Submission 생성/갱신 |
| 관리자/템플릿 | MailTemplate, Signature, OAuth 설정 |
| 대시보드 | 미확인 메일, 미저장 첨부, 미제출 메일 |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 메일과 프로젝트 오연결 | suggested/confirmed/rejected 링크 상태 분리 |
| 첨부파일 웹하드 저장 누락 | 미저장 첨부 warning 및 저장 패널 제공 |
| 보고서 제출 메일에 최종본 누락 | report_submission validation에서 차단 |
| OAuth 미연결 상태 발송 혼동 | guest mode에서는 발송 대신 초안 복사만 제공 |
| AI가 없는 첨부파일을 언급 | attachment checklist 기반 본문 생성 |
| 발주처별 문서 첨부 혼동 | ownerPartyId 검증 및 owner_mismatch warning |
| 제출 이력 누락 | send 후 Submission 자동 생성/갱신 |
| 조치요청 발송 후 Finding 상태 미변경 | action_request send hook에서 상태 업데이트 |
| 메일 sync 중복 | providerMessageId/providerThreadId unique 처리 |


---

## FILE: `docs/aec-erp/11-mailbox/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 메일 초안 작성 및 분류

## Prompt ID

`mail-draft-and-classification`

## 목적

프로젝트, 점검회차, 발주처, 문서, 지적사항, 첨부파일 정보를 바탕으로 업무 메일 초안을 작성하고, 수신/발신 메일을 ERP 엔티티와 연결할 후보를 추천한다.

## Prompt

```text
너는 A&C기술사 ERP의 프로젝트 메일 작성 및 분류 보조 엔진이다.

입력:
- mailPurpose
- project
- inspectionRound
- ownerParty
- contractorOrganization
- contacts
- documentInstance
- submission
- findings
- correctiveActions
- fileAssets
- mailThread
- mailMessage
- userInstruction
- senderProfile
- mailTemplate

메일 목적:
- report_submission: 보고서 제출
- action_request: 지적사항 조치요청
- material_request: 자료요청
- schedule_coordination: 점검 일정협의
- contract_estimate: 계약서/견적서 발송
- safety_cost_request: 산업안전보건관리비 자료요청
- approval_request: 내부 검토/승인 요청
- general_reply: 일반 회신

해야 할 일:
1. 메일 목적에 맞는 제목을 작성한다.
2. 공손하고 실무적인 한국어 본문을 작성한다.
3. 프로젝트명, 점검회차, 점검일, 발주처명, 문서번호를 정확히 반영한다.
4. 첨부파일 목록을 본문에 명확히 표시한다.
5. 지적사항 조치요청 메일이면 지적사항 표를 작성한다.
6. 자료요청 메일이면 요청자료 목록과 제출기한을 구분한다.
7. 보고서 제출 메일이면 제출 문서와 검토 요청사항을 구분한다.
8. 수신자/참조자 후보를 연락처 기준으로 추천한다.
9. 첨부파일 누락, 수신자 누락, 발주처 불일치, 문서 상태 미확정은 warnings에 표시한다.
10. 수신/발신 메일 분류 요청이면 연결 가능한 Project, InspectionRound, DocumentInstance, Finding, Submission 후보를 추천한다.

작성 규칙:
- 입력에 없는 날짜, 파일명, 금액, 담당자명을 만들지 않는다.
- 첨부파일이 없으면 첨부했다고 쓰지 않는다.
- 조치가 확인되지 않았으면 조치완료라고 쓰지 않는다.
- 최종본이 아닌 파일은 최종본이라고 쓰지 않는다.
- 발주처가 다른 문서나 파일을 섞지 않는다.
- 지나치게 장황하지 않게 실무 메일 문체로 작성한다.
- 발송 전 사용자 검토가 필요하다는 전제를 유지한다.

출력 JSON:
{
  "mailPurpose": "report_submission | action_request | material_request | schedule_coordination | contract_estimate | safety_cost_request | approval_request | general_reply",
  "subject": "",
  "bodyText": "",
  "to": [
    {
      "name": "",
      "email": "",
      "contactId": null,
      "reason": ""
    }
  ],
  "cc": [],
  "attachmentsChecklist": [
    {
      "fileId": "",
      "fileName": "",
      "required": true,
      "included": true,
      "reason": ""
    }
  ],
  "entityLinks": [
    {
      "entityType": "project | inspection_round | document_instance | finding | corrective_action | safety_cost_usage | contract | estimate | file_asset | submission",
      "entityId": "",
      "confidence": 0.0,
      "reason": ""
    }
  ],
  "webhardSaveRecommendations": [
    {
      "attachmentId": "",
      "recommendedFolderPath": "",
      "recommendedTags": [],
      "reason": ""
    }
  ],
  "warnings": [
    {
      "type": "missing_recipient | missing_attachment | owner_mismatch | document_not_exported | file_not_final | unverified_action | missing_due_date | classification_uncertain",
      "severity": "info | warning | danger",
      "message": ""
    }
  ]
}
```

## 보고서 제출 메일 작성 기준

제목 예시:

```text
[삼성문화재단] 제1회 리움미술관 승강기 교체공사 공사안전보건대장 이행점검 결과보고서 제출
```

본문 구조:

```text
안녕하세요.

{projectName} 관련하여 제{roundNo}회 공사안전보건대장 이행점검 결과보고서를 제출드립니다.

- 점검일: {inspectionDate}
- 제출문서: {documentTitle}
- 첨부파일: {fileNames}

검토 후 의견 있으시면 회신 부탁드립니다.

감사합니다.
{senderSignature}
```

## 조치요청 메일 작성 기준

지적사항 표:

| 번호 | 지적사항 | 요청 조치내용 | 조치기한 | 비고 |
|---:|---|---|---|---|

조치요청 본문은 조치가 필요한 상태임을 분명히 하되, 과도한 표현을 피한다.

## 분류 기준

메일 제목이나 본문에 다음이 있으면 연결 후보로 추천한다.

- 프로젝트명 또는 현장명
- 문서번호
- 제N회 점검
- 발주처명
- 시공사명
- 파일명
- 지적사항 제목
- 산업안전보건관리비
- 계약서/견적서

## 금지사항

- 존재하지 않는 첨부파일을 포함하지 않는다.
- 발송 완료를 가정하지 않는다.
- 회신이 온 것으로 가정하지 않는다.
- 법적 판단이나 책임 소재를 임의로 단정하지 않는다.
- 사용자가 지정하지 않은 외부 수신자를 만들어내지 않는다.


---

## FILE: `docs/aec-erp/11-mailbox/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 메일함

## Prompt

```text
You are implementing the Mailbox module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module integrates the apps-style 3-pane mailbox shell with project communication, report submission, action request mails, material request mails, schedule coordination, contract/estimate send mails, attachment save-to-webhard, and submission history.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- Mail MVP: guest draft mode and mock mail provider
- Mail V1: Google OAuth/Gmail adapter behind provider interface
- API namespace: /api/v1

Implement only the Mailbox module.

Existing concepts:
- Project
- Organization
- ProjectParty
- Contact
- InspectionRound
- InspectionOwnerReportTask
- DocumentInstance
- FileAsset
- Folder
- Finding
- CorrectiveAction
- Contract
- Estimate
- Submission
- AuditLog

Required backend models:
- MailAccount
- MailThread
- MailMessage
- MailAddress
- MailAttachment
- MailDraft
- MailEntityLink
- MailTemplate
- MailSignature
- MailSyncJob
- MailProviderEvent

Required backend APIs:

Mail Accounts:
- GET /api/v1/mail/accounts
- POST /api/v1/mail/accounts/guest
- GET /api/v1/mail/accounts/{accountId}
- PATCH /api/v1/mail/accounts/{accountId}
- DELETE /api/v1/mail/accounts/{accountId}
- POST /api/v1/mail/oauth/google/start
- GET /api/v1/mail/oauth/google/callback
- POST /api/v1/mail/accounts/{accountId}/disconnect
- POST /api/v1/mail/accounts/{accountId}/sync
- GET /api/v1/mail/accounts/{accountId}/sync-jobs

Threads and Messages:
- GET /api/v1/mail/threads
- GET /api/v1/mail/threads/{threadId}
- PATCH /api/v1/mail/threads/{threadId}
- POST /api/v1/mail/threads/{threadId}/archive
- GET /api/v1/mail/messages
- GET /api/v1/mail/messages/{messageId}
- PATCH /api/v1/mail/messages/{messageId}
- POST /api/v1/mail/messages/{messageId}/mark-read
- POST /api/v1/mail/messages/{messageId}/link-entity
- POST /api/v1/mail/messages/{messageId}/classify

Draft and Send:
- POST /api/v1/mail/drafts
- GET /api/v1/mail/drafts/{draftId}
- PATCH /api/v1/mail/drafts/{draftId}
- POST /api/v1/mail/drafts/{draftId}/generate
- POST /api/v1/mail/drafts/{draftId}/validate
- POST /api/v1/mail/drafts/{draftId}/send
- POST /api/v1/mail/send

Attachments:
- GET /api/v1/mail/messages/{messageId}/attachments
- POST /api/v1/mail/attachments/{attachmentId}/save-to-webhard
- POST /api/v1/mail/attachments/save-bulk-to-webhard
- POST /api/v1/mail/attachments/{attachmentId}/link-file

Context-specific Drafts:
- POST /api/v1/documents/{documentId}/submission-mail/draft
- POST /api/v1/findings/action-request-mail/draft
- POST /api/v1/projects/{projectId}/material-request-mail/draft
- POST /api/v1/inspection-rounds/{inspectionRoundId}/schedule-coordination-mail/draft
- POST /api/v1/contracts/{contractId}/send-mail/draft
- POST /api/v1/estimates/{estimateId}/send-mail/draft

Templates and Signatures:
- GET /api/v1/mail/templates
- POST /api/v1/mail/templates
- GET /api/v1/mail/templates/{templateId}
- PATCH /api/v1/mail/templates/{templateId}
- DELETE /api/v1/mail/templates/{templateId}
- GET /api/v1/mail/signatures
- POST /api/v1/mail/signatures
- PATCH /api/v1/mail/signatures/{signatureId}

Required frontend routes:
- /mail
- /mail/inbox
- /mail/sent
- /mail/drafts
- /mail/compose
- /mail/threads/[threadId]
- /mail/messages/[messageId]
- /mail/accounts
- /mail/settings
- /projects/[projectId]/mail
- /projects/[projectId]/mail/compose
- /inspections/[inspectionRoundId]/mail
- /documents/[documentId]/submission-mail
- /findings/[findingId]/action-request-mail
- /contracts/[contractId]/send-mail
- /settings/mail-accounts
- /settings/mail-templates

Required frontend components:
- MailboxShell
- MailLeftPane
- MailAccountSelector
- MailFolderList
- ProjectMailFilter
- MailSearchBar
- MailThreadList
- MailMessageListItem
- MailDetailPane
- MailBodyViewer
- MailAttachmentList
- MailAttachmentSavePanel
- MailProjectLinker
- MailEntityLinker
- ComposePanel
- MailRecipientInput
- MailTemplateSelector
- MailAIDraftPanel
- MailSendChecklist
- SubmissionMailComposer
- ActionRequestMailComposer
- MaterialRequestMailComposer
- ScheduleCoordinationMailComposer
- ContractEstimateMailComposer
- OAuthConnectCard
- MailSyncStatusBadge
- MailSyncLogPanel
- MailSignatureEditor
- MailTemplateEditor

Business requirements:
1. Mailbox must support guest draft mode without OAuth.
2. Connected OAuth mode must use a MailProvider adapter interface.
3. Mail messages can link to Project, InspectionRound, DocumentInstance, Finding, CorrectiveAction, Contract, Estimate, FileAsset, and Submission.
4. Mail classification must produce suggested links, but user confirmation is required.
5. Report submission mail draft requires DocumentInstance and exported FileAsset.
6. Sending report submission mail must create or update Submission.
7. Sending report submission mail must update DocumentInstance.status and OwnerReportTask.status to submitted.
8. Action request mail draft requires at least one Finding.
9. Sending action request mail must update Finding.status to action_requested.
10. Attachments can be saved to Webhard as FileAsset and linked back to MailAttachment.
11. Duplicate attachment filenames should create FileVersion or use rename policy.
12. AI-generated mail drafts are draft only and require user review before send.
13. All send, sync, attachment-save, and link actions should create AuditLog.

Seed data:
- Create a guest mail account.
- Create mail templates for report_submission, action_request, material_request, schedule_coordination, contract_estimate, safety_cost_request.
- Create demo report submission draft for Leeum elevator replacement project, round 1, Samsung Cultural Foundation.
- Create demo action request draft for findings in round 1.

Validation:
1. subject is required.
2. at least one recipient is required.
3. report_submission requires documentId and attachmentFileIds.
4. action_request requires findingIds.
5. guest mode cannot call provider send; it can export/copy draft only.
6. attachment save-to-webhard requires projectId and folderId.
7. submitted status requires MailMessage or manual submission record.

Tests:
- test_mail_account_guest_create
- test_mail_oauth_start_returns_auth_url
- test_mail_sync_creates_threads_and_messages
- test_mail_project_classification_by_subject
- test_mail_project_classification_by_contact_email
- test_mail_draft_create_report_submission
- test_mail_draft_report_submission_requires_exported_file
- test_mail_draft_action_request_requires_findings
- test_mail_draft_validate_recipients
- test_mail_send_connected_mode_success
- test_mail_send_guest_mode_blocked_or_copy_only
- test_mail_attachment_save_to_webhard
- test_mail_attachment_duplicate_creates_file_version
- test_report_submission_mail_creates_submission
- test_report_submission_mail_updates_document_status
- test_action_request_mail_updates_finding_status
- test_mail_message_link_entity_confirmed
- test_mail_template_variable_mapping

Deliverables:
- Backend models and repositories
- Mail provider interface and mock provider
- Backend API routes and services
- Mail classification service
- Mail draft generation service
- Attachment save-to-webhard service
- Submission integration service
- Frontend mailbox 3-pane shell
- Compose and context-specific mail pages
- API client functions
- Type definitions
- Tests
- README note for this module
```


---

## FILE: `docs/aec-erp/11-mailbox/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 메일함

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "메일함" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 프로젝트, 점검회차, 보고서, 지적사항, 웹하드, 제출 이력을 통합 관리하는 ERP
- 메일함은 단순 이메일 클라이언트가 아니라 프로젝트 커뮤니케이션과 제출 증빙을 관리하는 업무 화면
- apps의 메일함처럼 3-pane shell을 사용하되, ERP의 프로젝트/문서/파일/제출 이력과 강하게 연결한다.

화면 1: 통합 메일함
- 좌측 pane:
  - 계정 선택
  - 받은편지함
  - 보낸메일함
  - 임시보관함
  - 중요
  - 미분류
  - 프로젝트별 필터
  - 발주처별 필터
- 중앙 pane:
  - 메일 thread list
  - 보낸 사람
  - 제목
  - 프로젝트 badge
  - 연결 엔티티 badge
  - 첨부파일 아이콘
  - 시간
- 우측 pane:
  - 메일 상세
  - 본문
  - 첨부파일
  - 프로젝트 연결 패널
  - 첨부파일 웹하드 저장 패널
  - 회신/전달 버튼

화면 2: 프로젝트별 메일
- 상단 프로젝트 요약 헤더
- 점검회차 필터
- 발주처 필터
- 문서/지적사항/제출 이력 필터
- 메일 목록에는 연결된 DocumentInstance, Finding, Submission badge를 표시
- 미분류 메일과 미저장 첨부파일을 경고 카드로 표시

화면 3: 메일 작성
- 우측 drawer 또는 full-screen compose panel
- 목적 선택:
  - 보고서 제출
  - 지적사항 조치요청
  - 자료요청
  - 일정협의
  - 계약/견적 발송
  - 일반 회신
- 템플릿 선택
- AI 초안 생성 버튼
- 수신자/참조자 입력
- 제목 입력
- 본문 editor
- 첨부파일 선택
- 발송 전 체크리스트

화면 4: 보고서 제출 메일
- 문서 정보 카드:
  - 문서번호
  - 회차
  - 점검일
  - 발주처
  - 문서 상태
- 최종본 파일 카드
- 수신자 확인 카드
- 제출 메일 본문
- 제출 후 Submission 생성 안내
- 발송 버튼 또는 guest mode에서는 초안 복사 버튼

화면 5: 조치요청 메일
- 지적사항 표를 중심으로 구성
- 각 지적사항에는 제목, 요청 조치내용, 조치기한, 지적사진 수를 표시
- 시공사 담당자 선택
- 첨부사진 표시
- 조치요청 메일 본문
- 발송 후 Finding 상태 변경 안내

화면 6: 첨부파일 웹하드 저장 패널
- 첨부파일별 카드
- 저장 상태 badge: 미저장 / 저장중 / 저장됨 / 실패
- 추천 프로젝트
- 추천 폴더
- 추천 태그
- 저장 위치 변경 버튼
- 웹하드에서 보기 버튼

화면 7: 메일 계정 설정
- Guest draft mode 카드
- Google OAuth 연결 카드
- 연결된 계정 목록
- 마지막 동기화 시간
- 동기화 오류 상태
- 서명 편집
- 메일 템플릿 관리

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- 메일함은 정보 밀도가 높지만 3-pane으로 명확하게 구분
- 프로젝트 badge와 연결 엔티티 badge를 잘 보이게 표시
- 제출/최종본/첨부누락 같은 상태는 명확한 색상 badge 사용
- OAuth 미연결 상태는 회색/주황색 안내 카드로 표시
- 첨부파일 웹하드 저장은 파일관리자 느낌과 일관되게 디자인
- 한글 가독성을 최우선으로 한다.

상태 표현:
- connected: green
- guest: gray
- sync_error: red
- unread: bold
- suggested link: blue outline
- confirmed link: green
- missing attachment: orange
- send failed: red
- submitted: green
- draft: gray

결과물:
- 통합 메일함 3-pane 화면
- 프로젝트별 메일 화면
- 메일 작성 drawer
- 보고서 제출 메일 화면
- 지적사항 조치요청 메일 화면
- 첨부파일 웹하드 저장 패널
- 메일 계정 설정 화면
```


---

## FILE: `docs/aec-erp/11-mailbox/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 메일함

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
메일함

기능 설명:
메일함은 A&C 기술사 ERP 안에서 프로젝트별 업무 메일을 관리하고, 발주처별 보고서 제출, 시공사 조치요청, 자료요청, 일정협의, 계약/견적 발송, 첨부파일 웹하드 저장, 제출 이력 연결을 수행하는 3-pane 업무 메일 기능이다.

업무 맥락:
- 메일은 Project와 연결될 수 있다.
- 메일은 InspectionRound, DocumentInstance, Finding, Contract, Estimate, SafetyCostUsage, FileAsset, Submission과 연결될 수 있다.
- 보고서 제출 메일은 DocumentInstance.exportedFileId를 첨부하고 Submission을 생성해야 한다.
- 조치요청 메일은 Finding 목록과 지적사진을 포함하고 발송 후 Finding.status를 action_requested로 변경할 수 있다.
- 첨부파일은 웹하드에 저장되고 FileAsset으로 연결되어야 한다.
- OAuth 미연결 상태에서는 guest draft mode로 초안 작성만 지원한다.
- OAuth 연결 상태에서는 sync/send를 provider adapter로 처리한다.
- AI 초안은 사용자가 검토해야 하며 자동 발송되면 안 된다.

입력:
{
  "featureName": "메일함",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "oauthRequirements": [],
  "submissionRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `mailbox.project_communication`으로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 계약/견적
    - 점검회차/일정
    - 공사안전보건대장 이행확인 보고서 자동화
    - 지적사항/조치현황
    - 산업안전보건관리비
    - 웹하드
    - 결재/제출
    - 관리자/템플릿
    - 대시보드

출력 JSON:
{
  "featureId": "mailbox.project_communication",
  "featureName": "메일함",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /mail
- /mail/inbox
- /mail/sent
- /mail/drafts
- /mail/compose
- /mail/threads/[threadId]
- /mail/messages/[messageId]
- /mail/accounts
- /mail/settings
- /projects/[projectId]/mail
- /projects/[projectId]/mail/compose
- /inspections/[inspectionRoundId]/mail
- /documents/[documentId]/submission-mail
- /findings/[findingId]/action-request-mail
- /contracts/[contractId]/send-mail
- /settings/mail-accounts
- /settings/mail-templates

반드시 포함할 models:
- MailAccount
- MailThread
- MailMessage
- MailAddress
- MailAttachment
- MailDraft
- MailEntityLink
- MailTemplate
- MailSignature
- MailSyncJob
- Project
- Contact
- DocumentInstance
- FileAsset
- Finding
- Submission
- AuditLog

반드시 포함할 prompts:
- mail-draft-and-classification
- mailbox implementation prompt
- mailbox design prompt

반드시 포함할 tests:
- test_mail_account_guest_create
- test_mail_oauth_start_returns_auth_url
- test_mail_sync_creates_threads_and_messages
- test_mail_project_classification_by_subject
- test_mail_project_classification_by_contact_email
- test_mail_draft_create_report_submission
- test_mail_draft_report_submission_requires_exported_file
- test_mail_draft_action_request_requires_findings
- test_mail_draft_validate_recipients
- test_mail_send_connected_mode_success
- test_mail_send_guest_mode_blocked_or_copy_only
- test_mail_attachment_save_to_webhard
- test_mail_attachment_duplicate_creates_file_version
- test_report_submission_mail_creates_submission
- test_report_submission_mail_updates_document_status
- test_action_request_mail_updates_finding_status
- test_mail_message_link_entity_confirmed
- test_mail_template_variable_mapping

주의:
- 메일은 Project 없이도 존재할 수 있지만, 업무 메일은 가능한 projectId 연결을 추천해야 한다.
- 추천 연결은 자동 확정하지 말고 사용자가 확인해야 한다.
- 보고서 제출 메일은 최종본 FileAsset 없이는 발송하면 안 된다.
- guest mode에서는 실제 발송을 수행하지 않는다.
- 첨부파일 웹하드 저장은 MailAttachment와 FileAsset을 양방향 연결해야 한다.
- AI가 존재하지 않는 첨부파일이나 수신자를 만들지 않도록 한다.
- 발주처별 문서와 수신자가 서로 맞는지 ownerPartyId를 검증해야 한다.
- 발송/동기화/첨부 저장/제출 이력 생성은 AuditLog를 남겨야 한다.
```


---

## FILE: `docs/aec-erp/12-approval-signature-submission/README.md`

# 기능 12 — 결재/서명/제출

이 폴더는 A&C 기술사 ERP의 열두 번째 기능인 `결재/서명/제출` 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

결재/서명/제출은 A&C ERP에서 문서 초안이 최종 제출본이 되기까지의 내부 통제와 외부 제출 이력을 관리하는 기능이다.

```text
DocumentInstance
→ ApprovalWorkflow
→ ApprovalStep
→ SignatureTask
→ FinalDocumentPackage
→ Submission
→ MailThread / FileAsset / Webhard
```

## 핵심 설계 포인트

- 문서 초안과 최종본을 구분한다.
- 내부 검토, 기술사 확인, 서명/날인, 발주처 제출을 단계별로 관리한다.
- 공사안전보건대장 이행확인 보고서처럼 발주처별 제출이 필요한 문서는 `ownerPartyId` 기준 제출 이력을 분리한다.
- 제출 전 필수 누락정보, 최신 저장본 여부, 최종본 파일, 날인본 파일, 수신자, 첨부파일을 검증한다.
- 제출은 메일함의 MailThread/MailMessage와 웹하드 FileAsset에 연결된다.
- 반려/수정 요청은 문서 버전과 결재 이력에 남긴다.
- 수동 제출과 메일 제출을 모두 지원한다.


---

## FILE: `docs/aec-erp/12-approval-signature-submission/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 결재/서명/제출

## 1. 기능 정의

결재/서명/제출은 A&C 기술사 ERP에서 문서가 초안 상태에서 내부 검토, 기술사 승인, 서명/날인 확인, 최종본 패키징, 발주처별 제출, 제출 확인, 보관 상태로 이동하는 전 과정을 관리하는 기능이다.

이 기능은 단순 결재 버튼이 아니라 다음 업무를 하나의 흐름으로 묶는다.

```text
문서 검토
→ 반려/수정 요청
→ 기술사 확인
→ 서명/날인 확인
→ 최종본 export
→ 제출 패키지 구성
→ 메일 제출 또는 수동 제출
→ 제출 이력 저장
→ 발주처 확인
→ 보관
```

## 2. 이 기능이 필요한 이유

A&C 기술사 업무에서 최종 문서는 발주처 제출 증빙이 된다. 따라서 문서가 단순히 생성되었다는 사실만으로는 부족하고, 다음 정보가 남아야 한다.

- 누가 검토했는지
- 누가 반려했는지
- 어떤 의견으로 수정 요청했는지
- 기술사 확인이 완료되었는지
- 서명 또는 날인본이 있는지
- 최종 제출본 파일이 무엇인지
- 어느 발주처에 제출했는지
- 어떤 메일로 제출했는지
- 어떤 첨부파일이 제출되었는지
- 발주처 확인 또는 회신이 있었는지
- 최종본이 웹하드 어디에 보관되어 있는지

특히 공사안전보건대장 이행확인 보고서는 같은 점검회차라도 삼성문화재단, 삼성생명공익재단처럼 발주처별 제출본이 다를 수 있으므로 발주처별 제출 이력이 필수다.

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 대표/건설안전기술사 | 최종 검토, 승인, 서명/날인 확인 |
| 상무/점검 담당자 | 점검 결과 반영 여부 확인, 수정 요청 처리 |
| 문서 작성자 | 결재 요청, 최종본 export, 제출 패키지 구성 |
| 계약/행정 담당자 | 발주처 제출, 메일 발송, 제출 이력 관리 |
| 발주처 담당자 | 제출본 수신, 확인, 회신 |
| 관리자 | 결재선, 서명/날인 정책, 제출 채널 관리 |

## 4. 대상 문서

결재/서명/제출 기능은 다음 문서 유형을 공통으로 지원한다.

| 문서 유형 | 결재/제출 필요성 |
|---|---|
| 공사안전보건대장 이행확인 보고서 | 발주처별 제출, 기술사 확인, 최종본 관리 |
| 안전관리계획서 | 기술사 검토, 최종본 제출, 개정본 관리 |
| 안전보건대장 | 프로젝트 단위 대장 확정, 제출/보관 관리 |
| 사진대지 | 보고서 첨부 또는 별도 제출 |
| 산업안전보건관리비 확인 자료 | 보고서 첨부/근거자료 제출 |
| 기술용역계약서 | 내부 확인, 날인본 보관, 발송 이력 |
| 견적서 | 발주처 발송, 계약 전환 이력 |

## 5. 핵심 기능

### 5.1 결재 요청

문서 작성자는 문서 초안 또는 검토본에 대해 결재 요청을 생성한다.

필수 정보:

```text
문서 ID
결재 유형
결재선
요청자
요청 의견
첨부파일
마감일
```

결재 유형:

```text
internal_review
engineer_approval
final_confirmation
contract_review
submission_approval
```

### 5.2 결재선 관리

기본 결재선 예시:

```text
문서 작성자 작성 완료
→ 상무/점검 담당자 검토
→ 건설안전기술사 최종 확인
→ 행정 담당자 제출 처리
```

문서 유형별로 결재선이 다를 수 있다.

예시:

| 문서 | 기본 결재선 |
|---|---|
| 이행확인 보고서 | 작성자 → 점검 담당자 → 기술사 → 제출 담당자 |
| 안전관리계획서 | 작성자 → 기술사 → 제출 담당자 |
| 계약서 | 계약 담당자 → 대표/기술사 → 날인 담당자 |
| 사진대지 | 작성자 → 점검 담당자 → 보고서 반영 |

### 5.3 승인/반려/수정 요청

결재자는 다음 액션을 할 수 있다.

```text
approve
reject
request_changes
delegate
cancel
```

반려 또는 수정 요청 시 다음을 입력한다.

- 의견
- 수정 대상 섹션
- 관련 파일
- 재요청 필요 여부

### 5.4 서명/날인 관리

문서 유형별로 서명 또는 날인 필요 여부를 관리한다.

서명/날인 방식:

```text
manual_upload: 날인본 파일 업로드
signature_asset: 등록된 서명 이미지 적용
seal_asset: 등록된 직인 이미지 적용
external_signed_file: 외부에서 받은 서명본 업로드
not_required: 필요 없음
```

주의:

- 법적 효력 있는 전자서명 서비스가 아니라 업무상 서명/날인 상태 관리로 설계한다.
- 실제 전자서명 API 연동은 V2 확장으로 둔다.

### 5.5 제출 패키지 구성

제출 전 문서와 첨부파일을 하나의 제출 패키지로 묶는다.

패키지 구성 예시:

```text
제1회 공사안전보건대장 이행확인 보고서 PDF
제1회 공사안전보건대장 이행확인 보고서 HWPX
사진대지
산업안전보건관리비 사용내역서
공사일정 첨부자료
조치현황 증빙사진
```

### 5.6 제출 채널

지원 채널:

```text
mail
manual
webhard_share
external_portal
in_person
```

채널별 처리:

| 채널 | 설명 |
|---|---|
| mail | 메일함에서 제출 메일 발송, MailThread 연결 |
| manual | 사용자가 외부에서 제출 후 제출일/증빙 수동 등록 |
| webhard_share | 웹하드 공유 링크 생성 후 전달 |
| external_portal | 외부 포털 제출 사실 수동 기록 |
| in_person | 대면 제출 또는 우편 제출 기록 |

### 5.7 발주처별 제출 이력

공사안전보건대장 이행확인 보고서는 발주처별 제출 이력이 필요하다.

예시:

```text
제1회 점검
├── 삼성문화재단 보고서: 제출 완료
└── 삼성생명공익재단 보고서: 제출 완료
```

각 제출 이력은 다음을 가진다.

- ownerPartyId
- documentId
- finalFileId
- submittedAt
- recipient list
- mailThreadId
- submissionStatus
- confirmedAt
- confirmationMemo

### 5.8 제출 전 검증

제출 전 체크리스트:

```text
문서 상태가 confirmed 또는 exported인가?
필수 결재 단계가 완료되었는가?
서명/날인 필요 문서의 서명본이 있는가?
최종본 파일이 생성되었는가?
파일이 웹하드 최종본 폴더에 저장되었는가?
발주처 수신자가 설정되었는가?
첨부파일 누락이 없는가?
원본 데이터 변경 경고가 없는가?
제출 메일 제목/본문이 작성되었는가?
```

### 5.9 제출 후 상태 갱신

제출 완료 시 다음 상태를 갱신한다.

```text
DocumentInstance.status = submitted
OwnerReportTask.status = submitted
Submission.status = sent 또는 submitted
FileAsset tag = submitted
MailThread linked
ProjectActivityLog 생성
AuditLog 생성
```

### 5.10 제출 확인/회신 관리

발주처가 확인 또는 회신한 경우 다음 정보를 기록한다.

- 확인일
- 확인자
- 회신 메일
- 보완 요청 여부
- 보완 요청 내용
- 재제출 필요 여부

## 6. 상태 흐름

### 문서 제출 상태

```text
draft
→ review_requested
→ in_review
→ changes_requested
→ approved
→ signature_required
→ signed
→ exported
→ submission_ready
→ submitted
→ confirmed_by_owner
→ archived
```

### 결재 단계 상태

```text
pending
→ active
→ approved
→ rejected
→ changes_requested
→ skipped
→ cancelled
```

### 제출 상태

```text
draft
→ ready
→ sent
→ submitted
→ confirmed
→ revision_requested
→ resubmitted
→ archived
```

## 7. 완료 기준

- 문서별 결재 요청을 생성할 수 있다.
- 문서 유형별 결재선을 적용할 수 있다.
- 승인, 반려, 수정 요청을 기록할 수 있다.
- 기술사 확인 완료 여부를 표시할 수 있다.
- 서명/날인 필요 여부와 파일을 관리할 수 있다.
- 최종본 제출 패키지를 구성할 수 있다.
- 발주처별 제출 이력을 분리해서 저장할 수 있다.
- 메일함 제출 메일과 Submission을 연결할 수 있다.
- 웹하드 최종본 파일과 Submission을 연결할 수 있다.
- 제출 후 확인/보완요청/재제출 이력을 관리할 수 있다.


---

## FILE: `docs/aec-erp/12-approval-signature-submission/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 결재/서명/제출

## 1. Frontend Routes

```text
/approvals
/approvals/inbox
/approvals/requested
/approvals/[approvalWorkflowId]

/documents/[documentId]/approval
/documents/[documentId]/signing
/documents/[documentId]/submission
/documents/[documentId]/submission/new

/projects/[projectId]/submissions
/projects/[projectId]/submissions/new
/submissions/[submissionId]
/submissions/[submissionId]/edit
/submissions/[submissionId]/confirmation

/admin/approval-templates
/admin/approval-templates/[templateId]
/admin/signature-assets
/admin/signature-assets/[assetId]
```

## 2. Frontend Components

```text
ApprovalInboxPage
ApprovalWorkflowDetailPage
DocumentApprovalPage
DocumentSigningPage
DocumentSubmissionPage
SubmissionDetailPage
ApprovalTemplateAdminPage
SignatureAssetAdminPage

ApprovalWorkflowTable
ApprovalWorkflowCard
ApprovalStatusBadge
ApprovalStepper
ApprovalStepCard
ApprovalActionPanel
ApprovalCommentThread
ApprovalRequestModal
ApprovalRejectModal
ChangeRequestPanel
ApprovalHistoryTimeline

SignatureRequirementPanel
SignatureTaskTable
SignatureTaskCard
SignatureAssetPicker
SealAssetPicker
SignedFileUploader
SigningStatusBadge

SubmissionReadinessPanel
SubmissionPackageBuilder
SubmissionAttachmentTable
SubmissionRecipientTable
SubmissionChannelSelector
SubmissionMailDraftPanel
SubmissionChecklist
SubmissionHistoryTimeline
OwnerSubmissionMatrix
SubmissionStatusBadge
WebhardFinalFileCard
MailSubmissionLinkCard
```

## 3. Backend APIs

### Approval Workflows

```text
GET    /api/v1/approvals
GET    /api/v1/approvals/inbox
POST   /api/v1/approval-workflows
GET    /api/v1/approval-workflows/{workflowId}
PATCH  /api/v1/approval-workflows/{workflowId}
DELETE /api/v1/approval-workflows/{workflowId}

POST   /api/v1/documents/{documentId}/approval/request
GET    /api/v1/documents/{documentId}/approval
POST   /api/v1/approval-workflows/{workflowId}/cancel
POST   /api/v1/approval-workflows/{workflowId}/restart
```

### Approval Steps and Actions

```text
GET   /api/v1/approval-workflows/{workflowId}/steps
POST  /api/v1/approval-workflows/{workflowId}/steps
PATCH /api/v1/approval-steps/{stepId}

POST  /api/v1/approval-steps/{stepId}/approve
POST  /api/v1/approval-steps/{stepId}/reject
POST  /api/v1/approval-steps/{stepId}/request-changes
POST  /api/v1/approval-steps/{stepId}/delegate
POST  /api/v1/approval-steps/{stepId}/skip
```

### Signature / Seal

```text
GET    /api/v1/signature-assets
POST   /api/v1/signature-assets
GET    /api/v1/signature-assets/{assetId}
PATCH  /api/v1/signature-assets/{assetId}
DELETE /api/v1/signature-assets/{assetId}

GET    /api/v1/documents/{documentId}/signature-tasks
POST   /api/v1/documents/{documentId}/signature-tasks
PATCH  /api/v1/signature-tasks/{taskId}
POST   /api/v1/signature-tasks/{taskId}/complete
POST   /api/v1/signature-tasks/{taskId}/waive
POST   /api/v1/documents/{documentId}/signed-files/upload
```

### Submission Packages

```text
GET   /api/v1/documents/{documentId}/submission-readiness
POST  /api/v1/documents/{documentId}/submission-packages
GET   /api/v1/submission-packages/{packageId}
PATCH /api/v1/submission-packages/{packageId}
POST  /api/v1/submission-packages/{packageId}/validate
POST  /api/v1/submission-packages/{packageId}/finalize
```

### Submissions

```text
GET    /api/v1/projects/{projectId}/submissions
POST   /api/v1/projects/{projectId}/submissions
GET    /api/v1/submissions/{submissionId}
PATCH  /api/v1/submissions/{submissionId}
DELETE /api/v1/submissions/{submissionId}

POST   /api/v1/submissions/{submissionId}/send-mail
POST   /api/v1/submissions/{submissionId}/mark-manual-submitted
POST   /api/v1/submissions/{submissionId}/confirm-owner-receipt
POST   /api/v1/submissions/{submissionId}/request-revision
POST   /api/v1/submissions/{submissionId}/resubmit
POST   /api/v1/submissions/{submissionId}/archive
```

### Templates

```text
GET    /api/v1/approval-templates
POST   /api/v1/approval-templates
GET    /api/v1/approval-templates/{templateId}
PATCH  /api/v1/approval-templates/{templateId}
DELETE /api/v1/approval-templates/{templateId}
POST   /api/v1/approval-templates/{templateId}/publish
```

## 4. Data Models

### ApprovalWorkflow

```ts
type ApprovalWorkflowStatus =
  | 'draft'
  | 'requested'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'

type ApprovalWorkflow = {
  id: string
  projectId: string
  documentId?: string
  documentType?: string
  ownerPartyId?: string
  workflowType:
    | 'internal_review'
    | 'engineer_approval'
    | 'final_confirmation'
    | 'contract_review'
    | 'submission_approval'
  title: string
  status: ApprovalWorkflowStatus
  requestedBy: string
  requestedAt?: string
  dueDate?: string
  completedAt?: string
  currentStepId?: string
  createdAt: string
  updatedAt: string
}
```

### ApprovalStep

```ts
type ApprovalStepStatus =
  | 'pending'
  | 'active'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'skipped'
  | 'cancelled'

type ApprovalStep = {
  id: string
  workflowId: string
  stepNo: number
  stepName: string
  approverUserId?: string
  approverRole?: 'writer' | 'inspector' | 'engineer' | 'admin' | 'contract_manager'
  status: ApprovalStepStatus
  action?: 'approve' | 'reject' | 'request_changes' | 'delegate' | 'skip'
  comment?: string
  actedBy?: string
  actedAt?: string
  delegatedTo?: string
  required: boolean
  createdAt: string
  updatedAt: string
}
```

### ApprovalComment

```ts
type ApprovalComment = {
  id: string
  workflowId: string
  stepId?: string
  documentId?: string
  sectionKey?: string
  authorId: string
  comment: string
  commentType: 'general' | 'change_request' | 'rejection_reason' | 'approval_note'
  resolved: boolean
  createdAt: string
}
```

### SignatureAsset

```ts
type SignatureAssetType = 'signature' | 'seal' | 'stamp' | 'name_text'

type SignatureAsset = {
  id: string
  ownerUserId?: string
  organizationId?: string
  assetType: SignatureAssetType
  displayName: string
  fileId?: string
  textValue?: string
  active: boolean
  usageScope: 'document' | 'contract' | 'report' | 'all'
  createdAt: string
  updatedAt: string
}
```

### SignatureTask

```ts
type SignatureTaskStatus = 'not_required' | 'pending' | 'completed' | 'waived' | 'rejected'

type SignatureTask = {
  id: string
  projectId: string
  documentId: string
  ownerPartyId?: string
  taskType: 'signature' | 'seal' | 'signed_file_upload' | 'external_confirmation'
  requiredByRole?: 'engineer' | 'representative' | 'owner' | 'contractor' | 'admin'
  requiredByName?: string
  status: SignatureTaskStatus
  signatureAssetId?: string
  signedFileId?: string
  completedBy?: string
  completedAt?: string
  waivedReason?: string
  createdAt: string
  updatedAt: string
}
```

### FinalDocumentPackage

```ts
type FinalDocumentPackageStatus = 'draft' | 'validated' | 'finalized' | 'submitted' | 'archived'

type FinalDocumentPackage = {
  id: string
  projectId: string
  documentId: string
  ownerPartyId?: string
  packageTitle: string
  status: FinalDocumentPackageStatus
  mainFileId: string
  signedFileId?: string
  attachmentFileIds: string[]
  webhardFolderId?: string
  validationWarnings: SubmissionValidationWarning[]
  finalizedAt?: string
  createdAt: string
  updatedAt: string
}
```

### Submission

```ts
type SubmissionChannel = 'mail' | 'manual' | 'webhard_share' | 'external_portal' | 'in_person'

type SubmissionStatus =
  | 'draft'
  | 'ready'
  | 'sent'
  | 'submitted'
  | 'confirmed'
  | 'revision_requested'
  | 'resubmitted'
  | 'archived'
  | 'cancelled'

type Submission = {
  id: string
  projectId: string
  documentId?: string
  packageId?: string
  ownerPartyId?: string
  inspectionRoundId?: string
  channel: SubmissionChannel
  status: SubmissionStatus
  title: string
  recipientOrganizationIds: string[]
  recipientContactIds: string[]
  submittedBy?: string
  submittedAt?: string
  mailThreadId?: string
  mailMessageId?: string
  shareLinkId?: string
  externalReference?: string
  confirmationReceivedAt?: string
  confirmationContactId?: string
  confirmationMemo?: string
  revisionRequestedAt?: string
  revisionReason?: string
  createdAt: string
  updatedAt: string
}
```

### SubmissionAttachment

```ts
type SubmissionAttachment = {
  id: string
  submissionId: string
  fileId: string
  attachmentType: 'main_document' | 'signed_document' | 'evidence' | 'photo_ledger' | 'safety_cost' | 'schedule' | 'other'
  fileName: string
  required: boolean
  included: boolean
  createdAt: string
}
```

### SubmissionValidationWarning

```ts
type SubmissionValidationWarning = {
  type:
    | 'approval_missing'
    | 'signature_missing'
    | 'final_file_missing'
    | 'recipient_missing'
    | 'attachment_missing'
    | 'stale_document'
    | 'owner_mismatch'
    | 'mail_body_missing'
    | 'webhard_file_missing'
  severity: 'info' | 'warning' | 'danger'
  message: string
  relatedEntityType?: string
  relatedEntityId?: string
}
```

## 5. Validation Rules

### ApprovalWorkflow

- projectId는 필수다.
- documentId가 있는 결재는 해당 문서가 projectId에 속해야 한다.
- required step이 모두 approved되어야 workflow가 approved 또는 completed가 될 수 있다.
- rejected 또는 changes_requested 상태에서는 제출 패키지 finalize를 막는다.

### SignatureTask

- documentId는 필수다.
- required task가 pending이면 submission_ready 상태로 넘어갈 수 없다.
- signed_file_upload 방식은 signedFileId가 필요하다.
- waived 상태는 waivedReason이 필요하다.

### FinalDocumentPackage

- mainFileId는 필수다.
- signedFileId가 필요한 문서 유형은 signedFileId가 없으면 danger warning이다.
- attachmentFileIds의 FileAsset은 존재해야 한다.
- ownerPartyId가 있으면 package의 문서와 파일도 동일 ownerPartyId 기준이어야 한다.

### Submission

- projectId는 필수다.
- channel은 필수다.
- ownerPartyId가 있는 경우 해당 ProjectParty는 owner여야 한다.
- mail 제출은 mailThreadId 또는 send-mail 결과가 필요하다.
- manual 제출은 submittedAt과 externalReference 또는 confirmationMemo를 권장한다.
- submitted 상태는 main document attachment가 필요하다.

## 6. Service Rules

### 결재 요청 생성

```text
1. DocumentInstance 조회
2. Project/ownerPartyId 확인
3. ApprovalTemplate 선택
4. ApprovalWorkflow 생성
5. ApprovalStep 생성
6. 첫 step active 처리
7. Document status = review_requested 또는 in_review
8. AuditLog 생성
```

### 결재 액션 처리

```text
1. step 권한 확인
2. action 저장
3. comment 저장
4. 다음 step active 처리
5. 모든 required step approved이면 workflow approved
6. workflow approved이면 document status를 approved 또는 confirmed로 갱신
7. 반려/수정요청이면 document status = changes_requested
8. AuditLog 생성
```

### 서명/날인 완료

```text
1. SignatureTask 조회
2. 필요한 signatureAsset 또는 signedFile 확인
3. status = completed
4. document 서명 상태 갱신
5. signedFileId가 있으면 FileAsset tag = signed
6. AuditLog 생성
```

### 제출 패키지 구성

```text
1. DocumentInstance 조회
2. 최신 export 파일 확인
3. signedFile 필요 여부 확인
4. 첨부파일 후보 수집
5. Webhard 최종본 폴더 확인
6. FinalDocumentPackage 생성
7. validate 실행
8. validationWarnings 저장
```

### 메일 제출

```text
1. SubmissionPackage validate
2. recipient contacts 확인
3. MailDraft 생성
4. 첨부파일 연결
5. MailMessage 발송 또는 guest draft 생성
6. Submission 생성/갱신
7. DocumentInstance.status = submitted
8. OwnerReportTask.status = submitted
9. FileAsset tag = submitted
10. AuditLog 생성
```

### 수동 제출

```text
1. 제출 채널 manual/external_portal/in_person 선택
2. 제출일, 제출자, 외부 참조 입력
3. 제출 증빙파일 optional 연결
4. Submission.status = submitted
5. 관련 문서/업무 상태 갱신
6. AuditLog 생성
```

## 7. Report / Document Status Mapping

| Source Status | Target |
|---|---|
| ApprovalWorkflow.approved | DocumentInstance.status = confirmed 가능 |
| SignatureTask.completed | DocumentInstance.signingStatus = signed 가능 |
| FinalDocumentPackage.finalized | Submission.status = ready 가능 |
| Submission.submitted | DocumentInstance.status = submitted |
| Submission.confirmed | OwnerReportTask.status = confirmed |
| Submission.revision_requested | DocumentInstance.status = changes_requested |

## 8. Tests

```text
test_approval_workflow_create_success
test_approval_workflow_requires_document_project_match
test_approval_step_approve_moves_next_step
test_approval_step_reject_blocks_submission
test_approval_request_changes_updates_document_status
test_approval_workflow_completed_when_required_steps_approved
test_signature_task_create_success
test_signature_task_complete_requires_signed_file_when_upload_type
test_signature_task_waive_requires_reason
test_submission_readiness_detects_missing_approval
test_submission_readiness_detects_missing_signature
test_submission_package_create_success
test_submission_package_validate_requires_main_file
test_submission_mail_send_creates_mail_message
test_submission_mail_send_updates_document_status
test_submission_manual_submit_success
test_submission_owner_party_must_be_owner
test_submission_confirm_owner_receipt
test_submission_revision_request_updates_status
test_submission_archives_final_package
test_submission_creates_audit_log
```


---

## FILE: `docs/aec-erp/12-approval-signature-submission/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 결재/서명/제출

## 1. 화면 목표

결재/서명/제출 화면은 문서가 제출 가능한 상태인지 한눈에 판단하고, 남은 승인·서명·첨부·수신자·메일 작업을 빠르게 완료하도록 돕는 업무 통제 화면이다.

핵심 목표:

- 초안/검토본/최종본/날인본/제출본을 혼동하지 않게 한다.
- 결재 단계와 현재 담당자를 명확히 보여준다.
- 제출 전 차단 사유를 눈에 띄게 표시한다.
- 발주처별 제출 상태를 matrix로 보여준다.
- 메일함과 웹하드 연결 상태를 시각적으로 보여준다.

## 2. 화면 목록

### 2.1 결재함

Route:

```text
/approvals/inbox
```

주요 영역:

- 내 결재 대기
- 내가 요청한 결재
- 반려/수정 요청
- 마감 임박
- 완료된 결재

컬럼:

| 컬럼 | 설명 |
|---|---|
| 문서명 | 결재 대상 문서 |
| 프로젝트 | 연결 프로젝트 |
| 발주처 | ownerPartyId가 있는 경우 |
| 요청자 | 결재 요청자 |
| 현재 단계 | 점검 담당자 검토 등 |
| 상태 | active/approved/rejected |
| 마감일 | dueDate |
| 액션 | 승인/반려/수정요청 |

### 2.2 문서 결재 화면

Route:

```text
/documents/[documentId]/approval
```

Layout:

```text
┌──────────────────────────────────────────────┐
│ Document Header: 문서명 / 프로젝트 / 발주처 / 상태 │
├──────────────┬────────────────┬──────────────┤
│ Approval     │ Document       │ Action Panel │
│ Stepper      │ Summary        │ Comment      │
└──────────────┴────────────────┴──────────────┘
```

주요 컴포넌트:

- ApprovalStepper
- ApprovalStepCard
- ApprovalCommentThread
- ApprovalActionPanel
- ChangeRequestPanel
- DocumentVersionCard

### 2.3 서명/날인 화면

Route:

```text
/documents/[documentId]/signing
```

표시 항목:

- 문서 유형
- 서명/날인 필요 여부
- 서명자 또는 날인자
- 등록된 서명/직인 자산
- 날인본 업로드
- 서명/날인 완료 상태
- 최종본 파일

### 2.4 제출 준비 화면

Route:

```text
/documents/[documentId]/submission
```

구성:

- 제출 준비도 카드
- 결재 완료 여부
- 서명/날인 완료 여부
- 최종본 파일
- 첨부파일 목록
- 수신자 목록
- 제출 채널 선택
- 메일 초안
- 제출 전 체크리스트

### 2.5 프로젝트 제출 이력

Route:

```text
/projects/[projectId]/submissions
```

표시 항목:

| 컬럼 | 설명 |
|---|---|
| 제출명 | 보고서 제출 등 |
| 문서 | 제출 문서 |
| 발주처 | 제출 대상 |
| 채널 | mail/manual/share |
| 제출일 | submittedAt |
| 상태 | submitted/confirmed/revision_requested |
| 제출 파일 | FileAsset |
| 메일 | MailThread |
| 확인 | 발주처 확인 여부 |

### 2.6 발주처별 제출 matrix

공사안전보건대장 이행확인 보고서처럼 발주처별 제출이 필요한 경우 표시한다.

```text
제1회 점검
├── 삼성문화재단: 결재완료 / 최종본 / 제출완료 / 확인대기
└── 삼성생명공익재단: 결재완료 / 최종본 / 제출완료 / 확인대기
```

### 2.7 관리자 결재 템플릿

Route:

```text
/admin/approval-templates
```

구성:

- 문서 유형별 결재선
- 단계명
- 승인자 역할
- 필수 여부
- 서명/날인 필요 여부
- 발행/복제/보관

## 3. UX 규칙

1. 제출 가능 상태는 `ready`, `warning`, `blocked` 세 단계로 표시한다.
2. blocked 항목은 제출 버튼을 비활성화한다.
3. 결재 반려 또는 수정 요청이 있으면 export/submit을 막는다.
4. 서명/날인이 필요한 문서에서 날인본이 없으면 danger warning을 표시한다.
5. 최종본 파일과 날인본 파일을 badge로 명확히 구분한다.
6. 메일 제출은 첨부파일 목록과 수신자 확인 후에만 가능하다.
7. 수동 제출은 제출일, 제출자, 증빙 메모를 입력하게 한다.
8. 발주처별 제출은 owner badge로 구분한다.
9. 제출 후에는 문서, 파일, 메일, 제출 이력을 모두 연결해서 보여준다.
10. 법적 전자서명으로 오해되지 않도록 “업무상 서명/날인 확인” 표현을 사용한다.

## 4. 핵심 컴포넌트

### ApprovalStepper

단계 표시:

```text
작성 완료 → 점검 담당자 검토 → 기술사 확인 → 제출 처리
```

상태:

- pending
- active
- approved
- rejected
- changes_requested
- skipped

### ApprovalActionPanel

액션:

- 승인
- 반려
- 수정 요청
- 위임
- 취소

### SignatureRequirementPanel

표시:

- 서명 필요 여부
- 날인 필요 여부
- 담당자
- 서명 자산
- 날인본 파일
- 완료 상태

### SubmissionReadinessPanel

표시:

```text
결재: 완료/미완료
서명/날인: 완료/미완료
최종본: 있음/없음
첨부파일: 완료/누락
수신자: 완료/누락
메일: 작성/미작성
원본 변경: 없음/있음
```

### SubmissionPackageBuilder

기능:

- 최종본 파일 선택
- 날인본 파일 선택
- 증빙 첨부 선택
- 사진대지 선택
- 산업안전보건관리비 첨부 선택
- 웹하드 위치 표시

### SubmissionMailDraftPanel

구성:

- 제목
- 수신자
- 참조
- 본문
- 첨부파일
- 메일함 연결 상태
- 발송 또는 guest draft 복사

### OwnerSubmissionMatrix

행:

- 점검회차
- 발주처

열:

- 결재
- 서명/날인
- 최종본
- 제출
- 확인

## 5. Empty State

### 결재 요청 없음

```text
대기 중인 결재가 없습니다.
문서 상세 화면에서 결재 요청을 생성할 수 있습니다.
```

### 제출 이력 없음

```text
아직 제출 이력이 없습니다.
최종본을 생성한 뒤 제출 패키지를 구성하세요.
```

## 6. Warning State

### 결재 미완료

```text
필수 결재 단계가 완료되지 않았습니다.
제출 전에 모든 필수 승인 단계를 완료하세요.
```

### 서명/날인 누락

```text
이 문서는 날인본이 필요합니다.
날인본 파일을 업로드하거나 서명/날인 필요 여부를 재검토하세요.
```

### 최종본 누락

```text
제출 가능한 최종본 파일이 없습니다.
문서 export를 먼저 수행하세요.
```

### 수신자 누락

```text
발주처 제출 수신자가 설정되지 않았습니다.
프로젝트 관계자 또는 연락처에서 수신자를 선택하세요.
```

## 7. Responsive

### Desktop

- 결재 화면은 stepper + document summary + action panel 3-column
- 제출 화면은 readiness panel + package builder + mail draft 3-column
- matrix와 history table을 함께 표시

### Tablet

- action panel은 drawer
- package builder는 accordion

### Mobile

- 결재 승인/반려 중심
- 제출 실행보다는 상태 확인과 간단한 승인에 최적화


---

## FILE: `docs/aec-erp/12-approval-signature-submission/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 결재/서명/제출

## 1. Feature

```yaml
featureId: approval.signature.submission
featureName: 결재/서명/제출
priority: P1
module: approval-signature-submission
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 결재 목록 | `/approvals` | 전체 결재 목록 |
| 내 결재함 | `/approvals/inbox` | 나에게 배정된 결재 |
| 내가 요청한 결재 | `/approvals/requested` | 요청자가 생성한 결재 |
| 결재 상세 | `/approvals/[approvalWorkflowId]` | 결재 단계/의견/액션 |
| 문서 결재 | `/documents/[documentId]/approval` | 특정 문서 결재 상태 |
| 문서 서명/날인 | `/documents/[documentId]/signing` | 서명/날인 필요 항목 관리 |
| 문서 제출 | `/documents/[documentId]/submission` | 제출 준비도, 패키지, 메일 |
| 제출 생성 | `/documents/[documentId]/submission/new` | 신규 제출 이력 생성 |
| 프로젝트 제출 이력 | `/projects/[projectId]/submissions` | 프로젝트 전체 제출 이력 |
| 제출 상세 | `/submissions/[submissionId]` | 제출 파일/메일/확인 이력 |
| 발주처 확인 | `/submissions/[submissionId]/confirmation` | 확인/보완요청/재제출 |
| 결재 템플릿 | `/admin/approval-templates` | 문서 유형별 결재선 관리 |
| 서명 자산 | `/admin/signature-assets` | 서명/직인/날인 자산 관리 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/approvals/inbox` | ApprovalWorkflowTable, ApprovalStatusBadge, ApprovalFilterBar |
| `/approvals/[approvalWorkflowId]` | ApprovalStepper, ApprovalStepCard, ApprovalActionPanel, ApprovalCommentThread |
| `/documents/[documentId]/approval` | ApprovalWorkflowCard, DocumentVersionCard, ChangeRequestPanel |
| `/documents/[documentId]/signing` | SignatureRequirementPanel, SignatureTaskTable, SignedFileUploader |
| `/documents/[documentId]/submission` | SubmissionReadinessPanel, SubmissionPackageBuilder, SubmissionMailDraftPanel |
| `/projects/[projectId]/submissions` | SubmissionHistoryTable, OwnerSubmissionMatrix, SubmissionStatusBadge |
| `/submissions/[submissionId]` | SubmissionDetailCard, WebhardFinalFileCard, MailSubmissionLinkCard |
| `/admin/approval-templates` | ApprovalTemplateTable, ApprovalTemplateEditor |
| `/admin/signature-assets` | SignatureAssetTable, SignatureAssetPicker, SealAssetPicker |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| ApprovalWorkflowTable | GET `/api/v1/approvals`, GET `/api/v1/approvals/inbox` |
| ApprovalRequestModal | POST `/api/v1/documents/{documentId}/approval/request` |
| ApprovalStepper | GET `/api/v1/approval-workflows/{workflowId}/steps` |
| ApprovalActionPanel | POST `/api/v1/approval-steps/{stepId}/approve`, `/reject`, `/request-changes` |
| ApprovalCommentThread | GET `/api/v1/approval-workflows/{workflowId}` |
| SignatureRequirementPanel | GET `/api/v1/documents/{documentId}/signature-tasks` |
| SignedFileUploader | POST `/api/v1/documents/{documentId}/signed-files/upload` |
| SignatureTaskCard | POST `/api/v1/signature-tasks/{taskId}/complete` |
| SubmissionReadinessPanel | GET `/api/v1/documents/{documentId}/submission-readiness` |
| SubmissionPackageBuilder | POST `/api/v1/documents/{documentId}/submission-packages` |
| SubmissionChecklist | POST `/api/v1/submission-packages/{packageId}/validate` |
| SubmissionMailDraftPanel | POST `/api/v1/submissions/{submissionId}/send-mail` |
| SubmissionHistoryTimeline | GET `/api/v1/submissions/{submissionId}` |
| OwnerSubmissionMatrix | GET `/api/v1/projects/{projectId}/submissions` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| POST `/approval-workflows` | ApprovalWorkflow, ApprovalStep |
| POST `/documents/{documentId}/approval/request` | DocumentInstance, ApprovalWorkflow, ApprovalTemplate |
| POST `/approval-steps/{stepId}/approve` | ApprovalStep, ApprovalWorkflow, ApprovalComment, AuditLog |
| POST `/approval-steps/{stepId}/request-changes` | ApprovalStep, ApprovalComment, DocumentInstance |
| POST `/signature-tasks/{taskId}/complete` | SignatureTask, SignatureAsset, FileAsset |
| POST `/documents/{documentId}/signed-files/upload` | SignatureTask, FileAsset, DocumentInstance |
| GET `/documents/{documentId}/submission-readiness` | DocumentInstance, ApprovalWorkflow, SignatureTask, FinalDocumentPackage |
| POST `/submission-packages/{packageId}/validate` | FinalDocumentPackage, SubmissionValidationWarning |
| POST `/submissions/{submissionId}/send-mail` | Submission, MailMessage, MailThread, SubmissionAttachment |
| POST `/submissions/{submissionId}/mark-manual-submitted` | Submission, FileAsset, AuditLog |
| POST `/submissions/{submissionId}/confirm-owner-receipt` | Submission, ProjectParty, Contact |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| ApprovalWorkflow | approval-submission-readiness |
| ApprovalStep | approval-submission-readiness |
| SignatureTask | approval-submission-readiness |
| FinalDocumentPackage | approval-submission-readiness |
| Submission | approval-submission-readiness |
| SubmissionAttachment | approval-submission-readiness |
| MailDraft | approval-submission-readiness |
| DocumentInstance | approval-submission-readiness |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 결재 생성 | test_approval_workflow_create_success |
| 문서-프로젝트 검증 | test_approval_workflow_requires_document_project_match |
| 단계 승인 | test_approval_step_approve_moves_next_step |
| 반려 차단 | test_approval_step_reject_blocks_submission |
| 수정요청 | test_approval_request_changes_updates_document_status |
| 결재 완료 | test_approval_workflow_completed_when_required_steps_approved |
| 서명 태스크 | test_signature_task_create_success |
| 서명본 필수 | test_signature_task_complete_requires_signed_file_when_upload_type |
| waive 사유 | test_signature_task_waive_requires_reason |
| 제출 준비 결재 누락 | test_submission_readiness_detects_missing_approval |
| 제출 준비 서명 누락 | test_submission_readiness_detects_missing_signature |
| 제출 패키지 | test_submission_package_create_success |
| 메인 파일 검증 | test_submission_package_validate_requires_main_file |
| 메일 제출 | test_submission_mail_send_creates_mail_message |
| 문서 상태 갱신 | test_submission_mail_send_updates_document_status |
| 수동 제출 | test_submission_manual_submit_success |
| 발주처 검증 | test_submission_owner_party_must_be_owner |
| 발주처 확인 | test_submission_confirm_owner_receipt |
| 보완 요청 | test_submission_revision_request_updates_status |
| 보관 | test_submission_archives_final_package |
| 감사로그 | test_submission_creates_audit_log |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ownerPartyId, recipient contacts |
| 계약/견적 | 계약서 검토, 날인본, 견적 발송 이력 |
| 점검회차/일정 | ownerReportTask, 회차별 제출 상태 |
| 이행확인 보고서 | DocumentInstance 승인, export, 제출 |
| 안전관리계획서 | 계획서 검토/확정/제출 |
| 안전보건대장 | 대장 확정/보관/제출 |
| 사진대지 | 보고서 첨부, 별도 제출 |
| 웹하드 | 최종본/날인본/제출본 FileAsset |
| 메일함 | 제출 메일, 회신, MailThread |
| 관리자 | 결재 템플릿, 서명 자산, 권한 |
| 대시보드 | 결재 대기, 제출 예정, 반려/보완요청 |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 초안과 최종본 혼동 | DocumentInstance.status와 FileAsset tag 분리 |
| 결재 미완료 문서 제출 | SubmissionReadiness blocked 처리 |
| 서명/날인 누락 | SignatureTask required 검증 |
| 발주처별 제출 파일 혼동 | ownerPartyId + documentId + finalFileId 검증 |
| 메일 발송 후 제출 이력 누락 | send-mail API에서 Submission과 MailThread 동시 갱신 |
| 수동 제출 증빙 부족 | submittedAt, externalReference, confirmationMemo 권장 |
| 보완 요청 후 기존 제출본 혼동 | resubmission version과 revision_requested 상태 관리 |
| 법적 전자서명 오해 | UI와 문구에서 업무상 서명/날인 확인으로 표시 |


---

## FILE: `docs/aec-erp/12-approval-signature-submission/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 결재/서명/제출 준비도 점검

## Prompt ID

`approval-submission-readiness`

## 목적

문서, 결재선, 서명/날인 상태, 제출 패키지, 수신자, 첨부파일, 메일 초안 정보를 분석하여 제출 가능 여부와 누락 항목을 정리한다.

## Prompt

```text
너는 A&C기술사 ERP의 결재/서명/제출 준비도 점검 엔진이다.

입력:
- project
- ownerParty
- inspectionRound
- documentInstance
- approvalWorkflow
- approvalSteps
- approvalComments
- signatureTasks
- finalDocumentPackage
- submission
- submissionAttachments
- recipientContacts
- mailDraft
- webhardFiles
- validationWarnings
- userInstruction

목표:
문서가 발주처 제출 가능한 상태인지 보수적으로 점검하고, 필요한 결재/서명/첨부/메일/제출 작업을 구조화한다.

해야 할 일:
1. 문서 상태가 제출 가능한지 판단한다.
2. 필수 결재 단계가 완료되었는지 확인한다.
3. 반려 또는 수정 요청이 남아 있는지 확인한다.
4. 서명/날인 필요 항목이 완료되었는지 확인한다.
5. 최종본 파일과 날인본 파일이 존재하는지 확인한다.
6. 발주처별 제출인 경우 ownerPartyId와 문서/파일/수신자가 일치하는지 확인한다.
7. 제출 패키지의 필수 첨부파일 누락 여부를 확인한다.
8. 제출 메일 제목, 본문, 수신자, 첨부파일 누락을 확인한다.
9. 수동 제출인 경우 제출일, 제출자, 외부 참조 또는 증빙 여부를 확인한다.
10. 제출 후 상태 갱신 대상을 제안한다.

작성 규칙:
- 입력에 없는 제출 사실을 만들지 않는다.
- 승인되지 않은 문서를 제출 가능하다고 판단하지 않는다.
- 서명/날인이 필요한 문서에서 signedFileId가 없으면 제출 불가 또는 danger warning으로 표시한다.
- 최종본 파일이 없으면 제출 불가로 판단한다.
- 발주처별 보고서에서 ownerPartyId 불일치는 danger warning으로 표시한다.
- 메일 본문은 실무적인 한국어 문체로 작성하되, 사용자가 최종 검토해야 한다.
- AI 출력은 제출 판단 보조이며 실제 제출 실행이 아니다.

출력 JSON:
{
  "readiness": {
    "readyToSubmit": false,
    "readinessLevel": "blocked | warning | ready",
    "summary": "",
    "nextAction": ""
  },
  "approvalCheck": {
    "workflowStatus": "",
    "requiredStepsCompleted": false,
    "pendingSteps": [],
    "rejectedOrChangeRequested": []
  },
  "signatureCheck": {
    "required": false,
    "completed": false,
    "pendingTasks": []
  },
  "packageCheck": {
    "mainFileReady": false,
    "signedFileReady": false,
    "attachmentsReady": false,
    "missingAttachments": []
  },
  "recipientCheck": {
    "recipientsReady": false,
    "missingRecipients": [],
    "ownerPartyMatch": true
  },
  "mailDraftSuggestion": {
    "subject": "",
    "body": "",
    "attachmentNames": [],
    "warnings": []
  },
  "statusUpdatesAfterSubmit": [
    {
      "entityType": "",
      "entityId": "",
      "nextStatus": ""
    }
  ],
  "missingFields": [
    {
      "field": "",
      "label": "",
      "reason": ""
    }
  ],
  "warnings": [
    {
      "type": "approval_missing | signature_missing | final_file_missing | recipient_missing | attachment_missing | stale_document | owner_mismatch | mail_body_missing | webhard_file_missing",
      "severity": "info | warning | danger",
      "message": ""
    }
  ]
}
```

## 제출 메일 문체 기준

```text
제목: [프로젝트명] 제N회 공사안전보건대장 이행확인 결과보고서 제출의 건

본문:
안녕하세요.
A&C기술사사무소입니다.

[프로젝트명] 제N회 공사안전보건대장 이행확인 결과보고서를 첨부와 같이 제출드립니다.
검토 후 의견 있으시면 회신 부탁드립니다.

감사합니다.
```

## 금지사항

- 승인되지 않은 문서를 제출 가능으로 표시하지 않는다.
- 존재하지 않는 첨부파일명을 만들지 않는다.
- 발주처가 다른 문서를 같은 제출 패키지에 섞지 않는다.
- 제출 완료 사실을 입력 없이 생성하지 않는다.
- 법적 전자서명 완료로 표현하지 않는다. 실제 연동이 없으면 업무상 서명/날인 확인으로 표현한다.
```


---

## FILE: `docs/aec-erp/12-approval-signature-submission/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 결재/서명/제출

## Prompt

```text
You are implementing the Approval, Signature, and Submission module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module manages document approval workflows, approval steps, comments, signatures/seals, signed file uploads, final document packages, submission readiness, mail/manual submissions, owner confirmations, revision requests, and archive status.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Approval, Signature, and Submission module.

Existing concepts:
- Project
- ProjectParty
- Contact
- DocumentInstance
- DocumentVersion
- FileAsset
- Folder
- ShareLink
- MailThread
- MailMessage
- MailDraft
- InspectionRound
- InspectionOwnerReportTask
- Contract
- SafetyManagementPlan
- SafetyHealthLedger
- AuditLog

Required backend models:
- ApprovalWorkflow
- ApprovalStep
- ApprovalComment
- ApprovalTemplate
- ApprovalTemplateStep
- SignatureAsset
- SignatureTask
- FinalDocumentPackage
- Submission
- SubmissionAttachment
- SubmissionRecipient
- SubmissionValidationWarning
- SubmissionStatusEvent

Required backend APIs:

Approval Workflows:
- GET /api/v1/approvals
- GET /api/v1/approvals/inbox
- POST /api/v1/approval-workflows
- GET /api/v1/approval-workflows/{workflowId}
- PATCH /api/v1/approval-workflows/{workflowId}
- DELETE /api/v1/approval-workflows/{workflowId}
- POST /api/v1/documents/{documentId}/approval/request
- GET /api/v1/documents/{documentId}/approval
- POST /api/v1/approval-workflows/{workflowId}/cancel
- POST /api/v1/approval-workflows/{workflowId}/restart

Approval Steps:
- GET /api/v1/approval-workflows/{workflowId}/steps
- POST /api/v1/approval-workflows/{workflowId}/steps
- PATCH /api/v1/approval-steps/{stepId}
- POST /api/v1/approval-steps/{stepId}/approve
- POST /api/v1/approval-steps/{stepId}/reject
- POST /api/v1/approval-steps/{stepId}/request-changes
- POST /api/v1/approval-steps/{stepId}/delegate
- POST /api/v1/approval-steps/{stepId}/skip

Signature:
- GET /api/v1/signature-assets
- POST /api/v1/signature-assets
- GET /api/v1/signature-assets/{assetId}
- PATCH /api/v1/signature-assets/{assetId}
- DELETE /api/v1/signature-assets/{assetId}
- GET /api/v1/documents/{documentId}/signature-tasks
- POST /api/v1/documents/{documentId}/signature-tasks
- PATCH /api/v1/signature-tasks/{taskId}
- POST /api/v1/signature-tasks/{taskId}/complete
- POST /api/v1/signature-tasks/{taskId}/waive
- POST /api/v1/documents/{documentId}/signed-files/upload

Submission Packages:
- GET /api/v1/documents/{documentId}/submission-readiness
- POST /api/v1/documents/{documentId}/submission-packages
- GET /api/v1/submission-packages/{packageId}
- PATCH /api/v1/submission-packages/{packageId}
- POST /api/v1/submission-packages/{packageId}/validate
- POST /api/v1/submission-packages/{packageId}/finalize

Submissions:
- GET /api/v1/projects/{projectId}/submissions
- POST /api/v1/projects/{projectId}/submissions
- GET /api/v1/submissions/{submissionId}
- PATCH /api/v1/submissions/{submissionId}
- DELETE /api/v1/submissions/{submissionId}
- POST /api/v1/submissions/{submissionId}/send-mail
- POST /api/v1/submissions/{submissionId}/mark-manual-submitted
- POST /api/v1/submissions/{submissionId}/confirm-owner-receipt
- POST /api/v1/submissions/{submissionId}/request-revision
- POST /api/v1/submissions/{submissionId}/resubmit
- POST /api/v1/submissions/{submissionId}/archive

Templates:
- GET /api/v1/approval-templates
- POST /api/v1/approval-templates
- GET /api/v1/approval-templates/{templateId}
- PATCH /api/v1/approval-templates/{templateId}
- DELETE /api/v1/approval-templates/{templateId}
- POST /api/v1/approval-templates/{templateId}/publish

Required frontend routes:
- /approvals
- /approvals/inbox
- /approvals/requested
- /approvals/[approvalWorkflowId]
- /documents/[documentId]/approval
- /documents/[documentId]/signing
- /documents/[documentId]/submission
- /documents/[documentId]/submission/new
- /projects/[projectId]/submissions
- /projects/[projectId]/submissions/new
- /submissions/[submissionId]
- /submissions/[submissionId]/edit
- /submissions/[submissionId]/confirmation
- /admin/approval-templates
- /admin/approval-templates/[templateId]
- /admin/signature-assets
- /admin/signature-assets/[assetId]

Required frontend components:
- ApprovalWorkflowTable
- ApprovalWorkflowCard
- ApprovalStatusBadge
- ApprovalStepper
- ApprovalStepCard
- ApprovalActionPanel
- ApprovalCommentThread
- ApprovalRequestModal
- ApprovalRejectModal
- ChangeRequestPanel
- ApprovalHistoryTimeline
- SignatureRequirementPanel
- SignatureTaskTable
- SignatureTaskCard
- SignatureAssetPicker
- SealAssetPicker
- SignedFileUploader
- SigningStatusBadge
- SubmissionReadinessPanel
- SubmissionPackageBuilder
- SubmissionAttachmentTable
- SubmissionRecipientTable
- SubmissionChannelSelector
- SubmissionMailDraftPanel
- SubmissionChecklist
- SubmissionHistoryTimeline
- OwnerSubmissionMatrix
- SubmissionStatusBadge
- WebhardFinalFileCard
- MailSubmissionLinkCard

Business requirements:
1. ApprovalWorkflow must belong to a Project.
2. Document approval workflows must reference DocumentInstance.
3. Required approval steps must be approved before workflow can complete.
4. Reject or request_changes must block submission readiness.
5. SignatureTask can be required by document type or approval result.
6. signed_file_upload SignatureTask requires signedFileId.
7. FinalDocumentPackage must include mainFileId.
8. Submission readiness must check approval, signature, main file, recipients, attachments, stale document warnings, and ownerParty mismatch.
9. Owner-specific documents must submit with matching ownerPartyId.
10. Mail submission must create or link MailMessage/MailThread.
11. Manual submission must record submittedAt and external reference or memo.
12. Submission success updates DocumentInstance.status and linked OwnerReportTask when present.
13. Revision request updates Submission and DocumentInstance status.
14. Archive status locks final package unless admin reopens.
15. All state transitions create AuditLog.

Validation:
1. projectId is required.
2. documentId must belong to projectId.
3. ownerPartyId must be an owner ProjectParty when present.
4. approving user must match step approver or role.
5. required ApprovalStep cannot be skipped without permission.
6. signature waive requires waivedReason.
7. FinalDocumentPackage mainFileId must exist as FileAsset.
8. send-mail requires recipients and attachment list.
9. mark-manual-submitted requires submittedAt.
10. confirmed owner receipt requires confirmation memo or confirmation contact.

Seed data:
Create a default approval template for safety health ledger inspection report:
- Step 1: 문서 작성자 작성 완료
- Step 2: 점검 담당자 검토
- Step 3: 건설안전기술사 최종 확인
- Step 4: 제출 담당자 제출 처리

Create default submission package types:
- safety_report_owner_submission
- safety_management_plan_submission
- safety_health_ledger_submission
- contract_signed_submission

Tests:
- test_approval_workflow_create_success
- test_approval_workflow_requires_document_project_match
- test_approval_step_approve_moves_next_step
- test_approval_step_reject_blocks_submission
- test_approval_request_changes_updates_document_status
- test_approval_workflow_completed_when_required_steps_approved
- test_signature_task_create_success
- test_signature_task_complete_requires_signed_file_when_upload_type
- test_signature_task_waive_requires_reason
- test_submission_readiness_detects_missing_approval
- test_submission_readiness_detects_missing_signature
- test_submission_package_create_success
- test_submission_package_validate_requires_main_file
- test_submission_mail_send_creates_mail_message
- test_submission_mail_send_updates_document_status
- test_submission_manual_submit_success
- test_submission_owner_party_must_be_owner
- test_submission_confirm_owner_receipt
- test_submission_revision_request_updates_status
- test_submission_archives_final_package
- test_submission_creates_audit_log

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Approval workflow service
- Signature task service
- Submission readiness service
- Submission package service
- Mail submission adapter integration
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```


---

## FILE: `docs/aec-erp/12-approval-signature-submission/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 결재/서명/제출

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "결재/서명/제출" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 공사안전보건대장 이행확인 보고서, 안전관리계획서, 안전보건대장, 계약서, 사진대지를 생성하고 최종 제출까지 관리하는 ERP
- 결재/서명/제출 화면은 문서가 초안에서 최종본, 날인본, 제출본으로 이동하는 통제 화면
- 발주처별 제출, 메일 제출, 웹하드 보관, 제출 확인 이력이 모두 연결되어야 한다.

화면 1: 결재함
- 좌측 ERP 사이드바
- 상단 필터:
  - 내 결재 대기
  - 내가 요청한 결재
  - 반려/수정 요청
  - 마감 임박
  - 완료
- 중앙 결재 목록 table
- 컬럼:
  - 문서명
  - 프로젝트
  - 발주처
  - 요청자
  - 현재 단계
  - 상태
  - 마감일
  - 액션
- 우측에는 오늘 처리할 결재 요약 카드

화면 2: 문서 결재 상세
- 상단 sticky header:
  - 문서명
  - 프로젝트명
  - 발주처
  - 문서상태
  - 결재상태
- 3-column layout:
  - 좌측: Approval stepper
  - 중앙: 문서 요약과 버전 정보
  - 우측: 승인/반려/수정요청 action panel
- 하단에는 결재 의견 timeline
- 반려 또는 수정요청 시 section 선택과 의견 입력 modal을 표시한다.

화면 3: 서명/날인 관리
- 문서별 서명/날인 필요 여부 카드
- 서명/직인 자산 선택 UI
- 날인본 파일 업로드 영역
- 최종본/날인본 파일 비교 카드
- 서명/날인 완료 상태 badge
- 법적 전자서명이 아니라 업무상 서명/날인 확인이라는 설명 문구를 표시한다.

화면 4: 제출 준비 화면
- 상단 readiness summary:
  - blocked / warning / ready 상태
- 체크리스트 카드:
  - 결재 완료
  - 서명/날인 완료
  - 최종본 파일 있음
  - 첨부파일 확인
  - 수신자 확인
  - 메일 제목/본문 확인
  - 웹하드 저장 위치 확인
- 중앙에는 제출 패키지 builder
- 우측에는 제출 메일 초안 panel
- 제출 버튼은 blocked 항목이 있을 때 비활성화한다.

화면 5: 프로젝트 제출 이력
- 프로젝트별 제출 이력 table
- 발주처별 제출 matrix
- 제출 채널 badge:
  - mail
  - manual
  - webhard share
  - external portal
  - in person
- 제출 파일, 메일 스레드, 웹하드 위치를 각각 링크 카드로 보여준다.

화면 6: 관리자 결재 템플릿
- 문서 유형별 결재선 설정
- 단계명, 승인자 역할, 필수 여부, 서명/날인 필요 여부 편집
- 템플릿 발행/복제/보관 버튼

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- 승인 완료는 초록색, 반려는 빨간색, 수정요청은 주황색, 검토중은 보라색
- 제출 blocked는 빨간색, warning은 주황색, ready는 초록색
- 최종본과 날인본은 badge로 명확히 구분한다.
- 문서 제출 업무에 어울리는 신뢰감 있는 디자인
- 테이블은 정보 밀도가 높게, 액션은 명확하게
- 한글 가독성을 최우선으로 한다.

결과물:
- 결재함 화면
- 문서 결재 상세 화면
- 서명/날인 관리 화면
- 제출 준비 화면
- 제출 패키지 builder
- 제출 메일 초안 panel
- 프로젝트 제출 이력 화면
- 발주처별 제출 matrix
- 관리자 결재 템플릿 화면
```


---

## FILE: `docs/aec-erp/12-approval-signature-submission/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 결재/서명/제출

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
결재/서명/제출

기능 설명:
결재/서명/제출은 문서가 초안에서 내부 검토, 기술사 확인, 서명/날인, 최종본 패키징, 발주처별 제출, 제출 확인, 보관 상태로 이동하는 과정을 관리하는 기능이다.

업무 맥락:
- 결재는 Project와 DocumentInstance에 연결된다.
- 발주처별 보고서는 ownerPartyId 기준으로 제출 이력이 분리되어야 한다.
- 제출 전에는 결재 완료, 서명/날인 완료, 최종본 파일, 첨부파일, 수신자, 메일 초안을 검증해야 한다.
- 제출은 MailThread/MailMessage 또는 manual record와 연결된다.
- 최종본, 날인본, 제출본은 FileAsset과 웹하드 폴더에 연결되어야 한다.
- 반려 또는 수정 요청은 문서 상태와 결재 이력에 남아야 한다.
- 제출 확인 또는 보완 요청은 Submission 상태로 관리한다.

입력:
{
  "featureName": "결재/서명/제출",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "mailRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `approval.signature.submission`으로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 계약/견적
    - 점검회차/일정
    - 공사안전보건대장 이행확인 보고서 자동화
    - 안전관리계획서
    - 안전보건대장
    - 웹하드
    - 메일함
    - 관리자/템플릿
    - 대시보드

출력 JSON:
{
  "featureId": "approval.signature.submission",
  "featureName": "결재/서명/제출",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /approvals
- /approvals/inbox
- /approvals/requested
- /approvals/[approvalWorkflowId]
- /documents/[documentId]/approval
- /documents/[documentId]/signing
- /documents/[documentId]/submission
- /documents/[documentId]/submission/new
- /projects/[projectId]/submissions
- /submissions/[submissionId]
- /submissions/[submissionId]/confirmation
- /admin/approval-templates
- /admin/signature-assets

반드시 포함할 models:
- ApprovalWorkflow
- ApprovalStep
- ApprovalComment
- ApprovalTemplate
- SignatureAsset
- SignatureTask
- FinalDocumentPackage
- Submission
- SubmissionAttachment
- SubmissionRecipient
- SubmissionValidationWarning
- SubmissionStatusEvent
- DocumentInstance
- FileAsset
- MailThread
- MailMessage
- ProjectParty
- AuditLog

반드시 포함할 prompts:
- approval-submission-readiness
- approval-signature-submission implementation prompt
- approval-signature-submission design prompt

반드시 포함할 tests:
- test_approval_workflow_create_success
- test_approval_workflow_requires_document_project_match
- test_approval_step_approve_moves_next_step
- test_approval_step_reject_blocks_submission
- test_approval_request_changes_updates_document_status
- test_approval_workflow_completed_when_required_steps_approved
- test_signature_task_create_success
- test_signature_task_complete_requires_signed_file_when_upload_type
- test_signature_task_waive_requires_reason
- test_submission_readiness_detects_missing_approval
- test_submission_readiness_detects_missing_signature
- test_submission_package_create_success
- test_submission_package_validate_requires_main_file
- test_submission_mail_send_creates_mail_message
- test_submission_mail_send_updates_document_status
- test_submission_manual_submit_success
- test_submission_owner_party_must_be_owner
- test_submission_confirm_owner_receipt
- test_submission_revision_request_updates_status
- test_submission_archives_final_package
- test_submission_creates_audit_log

주의:
- 결재 미완료 문서는 제출 가능 상태가 아니다.
- 반려 또는 수정요청이 남아 있으면 제출을 차단한다.
- 서명/날인이 필요한 문서에서 signedFileId가 없으면 제출을 차단한다.
- 발주처별 제출 문서는 ownerPartyId가 일치해야 한다.
- 메일 제출은 MailMessage와 Submission을 함께 갱신해야 한다.
- 수동 제출은 submittedAt과 증빙 정보를 남겨야 한다.
- 최종본과 날인본, 제출본을 혼동하지 않는다.
- 업무상 서명/날인 확인을 법적 전자서명 완료로 표현하지 않는다.
```


---

## FILE: `docs/aec-erp/13-admin-template-prompt/README.md`

# 기능 13 — 관리자/템플릿/프롬프트

이 폴더는 A&C 기술사 ERP의 열세 번째 기능인 `관리자/템플릿/프롬프트` 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

관리자/템플릿/프롬프트는 A&C 기술사 ERP에서 사용자, 권한, 회사정보, 문서 템플릿, 체크리스트 템플릿, 표준 문구, 법령/고시 문구, 서비스 AI 프롬프트, Codex 구현 프롬프트, 디자인 프롬프트, Reverse Prompt를 버전 단위로 관리하는 운영 모듈이다.

이 기능은 문서 자동화의 품질 관리 레이어다.

```text
DocumentTemplate
→ TemplateVersion
→ TemplateVariable / TemplateLoop / TemplateCondition
→ StandardPhrase / LegalClause
→ PromptTemplate
→ PromptVersion
→ PromptTestCase
→ PromptRunLog
→ TemplateRelease
→ AdminAuditLog
```

## 핵심 설계 포인트

- 문서 템플릿은 `draft → review → published → archived` 상태를 가진다.
- 프롬프트도 문서 템플릿처럼 버전 관리한다.
- 법령/고시/표준 문구는 일반 문구보다 더 엄격한 권한과 감사로그를 가진다.
- 템플릿 변경은 기존 생성 문서를 훼손하면 안 된다.
- 문서 생성 시점에는 templateVersionId와 promptVersionId를 snapshot으로 남긴다.
- 발행 전에는 샘플 데이터 기반 preview와 테스트케이스를 통과해야 한다.


---

## FILE: `docs/aec-erp/13-admin-template-prompt/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 관리자/템플릿/프롬프트

## 1. 기능 정의

관리자/템플릿/프롬프트는 A&C 기술사 ERP의 운영 설정과 자동화 품질을 관리하는 기능이다.

이 기능은 단순한 관리자 페이지가 아니라 다음 항목을 버전 단위로 통제한다.

- 사용자/권한
- 회사정보
- 프로젝트 기본 정책
- 문서 템플릿
- 체크리스트 템플릿
- 표준 문구
- 법령/고시 문구
- 서비스 AI 프롬프트
- Codex 구현 프롬프트 저장소
- 디자인 프롬프트
- Reverse Prompt
- 메일 템플릿
- 웹하드 폴더 정책
- 결재선 템플릿
- 서명/직인 자산
- 감사로그

## 2. 이 기능이 필요한 이유

A&C ERP의 핵심은 문서 자동화다. 그런데 문서 자동화 품질은 화면보다 템플릿과 프롬프트에 크게 의존한다.

예를 들어 다음 문서는 모두 템플릿 버전을 가져야 한다.

```text
기술용역계약서
공사안전보건대장 이행확인 보고서
공사안전보건대장 이행 확인 점검표
공사안전보건대장 이행여부 확인서
유해·위험방지계획에 따른 위험성 감소대책 이행확인
추가 유해·위험요인 점검리스트
산업안전보건관리비 사용내용 확인
사진대지
안전관리계획서
안전보건대장
보고서 제출 메일
조치요청 메일
```

템플릿과 프롬프트가 관리되지 않으면 다음 문제가 발생한다.

- 발주처별 문서 양식이 섞인다.
- 법령 문구가 임의 변경된다.
- AI가 생성한 문구의 근거 버전을 추적할 수 없다.
- 기존 문서가 새 템플릿 변경으로 깨진다.
- Codex 구현 프롬프트와 실제 Reverse Map이 어긋난다.
- 체크리스트 항목 버전이 보고서 섹션과 불일치한다.

따라서 관리자/템플릿/프롬프트 기능은 ERP의 장기 운영을 위한 필수 모듈이다.

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 시스템 관리자 | 사용자/권한, 전역 설정, 감사로그 관리 |
| 템플릿 관리자 | 문서 템플릿, 변수, 섹션, 반복 표 관리 |
| 기술사/대표 | 법령 문구, 표준 문구, 최종 발행 승인 |
| 문서 작성 책임자 | 보고서 문구, 메일 템플릿, 체크리스트 문항 보정 |
| 개발/운영 담당자 | Codex 구현 프롬프트, Reverse Map, 테스트케이스 관리 |
| 일반 사용자 | 발행된 템플릿과 프롬프트만 사용 |

## 4. 핵심 기능

### 4.1 사용자/권한 관리

사용자 계정, 역할, 프로젝트 접근권한, 관리자 권한을 관리한다.

역할 예시:

```text
super_admin
admin
template_manager
prompt_manager
legal_text_manager
engineer
writer
contract_manager
field_inspector
viewer
```

권한은 다음 단위로 나뉜다.

```text
project.read
project.write
document.generate
document.export
document.submit
template.read
template.write
template.publish
prompt.read
prompt.write
prompt.publish
legal_clause.write
admin.audit.read
```

### 4.2 회사정보 관리

A&C기술사사무소의 기본 정보를 관리한다.

필드:

- 회사명
- 대표자
- 사업자등록번호
- 주소
- 전화번호
- 이메일
- 로고
- 직인 이미지
- 기술사 정보
- 기본 서명 문구
- 기본 메일 footer

### 4.3 문서 템플릿 관리

문서 자동화에 사용할 템플릿을 관리한다.

템플릿 유형:

```text
technical_service_contract
estimate
safety_health_ledger_inspection_report
safety_management_plan
safety_health_ledger
photo_ledger
safety_cost_usage
mail_submission
mail_action_request
approval_checklist
```

템플릿은 다음 구조를 가진다.

```text
DocumentTemplate
→ TemplateVersion
→ TemplateSection
→ TemplateVariable
→ TemplateLoop
→ TemplateCondition
→ TemplatePreviewSample
```

### 4.4 템플릿 변수 관리

템플릿 변수는 dot notation을 사용한다.

예시:

```text
{{project.projectName}}
{{project.siteAddress}}
{{owner.organizationName}}
{{inspection.roundNo}}
{{inspection.actualInspectionDate}}
{{safetyCost.calculatedAmount}}
{{safetyCost.usedAmount}}
{{safetyCost.usedRate}}
{{finding.title}}
{{correctiveAction.actionDetail}}
{{photo.findingPhoto}}
{{photo.actionPhoto}}
```

반복 구문 예시:

```text
{{#each checklistResults}}
  {{itemTitle}} / {{result}} / {{comment}}
{{/each}}
```

조건 구문 예시:

```text
{{#if owner.requiresSeparateReport}}
  발주처별 보고서 문구
{{/if}}
```

### 4.5 체크리스트 템플릿 관리

현장점검 체크리스트 항목과 보고서 매핑을 관리한다.

관리 대상:

- 공통 점검표
- 건축·토목 점검표
- 건설기계 점검표
- 위험성 감소대책 항목
- 추가 유해·위험요인 항목
- 보고서 섹션 매핑
- 항목별 지적사항 후보 생성 규칙

### 4.6 표준 문구 / 법령 문구 라이브러리

문서 자동화에서 사용할 표준 문구와 법령/고시 문구를 관리한다.

구분:

```text
standard_phrase
legal_clause
guideline_text
contract_clause
mail_phrase
review_warning_text
```

법령/고시 문구는 다음 원칙을 따른다.

- 권한 있는 사용자만 수정 가능
- 수정 시 변경 사유 필수
- 발행 전 검토 필요
- 기존 문서에는 자동 소급 적용하지 않음
- 사용된 문서/프롬프트 버전 추적

### 4.7 서비스 AI 프롬프트 관리

ERP 내부에서 실행되는 AI 프롬프트를 관리한다.

프롬프트 예시:

```text
project-info-extraction
contract-draft-generation
inspection-schedule-generation
safety-report-generation
checklist-summary-and-finding-candidate
finding-action-photo-ledger
safety-cost-usage-comment
safety-management-plan-generation
safety-health-ledger-generation
webhard-file-classification
mail-draft-and-classification
approval-submission-readiness
template-variable-mapping-and-prompt-governance
```

프롬프트는 다음 정보를 가진다.

- promptKey
- 이름
- 목적
- 입력 스키마
- 출력 스키마
- 시스템 메시지
- 사용자 메시지 템플릿
- 금지사항
- 테스트케이스
- 버전
- 상태

### 4.8 Codex/구현 프롬프트 저장소

개발 에이전트에게 넣을 구현 프롬프트를 기능별로 저장한다.

구분:

```text
codex_implementation_prompt
design_prompt
reverse_prompt
service_ai_prompt
qa_prompt
all_in_one_context
```

관리 목적:

- 기능별 구현 지시문 일관성 유지
- Reverse Map과 API/모델 불일치 방지
- 기능 추가 시 누적 문맥 유지
- Codex 작업 전 acceptance criteria 명확화

### 4.9 프롬프트 테스트/평가

프롬프트 발행 전 샘플 입력과 예상 출력으로 검증한다.

테스트 항목:

- JSON schema 준수
- 누락정보 분리
- 입력에 없는 정보 생성 금지
- 발주처별 분기 정확성
- 금액/날짜 임의 생성 금지
- 법령 문구 임의 생성 금지
- 사진 누락 warning 생성
- save-before-export 불변 조건 포함

### 4.10 발행/롤백

템플릿과 프롬프트는 발행 전 검토를 거친다.

상태:

```text
draft
review
published
deprecated
archived
```

발행 후에는 새 문서 생성에만 적용하고, 기존 문서는 생성 당시 버전을 유지한다.

## 5. 사용자 흐름

### 문서 템플릿 발행 흐름

```text
템플릿 생성
→ 섹션 작성
→ 변수 등록
→ 반복/조건 설정
→ 샘플 데이터 preview
→ 누락 변수 확인
→ 테스트 통과
→ 검토 요청
→ 승인
→ publish
```

### 프롬프트 발행 흐름

```text
프롬프트 생성
→ 입력/출력 스키마 작성
→ 금지사항 작성
→ 테스트케이스 등록
→ 샘플 실행
→ 결과 평가
→ 검토 요청
→ 승인
→ publish
```

### 법령 문구 변경 흐름

```text
법령 문구 수정 요청
→ 변경 사유 입력
→ 영향 템플릿 확인
→ 기술사 검토
→ 발행
→ 감사로그 기록
```

## 6. 완료 기준

- 사용자를 생성하고 역할/권한을 부여할 수 있다.
- 회사정보, 로고, 직인, 서명 문구를 관리할 수 있다.
- 문서 템플릿을 버전 단위로 관리할 수 있다.
- 템플릿 변수, 반복 섹션, 조건부 섹션을 관리할 수 있다.
- 체크리스트 템플릿과 보고서 섹션 매핑을 관리할 수 있다.
- 표준 문구와 법령 문구를 권한 기반으로 관리할 수 있다.
- 서비스 AI 프롬프트를 버전 단위로 관리할 수 있다.
- Codex/디자인/Reverse Prompt를 기능별로 보관할 수 있다.
- 프롬프트 테스트케이스를 실행하고 결과를 평가할 수 있다.
- 발행/롤백/감사로그가 남는다.


---

## FILE: `docs/aec-erp/13-admin-template-prompt/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 관리자/템플릿/프롬프트

## 1. Frontend Routes

```text
/admin
/admin/users
/admin/users/[userId]
/admin/roles
/admin/permissions
/admin/company
/admin/document-templates
/admin/document-templates/new
/admin/document-templates/[templateId]
/admin/document-templates/[templateId]/versions
/admin/document-templates/[templateId]/sections
/admin/document-templates/[templateId]/variables
/admin/document-templates/[templateId]/preview
/admin/checklist-templates
/admin/checklist-templates/[templateId]
/admin/phrase-library
/admin/legal-clauses
/admin/prompts
/admin/prompts/new
/admin/prompts/[promptId]
/admin/prompts/[promptId]/versions
/admin/prompts/[promptId]/test-cases
/admin/prompts/[promptId]/run
/admin/codex-prompts
/admin/design-prompts
/admin/reverse-prompts
/admin/mail-templates
/admin/webhard-policies
/admin/approval-templates
/admin/signature-assets
/admin/audit-logs
```

## 2. Frontend Components

```text
AdminDashboardPage
UserManagementPage
RolePermissionPage
CompanyProfilePage
DocumentTemplateListPage
DocumentTemplateEditorPage
TemplateVersionHistoryPage
TemplateVariableManagerPage
TemplatePreviewPage
ChecklistTemplateAdminPage
PhraseLibraryPage
LegalClauseManagerPage
PromptRepositoryPage
PromptEditorPage
PromptVersionHistoryPage
PromptTestCasePage
PromptRunConsolePage
CodexPromptRepositoryPage
DesignPromptRepositoryPage
ReversePromptRepositoryPage
MailTemplatePage
WebhardPolicyPage
ApprovalTemplatePage
SignatureAssetPage
AuditLogPage

AdminSidebar
AdminSectionHeader
AdminStatCard
PermissionMatrix
UserRoleSelector
CompanyProfileForm
TemplateTypeBadge
TemplateStatusBadge
TemplateSectionTree
TemplateSectionEditor
TemplateVariableTable
TemplateLoopEditor
TemplateConditionBuilder
TemplatePreviewPane
TemplateImpactPanel
PhraseTable
LegalClauseApprovalPanel
PromptTypeBadge
PromptStatusBadge
PromptSchemaEditor
PromptMessageEditor
PromptGuardrailEditor
PromptTestCaseTable
PromptRunResultPanel
PromptReleaseChecklist
AuditLogTable
VersionDiffViewer
RollbackButton
```

## 3. Backend APIs

### Users / Roles

```text
GET    /api/v1/admin/users
POST   /api/v1/admin/users
GET    /api/v1/admin/users/{userId}
PATCH  /api/v1/admin/users/{userId}
DELETE /api/v1/admin/users/{userId}

GET    /api/v1/admin/roles
POST   /api/v1/admin/roles
PATCH  /api/v1/admin/roles/{roleId}
DELETE /api/v1/admin/roles/{roleId}
GET    /api/v1/admin/permissions
PATCH  /api/v1/admin/roles/{roleId}/permissions
```

### Company Profile

```text
GET   /api/v1/admin/company-profile
PATCH /api/v1/admin/company-profile
POST  /api/v1/admin/company-profile/logo
POST  /api/v1/admin/company-profile/seal
```

### Document Templates

```text
GET    /api/v1/admin/document-templates
POST   /api/v1/admin/document-templates
GET    /api/v1/admin/document-templates/{templateId}
PATCH  /api/v1/admin/document-templates/{templateId}
DELETE /api/v1/admin/document-templates/{templateId}

GET    /api/v1/admin/document-templates/{templateId}/versions
POST   /api/v1/admin/document-templates/{templateId}/versions
GET    /api/v1/admin/template-versions/{versionId}
PATCH  /api/v1/admin/template-versions/{versionId}
POST   /api/v1/admin/template-versions/{versionId}/review
POST   /api/v1/admin/template-versions/{versionId}/publish
POST   /api/v1/admin/template-versions/{versionId}/deprecate
POST   /api/v1/admin/template-versions/{versionId}/rollback

GET    /api/v1/admin/template-versions/{versionId}/sections
POST   /api/v1/admin/template-versions/{versionId}/sections
PATCH  /api/v1/admin/template-sections/{sectionId}
DELETE /api/v1/admin/template-sections/{sectionId}

GET    /api/v1/admin/template-versions/{versionId}/variables
POST   /api/v1/admin/template-versions/{versionId}/variables/extract
PATCH  /api/v1/admin/template-variables/{variableId}
DELETE /api/v1/admin/template-variables/{variableId}

POST   /api/v1/admin/template-versions/{versionId}/preview
POST   /api/v1/admin/template-versions/{versionId}/validate
GET    /api/v1/admin/template-versions/{versionId}/impact
```

### Checklist Templates

```text
GET    /api/v1/admin/checklist-templates
POST   /api/v1/admin/checklist-templates
GET    /api/v1/admin/checklist-templates/{templateId}
PATCH  /api/v1/admin/checklist-templates/{templateId}
POST   /api/v1/admin/checklist-templates/{templateId}/clone
POST   /api/v1/admin/checklist-templates/{templateId}/publish
GET    /api/v1/admin/checklist-templates/{templateId}/items
POST   /api/v1/admin/checklist-templates/{templateId}/items
PATCH  /api/v1/admin/checklist-items/{itemId}
POST   /api/v1/admin/checklist-templates/{templateId}/items/reorder
```

### Phrase / Legal Clause Library

```text
GET    /api/v1/admin/phrases
POST   /api/v1/admin/phrases
PATCH  /api/v1/admin/phrases/{phraseId}
POST   /api/v1/admin/phrases/{phraseId}/publish

GET    /api/v1/admin/legal-clauses
POST   /api/v1/admin/legal-clauses
PATCH  /api/v1/admin/legal-clauses/{clauseId}
POST   /api/v1/admin/legal-clauses/{clauseId}/request-review
POST   /api/v1/admin/legal-clauses/{clauseId}/approve
POST   /api/v1/admin/legal-clauses/{clauseId}/publish
```

### Prompt Repository

```text
GET    /api/v1/admin/prompts
POST   /api/v1/admin/prompts
GET    /api/v1/admin/prompts/{promptId}
PATCH  /api/v1/admin/prompts/{promptId}
DELETE /api/v1/admin/prompts/{promptId}

GET    /api/v1/admin/prompts/{promptId}/versions
POST   /api/v1/admin/prompts/{promptId}/versions
GET    /api/v1/admin/prompt-versions/{versionId}
PATCH  /api/v1/admin/prompt-versions/{versionId}
POST   /api/v1/admin/prompt-versions/{versionId}/run
POST   /api/v1/admin/prompt-versions/{versionId}/review
POST   /api/v1/admin/prompt-versions/{versionId}/publish
POST   /api/v1/admin/prompt-versions/{versionId}/rollback

GET    /api/v1/admin/prompts/{promptId}/test-cases
POST   /api/v1/admin/prompts/{promptId}/test-cases
PATCH  /api/v1/admin/prompt-test-cases/{testCaseId}
DELETE /api/v1/admin/prompt-test-cases/{testCaseId}
POST   /api/v1/admin/prompt-versions/{versionId}/run-test-cases
```

### Policies / Audit

```text
GET   /api/v1/admin/webhard-policies
PATCH /api/v1/admin/webhard-policies
GET   /api/v1/admin/mail-templates
POST  /api/v1/admin/mail-templates
GET   /api/v1/admin/approval-templates
POST  /api/v1/admin/approval-templates
GET   /api/v1/admin/signature-assets
POST  /api/v1/admin/signature-assets
GET   /api/v1/admin/audit-logs
GET   /api/v1/admin/audit-logs/{auditLogId}
```

## 4. Data Models

### AdminUser

```ts
type AdminUser = {
  id: string
  name: string
  email: string
  phone?: string
  department?: string
  position?: string
  status: 'active' | 'invited' | 'disabled' | 'deleted'
  roleIds: string[]
  projectAccessPolicy: 'all' | 'assigned_only' | 'none'
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}
```

### Role / Permission

```ts
type Role = {
  id: string
  key: string
  name: string
  description?: string
  permissionKeys: string[]
  systemRole: boolean
  createdAt: string
  updatedAt: string
}

type Permission = {
  key: string
  group: 'project' | 'document' | 'template' | 'prompt' | 'admin' | 'file' | 'mail' | 'approval'
  label: string
  description?: string
}
```

### CompanyProfile

```ts
type CompanyProfile = {
  id: string
  companyName: string
  representativeName?: string
  businessNumber?: string
  address?: string
  phone?: string
  email?: string
  logoFileId?: string
  sealFileId?: string
  engineerLicenseText?: string
  defaultMailFooter?: string
  defaultDocumentFooter?: string
  updatedAt: string
}
```

### DocumentTemplate / TemplateVersion

```ts
type DocumentTemplateType =
  | 'technical_service_contract'
  | 'estimate'
  | 'safety_health_ledger_inspection_report'
  | 'safety_management_plan'
  | 'safety_health_ledger'
  | 'photo_ledger'
  | 'safety_cost_usage'
  | 'mail_submission'
  | 'mail_action_request'
  | 'approval_checklist'

type TemplateStatus = 'draft' | 'review' | 'published' | 'deprecated' | 'archived'

type DocumentTemplate = {
  id: string
  templateKey: string
  name: string
  documentType: DocumentTemplateType
  description?: string
  currentPublishedVersionId?: string
  status: TemplateStatus
  createdAt: string
  updatedAt: string
}

type TemplateVersion = {
  id: string
  templateId: string
  versionNo: number
  versionName?: string
  status: TemplateStatus
  bodyFormat: 'markdown' | 'html' | 'hwpx_xml' | 'docx_template' | 'json_schema'
  body: string
  variableSchema: Record<string, unknown>
  outputFormats: Array<'pdf' | 'hwpx' | 'docx' | 'markdown' | 'json'>
  createdBy: string
  reviewedBy?: string
  publishedBy?: string
  publishedAt?: string
  changeSummary?: string
  createdAt: string
  updatedAt: string
}
```

### TemplateSection / Variable / Loop / Condition

```ts
type TemplateSection = {
  id: string
  templateVersionId: string
  sectionKey: string
  title: string
  displayOrder: number
  required: boolean
  body: string
  sourceModels: string[]
}

type TemplateVariable = {
  id: string
  templateVersionId: string
  variableKey: string
  label: string
  dataPath: string
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'file' | 'array' | 'object'
  required: boolean
  defaultValue?: unknown
  exampleValue?: unknown
  sourceModel?: string
  ownerSpecific: boolean
  description?: string
}

type TemplateLoop = {
  id: string
  templateVersionId: string
  loopKey: string
  sourcePath: string
  itemAlias: string
  emptyPolicy: 'hide' | 'show_empty_table' | 'show_missing_warning'
}

type TemplateCondition = {
  id: string
  templateVersionId: string
  conditionKey: string
  expression: string
  description?: string
}
```

### Phrase / LegalClause

```ts
type Phrase = {
  id: string
  phraseKey: string
  type: 'standard_phrase' | 'contract_clause' | 'mail_phrase' | 'review_warning_text'
  title: string
  body: string
  status: TemplateStatus
  tags: string[]
  createdAt: string
  updatedAt: string
}

type LegalClause = {
  id: string
  clauseKey: string
  title: string
  body: string
  sourceName?: string
  sourceUrl?: string
  effectiveDate?: string
  status: TemplateStatus
  reviewRequired: boolean
  reviewedBy?: string
  approvedBy?: string
  changeReason?: string
  createdAt: string
  updatedAt: string
}
```

### PromptTemplate / PromptVersion

```ts
type PromptType =
  | 'service_ai'
  | 'codex_implementation'
  | 'design_prompt'
  | 'reverse_prompt'
  | 'qa_prompt'
  | 'all_in_one_context'

type PromptTemplate = {
  id: string
  promptKey: string
  name: string
  promptType: PromptType
  featureId?: string
  description?: string
  currentPublishedVersionId?: string
  status: TemplateStatus
  createdAt: string
  updatedAt: string
}

type PromptVersion = {
  id: string
  promptId: string
  versionNo: number
  status: TemplateStatus
  systemMessage?: string
  userMessageTemplate: string
  inputSchema: Record<string, unknown>
  outputSchema: Record<string, unknown>
  guardrails: string[]
  forbiddenBehaviors: string[]
  linkedTemplateVersionIds: string[]
  createdBy: string
  reviewedBy?: string
  publishedBy?: string
  publishedAt?: string
  changeSummary?: string
  createdAt: string
  updatedAt: string
}
```

### PromptTestCase / PromptRunLog

```ts
type PromptTestCase = {
  id: string
  promptId: string
  name: string
  inputFixture: Record<string, unknown>
  expectedChecks: Array<{
    checkType: 'json_schema' | 'contains' | 'not_contains' | 'field_equals' | 'custom_rule'
    path?: string
    value?: unknown
    description: string
  }>
  createdAt: string
  updatedAt: string
}

type PromptRunLog = {
  id: string
  promptVersionId: string
  testCaseId?: string
  input: Record<string, unknown>
  output: Record<string, unknown> | string
  status: 'passed' | 'failed' | 'warning' | 'manual_review'
  evaluationSummary?: string
  tokenUsage?: Record<string, number>
  createdBy?: string
  createdAt: string
}
```

### AdminAuditLog

```ts
type AdminAuditLog = {
  id: string
  actorId?: string
  action: string
  targetType: string
  targetId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  reason?: string
  ipAddress?: string
  createdAt: string
}
```

## 5. Validation Rules

### DocumentTemplate

- templateKey는 unique여야 한다.
- published 상태가 되려면 최소 1개 TemplateVersion이 published여야 한다.
- TemplateVersion publish 전 variables validation을 통과해야 한다.
- required variable은 dataPath를 가져야 한다.
- ownerSpecific variable은 발주처별 문서에서만 사용 가능하다.
- published TemplateVersion은 직접 수정할 수 없다. 새 version을 생성해야 한다.

### PromptTemplate

- promptKey는 unique여야 한다.
- published PromptVersion은 직접 수정할 수 없다.
- service_ai prompt는 inputSchema와 outputSchema가 필수다.
- 법령/금액/날짜 관련 프롬프트는 forbiddenBehaviors를 가져야 한다.
- publish 전 최소 1개 테스트케이스를 실행해야 한다.

### LegalClause

- legal_text_manager 또는 super_admin만 수정할 수 있다.
- 변경 사유가 필수다.
- publish 전 승인자가 필요하다.
- 기존 문서에는 자동 소급 적용하지 않는다.

### Audit

다음 작업은 반드시 AdminAuditLog를 남긴다.

```text
role permission 변경
template publish / rollback / deprecate
prompt publish / rollback / deprecate
legal clause 변경
company seal 변경
signature asset 업로드/폐기
```

## 6. Service Rules

### Template Publish Flow

```text
1. TemplateVersion validate
2. variable schema 확인
3. loop/condition syntax 확인
4. sample preview 생성
5. required test 통과 확인
6. status = published
7. 기존 published version은 deprecated optional
8. AdminAuditLog 기록
```

### Prompt Publish Flow

```text
1. PromptVersion validate
2. input/output schema 확인
3. guardrails 확인
4. forbiddenBehaviors 확인
5. testCase 실행
6. 결과 통과 확인
7. status = published
8. AdminAuditLog 기록
```

### Template Variable Extraction

```text
template body 입력
→ {{variable}} 추출
→ {{#each loop}} 추출
→ {{#if condition}} 추출
→ dataPath 후보 추천
→ sourceModel 추천
→ required 여부 추천
→ missingVariables 반환
```

### Prompt Run Console

```text
promptVersion 선택
→ input fixture 입력
→ 실행
→ output schema validate
→ forbidden behavior check
→ 결과 저장
→ PromptRunLog 생성
```

## 7. Seed Data

### Default Document Templates

```text
technical_service_contract
safety_health_ledger_inspection_report
photo_ledger
safety_cost_usage
safety_management_plan
safety_health_ledger
mail_submission
mail_action_request
```

### Default Prompt Templates

```text
project-info-extraction
contract-draft-generation
inspection-schedule-generation
safety-report-generation
checklist-summary-and-finding-candidate
finding-action-photo-ledger
safety-cost-usage-comment
safety-management-plan-generation
safety-health-ledger-generation
webhard-file-classification
mail-draft-and-classification
approval-submission-readiness
template-variable-mapping-and-prompt-governance
```

## 8. Tests

```text
test_admin_user_create_success
test_role_permission_update_creates_audit_log
test_company_profile_update_success
test_document_template_create_success
test_template_version_extracts_variables
test_template_version_publish_requires_validation
test_published_template_version_cannot_be_edited
test_template_preview_generates_missing_fields
test_checklist_template_clone_and_publish
test_phrase_create_and_publish
test_legal_clause_update_requires_permission
test_legal_clause_publish_requires_approval
test_prompt_template_create_success
test_prompt_version_requires_schema_for_service_ai
test_prompt_run_logs_output
test_prompt_test_case_execution
test_prompt_publish_requires_test_case_run
test_published_prompt_version_cannot_be_edited
test_template_rollback_creates_audit_log
test_prompt_rollback_creates_audit_log
test_audit_log_filter_by_target_type
```


---

## FILE: `docs/aec-erp/13-admin-template-prompt/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 관리자/템플릿/프롬프트

## 1. 화면 목표

관리자/템플릿/프롬프트 화면은 A&C ERP의 운영 품질을 관리하는 전문가용 설정 화면이다.

일반 사용자에게는 복잡해 보일 수 있으므로, 관리자 화면은 다음 목표를 가진다.

- 설정 항목을 기능별로 명확히 분리한다.
- 문서 템플릿과 프롬프트 버전 상태를 한눈에 보여준다.
- 발행 전 검증/테스트/미리보기를 강하게 유도한다.
- 법령/고시 문구와 일반 문구를 시각적으로 구분한다.
- 위험한 작업은 확인 모달과 감사로그 사유 입력을 요구한다.

## 2. 화면 목록

### 2.1 관리자 대시보드

Route:

```text
/admin
```

표시 카드:

- 사용자 수
- 활성 템플릿 수
- 검토중 템플릿 수
- 발행된 프롬프트 수
- 실패한 프롬프트 테스트
- 최근 법령 문구 변경
- 최근 감사로그

### 2.2 사용자/권한

Routes:

```text
/admin/users
/admin/roles
/admin/permissions
```

화면 구성:

- 사용자 테이블
- 역할 badge
- 프로젝트 접근 정책
- 상태 필터
- 권한 matrix
- 역할별 권한 편집 drawer

### 2.3 회사정보

Route:

```text
/admin/company
```

화면 구성:

- 회사 기본정보 form
- 로고 업로드
- 직인 이미지 업로드
- 기술사 정보
- 기본 문서 footer
- 기본 메일 footer
- 변경 이력

### 2.4 문서 템플릿 목록

Route:

```text
/admin/document-templates
```

컬럼:

| 컬럼 | 설명 |
|---|---|
| 템플릿명 | 문서 템플릿 이름 |
| 문서유형 | 보고서/계약서/사진대지 등 |
| 현재 버전 | published version |
| 상태 | draft/review/published/deprecated |
| 변수 수 | TemplateVariable count |
| 섹션 수 | TemplateSection count |
| 최근 수정 | updatedAt |
| 발행자 | publishedBy |

### 2.5 문서 템플릿 편집기

Route:

```text
/admin/document-templates/[templateId]
```

Layout:

```text
┌─────────────────────────────────────────────────────────┐
│ Template Header: 이름 / 유형 / 버전 / 상태 / 발행 버튼    │
├──────────────┬────────────────────────┬─────────────────┤
│ Section Tree │ Template Editor        │ Preview/Vars    │
│ 260px        │ fluid                  │ 420px           │
└──────────────┴────────────────────────┴─────────────────┘
```

편집 기능:

- 섹션 추가/삭제/정렬
- 변수 삽입
- 반복 섹션 삽입
- 조건부 섹션 삽입
- 표준 문구 삽입
- 법령 문구 삽입
- 샘플 데이터 preview
- 변수 추출
- validation
- version diff

### 2.6 변수 관리자

Route:

```text
/admin/document-templates/[templateId]/variables
```

컬럼:

- variableKey
- label
- dataPath
- sourceModel
- dataType
- required
- ownerSpecific
- exampleValue
- 사용 섹션

### 2.7 체크리스트 템플릿

Route:

```text
/admin/checklist-templates
```

구성:

- 템플릿 목록
- 카테고리 탭
- 항목 편집 table
- 보고서 섹션 매핑
- 주의/불량 시 지적사항 후보 생성 규칙
- 발행/복제/보관 버튼

### 2.8 표준 문구 / 법령 문구

Routes:

```text
/admin/phrase-library
/admin/legal-clauses
```

표준 문구 화면:

- 문구 유형 필터
- 태그
- 본문 미리보기
- 사용 템플릿 목록

법령 문구 화면:

- 더 강한 warning 스타일
- 변경 사유 필수
- 검토/승인 stepper
- 사용 문서/템플릿 영향도
- 변경 이력

### 2.9 프롬프트 저장소

Route:

```text
/admin/prompts
```

컬럼:

- promptKey
- 이름
- 유형
- featureId
- 현재 버전
- 상태
- 테스트 통과율
- 최근 실행
- 발행자

### 2.10 프롬프트 편집기

Route:

```text
/admin/prompts/[promptId]
```

구성:

- system message editor
- user message template editor
- input schema editor
- output schema editor
- guardrails editor
- forbidden behaviors editor
- linked templates
- test cases
- run console
- publish checklist

### 2.11 Prompt Run Console

Route:

```text
/admin/prompts/[promptId]/run
```

구성:

- 입력 fixture JSON editor
- 실행 버튼
- 출력 결과 panel
- schema validation 결과
- forbidden behavior 결과
- 테스트 통과/실패 badge
- PromptRunLog 저장

### 2.12 감사로그

Route:

```text
/admin/audit-logs
```

컬럼:

- 시간
- 사용자
- action
- targetType
- targetName
- 변경 사유
- before/after diff
- IP

## 3. UX 규칙

- published 버전은 편집 불가로 표시한다.
- 새 버전 만들기 버튼을 명확히 제공한다.
- publish 버튼은 검증 통과 전 비활성화한다.
- 법령 문구는 빨간색/주황색 caution area를 사용한다.
- 위험 작업은 항상 confirm modal과 reason field를 요구한다.
- version diff는 좌우 비교 형태로 제공한다.
- 프롬프트 테스트 실패는 publish checklist에서 막는다.
- 템플릿 impact panel은 변경이 영향을 줄 문서유형과 기능을 표시한다.
- 비개발자도 변수/반복/조건을 이해할 수 있도록 설명 tooltip을 제공한다.

## 4. 핵심 컴포넌트

### TemplateSectionTree

- 섹션 목록
- drag reorder
- required badge
- source model badge
- warning count

### TemplateVariableTable

- variableKey
- dataPath
- required
- ownerSpecific
- sourceModel
- example value

### TemplatePreviewPane

- 샘플 프로젝트 선택
- 발주처 선택
- 점검회차 선택
- A4 preview
- missing variables panel

### PromptMessageEditor

- system/user prompt tabs
- markdown editor
- variable insertion helper
- guardrail snippets

### PromptRunResultPanel

- raw output
- parsed JSON
- schema validation
- expected checks
- warnings
- run log

### VersionDiffViewer

- 이전 버전
- 새 버전
- 변경 섹션 highlight
- 변수 변경 highlight

## 5. Empty State

### 템플릿 없음

```text
등록된 문서 템플릿이 없습니다.
공사안전보건대장 이행확인 보고서 템플릿부터 생성하세요.
```

### 프롬프트 없음

```text
등록된 프롬프트가 없습니다.
서비스 AI 프롬프트 또는 Codex 구현 프롬프트를 추가하세요.
```

## 6. Warning State

### Publish 불가

```text
필수 변수 3개가 매핑되지 않았습니다.
템플릿 발행 전 변수 매핑을 완료하세요.
```

### 법령 문구 변경

```text
법령/고시 문구 변경은 기존 문서에 직접 반영되지 않습니다.
변경 사유와 검토자를 입력하세요.
```

### 프롬프트 테스트 실패

```text
프롬프트 테스트케이스 2개가 실패했습니다.
발행 전 실패 원인을 수정하세요.
```

## 7. Responsive

관리자/템플릿/프롬프트 화면은 데스크톱 우선이다.

- Desktop: table + editor + preview 3-column
- Tablet: editor/preview toggle
- Mobile: 조회와 간단 승인만 지원, 복잡한 템플릿 편집은 제한


---

## FILE: `docs/aec-erp/13-admin-template-prompt/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 관리자/템플릿/프롬프트

## 1. Feature

```yaml
featureId: admin.template.prompt
featureName: 관리자/템플릿/프롬프트
priority: P1
module: admin-template-prompt
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 관리자 대시보드 | `/admin` | 설정/템플릿/프롬프트 현황 |
| 사용자 관리 | `/admin/users` | 사용자 생성/상태/역할 관리 |
| 권한 관리 | `/admin/roles` | 역할별 permission matrix |
| 회사정보 | `/admin/company` | 회사명, 로고, 직인, footer |
| 문서 템플릿 목록 | `/admin/document-templates` | 문서 템플릿 조회/필터 |
| 문서 템플릿 편집 | `/admin/document-templates/[templateId]` | 본문/섹션/변수 편집 |
| 템플릿 버전 | `/admin/document-templates/[templateId]/versions` | version history/diff/rollback |
| 템플릿 변수 | `/admin/document-templates/[templateId]/variables` | 변수/dataPath/sourceModel 관리 |
| 템플릿 preview | `/admin/document-templates/[templateId]/preview` | 샘플 데이터 미리보기 |
| 체크리스트 템플릿 | `/admin/checklist-templates` | 점검표 항목/버전 관리 |
| 표준 문구 | `/admin/phrase-library` | 표준 문구/메일 문구 관리 |
| 법령 문구 | `/admin/legal-clauses` | 법령/고시 문구 승인 관리 |
| 프롬프트 저장소 | `/admin/prompts` | promptKey/type/version 관리 |
| 프롬프트 편집 | `/admin/prompts/[promptId]` | message/schema/guardrail 편집 |
| 프롬프트 테스트 | `/admin/prompts/[promptId]/test-cases` | 테스트케이스 관리 |
| Prompt Run | `/admin/prompts/[promptId]/run` | 샘플 실행/평가 |
| Codex 프롬프트 | `/admin/codex-prompts` | 구현 프롬프트 저장소 |
| 디자인 프롬프트 | `/admin/design-prompts` | 기능별 디자인 프롬프트 |
| Reverse Prompt | `/admin/reverse-prompts` | 기능별 역추적 프롬프트 |
| 메일 템플릿 | `/admin/mail-templates` | 제출/조치요청 메일 템플릿 |
| 웹하드 정책 | `/admin/webhard-policies` | 기본 폴더/공유 정책 |
| 결재선 템플릿 | `/admin/approval-templates` | 문서 유형별 결재선 |
| 서명/직인 | `/admin/signature-assets` | 직인/서명 자산 관리 |
| 감사로그 | `/admin/audit-logs` | 관리자 작업 이력 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/admin` | AdminStatCard, AdminRecentActivity, AdminWarningList |
| `/admin/users` | UserTable, UserRoleSelector, UserStatusBadge |
| `/admin/roles` | PermissionMatrix, RoleForm, PermissionGroupTabs |
| `/admin/company` | CompanyProfileForm, LogoUploader, SealUploader |
| `/admin/document-templates` | TemplateTable, TemplateTypeBadge, TemplateStatusBadge |
| `/admin/document-templates/[templateId]` | TemplateSectionTree, TemplateSectionEditor, TemplatePreviewPane |
| `/admin/document-templates/[templateId]/variables` | TemplateVariableTable, TemplateLoopEditor, TemplateConditionBuilder |
| `/admin/document-templates/[templateId]/versions` | VersionDiffViewer, RollbackButton, PublishChecklist |
| `/admin/checklist-templates` | ChecklistTemplateTable, ChecklistItemEditor, ReportMappingEditor |
| `/admin/phrase-library` | PhraseTable, PhraseEditor, UsageTemplateList |
| `/admin/legal-clauses` | LegalClauseTable, LegalClauseApprovalPanel, ImpactPanel |
| `/admin/prompts` | PromptTable, PromptTypeBadge, PromptStatusBadge |
| `/admin/prompts/[promptId]` | PromptMessageEditor, PromptSchemaEditor, PromptGuardrailEditor |
| `/admin/prompts/[promptId]/test-cases` | PromptTestCaseTable, PromptExpectedCheckEditor |
| `/admin/prompts/[promptId]/run` | PromptRunConsole, PromptRunResultPanel |
| `/admin/audit-logs` | AuditLogTable, VersionDiffViewer |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| UserTable | GET `/api/v1/admin/users` |
| UserRoleSelector | PATCH `/api/v1/admin/users/{userId}` |
| PermissionMatrix | GET `/api/v1/admin/permissions`, PATCH `/api/v1/admin/roles/{roleId}/permissions` |
| CompanyProfileForm | GET/PATCH `/api/v1/admin/company-profile` |
| LogoUploader | POST `/api/v1/admin/company-profile/logo` |
| SealUploader | POST `/api/v1/admin/company-profile/seal` |
| TemplateTable | GET `/api/v1/admin/document-templates` |
| TemplateSectionEditor | PATCH `/api/v1/admin/template-sections/{sectionId}` |
| TemplateVariableTable | GET `/api/v1/admin/template-versions/{versionId}/variables` |
| TemplatePreviewPane | POST `/api/v1/admin/template-versions/{versionId}/preview` |
| PublishChecklist | POST `/api/v1/admin/template-versions/{versionId}/validate`, POST `/publish` |
| PromptTable | GET `/api/v1/admin/prompts` |
| PromptMessageEditor | PATCH `/api/v1/admin/prompt-versions/{versionId}` |
| PromptRunConsole | POST `/api/v1/admin/prompt-versions/{versionId}/run` |
| PromptTestCaseTable | GET/POST `/api/v1/admin/prompts/{promptId}/test-cases` |
| LegalClauseApprovalPanel | POST `/request-review`, POST `/approve`, POST `/publish` |
| AuditLogTable | GET `/api/v1/admin/audit-logs` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| `/admin/users` | AdminUser, Role |
| `/admin/roles` | Role, Permission, AdminAuditLog |
| `/admin/company-profile` | CompanyProfile, FileAsset, AdminAuditLog |
| `/admin/document-templates` | DocumentTemplate |
| `/admin/template-versions` | TemplateVersion, TemplateSection, TemplateVariable |
| `/template-versions/{id}/preview` | TemplatePreviewRun, MissingField |
| `/template-versions/{id}/publish` | TemplateVersion, AdminAuditLog |
| `/admin/checklist-templates` | ChecklistTemplate, ChecklistItem |
| `/admin/phrases` | Phrase, AdminAuditLog |
| `/admin/legal-clauses` | LegalClause, AdminAuditLog |
| `/admin/prompts` | PromptTemplate, PromptVersion |
| `/prompt-versions/{id}/run` | PromptVersion, PromptRunLog |
| `/prompt-versions/{id}/run-test-cases` | PromptTestCase, PromptRunLog |
| `/admin/audit-logs` | AdminAuditLog |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| DocumentTemplate | template-variable-mapping-and-prompt-governance |
| TemplateVersion | template-variable-mapping-and-prompt-governance |
| TemplateVariable | template-variable-mapping-and-prompt-governance |
| TemplateLoop | template-variable-mapping-and-prompt-governance |
| TemplateCondition | template-variable-mapping-and-prompt-governance |
| PromptTemplate | template-variable-mapping-and-prompt-governance |
| PromptVersion | template-variable-mapping-and-prompt-governance |
| PromptTestCase | template-variable-mapping-and-prompt-governance |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 사용자 생성 | test_admin_user_create_success |
| 권한 변경 | test_role_permission_update_creates_audit_log |
| 회사정보 수정 | test_company_profile_update_success |
| 템플릿 생성 | test_document_template_create_success |
| 변수 추출 | test_template_version_extracts_variables |
| 템플릿 발행 검증 | test_template_version_publish_requires_validation |
| published 편집 방지 | test_published_template_version_cannot_be_edited |
| 템플릿 미리보기 | test_template_preview_generates_missing_fields |
| 체크리스트 발행 | test_checklist_template_clone_and_publish |
| 표준 문구 발행 | test_phrase_create_and_publish |
| 법령 권한 | test_legal_clause_update_requires_permission |
| 법령 승인 | test_legal_clause_publish_requires_approval |
| 프롬프트 생성 | test_prompt_template_create_success |
| 프롬프트 schema | test_prompt_version_requires_schema_for_service_ai |
| 프롬프트 실행로그 | test_prompt_run_logs_output |
| 테스트케이스 실행 | test_prompt_test_case_execution |
| 프롬프트 발행 검증 | test_prompt_publish_requires_test_case_run |
| published 프롬프트 편집 방지 | test_published_prompt_version_cannot_be_edited |
| 템플릿 롤백 | test_template_rollback_creates_audit_log |
| 프롬프트 롤백 | test_prompt_rollback_creates_audit_log |
| 감사로그 필터 | test_audit_log_filter_by_target_type |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | project-info-extraction prompt, project form schema |
| 계약/견적 | contract template, payment phrase, contract prompt |
| 점검회차/일정 | schedule-generation prompt, task template |
| 보고서 자동화 | DocumentTemplate, TemplateVersion, safety-report prompt |
| 체크리스트 | ChecklistTemplate, ChecklistItem, report mapping |
| 사진대지 | photo_ledger template, caption prompt |
| 산업안전보건관리비 | safety_cost template, comment prompt |
| 안전관리계획서 | plan template, risk phrase library |
| 안전보건대장 | ledger template, risk register mapping |
| 웹하드 | folder policy, file-classification prompt |
| 메일함 | mail templates, mail-draft prompt |
| 결재/제출 | approval templates, signature assets, submission checklist |
| 대시보드/통계 | admin status, template/prompt warnings |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| published 템플릿 직접 수정 | 새 버전 생성만 허용 |
| 프롬프트 변경으로 문서 품질 저하 | 테스트케이스 통과 전 publish 차단 |
| 법령 문구 임의 변경 | legal_text_manager 권한과 승인 workflow |
| 기존 문서가 새 템플릿 변경으로 깨짐 | 문서 생성 시 templateVersionId snapshot 저장 |
| 변수명 중복/불일치 | variable registry와 validation |
| 발주처별 변수 누락 | ownerSpecific flag와 preview warning |
| Codex 프롬프트와 Reverse Map 불일치 | prompt featureId와 Reverse Map 연결 |
| 감사로그 누락 | 위험 작업 API에 audit middleware 적용 |


---

## FILE: `docs/aec-erp/13-admin-template-prompt/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 템플릿 변수 매핑 및 프롬프트 거버넌스

## Prompt ID

`template-variable-mapping-and-prompt-governance`

## 목적

문서 템플릿 본문, 기존 생성 문서, 기능 명세, Reverse Map, 프롬프트 초안을 분석하여 템플릿 변수, 반복 섹션, 조건부 섹션, 입력 스키마, 출력 스키마, 테스트케이스, 금지사항을 제안한다.

## Prompt

```text
너는 A&C 기술사 ERP의 템플릿/프롬프트 관리 보조 엔진이다.

입력:
- templateBody
- documentType
- featureId
- existingDomainModels
- reverseMap
- sampleProjectData
- existingPromptText
- userInstruction

목표:
문서 자동화에 필요한 템플릿 변수와 프롬프트 거버넌스 정보를 구조화한다.

해야 할 일:
1. 템플릿 본문에서 {{variable}} 형태의 변수를 추출한다.
2. {{#each}} 반복 섹션을 추출한다.
3. {{#if}} 조건부 섹션을 추출한다.
4. 각 변수의 dataPath 후보를 제안한다.
5. 각 변수의 sourceModel 후보를 제안한다.
6. 발주처별로 달라지는 변수는 ownerSpecific = true로 표시한다.
7. 필수 변수와 권장 변수를 구분한다.
8. 입력 스키마와 출력 스키마 초안을 제안한다.
9. 프롬프트에 필요한 guardrails와 forbiddenBehaviors를 제안한다.
10. 테스트케이스를 제안한다.
11. 템플릿/프롬프트가 기존 Reverse Map과 충돌하는 부분을 warnings에 표시한다.
12. 입력에 없는 법령, 금액, 날짜, 기관명은 생성하지 않는다.

작성 규칙:
- 변수명은 dot notation을 우선한다.
- snake_case 변수는 기존 템플릿과 충돌하지 않을 때만 사용한다.
- Project, ProjectParty, InspectionRound, DocumentInstance, FileAsset 등 기존 모델명을 우선 사용한다.
- 발주처별 보고서 문서에는 ownerPartyId 관련 변수가 필요하다.
- 문서 export 관련 프롬프트에는 save-before-export 조건을 포함해야 한다.
- 법령 문구 관련 템플릿은 legal_clause library와 연결해야 한다.
- AI가 확정해서는 안 되는 값은 forbiddenBehaviors에 추가한다.

출력 JSON:
{
  "templateAnalysis": {
    "documentType": "",
    "featureId": "",
    "detectedVariables": [
      {
        "variableKey": "",
        "label": "",
        "dataPathCandidate": "",
        "sourceModelCandidate": "",
        "dataType": "string | number | date | boolean | file | array | object",
        "required": true,
        "ownerSpecific": false,
        "reason": ""
      }
    ],
    "detectedLoops": [
      {
        "loopKey": "",
        "sourcePathCandidate": "",
        "itemAlias": "",
        "emptyPolicy": "hide | show_empty_table | show_missing_warning"
      }
    ],
    "detectedConditions": [
      {
        "conditionKey": "",
        "expressionCandidate": "",
        "description": ""
      }
    ]
  },
  "promptGovernance": {
    "promptKey": "",
    "promptType": "service_ai | codex_implementation | design_prompt | reverse_prompt | qa_prompt",
    "inputSchemaDraft": {},
    "outputSchemaDraft": {},
    "guardrails": [],
    "forbiddenBehaviors": [],
    "recommendedTestCases": [
      {
        "name": "",
        "purpose": "",
        "inputFixture": {},
        "expectedChecks": []
      }
    ]
  },
  "reverseMapSuggestions": {
    "routes": [],
    "components": [],
    "apis": [],
    "models": [],
    "tests": []
  },
  "missingFields": [
    {
      "field": "",
      "label": "",
      "reason": ""
    }
  ],
  "warnings": [
    {
      "type": "schema_mismatch | reverse_map_mismatch | owner_specific_missing | legal_clause_risk | missing_test_case | unknown_variable",
      "severity": "info | warning | danger",
      "message": ""
    }
  ]
}
```

## Few-shot 기준

### 입력 예시

```text
문서 본문:
{{project.projectName}}
{{owner.organizationName}}
{{inspection.roundNo}}
{{#each findings}}
- {{title}} / {{correctiveAction.actionDetail}}
{{/each}}
```

### 출력 방향

- `project.projectName`은 Project.sourceModel, required true
- `owner.organizationName`은 ProjectParty/Organization sourceModel, ownerSpecific true
- `inspection.roundNo`는 InspectionRound sourceModel, required true
- `findings`는 Finding 반복 루프, emptyPolicy는 show_missing_warning
- `correctiveAction.actionDetail`은 CorrectiveAction sourceModel
- 발주처별 보고서라면 ownerPartyId 필수 warning을 넣는다.

## 금지사항

- 입력에 없는 법령/고시 문구를 새로 만들지 않는다.
- 금액, 날짜, 기관명을 임의 보정하지 않는다.
- published 템플릿을 직접 수정하라고 제안하지 않는다.
- 기존 문서에 새 템플릿을 자동 소급 적용하라고 제안하지 않는다.
- 테스트케이스 없이 publish하라고 제안하지 않는다.
```


---

## FILE: `docs/aec-erp/13-admin-template-prompt/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 관리자/템플릿/프롬프트

## Prompt

```text
You are implementing the Admin, Template, and Prompt Repository module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module manages users, roles, permissions, company profile, document templates, checklist templates, phrase/legal clause libraries, service AI prompts, Codex implementation prompts, design prompts, reverse prompts, test cases, release/rollback, and audit logs.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Admin / Template / Prompt module.

Existing concepts:
- Project
- DocumentInstance
- ChecklistTemplate
- FileAsset
- MailTemplate
- ApprovalWorkflow
- AuditLog

Required backend models:
- AdminUser
- Role
- Permission
- CompanyProfile
- DocumentTemplate
- TemplateVersion
- TemplateSection
- TemplateVariable
- TemplateLoop
- TemplateCondition
- TemplatePreviewRun
- Phrase
- LegalClause
- PromptTemplate
- PromptVersion
- PromptTestCase
- PromptRunLog
- WebhardPolicy
- MailTemplate
- ApprovalTemplate
- SignatureAsset
- AdminAuditLog

Required backend APIs:

Users / Roles:
- GET /api/v1/admin/users
- POST /api/v1/admin/users
- GET /api/v1/admin/users/{userId}
- PATCH /api/v1/admin/users/{userId}
- DELETE /api/v1/admin/users/{userId}
- GET /api/v1/admin/roles
- POST /api/v1/admin/roles
- PATCH /api/v1/admin/roles/{roleId}
- DELETE /api/v1/admin/roles/{roleId}
- GET /api/v1/admin/permissions
- PATCH /api/v1/admin/roles/{roleId}/permissions

Company Profile:
- GET /api/v1/admin/company-profile
- PATCH /api/v1/admin/company-profile
- POST /api/v1/admin/company-profile/logo
- POST /api/v1/admin/company-profile/seal

Document Templates:
- GET /api/v1/admin/document-templates
- POST /api/v1/admin/document-templates
- GET /api/v1/admin/document-templates/{templateId}
- PATCH /api/v1/admin/document-templates/{templateId}
- DELETE /api/v1/admin/document-templates/{templateId}
- GET /api/v1/admin/document-templates/{templateId}/versions
- POST /api/v1/admin/document-templates/{templateId}/versions
- GET /api/v1/admin/template-versions/{versionId}
- PATCH /api/v1/admin/template-versions/{versionId}
- POST /api/v1/admin/template-versions/{versionId}/review
- POST /api/v1/admin/template-versions/{versionId}/publish
- POST /api/v1/admin/template-versions/{versionId}/deprecate
- POST /api/v1/admin/template-versions/{versionId}/rollback
- GET /api/v1/admin/template-versions/{versionId}/sections
- POST /api/v1/admin/template-versions/{versionId}/sections
- PATCH /api/v1/admin/template-sections/{sectionId}
- DELETE /api/v1/admin/template-sections/{sectionId}
- GET /api/v1/admin/template-versions/{versionId}/variables
- POST /api/v1/admin/template-versions/{versionId}/variables/extract
- PATCH /api/v1/admin/template-variables/{variableId}
- DELETE /api/v1/admin/template-variables/{variableId}
- POST /api/v1/admin/template-versions/{versionId}/preview
- POST /api/v1/admin/template-versions/{versionId}/validate
- GET /api/v1/admin/template-versions/{versionId}/impact

Checklist Templates:
- GET /api/v1/admin/checklist-templates
- POST /api/v1/admin/checklist-templates
- GET /api/v1/admin/checklist-templates/{templateId}
- PATCH /api/v1/admin/checklist-templates/{templateId}
- POST /api/v1/admin/checklist-templates/{templateId}/clone
- POST /api/v1/admin/checklist-templates/{templateId}/publish

Phrase / Legal Clause Library:
- GET /api/v1/admin/phrases
- POST /api/v1/admin/phrases
- PATCH /api/v1/admin/phrases/{phraseId}
- POST /api/v1/admin/phrases/{phraseId}/publish
- GET /api/v1/admin/legal-clauses
- POST /api/v1/admin/legal-clauses
- PATCH /api/v1/admin/legal-clauses/{clauseId}
- POST /api/v1/admin/legal-clauses/{clauseId}/request-review
- POST /api/v1/admin/legal-clauses/{clauseId}/approve
- POST /api/v1/admin/legal-clauses/{clauseId}/publish

Prompt Repository:
- GET /api/v1/admin/prompts
- POST /api/v1/admin/prompts
- GET /api/v1/admin/prompts/{promptId}
- PATCH /api/v1/admin/prompts/{promptId}
- DELETE /api/v1/admin/prompts/{promptId}
- GET /api/v1/admin/prompts/{promptId}/versions
- POST /api/v1/admin/prompts/{promptId}/versions
- GET /api/v1/admin/prompt-versions/{versionId}
- PATCH /api/v1/admin/prompt-versions/{versionId}
- POST /api/v1/admin/prompt-versions/{versionId}/run
- POST /api/v1/admin/prompt-versions/{versionId}/review
- POST /api/v1/admin/prompt-versions/{versionId}/publish
- POST /api/v1/admin/prompt-versions/{versionId}/rollback
- GET /api/v1/admin/prompts/{promptId}/test-cases
- POST /api/v1/admin/prompts/{promptId}/test-cases
- PATCH /api/v1/admin/prompt-test-cases/{testCaseId}
- DELETE /api/v1/admin/prompt-test-cases/{testCaseId}
- POST /api/v1/admin/prompt-versions/{versionId}/run-test-cases

Policies / Audit:
- GET /api/v1/admin/webhard-policies
- PATCH /api/v1/admin/webhard-policies
- GET /api/v1/admin/mail-templates
- POST /api/v1/admin/mail-templates
- GET /api/v1/admin/approval-templates
- POST /api/v1/admin/approval-templates
- GET /api/v1/admin/signature-assets
- POST /api/v1/admin/signature-assets
- GET /api/v1/admin/audit-logs
- GET /api/v1/admin/audit-logs/{auditLogId}

Required frontend routes:
- /admin
- /admin/users
- /admin/roles
- /admin/company
- /admin/document-templates
- /admin/document-templates/[templateId]
- /admin/document-templates/[templateId]/versions
- /admin/document-templates/[templateId]/sections
- /admin/document-templates/[templateId]/variables
- /admin/document-templates/[templateId]/preview
- /admin/checklist-templates
- /admin/phrase-library
- /admin/legal-clauses
- /admin/prompts
- /admin/prompts/[promptId]
- /admin/prompts/[promptId]/versions
- /admin/prompts/[promptId]/test-cases
- /admin/prompts/[promptId]/run
- /admin/codex-prompts
- /admin/design-prompts
- /admin/reverse-prompts
- /admin/mail-templates
- /admin/webhard-policies
- /admin/approval-templates
- /admin/signature-assets
- /admin/audit-logs

Business requirements:
1. Published template versions cannot be edited directly. Create a new version instead.
2. Published prompt versions cannot be edited directly. Create a new version instead.
3. Template publish requires validation, sample preview, and no required missing variables.
4. Service AI prompt publish requires inputSchema, outputSchema, guardrails, forbiddenBehaviors, and at least one executed test case.
5. Legal clauses require special permission and approval before publishing.
6. Role permission changes must create AdminAuditLog.
7. Template publish, rollback, deprecate must create AdminAuditLog.
8. Prompt publish, rollback, deprecate must create AdminAuditLog.
9. Template variable extraction should detect variables, loops, and conditions.
10. Prompt run console must validate output schema and save PromptRunLog.
11. Template impact endpoint must show which document types and existing drafts could be affected.
12. Seed default document templates and prompt templates for all previous modules 01~12.

Validation:
1. templateKey and promptKey must be unique.
2. template version status transitions must be valid.
3. prompt version status transitions must be valid.
4. legal clause update requires changeReason.
5. company seal upload requires admin permission.
6. rollback requires target version and reason.
7. publish cannot happen if validation errors exist.

Seed data:
- Roles: super_admin, admin, template_manager, prompt_manager, legal_text_manager, engineer, writer, contract_manager, field_inspector, viewer
- Document templates: technical_service_contract, safety_health_ledger_inspection_report, photo_ledger, safety_cost_usage, safety_management_plan, safety_health_ledger, mail_submission, mail_action_request
- Prompt templates: project-info-extraction, contract-draft-generation, inspection-schedule-generation, safety-report-generation, checklist-summary-and-finding-candidate, finding-action-photo-ledger, safety-cost-usage-comment, safety-management-plan-generation, safety-health-ledger-generation, webhard-file-classification, mail-draft-and-classification, approval-submission-readiness, template-variable-mapping-and-prompt-governance

Tests:
- test_admin_user_create_success
- test_role_permission_update_creates_audit_log
- test_company_profile_update_success
- test_document_template_create_success
- test_template_version_extracts_variables
- test_template_version_publish_requires_validation
- test_published_template_version_cannot_be_edited
- test_template_preview_generates_missing_fields
- test_checklist_template_clone_and_publish
- test_phrase_create_and_publish
- test_legal_clause_update_requires_permission
- test_legal_clause_publish_requires_approval
- test_prompt_template_create_success
- test_prompt_version_requires_schema_for_service_ai
- test_prompt_run_logs_output
- test_prompt_test_case_execution
- test_prompt_publish_requires_test_case_run
- test_published_prompt_version_cannot_be_edited
- test_template_rollback_creates_audit_log
- test_prompt_rollback_creates_audit_log
- test_audit_log_filter_by_target_type

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Template validation service
- Template preview service
- Prompt run/test service
- Permission guard helpers
- Frontend admin pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```


---

## FILE: `docs/aec-erp/13-admin-template-prompt/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 관리자/템플릿/프롬프트

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "관리자/템플릿/프롬프트" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 프로젝트, 계약, 점검, 보고서, 웹하드, 메일, 결재를 통합 관리하는 ERP
- 관리자/템플릿/프롬프트 화면은 문서 자동화 품질을 통제하는 운영자용 화면
- 문서 템플릿, 체크리스트 템플릿, 표준 문구, 법령 문구, 서비스 AI 프롬프트, Codex 구현 프롬프트, 디자인 프롬프트, Reverse Prompt를 버전 단위로 관리한다.

화면 1: 관리자 대시보드
- 좌측 ERP 관리자 사이드바
- 상단 "관리자" page header
- 요약 카드:
  - 사용자 수
  - 활성 템플릿 수
  - 검토중 템플릿 수
  - 발행된 프롬프트 수
  - 실패한 프롬프트 테스트
  - 최근 법령 문구 변경
- 하단에는 최근 감사로그 table

화면 2: 문서 템플릿 목록
- 필터:
  - 문서유형
  - 상태
  - 버전
  - 작성자
- 테이블 컬럼:
  - 템플릿명
  - 문서유형
  - 현재 버전
  - 상태
  - 변수 수
  - 섹션 수
  - 최근 수정
  - 발행자
- 상태 badge:
  - draft: gray
  - review: purple
  - published: green
  - deprecated: orange
  - archived: gray

화면 3: 문서 템플릿 편집기
- 3-column layout:
  - 좌측: 섹션 트리
  - 중앙: 템플릿 본문 편집기
  - 우측: 변수/미리보기/영향도 패널
- 상단 sticky header:
  - 템플릿명
  - 문서유형
  - 버전
  - 상태
  - 새 버전 만들기
  - 검증
  - 검토요청
  - 발행
- 편집기에는 변수 삽입 버튼, 반복 섹션 삽입 버튼, 조건부 섹션 삽입 버튼을 제공한다.
- published 버전은 읽기 전용으로 표시하고, "새 버전 만들기"를 강조한다.

화면 4: 변수 관리자
- 변수 table:
  - variableKey
  - label
  - dataPath
  - sourceModel
  - dataType
  - required
  - ownerSpecific
  - exampleValue
- ownerSpecific 변수는 파란색 outline badge로 표시한다.
- required인데 dataPath가 없으면 빨간 warning을 표시한다.

화면 5: 체크리스트 템플릿 관리자
- 카테고리 탭:
  - 공통
  - 건축·토목
  - 건설기계
  - 위험성 감소대책
  - 추가 유해·위험요인
- 항목 편집 table
- 보고서 섹션 매핑 column
- 주의/불량 시 지적사항 후보 생성 규칙 toggle
- 발행/복제/보관 버튼

화면 6: 법령/표준 문구 라이브러리
- 표준 문구와 법령 문구를 탭으로 분리한다.
- 법령 문구 탭은 더 강한 caution 스타일을 사용한다.
- 법령 문구 변경 시 변경 사유, 검토자, 승인자 입력 영역을 보여준다.
- 사용 중인 템플릿 목록과 영향도 panel을 표시한다.

화면 7: 프롬프트 저장소
- 프롬프트 목록 table:
  - promptKey
  - 이름
  - 유형
  - featureId
  - 현재 버전
  - 상태
  - 테스트 통과율
  - 최근 실행
  - 발행자
- 프롬프트 유형 badge:
  - service_ai
  - codex_implementation
  - design_prompt
  - reverse_prompt
  - qa_prompt

화면 8: 프롬프트 편집기
- 3-column 또는 split layout:
  - 좌측: 버전/테스트케이스 목록
  - 중앙: system message / user message template editor
  - 우측: input schema / output schema / guardrails / forbidden behaviors
- 하단 또는 우측에 Prompt Run Console을 둔다.
- 실행 결과는 raw output, parsed JSON, schema validation, expected checks로 나누어 표시한다.
- 테스트 실패 시 publish 버튼을 비활성화한다.

화면 9: 감사로그
- 필터:
  - 기간
  - 사용자
  - action
  - targetType
  - targetId
- table:
  - 시간
  - 사용자
  - action
  - targetType
  - targetName
  - 변경 사유
  - before/after diff
- diff viewer는 좌우 비교로 보여준다.

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- 관리자 화면은 정보 밀도가 높지만 기능 구역이 명확해야 한다.
- 템플릿 편집기는 개발자 도구처럼 보이되 비개발자도 이해 가능해야 한다.
- 법령 문구와 위험 작업은 주황/빨강 caution 영역으로 강조한다.
- published 상태는 초록색, review는 보라색, draft는 회색, deprecated는 주황색
- 감사로그와 버전 diff는 신뢰감 있고 명확하게 표현한다.
- 한글 가독성을 최우선으로 한다.

결과물:
- 관리자 대시보드
- 사용자/권한 관리 화면
- 회사정보 화면
- 문서 템플릿 목록 화면
- 문서 템플릿 편집기 화면
- 변수 관리자 화면
- 체크리스트 템플릿 관리자 화면
- 법령/표준 문구 라이브러리 화면
- 프롬프트 저장소 화면
- 프롬프트 편집기 + Run Console 화면
- 감사로그 화면
```


---

## FILE: `docs/aec-erp/13-admin-template-prompt/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 관리자/템플릿/프롬프트

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
관리자/템플릿/프롬프트

기능 설명:
관리자/템플릿/프롬프트는 사용자/권한, 회사정보, 문서 템플릿, 체크리스트 템플릿, 표준 문구, 법령/고시 문구, 서비스 AI 프롬프트, Codex 구현 프롬프트, 디자인 프롬프트, Reverse Prompt, 메일 템플릿, 웹하드 정책, 결재선 템플릿, 감사로그를 관리하는 운영 모듈이다.

업무 맥락:
- A&C ERP의 문서 자동화는 DocumentTemplate과 PromptTemplate의 버전에 의존한다.
- 공사안전보건대장 이행확인 보고서, 안전관리계획서, 안전보건대장, 사진대지는 모두 템플릿 버전으로 생성되어야 한다.
- 서비스 AI 실행 결과는 promptVersionId를 남겨야 한다.
- published 템플릿/프롬프트는 직접 수정하면 안 되고 새 버전을 만들어야 한다.
- 법령/고시 문구는 별도 권한과 승인, 감사로그가 필요하다.
- Codex 구현 프롬프트와 Reverse Prompt도 기능별로 보관되어야 한다.
- 발행 전 preview, validation, test case 실행이 필요하다.

입력:
{
  "featureName": "관리자/템플릿/프롬프트",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "securityRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `admin.template.prompt`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 계약/견적
    - 점검회차/일정
    - 보고서 자동화
    - 체크리스트
    - 지적사항/사진대지
    - 산업안전보건관리비
    - 안전관리계획서
    - 안전보건대장
    - 웹하드
    - 메일함
    - 결재/제출
    - 대시보드/통계

출력 JSON:
{
  "featureId": "admin.template.prompt",
  "featureName": "관리자/템플릿/프롬프트",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /admin
- /admin/users
- /admin/roles
- /admin/company
- /admin/document-templates
- /admin/document-templates/[templateId]
- /admin/document-templates/[templateId]/versions
- /admin/document-templates/[templateId]/variables
- /admin/document-templates/[templateId]/preview
- /admin/checklist-templates
- /admin/phrase-library
- /admin/legal-clauses
- /admin/prompts
- /admin/prompts/[promptId]
- /admin/prompts/[promptId]/versions
- /admin/prompts/[promptId]/test-cases
- /admin/prompts/[promptId]/run
- /admin/codex-prompts
- /admin/design-prompts
- /admin/reverse-prompts
- /admin/mail-templates
- /admin/webhard-policies
- /admin/approval-templates
- /admin/signature-assets
- /admin/audit-logs

반드시 포함할 models:
- AdminUser
- Role
- Permission
- CompanyProfile
- DocumentTemplate
- TemplateVersion
- TemplateSection
- TemplateVariable
- TemplateLoop
- TemplateCondition
- TemplatePreviewRun
- Phrase
- LegalClause
- PromptTemplate
- PromptVersion
- PromptTestCase
- PromptRunLog
- WebhardPolicy
- MailTemplate
- ApprovalTemplate
- SignatureAsset
- AdminAuditLog

반드시 포함할 prompts:
- template-variable-mapping-and-prompt-governance
- admin-template-prompt implementation prompt
- admin-template-prompt design prompt

반드시 포함할 tests:
- test_admin_user_create_success
- test_role_permission_update_creates_audit_log
- test_company_profile_update_success
- test_document_template_create_success
- test_template_version_extracts_variables
- test_template_version_publish_requires_validation
- test_published_template_version_cannot_be_edited
- test_template_preview_generates_missing_fields
- test_checklist_template_clone_and_publish
- test_phrase_create_and_publish
- test_legal_clause_update_requires_permission
- test_legal_clause_publish_requires_approval
- test_prompt_template_create_success
- test_prompt_version_requires_schema_for_service_ai
- test_prompt_run_logs_output
- test_prompt_test_case_execution
- test_prompt_publish_requires_test_case_run
- test_published_prompt_version_cannot_be_edited
- test_template_rollback_creates_audit_log
- test_prompt_rollback_creates_audit_log
- test_audit_log_filter_by_target_type

주의:
- published 템플릿은 직접 수정할 수 없다.
- published 프롬프트는 직접 수정할 수 없다.
- 법령/고시 문구는 권한과 승인 없이 수정할 수 없다.
- 템플릿 변경은 기존 생성 문서에 자동 소급 적용하면 안 된다.
- 문서 생성 시 templateVersionId를 남겨야 한다.
- AI 실행 시 promptVersionId를 남겨야 한다.
- 프롬프트 발행 전 테스트케이스 실행이 필요하다.
- 위험 작업은 AdminAuditLog를 반드시 남겨야 한다.
```


---

## FILE: `docs/aec-erp/14-dashboard-statistics/README.md`

# 기능 14 — 대시보드/통계

이 폴더는 A&C 기술사 ERP의 열네 번째 기능인 `대시보드/통계` 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

대시보드/통계는 00~13 모듈에서 생성되는 업무 데이터를 한 화면에 모아, 오늘 해야 할 일과 위험 신호를 보여주는 운영 관제 기능이다.

핵심 흐름은 아래와 같다.

```text
Project
→ InspectionRound
→ ChecklistSession
→ Finding / CorrectiveAction
→ PhotoLedger
→ SafetyCostUsage
→ DocumentInstance
→ ApprovalWorkflow / SignatureTask
→ Submission
→ MailThread / FileAsset
→ DashboardSnapshot / StatisticsMetric / AlertRule
```

이 기능은 원본 데이터를 직접 수정하지 않는다. 집계, 요약, 알림, 통계, 우선순위 제안만 수행한다.

## 주요 지표

- 오늘/이번 주 점검
- 제출 예정 보고서
- 미제출 보고서
- 미조치 지적사항
- 조치 지연 건수
- 사진대지 누락 건수
- 산업안전보건관리비 사용률
- 결재/서명/날인 대기
- 발주처별 제출 상태
- 웹하드 최근 파일
- 메일 미분류/미확인
- 프로젝트별 리스크 점수


---

## FILE: `docs/aec-erp/14-dashboard-statistics/markdown/01_PRODUCT_MARKDOWN.md`

# 01. Product Markdown — 대시보드/통계

## 1. 기능 정의

대시보드/통계는 A&C 기술사 ERP의 모든 업무 데이터를 프로젝트, 점검회차, 발주처, 문서, 지적사항, 제출 상태 기준으로 집계하여 현재 업무 상태와 위험 신호를 보여주는 기능이다.

이 기능은 업무 원본 데이터를 수정하는 기능이 아니라, 다음을 제공하는 관제 레이어다.

```text
업무 요약
→ 긴급 업무 정렬
→ 제출/점검/조치 지연 알림
→ 프로젝트별 위험도
→ 발주처별 제출 현황
→ 월간/분기별 통계
→ 반복 지적사항 분석
→ AI 업무 브리핑
```

## 2. 이 기능이 필요한 이유

A&C ERP의 핵심 데이터는 여러 모듈에 분산된다.

| 데이터 | 모듈 |
|---|---|
| 공사개요, 발주처, 시공사 | 프로젝트/현장 원장 |
| 계약기간, 점검횟수, 지급조건 | 계약/견적 |
| 점검일, 회차, 발주처별 보고서 업무 | 점검회차/일정 |
| 점검표, 위험성 감소대책 | 현장점검 체크리스트 |
| 지적사항, 조치현황, 사진대지 | 지적/조치/사진대지 |
| 산업안전보건관리비 사용률 | 안전관리비 사용내용 확인 |
| 안전관리계획서, 안전보건대장 | 문서 자동화 |
| 최종본, 날인본, 공유 링크 | 웹하드 |
| 제출 메일, 조치요청 메일 | 메일함 |
| 결재, 서명, 제출 | 결재/서명/제출 |

실무자는 이 데이터를 하나씩 찾아보는 것이 아니라, 오늘 무엇을 해야 하는지, 어떤 프로젝트가 지연되는지, 어떤 발주처 제출이 남았는지를 한눈에 봐야 한다.

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 대표/건설안전기술사 | 전체 프로젝트 리스크, 결재 대기, 제출 지연 확인 |
| 상무/점검 담당자 | 오늘/이번 주 점검, 체크리스트 미완료, 조치 확인 업무 확인 |
| 문서 작성자 | 보고서 초안/검토/최종본/제출 상태 확인 |
| 계약/행정 담당자 | 지급조건, 제출 메일, 발주처별 제출 이력 확인 |
| 관리자 | 템플릿/프롬프트 배포, 사용량, 오류, 감사로그 확인 |

## 4. 핵심 화면

### 4.1 전체 대시보드

```text
/dashboard
```

표시 항목:

- 오늘의 점검
- 이번 주 점검
- 제출 예정 보고서
- 미제출 보고서
- 미조치 지적사항
- 조치 지연
- 결재 대기
- 산업안전보건관리비 경고
- 최근 메일/파일 활동
- 프로젝트별 진행률

### 4.2 내 업무 대시보드

```text
/dashboard/my-work
```

사용자별로 다음 업무를 보여준다.

- 내가 담당하는 점검
- 내가 작성 중인 보고서
- 내가 검토해야 할 문서
- 내가 확인해야 할 조치현황
- 내가 발송해야 할 메일
- 내가 처리해야 할 결재/서명/제출

### 4.3 프로젝트 현황 대시보드

```text
/projects/[projectId]/dashboard
```

프로젝트 단위로 다음을 표시한다.

- 공사개요
- 계약/점검/문서 진행률
- 회차별 진행 상태
- 발주처별 보고서 상태
- 미조치 지적사항
- 산업안전보건관리비 사용률
- 최근 파일/메일
- 제출 이력

### 4.4 통계 화면

```text
/dashboard/statistics
```

통계 항목:

- 월별 점검 건수
- 월별 보고서 제출 건수
- 프로젝트별 미조치 지적사항
- 위험유형별 지적사항
- 조치 평균 소요일
- 발주처별 제출 소요일
- 산업안전보건관리비 사용률 분포
- 문서 export/제출 비율
- 메일/파일 처리량

## 5. 핵심 카드

### TodayInspectionCard

표시:

- 오늘 점검 수
- 점검 프로젝트
- 점검회차
- 점검 담당자
- 현장 주소
- 준비자료 누락 여부

### ReportDueCard

표시:

- 제출 예정 보고서
- D-day
- 발주처
- 문서 상태
- 최종본 생성 여부
- 결재 완료 여부

### OpenFindingCard

표시:

- open/action_requested/action_submitted 상태 건수
- 7일 이상 미조치
- 14일 이상 미조치
- 발주처별/시공사별 필터

### SafetyCostCard

표시:

- 발주처별 계상금액
- 사용금액
- 사용률
- 입력 사용률과 계산 사용률 불일치
- 증빙파일 누락

### ApprovalQueueCard

표시:

- 내부 검토 대기
- 기술사 승인 대기
- 서명/날인 대기
- 제출 준비 대기

## 6. 알림 규칙

알림은 다음 기준으로 생성한다.

| 알림 | 기준 |
|---|---|
| 점검 임박 | plannedDate D-7, D-1 |
| 체크리스트 미완료 | 점검일 D+1 이후 incomplete |
| 지적사항 미조치 | dueDate 초과 |
| 조치 확인 필요 | action_submitted 후 verified 아님 |
| 사진대지 누락 | 지적사진 또는 조치사진 누락 |
| 보고서 제출 임박 | reportDueDate D-3, D-1 |
| 보고서 미제출 | reportDueDate 초과 |
| 결재 지연 | approval step dueDate 초과 |
| 서명/날인 누락 | final package 생성 전 SignatureTask 미완료 |
| 안전관리비 경고 | 사용률 계산 불일치 또는 증빙파일 누락 |
| 메일 미분류 | projectId 없는 MailThread |

## 7. 통계 계산 원칙

1. 통계는 원본 모델에서 계산한다.
2. 수동 입력값과 계산값을 분리한다.
3. 통계 스냅샷은 기준일을 가진다.
4. 통계는 업무 상태를 바꾸지 않는다.
5. 삭제/보관 데이터 포함 여부를 필터로 제공한다.
6. 발주처별 통계는 `ownerPartyId` 기준으로 계산한다.
7. 회차별 통계는 `inspectionRoundId` 기준으로 계산한다.
8. 문서별 통계는 `documentId` 기준으로 계산한다.

## 8. 완료 기준

- 전체 대시보드에서 오늘의 업무와 위험 신호를 확인할 수 있다.
- 프로젝트 단위 대시보드를 볼 수 있다.
- 발주처별 보고서 제출 상태를 matrix로 확인할 수 있다.
- 미조치 지적사항과 조치 지연을 확인할 수 있다.
- 산업안전보건관리비 사용률과 경고를 확인할 수 있다.
- 결재/서명/제출 대기 상태를 확인할 수 있다.
- 월별/프로젝트별/발주처별 통계를 볼 수 있다.
- AI 업무 브리핑은 입력 데이터 기반으로만 생성된다.


---

## FILE: `docs/aec-erp/14-dashboard-statistics/markdown/02_TECH_MARKDOWN.md`

# 02. Tech Markdown — 대시보드/통계

## 1. Frontend Routes

```text
/dashboard
/dashboard/my-work
/dashboard/projects
/dashboard/inspections
/dashboard/reports
/dashboard/findings
/dashboard/safety-costs
/dashboard/approvals
/dashboard/files-mails
/dashboard/statistics
/dashboard/alerts
/dashboard/settings
/projects/[projectId]/dashboard
```

## 2. Frontend Components

```text
DashboardHomePage
MyWorkDashboardPage
ProjectDashboardPage
StatisticsPage
AlertCenterPage

DashboardShell
DashboardWidgetGrid
DashboardWidgetCard
TodayInspectionCard
UpcomingInspectionList
ReportDueCard
OwnerReportStatusMatrix
OpenFindingCard
FindingAgingChart
CorrectiveActionQueue
SafetyCostUsageCard
ApprovalQueueCard
SubmissionStatusCard
MailFileActivityCard
ProjectHealthTable
ProjectRiskHeatmap
MonthlyInspectionChart
MonthlySubmissionChart
RiskTypeDistributionChart
SafetyCostUsageChart
DashboardInsightPanel
AlertRuleTable
WidgetSettingsPanel
```

## 3. Backend APIs

### Overview

```text
GET /api/v1/dashboard/overview
GET /api/v1/dashboard/my-work
GET /api/v1/projects/{projectId}/dashboard
```

### Widgets

```text
GET   /api/v1/dashboard/widgets
POST  /api/v1/dashboard/widgets
PATCH /api/v1/dashboard/widgets/{widgetId}
DELETE /api/v1/dashboard/widgets/{widgetId}
POST  /api/v1/dashboard/widgets/reorder
```

### Metrics

```text
GET /api/v1/dashboard/metrics/project-health
GET /api/v1/dashboard/metrics/inspection-status
GET /api/v1/dashboard/metrics/report-status
GET /api/v1/dashboard/metrics/finding-aging
GET /api/v1/dashboard/metrics/safety-cost-usage
GET /api/v1/dashboard/metrics/approval-queue
GET /api/v1/dashboard/metrics/mail-file-activity
GET /api/v1/dashboard/metrics/submission-status
```

### Statistics

```text
GET /api/v1/dashboard/statistics/monthly-inspections
GET /api/v1/dashboard/statistics/monthly-submissions
GET /api/v1/dashboard/statistics/risk-types
GET /api/v1/dashboard/statistics/finding-resolution-time
GET /api/v1/dashboard/statistics/owner-submission-lag
GET /api/v1/dashboard/statistics/safety-cost-distribution
GET /api/v1/dashboard/statistics/export-summary
```

### Alerts

```text
GET   /api/v1/dashboard/alerts
POST  /api/v1/dashboard/alerts/refresh
PATCH /api/v1/dashboard/alerts/{alertId}/acknowledge
PATCH /api/v1/dashboard/alerts/{alertId}/dismiss
GET   /api/v1/dashboard/alert-rules
POST  /api/v1/dashboard/alert-rules
PATCH /api/v1/dashboard/alert-rules/{alertRuleId}
```

### AI Insight

```text
POST /api/v1/dashboard/insights/summary
POST /api/v1/dashboard/insights/project-risk
POST /api/v1/dashboard/insights/weekly-briefing
```

## 4. Data Models

### DashboardWidget

```ts
type DashboardWidgetType =
  | 'today_inspections'
  | 'upcoming_inspections'
  | 'report_due'
  | 'open_findings'
  | 'finding_aging'
  | 'safety_cost_usage'
  | 'approval_queue'
  | 'submission_status'
  | 'mail_file_activity'
  | 'project_health'
  | 'risk_heatmap'
  | 'custom_statistic'

type DashboardWidget = {
  id: string
  userId?: string
  organizationId?: string
  type: DashboardWidgetType
  title: string
  size: 'small' | 'medium' | 'large' | 'wide'
  position: { x: number; y: number; w: number; h: number }
  filters: DashboardFilter
  visible: boolean
  createdAt: string
  updatedAt: string
}
```

### DashboardSnapshot

```ts
type DashboardSnapshot = {
  id: string
  scope: 'global' | 'user' | 'project'
  projectId?: string
  userId?: string
  basisDate: string
  metrics: DashboardMetric[]
  alerts: DashboardAlert[]
  generatedAt: string
}
```

### DashboardMetric

```ts
type DashboardMetric = {
  key: string
  label: string
  value: number | string
  unit?: string
  trend?: 'up' | 'down' | 'flat'
  severity?: 'normal' | 'info' | 'warning' | 'danger'
  sourceModel: string
  calculationNote: string
}
```

### ProjectHealthMetric

```ts
type ProjectHealthMetric = {
  projectId: string
  projectName: string
  status: 'normal' | 'watch' | 'warning' | 'danger'
  progressRate?: number
  nextInspectionDate?: string
  openFindingCount: number
  overdueFindingCount: number
  pendingReportCount: number
  overdueReportCount: number
  pendingApprovalCount: number
  safetyCostWarningCount: number
  unclassifiedMailCount: number
  riskScore: number
  updatedAt: string
}
```

### OwnerReportStatusSummary

```ts
type OwnerReportStatusSummary = {
  projectId: string
  inspectionRoundId: string
  roundNo: number
  ownerPartyId: string
  ownerName: string
  documentId?: string
  documentStatus?: string
  exportedFileId?: string
  submissionId?: string
  submittedAt?: string
  status: 'not_started' | 'drafting' | 'review' | 'exported' | 'submitted' | 'confirmed' | 'overdue'
}
```

### FindingAgingBucket

```ts
type FindingAgingBucket = {
  projectId?: string
  ownerPartyId?: string
  riskType?: string
  bucket: '0_7' | '8_14' | '15_30' | '31_plus'
  count: number
  findingIds: string[]
}
```

### StatisticsMetric

```ts
type StatisticsMetric = {
  id: string
  metricKey: string
  label: string
  scope: 'global' | 'project' | 'owner' | 'user'
  projectId?: string
  ownerPartyId?: string
  userId?: string
  periodType: 'day' | 'week' | 'month' | 'quarter' | 'year'
  periodStart: string
  periodEnd: string
  value: number
  unit?: string
  sourceModels: string[]
  calculatedAt: string
}
```

### DashboardAlert

```ts
type DashboardAlertStatus = 'active' | 'acknowledged' | 'dismissed' | 'resolved'

type DashboardAlert = {
  id: string
  alertRuleId: string
  projectId?: string
  inspectionRoundId?: string
  ownerPartyId?: string
  linkedEntityType: string
  linkedEntityId: string
  severity: 'info' | 'warning' | 'danger'
  title: string
  message: string
  status: DashboardAlertStatus
  dueDate?: string
  createdAt: string
  acknowledgedAt?: string
  resolvedAt?: string
}
```

### AlertRule

```ts
type AlertRule = {
  id: string
  key: string
  title: string
  description: string
  enabled: boolean
  severity: 'info' | 'warning' | 'danger'
  conditionType:
    | 'inspection_due'
    | 'checklist_incomplete'
    | 'report_due'
    | 'report_overdue'
    | 'finding_overdue'
    | 'action_verification_needed'
    | 'photo_ledger_missing'
    | 'safety_cost_warning'
    | 'approval_overdue'
    | 'signature_missing'
    | 'mail_unclassified'
  thresholdDays?: number
  createdAt: string
  updatedAt: string
}
```

## 5. Aggregation Rules

### Project Health Risk Score

```text
riskScore =
  overdueReportCount * 25
+ overdueFindingCount * 15
+ pendingApprovalCount * 8
+ safetyCostWarningCount * 8
+ unclassifiedMailCount * 2
+ photoLedgerMissingCount * 10
```

상태 기준:

```text
0~19: normal
20~39: watch
40~69: warning
70+: danger
```

### Finding Aging

계산 기준:

```text
baseDate = Finding.createdAt 또는 action_requestedAt
daysOpen = today - baseDate
closed/verified는 aging 대상에서 제외
```

### Report Due

대상:

```text
InspectionOwnerReportTask.status not in submitted, confirmed
reportDueDate <= today + filterDays
```

### Safety Cost Warning

경고 조건:

```text
calculatedAmount 없음
usedAmount 없음
usedRateInput와 usedRateCalculated 불일치
증빙파일 없음
confirmed 상태 아님
```

## 6. Service Rules

### Dashboard Overview 생성

```text
1. 사용자 권한 확인
2. 접근 가능한 projectId 목록 조회
3. 점검 일정 조회
4. 보고서/제출 상태 조회
5. 지적사항/조치현황 조회
6. 산업안전보건관리비 조회
7. 결재/서명/제출 상태 조회
8. 메일/파일 활동 조회
9. AlertRule 실행
10. DashboardSnapshot 생성 또는 반환
```

### AI Insight 생성

AI는 다음만 수행한다.

- 수치 기반 요약
- 긴급도 정렬
- 누락/지연 업무 설명
- 다음 액션 제안

AI는 다음을 하지 않는다.

- 통계 수치 임의 변경
- 업무 상태 변경
- 조치 완료 판정
- 법령 해석
- 금액/날짜 추정

## 7. Tests

```text
test_dashboard_overview_loads
test_dashboard_respects_project_permission
test_project_health_risk_score_calculated
test_report_due_card_filters_owner_reports
test_finding_aging_excludes_closed_findings
test_safety_cost_warning_detected
test_approval_queue_counts_pending_steps
test_mail_file_activity_counts_recent_items
test_dashboard_alert_refresh_creates_report_overdue_alert
test_dashboard_alert_acknowledge
test_statistics_monthly_inspections
test_statistics_risk_type_distribution
test_dashboard_insight_does_not_invent_metrics
test_project_dashboard_owner_report_matrix
```


---

## FILE: `docs/aec-erp/14-dashboard-statistics/markdown/05_DESIGN_MARKDOWN.md`

# 05. Design Markdown — 대시보드/통계

## 1. 화면 목표

대시보드/통계 화면은 A&C ERP 사용자가 오늘 가장 중요한 업무를 빠르게 파악하고, 프로젝트별 위험 신호를 놓치지 않도록 돕는 관제 화면이다.

디자인 목표:

1. 오늘 할 일을 가장 위에 표시한다.
2. 지연/누락/위험 상태는 색상과 badge로 명확히 구분한다.
3. 프로젝트, 회차, 발주처, 문서 상태를 한눈에 연결한다.
4. 통계 화면은 수치와 원본 링크를 함께 제공한다.
5. AI 브리핑은 보조 패널로 제공하되, 원본 수치와 분리한다.

## 2. 화면 목록

### 2.1 전체 대시보드

Route:

```text
/dashboard
```

Layout:

```text
Topbar: 날짜 / 사용자 / 프로젝트 전환 / 전체 검색
Widget Row 1: 오늘 점검, 제출 예정, 미조치 지적, 결재 대기
Widget Row 2: 프로젝트 위험도, 발주처별 보고서 상태, 안전관리비 경고
Main: 오늘 업무 queue + 프로젝트별 현황 table
Right Panel: AI 업무 브리핑 / 알림
```

### 2.2 내 업무 대시보드

Route:

```text
/dashboard/my-work
```

구성:

- 오늘 할 일
- 이번 주 할 일
- 내가 담당하는 점검
- 내가 작성 중인 보고서
- 내가 검토해야 하는 문서
- 내가 확인해야 하는 조치현황
- 내가 발송해야 하는 메일

### 2.3 프로젝트 대시보드

Route:

```text
/projects/[projectId]/dashboard
```

구성:

- 프로젝트 요약 헤더
- 점검회차 timeline
- 발주처별 보고서 matrix
- 미조치 지적사항 table
- 사진대지 상태
- 산업안전보건관리비 사용률
- 결재/제출 상태
- 최근 웹하드 파일
- 최근 메일

### 2.4 통계 화면

Route:

```text
/dashboard/statistics
```

구성:

- 기간 필터
- 프로젝트 필터
- 발주처 필터
- 월별 점검 건수 chart
- 월별 보고서 제출 chart
- 위험유형별 지적사항 chart
- 조치 평균 소요일 chart
- 산업안전보건관리비 사용률 chart
- 통계 table

### 2.5 알림 센터

Route:

```text
/dashboard/alerts
```

구성:

- active alerts
- acknowledged alerts
- resolved alerts
- severity filter
- project filter
- alert rule 관리 진입

## 3. UX 규칙

- danger 상태는 빨간색, warning 상태는 주황색으로 표시한다.
- 사용자가 바로 이동할 수 있도록 모든 widget은 관련 route를 가진다.
- 통계 수치에는 기준일과 계산 기준을 표시한다.
- AI 브리핑은 "AI 요약" badge를 표시한다.
- 대시보드는 원본 업무 데이터를 직접 수정하지 않는다.
- 완료 처리, 제출 처리, 조치 확인은 원본 모듈 화면으로 이동해서 수행한다.
- 발주처별 지표는 ownerParty badge를 함께 표시한다.
- 날짜 기준 통계는 오늘/이번 주/이번 달/직접 선택 필터를 제공한다.

## 4. 핵심 컴포넌트

### DashboardWidgetCard

공통 구조:

```text
제목
주요 수치
trend
severity badge
관련 항목 리스트
바로가기 버튼
```

### ProjectHealthTable

컬럼:

| 컬럼 | 설명 |
|---|---|
| 프로젝트 | 상세 이동 |
| 상태 | normal/watch/warning/danger |
| 다음 점검 | plannedDate |
| 미제출 보고서 | count |
| 미조치 | count |
| 조치 지연 | count |
| 안전관리비 경고 | count |
| 위험점수 | riskScore |

### OwnerReportStatusMatrix

행:

- 점검회차

열:

- 발주처
- 초안
- 검토
- 최종본
- 제출
- 확인

### DashboardInsightPanel

표시:

- 오늘 요약
- 긴급 업무 Top 5
- 프로젝트 위험 신호
- 통계 특이사항
- 다음 액션

### AlertRuleTable

컬럼:

- 규칙명
- 조건
- threshold
- severity
- 활성 여부
- 최근 실행일

## 5. Empty State

### 데이터 없음

```text
표시할 대시보드 데이터가 없습니다.
프로젝트를 생성하거나 점검회차를 등록하면 대시보드가 자동으로 채워집니다.
```

### 알림 없음

```text
현재 활성 알림이 없습니다.
```

## 6. Warning State

### 통계 계산 불가

```text
일부 통계는 필수 원본 데이터가 없어 계산되지 않았습니다.
```

### 권한 제한

```text
접근 권한이 있는 프로젝트의 데이터만 표시됩니다.
```

### 원본 변경 감지

```text
집계 이후 원본 데이터가 변경되었습니다. 새로고침하여 최신 대시보드를 확인하세요.
```

## 7. Responsive

### Desktop

- 12-column widget grid
- 우측 AI/알림 패널
- table + chart 동시 표시

### Tablet

- 2-column card grid
- chart와 table을 세로로 배치

### Mobile

- 내 업무 중심 card list
- 오늘 점검/제출/미조치만 우선 표시
- 통계 chart는 요약 card로 축약


---

## FILE: `docs/aec-erp/14-dashboard-statistics/markdown/07_REVERSE_MAP.md`

# 07. Reverse Map — 대시보드/통계

## 1. Feature

```yaml
featureId: dashboard.statistics
featureName: 대시보드/통계
priority: P1
module: dashboard-statistics
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 전체 대시보드 | `/dashboard` | 전체 업무/위험/알림 요약 |
| 내 업무 | `/dashboard/my-work` | 사용자별 할 일 |
| 프로젝트 현황 | `/dashboard/projects` | 프로젝트별 위험도 table |
| 점검 현황 | `/dashboard/inspections` | 점검 일정/완료율 |
| 보고서 현황 | `/dashboard/reports` | 발주처별 보고서 상태 |
| 지적사항 현황 | `/dashboard/findings` | 미조치/지연/위험유형 |
| 안전관리비 현황 | `/dashboard/safety-costs` | 사용률/경고/증빙 |
| 결재 현황 | `/dashboard/approvals` | 승인/서명/제출 대기 |
| 파일/메일 활동 | `/dashboard/files-mails` | 최근 웹하드/메일 활동 |
| 통계 | `/dashboard/statistics` | 월별/유형별 통계 |
| 알림 센터 | `/dashboard/alerts` | 알림 확인/처리 |
| 대시보드 설정 | `/dashboard/settings` | widget/alert rule 설정 |
| 프로젝트 대시보드 | `/projects/[projectId]/dashboard` | 단일 프로젝트 종합 현황 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/dashboard` | DashboardWidgetGrid, TodayInspectionCard, ReportDueCard, OpenFindingCard, DashboardInsightPanel |
| `/dashboard/my-work` | MyTaskQueue, UpcomingInspectionList, ApprovalQueueCard |
| `/dashboard/projects` | ProjectHealthTable, ProjectRiskHeatmap |
| `/dashboard/reports` | OwnerReportStatusMatrix, SubmissionStatusCard |
| `/dashboard/findings` | OpenFindingCard, FindingAgingChart, CorrectiveActionQueue |
| `/dashboard/safety-costs` | SafetyCostUsageCard, SafetyCostUsageChart |
| `/dashboard/approvals` | ApprovalQueueCard, SignatureMissingList |
| `/dashboard/files-mails` | MailFileActivityCard, UnclassifiedMailList |
| `/dashboard/statistics` | MonthlyInspectionChart, MonthlySubmissionChart, RiskTypeDistributionChart |
| `/dashboard/alerts` | AlertList, AlertRuleTable |
| `/projects/[projectId]/dashboard` | ProjectDashboardHeader, OwnerReportStatusMatrix, ProjectFindingTable |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| DashboardWidgetGrid | GET `/api/v1/dashboard/widgets` |
| TodayInspectionCard | GET `/api/v1/dashboard/metrics/inspection-status` |
| ReportDueCard | GET `/api/v1/dashboard/metrics/report-status` |
| OpenFindingCard | GET `/api/v1/dashboard/metrics/finding-aging` |
| SafetyCostUsageCard | GET `/api/v1/dashboard/metrics/safety-cost-usage` |
| ApprovalQueueCard | GET `/api/v1/dashboard/metrics/approval-queue` |
| MailFileActivityCard | GET `/api/v1/dashboard/metrics/mail-file-activity` |
| ProjectHealthTable | GET `/api/v1/dashboard/metrics/project-health` |
| MonthlyInspectionChart | GET `/api/v1/dashboard/statistics/monthly-inspections` |
| RiskTypeDistributionChart | GET `/api/v1/dashboard/statistics/risk-types` |
| DashboardInsightPanel | POST `/api/v1/dashboard/insights/summary` |
| AlertList | GET `/api/v1/dashboard/alerts` |
| AlertRuleTable | GET `/api/v1/dashboard/alert-rules` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET `/dashboard/overview` | DashboardSnapshot, DashboardMetric, DashboardAlert |
| GET `/dashboard/my-work` | InspectionTask, ApprovalStep, Finding, MailThread |
| GET `/projects/{projectId}/dashboard` | ProjectHealthMetric, OwnerReportStatusSummary |
| GET `/metrics/project-health` | ProjectHealthMetric |
| GET `/metrics/report-status` | OwnerReportStatusSummary, DocumentInstance, Submission |
| GET `/metrics/finding-aging` | FindingAgingBucket, Finding, CorrectiveAction |
| GET `/metrics/safety-cost-usage` | SafetyCostUsage, StatisticsMetric |
| GET `/metrics/mail-file-activity` | MailThread, MailMessage, FileAsset |
| GET `/statistics/*` | StatisticsMetric |
| GET/POST `/alert-rules` | AlertRule |
| GET/PATCH `/alerts` | DashboardAlert |
| POST `/insights/summary` | DashboardInsightRun, PromptTemplate |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| DashboardSnapshot | dashboard-insight-summary |
| DashboardMetric | dashboard-insight-summary |
| ProjectHealthMetric | dashboard-insight-summary |
| OwnerReportStatusSummary | dashboard-insight-summary |
| FindingAgingBucket | dashboard-insight-summary |
| StatisticsMetric | dashboard-insight-summary |
| DashboardAlert | dashboard-insight-summary |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 전체 대시보드 조회 | test_dashboard_overview_loads |
| 권한 필터 | test_dashboard_respects_project_permission |
| 프로젝트 위험도 | test_project_health_risk_score_calculated |
| 보고서 제출 예정 | test_report_due_card_filters_owner_reports |
| 지적사항 aging | test_finding_aging_excludes_closed_findings |
| 안전관리비 경고 | test_safety_cost_warning_detected |
| 결재 대기 | test_approval_queue_counts_pending_steps |
| 파일/메일 활동 | test_mail_file_activity_counts_recent_items |
| 알림 생성 | test_dashboard_alert_refresh_creates_report_overdue_alert |
| 알림 확인 | test_dashboard_alert_acknowledge |
| 월별 점검 통계 | test_statistics_monthly_inspections |
| 위험유형 통계 | test_statistics_risk_type_distribution |
| AI 인사이트 | test_dashboard_insight_does_not_invent_metrics |
| 프로젝트 matrix | test_project_dashboard_owner_report_matrix |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ProjectHealthMetric |
| 계약/견적 | 계약기간, 지급 milestone, 계약 상태 |
| 점검회차/일정 | InspectionRound, InspectionTask |
| 보고서 자동화 | DocumentInstance, OwnerReportTask |
| 현장점검 체크리스트 | ChecklistSession completion |
| 지적사항/사진대지 | Finding, CorrectiveAction, PhotoLedger |
| 산업안전보건관리비 | SafetyCostUsage warning |
| 안전관리계획서 | plan status, export status |
| 안전보건대장 | ledger status, revision status |
| 웹하드 | FileAsset recent activity |
| 메일함 | MailThread, unclassified mail |
| 결재/제출 | ApprovalWorkflow, SignatureTask, Submission |
| 관리자 | AlertRule, DashboardWidget, PromptTemplate |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 집계 수치와 원본 상태 불일치 | sourceModels와 calculationNote 표시 |
| 권한 없는 프로젝트 노출 | 모든 metric query에서 project permission filter 적용 |
| 발주처별 제출 상태 혼동 | ownerPartyId 기준 matrix 사용 |
| 완료된 지적사항이 미조치 통계에 포함 | closed/verified 제외 규칙 적용 |
| AI가 수치 생성 | dashboard-insight-summary에서 입력 수치만 사용 |
| 대시보드에서 원본 업무 상태 변경 | 대시보드는 바로가기만 제공, 상태 변경은 원본 화면에서 수행 |
| 통계 기준일 불명확 | basisDate와 periodStart/periodEnd 필수 |


---

## FILE: `docs/aec-erp/14-dashboard-statistics/prompts/03_SERVICE_AI_PROMPT.md`

# 03. Service AI Prompt — 대시보드 업무 브리핑/통계 인사이트

## Prompt ID

`dashboard-insight-summary`

## 목적

대시보드의 집계 데이터, 알림, 통계, 프로젝트 상태를 바탕으로 오늘의 우선순위와 위험 신호를 실무자가 이해하기 쉬운 한국어 업무 브리핑으로 정리한다.

## Prompt

```text
너는 A&C기술사 ERP의 대시보드 인사이트 엔진이다.

입력:
- basisDate
- currentUser
- accessibleProjects
- dashboardMetrics
- projectHealthMetrics
- inspectionSummaries
- ownerReportStatusSummaries
- findingAgingBuckets
- safetyCostSummaries
- approvalQueue
- submissionSummaries
- mailFileActivities
- dashboardAlerts
- statisticsMetrics
- userInstruction

목표:
사용자가 오늘 가장 먼저 처리해야 할 업무, 지연 위험, 제출 위험, 조치 위험, 통계적 특이사항을 요약한다.

해야 할 일:
1. 긴급도가 높은 업무를 우선순위로 정렬한다.
2. 오늘/이번 주 점검, 제출 예정 보고서, 미조치 지적사항, 결재 대기를 구분한다.
3. 발주처별 제출 지연 또는 누락을 표시한다.
4. 산업안전보건관리비 사용률 또는 증빙 누락 경고를 표시한다.
5. 반복되는 위험유형이나 장기 미조치 항목을 요약한다.
6. 각 항목마다 사용자가 바로 할 수 있는 다음 액션을 제안한다.
7. 데이터가 없으면 "등록된 정보 없음"이라고 표현한다.
8. 수치, 날짜, 프로젝트명, 발주처명은 입력값 그대로 사용한다.
9. 추정이 필요한 경우 추정하지 말고 확인 필요로 표시한다.
10. 업무 상태를 변경하라는 지시는 하지 말고, 이동할 화면 또는 확인할 항목만 제안한다.

출력 JSON:
{
  "basisDate": "",
  "executiveSummary": "",
  "priorityTasks": [
    {
      "priority": 1,
      "severity": "info | warning | danger",
      "category": "inspection | report | finding | safety_cost | approval | mail | file | template | other",
      "title": "",
      "reason": "",
      "relatedProjectId": null,
      "relatedProjectName": "",
      "relatedOwnerName": "",
      "dueDate": null,
      "recommendedAction": "",
      "targetRoute": ""
    }
  ],
  "projectRiskHighlights": [
    {
      "projectId": "",
      "projectName": "",
      "riskScore": 0,
      "status": "normal | watch | warning | danger",
      "reason": "",
      "recommendedAction": ""
    }
  ],
  "statisticsHighlights": [
    {
      "metricKey": "",
      "label": "",
      "summary": "",
      "warning": ""
    }
  ],
  "missingData": [
    {
      "field": "",
      "label": "",
      "reason": ""
    }
  ],
  "warnings": [
    {
      "type": "",
      "message": ""
    }
  ]
}

금지사항:
- 입력에 없는 수치를 만들지 않는다.
- 업무 상태를 임의로 완료 처리하지 않는다.
- 조치가 확인되지 않은 지적사항을 조치완료로 표현하지 않는다.
- 제출되지 않은 보고서를 제출완료로 표현하지 않는다.
- 안전관리비 사용률을 임의 계산하지 않는다. 계산값이 입력으로 제공된 경우에만 사용한다.
- 법령 해석이나 법적 판단을 하지 않는다.
```

## 우선순위 기준

```text
1순위: 제출기한 초과, 조치기한 초과, 결재 지연
2순위: 오늘 점검, 오늘 제출, 오늘 확인 필요
3순위: D-3 이내 제출 예정, D-7 이내 점검 예정
4순위: 사진대지/증빙/첨부 누락
5순위: 일반 통계 및 추세
```


---

## FILE: `docs/aec-erp/14-dashboard-statistics/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md`

# 04. Codex Implementation Prompt — 대시보드/통계

## Prompt

```text
You are implementing the Dashboard and Statistics module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module aggregates data from projects, contracts, inspections, checklist sessions, findings, corrective actions, photo ledgers, safety cost usage, documents, approvals, submissions, webhard, and mailbox modules.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Dashboard and Statistics module.

Existing concepts:
- Project
- ProjectParty
- Contract
- InspectionRound
- InspectionOwnerReportTask
- ChecklistSession
- Finding
- CorrectiveAction
- PhotoLedger
- SafetyCostUsage
- SafetyManagementPlan
- SafetyHealthLedger
- DocumentInstance
- ApprovalWorkflow
- SignatureTask
- Submission
- Folder
- FileAsset
- MailThread
- MailMessage
- PromptTemplate
- AdminAuditLog

Required backend models:
- DashboardWidget
- DashboardSnapshot
- DashboardMetric
- ProjectHealthMetric
- OwnerReportStatusSummary
- FindingAgingBucket
- StatisticsMetric
- DashboardAlert
- AlertRule
- DashboardInsightRun

Required backend APIs:

Overview:
- GET /api/v1/dashboard/overview
- GET /api/v1/dashboard/my-work
- GET /api/v1/projects/{projectId}/dashboard

Widgets:
- GET /api/v1/dashboard/widgets
- POST /api/v1/dashboard/widgets
- PATCH /api/v1/dashboard/widgets/{widgetId}
- DELETE /api/v1/dashboard/widgets/{widgetId}
- POST /api/v1/dashboard/widgets/reorder

Metrics:
- GET /api/v1/dashboard/metrics/project-health
- GET /api/v1/dashboard/metrics/inspection-status
- GET /api/v1/dashboard/metrics/report-status
- GET /api/v1/dashboard/metrics/finding-aging
- GET /api/v1/dashboard/metrics/safety-cost-usage
- GET /api/v1/dashboard/metrics/approval-queue
- GET /api/v1/dashboard/metrics/mail-file-activity
- GET /api/v1/dashboard/metrics/submission-status

Statistics:
- GET /api/v1/dashboard/statistics/monthly-inspections
- GET /api/v1/dashboard/statistics/monthly-submissions
- GET /api/v1/dashboard/statistics/risk-types
- GET /api/v1/dashboard/statistics/finding-resolution-time
- GET /api/v1/dashboard/statistics/owner-submission-lag
- GET /api/v1/dashboard/statistics/safety-cost-distribution
- GET /api/v1/dashboard/statistics/export-summary

Alerts:
- GET /api/v1/dashboard/alerts
- POST /api/v1/dashboard/alerts/refresh
- PATCH /api/v1/dashboard/alerts/{alertId}/acknowledge
- PATCH /api/v1/dashboard/alerts/{alertId}/dismiss
- GET /api/v1/dashboard/alert-rules
- POST /api/v1/dashboard/alert-rules
- PATCH /api/v1/dashboard/alert-rules/{alertRuleId}

AI Insight:
- POST /api/v1/dashboard/insights/summary
- POST /api/v1/dashboard/insights/project-risk
- POST /api/v1/dashboard/insights/weekly-briefing

Required frontend routes:
- /dashboard
- /dashboard/my-work
- /dashboard/projects
- /dashboard/inspections
- /dashboard/reports
- /dashboard/findings
- /dashboard/safety-costs
- /dashboard/approvals
- /dashboard/files-mails
- /dashboard/statistics
- /dashboard/alerts
- /dashboard/settings
- /projects/[projectId]/dashboard

Required frontend components:
- DashboardShell
- DashboardWidgetGrid
- DashboardWidgetCard
- TodayInspectionCard
- UpcomingInspectionList
- ReportDueCard
- OwnerReportStatusMatrix
- OpenFindingCard
- FindingAgingChart
- CorrectiveActionQueue
- SafetyCostUsageCard
- ApprovalQueueCard
- SubmissionStatusCard
- MailFileActivityCard
- ProjectHealthTable
- ProjectRiskHeatmap
- MonthlyInspectionChart
- MonthlySubmissionChart
- RiskTypeDistributionChart
- SafetyCostUsageChart
- DashboardInsightPanel
- AlertRuleTable
- WidgetSettingsPanel

Business requirements:
1. Dashboard must aggregate data without mutating source business entities.
2. Dashboard must respect project-level permissions.
3. Overview must show today inspections, upcoming inspections, reports due, open findings, overdue findings, pending approvals, safety cost warnings, and mail/file activity.
4. Project dashboard must show one project's status, owner report matrix, open findings, safety cost, submissions, and recent activities.
5. Alert refresh must create alerts from enabled AlertRules.
6. Finding aging must exclude closed or verified findings.
7. Report due card must filter InspectionOwnerReportTask by status and reportDueDate.
8. Safety cost warnings must detect missing evidence, unconfirmed status, and usedRate mismatch.
9. AI insight must use the service AI prompt `dashboard-insight-summary` and must not invent metrics.
10. Widget layout must be user-configurable.
11. Statistics endpoints must support projectId, ownerPartyId, date range, and status filters.
12. All alert acknowledge/dismiss actions must create AuditLog.

Validation:
1. User can only see accessible projects.
2. projectId filters must be applied to every metric query.
3. ownerPartyId filters must be applied to owner-specific metrics.
4. alert linkedEntityType and linkedEntityId must be valid.
5. DashboardSnapshot basisDate is required.

Tests:
- test_dashboard_overview_loads
- test_dashboard_respects_project_permission
- test_project_health_risk_score_calculated
- test_report_due_card_filters_owner_reports
- test_finding_aging_excludes_closed_findings
- test_safety_cost_warning_detected
- test_approval_queue_counts_pending_steps
- test_mail_file_activity_counts_recent_items
- test_dashboard_alert_refresh_creates_report_overdue_alert
- test_dashboard_alert_acknowledge
- test_statistics_monthly_inspections
- test_statistics_risk_type_distribution
- test_dashboard_insight_does_not_invent_metrics
- test_project_dashboard_owner_report_matrix

Deliverables:
- Backend models and repositories
- Backend aggregation services
- Backend API routes
- Alert rule evaluation service
- Dashboard insight service
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```


---

## FILE: `docs/aec-erp/14-dashboard-statistics/prompts/06_DESIGN_PROMPT.md`

# 06. Design Prompt — 대시보드/통계

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "대시보드/통계" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 프로젝트, 계약, 점검, 보고서, 웹하드, 메일, 결재를 통합 관리하는 ERP
- 대시보드는 모든 업무 데이터를 집계하여 오늘 할 일, 제출 예정, 미조치, 지연, 리스크를 한눈에 보여주는 관제 화면
- 통계는 월별 점검, 보고서 제출, 위험유형, 조치 소요일, 안전관리비 사용률을 보여준다.

화면 1: 전체 대시보드
- 좌측 ERP 사이드바
- 상단에는 날짜, 사용자, 프로젝트 전환, 전체 검색
- 첫 번째 row에는 핵심 카드 4개:
  - 오늘의 점검
  - 제출 예정 보고서
  - 미조치 지적사항
  - 결재/서명 대기
- 두 번째 row에는:
  - 프로젝트 위험도 table
  - 발주처별 보고서 상태 matrix
  - 산업안전보건관리비 경고 카드
- 우측 패널에는 AI 업무 브리핑과 활성 알림을 표시한다.

화면 2: 내 업무 대시보드
- 오늘 할 일 queue
- 이번 주 할 일
- 내가 담당하는 점검
- 내가 작성 중인 보고서
- 내가 검토해야 하는 문서
- 내가 확인해야 하는 조치현황
- 내가 발송해야 하는 메일
- 각 업무는 바로가기 버튼을 가진다.

화면 3: 프로젝트 대시보드
- 프로젝트 요약 헤더:
  - 프로젝트명
  - 발주처
  - 시공사
  - 공사기간
  - 공정율
  - 상태
- 점검회차 timeline
- 발주처별 보고서 상태 matrix
- 미조치 지적사항 table
- 사진대지 누락 상태
- 산업안전보건관리비 사용률
- 최근 파일/메일 활동

화면 4: 통계 화면
- 기간 필터
- 프로젝트 필터
- 발주처 필터
- chart cards:
  - 월별 점검 건수
  - 월별 보고서 제출 건수
  - 위험유형별 지적사항
  - 조치 평균 소요일
  - 산업안전보건관리비 사용률
- 통계 table에는 수치, 기준기간, 원본 모델, 계산 기준을 표시한다.

화면 5: 알림 센터
- active / acknowledged / resolved tabs
- severity filter
- project filter
- alert list
- alert rule 관리 table
- 알림 상세에는 관련 프로젝트, 회차, 문서, 지적사항 바로가기를 표시한다.

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- 배경은 밝은 회색
- 카드와 테이블은 정보 밀도 높게
- 위험/지연은 빨간색
- 주의/임박은 주황색
- 완료/정상은 초록색
- 검토중은 보라색
- AI 요약은 보조 패널로 분리하고 badge를 표시한다.
- 통계는 깔끔한 chart card와 table 조합으로 구성한다.
- 한글 가독성을 최우선으로 한다.

결과물:
- 전체 대시보드 화면
- 내 업무 대시보드 화면
- 프로젝트 대시보드 화면
- 통계 화면
- 알림 센터 화면
- widget settings panel
- AI 업무 브리핑 panel
```


---

## FILE: `docs/aec-erp/14-dashboard-statistics/prompts/08_REVERSE_PROMPT.md`

# 08. Reverse Prompt — 대시보드/통계

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
대시보드/통계

기능 설명:
대시보드/통계는 프로젝트, 계약, 점검회차, 체크리스트, 지적사항, 조치현황, 사진대지, 산업안전보건관리비, 문서 자동화, 웹하드, 메일함, 결재/제출 데이터를 집계하여 오늘 업무, 지연 위험, 발주처별 제출 현황, 프로젝트별 리스크, 월별 통계를 보여주는 기능이다.

업무 맥락:
- 대시보드는 원본 업무 데이터를 수정하지 않는다.
- 모든 지표는 접근 권한이 있는 Project 기준으로 제한된다.
- 발주처별 지표는 ownerPartyId 기준으로 계산한다.
- 회차별 지표는 inspectionRoundId 기준으로 계산한다.
- 보고서 제출 상태는 InspectionOwnerReportTask, DocumentInstance, Submission을 함께 본다.
- 미조치 지적사항은 Finding과 CorrectiveAction 상태를 기준으로 계산한다.
- AI 인사이트는 입력된 metric과 alert만 요약하고 수치를 만들지 않는다.

입력:
{
  "featureName": "대시보드/통계",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "permissionRequirements": [],
  "statisticsRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `dashboard.statistics`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 계약/견적
    - 점검회차/일정
    - 공사안전보건대장 이행확인 보고서 자동화
    - 현장점검 체크리스트
    - 지적사항/조치현황/사진대지
    - 산업안전보건관리비
    - 안전관리계획서
    - 안전보건대장
    - 웹하드
    - 메일함
    - 결재/서명/제출
    - 관리자/템플릿/프롬프트

출력 JSON:
{
  "featureId": "dashboard.statistics",
  "featureName": "대시보드/통계",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /dashboard
- /dashboard/my-work
- /dashboard/projects
- /dashboard/inspections
- /dashboard/reports
- /dashboard/findings
- /dashboard/safety-costs
- /dashboard/approvals
- /dashboard/files-mails
- /dashboard/statistics
- /dashboard/alerts
- /dashboard/settings
- /projects/[projectId]/dashboard

반드시 포함할 models:
- DashboardWidget
- DashboardSnapshot
- DashboardMetric
- ProjectHealthMetric
- OwnerReportStatusSummary
- FindingAgingBucket
- StatisticsMetric
- DashboardAlert
- AlertRule
- DashboardInsightRun
- Project
- InspectionRound
- InspectionOwnerReportTask
- Finding
- CorrectiveAction
- SafetyCostUsage
- DocumentInstance
- ApprovalWorkflow
- Submission
- FileAsset
- MailThread

반드시 포함할 prompts:
- dashboard-insight-summary
- dashboard-statistics implementation prompt
- dashboard-statistics design prompt

반드시 포함할 tests:
- test_dashboard_overview_loads
- test_dashboard_respects_project_permission
- test_project_health_risk_score_calculated
- test_report_due_card_filters_owner_reports
- test_finding_aging_excludes_closed_findings
- test_safety_cost_warning_detected
- test_approval_queue_counts_pending_steps
- test_mail_file_activity_counts_recent_items
- test_dashboard_alert_refresh_creates_report_overdue_alert
- test_dashboard_alert_acknowledge
- test_statistics_monthly_inspections
- test_statistics_risk_type_distribution
- test_dashboard_insight_does_not_invent_metrics
- test_project_dashboard_owner_report_matrix

주의:
- 대시보드는 원본 업무 상태를 직접 변경하지 않는다.
- 권한 없는 프로젝트 데이터가 노출되면 안 된다.
- 발주처별 데이터는 ownerPartyId 없이 집계하지 않는다.
- 완료/closed/verified 지적사항을 미조치로 계산하지 않는다.
- 제출완료와 최종본 생성완료를 혼동하지 않는다.
- AI가 통계 수치를 만들거나 추정하면 안 된다.
- 통계 기준일과 기간을 반드시 표시해야 한다.
```


---

## FILE: `docs/aec-erp/README.md`

# A&C 기술사 ERP 문서팩 — 00~14 누적 v1

이 패키지는 업로드된 대화 흐름을 기준으로, A&C 기술사 ERP의 전체 골격과 기능 01~14를 누적 정리한 문서팩이다.

## 포함 범위

```text
00. 전체 골격
01. 프로젝트/현장 원장 관리
02. 계약/견적 관리
03. 점검회차/일정 관리
04. 공사안전보건대장 이행확인 보고서 자동화
05. 현장점검 체크리스트
06. 지적사항/조치현황/사진대지
07. 산업안전보건관리비 사용내용 확인
08. 안전관리계획서 자동화
09. 안전보건대장 자동화
10. 웹하드
11. 메일함
12. 결재/서명/제출
13. 관리자/템플릿/프롬프트
14. 대시보드/통계
```

## 기능별 파일 세트

각 기능은 동일한 8개 파일 구조를 유지한다.

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 이번 추가분

이번 버전은 기존 00~13 구조를 유지하면서 `14-dashboard-statistics`를 추가했다. 14번 기능은 A&C 기술사 ERP에서 프로젝트, 점검회차, 보고서, 지적사항, 산업안전보건관리비, 웹하드, 메일함, 결재/제출 데이터를 집계하여 오늘 업무, 제출 예정, 미조치, 지연, 프로젝트 위험도, 발주처별 제출 상태, 월별 통계를 보여주는 운영 관제 모듈이다.

14번 기능의 핵심은 아래와 같다.

```text
Project
→ InspectionRound
→ ChecklistSession
→ Finding / CorrectiveAction
→ PhotoLedger
→ SafetyCostUsage
→ DocumentInstance
→ ApprovalWorkflow / SignatureTask
→ Submission
→ MailThread / FileAsset
→ DashboardSnapshot / StatisticsMetric / AlertRule
```

## 누적 핵심 원칙

- 모든 기능은 `Project`를 중심으로 연결한다.
- 발주처별 분기 기능은 `ownerPartyId`를 반드시 고려한다.
- 문서 자동화 기능은 `DocumentTemplate`과 `PromptTemplate`의 버전 관리를 전제로 한다.
- 대시보드는 원본 업무 데이터를 수정하지 않고 집계/요약/알림만 수행한다.
- 통계 수치는 기준일, 계산 기준, 원본 모델을 함께 표시한다.
- AI 초안과 AI 브리핑은 최종 판단이 아니며, 원본 데이터 기반으로만 작성한다.
- 기능 구현 전 Reverse Map으로 화면, API, 모델, 프롬프트, 테스트를 역추적한다.


---

## FILE: `docs/aec-erp/SOURCE_CHAT_SUMMARY.md`

# Source Chat Summary — 00~13

업로드된 대화 내역 기준으로 A&C 기술사 ERP는 기존 app의 ERP 틀을 따르되, apps의 웹하드와 메일함을 포함하고, 기술지도보고가 아니라 A&C기술사사무소가 수행하는 안전관리계획서, 안전보건대장, 공사안전보건대장 이행확인 보고서 문서 자동화를 중심으로 설계한다.

이번 누적 패키지는 00 전체 골격부터 13 관리자/템플릿/프롬프트까지 이어진다.

## 현재 누적 흐름

```text
Project
→ Contract
→ InspectionRound
→ ChecklistSession
→ Finding / CorrectiveAction / EvidencePhoto
→ SafetyCostUsage
→ SafetyManagementPlan
→ SafetyHealthLedger
→ SafetyReport / PhotoLedger
→ FileAsset / Webhard
→ MailThread / MailMessage
→ ApprovalWorkflow / SignatureTask
→ FinalDocumentPackage / Submission
→ DocumentTemplate / PromptTemplate / AdminAuditLog
```

## 13번 관리자/템플릿/프롬프트 추가 기준

관리자/템플릿/프롬프트 기능은 ERP의 문서 자동화 품질과 운영 안정성을 관리한다. 프로젝트, 계약, 보고서, 안전관리계획서, 안전보건대장, 사진대지, 메일 초안은 모두 템플릿과 프롬프트에 의존하므로, 템플릿 본문·변수·반복 섹션·조건부 섹션·표준 문구·법령 문구·프롬프트·테스트케이스를 버전 단위로 관리해야 한다.

핵심 연결은 다음과 같다.

```text
DocumentTemplate
→ TemplateVersion
→ TemplateVariable / TemplateLoop / TemplateCondition
→ StandardPhrase / LegalClause
→ PromptTemplate
→ PromptVersion
→ PromptTestCase
→ PromptRunLog
→ TemplateRelease
→ AdminAuditLog
```

## 13번이 이전 기능에 주는 영향

- 04 이행확인 보고서는 `safety_report` 문서 템플릿과 `safety-report-generation` 프롬프트 버전을 사용한다.
- 05 체크리스트는 `ChecklistTemplate`과 `ChecklistItem` 버전을 사용한다.
- 06 사진대지는 `photo_ledger` 템플릿과 캡션 프롬프트 버전을 사용한다.
- 08 안전관리계획서와 09 안전보건대장은 섹션 템플릿, 위험요인 라이브러리, 표준 문구를 사용한다.
- 10 웹하드와 11 메일함은 파일 분류/메일 초안 프롬프트와 저장 정책을 사용한다.
- 12 결재/서명/제출은 결재선 템플릿, 서명/직인 정책, 제출 체크리스트 템플릿을 사용한다.


## 14 — 대시보드/통계

마지막 기능은 기존 00~13 모듈의 데이터를 수정하지 않고 집계하는 운영 관제 레이어로 정의한다. 오늘의 점검, 제출 예정 보고서, 미조치 지적사항, 조치 지연, 산업안전보건관리비 사용률, 결재 대기, 웹하드/메일 활동, 발주처별 제출 상태를 프로젝트·회차·발주처 기준으로 요약한다.


---

## FILE: `docs/aec-erp/_index/AEC_ERP_CONTAINMENT_MAP.md`

# A&C ERP Containment Map

기능 폴더는 구현 단위이고, 실제 화면/데이터는 아래 포함 구조를 따른다.

```text
Project
├── Contracts / Estimates
├── InspectionRounds
│   ├── Checklist
│   ├── Findings / CorrectiveActions
│   ├── PhotoLedger
│   ├── SafetyCostUsage
│   └── OwnerReportTasks
└── Documents / Reports
    ├── Sections
    ├── Approval / Signature
    └── Submission
```

| Feature folder | Feature | Actual parent | Primary container | Primary routes |
|---|---|---|---|---|
| `00-overall` | 전체 골격 / Bootstrap | repository root / docs | Repository + ERP shell | /dashboard, /projects, /webhard, /mail, /admin |
| `01-project-field` | 프로젝트/현장 원장 관리 | Project root | Project | /projects, /projects/new, /projects/[projectId] |
| `02-contract-estimate` | 계약/견적 관리 | Project | Project Detail > Contracts tab | /projects/[projectId]/contracts, /projects/[projectId]/contracts/new, /contracts/[contractId] |
| `03-inspection-schedule` | 점검회차/일정 관리 | Project | Project Detail > Inspection Rounds tab | /projects/[projectId]/inspections, /inspections/[inspectionRoundId], /calendar/inspections |
| `05-field-inspection-checklist` | 현장점검 체크리스트 | InspectionRound | Inspection Round Detail > Checklist tab | /inspections/[inspectionRoundId]/checklist, /inspections/[inspectionRoundId]/checklist/mobile, /inspections/[inspectionRoundId]/checklist/review |
| `06-finding-action-photo-ledger` | 지적사항/조치현황/사진대지 | InspectionRound + Document section | Inspection Round Detail > Findings/Photo Ledger tabs; Document > photo_ledger section | /inspections/[inspectionRoundId]/findings, /inspections/[inspectionRoundId]/photo-ledger, /documents/safety-reports/[documentId]/sections/photo_ledger |
| `07-safety-cost-usage` | 산업안전보건관리비 사용내용 확인 | InspectionRound + OwnerParty + Document section | Inspection Round Detail > Safety Cost tab; Document > safety_cost_usage section | /projects/[projectId]/safety-costs, /inspections/[inspectionRoundId]/safety-costs, /documents/safety-reports/[documentId]/sections/safety_cost_usage |
| `04-safety-health-ledger-report` | 공사안전보건대장 이행확인 보고서 자동화 | Project + InspectionRound + OwnerParty | Project Detail > Documents; InspectionRound > Owner Report Tasks; DocumentInstance | /projects/[projectId]/documents/safety-reports, /documents/safety-reports/[documentId], /inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document |
| `08-safety-management-plan` | 안전관리계획서 자동화 | Project Document | Project Detail > Documents > Safety Management Plan | /projects/[projectId]/documents/safety-management-plans, /documents/safety-management-plans/[documentId] |
| `09-safety-health-ledger` | 안전보건대장 자동화 | Project Document / Project ledger | Project Detail > Documents > Safety Health Ledger | /projects/[projectId]/documents/safety-health-ledgers, /documents/safety-health-ledgers/[documentId] |
| `10-webhard` | 웹하드 | Full-screen app + Project-linked file layer | Webhard shell; Project Detail > Webhard tab | /webhard, /webhard/projects/[projectId], /projects/[projectId]/webhard |
| `11-mailbox` | 메일함 | Full-screen app + Project/Document/Submission linked communication layer | Mailbox 3-pane shell; Project Detail > Mail tab | /mail, /mail/compose, /projects/[projectId]/mail |
| `12-approval-signature-submission` | 결재/서명/제출 | DocumentInstance | Document Detail > Approval/Signature/Submission; global inbox as queue only | /documents/[documentId]/approval, /documents/[documentId]/signature, /documents/[documentId]/submission, /approvals |
| `13-admin-template-prompt` | 관리자/템플릿/프롬프트 | Admin module | Admin shell | /admin, /admin/templates, /admin/prompts, /admin/checklists |
| `14-dashboard-statistics` | 대시보드/통계 | Global dashboard + Project health summaries | Dashboard shell | /dashboard, /dashboard/projects, /dashboard/documents, /dashboard/findings |


---

## FILE: `docs/aec-erp/_index/AEC_ERP_FILE_LIST.md`

# A&C ERP File List

Generated: 2026-05-09T09:08:11.999050+00:00

## Implementation order

| Order | Folder | Feature | Actual parent/container | Primary routes |
|---:|---|---|---|---|
| 0 | `00-overall-bootstrap` | 전체 골격 / Bootstrap | repository root / docs | /dashboard, /projects, /webhard, /mail, /admin |
| 1 | `01-project-field` | 프로젝트/현장 원장 관리 | Project root | /projects, /projects/new, /projects/[projectId] |
| 2 | `02-contract-estimate` | 계약/견적 관리 | Project | /projects/[projectId]/contracts, /projects/[projectId]/contracts/new, /contracts/[contractId] |
| 3 | `03-inspection-schedule` | 점검회차/일정 관리 | Project | /projects/[projectId]/inspections, /inspections/[inspectionRoundId], /calendar/inspections |
| 4 | `05-field-inspection-checklist` | 현장점검 체크리스트 | InspectionRound | /inspections/[inspectionRoundId]/checklist, /inspections/[inspectionRoundId]/checklist/mobile, /inspections/[inspectionRoundId]/checklist/review |
| 5 | `06-finding-action-photo-ledger` | 지적사항/조치현황/사진대지 | InspectionRound + Document section | /inspections/[inspectionRoundId]/findings, /inspections/[inspectionRoundId]/photo-ledger, /documents/safety-reports/[documentId]/sections/photo_ledger |
| 6 | `07-safety-cost-usage` | 산업안전보건관리비 사용내용 확인 | InspectionRound + OwnerParty + Document section | /projects/[projectId]/safety-costs, /inspections/[inspectionRoundId]/safety-costs, /documents/safety-reports/[documentId]/sections/safety_cost_usage |
| 7 | `04-safety-health-ledger-report` | 공사안전보건대장 이행확인 보고서 자동화 | Project + InspectionRound + OwnerParty | /projects/[projectId]/documents/safety-reports, /documents/safety-reports/[documentId], /inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document |
| 8 | `08-safety-management-plan` | 안전관리계획서 자동화 | Project Document | /projects/[projectId]/documents/safety-management-plans, /documents/safety-management-plans/[documentId] |
| 9 | `09-safety-health-ledger` | 안전보건대장 자동화 | Project Document / Project ledger | /projects/[projectId]/documents/safety-health-ledgers, /documents/safety-health-ledgers/[documentId] |
| 10 | `10-webhard` | 웹하드 | Full-screen app + Project-linked file layer | /webhard, /webhard/projects/[projectId], /projects/[projectId]/webhard |
| 11 | `11-mailbox` | 메일함 | Full-screen app + Project/Document/Submission linked communication layer | /mail, /mail/compose, /projects/[projectId]/mail |
| 12 | `12-approval-signature-submission` | 결재/서명/제출 | DocumentInstance | /documents/[documentId]/approval, /documents/[documentId]/signature, /documents/[documentId]/submission, /approvals |
| 13 | `13-admin-template-prompt` | 관리자/템플릿/프롬프트 | Admin module | /admin, /admin/templates, /admin/prompts, /admin/checklists |
| 14 | `14-dashboard-statistics` | 대시보드/통계 | Global dashboard + Project health summaries | /dashboard, /dashboard/projects, /dashboard/documents, /dashboard/findings |

## Key rule

기능 폴더는 구현 단위이고, 실제 ERP 포함 구조는 `Project → InspectionRound → DocumentInstance`를 따른다.

## Files

- `AGENTS.md` (agent-rules, 3308 bytes)
- `Agent.md` (agent-rules, 3308 bytes)
- `CODEX_START_HERE.md` (root-or-other, 1465 bytes)
- `COPY_TO_REPO.md` (root-or-other, 383 bytes)
- `README.md` (root-or-other, 1042 bytes)
- `codex-runbook/COPY_PASTE_SEQUENCE.md` (codex-runbook, 929 bytes)
- `codex-runbook/FEATURE_PROMPTS/00-overall-bootstrap/00_PLAN_ONLY.md` (codex-runbook, 1223 bytes)
- `codex-runbook/FEATURE_PROMPTS/00-overall-bootstrap/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1466 bytes)
- `codex-runbook/FEATURE_PROMPTS/00-overall-bootstrap/02_DESIGN_PASS.md` (codex-runbook, 642 bytes)
- `codex-runbook/FEATURE_PROMPTS/00-overall-bootstrap/03_REVERSE_AUDIT.md` (codex-runbook, 998 bytes)
- `codex-runbook/FEATURE_PROMPTS/00-overall-bootstrap/04_PATCH_FROM_AUDIT.md` (codex-runbook, 510 bytes)
- `codex-runbook/FEATURE_PROMPTS/00-overall-bootstrap/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 918 bytes)
- `codex-runbook/FEATURE_PROMPTS/01-project-field/00_PLAN_ONLY.md` (codex-runbook, 1265 bytes)
- `codex-runbook/FEATURE_PROMPTS/01-project-field/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1484 bytes)
- `codex-runbook/FEATURE_PROMPTS/01-project-field/02_DESIGN_PASS.md` (codex-runbook, 652 bytes)
- `codex-runbook/FEATURE_PROMPTS/01-project-field/03_REVERSE_AUDIT.md` (codex-runbook, 1018 bytes)
- `codex-runbook/FEATURE_PROMPTS/01-project-field/04_PATCH_FROM_AUDIT.md` (codex-runbook, 520 bytes)
- `codex-runbook/FEATURE_PROMPTS/01-project-field/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 906 bytes)
- `codex-runbook/FEATURE_PROMPTS/02-contract-estimate/00_PLAN_ONLY.md` (codex-runbook, 1281 bytes)
- `codex-runbook/FEATURE_PROMPTS/02-contract-estimate/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1559 bytes)
- `codex-runbook/FEATURE_PROMPTS/02-contract-estimate/02_DESIGN_PASS.md` (codex-runbook, 642 bytes)
- `codex-runbook/FEATURE_PROMPTS/02-contract-estimate/03_REVERSE_AUDIT.md` (codex-runbook, 1013 bytes)
- `codex-runbook/FEATURE_PROMPTS/02-contract-estimate/04_PATCH_FROM_AUDIT.md` (codex-runbook, 510 bytes)
- `codex-runbook/FEATURE_PROMPTS/02-contract-estimate/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 961 bytes)
- `codex-runbook/FEATURE_PROMPTS/03-inspection-schedule/00_PLAN_ONLY.md` (codex-runbook, 1303 bytes)
- `codex-runbook/FEATURE_PROMPTS/03-inspection-schedule/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1582 bytes)
- `codex-runbook/FEATURE_PROMPTS/03-inspection-schedule/02_DESIGN_PASS.md` (codex-runbook, 652 bytes)
- `codex-runbook/FEATURE_PROMPTS/03-inspection-schedule/03_REVERSE_AUDIT.md` (codex-runbook, 1023 bytes)
- `codex-runbook/FEATURE_PROMPTS/03-inspection-schedule/04_PATCH_FROM_AUDIT.md` (codex-runbook, 520 bytes)
- `codex-runbook/FEATURE_PROMPTS/03-inspection-schedule/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 974 bytes)
- `codex-runbook/FEATURE_PROMPTS/04-safety-health-ledger-report/00_PLAN_ONLY.md` (codex-runbook, 1427 bytes)
- `codex-runbook/FEATURE_PROMPTS/04-safety-health-ledger-report/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1809 bytes)
- `codex-runbook/FEATURE_PROMPTS/04-safety-health-ledger-report/02_DESIGN_PASS.md` (codex-runbook, 730 bytes)
- `codex-runbook/FEATURE_PROMPTS/04-safety-health-ledger-report/03_REVERSE_AUDIT.md` (codex-runbook, 1070 bytes)
- `codex-runbook/FEATURE_PROMPTS/04-safety-health-ledger-report/04_PATCH_FROM_AUDIT.md` (codex-runbook, 598 bytes)
- `codex-runbook/FEATURE_PROMPTS/04-safety-health-ledger-report/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 1161 bytes)
- `codex-runbook/FEATURE_PROMPTS/05-field-inspection-checklist/00_PLAN_ONLY.md` (codex-runbook, 1363 bytes)
- `codex-runbook/FEATURE_PROMPTS/05-field-inspection-checklist/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1689 bytes)
- `codex-runbook/FEATURE_PROMPTS/05-field-inspection-checklist/02_DESIGN_PASS.md` (codex-runbook, 676 bytes)
- `codex-runbook/FEATURE_PROMPTS/05-field-inspection-checklist/03_REVERSE_AUDIT.md` (codex-runbook, 1039 bytes)
- `codex-runbook/FEATURE_PROMPTS/05-field-inspection-checklist/04_PATCH_FROM_AUDIT.md` (codex-runbook, 544 bytes)
- `codex-runbook/FEATURE_PROMPTS/05-field-inspection-checklist/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 1046 bytes)
- `codex-runbook/FEATURE_PROMPTS/06-finding-action-photo-ledger/00_PLAN_ONLY.md` (codex-runbook, 1395 bytes)
- `codex-runbook/FEATURE_PROMPTS/06-finding-action-photo-ledger/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1776 bytes)
- `codex-runbook/FEATURE_PROMPTS/06-finding-action-photo-ledger/02_DESIGN_PASS.md` (codex-runbook, 707 bytes)
- `codex-runbook/FEATURE_PROMPTS/06-finding-action-photo-ledger/03_REVERSE_AUDIT.md` (codex-runbook, 1051 bytes)
- `codex-runbook/FEATURE_PROMPTS/06-finding-action-photo-ledger/04_PATCH_FROM_AUDIT.md` (codex-runbook, 575 bytes)
- `codex-runbook/FEATURE_PROMPTS/06-finding-action-photo-ledger/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 1128 bytes)
- `codex-runbook/FEATURE_PROMPTS/07-safety-cost-usage/00_PLAN_ONLY.md` (codex-runbook, 1337 bytes)
- `codex-runbook/FEATURE_PROMPTS/07-safety-cost-usage/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1730 bytes)
- `codex-runbook/FEATURE_PROMPTS/07-safety-cost-usage/02_DESIGN_PASS.md` (codex-runbook, 709 bytes)
- `codex-runbook/FEATURE_PROMPTS/07-safety-cost-usage/03_REVERSE_AUDIT.md` (codex-runbook, 1040 bytes)
- `codex-runbook/FEATURE_PROMPTS/07-safety-cost-usage/04_PATCH_FROM_AUDIT.md` (codex-runbook, 577 bytes)
- `codex-runbook/FEATURE_PROMPTS/07-safety-cost-usage/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 1132 bytes)
- `codex-runbook/FEATURE_PROMPTS/08-safety-management-plan/00_PLAN_ONLY.md` (codex-runbook, 1339 bytes)
- `codex-runbook/FEATURE_PROMPTS/08-safety-management-plan/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1640 bytes)
- `codex-runbook/FEATURE_PROMPTS/08-safety-management-plan/02_DESIGN_PASS.md` (codex-runbook, 672 bytes)
- `codex-runbook/FEATURE_PROMPTS/08-safety-management-plan/03_REVERSE_AUDIT.md` (codex-runbook, 1034 bytes)
- `codex-runbook/FEATURE_PROMPTS/08-safety-management-plan/04_PATCH_FROM_AUDIT.md` (codex-runbook, 540 bytes)
- `codex-runbook/FEATURE_PROMPTS/08-safety-management-plan/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 1017 bytes)
- `codex-runbook/FEATURE_PROMPTS/09-safety-health-ledger/00_PLAN_ONLY.md` (codex-runbook, 1337 bytes)
- `codex-runbook/FEATURE_PROMPTS/09-safety-health-ledger/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1636 bytes)
- `codex-runbook/FEATURE_PROMPTS/09-safety-health-ledger/02_DESIGN_PASS.md` (codex-runbook, 682 bytes)
- `codex-runbook/FEATURE_PROMPTS/09-safety-health-ledger/03_REVERSE_AUDIT.md` (codex-runbook, 1027 bytes)
- `codex-runbook/FEATURE_PROMPTS/09-safety-health-ledger/04_PATCH_FROM_AUDIT.md` (codex-runbook, 550 bytes)
- `codex-runbook/FEATURE_PROMPTS/09-safety-health-ledger/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 1023 bytes)
- `codex-runbook/FEATURE_PROMPTS/10-webhard/00_PLAN_ONLY.md` (codex-runbook, 1221 bytes)
- `codex-runbook/FEATURE_PROMPTS/10-webhard/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1514 bytes)
- `codex-runbook/FEATURE_PROMPTS/10-webhard/02_DESIGN_PASS.md` (codex-runbook, 647 bytes)
- `codex-runbook/FEATURE_PROMPTS/10-webhard/03_REVERSE_AUDIT.md` (codex-runbook, 982 bytes)
- `codex-runbook/FEATURE_PROMPTS/10-webhard/04_PATCH_FROM_AUDIT.md` (codex-runbook, 515 bytes)
- `codex-runbook/FEATURE_PROMPTS/10-webhard/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 966 bytes)
- `codex-runbook/FEATURE_PROMPTS/11-mailbox/00_PLAN_ONLY.md` (codex-runbook, 1253 bytes)
- `codex-runbook/FEATURE_PROMPTS/11-mailbox/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1525 bytes)
- `codex-runbook/FEATURE_PROMPTS/11-mailbox/02_DESIGN_PASS.md` (codex-runbook, 676 bytes)
- `codex-runbook/FEATURE_PROMPTS/11-mailbox/03_REVERSE_AUDIT.md` (codex-runbook, 982 bytes)
- `codex-runbook/FEATURE_PROMPTS/11-mailbox/04_PATCH_FROM_AUDIT.md` (codex-runbook, 544 bytes)
- `codex-runbook/FEATURE_PROMPTS/11-mailbox/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 977 bytes)
- `codex-runbook/FEATURE_PROMPTS/12-approval-signature-submission/00_PLAN_ONLY.md` (codex-runbook, 1375 bytes)
- `codex-runbook/FEATURE_PROMPTS/12-approval-signature-submission/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1708 bytes)
- `codex-runbook/FEATURE_PROMPTS/12-approval-signature-submission/02_DESIGN_PASS.md` (codex-runbook, 675 bytes)
- `codex-runbook/FEATURE_PROMPTS/12-approval-signature-submission/03_REVERSE_AUDIT.md` (codex-runbook, 1037 bytes)
- `codex-runbook/FEATURE_PROMPTS/12-approval-signature-submission/04_PATCH_FROM_AUDIT.md` (codex-runbook, 543 bytes)
- `codex-runbook/FEATURE_PROMPTS/12-approval-signature-submission/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 1050 bytes)
- `codex-runbook/FEATURE_PROMPTS/13-admin-template-prompt/00_PLAN_ONLY.md` (codex-runbook, 1319 bytes)
- `codex-runbook/FEATURE_PROMPTS/13-admin-template-prompt/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1548 bytes)
- `codex-runbook/FEATURE_PROMPTS/13-admin-template-prompt/02_DESIGN_PASS.md` (codex-runbook, 667 bytes)
- `codex-runbook/FEATURE_PROMPTS/13-admin-template-prompt/03_REVERSE_AUDIT.md` (codex-runbook, 1033 bytes)
- `codex-runbook/FEATURE_PROMPTS/13-admin-template-prompt/04_PATCH_FROM_AUDIT.md` (codex-runbook, 535 bytes)
- `codex-runbook/FEATURE_PROMPTS/13-admin-template-prompt/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 930 bytes)
- `codex-runbook/FEATURE_PROMPTS/14-dashboard-statistics/00_PLAN_ONLY.md` (codex-runbook, 1329 bytes)
- `codex-runbook/FEATURE_PROMPTS/14-dashboard-statistics/01_IMPLEMENT_FEATURE.md` (codex-runbook, 1579 bytes)
- `codex-runbook/FEATURE_PROMPTS/14-dashboard-statistics/02_DESIGN_PASS.md` (codex-runbook, 683 bytes)
- `codex-runbook/FEATURE_PROMPTS/14-dashboard-statistics/03_REVERSE_AUDIT.md` (codex-runbook, 1018 bytes)
- `codex-runbook/FEATURE_PROMPTS/14-dashboard-statistics/04_PATCH_FROM_AUDIT.md` (codex-runbook, 551 bytes)
- `codex-runbook/FEATURE_PROMPTS/14-dashboard-statistics/05_VALIDATE_PARENT_CHILD_PLACEMENT.md` (codex-runbook, 966 bytes)
- `codex-runbook/ROOT_PROMPTS/00_READ_AND_PLAN.md` (codex-runbook, 795 bytes)
- `codex-runbook/ROOT_PROMPTS/01_BOOTSTRAP_SKELETON.md` (codex-runbook, 808 bytes)
- `codex-runbook/ROOT_PROMPTS/02_BOOTSTRAP_REVERSE_AUDIT.md` (codex-runbook, 657 bytes)
- `codex-runbook/ROOT_PROMPTS/03_VALIDATE_CONTAINMENT_BEFORE_IMPLEMENTATION.md` (codex-runbook, 555 bytes)
- `codex-runbook/ROOT_PROMPTS/04_SERVICE_AI_PROMPTS_SEED_LATER.md` (codex-runbook, 506 bytes)
- `docs/aec-erp/00-overall/00_MASTER_MARKDOWN.md` (overall-spec, 5147 bytes)
- `docs/aec-erp/00-overall/01_FUNCTION_INDEX.md` (overall-spec, 1912 bytes)
- `docs/aec-erp/00-overall/02_GLOBAL_DESIGN_SYSTEM.md` (overall-spec, 5209 bytes)
- `docs/aec-erp/00-overall/03_GLOBAL_REVERSE_PROMPT.md` (overall-spec, 2610 bytes)
- `docs/aec-erp/00-overall/04_DOCUMENT_PACK_RULE.md` (overall-spec, 1909 bytes)
- `docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md` (overall-spec, 6561 bytes)
- `docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md` (overall-spec, 6192 bytes)
- `docs/aec-erp/01-project-field/README.md` (root-or-other, 1492 bytes)
- `docs/aec-erp/01-project-field/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 8188 bytes)
- `docs/aec-erp/01-project-field/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 12107 bytes)
- `docs/aec-erp/01-project-field/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 5672 bytes)
- `docs/aec-erp/01-project-field/markdown/07_REVERSE_MAP.md` (feature-markdown, 7092 bytes)
- `docs/aec-erp/01-project-field/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 4236 bytes)
- `docs/aec-erp/01-project-field/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 6218 bytes)
- `docs/aec-erp/01-project-field/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 3597 bytes)
- `docs/aec-erp/01-project-field/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 4035 bytes)
- `docs/aec-erp/02-contract-estimate/README.md` (root-or-other, 1226 bytes)
- `docs/aec-erp/02-contract-estimate/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 6832 bytes)
- `docs/aec-erp/02-contract-estimate/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 10650 bytes)
- `docs/aec-erp/02-contract-estimate/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 5443 bytes)
- `docs/aec-erp/02-contract-estimate/markdown/07_REVERSE_MAP.md` (feature-markdown, 6766 bytes)
- `docs/aec-erp/02-contract-estimate/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 4200 bytes)
- `docs/aec-erp/02-contract-estimate/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 6130 bytes)
- `docs/aec-erp/02-contract-estimate/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 3445 bytes)
- `docs/aec-erp/02-contract-estimate/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 3875 bytes)
- `docs/aec-erp/03-inspection-schedule/README.md` (root-or-other, 1163 bytes)
- `docs/aec-erp/03-inspection-schedule/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 7967 bytes)
- `docs/aec-erp/03-inspection-schedule/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 11490 bytes)
- `docs/aec-erp/03-inspection-schedule/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 5787 bytes)
- `docs/aec-erp/03-inspection-schedule/markdown/07_REVERSE_MAP.md` (feature-markdown, 7252 bytes)
- `docs/aec-erp/03-inspection-schedule/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 5100 bytes)
- `docs/aec-erp/03-inspection-schedule/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 6779 bytes)
- `docs/aec-erp/03-inspection-schedule/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 3351 bytes)
- `docs/aec-erp/03-inspection-schedule/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 4481 bytes)
- `docs/aec-erp/04-safety-health-ledger-report/README.md` (root-or-other, 1364 bytes)
- `docs/aec-erp/04-safety-health-ledger-report/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 6775 bytes)
- `docs/aec-erp/04-safety-health-ledger-report/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 9194 bytes)
- `docs/aec-erp/04-safety-health-ledger-report/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 5891 bytes)
- `docs/aec-erp/04-safety-health-ledger-report/markdown/07_REVERSE_MAP.md` (feature-markdown, 7318 bytes)
- `docs/aec-erp/04-safety-health-ledger-report/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 5364 bytes)
- `docs/aec-erp/04-safety-health-ledger-report/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 6467 bytes)
- `docs/aec-erp/04-safety-health-ledger-report/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 3766 bytes)
- `docs/aec-erp/04-safety-health-ledger-report/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 5519 bytes)
- `docs/aec-erp/05-field-inspection-checklist/README.md` (root-or-other, 1435 bytes)
- `docs/aec-erp/05-field-inspection-checklist/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 7559 bytes)
- `docs/aec-erp/05-field-inspection-checklist/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 9079 bytes)
- `docs/aec-erp/05-field-inspection-checklist/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 4764 bytes)
- `docs/aec-erp/05-field-inspection-checklist/markdown/07_REVERSE_MAP.md` (feature-markdown, 5585 bytes)
- `docs/aec-erp/05-field-inspection-checklist/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 3058 bytes)
- `docs/aec-erp/05-field-inspection-checklist/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 5865 bytes)
- `docs/aec-erp/05-field-inspection-checklist/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 3492 bytes)
- `docs/aec-erp/05-field-inspection-checklist/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 3195 bytes)
- `docs/aec-erp/06-finding-action-photo-ledger/README.md` (root-or-other, 1857 bytes)
- `docs/aec-erp/06-finding-action-photo-ledger/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 8463 bytes)
- `docs/aec-erp/06-finding-action-photo-ledger/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 12317 bytes)
- `docs/aec-erp/06-finding-action-photo-ledger/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 6660 bytes)
- `docs/aec-erp/06-finding-action-photo-ledger/markdown/07_REVERSE_MAP.md` (feature-markdown, 6981 bytes)
- `docs/aec-erp/06-finding-action-photo-ledger/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 4769 bytes)
- `docs/aec-erp/06-finding-action-photo-ledger/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 8587 bytes)
- `docs/aec-erp/06-finding-action-photo-ledger/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 3960 bytes)
- `docs/aec-erp/06-finding-action-photo-ledger/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 5380 bytes)
- `docs/aec-erp/07-safety-cost-usage/README.md` (root-or-other, 2087 bytes)
- `docs/aec-erp/07-safety-cost-usage/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 7276 bytes)
- `docs/aec-erp/07-safety-cost-usage/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 7973 bytes)
- `docs/aec-erp/07-safety-cost-usage/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 5429 bytes)
- `docs/aec-erp/07-safety-cost-usage/markdown/07_REVERSE_MAP.md` (feature-markdown, 6073 bytes)
- `docs/aec-erp/07-safety-cost-usage/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 3449 bytes)
- `docs/aec-erp/07-safety-cost-usage/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 5418 bytes)
- `docs/aec-erp/07-safety-cost-usage/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 3269 bytes)
- `docs/aec-erp/07-safety-cost-usage/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 4438 bytes)
- `docs/aec-erp/08-safety-management-plan/README.md` (root-or-other, 1777 bytes)
- `docs/aec-erp/08-safety-management-plan/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 6548 bytes)
- `docs/aec-erp/08-safety-management-plan/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 10157 bytes)
- `docs/aec-erp/08-safety-management-plan/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 5770 bytes)
- `docs/aec-erp/08-safety-management-plan/markdown/07_REVERSE_MAP.md` (feature-markdown, 7745 bytes)
- `docs/aec-erp/08-safety-management-plan/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 4497 bytes)
- `docs/aec-erp/08-safety-management-plan/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 6477 bytes)
- `docs/aec-erp/08-safety-management-plan/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 3956 bytes)
- `docs/aec-erp/08-safety-management-plan/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 5074 bytes)
- `docs/aec-erp/09-safety-health-ledger/README.md` (root-or-other, 2063 bytes)
- `docs/aec-erp/09-safety-health-ledger/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 7476 bytes)
- `docs/aec-erp/09-safety-health-ledger/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 11896 bytes)
- `docs/aec-erp/09-safety-health-ledger/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 6719 bytes)
- `docs/aec-erp/09-safety-health-ledger/markdown/07_REVERSE_MAP.md` (feature-markdown, 7559 bytes)
- `docs/aec-erp/09-safety-health-ledger/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 5461 bytes)
- `docs/aec-erp/09-safety-health-ledger/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 7449 bytes)
- `docs/aec-erp/09-safety-health-ledger/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 3768 bytes)
- `docs/aec-erp/09-safety-health-ledger/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 4949 bytes)
- `docs/aec-erp/10-webhard/README.md` (root-or-other, 1874 bytes)
- `docs/aec-erp/10-webhard/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 8172 bytes)
- `docs/aec-erp/10-webhard/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 10320 bytes)
- `docs/aec-erp/10-webhard/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 6354 bytes)
- `docs/aec-erp/10-webhard/markdown/07_REVERSE_MAP.md` (feature-markdown, 6537 bytes)
- `docs/aec-erp/10-webhard/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 4613 bytes)
- `docs/aec-erp/10-webhard/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 6813 bytes)
- `docs/aec-erp/10-webhard/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 3280 bytes)
- `docs/aec-erp/10-webhard/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 4689 bytes)
- `docs/aec-erp/11-mailbox/README.md` (root-or-other, 1622 bytes)
- `docs/aec-erp/11-mailbox/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 7583 bytes)
- `docs/aec-erp/11-mailbox/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 10822 bytes)
- `docs/aec-erp/11-mailbox/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 6588 bytes)
- `docs/aec-erp/11-mailbox/markdown/07_REVERSE_MAP.md` (feature-markdown, 7713 bytes)
- `docs/aec-erp/11-mailbox/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 5073 bytes)
- `docs/aec-erp/11-mailbox/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 7569 bytes)
- `docs/aec-erp/11-mailbox/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 3808 bytes)
- `docs/aec-erp/11-mailbox/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 5004 bytes)
- `docs/aec-erp/12-approval-signature-submission/README.md` (root-or-other, 1467 bytes)
- `docs/aec-erp/12-approval-signature-submission/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 8128 bytes)
- `docs/aec-erp/12-approval-signature-submission/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 13521 bytes)
- `docs/aec-erp/12-approval-signature-submission/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 7036 bytes)
- `docs/aec-erp/12-approval-signature-submission/markdown/07_REVERSE_MAP.md` (feature-markdown, 8241 bytes)
- `docs/aec-erp/12-approval-signature-submission/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 4332 bytes)
- `docs/aec-erp/12-approval-signature-submission/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 8612 bytes)
- `docs/aec-erp/12-approval-signature-submission/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 3443 bytes)
- `docs/aec-erp/12-approval-signature-submission/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 4938 bytes)
- `docs/aec-erp/13-admin-template-prompt/README.md` (root-or-other, 1675 bytes)
- `docs/aec-erp/13-admin-template-prompt/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 8604 bytes)
- `docs/aec-erp/13-admin-template-prompt/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 15913 bytes)
- `docs/aec-erp/13-admin-template-prompt/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 7168 bytes)
- `docs/aec-erp/13-admin-template-prompt/markdown/07_REVERSE_MAP.md` (feature-markdown, 9694 bytes)
- `docs/aec-erp/13-admin-template-prompt/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 4822 bytes)
- `docs/aec-erp/13-admin-template-prompt/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 9479 bytes)
- `docs/aec-erp/13-admin-template-prompt/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 4823 bytes)
- `docs/aec-erp/13-admin-template-prompt/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 5310 bytes)
- `docs/aec-erp/14-dashboard-statistics/README.md` (root-or-other, 1460 bytes)
- `docs/aec-erp/14-dashboard-statistics/markdown/01_PRODUCT_MARKDOWN.md` (feature-markdown, 6138 bytes)
- `docs/aec-erp/14-dashboard-statistics/markdown/02_TECH_MARKDOWN.md` (feature-markdown, 8427 bytes)
- `docs/aec-erp/14-dashboard-statistics/markdown/05_DESIGN_MARKDOWN.md` (feature-markdown, 4706 bytes)
- `docs/aec-erp/14-dashboard-statistics/markdown/07_REVERSE_MAP.md` (feature-markdown, 7009 bytes)
- `docs/aec-erp/14-dashboard-statistics/prompts/03_SERVICE_AI_PROMPT.md` (feature-prompt, 3520 bytes)
- `docs/aec-erp/14-dashboard-statistics/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md` (feature-prompt, 6001 bytes)
- `docs/aec-erp/14-dashboard-statistics/prompts/06_DESIGN_PROMPT.md` (feature-prompt, 2977 bytes)
- `docs/aec-erp/14-dashboard-statistics/prompts/08_REVERSE_PROMPT.md` (feature-prompt, 4560 bytes)
- `docs/aec-erp/FILE_TREE.txt` (root-or-other, 6867 bytes)
- `docs/aec-erp/MANIFEST.json` (root-or-other, 928 bytes)
- `docs/aec-erp/README.md` (root-or-other, 2551 bytes)
- `docs/aec-erp/SOURCE_CHAT_SUMMARY.md` (root-or-other, 2833 bytes)
- `docs/aec-erp/_html/containment-map.html` (html-index, 5989 bytes)
- `docs/aec-erp/_html/implementation-sequence.html` (html-index, 5106 bytes)
- `docs/aec-erp/_html/index.html` (html-index, 5786 bytes)
- `docs/aec-erp/_index/AEC_ERP_CONTAINMENT_MAP.md` (markdown-index, 4161 bytes)
- `docs/aec-erp/_index/AEC_ERP_IMPLEMENTATION_SEQUENCE.md` (markdown-index, 3528 bytes)
- `docs/aec-erp/_json/containment_map.json` (json-index, 9331 bytes)
- `docs/aec-erp/_json/features.json` (json-index, 8040 bytes)
- `docs/aec-erp/_json/implementation_sequence.json` (json-index, 11204 bytes)
- `docs/aec-erp/_json/reverse_index.json` (json-index, 20239 bytes)


---

## FILE: `docs/aec-erp/_index/AEC_ERP_IMPLEMENTATION_SEQUENCE.md`

# A&C ERP Implementation Sequence

## Root prompts

1. `codex-runbook/ROOT_PROMPTS/00_READ_AND_PLAN.md`
2. `codex-runbook/ROOT_PROMPTS/01_BOOTSTRAP_SKELETON.md`
3. `codex-runbook/ROOT_PROMPTS/02_BOOTSTRAP_REVERSE_AUDIT.md`
4. `codex-runbook/ROOT_PROMPTS/03_VALIDATE_CONTAINMENT_BEFORE_IMPLEMENTATION.md`

## Feature order

| Order | Folder | Feature | Actual parent/container | Primary routes |
|---:|---|---|---|---|
| 0 | `00-overall-bootstrap` | 전체 골격 / Bootstrap | repository root / docs | /dashboard, /projects, /webhard, /mail, /admin |
| 1 | `01-project-field` | 프로젝트/현장 원장 관리 | Project root | /projects, /projects/new, /projects/[projectId] |
| 2 | `02-contract-estimate` | 계약/견적 관리 | Project | /projects/[projectId]/contracts, /projects/[projectId]/contracts/new, /contracts/[contractId] |
| 3 | `03-inspection-schedule` | 점검회차/일정 관리 | Project | /projects/[projectId]/inspections, /inspections/[inspectionRoundId], /calendar/inspections |
| 4 | `05-field-inspection-checklist` | 현장점검 체크리스트 | InspectionRound | /inspections/[inspectionRoundId]/checklist, /inspections/[inspectionRoundId]/checklist/mobile, /inspections/[inspectionRoundId]/checklist/review |
| 5 | `06-finding-action-photo-ledger` | 지적사항/조치현황/사진대지 | InspectionRound + Document section | /inspections/[inspectionRoundId]/findings, /inspections/[inspectionRoundId]/photo-ledger, /documents/safety-reports/[documentId]/sections/photo_ledger |
| 6 | `07-safety-cost-usage` | 산업안전보건관리비 사용내용 확인 | InspectionRound + OwnerParty + Document section | /projects/[projectId]/safety-costs, /inspections/[inspectionRoundId]/safety-costs, /documents/safety-reports/[documentId]/sections/safety_cost_usage |
| 7 | `04-safety-health-ledger-report` | 공사안전보건대장 이행확인 보고서 자동화 | Project + InspectionRound + OwnerParty | /projects/[projectId]/documents/safety-reports, /documents/safety-reports/[documentId], /inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document |
| 8 | `08-safety-management-plan` | 안전관리계획서 자동화 | Project Document | /projects/[projectId]/documents/safety-management-plans, /documents/safety-management-plans/[documentId] |
| 9 | `09-safety-health-ledger` | 안전보건대장 자동화 | Project Document / Project ledger | /projects/[projectId]/documents/safety-health-ledgers, /documents/safety-health-ledgers/[documentId] |
| 10 | `10-webhard` | 웹하드 | Full-screen app + Project-linked file layer | /webhard, /webhard/projects/[projectId], /projects/[projectId]/webhard |
| 11 | `11-mailbox` | 메일함 | Full-screen app + Project/Document/Submission linked communication layer | /mail, /mail/compose, /projects/[projectId]/mail |
| 12 | `12-approval-signature-submission` | 결재/서명/제출 | DocumentInstance | /documents/[documentId]/approval, /documents/[documentId]/signature, /documents/[documentId]/submission, /approvals |
| 13 | `13-admin-template-prompt` | 관리자/템플릿/프롬프트 | Admin module | /admin, /admin/templates, /admin/prompts, /admin/checklists |
| 14 | `14-dashboard-statistics` | 대시보드/통계 | Global dashboard + Project health summaries | /dashboard, /dashboard/projects, /dashboard/documents, /dashboard/findings |

## Per-feature prompt order

```text
00_PLAN_ONLY.md
05_VALIDATE_PARENT_CHILD_PLACEMENT.md
01_IMPLEMENT_FEATURE.md
02_DESIGN_PASS.md
03_REVERSE_AUDIT.md
04_PATCH_FROM_AUDIT.md
```
