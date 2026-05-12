# 99 ALL IN ONE FEATURE CONTEXT — 발주자가 고용한 안전보건 전문가 현황

Implement `발주자가 고용한 안전보건 전문가 현황`.

## Trace

- Route: `/hired-safety-expert-forms/[formId]/edit`
- Component: `HiredSafetyExpertTable`
- API: `GET /api/v1/hired-safety-expert-forms/{formId}`
- Models: `HiredSafetyExpertForm`
- Prompt: `hired-safety-expert-summary`
- Tests: `hired_expert_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
