# Platform Primitive: Asset Attachment Pipeline

Module ID: `platform-asset.attachment-pipeline`

## Purpose

Provide a shared upload, preview, selection, and download pipeline for attachment-heavy ERP flows.

## User Roles

- field user uploading evidence assets
- reviewer selecting or downloading existing assets
- module author composing a review workbench over a shared asset pipeline

## Entry Conditions

Enter when a screen needs attachment lifecycle behavior with site/session context preserved through
upload, preview, and multi-select download.

## State Model

Owns asset list state, selection state, upload status, preview intent, and route/context preservation.

## User Journeys

1. Load contextual assets.
2. Preview one asset in place.
3. Upload or replace assets while preserving context.
4. Multi-select and download assets in bulk.

## API Contracts

- `GET /api/photos`
  - request: admin-authenticated request with site, round, filter, pagination, and mode query parameters
  - response: paged asset rows, capabilities, and total counts
- `POST /api/photos/upload`
  - request: multipart form data with attachment file and contextual metadata
  - response: uploaded asset metadata ready for list refresh
- `POST /api/photos/download`
  - request: selected asset ids and current download context
  - response: binary download bundle or redirectable file stream

## Server Touchpoints

- `app/api/photos/route.ts`
- `app/api/photos/upload/route.ts`
- `app/api/photos/download/route.ts`
- `server/photos/service.ts`
- `server/photos/album.ts`

## Performance Guardrails

- Asset list fetch
  - target: <= 3000ms, <= 1500000 bytes
  - cache: no durable server cache; rely on current query context and explicit reload
  - invalidation: upload, patch/delete, round or site filter change
- Asset upload
  - target: <= 45000ms
  - cache: no cache; completed upload must trigger list refresh
  - invalidation: every successful upload or replacement
- Asset bulk download
  - target: <= 12000ms, <= 8000000 bytes
  - cache: no cache; selection state stays client-owned during partial failures
  - invalidation: selection change, download retry

## Invariants

- Route-derived context survives wrapper changes.
- Upload, preview, and download share the same normalized asset identity.
- Multi-select actions operate on normalized selection state, not ad hoc DOM state.

## Failure Modes

- upload fails: keep current asset state and surface actionable error
- preview target missing: return to list state instead of crashing
- download partially fails: preserve selection and report failed items

## Industry Variability

Allowed override points:

- `asset.allowedKinds`
- `asset.reviewFlags`
- `asset.downloadBundleNaming`

## Composition Examples

- `asset-review.photo-workbench` uses this primitive for admin review behavior.
- Mobile evidence capture or manufacturing quality-photo review can reuse the same pipeline.

## Non-portable Areas

Exact file naming conventions and external storage adapters are not portable and should remain in
adapters or tenant config.
