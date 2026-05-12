# 99 ALL IN ONE FEATURE CONTEXT — 결재/서명/제출

Implement `결재/서명/제출`.

## Trace

- Route: `/submissions/[submissionId]`
- Component: `SubmissionEventTimeline`
- API: `GET /api/v1/submissions/{submissionId}`
- Models: `ApprovalWorkflowInstance, SignatureRequest, Submission, SubmissionEvent`
- Prompt: `approval-submission-advisor`
- Tests: `submission_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
