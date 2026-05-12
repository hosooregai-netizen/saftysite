# 03 BACKEND IMPLEMENTATION — 중대재해 관리

Implement `중대재해 관리`.

## Trace

- Route: `/serious-accident-management-forms/[formId]/edit`
- Component: `SeriousAccidentRecordTable`
- API: `GET /api/v1/serious-accident-management-forms/{formId}`
- Models: `SeriousAccidentManagementForm`
- Prompt: `serious-accident-summary`
- Tests: `serious_accident_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
