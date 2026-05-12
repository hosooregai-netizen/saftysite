# 04 FRONTEND IMPLEMENTATION — 발주자 참여 현장 안전보건활동

Implement `발주자 참여 현장 안전보건활동`.

## Trace

- Route: `/owner-safety-activity-forms/[formId]/edit`
- Component: `OwnerSafetyActivityTable`
- API: `GET /api/v1/owner-safety-activity-forms/{formId}`
- Models: `OwnerSafetyActivityForm`
- Prompt: `owner-safety-activity-summary`
- Tests: `owner_activity_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
