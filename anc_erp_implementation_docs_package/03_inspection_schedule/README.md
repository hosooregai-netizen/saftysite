# 03_inspection_schedule — 점검회차/일정 관리

Priority: `P0`

## Trace

- Route: `/projects/[projectId]/inspections`
- Component: `InspectionRoundTable`
- API: `GET /api/v1/projects/{projectId}/inspection-rounds`
- Model: `InspectionSchedule, InspectionRound, OwnerReportTask`
- Prompt: `inspection-schedule-generation`
- Tests: `inspection_tests`
