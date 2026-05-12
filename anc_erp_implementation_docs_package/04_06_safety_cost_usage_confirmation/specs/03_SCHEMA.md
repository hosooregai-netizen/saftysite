# 03. Schema — 산업안전보건관리비 사용 내용 확인

## Primary Models

```text
SafetyCostUsageConfirmationForm
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
