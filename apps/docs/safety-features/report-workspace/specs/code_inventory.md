# Code Inventory: Report Workspace

## Frontend routes

```text
apps/web/app/reports/new/page.tsx
apps/web/app/reports/[reportId]/page.tsx
apps/web/app/reports/page.tsx
```

## Frontend components

```text
apps/web/components/ReportWorkspace.tsx
apps/web/components/ReportWorkspaceScreen.tsx
apps/web/components/ReportWorkspace.module.css
apps/web/components/ReportsOverview.tsx
apps/web/components/GuidedImageDropzone.tsx
apps/web/components/GuidedUploadFlow.module.css
```

## Frontend libs

```text
apps/web/lib/reportApi.ts
apps/web/lib/reportImages.ts
apps/web/lib/reportSessionMapper.ts
apps/web/lib/demoData.ts
apps/web/lib/demoReport.ts
apps/web/lib/clientPersistence.ts
apps/web/lib/sessionAuthFlow.ts
apps/web/lib/api.ts
```

## Backend

```text
apps/api/app/main.py
apps/api/app/models.py
apps/api/app/store.py
apps/api/app/services/ai_pipeline.py
apps/api/app/services/photo_observation_cards.py
apps/api/app/services/standard_report_composer.py
apps/api/app/services/standard_risk_library.py
apps/api/app/services/credits.py
```

## Existing docs

```text
apps/docs/technical-guidance-auto-report/
```

## Do not touch

```text
apps/web/.next
apps/api/.venv
__MACOSX
```
