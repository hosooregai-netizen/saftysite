# 03. Schema — 공사안전보건대장 이행확인 보고서 묶음

## Primary Models

```text
SafetyHealthLedgerReportBundle, DocumentBundle
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
