# 03. Schema — 프로젝트/현장 원장 관리

## Primary Models

```text
Project, Organization, ProjectParty, Contact
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
