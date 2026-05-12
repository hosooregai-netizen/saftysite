# Billing Reconciliation Operations

## Daily checks

- Toss paid orders vs BillingOrder
- BillingOrder vs CreditLedgerEntry purchase
- ReportExport first_charge_applied vs consume_export ledger
- workspace balance = ledger sum

## Anomaly examples

| Anomaly | Severity |
|---|---|
| payment success with no credit | P1 |
| duplicate credit for same paymentKey | P0 |
| report export without consume_export when first export | P1 |
| same report charged twice | P0 |
| negative balance unexpected | P1 |

## Reconciliation query fields

- workspaceId
- orderId
- paymentKey
- packageId
- reportId
- ledger type
- amount
- createdAt
