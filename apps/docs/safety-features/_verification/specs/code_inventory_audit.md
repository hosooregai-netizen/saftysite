# Code Inventory Audit

스캔 기준: `apps(3).zip`

## Feature file status

| Feature | Source path | Status |
|---|---|---|
| webhard | `apps/web/app/webhard/page.tsx` | OK |
| webhard | `apps/web/components/WebhardScreen.tsx` | OK |
| webhard | `apps/web/features/drive/` | OK |
| webhard | `apps/web/app/share/[token]/page.tsx` | OK |
| webhard | `apps/api/app/drive_service.py` | OK |
| mailbox | `apps/web/app/mailbox/page.tsx` | OK |
| mailbox | `apps/web/components/MailboxHubScreen.tsx` | OK |
| mailbox | `apps/web/features/mailbox/components/MailboxShellScreen.tsx` | OK |
| mailbox | `apps/web/lib/mailboxApi.ts` | OK |
| mailbox | `apps/api/app/apps_stack.py` | OK |
| mailbox | `apps/api/app/mail_google_service.py` | OK |
| report-workspace | `apps/web/app/reports/new/page.tsx` | OK |
| report-workspace | `apps/web/app/reports/[reportId]/page.tsx` | OK |
| report-workspace | `apps/web/components/ReportWorkspace.tsx` | OK |
| report-workspace | `apps/web/components/ReportWorkspaceScreen.tsx` | OK |
| report-workspace | `apps/api/app/services/ai_pipeline.py` | OK |
| report-list | `apps/web/app/reports/page.tsx` | OK |
| report-list | `apps/web/components/ReportsOverview.tsx` | OK |
| report-list | `apps/web/lib/reportApi.ts` | OK |
| headquarters-sites | `apps/web/app/headquarters/page.tsx` | OK |
| headquarters-sites | `apps/web/app/sites/page.tsx` | OK |
| headquarters-sites | `apps/web/components/HeadquartersHubScreen.tsx` | OK |
| headquarters-sites | `apps/web/components/SitesHubScreen.tsx` | OK |
| photo-album | `apps/web/app/photo-album/page.tsx` | OK |
| photo-album | `apps/web/components/ErpPhotoAlbumScreen.tsx` | OK |
| account-settings | `apps/web/app/account/page.tsx` | OK |
| account-settings | `apps/web/components/AccountSettingsScreen.tsx` | OK |
| billing-credits | `apps/web/app/billing/checkout/page.tsx` | OK |
| billing-credits | `apps/web/app/billing/success/page.tsx` | OK |
| billing-credits | `apps/web/app/billing/fail/page.tsx` | OK |
| billing-credits | `apps/web/app/credits/page.tsx` | OK |
| auth-workspace | `apps/web/app/auth/google/callback/page.tsx` | OK |
| auth-workspace | `apps/web/lib/sessionAuthFlow.ts` | OK |
| auth-workspace | `apps/api/app/main.py` | OK |

## 해석

- 핵심 route/component/backend 파일은 대부분 존재한다.
- 그러나 mailbox/photo-album/headquarters-sites가 참조하는 일부 shared source/type 파일이 누락되어 있다.
- 문서의 `code_inventory.md`는 이 실제 존재 여부를 기준으로 업데이트해야 한다.
