# 03. Schema — 공사개요 및 연락망/총괄현황

## Primary Models

```text
ProjectSummaryContactBookForm
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
