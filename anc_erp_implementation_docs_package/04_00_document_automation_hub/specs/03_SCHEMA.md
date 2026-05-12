# 03. Schema — 표준서식 자동화 허브

## Primary Models

```text
DocumentBundle, StandardFormDefinition, StandardFormInstance
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
