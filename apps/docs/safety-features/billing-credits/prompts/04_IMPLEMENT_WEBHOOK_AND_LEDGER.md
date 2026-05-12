# 04_IMPLEMENT_WEBHOOK_AND_LEDGER

```text
너는 Toss webhook과 credit ledger idempotency를 강화하는 시니어 백엔드 엔지니어다.

목표:
결제 confirm과 webhook이 어떤 순서로 오더라도 purchase credit이 정확히 1회만 지급되도록 하라.

참조 문서:
- docs/safety-features/billing-credits/specs/toss_webhook.md
- docs/safety-features/billing-credits/specs/credit_ledger.md
- docs/safety-features/billing-credits/specs/known_issues.md

대상 코드:
- apps/api/app/main.py
- apps/api/app/services/credits.py
- apps/api/app/models.py
- apps/api/app/config.py

요구사항:
1. grant_purchase_credits_once가 중복 지급을 막는지 검증하라.
2. DONE webhook 중복 전송 테스트를 추가하라.
3. confirm 후 webhook, webhook 후 confirm 순서 모두 테스트하라.
4. ledger entry에 source_order_id/source_payment_key를 남겨라.
5. 가능한 경우 source_order_id 또는 source_payment_key unique constraint를 제안하라.
6. webhook signature/security 검증 필요성을 known issue에 남겨라.
7. balance는 ledger 합계와 일치해야 한다.

완료 기준:
- 같은 order/payment에 대해 purchase ledger가 1개만 생성된다.
- duplicate webhook에도 balance가 변하지 않는다.
```
