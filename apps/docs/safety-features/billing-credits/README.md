# billing-credits

결제, 크레딧 충전, 크레딧 잔액, ledger, 보고서 최종 출력 과금을 관리하는 기능 문서다.

이 기능은 `/account#billing`에서 결제 진입을 제공하고, `/billing/checkout`, `/billing/success`, `/billing/fail`을 통해 Toss 결제창과 승인 흐름을 처리하며, `/credits`는 현재 `/account#billing`로 redirect된다.

## 문서 구조

```text
billing-credits/
├─ specs/
│  ├─ feature.md
│  ├─ user_flows.md
│  ├─ data_flow.md
│  ├─ schema.md
│  ├─ api_contract.md
│  ├─ checkout.md
│  ├─ toss_webhook.md
│  ├─ credit_ledger.md
│  ├─ report_export_billing.md
│  ├─ account_entry.md
│  ├─ ui_ux.md
│  ├─ validation.md
│  ├─ reverse_map.md
│  ├─ test_scenarios.md
│  ├─ code_inventory.md
│  └─ known_issues.md
└─ prompts/
   ├─ 01_READ_AND_PLAN.md
   ├─ 02_SCHEMA_AND_API_PROMPT.md
   ├─ 03_IMPLEMENT_CHECKOUT.md
   ├─ 04_IMPLEMENT_WEBHOOK_AND_LEDGER.md
   ├─ 05_IMPLEMENT_REPORT_EXPORT_BILLING.md
   ├─ 06_VISUAL_POLISH.md
   └─ 07_QA_REGRESSION.md
```

## 핵심 원칙

- 크레딧은 workspace 단위로 관리한다.
- 결제 성공과 webhook은 idempotent해야 한다.
- 동일 주문/결제가 중복으로 credit을 지급하면 안 된다.
- 보고서 최종 출력은 검토 완료 후에만 가능하며, 최초 final export 성공 시 credit을 차감한다.
- 결제 화면 자체보다 `account-settings`와 `report-workspace` 사이의 과금 정책 연결이 중요하다.
