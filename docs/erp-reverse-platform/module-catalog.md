# ERP Reverse Module Catalog

## Purpose

This inventory tracks the reusable ERP reverse platform separately from the recovery-slice inventory
in `docs/reverse-specs/feature-inventory.md`.

## Platform Primitives

| Module ID | Category | Source slices | Portability | Notes |
| --- | --- | --- | --- | --- |
| `platform-dashboard.snapshot-cache` | `platform-primitive` | `admin-overview-dashboard`, `admin-analytics-dashboard` | `core` | Shared snapshot/cache lifecycle for dashboard modules |
| `platform-work-item.collection-shell` | `platform-primitive` | `site-report-index` | `core` | Shared list/filter/sort shell for report-like work items |
| `platform-asset.attachment-pipeline` | `platform-primitive` | `admin-photo-admin-flow`, `mobile-link-session-shell` | `adaptable` | Attachment upload/preview/download lifecycle |
| `platform-document.output-pipeline` | `platform-primitive` | `quarterly-export-and-pdf-reuse` | `adaptable` | Persist-before-export and document reuse/output contract |

## Business Modules

| Module ID | Source slices | Portability | Output artifacts | Notes |
| --- | --- | --- | --- | --- |
| `operations-dashboard.queue-overview` | `admin-overview-dashboard` | `adaptable` | dashboard card set, export sheet | Queue overview with fallback merge and cached first paint |
| `operations-dashboard.analytics` | `admin-analytics-dashboard` | `adaptable` | summary cards, detail table, export sheet | Analytics summary/detail with basis-month switching |
| `work-item.index-and-filter` | `site-report-index` | `core` | index screen, filter toolbar | List/index shell that can host many industries |
| `work-item.create-dialog` | `tech-guidance-create-dialog` | `adaptable` | create dialog, redirect intent | Typed creation entry that hands off to a downstream editor |
| `periodic-report.source-sync` | `quarterly-editor-source-sync` | `adaptable` | source selection modal, editor hydration | Existing-report resolution and source recalculation |
| `document-output.export-and-reuse` | `quarterly-export-and-pdf-reuse` | `adaptable` | export command, PDF reuse link | Persist-before-export and document fallback |
| `asset-review.photo-workbench` | `admin-photo-admin-flow` | `adaptable` | review grid, multi-download, upload path | Review-oriented wrapper over shared attachment pipeline |

## Adapters, Packs, and Compositions

| Type | ID | Notes |
| --- | --- | --- |
| Adapter | `safety-upstream-normalization` | Normalizes legacy safety payloads into platform entities |
| Industry Pack | `construction-safety-core` | Construction-safety rules, terms, and compliance defaults |
| Composition | `aidlc-control-tower` | Example product composition that assembles the starter modules |

## Review Policy

- Published modules require current source slices and current provenance.
- `core` modules are eligible for cross-industry import without business-flow changes.
- `adaptable` modules require industry-pack policy or vocabulary overrides but should keep the same
  dominant state model.
- `industry-bound` modules can exist later, but they should not be advertised as generic catalog
  entries.

