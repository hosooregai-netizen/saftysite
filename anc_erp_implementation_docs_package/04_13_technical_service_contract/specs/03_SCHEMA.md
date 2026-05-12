# 03. Schema — 기술용역계약서 표준서식

## Primary Models

```text
TechnicalServiceContractForm
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
