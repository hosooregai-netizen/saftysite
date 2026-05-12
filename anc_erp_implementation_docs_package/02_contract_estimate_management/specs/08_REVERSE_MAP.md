# 08. Reverse Map — 계약/견적 관리

| Feature | Route | Component | API | Model | Prompt | Test |
|---|---|---|---|---|---|---|
| 계약/견적 관리 | `/projects/[projectId]/contracts` | `ContractTable` | `GET /api/v1/projects/{projectId}/contracts` | `Contract, ContractParty, PaymentTerm, PaymentSplitItem` | `contract-draft-generation` | `contract_tests` |
