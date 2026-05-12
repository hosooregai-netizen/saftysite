# 08 REVERSE PROMPT — 공사안전보건대장 이행 확인 점검표

Implement `공사안전보건대장 이행 확인 점검표`.

## Trace

- Route: `/inspection-checklist-forms/[formId]/edit`
- Component: `InspectionChecklistTable`
- API: `GET /api/v1/inspection-checklist-forms/{formId}`
- Models: `InspectionChecklistForm, InspectionChecklistResult`
- Prompt: `inspection-checklist-summary`
- Tests: `checklist_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
