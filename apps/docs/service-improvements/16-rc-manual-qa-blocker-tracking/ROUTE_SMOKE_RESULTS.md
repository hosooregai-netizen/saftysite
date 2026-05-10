# Route Smoke Results

- Date: 2026-05-10
- Method: `npm run dev:sass`, then Playwright route smoke from `http://127.0.0.1:3000`.
- Result: current route smoke list plus `/reports/demo-review` passed at page-render/redirect level.
- Note: route smoke verifies route render/redirect. Public share browser states, PDF/HWPX browser-context downloads, mailbox compose/error-state, photo album, and directory browser checks were verified in the non-Toss QA pass; Toss and live Gmail approval/send remain separate.

| Route | Result | HTTP | Final URL / Note |
| --- | --- | ---: | --- |
| `/` | Pass | 200 | `/` |
| `/dashboard` | Pass | 200 | resolves to `/reports` |
| `/pricing` | Pass | 200 | resolves to `/account#billing` |
| `/reports/new` | Pass | 200 | `/reports/new` |
| `/reports` | Pass | 200 | `/reports` |
| `/reports/{knownReportId}` | Pass | 200 | `/reports/demo-review` |
| `/headquarters` | Pass | 200 | `/headquarters` |
| `/sites` | Pass | 200 | resolves to `/headquarters?scope=assigned` |
| `/photo-album` | Pass | 200 | `/photo-album` |
| `/webhard` | Pass | 200 | `/webhard` |
| `/share/{validToken}` | Pass | 200 | actual generated public share route rendered; browser content check passed |
| `/share/{invalidToken}` | Pass | 200 | invalid token page route render only |
| `/mailbox` | Pass | 200 | `/mailbox` |
| `/mail/connect/google?error=access_denied` | Pass | 200 | error callback route renders |
| `/account` | Pass | 200 | `/account` |
| `/auth/google/callback?error=access_denied` | Pass | 200 | error callback route renders |
| `/billing/checkout` | Pass | 200 | `/billing/checkout` |
| `/billing/success` | Pass | 200 | `/billing/success` |
| `/billing/fail` | Pass | 200 | `/billing/fail` |
| `/credits` | Pass | 200 | resolves to `/account#billing` |

## Targeted Smoke Notes

- Mailbox browser QA: compose opens, send is disabled until recipient/subject/body are present, send enables after required fields, no success/no-account contradiction, and `/mail/connect/google?error=access_denied` displays the Google error state after redirecting to mailbox.
- Photo album browser QA: card/list toggle, filter dialog, search filtering, photo row visibility, detail drawer metadata, and original-download CTA passed.
- Headquarters/sites browser QA: headquarters and site create modals open, required-field validation toggles disabled/enabled state, site detail renders, and report/photo/mail quick actions are visible.
- Public share API/browser: valid root `200`, descendant `200`, outside item `404`, revoked/expired token `404`, no internal headquarter/site IDs exposed, valid/revoked/invalid browser copy passed.
- Report gate API: false responsibility, unresolved required review item, blocking issue, and direct export bypass all reject with `409`.
- Gmail send negative: forced Gmail API failure writes no local message/thread.
- Gmail OAuth handoff: provider status `200`, redirect allowed, `/mailbox` CTA visible, no success/no-account contradiction, and handoff host is `accounts.google.com`.
- Report export browser: HWPX and PDF returned `200`, attachment headers, and valid file signatures.
