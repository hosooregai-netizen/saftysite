# Step Audit Results

- Audit date: 2026-05-10
- Scope: `apps/docs/service-improvements` 01-16 vs. current source, build logs, route smoke, targeted API smoke, and external QA preflight.
- Status vocabulary: `not-started`, `applied`, `build-pass`, `failed`, `done`.
- Source of truth: source code first, then Markdown specs/prompts, then Control Center data.

## Verification Evidence

- Frontend clean build: pass via `npm run build -w @saftysite/web` after remaining browser QA patches.
- Backend compile: pass via `python3 -m compileall app` inside `apps/api`.
- HTTP route smoke: pass for 19 current smoke routes through `http://127.0.0.1:3000`; redirected routes resolved to expected pages.
- Public share API smoke: valid root `200`, descendant item `200`, outside item `404`, revoked token `404`, and public payload does not expose `headquarter_id` or `site_id`.
- Report gate API smoke: review-complete rejects `responsibility_confirmed=false`, unresolved required item, blocking issue, and direct export with unresolved gate.
- Gmail send negative smoke: forced Gmail API failure raises an error and writes no local mail message/thread.
- Non-Toss external QA: Google/Gmail/HWPX credentials are present; mailbox compose browser validation, access_denied error display, Gmail provider status, redirect allow-list, `/mailbox` CTA, and `accounts.google.com` OAuth handoff passed; user approval/live send remains manual.
- Photo/directory browser QA: photo grid/list toggle, filter dialog, search, detail drawer, directory CRUD modal validation, and report/photo/mail quick actions passed.
- Public share browser QA: valid share route rendered shared content, revoked/invalid routes rendered unavailable-state copy, descendant access returned `200`, outside/revoked/expired access returned `404`, and public payload does not expose `headquarter_id` or `site_id`.
- Report export browser QA: HWPX and PDF download endpoints returned `200`, attachment headers, and valid file signatures from a browser context.
- Toss billing remains intentionally excluded from this non-Toss pass; `TOSS_PAYMENTS_SECRET_KEY` and `TOSS_PAYMENTS_API_BASE_URL` are still missing.

## Step Matrix

| Step | Status | Evidence | Remaining Gap |
| --- | --- | --- | --- |
| 01 Source Recovery / Clean Build | done | Frontend build and backend compile passed. | No open gap for clean-build baseline. |
| 02 Mailbox State Consistency | done | Browser smoke confirmed no success/no-account contradiction; Google mail CTA is separate from Workspace login and hands off to Google OAuth. | Live Gmail approval/send remains tracked under steps 04-05. |
| 03 Mailbox 3-Pane & Compose | done | Browser QA confirmed compose opens, send is disabled until recipient/subject/body are present, then becomes enabled; access_denied callback error remains visible. | No open compose browser gap. |
| 04 Gmail Send & Sync Backend | build-pass | Gmail API send path is wired before local sent persistence; forced Gmail failure writes no local success. | Live Gmail OAuth/send QA remains. |
| 05 Mailbox Sync / Reconnect UX | build-pass | Sync metadata, banners, and route smoke pass. | Live Gmail sync/reconnect browser QA remains. |
| 06 Webhard Permission / Public Share Security | done | API and browser smoke prove valid root, descendant access, outside-root denial, revoked/expired denial, and no internal ID exposure. | No open public-share security gap. |
| 07 Webhard Share Dialog / Badges UX | done | Share URL uses the current origin, valid public viewer renders shared content, and revoked/invalid states render Korean unavailable copy. | No open public-share browser gap. |
| 08 Report / Billing / Auth Gate | failed | Report/auth gates now pass targeted API checks; Toss idempotency code remains in source. | Toss external QA is blocked by missing Toss credentials. |
| 09 Photo Album Grid / Filters | done | Browser QA confirmed grid/list toggle, filter dialog, search filtering, visible photo row, and detail drawer metadata/download action. | No open photo browser gap. |
| 10 Headquarters/Sites Directory UI | done | Browser QA confirmed headquarters/site CRUD modals, required-field validation, site detail, and report/photo/mail quick actions. | No open directory browser gap. |
| 11 Report Guided Upload / Review | done | Required overview/process and hazard photo pair now gates the button and handler path. | No automated blocker remains. |
| 12 Report Review / Export UX | done | Frontend confirm bypass was removed; backend direct export gate rejects unresolved blockers; browser-context HWPX/PDF download returned valid files. | No open report export browser gap. |
| 13 Report List Status / Filters | done | Search, status filter, export filter, and sort controls are wired to the list. | No automated blocker remains. |
| 14 Account Settings / Guest Import / Billing Entry UX | done | Workspace Google login no longer auto-marks Gmail pending connect. | No automated blocker remains. |
| 15 Final Clean Build / Route Smoke QA | done | Final QA script baseline passed; remaining QA rerun passed the current 19-route smoke list plus `/reports/demo-review`. | No build/route gap. |
| 16 RC Manual QA / Blocker Tracking | done | Audit, blocker tracker, route smoke results, and release decision were regenerated. | Release remains Hold only because Toss credentials are unavailable. |

## External QA Disposition

- Gmail live send: credential, redirect, mailbox CTA, compose validation, access_denied display, and OAuth handoff pass; live Google approval/sync/test send remains manual.
- Public share live browser token: pass.
- Report PDF/HWPX browser export: pass.
- Toss billing: intentionally excluded from this pass and still blocked by missing `TOSS_PAYMENTS_SECRET_KEY` and `TOSS_PAYMENTS_API_BASE_URL`.
- Control Center: statuses are updated in `apps/docs/control-center/data/service_improvements.json` and embedded fallback data in `apps/docs/control-center/index.html`.
