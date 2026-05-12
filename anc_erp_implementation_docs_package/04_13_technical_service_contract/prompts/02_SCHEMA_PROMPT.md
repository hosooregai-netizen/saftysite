# 02 SCHEMA PROMPT — 기술용역계약서 표준서식

Implement `기술용역계약서 표준서식`.

## Trace

- Route: `/technical-service-contract-forms/[formId]`
- Component: `ContractA4Preview`
- API: `GET /api/v1/technical-service-contract-forms/{formId}`
- Models: `TechnicalServiceContractForm`
- Prompt: `technical-service-contract-draft`
- Tests: `technical_contract_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
