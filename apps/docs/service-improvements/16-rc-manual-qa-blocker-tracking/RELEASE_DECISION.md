# Release Decision

- Decision: Hold
- Date: 2026-05-10
- Basis: MD step audit, build/compile logs, route smoke, targeted API smoke, non-Toss browser QA, and external credential preflight.

## Release Criteria

| Gate | Result | Note |
| --- | --- | --- |
| Frontend clean build | Pass | `npm run build` passed. |
| Backend compile | Pass | `python3 -m compileall app` passed. |
| Core route smoke | Pass | Current route smoke list plus `/reports/demo-review` render or redirect as expected. |
| Public share security | Pass | Boundary/privacy API smoke and browser valid/revoked/invalid state checks passed. |
| Report review/export gate | Pass | Backend/frontend no-bypass gates passed; browser-context HWPX/PDF downloads returned valid files. |
| Gmail local-success guard | Pass | Forced Gmail failure writes no local sent message/thread. |
| Gmail OAuth handoff | Partial | Credential, redirect allow-list, `/mailbox` CTA, compose validation, access_denied display, and Google OAuth handoff passed; user approval/live sync/live send remains manual. |
| Photo/directory browser QA | Pass | Photo grid/list/filter/search/detail drawer and directory CRUD modal/quick-action checks passed. |
| Report AI Standardization | Build-pass | Fallback/mock Vision path, standard risk matching, deterministic section 4/5/6 writer quality checks, AI fill UI, unit tests, frontend build, backend compile, and final QA script passed; live OpenAI Vision image QA remains pending. |
| Non-Toss automated/browser QA | Pass | Route smoke, public share, report export, mailbox compose/error-state, photo, and directory checks passed with Toss excluded. |
| S0/S1 blockers | Fail | Toss credential blocker remains open. |
| External billing QA | Fail | Toss credentials are missing. |

## Decision Rationale

Most code blockers that caused `Hold` were patched and reverified. The non-Toss automated/browser QA pass now covers public share, report export, mailbox compose/error-state, photo album, directory flows, and Report AI fallback standardization including deterministic writer quality. Gmail OAuth handoff is ready for user approval. Report AI live Vision QA is also ready to run once an OpenAI key is supplied. The app is still not release-ready because Toss external billing QA cannot run without `TOSS_PAYMENTS_SECRET_KEY` and `TOSS_PAYMENTS_API_BASE_URL`.

## Reconsider Release After

- Toss test credentials are available and checkout confirm/webhook idempotency is reverified.
- Optional but recommended: complete live Google mailbox approval, sync, reconnect/error-state, and actual Gmail test-send QA.
- Optional but recommended: provide `OPENAI_API_KEY`, set `AI_VISION_ENABLED=true`, and complete live Vision QA for ladder/rebar/opening images.
