# Account Entry Spec

## 목적

`account-settings` 기능에서 billing-credits로 진입하는 UI와 query state를 정의한다.

## 진입 경로

```text
/account#billing
/account?billingNotice=...#billing
/account?billingError=...#billing
/account?auth=required&intent=billing&package=starter-10#billing
```

## 상태

| Query | 의미 |
|---|---|
| `billingNotice` | 결제 성공/잔액 안내 |
| `billingError` | 결제 실패/준비 실패 안내 |
| `auth=required` | 결제 전 로그인 필요 |
| `intent=billing` | 로그인 후 billing intent 복원 |
| `package` | 사용자가 선택한 package id |

## Credits redirect

```text
/credits
→ /account#billing
```

## 책임 분리

- account-settings: billing section UI, package CTA, notice/error 표시
- billing-credits: checkout/confirm/webhook/ledger/report export billing
- report-workspace: 실제 export 액션과 차감 trigger
