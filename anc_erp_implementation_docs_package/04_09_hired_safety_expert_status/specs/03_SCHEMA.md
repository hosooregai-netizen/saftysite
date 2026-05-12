# 03. Schema — 발주자가 고용한 안전보건 전문가 현황

## Primary Models

```text
HiredSafetyExpertForm
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
