# 08. Reverse Map — 점검회차/일정 관리

| Feature | Route | Component | API | Model | Prompt | Test |
|---|---|---|---|---|---|---|
| 점검회차/일정 관리 | `/projects/[projectId]/inspections` | `InspectionRoundTable` | `GET /api/v1/projects/{projectId}/inspection-rounds` | `InspectionSchedule, InspectionRound, OwnerReportTask` | `inspection-schedule-generation` | `inspection_tests` |
