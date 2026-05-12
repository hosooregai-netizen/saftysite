# 03_IMPLEMENT_CHECKOUT

```text
너는 Toss checkout 시작/성공/실패 화면을 안정화하는 시니어 프론트엔드/백엔드 엔지니어다.

목표:
`/billing/checkout`, `/billing/success`, `/billing/fail` 흐름을 안정화하고, account billing section으로 안내가 명확히 돌아가도록 하라.

참조 문서:
- docs/safety-features/billing-credits/specs/checkout.md
- docs/safety-features/billing-credits/specs/account_entry.md
- docs/safety-features/account-settings/specs/billing_entry.md

대상 코드:
- apps/web/components/BillingCheckoutScreen.tsx
- apps/web/components/BillingSuccessScreen.tsx
- apps/web/components/BillingFailScreen.tsx
- apps/web/app/credits/page.tsx
- apps/web/lib/reportApi.ts
- apps/api/app/main.py

요구사항:
1. package query validation을 확인하라.
2. anonymous/local session은 결제 전에 /account로 redirect하라.
3. checkoutUrl 없을 때 사용자에게 명확한 오류를 보여라.
4. success callback의 paymentKey/orderId/amount validation을 확인하라.
5. fail callback의 code/message를 account billing section으로 전달하라.
6. Toss config가 없을 때 503 안내가 명확해야 한다.
7. checkout order 생성은 workspace access를 검증해야 한다.

완료 기준:
- invalid package, unauthenticated, Toss config missing, success, fail route가 모두 명확히 동작한다.
```
