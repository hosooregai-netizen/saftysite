# Reverse Spec Feature Inventory

## Purpose

- Track which ERP/admin recovery slices already have reconstruction-grade markdown.
- Make the relationship between top-level smoke contracts and reverse-spec slices explicit.
- Help us migrate away from umbrella reverse specs without breaking existing smoke ids.

## Status Legend

- `done`: reverse spec exists and is managed as a recovery slice
- `seed`: partial slice doc exists but still needs production-recovery depth
- `legacy`: older reverse spec still exists on disk but is not the primary managed slice doc anymore

## Managed Recovery Slices

| Top-level contract | Recovery slice | Main source | Status | Reverse spec | Notes |
| --- | --- | --- | --- | --- | --- |
| `admin-control-center` | `admin-overview-dashboard` | `features/admin/sections/overview/*` | `done` | [admin-overview-dashboard-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-overview-dashboard-reverse-spec.md) | Overview half of the shared control-center contract |
| `admin-control-center` | `admin-analytics-dashboard` | `features/admin/sections/analytics/*` | `done` | [admin-analytics-dashboard-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-analytics-dashboard-reverse-spec.md) | Basis-month, detail table, and export slice |
| `admin-control-center` | `admin-photo-admin-flow` | `features/admin/sections/photos/*`, shared photo album paths | `done` | [admin-photo-admin-flow-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-photo-admin-flow-reverse-spec.md) | Admin wrapper over shared photo pipeline |
| `site-report-list` | `site-report-index` | `features/site-reports/report-list/*`, mobile report list shell | `done` | [site-report-index-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/site-report-index-reverse-spec.md) | Shared report-index loading and list rendering |
| `site-report-list` | `tech-guidance-create-dialog` | `features/site-reports/report-list/useSiteReportCreateDialog.ts` | `done` | [tech-guidance-create-dialog-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/tech-guidance-create-dialog-reverse-spec.md) | Create dialog validation and direct navigation |
| `quarterly-report` | `quarterly-list-create` | `features/site-reports/quarterly-list/*` | `done` | [quarterly-report-list-create-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/quarterly-report-list-create-reverse-spec.md) | List and create entry slice before editor hydration |
| `quarterly-report` | `quarterly-editor-source-sync` | `features/site-reports/quarterly-report/useQuarterlySourceSync.ts` | `done` | [quarterly-editor-source-sync-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/quarterly-editor-source-sync-reverse-spec.md) | Existing-report resolution and source recalculation |
| `quarterly-report` | `quarterly-export-and-pdf-reuse` | `features/site-reports/quarterly-report/useQuarterlyDocumentActions.ts` | `done` | [quarterly-export-and-pdf-reuse-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/quarterly-export-and-pdf-reuse-reverse-spec.md) | Persist-before-export and PDF fallback |
| `mobile-link` | `mobile-link-session-shell` | `features/mobile/inspection-session/*` | `done` | [mobile-inspection-session-shell-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/mobile-inspection-session-shell-reverse-spec.md) | Mobile shell over shared inspection-session controller |
| `mobile-link` | `mobile-inspection-step7-doc7` | `features/mobile/inspection-session/MobileInspectionSessionStep7*.tsx` | `done` | [mobile-inspection-step7-doc7-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/mobile-inspection-step7-doc7-reverse-spec.md) | Step-7-specific editing slice under the same smoke id |

## Additional Reverse Specs

These docs still exist and remain useful, but they are not yet the primary managed recovery-slice set:

| Current doc | Notes |
| --- | --- |
| [admin-schedules-section-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-schedules-section-reverse-spec.md) | Good reference sample for a single workflow slice |
| [admin-report-open-legacy-bootstrap-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-report-open-legacy-bootstrap-reverse-spec.md) | Useful but not yet wired into the new slice manifest |
| [admin-reports-list-and-review-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-reports-list-and-review-reverse-spec.md) | Candidate next migration after the priority targets |
| [admin-sites-list-and-edit-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-sites-list-and-edit-reverse-spec.md) | Candidate next migration after the priority targets |
| [bad-workplace-report-composition-flow-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/bad-workplace-report-composition-flow-reverse-spec.md) | Existing composition doc outside the first migration wave |
| [photo-upload-and-attachment-flow-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/photo-upload-and-attachment-flow-reverse-spec.md) | Shared photo doc; admin photo management now has its own managed slice doc |
| [quarterly-report-composition-flow-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/quarterly-report-composition-flow-reverse-spec.md) | Legacy umbrella quarterly doc superseded by the managed quarterly slice set |
| [site-technical-guidance-report-list-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/site-technical-guidance-report-list-reverse-spec.md) | Legacy umbrella site-report doc superseded by index/create slices |
| [worker-calendar-schedule-board-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/worker-calendar-schedule-board-reverse-spec.md) | Existing standalone slice outside the first migration wave |

## How To Use This Inventory

1. Identify the affected top-level contract.
2. Find the matching recovery slice row.
3. Update that slice’s reverse spec instead of reopening an umbrella doc.
4. Add or expand a managed slice row only when the behavior really needs a separate recovery unit.
