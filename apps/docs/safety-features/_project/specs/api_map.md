# API Registry

이 문서는 Step 16에서 실제 FastAPI endpoint inventory를 반영한 API registry다.

## Actual endpoint inventory

자세한 전체 목록은 `api_endpoint_inventory.md`를 참조한다.

## Group summary

| Group | 기준 |
|---|---|
| health | `/health` |
| auth-workspace | `/api/v1/auth/*`, `/api/v1/workspaces*` |
| billing-credits | `/api/v1/billing/*`, `/api/v1/credits*` |
| report-workspace | `/api/v1/reports/{report_id}/photo*`, `draft*`, `ai-runs`, `review-complete`, `exports*` |
| report-list | `GET /api/v1/reports`, `/api/v1/admin/reports*` |
| headquarters-sites | `/api/v1/safety/*`, `/api/v1/admin/headquarters*`, `/api/v1/admin/sites*` |
| webhard | `/api/v1/drive*`, workspace group/permission/share endpoints |
| mailbox | `/api/v1/mail*` |
| photo-album | `/api/v1/photo*` |
| guest-import | guest/import related endpoints |

## Actual endpoints

| Method | Path | Feature Group |
|---|---|---|
| GET | `/health` | health |
| GET | `/api/v1/mail/drafts` | mailbox |
| POST | `/api/v1/mail/drafts` | mailbox |
| PATCH | `/api/v1/mail/drafts/{draft_id}` | mailbox |
| DELETE | `/api/v1/mail/drafts/{draft_id}` | mailbox |
| POST | `/api/v1/auth/signup` | auth-workspace |
| POST | `/api/v1/auth/login` | auth-workspace |
| POST | `/api/v1/auth/anonymous` | auth-workspace |
| POST | `/api/v1/auth/google/start` | auth-workspace |
| POST | `/api/v1/auth/google/complete` | auth-workspace |
| POST | `/api/v1/auth/claim-anonymous` | auth-workspace |
| GET | `/api/v1/auth/me` | auth-workspace |
| POST | `/api/v1/workspaces` | auth-workspace |
| GET | `/api/v1/workspaces/me` | auth-workspace |
| POST | `/api/v1/workspaces/import-guest-cache` | auth-workspace |
| GET | `/api/v1/photo-album` | photo-album |
| POST | `/api/v1/photo-album` | photo-album |
| PATCH | `/api/v1/photo-album/{item_id}` | photo-album |
| DELETE | `/api/v1/photo-album/{item_id}` | photo-album |
| GET | `/api/v1/drive/items` | webhard |
| POST | `/api/v1/drive/items` | webhard |
| PATCH | `/api/v1/drive/items/{item_id}` | webhard |
| DELETE | `/api/v1/drive/items/{item_id}` | webhard |
| GET | `/api/v1/drive/items/{item_id}/permissions` | webhard |
| POST | `/api/v1/drive/items/{item_id}/permissions` | webhard |
| PATCH | `/api/v1/drive/permissions/{permission_id}` | webhard |
| POST | `/api/v1/drive/items/{item_id}/transfer-owner` | webhard |
| DELETE | `/api/v1/drive/permissions/{permission_id}` | webhard |
| GET | `/api/v1/drive/groups` | webhard |
| POST | `/api/v1/drive/groups` | webhard |
| PATCH | `/api/v1/drive/groups/{group_id}` | webhard |
| DELETE | `/api/v1/drive/groups/{group_id}` | webhard |
| POST | `/api/v1/drive/groups/{group_id}/members` | webhard |
| DELETE | `/api/v1/drive/groups/{group_id}/members/{member_id}` | webhard |
| GET | `/api/v1/drive/shares` | webhard |
| POST | `/api/v1/drive/shares` | webhard |
| PATCH | `/api/v1/drive/shares/{share_id}` | webhard |
| DELETE | `/api/v1/drive/shares/{share_id}` | webhard |
| GET | `/api/v1/drive/shares/{token}` | webhard |
| GET | `/api/v1/drive/shares/{token}/items` | webhard |
| GET | `/api/v1/drive/shares/{token}/items/{item_id}` | webhard |
| POST | `/api/v1/billing/checkout` | billing-credits |
| POST | `/api/v1/billing/confirm` | billing-credits |
| POST | `/api/v1/billing/webhooks/toss` | billing-credits |
| GET | `/api/v1/credits/balance` | billing-credits |
| GET | `/api/v1/credits/ledger` | billing-credits |
| GET | `/api/v1/reports` | report-list / report-workspace |
| POST | `/api/v1/reports` | report-list / report-workspace |
| GET | `/api/v1/reports/{report_id}` | report-list / report-workspace |
| PATCH | `/api/v1/reports/{report_id}` | report-list / report-workspace |
| POST | `/api/v1/reports/{report_id}/photos` | report-workspace |
| POST | `/api/v1/reports/{report_id}/photo-steps/step-1` | report-workspace |
| POST | `/api/v1/reports/{report_id}/photo-steps/step-2` | report-workspace |
| POST | `/api/v1/reports/{report_id}/photo-steps/step-3` | report-workspace |
| POST | `/api/v1/reports/{report_id}/photo-steps/step-4` | report-workspace |
| POST | `/api/v1/reports/{report_id}/photo-steps/step-5` | report-workspace |
| POST | `/api/v1/reports/{report_id}/photo-steps/review` | report-workspace |
| POST | `/api/v1/reports/{report_id}/draft-from-photos` | report-workspace |
| POST | `/api/v1/reports/{report_id}/draft-from-guided-photos` | report-workspace |
| GET | `/api/v1/reports/{report_id}/ai-runs/{run_id}` | report-workspace |
| POST | `/api/v1/reports/{report_id}/review-complete` | report-workspace |
| POST | `/api/v1/reports/{report_id}/exports/pdf` | report-workspace / billing-credits |
| POST | `/api/v1/reports/{report_id}/exports/hwpx` | report-workspace / billing-credits |
| GET | `/api/v1/reports/{report_id}/exports` | report-workspace / billing-credits |
| POST | `/api/v1/safety/auth/token` | headquarters-sites |
| GET | `/api/v1/safety/auth/me` | headquarters-sites |
| GET | `/api/v1/safety/users` | headquarters-sites |
| GET | `/api/v1/safety/headquarters` | headquarters-sites |
| POST | `/api/v1/safety/headquarters` | headquarters-sites |
| PATCH | `/api/v1/safety/headquarters/{headquarter_id}` | headquarters-sites |
| DELETE | `/api/v1/safety/headquarters/{headquarter_id}` | headquarters-sites |
| GET | `/api/v1/safety/sites` | headquarters-sites |
| POST | `/api/v1/safety/sites` | headquarters-sites |
| GET | `/api/v1/safety/sites/{site_id}` | headquarters-sites |
| PATCH | `/api/v1/safety/sites/{site_id}` | headquarters-sites |
| DELETE | `/api/v1/safety/sites/{site_id}` | headquarters-sites |
| GET | `/api/v1/safety/assignments` | headquarters-sites |
| POST | `/api/v1/safety/assignments` | headquarters-sites |
| PATCH | `/api/v1/safety/assignments/{assignment_id}` | headquarters-sites |
| DELETE | `/api/v1/safety/assignments/{assignment_id}` | headquarters-sites |
| GET | `/api/v1/safety/headquarter-assignments` | headquarters-sites |
| POST | `/api/v1/safety/headquarter-assignments` | headquarters-sites |
| PATCH | `/api/v1/safety/headquarter-assignments/{assignment_id}` | headquarters-sites |
| DELETE | `/api/v1/safety/headquarter-assignments/{assignment_id}` | headquarters-sites |
| GET | `/api/v1/safety/assignments/me/sites` | headquarters-sites |
| GET | `/api/v1/safety/headquarter-assignments/me` | headquarters-sites |
| GET | `/api/v1/safety/content-items` | headquarters-sites |
| GET | `/api/v1/safety/reports` | headquarters-sites |
| GET | `/api/v1/admin/headquarters/list` | headquarters-sites |
| GET | `/api/v1/admin/sites/list` | headquarters-sites |
| GET | `/api/v1/admin/sites/{site_id}` | headquarters-sites |
| GET | `/api/v1/admin/users/list` | other |
| GET | `/api/v1/admin/directory/assignments` | other |
| GET | `/api/v1/admin/reports` | report-list |
| GET | `/api/v1/admin/reports/{report_key}/original-pdf` | report-list |
| GET | `/api/v1/mail/accounts` | mailbox |
| GET | `/api/v1/mail/providers/status` | mailbox |
| POST | `/api/v1/mail/accounts/connect/{provider}/start` | mailbox |
| POST | `/api/v1/mail/accounts/connect/{provider}/complete` | mailbox |
| DELETE | `/api/v1/mail/accounts/{account_id}` | mailbox |
| GET | `/api/v1/mail/threads` | mailbox |
| GET | `/api/v1/mail/threads/{thread_id}` | mailbox |
| PATCH | `/api/v1/mail/threads/{thread_id}` | mailbox |
| GET | `/api/v1/mail/messages/{message_id}` | mailbox |
| GET | `/api/v1/mail/recipient-suggestions` | mailbox |
| POST | `/api/v1/mail/send` | mailbox |
| POST | `/api/v1/mail/send-report` | mailbox |
| POST | `/api/v1/mail/prepare-report` | mailbox |
| POST | `/api/v1/mail/sync` | mailbox |
