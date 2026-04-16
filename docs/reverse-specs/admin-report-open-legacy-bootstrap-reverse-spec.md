# Reverse Spec - Admin Report Open Legacy Bootstrap

## Purpose

- Recover the admin flow that opens legacy technical guidance reports in the structured inspection-session editor.
- Preserve behavior when the normal `reports/by-key` hydration path cannot load legacy reports.
- Keep original PDF fallback as a last resort, not the primary path.

## Source of Truth

- entry page: [app/admin/report-open/page.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/app/admin/report-open/page.tsx)
- admin bootstrap route: [app/api/admin/reports/[reportKey]/session-bootstrap/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/admin/reports/[reportKey]/session-bootstrap/route.ts)
- session screen loader: [features/inspection-session/hooks/useInspectionSessionScreen.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/inspection-session/hooks/useInspectionSessionScreen.ts)
- inspection-session provider context: [hooks/inspectionSessions/context.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/hooks/inspectionSessions/context.ts)
- inspection-session provider: [hooks/inspectionSessions/provider.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/hooks/inspectionSessions/provider.tsx)
- store mutation for hydrated payloads: [hooks/inspectionSessions/mutations.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/hooks/inspectionSessions/mutations.ts)
- general report-by-key loader: [hooks/inspectionSessions/useInspectionSessionReportLoaders.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/hooks/inspectionSessions/useInspectionSessionReportLoaders.ts)
- server resolver: [server/documents/inspection/requestResolver.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/documents/inspection/requestResolver.ts)
- session route decoding: [app/sessions/[sessionId]/page.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/app/sessions/[sessionId]/page.tsx)
- batch record: [docs/admin-aidlc/batch-15-legacy-report-bootstrap.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/admin-aidlc/batch-15-legacy-report-bootstrap.md)

## Feature Goal

Admins must be able to open a legacy technical guidance report from admin surfaces and land in the standard `/sessions/[sessionId]` editor even when the general ERP client hydrate path cannot fetch that legacy report by key.

## User Role

- primary user: admin/controller
- required preconditions:
  - valid admin auth token
  - report key is known
  - target report is a technical guidance report or is convertible into one session payload

## Entry and Scope

### Primary entry

- `/admin/report-open?reportKey=<encoded reportKey>`

### Secondary entry

- direct `/sessions/<sessionId>` where `sessionId` may itself be a legacy identifier such as `legacy:...`

### Out of scope

- quarterly report editing
- bad workplace report editing
- non-admin opening of legacy report keys

## Data Contracts

### Admin bootstrap API

- method: `GET`
- path: `/api/admin/reports/:reportKey/session-bootstrap`
- auth requirement: admin token via `readRequiredAdminToken`
- response type: `SafetyAdminReportSessionBootstrapResponse`
  - `site: InspectionSite`
  - `session: InspectionSession`
  - `siteSessions: InspectionSession[]`

### Entry-page client bootstrap call

- client helper: `fetchAdminReportSessionBootstrap(reportKey)`
- expected usage:
  - fetch once
  - inject `site` and `siteSessions` into inspection-session store
  - navigate to `/sessions/${encodeURIComponent(payload.session.id)}`

### Fallback PDF route

- path: `/api/admin/reports/:reportKey/original-pdf`
- used only after structured bootstrap fails

### General ERP hydrate path

- client loader: `ensureSessionLoaded(reportKey)`
- underlying data source: general safety `fetchSafetyReportByKey`
- important limitation:
  - this path may return `404` for legacy reports that are still visible from admin lists

## Server Reconstruction Rules

### Bootstrap resolution

`resolveInspectionSessionBootstrapByReportKey(request, reportKey)` must:

1. trim and validate `reportKey`
2. read required safety auth token from the request
3. try `resolveReportSitePayloadByReportKey(request, reportKey)`
4. if that fails, fall back to:
   - `fetchAdminReportByKey(token, reportKey, request)`
   - `buildFallbackSiteFromReport(report)`
5. fetch:
   - content items
   - all reports for the same site
6. build master data from content items
7. filter same-site reports down to technical guidance reports
8. sort them consistently by:
   - round
   - visit date
   - created time
9. map each report into `InspectionSession`
10. guarantee the target report exists in the session map even if it was not present in the fetched site list
11. return:
   - the resolved or fallback site
   - the target session
   - every same-site technical-guidance session as `siteSessions`

### Fallback site synthesis

If a normal site payload cannot be loaded, site reconstruction must still produce:

- `id`
- `headquarterId`
- `title`
- `siteName`
- `assigneeName`
- `adminSiteSnapshot`
- `createdAt`
- `updatedAt`

using report payload/meta fallbacks where necessary.

### Session reconstruction

Session creation uses `mapSafetyReportToInspectionSession(...)`.

That means legacy payloads can still become editor sessions if:

- report meta exists
- site snapshot can be synthesized
- master data can be built

This is more important than complete legacy payload fidelity.

## Route Decoding Rule

- `/sessions/[sessionId]` must decode `params.sessionId` with `decodeURIComponent(...)` before rendering the session screen.
- This is required because legacy keys may include characters that were encoded on navigation.

