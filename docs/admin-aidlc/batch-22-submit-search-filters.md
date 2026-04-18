# Admin AIDLC Batch 22: Submit-Based Search Filters

## Goal

- stop admin list and analytics screens from refetching on every keystroke
- align shared search behavior so list filtering only runs after an explicit submit action
- carry the same submit-based search contract into the site report surfaces that share the pattern

## Scope

- shared submit search field and submitted-query state hook
- admin control center, reports, sites, users, headquarters, schedules, content, and photo list search bars
- ERP site technical guidance and quarterly report list search bars

## Contract Pack

- admin batch record: `docs/admin-aidlc/batch-22-submit-search-filters.md`
- admin proof: `tests/client/admin/admin-users.spec.ts`
- admin proof: `tests/client/admin/admin-sites.spec.ts`
- ERP proof: `tests/client/erp/site-report-list.spec.ts`

## Validation Commands

- `npx tsc --noEmit --pretty false`
- `npm run aidlc:audit:admin`
- `npm run build`
- `tsx tests/client/runSmoke.ts admin-users admin-sites site-report-list`

## Implementation Record

- introduced `SubmitSearchField` so list search UI uses a shared input plus explicit search button pattern
- introduced `useSubmittedSearchState` to separate the draft input value from the submitted query value
- wired admin analytics, reports, sites, users, headquarters, schedules, content, and photo search flows to refetch or refilter only after submit
- wired ERP site report and quarterly list search flows to keep draft text local until submit
- added busy-state button handling so repeated submits are blocked while active searches are already loading
- updated smoke coverage to prove admin and ERP search fields do not refetch or refilter until the user clicks the search button or presses Enter

## Residual Debt

- admin schedules, quarterly list, and photo search flows now use the shared submit model but do not yet have dedicated smoke assertions for the delayed-submit behavior
