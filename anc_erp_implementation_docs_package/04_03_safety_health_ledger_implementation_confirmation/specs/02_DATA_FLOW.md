# 02. Data Flow — 공사안전보건대장 이행여부 확인서

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