## Client State Injection Rules

### Store mutation

`upsertHydratedSiteSessions(site, sessions)` must:

1. normalize the site
2. upsert the site into local site state
3. upsert sessions by id into local session state
4. never overwrite a local dirty session
5. rebuild report-index items for the hydrated site
6. mark that site report index as `loaded`

### Why `siteSessions` matters

The target session is not enough.

The store also needs sibling same-site technical-guidance sessions so that:

- cumulative relationships
- prior-round context
- derived inspection-session data

can work inside the standard editor.

## State Model

### Entry page state

Inside `app/admin/report-open/page.tsx`:

- `reportKey`
- `message`
- `error`
- auth state from inspection-session provider:
  - `isReady`
  - `isAuthenticated`
  - `authError`

### Session screen state

Inside `useInspectionSessionScreen(sessionId)`:

- `isLoadingSession`
- `documentError`
- `missingRelationsStatus`
- `legacyBootstrapAttemptIdsRef`
- `forcedRelationRefreshIdsRef`
- `relationRefreshAttemptKeysRef`

### Important derived state

- `isAdminView`
- `displaySession`
- `displaySite`
- `relationStatus`
- `isRelationReady`
- `needsRelationRefresh`

## Primary Flows

### Flow 1: admin list -> report-open -> structured session

1. user opens `/admin/report-open?reportKey=...`
2. page waits for auth readiness
3. page calls `fetchAdminReportSessionBootstrap(reportKey)`
4. on success:
   - inject `site` and `siteSessions` into store
   - `router.replace('/sessions/<encoded session.id>')`
5. `/sessions/[sessionId]` decodes the id
6. standard inspection-session screen opens using hydrated store data

### Flow 2: admin list -> report-open -> PDF fallback

1. structured bootstrap fails
2. page reads current auth token
3. page changes message to:
   - `구조화 세션을 찾지 못해 원본 PDF를 여는 중입니다.`
4. page fetches original PDF API
5. on success:
   - create blob URL
   - hard replace current location with that blob URL

### Flow 3: direct `/sessions/legacy:...` self-heal

1. session screen mounts with `sessionId` beginning with `legacy:`
2. if current user is admin:
   - do not rely only on `ensureSessionLoaded`
3. if the session is not already in local store and bootstrap has not been attempted yet:
   - call `fetchAdminReportSessionBootstrap(sessionId)`
   - inject payload with `upsertHydratedSiteSessions`
4. continue rendering same session screen
5. if bootstrap fails too, leave the screen in missing-state fallback

## General Loader Interaction

### Normal path

For non-legacy session ids, the screen uses:

- `ensureSessionLoaded(sessionId)`

which:

1. loads report by key from general safety API
2. maps the report to `InspectionSession`
3. upserts site if needed
4. merges the session into local state

### Why legacy needs a separate path

If general safety API returns `404`:

- `ensureSessionLoaded` removes the local session if one exists
- this is correct for truly missing sessions
- but wrong for admin-visible legacy reports that only the admin resolver can reconstruct

So legacy admin sessions must bypass or supplement the normal loader.

## Relation Refresh Rules

- for admin legacy sessions, relation refresh is intentionally skipped
- `useInspectionSessionScreen` exits early from missing-relations refresh when:
  - `isAdminView` is true
  - `session.id.startsWith('legacy:')`

This prevents the standard `ensureSessionLoaded(..., { force: true })` path from re-triggering a failing by-key reload and destabilizing the bootstrapped legacy session.

## Error and Message Rules

### Entry page messages

- initial: `legacy 보고서를 여는 중입니다.`
- missing key: `열 보고서 키가 없습니다.`
- login expired: `로그인이 만료되었습니다. 다시 로그인해 주세요.`
- final combined failure:
  - `구조화 세션과 원본 PDF를 모두 열지 못했습니다. ...`

### Server route errors

- admin/safety API errors return structured JSON with the original status
- unexpected server errors return `500` with:
  - specific error message if available
  - fallback `레거시 보고서 세션을 불러오지 못했습니다.`

## Non-Obvious Constraints

- The bootstrap API is admin-only and must not silently become a public recovery path.
- `siteSessions` must include same-site technical-guidance sessions, not arbitrary report types.
- Route decoding is mandatory; encoded legacy ids are not safe to use raw.
- Dirty local sessions must win over bootstrapped remote copies.
- Original PDF is a safety fallback, not the preferred UX.

## Recovery Checklist

- [ ] `/admin/report-open?reportKey=...` opens structured editor for a legacy technical-guidance report
- [ ] structured bootstrap injects both `site` and `siteSessions`
- [ ] direct `/sessions/legacy:...` works for admin users
- [ ] legacy session ids are decoded correctly from the route
- [ ] bootstrap failure falls back to original PDF
- [ ] combined failure shows explicit admin-facing error
- [ ] legacy admin session does not get wiped by relation refresh
- [ ] normal non-legacy `ensureSessionLoaded` behavior remains unchanged

## Verification

- targeted typecheck
- admin reports smoke
- admin schedules smoke when those links touch report-open flow
- legacy direct-session manual check or equivalent smoke if available
