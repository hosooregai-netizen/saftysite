# Code Inventory: Report List

## Frontend

```text
apps/web/app/reports/page.tsx
apps/web/components/ReportsOverview.tsx
apps/web/lib/reportApi.ts
apps/web/lib/clientPersistence.ts
```

## Related frontend

```text
apps/web/components/ReportWorkspaceScreen.tsx
apps/web/components/ReportWorkspace.tsx
apps/web/app/reports/new/page.tsx
```

## Backend

```text
apps/api/app/main.py
apps/api/app/models.py
apps/api/app/store.py
apps/api/app/apps_stack.py
```

## API endpoints

```text
GET /api/v1/reports
GET /api/v1/safety/reports
GET /api/v1/admin/reports
GET /api/v1/admin/reports/{report_key}/original-pdf
```

## Do not touch

```text
apps/web/.next
apps/api/.venv
__MACOSX
```
