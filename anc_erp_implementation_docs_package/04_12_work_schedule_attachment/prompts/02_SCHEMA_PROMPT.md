# 02 SCHEMA PROMPT — 공사일정 첨부/공정표 첨부

Implement `공사일정 첨부/공정표 첨부`.

## Trace

- Route: `/work-schedule-attachment-forms/[formId]/edit`
- Component: `WorkScheduleHighlightEditor`
- API: `GET /api/v1/work-schedule-attachment-forms/{formId}`
- Models: `WorkScheduleAttachmentForm`
- Prompt: `work-schedule-attachment-summary`
- Tests: `work_schedule_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
