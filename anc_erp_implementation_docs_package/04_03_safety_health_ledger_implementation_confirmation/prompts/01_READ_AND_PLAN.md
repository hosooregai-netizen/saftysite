# 01 READ AND PLAN — 공사안전보건대장 이행여부 확인서

Implement `공사안전보건대장 이행여부 확인서`.

## Trace

- Route: `/implementation-confirmation-forms/[formId]/edit`
- Component: `SummaryGroupEditor`
- API: `GET /api/v1/implementation-confirmation-forms/{formId}`
- Models: `ImplementationConfirmationForm`
- Prompt: `implementation-confirmation-draft`
- Tests: `confirmation_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
