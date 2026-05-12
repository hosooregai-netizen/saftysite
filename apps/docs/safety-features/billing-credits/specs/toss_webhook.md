# Toss Webhook Spec

## 목적

Toss webhook 재전송이나 success callback과 webhook 순서 차이에도 credit 지급이 정확히 1회만 일어나도록 한다.

## Endpoint

```text
POST /api/v1/billing/webhooks/toss
```

## 처리 흐름

```text
payload 수신
→ extract_webhook_payment_fields
→ orderId 없으면 ignored
→ order 조회
→ order 없으면 ignored
→ webhook_payload 저장
→ payment_key 저장
→ status 저장
→ status DONE이면 grant_purchase_credits_once
```

## 상태 mapping

| Toss status | 내부 status |
|---|---|
| DONE | paid |
| CANCELED | canceled |
| ABORTED | aborted |
| WAITING_FOR_DEPOSIT | waiting_for_deposit |
| 기타 | lowercase(status) |

## Idempotency

`grant_purchase_credits_once`는 아래 조건으로 중복 지급을 막는다.

```text
if order.credit_granted:
  return order
```

## 보안 고려사항

현재 문서 기준으로는 webhook signature 검증이 명시되어 있지 않다. 실제 운영에서는 Toss webhook 서명 검증 또는 IP/secret 검증 정책을 추가해야 한다.

## 검증

- DONE webhook 1회 → purchase ledger 1개
- DONE webhook 2회 → purchase ledger 여전히 1개
- success confirm 후 DONE webhook → 중복 지급 없음
- order 없는 webhook → ignored
- orderId 없는 webhook → ignored
