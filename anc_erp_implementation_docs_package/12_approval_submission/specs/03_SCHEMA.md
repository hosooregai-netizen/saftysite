# 03. Schema — 결재/서명/제출

## Primary Models

```text
ApprovalWorkflowInstance, SignatureRequest, Submission, SubmissionEvent
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
