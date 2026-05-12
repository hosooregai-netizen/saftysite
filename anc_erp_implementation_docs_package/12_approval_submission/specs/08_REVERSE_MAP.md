# 08. Reverse Map — 결재/서명/제출

| Feature | Route | Component | API | Model | Prompt | Test |
|---|---|---|---|---|---|---|
| 결재/서명/제출 | `/submissions/[submissionId]` | `SubmissionEventTimeline` | `GET /api/v1/submissions/{submissionId}` | `ApprovalWorkflowInstance, SignatureRequest, Submission, SubmissionEvent` | `approval-submission-advisor` | `submission_tests` |
