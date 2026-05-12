# 03. Schema — 점검회차/일정 관리

## Primary Models

```text
InspectionSchedule, InspectionRound, OwnerReportTask
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
