# ERP Reverse + Server Introduction

## Purpose

This document explains the reusable ERP reverse layer together with the current server/API structure
so a new reader can understand:

- what each reverse artifact is for
- how the browser reaches the current server code
- where request/response contracts live today
- where performance guardrails are enforced today
- how to update the docs when code changes

This file is the easiest entrypoint for understanding the whole system.

If you want the presentation version first, use:

- [erp-reverse-platform-introduction.pptx](</Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/erp-reverse-platform-introduction.pptx>)
- [erp-reverse-platform-full-reference.pptx](</Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/erp-reverse-platform-full-reference.pptx>)

The short intro deck is for fast onboarding.
The full-reference deck is for going through every Markdown document in `docs/erp-reverse-platform/`
with one slide per document.

## One-Line Summary

Use the current-product `recovery slice` docs to recover today's app faithfully, and use the
`docs/erp-reverse-platform/` catalog to extract reusable ERP modules with explicit API contracts,
server touchpoints, and performance budgets.

## Read This In Order

1. [docs/guardrails/aidlc-guardrails-overview.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/guardrails/aidlc-guardrails-overview.md:1)
   Explains the current guardrail system for top-level feature contracts and recovery slices.
2. [docs/reverse-specs/README.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/README.md:1)
   Explains how current-product recovery specs work.
3. [docs/erp-reverse-platform/README.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/README.md:1)
   Explains the reusable reverse platform layer.
4. [docs/current-system-architecture.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/current-system-architecture.md:1)
   Explains the current routes, APIs, and collections.

If you only remember one split, remember this:

- `docs/reverse-specs/`
  - recover the current product
- `docs/erp-reverse-platform/`
  - extract reusable ERP modules for another industry or tenant

## The Two Reverse Layers

### 1. Current-Product Recovery Layer

Main files:

- [docs/reverse-specs/README.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/README.md:1)
- [docs/reverse-specs/feature-inventory.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/feature-inventory.md:1)
- [tests/client/contracts/featureContractMetadata.json](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/client/contracts/featureContractMetadata.json:1)

Purpose:

- protect the current codebase from regression
- keep one reverse spec per `recovery slice`
- bind guarded files to top-level smoke contracts and reverse specs

Unit of organization:

- top-level feature contract
- recovery slice

Typical question it answers:

- "If this screen breaks, how do we rebuild the current behavior exactly?"

### 2. Reusable ERP Reverse Platform

Main files:

- [docs/erp-reverse-platform/module-catalog.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/module-catalog.md:1)
- [docs/erp-reverse-platform/provenance/recovery-slice-map.json](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/provenance/recovery-slice-map.json:1)
- [scripts/erpReversePlatform.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/erpReversePlatform.ts:1)
- [scripts/validateErpReversePlatform.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/validateErpReversePlatform.ts:1)

Purpose:

- extract reusable ERP capabilities
- keep them independent from current route names or current page names
- make them importable into another industry ERP

Unit of organization:

- platform primitive
- business module
- industry pack
- composition

Typical question it answers:

- "If we rebuild this as a manufacturing ERP or hospital ERP, what module can we reuse and what can vary?"

## Current Request Flow

The simplest mental model is:

```text
browser feature / screen
  -> feature hook / client api helper
  -> Next app/api route
     -> either a local server helper
     -> or /api/safety proxy to external FastAPI
  -> normalized response returns to the client
  -> reverse module describes the stable capability boundary
```

In this repo the main server-side shapes are:

- `app/api/safety/[...path]/route.ts`
  - generic proxy from Next to external safety FastAPI
- `app/api/admin/**`
  - Next-owned admin routes that may use local cache/snapshot helpers
- `app/api/photos/**`
  - Next-owned photo routes backed by local server photo helpers
- `app/api/documents/**`
  - Next-owned document generation routes backed by local document helpers
- `server/**`
  - local server-side orchestration, normalization, cache, and document/photo logic

## Server File Guide

### Proxy Entry

