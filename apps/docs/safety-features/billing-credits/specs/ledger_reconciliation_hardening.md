# Credit Ledger Reconciliation

## Balance

```text
balance = sum(entries.amount where workspace_id = current workspace)
```

## Ledger types

- `grant_free_trial`
- `purchase`
- `consume_export`
- `adjustment`
- `refund`

## QA

- purchase 후 balance 증가
- export 후 balance 감소
- same report 재출력 balance 유지
- ledger sum과 API balance 일치
