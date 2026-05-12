# Data Flow: Billing & Credits

## 1. Frontend route flow

```text
/billing/checkout
→ BillingCheckoutScreen
→ bootstrapDemoSession
→ isAuthenticatedSession
→ startBillingCheckout
→ window.location.assign(checkoutUrl)

/billing/success
→ BillingSuccessScreen
→ paymentKey/orderId/amount parse
→ confirmBillingPayment
→ /account#billing redirect

/billing/fail
→ BillingFailScreen
→ code/message parse
→ /account#billing redirect

/credits
→ redirect('/account#billing')
```

## 2. API flow

```text
startBillingCheckout()
→ POST /api/v1/billing/checkout
→ require_workspace_access
→ create_billing_order_document
→ toss_post('/v1/payments')
→ save order
→ checkoutUrl 반환
```

```text
confirmBillingPayment()
→ POST /api/v1/billing/confirm
→ get_billing_order
→ amount 검증
→ toss_post('/v1/payments/confirm')
→ order status paid
→ grant_purchase_credits_once
→ ledger balance 반환
```

```text
Toss webhook
→ POST /api/v1/billing/webhooks/toss
→ extract_webhook_payment_fields
→ get_billing_order
→ status 저장
→ DONE이면 grant_purchase_credits_once
```

## 3. Credit ledger flow

```text
grant_workspace_trial
→ add_ledger_entry(type='grant_free_trial', amount=FREE_TRIAL_CREDITS)

purchase
→ add_ledger_entry(type='purchase', amount=package.credits)

export consumption
→ add_ledger_entry(type='consume_export', amount=-1, report_id=report.id)

balance
→ sum(amount) for workspace_id
```

## 4. Report export billing flow

```text
POST /api/v1/reports/{report_id}/exports/{format}
→ review_completed 확인
→ disclaimer 확인
→ create_export
→ ledger_balance >= 1 확인
→ consume_export entry
→ ReportExport 저장
→ report.status='exported'
```

## 5. Cross-feature connection

| Feature | 연결 |
|---|---|
| account-settings | billing package 선택, notice/error 표시 |
| report-workspace | export 시 credit 차감 |
| report-list | export status 표시 |
| auth-workspace | 로그인/워크스페이스 권한 |
