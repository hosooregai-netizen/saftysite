# 03. Schema — 추가 유해·위험요인 점검리스트

## Primary Models

```text
AdditionalHazardForm, AdditionalHazardItem
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
