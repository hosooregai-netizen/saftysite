# 03. Schema — 안전보건대장 자동화

## Primary Models

```text
SafetyHealthLedger, LedgerRiskItem, LedgerInspectionResult
```

## Common Fields

```ts
type BaseEntity = {
  id: string
  createdAt: string
  updatedAt: string
}

type ScopedFields = {
  projectId?: string
  ownerPartyId?: string
  inspectionRoundId?: string
  bundleId?: string
}
```
