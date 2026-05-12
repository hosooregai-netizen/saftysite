# 03. Schema — 공사일정 첨부/공정표 첨부

## Primary Models

```text
WorkScheduleAttachmentForm
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
