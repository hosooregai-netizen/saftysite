# 01_READ_AND_PLAN: Billing & Credits

```text
너는 결제/크레딧 기능을 분석하는 시니어 풀스택 엔지니어다.

목표:
현재 billing-credits 관련 코드와 문서를 읽고 구현/문서화 계획을 세워라. 아직 코드는 수정하지 마라.

반드시 확인할 문서:
- docs/safety-features/billing-credits/specs/feature.md
- docs/safety-features/billing-credits/specs/data_flow.md
- docs/safety-features/billing-credits/specs/schema.md
- docs/safety-features/billing-credits/specs/api_contract.md
- docs/safety-features/billing-credits/specs/report_export_billing.md
- docs/safety-features/account-settings/specs/billing_entry.md
- docs/safety-features/report-workspace/specs/export_dispatch.md

반드시 확인할 코드:
- apps/web/components/BillingCheckoutScreen.tsx
- apps/web/components/BillingSuccessScreen.tsx
- apps/web/components/BillingFailScreen.tsx
- apps/web/app/credits/page.tsx
- apps/web/lib/reportApi.ts
- apps/api/app/main.py
- apps/api/app/services/credits.py
- apps/api/app/config.py
- apps/api/app/models.py

절대 수정하지 말 것:
- .next
- .venv
- __MACOSX
- unrelated feature code

산출물:
1. checkout/confirm/webhook/ledger/export billing 흐름 요약
2. 중복 지급/중복 차감 방지 로직 확인
3. Toss 설정/env 이슈
4. 보안 리스크
5. 구현 우선순위
```
