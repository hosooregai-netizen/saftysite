# 02_SCHEMA_AND_API_PROMPT

```text
너는 결제/크레딧 기능의 schema와 API 계약을 정리하는 시니어 백엔드 엔지니어다.

목표:
BillingOrder, CreditLedgerEntry, BillingCheckoutRequest, BillingConfirmRequest, ReportExport billing 관련 schema/API를 최신 코드 기준으로 정리하고 필요한 보강점을 제안하라.

대상 문서:
- docs/safety-features/billing-credits/specs/schema.md
- docs/safety-features/billing-credits/specs/api_contract.md
- docs/safety-features/billing-credits/specs/credit_ledger.md
- docs/safety-features/billing-credits/specs/reverse_map.md

대상 코드:
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/services/credits.py
- apps/api/app/config.py
- apps/web/lib/reportApi.ts

요구사항:
1. frontend request body와 backend model 필드명을 비교하라.
2. package_id, workspace_id, order_id, payment_key, amount validation을 점검하라.
3. billing order status 값을 정리하라.
4. ledger entry type과 amount 부호 기준을 정리하라.
5. 중복 지급 방지를 DB 수준으로 강화할 수 있는지 제안하라.
6. 문서와 코드가 다르면 문서를 업데이트하라.

완료 기준:
- api_contract.md만 보고 checkout/confirm/webhook/balance/ledger API를 이해할 수 있다.
- schema.md에 중복 지급 방지 필드가 명확히 설명되어 있다.
```
