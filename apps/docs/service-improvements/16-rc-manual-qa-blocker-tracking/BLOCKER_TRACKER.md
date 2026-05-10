# Blocker Tracker

- Date: 2026-05-10
- Release state: Hold
- Source: `STEP_AUDIT_RESULTS.md`, source audit, build logs, route smoke, targeted API smoke, non-Toss browser QA, and external credential preflight.

## Open Blockers

| ID | Severity | Feature | Evidence | Required Recheck |
| --- | --- | --- | --- | --- |
| BLK-BILLING-TOSS-CREDENTIALS | S0 | billing-credits | `TOSS_PAYMENTS_SECRET_KEY` and `TOSS_PAYMENTS_API_BASE_URL` are missing from local preflight. | Provide Toss test credentials, then rerun checkout confirm/webhook idempotency checks. |
| BLK-EXTERNAL-GMAIL-LIVE-QA | S2 | mailbox | Mailbox compose validation and access_denied error display passed; Google OAuth configuration, redirect allow-list, `/mailbox` CTA, and `accounts.google.com` handoff passed. User approval, live sync, and actual Gmail test send were not completed. | Run live Google approval, sync/backfill, reconnect/error-state, and test-send QA with a user-controlled browser session. |

## Closed In This Patch

| ID | Severity | Feature | Resolution |
| --- | --- | --- | --- |
| BLK-WEBHARD-PUBLIC-PAYLOAD-IDS | S0 | webhard | Public serializer no longer exposes `headquarter_id` or `site_id`; API smoke passed. |
| BLK-REPORT-REVIEW-COMPLETE-GATE | S0 | report-workspace | Backend review-complete now rejects false responsibility, unresolved required items, and blocking issues. |
| BLK-REPORT-EXPORT-UX-BYPASS | S0 | report-workspace | Frontend confirm bypass was removed and direct export endpoints re-check blockers. |
| BLK-MAIL-GMAIL-SEND-LOCAL-SUCCESS | S1 | mailbox | Gmail API send is attempted before local sent persistence; forced failure writes no local message/thread. |
| BLK-REPORT-GUIDED-UPLOAD-PHOTOS | S1 | report-workspace | Required overview/process and hazard photos now gate both CTA and handler path. |
| BLK-AUTH-GMAIL-PENDING-CONNECT | S1 | account-settings/auth-workspace | Workspace Google login no longer auto-starts Gmail pending connect. |
| BLK-EXTERNAL-PUBLIC-SHARE-BROWSER-QA | S2 | webhard | Browser smoke confirmed valid share content, revoked/invalid unavailable states, current-origin share URL behavior, and API boundary/privacy checks. |
| BLK-EXTERNAL-REPORT-EXPORT-BROWSER-QA | S2 | report-workspace | Browser-context HWPX/PDF requests returned `200`, attachment headers, and valid file signatures. |

## Passing Gates

- Frontend clean build: pass.
- Backend compile: pass.
- HTTP route smoke: pass for the current 19-route smoke list plus `/reports/demo-review`.
- Public share API boundary/privacy: pass.
- Public share browser valid/revoked/invalid states: pass.
- Report review/export backend gates: pass.
- HWPX/PDF browser-context download: pass.
- Gmail send negative persistence guard: pass.
- Gmail OAuth provider/redirect/CTA handoff: pass.
- Mailbox compose browser validation and access_denied error display: pass.
- Photo album browser QA for grid/list/filter/search/detail drawer: pass.
- Headquarters/sites browser QA for CRUD modal validation and report/photo/mail quick actions: pass.
