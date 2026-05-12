# 03. Schema — 웹하드

## Primary Models

```text
Folder, FileAsset, FileVersion, FileLink, ShareLink
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
