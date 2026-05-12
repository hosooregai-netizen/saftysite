# 03. Schema — 지적사항/조치현황 사진대지

## Primary Models

```text
PhotoLedgerForm, PhotoLedgerEntry, EvidencePhoto
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
