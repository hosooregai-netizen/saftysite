# Toss Confirm & Webhook Idempotency

success confirm과 webhook이 중복 호출되어도 credit이 중복 지급되지 않게 한다.

## Idempotency key

- `paymentKey`
- `orderId`
- `workspaceId + packageId + paymentKey`

## QA

- confirm 2회 호출
- webhook 2회 호출
- confirm 후 webhook
- webhook 후 confirm
- 실패 payment webhook
- 잘못된 orderId
