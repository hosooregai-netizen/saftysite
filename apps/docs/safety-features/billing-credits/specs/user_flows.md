# User Flows: Billing & Credits

## 1. Account settings에서 결제 시작

```text
/account#billing
→ 패키지 선택
→ /billing/checkout?package=starter-10
→ session bootstrap
→ 로그인 상태 확인
→ startBillingCheckout()
→ POST /api/v1/billing/checkout
→ Toss checkout URL 수신
→ Toss 결제창 이동
```

## 2. 로그인하지 않은 사용자의 결제 진입

```text
/billing/checkout?package=starter-10
→ bootstrapDemoSession
→ authenticated session 아님
→ /account?auth=required&intent=billing&package=starter-10#billing
→ Google Workspace 로그인 유도
```

## 3. 결제 성공

```text
Toss successUrl
→ /billing/success?paymentKey=&orderId=&amount=
→ confirmBillingPayment()
→ POST /api/v1/billing/confirm
→ Toss confirm API 호출
→ billing order paid
→ credit ledger purchase entry 생성
→ /account?billingNotice=...#billing
```

## 4. 결제 실패

```text
Toss failUrl
→ /billing/fail?code=&message=
→ /account?billingError=...#billing
```

## 5. Toss webhook

```text
Toss webhook
→ POST /api/v1/billing/webhooks/toss
→ orderId/paymentKey/status 추출
→ billing order 조회
→ status DONE이면 grant_purchase_credits_once
→ balance 반환
```

## 6. 보고서 최종 출력 차감

```text
ReportWorkspace
→ review complete
→ export pdf/hwpx
→ POST /api/v1/reports/{id}/exports/pdf or hwpx
→ create_export()
→ final_export_consumed=false면 balance 확인
→ consume_export -1 ledger entry
→ final_export_consumed=true
→ ReportExport 생성
```

## 7. 잔액/이력 조회

```text
/account#billing
→ fetchCreditBalance()
→ GET /api/v1/credits/balance?workspace_id=
→ fetchCreditLedger()
→ GET /api/v1/credits/ledger?workspace_id=
→ balance와 ledger 표시
```
