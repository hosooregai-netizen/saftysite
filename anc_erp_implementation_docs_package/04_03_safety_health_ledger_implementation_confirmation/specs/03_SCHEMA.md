# 03. Schema — 공사안전보건대장 이행여부 확인서

## Primary Models

```text
ImplementationConfirmationForm
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
