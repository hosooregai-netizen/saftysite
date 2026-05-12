# 03 BACKEND IMPLEMENTATION — 계약/견적 관리

Implement `계약/견적 관리`.

## Trace

- Route: `/projects/[projectId]/contracts`
- Component: `ContractTable`
- API: `GET /api/v1/projects/{projectId}/contracts`
- Models: `Contract, ContractParty, PaymentTerm, PaymentSplitItem`
- Prompt: `contract-draft-generation`
- Tests: `contract_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
