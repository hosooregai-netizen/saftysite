# Admin AIDLC Batch 22: Content Summary Bootstrap

## Goal

- keep admin/control-center bootstrap on a lightweight content-items list path
- avoid loading full `body` payloads for every content item until an edit/detail flow actually needs them

## Scope

- admin dashboard content bootstrap
- server-side admin bootstrap in `server/admin/safetyApiServer.ts`
- content section edit flow fallback to detail fetch

## Contract Pack

- admin proof: `scripts/smoke-real-client/admin-sections/control-center.ts`

## Validation Commands

- `npx tsc --noEmit --pretty false`
- admin real smoke against `/admin?section=content`
- verify that `/api/safety/content-items?...include_body=false...` is observed during bootstrap

## Implementation Record

- switched admin dashboard bootstrap loaders to request content item summaries instead of full bodies
- updated the shared controller/admin dashboard data model so bootstrap rows can carry summary metadata
- kept the content edit modal on a safe detail fallback: if a list row has no body, fetch `/content-items/{id}` before opening the editor
- extended real-admin smoke so the content section fails if the summary request stops using `include_body=false` or if summary rows start carrying full bodies again

## Residual Debt

- content section listing is now lighter, but inspection/mobile/report-generation flows still use full content item bodies by design
- if the content library grows further, the next split should be summary list vs section-specific detail loaders rather than one universal full list
