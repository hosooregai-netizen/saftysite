# Reverse Map: Billing & Credits

## Route map

| Route | Component | 역할 |
|---|---|---|
| `/account#billing` | `AccountSettingsScreen` | 결제 패키지/잔액/이력 표시 |
| `/billing/checkout` | `BillingCheckoutScreen` | Toss checkout 생성 및 이동 |
| `/billing/success` | `BillingSuccessScreen` | Toss confirm 후 account redirect |
| `/billing/fail` | `BillingFailScreen` | 실패 메시지 account redirect |
| `/credits` | route redirect | `/account#billing` 이동 |

## Frontend code map

| 파일 | 역할 |
|---|---|
| `apps/web/components/BillingCheckoutScreen.tsx` | checkout 시작 |
| `apps/web/components/BillingSuccessScreen.tsx` | payment confirm |
| `apps/web/components/BillingFailScreen.tsx` | fail redirect |
| `apps/web/app/credits/page.tsx` | account billing redirect |
| `apps/web/lib/reportApi.ts` | billing/credits API client |
| `apps/web/components/AccountSettingsScreen.tsx` | billing section 표시 |
| `apps/web/components/ReportWorkspace.tsx` | export credit consumption UX |

## Backend code map

| 파일 | 역할 |
|---|---|
| `apps/api/app/main.py` | billing/credits/report export endpoints |
| `apps/api/app/services/credits.py` | ledger balance/entry/trial |
| `apps/api/app/config.py` | packages/Toss config |
| `apps/api/app/models.py` | request/ledger/export models |

## API map

| 기능 | API |
|---|---|
| checkout | `POST /api/v1/billing/checkout` |
| confirm | `POST /api/v1/billing/confirm` |
| webhook | `POST /api/v1/billing/webhooks/toss` |
| balance | `GET /api/v1/credits/balance` |
| ledger | `GET /api/v1/credits/ledger` |
| report export | `POST /api/v1/reports/{id}/exports/pdf|hwpx` |

## Prompt map

| Prompt | 목적 |
|---|---|
| `01_READ_AND_PLAN.md` | 현재 구조 분석 |
| `02_SCHEMA_AND_API_PROMPT.md` | schema/API 계약 정리 |
| `03_IMPLEMENT_CHECKOUT.md` | checkout/success/fail 안정화 |
| `04_IMPLEMENT_WEBHOOK_AND_LEDGER.md` | webhook/ledger/idempotency 강화 |
| `05_IMPLEMENT_REPORT_EXPORT_BILLING.md` | report export 과금 검증 |
| `06_VISUAL_POLISH.md` | account billing UI 개선 |
| `07_QA_REGRESSION.md` | 전체 회귀 테스트 |
