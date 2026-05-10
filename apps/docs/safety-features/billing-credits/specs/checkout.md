# Checkout Spec

## 목적

사용자가 선택한 패키지에 대해 Toss 결제창 URL을 생성하고 외부 결제창으로 이동한다.

## Frontend

```text
BillingCheckoutScreen
→ package query 검증
→ bootstrapDemoSession
→ authenticated 확인
→ startBillingCheckout
→ checkoutUrl 수신
→ window.location.assign(checkoutUrl)
```

## 유효 패키지

```ts
starter-10
team-30
agency-100
```

## 로그인 필요

로그인하지 않은 사용자는 결제창으로 직접 이동하지 않고 account settings로 이동한다.

```text
/account?auth=required&intent=billing&package={packageId}#billing
```

## Backend

```text
billing_checkout
→ require_workspace_access
→ require_toss_configuration
→ package_info = BILLING_PACKAGES[package_id]
→ create_billing_order_document
→ toss_post('/v1/payments')
→ checkout.url 저장
→ order status payment_created
```

## UX 상태

| 상태 | 문구 |
|---|---|
| 준비 중 | 결제창을 준비하고 있습니다. |
| 이동 중 | 토스 결제창으로 이동합니다. |
| 패키지 오류 | 선택한 결제 패키지를 찾을 수 없습니다. |
| 로그인 필요 | 크레딧 결제 전에 Google 로그인이 필요합니다. |
| Toss URL 없음 | 토스 결제창 URL을 받지 못했습니다. |

## 검증

- invalid package는 account로 redirect
- anonymous/local session은 account로 redirect
- checkoutUrl 없으면 error
- order idempotency key는 order id 사용
