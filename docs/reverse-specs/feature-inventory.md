# Reverse Spec Feature Inventory

## Purpose

- Track which ERP/admin features already have reconstruction-grade markdown.
- Help us expand feature coverage one slice at a time.

## Status Legend

- `done`: reverse spec exists and is usable
- `seed`: sample or partial notes exist but need expansion
- `todo`: not documented yet

## Admin / Controller

| Feature | Main source | Status | Notes |
| --- | --- | --- | --- |
| Admin schedules board | `features/admin/sections/schedules/SchedulesSection.tsx` | `done` | First reconstruction-grade sample |
| Admin reports list and review flow | `features/admin/sections/reports/*` | `done` | [admin-reports-list-and-review-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-reports-list-and-review-reverse-spec.md) |
| Admin overview dashboard | `features/admin/sections/overview/*` | `done` | [admin-overview-dashboard-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-overview-dashboard-reverse-spec.md) |
| Admin site list and site detail shell | `features/admin/sections/sites/*` | `done` | [admin-sites-list-and-edit-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-sites-list-and-edit-reverse-spec.md) |
| Admin report-open legacy bootstrap | `app/admin/report-open/*`, report bootstrap helpers | `done` | [admin-report-open-legacy-bootstrap-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-report-open-legacy-bootstrap-reverse-spec.md) |

## Worker / ERP

| Feature | Main source | Status | Notes |
| --- | --- | --- | --- |
| Mobile inspection session shell | `app/sessions/*`, `features/inspection/*` | `done` | [mobile-inspection-session-shell-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/mobile-inspection-session-shell-reverse-spec.md) |
| Inspection step 7 issue editor | `features/inspection/*step7*` | `done` | [mobile-inspection-step7-doc7-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/mobile-inspection-step7-doc7-reverse-spec.md) |
| Worker schedule board | `app/me/*`, worker schedule features | `done` | [worker-calendar-schedule-board-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/worker-calendar-schedule-board-reverse-spec.md) |
| Photo upload and attachment flow | photo upload features and APIs | `done` | [photo-upload-and-attachment-flow-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/photo-upload-and-attachment-flow-reverse-spec.md) |
| Quarterly report composition flow | quarterly report features | `done` | [quarterly-report-composition-flow-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/quarterly-report-composition-flow-reverse-spec.md) |
| Bad workplace report composition flow | bad workplace report features | `done` | [bad-workplace-report-composition-flow-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/bad-workplace-report-composition-flow-reverse-spec.md) |
| Site technical guidance report list and creation flow | site report list and create helpers | `done` | [site-technical-guidance-report-list-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/site-technical-guidance-report-list-reverse-spec.md) |

## How To Use This Inventory

1. Pick one row.
2. Copy [reverse-spec-template.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/reverse-spec-template.md).
3. Fill it from source files and runtime behavior.
4. Change the row status from `todo` to `done`.
5. Add links to the completed reverse spec.

## Current Sample

- [admin-schedules-section-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-schedules-section-reverse-spec.md)
