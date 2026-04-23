# Batch 57 - Admin Content Direct Upload Alignment

## Scope

- restore direct browser upload support for large admin content assets and photo uploads after the upstream revert
- keep PDF route changes from the latest `origin/main` sync out of this batch
- align local dev defaults and admin helper text with the direct-upload transport rules

## What Changed

- updated `features/admin/sections/content/ContentItemsSection.tsx`
- updated `lib/safetyApi/assets.ts`
- updated `lib/photos/apiClient.ts`
- added `lib/safetyApi/uploadTransport.ts`
- updated `lib/safetyApi/upstream.ts`
- updated `scripts/rundev.mjs`
- updated `README.md`

## Why

- `origin/main` restored PDF download work but also reverted the newer large-upload direct path
- Vercel proxy uploads still hit the 4.5MB body limit, so large content/photo uploads need a dedicated HTTPS upload origin
- the admin content form should show the same transport warning text that the upload clients enforce
- local `rundev` should default the upload origin alongside the existing asset origin so the upload path can be exercised during development

## Validation

- `npx tsx --test lib/safetyApi/uploadTransport.test.ts lib/safetyApi/assets.test.ts lib/photos/apiClient.test.ts`
- `npx eslint features/admin/sections/content/ContentItemsSection.tsx lib/photos/apiClient.ts lib/photos/apiClient.test.ts lib/safetyApi/assets.ts lib/safetyApi/assets.test.ts lib/safetyApi/uploadTransport.ts lib/safetyApi/uploadTransport.test.ts lib/safetyApi/upstream.ts scripts/rundev.mjs`

## Notes

- use the same HTTPS origin for both `NEXT_PUBLIC_SAFETY_ASSET_BASE_URL` and `NEXT_PUBLIC_SAFETY_UPLOAD_UPSTREAM_BASE_URL`
- that origin must serve `/uploads/...`, `/content-items/assets/upload`, and `/photo-assets/upload`
- PDF download/export changes pulled from `origin/main` remain untouched in this batch
