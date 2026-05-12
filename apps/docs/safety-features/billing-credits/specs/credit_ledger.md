# Credit Ledger Spec

## 목적

workspace별 크레딧 잔액과 모든 지급/사용 이력을 추적한다.

## Ledger 원칙

- ledger는 append-only에 가깝게 관리한다.
- balance는 `amount` 합계로 계산한다.
- positive amount는 지급/구매다.
- negative amount는 사용/차감이다.
- workspace_id는 필수다.

## Entry types

| type | amount | 설명 |
|---|---:|---|
| `grant_free_trial` | +N | 신규 workspace 무료 체험 지급 |
| `purchase` | +N | 결제 완료 후 credit 지급 |
| `consume_export` | -1 | 보고서 최초 final export 차감 |

## Functions

```text
ledger_balance(workspace_id)
→ app_credit_ledger에서 workspace_id 기준 amount 합계

list_ledger_entries(workspace_id)
→ created_at desc

add_ledger_entry(...)
→ entry 생성 후 저장

grant_workspace_trial(workspace_id)
→ grant_free_trial entry가 없을 때만 지급
```

## 중복 방지

| 상황 | 방지 기준 |
|---|---|
| free trial 중복 | workspace_id + type='grant_free_trial' 존재 확인 |
| purchase 중복 | order.credit_granted |
| report export 중복 | report.final_export_consumed |

## 표시 기준

Ledger UI에는 다음을 표시한다.

- 일시
- 유형
- 설명
- 금액 +/-
- 관련 report id
- 관련 order id
- 결제 key 일부 masked 표시

## Known concern

현재 `source_order_id` unique index가 명시되지 않은 경우, 데이터베이스 레벨 중복 방지는 약할 수 있다. 운영 DB에서는 unique constraint 또는 idempotency table을 고려한다.
