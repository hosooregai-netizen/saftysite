# 00_MASTER_CREATE_BILLING_CREDITS_DOCS

```text
너는 Next.js + FastAPI 기반 SaaS/ERP 프로젝트의 결제/크레딧 기능을 문서화하는 시니어 테크니컬 라이터이자 소프트웨어 아키텍트다.

목표:
`docs/safety-features/billing-credits/` 아래에 결제/크레딧 기능의 specs와 prompts 구조를 생성하라.

대상 구조:
billing-credits/
├─ README.md
├─ specs/
└─ prompts/

반드시 확인할 코드:
- apps/web/app/billing/checkout/page.tsx
- apps/web/app/billing/success/page.tsx
- apps/web/app/billing/fail/page.tsx
- apps/web/app/credits/page.tsx
- apps/web/components/BillingCheckoutScreen.tsx
- apps/web/components/BillingSuccessScreen.tsx
- apps/web/components/BillingFailScreen.tsx
- apps/web/components/AccountSettingsScreen.tsx
- apps/web/components/ReportWorkspace.tsx
- apps/web/lib/reportApi.ts
- apps/api/app/main.py
- apps/api/app/services/credits.py
- apps/api/app/config.py
- apps/api/app/models.py

생성할 specs:
- README.md
- feature.md
- user_flows.md
- data_flow.md
- schema.md
- api_contract.md
- checkout.md
- toss_webhook.md
- credit_ledger.md
- report_export_billing.md
- account_entry.md
- ui_ux.md
- validation.md
- reverse_map.md
- test_scenarios.md
- code_inventory.md
- known_issues.md

생성할 prompts:
- 01_READ_AND_PLAN.md
- 02_SCHEMA_AND_API_PROMPT.md
- 03_IMPLEMENT_CHECKOUT.md
- 04_IMPLEMENT_WEBHOOK_AND_LEDGER.md
- 05_IMPLEMENT_REPORT_EXPORT_BILLING.md
- 06_VISUAL_POLISH.md
- 07_QA_REGRESSION.md

문서 작성 원칙:
- specs는 명세와 구조만 작성한다.
- prompts는 Codex/구현 에이전트에게 바로 넣을 수 있는 실행 프롬프트로 작성한다.
- 앱 코드는 수정하지 않는다.
- .next, .venv, __MACOSX는 건드리지 않는다.

완료 기준:
- 결제 시작, 성공, 실패, webhook, credit ledger, report export billing 흐름이 모두 문서화되어 있다.
- 중복 지급/중복 차감 방지 기준이 명시되어 있다.
- prompt를 순서대로 실행하면 billing-credits 기능을 개선할 수 있다.
```
