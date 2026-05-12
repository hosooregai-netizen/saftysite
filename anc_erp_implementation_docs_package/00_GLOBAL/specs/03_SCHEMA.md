# 03. Schema — 통합 제품/기술/디자인/Reverse Map

## Primary Models

```text
GlobalModelCatalog
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
