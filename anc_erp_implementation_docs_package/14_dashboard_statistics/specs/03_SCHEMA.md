# 03. Schema — 대시보드/통계

## Primary Models

```text
DashboardMetricSnapshot, DashboardAlert, MetricDrilldownResult
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
