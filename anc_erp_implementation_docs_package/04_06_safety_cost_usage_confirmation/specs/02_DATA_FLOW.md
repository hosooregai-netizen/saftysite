# 02. Data Flow — 산업안전보건관리비 사용 내용 확인

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
