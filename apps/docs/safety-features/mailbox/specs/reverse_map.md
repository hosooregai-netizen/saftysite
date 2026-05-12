# Reverse Map: Mailbox

## 1. Feature Routes

| Route | Purpose |
|---|---|
| `/mailbox` | main mailbox workspace |
| `/mail/connect/google` | Google OAuth callback |
| `/mail/connect/naver` | Naver Mail callback placeholder |
| `/mail/connect/naver-works` | Naver Works callback placeholder |

## 2. Frontend File Map

| File | Role |
|---|---|
| `apps/web/app/mailbox/page.tsx` | route entry |
| `apps/web/app/mail/connect/google/page.tsx` | Google callback route |
| `apps/web/features/mailbox/components/MailboxShellScreen.tsx` | stateful mailbox container |
| `MailboxTopbar.tsx` | search, status, sync, compose |
| `MailboxSidebar.tsx` | folder/account navigation |
| `MailboxThreadListPane.tsx` | thread list/search/drafts |
| `MailboxViewerPane.tsx` | message detail/attachments/actions |
| `MailboxComposePanel.tsx` | floating compose |
| `MailboxAppMenuDrawer.tsx` | ERP navigation drawer |
| `MailboxOnboardingState.tsx` | no account onboarding |
| `MailboxIcon.tsx` | local icon set |
| `MailboxShell.module.css` | mailbox shell styling |
| `apps/web/lib/mailboxApi.ts` | high-level API wrapper |
| `apps/web/lib/mail/apiClient.ts` | low-level API client; must exist |
| `apps/web/types/mail.ts` | mailbox TS types; must exist |

## 3. Backend File Map

| File | Role |
|---|---|
| `apps/api/app/main.py` | FastAPI mail routes |
| `apps/api/app/apps_stack.py` | account/OAuth/thread/draft/send/sync orchestration |
| `apps/api/app/mail_google_service.py` | Google token/Gmail API client |
| `apps/api/app/config.py` | OAuth env vars |
| `apps/api/app/models.py` | domain models / common helpers |
| `apps/api/app/store.py` | workspace state/store |

## 4. API to UI Map

| UI Flow | API | Backend |
|---|---|---|
| list accounts | `GET /api/v1/mail/accounts` | `list_mail_accounts` |
| provider status | `GET /api/v1/mail/providers/status` | `_mail_provider_status` |
| OAuth start | `POST /api/v1/mail/accounts/connect/google/start` | `start_mail_oauth` |
| OAuth complete | `POST /api/v1/mail/accounts/connect/google/complete` | `complete_mail_oauth` |
| list threads | `GET /api/v1/mail/threads` | `list_mail_threads` |
| thread detail | `GET /api/v1/mail/threads/{thread_id}` | `get_mail_thread_detail` |
| patch thread | `PATCH /api/v1/mail/threads/{thread_id}` | `update_mail_thread_state` |
| drafts | `/api/v1/mail/drafts` | workspace draft handlers |
| recipient suggestions | `GET /api/v1/mail/recipient-suggestions` | `build_recipient_suggestions` |
| send | `POST /api/v1/mail/send` | `send_mail_message` |
| sync | `POST /api/v1/mail/sync` | `sync_mail_accounts` |

## 5. Schema to UI Map

| Type | UI |
|---|---|
| `MailAccount` | sidebar account rows, topbar account status |
| `MailProviderStatus` | onboarding provider CTA |
| `MailThread` | thread row |
| `MailThreadDetail` | viewer |
| `MailMessage` | viewer message block |
| `MailboxDraft` | drafts list and compose restore |
| `MailRecipientSuggestion` | recipient field autocomplete |
| `MailSyncSummary` | sync snackbar/status |

## 6. Prompt Map

| Prompt | Purpose |
|---|---|
| `01_READ_AND_PLAN.md` | analyze source and produce plan |
| `02_BUILD_READINESS.md` | restore missing source files and clean build |
| `03_IMPLEMENT_GMAIL_OAUTH_SYNC.md` | real OAuth/sync backend |
| `04_IMPLEMENT_THREE_PANE_UI.md` | UI/UX redesign |
| `05_IMPLEMENT_COMPOSE_PANEL.md` | compose panel refinement |
| `06_QA_REGRESSION.md` | build, security, visual QA |
| `07_PROVIDER_EXTENSION.md` | future Naver/Naver Works extension |

## 7. Reverse Procedure

1. Read `feature.md` for scope.
2. Read `code_inventory.md` for current source map.
3. Check `known_issues.md` before implementation.
4. Read `schema.md` and `api_contract.md`.
5. For Gmail work, read `oauth.md` and `gmail_sync.md`.
6. For UI work, read `ui_ux.md` and `compose.md`.
7. Run prompts in order.
8. Validate with `test_scenarios.md` and `validation.md`.
