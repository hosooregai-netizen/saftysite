# Known Issues: Billing & Credits

## 1. Webhook signature validation

현재 문서 기준으로 Toss webhook 서명 검증이 명시되어 있지 않다. 운영에서는 webhook secret/signature 또는 IP allowlist 검증이 필요하다.

## 2. Billing order unique constraints

`order.credit_granted`로 중복 지급을 막지만, 운영 DB에서는 `source_order_id` 또는 `source_payment_key` unique constraint를 추가하는 것이 안전하다.

## 3. Checkout amount/package source of truth

frontend package id validation과 backend BILLING_PACKAGES가 다르면 결제 오류가 발생할 수 있다. backend를 source of truth로 하고 frontend package list는 API에서 가져오는 구조가 이상적이다.

## 4. Report export billing policy

현재 기준은 보고서별 최초 final export 1회 차감이다. PDF와 HWPX 각각 차감할지 여부가 바뀌면 `report_export_billing.md`와 `create_export`를 함께 수정해야 한다.

## 5. Refund/cancel not implemented

환불/결제취소/credit 회수 정책은 현재 범위 밖이다. 추후 `refund.md`를 추가해야 한다.

## 6. Toss checkout endpoint

현재 backend는 Toss `/v1/payments`로 payment create를 시도한다. 실제 운영 Toss Payments API 계약과 checkout 생성 방식은 배포 전 최신 Toss 문서와 샌드박스에서 검증해야 한다.
