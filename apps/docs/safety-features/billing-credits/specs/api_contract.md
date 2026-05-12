# API Contract: Billing & Credits

## `POST /api/v1/billing/checkout`

Toss 결제창을 생성한다.

Request:

```json
{
  "workspace_id": "workspace_x",
  "package_id": "starter-10"
}
```

Response:

```json
{
  "checkoutUrl": "https://...",
  "orderId": "order_x",
  "workspaceId": "workspace_x",
  "package": {
    "amount_krw": 10000,
    "credits": 10
  }
}
```

Errors:

| 상태 | 설명 |
|---|---|
| 401 | 로그인 필요 |
| 403/404 | workspace 접근 권한 없음 |
| 422 | package_id invalid |
| 503 | Toss secret key 미설정 |
| 502 | Toss payment create 실패 |

## `POST /api/v1/billing/confirm`

Toss 결제 성공 callback을 확인하고 credit을 지급한다.

Request:

```json
{
  "payment_key": "pay_x",
  "order_id": "order_x",
  "amount": 10000
}
```

Response:

```json
{
  "ok": true,
  "order": {},
  "balance": 12
}
```

Errors:

| 상태 | 설명 |
|---|---|
| 404 | 주문 없음 |
| 409 | 금액 불일치 |
| 502 | Toss confirm 실패 |

## `POST /api/v1/billing/webhooks/toss`

Toss webhook을 수신한다.

Request:

```json
{
  "eventType": "PAYMENT_STATUS_CHANGED",
  "createdAt": "...",
  "data": {
    "orderId": "order_x",
    "paymentKey": "pay_x",
    "status": "DONE"
  }
}
```

Response:

```json
{
  "ok": true,
  "order": {},
  "balance": 12
}
```

## `GET /api/v1/credits/balance?workspace_id=...`

Response:

```json
{
  "workspaceId": "workspace_x",
  "balance": 12
}
```

## `GET /api/v1/credits/ledger?workspace_id=...`

Response:

```json
[
  {
    "id": "ledger_x",
    "workspace_id": "workspace_x",
    "type": "purchase",
    "amount": 10,
    "description": "starter-10 결제 완료",
    "source_order_id": "order_x",
    "source_payment_key": "pay_x",
    "created_at": "..."
  }
]
```

## Report export APIs

과금은 report-workspace export API 안에서 수행된다.

```text
POST /api/v1/reports/{report_id}/exports/pdf
POST /api/v1/reports/{report_id}/exports/hwpx
```

Credit 부족 시:

```json
{
  "detail": "Insufficient credits."
}
```

status: `402`
