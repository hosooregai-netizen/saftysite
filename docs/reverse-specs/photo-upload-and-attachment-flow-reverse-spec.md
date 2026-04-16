# Reverse Spec - Photo Upload and Attachment Flow

## Purpose

- Recover the shared photo ingestion path used by both the dedicated site photo album and report-editing attachment slots.
- Preserve upload, browse, download, legacy-photo surfacing, and the session-side bridge that turns a selected file into a persisted asset URL or fallback data URL.

## Source of Truth

- site album shell: [features/photos/components/SitePhotoAlbumScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/photos/components/SitePhotoAlbumScreen.tsx)
- mobile album shell: [features/mobile/components/MobileSitePhotoAlbumScreen.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/components/MobileSitePhotoAlbumScreen.tsx)
- album workspace: [features/photos/components/PhotoAlbumPanel.tsx](/Users/mac_mini/Documents/GitHub/saftysite-real/features/photos/components/PhotoAlbumPanel.tsx)
- mobile session picker: [features/mobile/inspection-session/useMobileInspectionPhotoPicker.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/mobile/inspection-session/useMobileInspectionPhotoPicker.ts)
- shared session file bridge: [features/inspection-session/hooks/useInspectionSessionScreen.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/features/inspection-session/hooks/useInspectionSessionScreen.ts)
- photo client API: [lib/photos/apiClient.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/photos/apiClient.ts)
- photo read route: [app/api/photos/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/photos/route.ts)
- photo upload route: [app/api/photos/upload/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/photos/upload/route.ts)
- photo download route: [app/api/photos/download/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/photos/download/route.ts)
- server album helpers: [server/photos/album.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/photos/album.ts), [server/photos/service.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/photos/service.ts)
- asset validation/upload helper: [lib/safetyApi/assets.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/lib/safetyApi/assets.ts)
- types: [types/photos.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/types/photos.ts)

## Feature Goal

Workers and admins must be able to:

- browse one site’s photo album with search, filter, sort, preview, and download
- upload new field photos into the site album
- reuse album photos inside mobile/session document editors
- attach fresh camera/gallery files inside report sections
- surface legacy images embedded in older technical-guidance reports inside the same album

## User Role

- primary user: field worker assigned to a site
- secondary user: admin/controller reviewing or uploading site photos
- preconditions:
  - authenticated safety token
  - access to the target site

## Entry and Scope

- worker web entry:
  - `/sites/[siteKey]/photos`
- worker mobile entry:
  - `/mobile/sites/[siteKey]/photos`
- embedded report-entry usage:
  - mobile inspection photo picker
  - shared `withFileData(...)` helper used by inspection sections

Out of scope:

- mailbox attachments
- admin content-library generic asset management
- PDF/HWPX document generation itself

## Data Contracts

### Main entity

`PhotoAlbumItem`

Fields that must survive reconstruction:

- identity and context:
  - `id`
  - `siteId`
  - `siteName`
  - `headquarterId`
  - `headquarterName`
- binary/display:
  - `previewUrl`
  - `downloadUrl`
  - `fileName`
  - `contentType`
  - `sizeBytes`
- timeline:
  - `capturedAt`
  - `createdAt`
- uploader metadata:
  - `uploadedByUserId`
  - `uploadedByName`
- geo metadata:
  - `gpsLatitude`
  - `gpsLongitude`
- provenance:
  - `sourceKind`
  - `sourceReportKey`
  - `sourceDocumentKey`
  - `sourceSlotKey`
  - `sourceReportTitle`

### Source kinds

- `album_upload`
  - real uploaded photo-asset record
- `legacy_import`
  - synthesized item reconstructed from stored technical-guidance payload image fields

### Read API

- `GET /api/photos`
- query params:
  - `all`
  - `headquarter_id`
  - `limit`
  - `offset`
  - `query`
  - `report_key`
  - `site_id`
  - `sort_by`
  - `sort_dir`
  - `source`

Response shape:

- `limit`
- `offset`
- `rows: PhotoAlbumItem[]`
- `total`

Server rules:

- limit clamped to `1..200`
- default limit `60`
- `source` accepts:
  - `all`
  - `album_upload`
  - `legacy_import`

### Upload API

- `POST /api/photos/upload`
- multipart form fields:
  - `file`
  - `site_id`
  - optional `thumbnail`

Upload response:

- `{ ok: true, item: PhotoAlbumItem }`

Route rules:

- site id is required
- `file` must be an image file
- original image must be `> 0` and `<= 50MB`
- thumbnail, when present, must also be `<= 50MB`

### Download API

- `GET /api/photos/download?item_id=<id>`
- `POST /api/photos/download`
  - body:
    - `item_ids: string[]`

Download rules:

- exactly one item returns raw binary with original filename
- multiple items return a ZIP archive
- max selected item count:
  - `200`

### Embedded attachment helper contract

`withFileData(file, onLoaded?) -> Promise<string | null>`

Behavior:

- validate file with `validateSafetyAssetFile`
- if image file and current session site exists:
  - upload to site photo album
  - return uploaded `previewUrl`
- else if current role can upload content assets:
  - upload as generic content asset
  - return uploaded asset URL
- else:
  - read local file as data URL
  - return data URL

This helper is the bridge used by document sections when a file needs to become a persisted session field value.

## Caching and Persistence

- photo album fetches use `cache: 'no-store'`
- there is no long-lived album cache in this flow
- UI-level pagination is client-side via `visibleCount`, not server pages, when `all=true`
- mobile photo picker uses deferred query and re-fetches album rows whenever:
  - modal is open
  - `siteId` exists
  - query changes
- mobile quarterly ops/content-item cache is unrelated and must not be reused for photo album data

