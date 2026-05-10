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
