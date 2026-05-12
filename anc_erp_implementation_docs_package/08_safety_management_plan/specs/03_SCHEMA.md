# 03. Schema — 안전관리계획서 자동화

## Primary Models

```text
SafetyManagementPlan, SafetyManagementPlanSection, SafetyManagementRiskItem
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
