# Code Map

## Frontend

| Feature | Main files |
|---|---|
| webhard | `apps/web/components/WebhardScreen.tsx`, `apps/web/features/drive/*`, `apps/web/lib/workspaceStorageApi.ts`, `apps/web/lib/webhard/*` |
| mailbox | `apps/web/components/MailboxHubScreen.tsx`, `apps/web/features/mailbox/components/*`, `apps/web/lib/mailboxApi.ts`, `apps/web/lib/mail/apiClient.ts` |
| report-workspace | `apps/web/app/reports/new/page.tsx`, `apps/web/components/ReportWorkspace.tsx`, `apps/web/components/ReportWorkspaceScreen.tsx`, `apps/web/lib/reportApi.ts` |
| report-list | `apps/web/components/ReportsOverview.tsx`, `apps/web/lib/reportApi.ts` |
| headquarters-sites | `apps/web/components/HeadquartersHubScreen.tsx`, `apps/web/components/SitesHubScreen.tsx`, `apps/web/lib/safetyApi/adminEndpoints.ts` |
| photo-album | `apps/web/components/ErpPhotoAlbumScreen.tsx`, `apps/web/features/photos/components/*` |
| account-settings | `apps/web/components/AccountSettingsScreen.tsx`, `apps/web/lib/sessionAuthFlow.ts`, `apps/web/lib/reportApi.ts` |
| billing-credits | `apps/web/components/Billing*`, `apps/web/lib/reportApi.ts` |
| auth-workspace | `apps/web/app/auth/google/callback`, `apps/web/lib/sessionAuthFlow.ts`, `apps/web/lib/safetyApi/authStorage.ts` |

## Backend

| Feature | Main files |
|---|---|
| webhard | `apps/api/app/drive_service.py`, `apps/api/app/main.py`, `apps/api/app/models.py` |
| mailbox | `apps/api/app/apps_stack.py`, `apps/api/app/mail_google_service.py`, `apps/api/app/main.py` |
| report-workspace | `apps/api/app/main.py`, `apps/api/app/services/ai_pipeline.py`, `apps/api/app/services/*report*` |
| headquarters-sites | `apps/api/app/apps_stack.py`, `apps/api/app/main.py` |
| billing-credits | `apps/api/app/services/credits.py`, `apps/api/app/main.py`, `apps/api/app/config.py` |
| auth-workspace | `apps/api/app/main.py`, `apps/api/app/models.py`, `apps/api/app/store.py` |
