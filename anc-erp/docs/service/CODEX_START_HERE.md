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
