# Billing Entry Spec

## 목적

계정/설정 화면에서 결제 패키지를 선택하고, 인증 완료 후 checkout으로 이어지게 한다.

## 패키지

현재 UI 기준 패키지 예시:

| id | name | amount | credits |
|---|---|---|---|
| free | 무료 시작 | 0원 | 2건 |
| starter-10 | 10건 팩 | 30,000원 | 10건 |
| team-30 | 30건 팩 | 90,000원 | 30건 |
| agency-100 | 100건 팩 | 300,000원 | 100건 |

## Flow

```text
패키지 선택
→ canUseWorkspaceServerApis(session) 확인
→ 로그인 상태면 /billing/checkout?package=
→ 미로그인 상태면 /account?intent=billing&package=
→ Google 로그인
→ callback
→ /billing/checkout?package=
```

## Query params

| Param | 설명 |
|---|---|
| intent=billing | 결제 의도 |
| package | 선택 패키지 id |
| billingNotice | 결제 성공/안내 |
| billingError | 결제 실패 안내 |
| auth=required | 인증 필요 |
| next | 로그인 후 돌아갈 경로 |

## 분리 기준

- Account settings는 결제 진입까지만 관리한다.
- 결제 승인, Toss API, credit ledger는 `billing-credits` 기능에서 상세 관리한다.
