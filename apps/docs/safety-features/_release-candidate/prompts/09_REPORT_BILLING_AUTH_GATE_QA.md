# 09_REPORT_BILLING_AUTH_GATE_QA

```text
보고서 검토/출력, credit 차감, Toss idempotency, Workspace auth, guest import gate를 검증하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

QA:
1. review 전 export 차단
2. review 후 first export credit 차감
3. same report re-export no charge
4. Toss confirm/webhook duplicate no double credit
5. Workspace Google login과 Gmail connect 분리
6. guest import duplicate no double import
7. workspace 밖 report/ledger 접근 차단
```