[app/api/safety/[...path]/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/safety/[...path]/route.ts:1)

Role:

- takes browser calls under `/api/safety/*`
- proxies them to external FastAPI `/api/v1/*`
- triggers local invalidation or best-effort refresh for some admin caches after writes

Use this when:

- the feature is fundamentally backed by the external safety ERP backend
- you need to understand which client requests are just proxied upstream

### Admin Dashboard Routes

- [app/api/admin/dashboard/overview/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/admin/dashboard/overview/route.ts:1)
- [app/api/admin/dashboard/analytics/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/admin/dashboard/analytics/route.ts:1)
- [app/api/admin/dashboard/analytics/month-detail/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/admin/dashboard/analytics/month-detail/route.ts:1)
- [app/api/admin/dashboard/analytics/detail/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/admin/dashboard/analytics/detail/route.ts:1)

Supporting server files:

- [server/admin/overviewRouteCache.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/admin/overviewRouteCache.ts:1)
- [server/admin/overviewPolicyOverlay.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/admin/overviewPolicyOverlay.ts:1)
- [server/admin/analyticsSnapshot.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/admin/analyticsSnapshot.ts:1)

Role:

- compose admin-facing overview/analytics payloads
- apply route-level caching and fallback behavior
- normalize payloads before the client derives cards and tables

### Photo Routes

- [app/api/photos/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/photos/route.ts:1)
- [app/api/photos/upload/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/photos/upload/route.ts:1)
- [app/api/photos/download/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/photos/download/route.ts:1)

Supporting server files:

- [server/photos/service.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/photos/service.ts:1)
- [server/photos/album.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/photos/album.ts:1)

Role:

- load contextual photo rows
- upload assets
- build download bundles or streams
- preserve current admin/site/round context through the whole photo pipeline

### Quarterly Document Routes

- [app/api/documents/quarterly/hwpx/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/documents/quarterly/hwpx/route.ts:1)
- [app/api/documents/quarterly/pdf/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/documents/quarterly/pdf/route.ts:1)

Supporting server files:

- [server/documents/quarterly/requestResolver.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/documents/quarterly/requestResolver.ts:1)
- [server/documents/quarterly/hwpx.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/documents/quarterly/hwpx.ts:1)
- [server/documents/quarterly/mergedTemplateRuntime.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/documents/quarterly/mergedTemplateRuntime.ts:1)

Role:

- resolve document generation input from the current report and site context
- generate HWPX/PDF output
- handle fallback behavior when PDF conversion cannot complete cleanly

### Live API Budget Probe

[scripts/probeSafetyApiLive.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/probeSafetyApiLive.ts:1)

Role:

- logs into a live environment
- calls representative ERP/admin APIs
- records latency and response-size metrics
- optionally fails when budgets are exceeded

This is the current operational source for API performance budgets such as:

- admin overview: `<= 7000ms`, `<= 2500000 bytes`
- admin analytics summary: `<= 1500ms`, `<= 1000000 bytes`
- site reports full: `<= 8000ms`, `<= 3000000 bytes`
- report by key: `<= 2500ms`, `<= 1500000 bytes`

## What Every Published Reverse Module Must Contain Now

Every published module in `docs/erp-reverse-platform/modules/*` should now tell you all of these:

1. What capability it owns
2. Which recovery slices prove that capability today
3. Which API endpoints the capability currently uses
4. What the request shape looks like
5. What the response shape looks like
6. Which server or route files currently implement that contract
7. What performance budget each important API should stay under
8. What can change by industry pack and what must remain stable

In practice, that means every module has:

- `module.md`
  - human-readable playbook
- `module.manifest.json`
  - machine-readable metadata

Important manifest fields:

- `sourceSlices`
- `apiContracts`
- `serverTouchpoints`
- `performanceGuardrails`
- `industryOverridesAllowed`
- `tenantConfigSurface`

## How To Read A Module

The easiest way is to read each module in this order:

