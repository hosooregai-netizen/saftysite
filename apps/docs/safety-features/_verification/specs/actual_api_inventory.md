# Actual FastAPI Endpoint Inventory

스캔 기준: `apps/api/app/main.py` in `apps(3).zip`

## Summary

| 항목 | 개수 |
|---|---:|
| FastAPI decorators | 109 |

## Actual endpoints

| Method | Path |
|---|---|
| GET | `/health` |
| GET | `/api/v1/mail/drafts` |
| POST | `/api/v1/mail/drafts` |
| PATCH | `/api/v1/mail/drafts/{draft_id}` |
| DELETE | `/api/v1/mail/drafts/{draft_id}` |
| POST | `/api/v1/auth/signup` |
| POST | `/api/v1/auth/login` |
| POST | `/api/v1/auth/anonymous` |
| POST | `/api/v1/auth/google/start` |
| POST | `/api/v1/auth/google/complete` |
| POST | `/api/v1/auth/claim-anonymous` |
| GET | `/api/v1/auth/me` |
| POST | `/api/v1/workspaces` |
| GET | `/api/v1/workspaces/me` |
| POST | `/api/v1/workspaces/import-guest-cache` |
| GET | `/api/v1/photo-album` |
| POST | `/api/v1/photo-album` |
| PATCH | `/api/v1/photo-album/{item_id}` |
| DELETE | `/api/v1/photo-album/{item_id}` |
| GET | `/api/v1/drive/items` |
| POST | `/api/v1/drive/items` |
| PATCH | `/api/v1/drive/items/{item_id}` |
| DELETE | `/api/v1/drive/items/{item_id}` |
| GET | `/api/v1/drive/items/{item_id}/permissions` |
| POST | `/api/v1/drive/items/{item_id}/permissions` |
| PATCH | `/api/v1/drive/permissions/{permission_id}` |
| POST | `/api/v1/drive/items/{item_id}/transfer-owner` |
| DELETE | `/api/v1/drive/permissions/{permission_id}` |
| GET | `/api/v1/drive/groups` |
| POST | `/api/v1/drive/groups` |
| PATCH | `/api/v1/drive/groups/{group_id}` |
| DELETE | `/api/v1/drive/groups/{group_id}` |
| POST | `/api/v1/drive/groups/{group_id}/members` |
| DELETE | `/api/v1/drive/groups/{group_id}/members/{member_id}` |
| GET | `/api/v1/drive/shares` |
| POST | `/api/v1/drive/shares` |
| PATCH | `/api/v1/drive/shares/{share_id}` |
| DELETE | `/api/v1/drive/shares/{share_id}` |
| GET | `/api/v1/drive/shares/{token}` |
| GET | `/api/v1/drive/shares/{token}/items` |
| GET | `/api/v1/drive/shares/{token}/items/{item_id}` |
| POST | `/api/v1/billing/checkout` |
| POST | `/api/v1/billing/confirm` |
| POST | `/api/v1/billing/webhooks/toss` |
| GET | `/api/v1/credits/balance` |
| GET | `/api/v1/credits/ledger` |
| GET | `/api/v1/reports` |
| POST | `/api/v1/reports` |
| GET | `/api/v1/reports/{report_id}` |
| PATCH | `/api/v1/reports/{report_id}` |
| POST | `/api/v1/reports/{report_id}/photos` |
| POST | `/api/v1/reports/{report_id}/photo-steps/step-1` |
| POST | `/api/v1/reports/{report_id}/photo-steps/step-2` |
| POST | `/api/v1/reports/{report_id}/photo-steps/step-3` |
| POST | `/api/v1/reports/{report_id}/photo-steps/step-4` |
| POST | `/api/v1/reports/{report_id}/photo-steps/step-5` |
| POST | `/api/v1/reports/{report_id}/photo-steps/review` |
| POST | `/api/v1/reports/{report_id}/draft-from-photos` |
| POST | `/api/v1/reports/{report_id}/draft-from-guided-photos` |
| GET | `/api/v1/reports/{report_id}/ai-runs/{run_id}` |
| POST | `/api/v1/reports/{report_id}/review-complete` |
| POST | `/api/v1/reports/{report_id}/exports/pdf` |
| POST | `/api/v1/reports/{report_id}/exports/hwpx` |
| GET | `/api/v1/reports/{report_id}/exports` |
| POST | `/api/v1/safety/auth/token` |
| GET | `/api/v1/safety/auth/me` |
| GET | `/api/v1/safety/users` |
| GET | `/api/v1/safety/headquarters` |
| POST | `/api/v1/safety/headquarters` |
| PATCH | `/api/v1/safety/headquarters/{headquarter_id}` |
| DELETE | `/api/v1/safety/headquarters/{headquarter_id}` |
| GET | `/api/v1/safety/sites` |
| POST | `/api/v1/safety/sites` |
| GET | `/api/v1/safety/sites/{site_id}` |
| PATCH | `/api/v1/safety/sites/{site_id}` |
| DELETE | `/api/v1/safety/sites/{site_id}` |
| GET | `/api/v1/safety/assignments` |
| POST | `/api/v1/safety/assignments` |
| PATCH | `/api/v1/safety/assignments/{assignment_id}` |
| DELETE | `/api/v1/safety/assignments/{assignment_id}` |
| GET | `/api/v1/safety/headquarter-assignments` |
| POST | `/api/v1/safety/headquarter-assignments` |
| PATCH | `/api/v1/safety/headquarter-assignments/{assignment_id}` |
| DELETE | `/api/v1/safety/headquarter-assignments/{assignment_id}` |
| GET | `/api/v1/safety/assignments/me/sites` |
| GET | `/api/v1/safety/headquarter-assignments/me` |
| GET | `/api/v1/safety/content-items` |
| GET | `/api/v1/safety/reports` |
| GET | `/api/v1/admin/headquarters/list` |
| GET | `/api/v1/admin/sites/list` |
| GET | `/api/v1/admin/sites/{site_id}` |
| GET | `/api/v1/admin/users/list` |
| GET | `/api/v1/admin/directory/assignments` |
| GET | `/api/v1/admin/reports` |
| GET | `/api/v1/admin/reports/{report_key}/original-pdf` |
| GET | `/api/v1/mail/accounts` |
| GET | `/api/v1/mail/providers/status` |
| POST | `/api/v1/mail/accounts/connect/{provider}/start` |
| POST | `/api/v1/mail/accounts/connect/{provider}/complete` |
| DELETE | `/api/v1/mail/accounts/{account_id}` |
| GET | `/api/v1/mail/threads` |
| GET | `/api/v1/mail/threads/{thread_id}` |
| PATCH | `/api/v1/mail/threads/{thread_id}` |
| GET | `/api/v1/mail/messages/{message_id}` |
| GET | `/api/v1/mail/recipient-suggestions` |
| POST | `/api/v1/mail/send` |
| POST | `/api/v1/mail/send-report` |
| POST | `/api/v1/mail/prepare-report` |
| POST | `/api/v1/mail/sync` |

## Registry 보강 기준

`_registry/api_registry.md`는 모든 endpoint를 다 세부 설명하지 않더라도, 최소한 아래 group은 실제 endpoint 기준으로 맞춰야 한다.

- auth/workspace
- reports
- guided photo upload
- export/billing/credits
- safety directory/admin directory
- drive/webhard
- mailbox
- photo-album
- admin report helpers
