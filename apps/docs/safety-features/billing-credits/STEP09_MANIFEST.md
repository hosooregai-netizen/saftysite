# Step 09: billing-credits specs/prompts

이번 단계는 `docs/safety-features/billing-credits/` 구조를 생성한다.

## 목적

결제, 크레딧, ledger, Toss checkout/webhook, 보고서 출력 과금을 `specs/`와 `prompts/`로 분리한다.

## 핵심 범위

- `/account#billing`
- `/billing/checkout`
- `/billing/success`
- `/billing/fail`
- `/credits`
- `POST /api/v1/billing/checkout`
- `POST /api/v1/billing/confirm`
- `POST /api/v1/billing/webhooks/toss`
- `GET /api/v1/credits/balance`
- `GET /api/v1/credits/ledger`
- 보고서 최초 final export credit 차감

## 생성 파일

```text
docs/safety-features/billing-credits/
├─ README.md
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

## 다음 단계 추천

Step 10은 `auth-workspace`가 좋다. 인증/워크스페이스는 account-settings, billing, webhard, mailbox, reports 전체의 기반이기 때문이다.
