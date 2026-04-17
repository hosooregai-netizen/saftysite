# Reverse Spec - Evidence Upload And Attachment Flow

## Purpose

- Recover the shared evidence ingestion path used by case detail, report composition, review, delivery, and finance support panels.
- Preserve upload, browse, preview, attach, detach, and bundle-download behavior for appraisal evidence assets.

## Source Mapping

- Base asset pipeline:
  - [../reverse-specs/photo-upload-and-attachment-flow-reverse-spec.md](../reverse-specs/photo-upload-and-attachment-flow-reverse-spec.md)
- Editor dependency:
  - [appraisal-report-composition-flow-reverse-spec.md](./appraisal-report-composition-flow-reverse-spec.md)
- Renamed entities:
  - `photo album item` -> `EvidenceAsset`
  - `report photo slot` -> case, subject, or report attachment slot
- Removed semantics:
  - legacy technical-guidance photo extraction
  - photo-only assumptions
- New appraisal-only logic:
  - registry and map documents
  - subject-linked evidence
  - delivery and invoice support files

## Feature Goal

Users must be able to:

- browse one case's evidence assets
- upload new evidence files
- attach evidence to a subject or report section
- preview images and documents
- download one file or a selected bundle

## User Role

- primary user: appraiser
- secondary user: reviewer, delivery operator, or finance user with case access
- preconditions:
  - authenticated appraisal ERP session
  - access to the target case

## Entry and Scope

- case-detail panel entry:
  - `/appraisal/cases/[caseKey]`
- report-editor entry:
  - `/appraisal/reports/[reportKey]`
- out of scope:
  - general content-library management
  - public client portal delivery downloads

## Data Contracts

### Main entities

`EvidenceAsset`

- `assetId`
- `caseKey`
- optional `reportKey`
- optional `subjectId`
- `assetKind`
- `fileName`
- `contentType`
- `sizeBytes`
- `previewUrl`
- `downloadUrl`
- `uploadedByUserId`
- `uploadedByName`
- `capturedAt`
- `createdAt`

Supported `assetKind` defaults:

- `photo`
- `registry`
- `cadastre`
- `map`
- `floorplan`
- `contract`
- `comparable`
- `worksheet_support`
- `delivery_receipt`
- `invoice_support`
- `other`

### Read APIs

- `GET /api/appraisal/assets`
  - filters:
    - `case_key`
    - `report_key`
    - `subject_id`
    - `asset_kind`
    - `query`
    - `limit`
    - `offset`
  - response:
    - `rows`
    - `total`
    - `refreshedAt`

### Write APIs

- `POST /api/appraisal/assets`
  - multipart fields:
    - `file`
    - `case_key`
    - optional `report_key`
    - optional `subject_id`
    - `asset_kind`

- `PATCH /api/appraisal/assets/:assetId`
  - update metadata or attachment links

### Output or download APIs

- single-file download uses `downloadUrl`
- multi-select bundle download returns a ZIP archive from the current asset selection

## Caching and Persistence

- asset list fetches should prefer `cache: no-store`
- case-detail asset views may keep in-memory query results while the panel is open
- successful upload prepends the new asset to the visible list and invalidates any report attachment drawer that depends on the same case

## State Model

### Primary local state

- `query`
- `assetKind`
- `caseKey`
- `reportKey`
- `subjectId`
- `rows`
- `loading`
- `uploading`
- `selectedIds`
- `activeItem`
- `error`
- `notice`

### Derived state

- `visibleRows`
- `canUpload`
- `activeFilterCount`
- `selectedItems`
- `groupedByKind`
- `linkedSectionAssets`

## Business Rules

### Identifier rules

- attachments inside reports must store `assetId`
- evidence lists may display `fileName`, but never use it as the stable identifier

### Domain rules

- uploads require a valid `caseKey`
- `subjectId` may be null for case-wide evidence
- relinking an asset from case-level to report-level must preserve the original file identity
- delivery and invoice evidence kinds do not allow completion status changes on their own; they only support the downstream workflow

### Validation rules

- accepted upload size limit for v1 defaults to `50MB` per file
- blocked file kinds:
  - executable binaries
  - archive uploads that are not explicit bundle support files
- bundle downloads are capped at `200` selected assets

## UI Composition

### Main sections

- asset toolbar
- asset list or grid
- upload area
- preview panel
- linked-to section badges

### Modal and overlay structure

- upload picker
- asset preview modal
- attach or relink drawer
- bundle download progress indicator

## Interaction Flows

### Initial load

1. resolve case or report context
2. fetch evidence assets for the current context
3. derive kind groups and selection state
4. render the asset workspace

### Upload flow

1. user selects a file and asset kind
2. upload posts to `/api/appraisal/assets`
3. new asset appears at the top of the list
4. linked report drawers invalidate and refetch if open

### Attach flow

1. user opens attach or relink
2. chooses case-wide, subject-level, or report-section destination
3. save patches the asset metadata
4. linked section views rerender

## Error Handling

- upload failure preserves the local file picker state long enough to retry
- preview failure falls back to file metadata and download link
- stale relink mutations refetch the asset row before retry

## Non-Obvious Implementation Notes

- The evidence system is broader than the current photo flow, but must remain simple enough to reuse the same upload and preview mechanics.
- One physical file may move between case-level and report-level attachment contexts without creating duplicate assets.
- Asset kinds support downstream queues, but do not own delivery or invoice completion state.

## Recovery Checklist

- [ ] Case and report contexts both browse evidence assets
- [ ] Upload creates a stable `assetId`
- [ ] Attach and relink use `assetId`, not file name
- [ ] Bundle download works from selected rows
- [ ] Delivery and invoice support files do not bypass lifecycle gates

## Verification

- upload one file, relink it to a report section, reload, and confirm persistence
- preview one image and one document
- test one blocked oversized upload

