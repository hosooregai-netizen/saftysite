# 03. Schema — 메일함

## Primary Models

```text
MailAccount, MailThread, MailMessage, MailAttachment, MailDraft
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
