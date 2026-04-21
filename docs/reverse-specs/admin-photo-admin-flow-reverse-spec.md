# Reverse Spec - Admin Photo Management Flow

## Recovery Slice

- Recovery Slice ID: `admin-photo-admin-flow`
- Top-level contract: `admin-control-center`
- Reverse spec status: `done`

## Purpose

- Recover the `/admin` photo management section that wraps the shared photo album flow with admin-specific route context.
- Preserve the admin wrapper, shared upload/download pipeline, and the ability to reopen the same photo records from report-linked context.

## Source of Truth

- admin wrapper: [features/admin/sections/photos/PhotosSection.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/admin/sections/photos/PhotosSection.tsx)
- shared album shell: [features/photos/components/PhotoAlbumPanel.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/photos/components/PhotoAlbumPanel.tsx)
- photo API client: [lib/photos/apiClient.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/photos/apiClient.ts)
- photo read route: [app/api/photos/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/photos/route.ts)
- photo upload route: [app/api/photos/upload/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/photos/upload/route.ts)
- photo download route: [app/api/photos/download/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/photos/download/route.ts)
- server helpers: [server/photos/album.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/photos/album.ts), [server/photos/service.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/photos/service.ts)

## Feature Goal

Controllers must be able to:

- open the admin photo section with preselected site/report context
- browse, preview, and download site photos in admin mode
- upload photos through the same shared photo pipeline used by worker flows
- return back to the originating admin/report context without rebuilding selection state manually

## User Role

- primary user: admin/controller
- preconditions:
  - authenticated admin shell
  - site list already loaded into the admin dashboard state

## Entry and Scope

- this slice is the `/admin?section=photos` path under the shared control-center contract
- `PhotosSection` reads query params and passes them into the shared `PhotoAlbumPanel`
- shared worker album shells and report-side attachment slots are outside this admin wrapper slice

## Data Contracts

### Wrapper input

- `PhotosSection` receives `sites: SafetySite[]`
- wrapper maps each site into a simplified panel site model:
  - `id`
  - `siteName`
  - `headquarterId`
  - `headquarterName`
  - `totalRounds`

### Route-derived context

- `returnTo`
- `returnLabel`
- `headquarterId`
- `reportKey`
- `reportTitle`
- `siteId`

### Shared APIs

- `GET /api/photos`
- `POST /api/photos/upload`
- `GET /api/photos/download`
- `POST /api/photos/download`

## Caching and Persistence

- admin slice itself does not add a second cache layer
- admin wrapper depends on the shared photo panel’s no-store fetch strategy
- route query params are the persistence mechanism for “return to report” context

## State Model

### Wrapper state

- `PhotosSection` keeps no local reducer-like state
- all interactive state lives in the shared `PhotoAlbumPanel`

### Derived wrapper values

- `backHref`
- `backLabel`
- `initialHeadquarterId`
- `initialReportKey`
- `initialReportTitle`
- `initialSiteId`
- mapped admin `sites`

## Business Rules

### Admin wrapper rule

- wrapper must pass `mode="admin"` into `PhotoAlbumPanel`
- this is what keeps the same shared panel aligned to the admin shell rather than worker navigation

### Context handoff rule

- when `returnTo` exists:
  - the panel must expose that return destination
- when `returnLabel` is absent:
  - default label is `보고서로 돌아가기`

### Shared pipeline rule

- admin photo management does not fork the upload/download path
- uploads, previews, and downloads must continue to resolve through the same shared photo routes and server helpers

## UI Composition

- thin admin wrapper section
- shared photo album panel with:
  - filters
  - grid/list rendering
  - preview
  - upload
  - multi-download

## Interaction Flows

### Open from admin/report context

1. admin route builds photo-section query params
2. `PhotosSection` reads the params from `useSearchParams()`
3. wrapper passes the initial site/report context into the shared album panel

### Upload and reuse

1. admin uploads one or more photos from the shared panel
2. upload goes through `/api/photos/upload`
3. same stored photo records remain visible to report-linked and worker-linked consumers

## Error Handling

- wrapper itself has no independent error state
- fetch/upload/download errors are surfaced by the shared photo panel
- missing route context falls back to default back label rather than blocking the section

## Recovery Checklist

- [ ] admin photo section opens with mapped admin site rows
- [ ] `mode="admin"` reaches the shared photo panel
- [ ] return link context survives the admin wrapper
- [ ] uploads still use the shared `/api/photos/upload` path
- [ ] multi-download still uses the shared download route
