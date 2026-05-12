# 03. Schema — 위험성 감소대책 이행확인

## Primary Models

```text
RiskReductionImplementationForm, RiskReductionItem
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
