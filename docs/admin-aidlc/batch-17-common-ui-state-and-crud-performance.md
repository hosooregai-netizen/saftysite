# Batch 17: Common UI State and CRUD Performance

## Goal

- Make admin list re-entry preserve page, query, filter, and sort state through URL params.
- Reduce expensive admin CRUD follow-up work that made save/delete flows feel slow.
- Keep service naming consistent as `한국종합안전`.

## Admin UI State

- User, business/site, report, schedule, content, mailbox, and photo lists now keep their list state in URL query params.
- Drilldown navigation for business/site rows preserves current list params, while list controls update the URL with `replace` and no scroll jump.
- Admin entry pages that use query params stay behind Suspense boundaries when required by Next static prerendering.

## CRUD Read/Write Policy

- User and site deletion now load only related assignment rows through filtered directory APIs.
- Business deletion first loads only the selected business sites, then processes assignment cleanup for those sites.
- Assignment cleanup deduplicates ids and deactivates them in bounded parallel batches.
- Business/site edit modals compare initial and current forms; unchanged edits close without sending a PATCH.
- Content CRUD no longer waits for worker master-data refresh before resolving the local save flow.

## Notes

- No database schema or backend public API change is required.
- Existing direct admin read paths remain canonical; URL params only represent client list UI state.
