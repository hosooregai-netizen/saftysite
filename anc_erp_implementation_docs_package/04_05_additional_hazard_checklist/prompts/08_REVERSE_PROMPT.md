# 08 REVERSE PROMPT — 추가 유해·위험요인 점검리스트

Implement `추가 유해·위험요인 점검리스트`.

## Trace

- Route: `/additional-hazard-forms/[formId]/edit`
- Component: `AdditionalHazardItemTable`
- API: `GET /api/v1/additional-hazard-forms/{formId}`
- Models: `AdditionalHazardForm, AdditionalHazardItem`
- Prompt: `additional-hazard-summary`
- Tests: `additional_hazard_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
