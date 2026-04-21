# Business Module: Asset Review Photo Workbench

Module ID: `asset-review.photo-workbench`

## Purpose

Provide a review-oriented photo workbench that layers review context, bulk actions, and admin-facing
inspection over a shared attachment pipeline.

## User Roles

- reviewer or admin triaging submitted photos
- manager downloading photo bundles for downstream use

## Entry Conditions

Enter from an admin or operations shell where users review and act on contextual photo assets.

## State Model

Builds on `platform-asset.attachment-pipeline` and adds review mode, filter badges, and admin
context rules.

## User Journeys

1. Open the photo review workbench.
2. Filter and inspect contextual photos.
3. Upload or replace photos when permitted.
4. Download selected photos in bulk.

## API Contracts

- `GET /api/photos`
  - request: admin-authenticated request with admin mode, site/round context, and filter queries
  - response: contextual photo rows plus capabilities used by the review toolbar
- `POST /api/photos/upload`
  - request: multipart file upload with admin review context
  - response: uploaded photo metadata ready for the refreshed review grid
- `POST /api/photos/download`
  - request: selected photo ids and current admin review context
  - response: binary download bundle or partial-failure-aware stream response

## Server Touchpoints

- `app/api/photos/route.ts`
- `app/api/photos/upload/route.ts`
- `app/api/photos/download/route.ts`
- `server/photos/service.ts`
- `server/photos/album.ts`

## Performance Guardrails

- Review photo list fetch
  - target: <= 3000ms, <= 1500000 bytes
  - cache: list state stays query-scoped; refresh in place instead of remounting the review shell
  - invalidation: upload, asset mutation, route-context change, explicit reload
- Review photo upload
  - target: <= 45000ms
  - cache: no cache; successful upload triggers review-grid refresh
  - invalidation: every successful upload or replacement
- Review bulk download
  - target: <= 12000ms, <= 8000000 bytes
  - cache: no cache; preserve current selection during partial failures
  - invalidation: selection change, download retry

## Invariants

- Admin wrapper must preserve site/round context for the shared asset pipeline.
- Bulk actions operate on normalized selected assets.
- Upload, preview, and download continue to use the shared attachment routes.

## Failure Modes

- review context missing: block actions that require the missing context
- upload fails: keep current review grid and selections
- partial download failure: preserve selection and report failed assets

## Industry Variability

Allowed changes are review flags, photo taxonomies, and bulk-download naming.

## Composition Examples

- Construction-safety admin photo review
- Manufacturing defect-photo review
- Property-inspection evidence review

## Non-portable Areas

Domain-specific photo labels and review criteria belong in the industry pack.
