# 03. Schema — 공사안전보건대장 이행 확인 점검표

## Primary Models

```text
InspectionChecklistForm, InspectionChecklistResult
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
