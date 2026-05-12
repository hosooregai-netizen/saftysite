# 02. Data Flow — 대시보드/통계

```text
Project
→ ProjectParty
→ InspectionRound
→ OwnerReportTask
→ DocumentBundle / Business Entity
→ StandardFormInstance / FileAsset / MailThread / Submission
→ Dashboard
```

## 상태 전이

```text
draft → input_required → editing → review → confirmed → exported → submitted
```
