# 08. Reverse Map — 공사안전보건대장 이행 확인 점검표

| Feature | Route | Component | API | Model | Prompt | Test |
|---|---|---|---|---|---|---|
| 공사안전보건대장 이행 확인 점검표 | `/inspection-checklist-forms/[formId]/edit` | `InspectionChecklistTable` | `GET /api/v1/inspection-checklist-forms/{formId}` | `InspectionChecklistForm, InspectionChecklistResult` | `inspection-checklist-summary` | `checklist_tests` |