## State Model

### Photo album panel state

- `query`
- `sort`
- `headquarterId`
- `siteId`
- `rows`
- `visibleCount`
- `loading`
- `uploading`
- `notice`
- `error`
- `selectedIds`
- `activeItem`

### Mobile photo picker state

- `isPhotoSourceModalOpen`
- `isPhotoAlbumModalOpen`
- `photoSourceTitle`
- `photoAlbumQuery`
- `photoAlbumRows`
- `photoAlbumLoading`
- `photoAlbumError`
- `photoAlbumSelectingId`
- `photoSourceTargetRef`

### Derived state

- `headquarterOptions`
- `visibleSiteOptions`
- `canUpload`
- `showHeaderFilter`
- `activeFilterCount`
- `visibleRows`
- `hasMoreRows`
- `allVisibleSelected`

## Business Rules

### Access and locking rules

- worker album is always locked to the current site and headquarter
- admin album may browse broader context unless shell passes locked ids
- upload is blocked unless a site is selected or locked

### Legacy-photo surfacing rules

- album results combine real uploaded assets with synthesized legacy images
- legacy image extraction is limited to technical-guidance reports
- synthesized legacy items are collected from:
  - doc3
  - doc4
  - doc7
  - doc10
  - doc11
  - doc12
- non-image URLs or document attachments are ignored during legacy extraction

### Display rules

- source label:
  - `legacy_import` => `이관된 보고서 사진`
  - otherwise => `업로드 사진`
- GPS label:
  - missing coordinates => `GPS 없음`
- file size formatting:
  - MB when `>= 1MB`
  - KB when `>= 1KB`
  - bytes otherwise

### Sort rules

- allowed sort keys:
  - `capturedAt`
  - `createdAt`
  - `fileName`
  - `siteName`
- default sort:
  - `capturedAt desc`
- date sorts fall back to:
  - `createdAt`
  - `fileName`

### Download rules

- selecting zero items is invalid
- selecting more than 200 items is invalid
- ZIP entry names must be unique even when files share the same display name

### Embedded attachment rules

- mobile step cards may choose a photo from:
  - camera
  - gallery
  - site photo album
- if a target field supplies `onAlbumSelected`, that callback wins
- otherwise picker converts album `previewUrl` back into a `File` via `assetUrlToFile(...)`
- report-section fields persist the returned string value, not a raw `File`

### File-size rules outside album

- generic asset validation still caps files at `50MB`
- if proxy upload mode is active, files above `4.5MB` are blocked with a proxy-specific message

## UI Composition

### Dedicated album shell

- auth gate
- worker/admin nav shell
- page title with current site name
- back control
- `PhotoAlbumPanel`

### Album panel

- search input
- optional header filter menu
- upload button and hidden file input
- download action for selected items
- export action when admin export path is available
- grid/list of photo cards
- preview modal for `activeItem`

### Mobile picker overlays

- photo source modal
- photo album modal
- hidden camera input
- hidden gallery input

## Interaction Flows

### Dedicated album initial load

1. resolve current site and auth
2. compute worker/admin mode and locking context
3. fetch `/api/photos` with `all=true` and current filters
4. render returned rows in descending captured-time order

### Upload from album screen

1. user selects one or more image files
2. generate thumbnail best-effort via `createPhotoThumbnail`
3. upload each file to `/api/photos/upload`
4. re-fetch album rows
5. clear selection and show success notice

### Download from album screen

1. user selects one or more rows
2. call download endpoint
3. browser saves raw file or ZIP depending on item count

### Use album photo inside report editing

1. user opens photo source picker from a report field
2. choose album mode
3. fetch album rows for current site
4. choose one item
5. resolve item to field value through `onAlbumSelected` or file conversion
6. apply document update with returned asset/data URL

### Use fresh camera/gallery photo inside report editing

1. user picks file from camera or gallery
2. `withFileData(...)` validates file
3. if image and site exists, upload into site album and return preview URL
4. update document field with returned value

## Error Handling

- missing auth token:
  - `로그인이 만료되었습니다. 다시 로그인해 주세요.`
- photo list failure:
  - `사진첩을 불러오지 못했습니다.`
- upload validation failures:
  - missing site
  - invalid image file
  - `50MB 이하의 유효한 사진 파일만 업로드할 수 있습니다.`
- download permission or missing-item mismatch returns 404
- embedded upload helper stores local `uploadError` on the shared session screen
- mobile photo picker keeps album-selection errors local to the modal

## Non-Obvious Constraints

- the photo album is not upload-only; it is also a compatibility view over legacy report payload images
- report sections do not store asset ids; they store URLs/data URLs returned from the upload bridge
- image files chosen during session editing intentionally enter the shared site album when a site id exists
- non-image files bypass the site album and go through generic content-asset upload or local data URL fallback
- dedicated album and embedded picker share the same underlying read API, so query/sort drift between the two is a regression risk

## Recovery Checklist

- [ ] worker and admin photo album shells authenticate and resolve site context
- [ ] `/api/photos` returns both uploaded and legacy-imported items
- [ ] album upload accepts valid image files and refreshes rows
- [ ] single and multi-download both work
- [ ] photo picker can choose camera, gallery, and album sources
- [ ] `withFileData(...)` uploads site images into the album when site context exists
- [ ] non-image attachments still fall back to generic asset upload or data URL
- [ ] download item limit and file-size validation are preserved

## Verification

- targeted typecheck
- manual worker pass:
  - open site album
  - upload photo
  - download single photo
  - download multi-photo zip
- manual report pass:
  - attach album photo to one mobile/doc field
  - attach fresh gallery photo to one mobile/doc field
