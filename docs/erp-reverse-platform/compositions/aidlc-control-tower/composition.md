# Composition: AIDLC Control Tower

Composition ID: `aidlc-control-tower`

## Purpose

Provide an example product composition that assembles the starter reverse modules into a concrete
construction-safety ERP bundle.

## Industry Pack

This composition extends `construction-safety-core`.

## Enabled Modules

- `operations-dashboard.queue-overview`
- `operations-dashboard.analytics`
- `work-item.index-and-filter`
- `work-item.create-dialog`
- `periodic-report.source-sync`
- `document-output.export-and-reuse`
- `asset-review.photo-workbench`

## Adapter Bindings

- `safety-upstream-normalization`

## Tenant Bindings

- `dashboard.defaultLandingSection`
- `dashboard.hiddenCards`
- `analytics.defaultBasisPeriod`
- `workItem.defaultCreateTarget`
- `periodicReport.defaultTemplate`
- `periodicReport.autoReusePrevious`
- `document.exportBranding`
- `photoReview.defaultFilter`

## Navigation Layout

- `admin/control-center` -> dashboard overview + analytics + photo review
- `sites/[siteKey]` -> work-item index + create dialog
- `sites/[siteKey]/quarterly/[quarterKey]` -> periodic report source sync + document output

