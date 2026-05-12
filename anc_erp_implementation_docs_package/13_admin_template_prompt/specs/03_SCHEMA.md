# 03. Schema — 관리자/템플릿/프롬프트

## Primary Models

```text
DocumentTemplate, PromptTemplate, ChecklistTemplate, LegalTextTemplate, AdminAuditLog
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
