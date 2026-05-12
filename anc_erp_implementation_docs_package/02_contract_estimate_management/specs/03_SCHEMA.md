# 03. Schema — 계약/견적 관리

## Primary Models

```text
Contract, ContractParty, PaymentTerm, PaymentSplitItem
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
