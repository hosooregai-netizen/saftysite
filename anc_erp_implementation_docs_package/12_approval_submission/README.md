# 12_approval_submission — 결재/서명/제출

Priority: `P1`

## Trace

- Route: `/submissions/[submissionId]`
- Component: `SubmissionEventTimeline`
- API: `GET /api/v1/submissions/{submissionId}`
- Model: `ApprovalWorkflowInstance, SignatureRequest, Submission, SubmissionEvent`
- Prompt: `approval-submission-advisor`
- Tests: `submission_tests`
