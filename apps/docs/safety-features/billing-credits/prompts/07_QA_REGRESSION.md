# 07_QA_REGRESSION: Billing & Credits

```text
너는 결제/크레딧 기능의 QA와 회귀 테스트를 담당하는 시니어 QA 엔지니어다.

목표:
checkout, confirm, webhook, ledger, report export billing 흐름을 검증하라.

참조 문서:
- docs/safety-features/billing-credits/specs/test_scenarios.md
- docs/safety-features/billing-credits/specs/validation.md
- docs/safety-features/billing-credits/specs/known_issues.md

검증 명령:
rm -rf apps/web/.next
cd apps/web
npm run build

Route smoke:
- /account#billing
- /credits
- /billing/checkout?package=starter-10
- /billing/checkout?package=invalid
- /billing/success?paymentKey=test&orderId=test&amount=1000
- /billing/fail?code=FAIL&message=테스트실패

API tests:
1. billing checkout
2. billing confirm
3. duplicate confirm
4. Toss DONE webhook
5. duplicate webhook
6. credits balance
7. credits ledger
8. report export with 0 credits
9. first export consumes credit
10. second export same report does not consume additional credit

완료 기준:
- build 성공
- route smoke 성공
- idempotency 성공
- ledger balance 정확
- report export billing 정책 통과
```
