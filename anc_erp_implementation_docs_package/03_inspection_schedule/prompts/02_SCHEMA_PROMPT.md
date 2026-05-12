# 02 SCHEMA PROMPT — 점검회차/일정 관리

Implement `점검회차/일정 관리`.

## Trace

- Route: `/projects/[projectId]/inspections`
- Component: `InspectionRoundTable`
- API: `GET /api/v1/projects/{projectId}/inspection-rounds`
- Models: `InspectionSchedule, InspectionRound, OwnerReportTask`
- Prompt: `inspection-schedule-generation`
- Tests: `inspection_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
