# Reverse Registry

## Reverse flow template

```text
Feature
→ Route
→ Frontend component
→ Frontend API client
→ Backend route/service
→ Schema/model
→ Design pattern
→ Prompt
→ QA scenario
```

## Feature reverse map

| Feature | Route | Frontend | Backend | Schema | Prompt |
|---|---|---|---|---|---|
| webhard | `/webhard`, `/share/[token]` | `features/drive/*`, `WebhardScreen` | `drive_service.py`, `main.py` | `DriveItem`, `DriveShare`, `DrivePermission` | `webhard/prompts/*` |
| mailbox | `/mailbox`, `/mail/connect/*` | `features/mailbox/*`, `MailboxHubScreen` | `apps_stack.py`, `mail_google_service.py` | `MailAccount`, `MailThread`, `MailboxDraft` | `mailbox/prompts/*` |
| report-workspace | `/reports/new`, `/reports/[id]` | `ReportWorkspace`, `ReportWorkspaceScreen` | `main.py`, `services/ai_pipeline.py` | `ReportRecord`, `ReportPayload`, `AiRun` | `report-workspace/prompts/*` |
| report-list | `/reports` | `ReportsOverview` | `GET /api/v1/reports` | `ReportRecord`, `ReportExport` | `report-list/prompts/*` |
| headquarters-sites | `/headquarters`, `/sites` | `HeadquartersHubScreen`, `SitesHubScreen` | `apps_stack.py` | `SafetyHeadquarter`, `SafetySite`, `Assignment` | `headquarters-sites/prompts/*` |
| photo-album | `/photo-album` | `ErpPhotoAlbumScreen`, `PhotoAlbumPanel` | `photo-album` API | `PhotoAlbumItem` | `photo-album/prompts/*` |
| account-settings | `/account` | `AccountSettingsScreen` | auth/workspace APIs | `DemoSession`, `Workspace` | `account-settings/prompts/*` |
| billing-credits | `/billing/*`, `/credits` | billing screens | billing/credits APIs | `BillingOrder`, `CreditLedgerEntry` | `billing-credits/prompts/*` |
| auth-workspace | `/auth/*`, auth APIs | session helpers | auth/workspace APIs | `User`, `Workspace`, `Membership` | `auth-workspace/prompts/*` |

## 리버스 절차

1. `_registry/feature_registry.md`에서 기능 slug를 찾는다.
2. `_registry/route_registry.md`에서 route를 확인한다.
3. 기능 `specs/reverse_map.md`에서 파일/API/schema를 확인한다.
4. 기능 `specs/schema.md`와 `api_contract.md`를 읽는다.
5. 기능 `prompts/01_READ_AND_PLAN.md`를 실행한다.
6. 필요한 구현 프롬프트를 순서대로 실행한다.
7. 기능 `test_scenarios.md`와 `_project/specs/docs_qa_checklist.md`로 검증한다.
