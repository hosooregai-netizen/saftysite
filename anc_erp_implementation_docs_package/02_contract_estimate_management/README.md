# 02_contract_estimate_management — 계약/견적 관리

Priority: `P0`

## Trace

- Route: `/projects/[projectId]/contracts`
- Component: `ContractTable`
- API: `GET /api/v1/projects/{projectId}/contracts`
- Model: `Contract, ContractParty, PaymentTerm, PaymentSplitItem`
- Prompt: `contract-draft-generation`
- Tests: `contract_tests`
