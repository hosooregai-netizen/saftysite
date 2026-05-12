# 03. Schema — 발주자 참여 현장 안전보건활동

## Primary Models

```text
OwnerSafetyActivityForm
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
