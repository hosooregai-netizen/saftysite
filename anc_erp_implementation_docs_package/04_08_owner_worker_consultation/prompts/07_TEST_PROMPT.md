# 07 TEST PROMPT — 발주자의 근로자 상담

Implement `발주자의 근로자 상담`.

## Trace

- Route: `/worker-consultation-forms/[formId]/edit`
- Component: `WorkerConsultationTable`
- API: `GET /api/v1/worker-consultation-forms/{formId}`
- Models: `WorkerConsultationForm`
- Prompt: `worker-consultation-summary`
- Tests: `worker_consultation_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
