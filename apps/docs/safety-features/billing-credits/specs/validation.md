# Validation Spec: Billing & Credits

## Build validation

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## Route smoke

- `/account#billing`
- `/credits`
- `/billing/checkout?package=starter-10`
- `/billing/success?paymentKey=test&orderId=test&amount=1000`
- `/billing/fail?code=FAIL&message=테스트실패`

## API validation

- `POST /api/v1/billing/checkout`
- `POST /api/v1/billing/confirm`
- `POST /api/v1/billing/webhooks/toss`
- `GET /api/v1/credits/balance`
- `GET /api/v1/credits/ledger`
- `POST /api/v1/reports/{id}/exports/pdf`
- `POST /api/v1/reports/{id}/exports/hwpx`

## Security validation

- 다른 workspace_id로 balance 조회 차단
- 다른 workspace_id로 checkout 생성 차단
- 다른 workspace order confirm 차단
- Toss secret key 미설정 시 checkout 503
- payment amount mismatch 시 confirm 409
- webhook 중복 credit 지급 없음

## Business validation

- free trial 중복 지급 없음
- purchase 중복 지급 없음
- report export 중복 차감 없음
- balance는 ledger 합계와 일치
- credit 0이면 final export 실패