1. `Purpose`
2. `State Model`
3. `API Contracts`
4. `Server Touchpoints`
5. `Performance Guardrails`
6. `Invariants`
7. `Industry Variability`

That order gives you:

- what the module does
- how it talks to the current backend
- which files to inspect next
- what must not regress

## Representative Examples

### Example 1: Overview Dashboard

Reusable module:

- [operations-dashboard.queue-overview/module.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/modules/operations-dashboard.queue-overview/module.md:1)

Current-product evidence:

- [admin-overview-dashboard-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-overview-dashboard-reverse-spec.md:1)

Current server/API:

- [app/api/admin/dashboard/overview/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/admin/dashboard/overview/route.ts:1)
- [server/admin/overviewRouteCache.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/admin/overviewRouteCache.ts:1)

What this means:

- the current app has an overview screen
- the reusable ERP idea is not "that screen"
- the reusable ERP idea is "a queue-oriented operations overview with cache and fallback merge"

### Example 2: Quarterly Source Sync

Reusable module:

- [periodic-report.source-sync/module.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/modules/periodic-report.source-sync/module.md:1)

Current-product evidence:

- [quarterly-editor-source-sync-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/quarterly-editor-source-sync-reverse-spec.md:1)

Current server/API:

- [app/api/safety/[...path]/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/safety/[...path]/route.ts:1)
- external FastAPI `reports/by-key`, `reports/site/{siteId}/quarterly-summary-seed`

What this means:

- the current app's quarterly editor is one implementation
- the reusable ERP idea is "a periodic report editor that rehydrates from source reports and recalculates derived sections"

### Example 3: Photo Review Workbench

Reusable module:

- [asset-review.photo-workbench/module.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/modules/asset-review.photo-workbench/module.md:1)

Current-product evidence:

- [admin-photo-admin-flow-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-photo-admin-flow-reverse-spec.md:1)

Current server/API:

- [app/api/photos/route.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/app/api/photos/route.ts:1)
- [server/photos/service.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/photos/service.ts:1)
- [server/photos/album.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/server/photos/album.ts:1)

What this means:

- the current admin photo page is not the reusable unit
- the reusable unit is "an attachment review workbench with upload, preview, selection, and bulk download"

## How To Update This System When Code Changes

### If only current-product behavior changed

Update:

- the recovery slice reverse spec in `docs/reverse-specs/`
- the guarded metadata or smoke contracts if needed

You do not always need to update the reusable ERP module.

### If the reusable capability changed

Update:

- the recovery slice reverse spec
- the corresponding module doc
- the corresponding module manifest
- the provenance map if the evidence-to-module relationship changed

### If the server/API changed

Update these together:

- `API Contracts` section in the module doc
- `apiContracts` in the module manifest
- `Server Touchpoints` section in the module doc
- `serverTouchpoints` in the module manifest
- `Performance Guardrails` section in the module doc
- `performanceGuardrails` in the module manifest

And then rerun:

```bash
npm run validate:recovery-slices
npm run validate:erp-reverse-platform
```

If the change touches live-path performance expectations, also rerun:

```bash
npm run verify:api-live-budgets
```

## Practical Rule Of Thumb

When you are unsure where to write something:

- "How the current screen behaves exactly"
  - write it in `docs/reverse-specs/`
- "What reusable module we can carry to another ERP"
  - write it in `docs/erp-reverse-platform/modules/`
- "Which Next route or local server file currently serves the data"
  - write it in `API Contracts` and `Server Touchpoints`
- "How fast or how large the API is allowed to be"
  - write it in `Performance Guardrails`

## Current Limit

This system is now much easier to understand than before, but it is still a starter wave.

What is already good:

- recovery slices are separated from reusable modules
- published modules now carry API contract and performance information
- there is a server-aware introduction file for onboarding

What still needs expansion later:

- more modules beyond the first high-value set
- richer publish/review lifecycle beyond validation-time freshness
- broader live probe coverage if more APIs become critical
