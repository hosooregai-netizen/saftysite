# 09_IMPLEMENT_TOSS_IDEMPOTENCY_AND_LEDGER_RECONCILIATION

```text
Toss success confirm과 webhook이 중복 호출되어도 credit이 중복 지급되지 않도록 하라.

요구사항:
1. paymentKey/orderId 기반 idempotency.
2. confirm 2회 호출 no double credit.
3. webhook 2회 호출 no double credit.
4. confirm 후 webhook no double credit.
5. ledger sum과 API balance 일치.
```
