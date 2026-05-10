# AI Agent Prompt Runbook

## 기본 실행 순서

```text
01_READ_AND_PLAN
→ schema/API prompt
→ backend/domain prompt
→ UI prompt
→ QA prompt
→ docs update
```

## 웹하드 권한/공유

```text
webhard/prompts/01_READ_AND_PLAN.md
webhard/prompts/07_IMPLEMENT_PERMISSION_MODEL_HARDENING.md
webhard/prompts/08_IMPLEMENT_SHARE_DIALOG_AND_BADGES.md
webhard/prompts/09_IMPLEMENT_PUBLIC_SHARE_BOUNDARY.md
webhard/prompts/10_IMPLEMENT_PUBLIC_SHARE_PAGE_HARDENING.md
webhard/prompts/11_WEBHARD_QA_AFTER_HARDENING.md
```

## 메일함 상태/작성창

```text
mailbox/prompts/01_READ_AND_PLAN.md
mailbox/prompts/08_IMPLEMENT_STATE_CONSISTENCY_AFTER_SOURCE_RECOVERY.md
mailbox/prompts/09_HARDEN_THREE_PANE_EMPTY_STATES.md
mailbox/prompts/10_HARDEN_COMPOSE_PANEL_AFTER_RECOVERY.md
mailbox/prompts/11_MAILBOX_QA_AFTER_HARDENING.md
```

## 보고서 / 결제 / 인증 gate

```text
report-workspace/prompts/12_IMPLEMENT_REVIEW_EXPORT_GATE_HARDENING.md
billing-credits/prompts/08_IMPLEMENT_EXPORT_CREDIT_POLICY.md
billing-credits/prompts/09_IMPLEMENT_TOSS_IDEMPOTENCY_AND_LEDGER_RECONCILIATION.md
auth-workspace/prompts/08_IMPLEMENT_WORKSPACE_AUTH_AND_GUEST_IMPORT_GATES.md
_release-candidate/prompts/09_REPORT_BILLING_AUTH_GATE_QA.md
```

## 금지

```text
.next 수정 금지
.venv 수정 금지
__MACOSX 수정 금지
관련 없는 기능 변경 금지
문서와 registry 업데이트 누락 금지
```
