# Data Flow: Report Workspace

## 1. Route to component

```text
/reports/new
→ apps/web/app/reports/new/page.tsx
→ Guided upload/new report flow

/reports/[reportId]
→ apps/web/app/reports/[reportId]/page.tsx
→ ReportWorkspaceScreen
→ ReportWorkspace

/reports
→ apps/web/app/reports/page.tsx
→ ReportsOverview
```

## 2. New report flow

```text
UI 입력
→ createReportRecord()
→ POST /api/v1/reports
→ ReportRecord 생성
→ uploadGuidedStepPhotos()
→ POST /api/v1/reports/{id}/photo-steps/step-N
→ Guided bucket 저장
→ generateDraftFromGuidedPhotos()
→ POST /api/v1/reports/{id}/draft-from-guided-photos
→ AiRun + ReportRecord 갱신
```

## 3. Review flow

```text
ReportWorkspaceScreen
→ bootstrapReportSession()
→ getReportRecord()
→ GET /api/v1/reports/{id}
→ ReportWorkspace state 초기화
→ patchReportRecord()
→ PATCH /api/v1/reports/{id}
→ review-complete
→ POST /api/v1/reports/{id}/review-complete
```

## 4. Export flow

```text
ReportWorkspace
→ confirm review/disclaimer
→ registerReportExport()
→ POST /api/v1/reports/{id}/exports/pdf or hwpx
→ ReportExport 생성
→ credit ledger 갱신
→ fetchInspectionPdfDocument / fetchInspectionHwpxDocument
→ file download
```

## 5. Backend service flow

```text
main.py routes
→ store reports/photos/ai_runs/exports
→ services.ai_pipeline
→ photo_observation_cards
→ standard_risk_library
→ standard_report_composer
→ export response
```

## 6. Existing documentation flow

```text
technical-guidance-auto-report/01_step_site_schedule_seed.md
→ site/schedule seed

technical-guidance-auto-report/02_step_minimal_photo_upload.md
→ minimal photo upload

technical-guidance-auto-report/03_step_photo_observation_card.md
→ photo observation card

technical-guidance-auto-report/04_step_risk_library_matching.md
→ risk library matching

technical-guidance-auto-report/05_step_section_composer.md
→ section composer

technical-guidance-auto-report/06_step_review_validation.md
→ review validation

technical-guidance-auto-report/07_step_render_export_dispatch.md
→ render/export/dispatch
```
