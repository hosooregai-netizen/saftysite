# 02. Data Flow — 지적사항/조치현황 사진대지

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
