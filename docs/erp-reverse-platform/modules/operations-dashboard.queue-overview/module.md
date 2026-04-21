# Business Module: Operations Dashboard Queue Overview

Module ID: `operations-dashboard.queue-overview`

## Purpose

Expose a queue-oriented operations overview that merges remote snapshots with local fallback state and
keeps export aligned with the visible normalized rows.

## User Roles

- controller or operations admin monitoring queue health
- manager exporting the visible overview state

## Entry Conditions

Enter from an operations dashboard landing shell where queue summary is the dominant overview task.

## State Model

Builds on `platform-dashboard.snapshot-cache` and adds queue cards, grouped row sections, and export
intent bound to the visible normalized overview model.

## User Journeys

1. Open the overview shell.
2. See queue sections from cache or fallback model.
3. Refresh remote data in place.
4. Export the current normalized queue view.

## API Contracts

- `GET /api/admin/dashboard/overview`
  - request: admin-authenticated request, no body, optional cached session bootstrap
  - response: `SafetyAdminOverviewResponse`-style overview payload normalized into queue cards and rows

## Server Touchpoints

- `app/api/admin/dashboard/overview/route.ts`
- `app/api/admin/dashboard/overview/routeFallbacks.ts`
- `server/admin/overviewPolicyOverlay.ts`
- `server/admin/overviewRouteCache.ts`

## Performance Guardrails

- Overview queue snapshot
  - target: <= 7000ms, <= 2500000 bytes
  - cache: admin session cache and normalized overview snapshot reuse
  - invalidation: report dispatch/save, site changes, assignment changes, explicit overview refresh

## Invariants

- Refresh merges per section instead of replacing the whole overview blindly.
- Export reflects the currently visible normalized rows.
- Queue sections remain navigable even when one subsection refresh fails.

## Failure Modes

- one queue source fails: preserve other sections and surface scoped error copy
- export requested while refresh is in flight: use the currently normalized visible state
- missing cache and failed remote load: show explicit empty/error first-load shell

## Industry Variability

Allowed changes are queue definitions, per-card metrics, and escalation labels. The overall
queue-overview state model should stay intact.

## Composition Examples

- Construction-safety control towers can show overdue rounds, document queues, or photo review debt.
- Manufacturing ERP can reuse the same module for audit backlogs or defect queues.

## Non-portable Areas

Exact queue labels and some export columns are industry-specific and should remain in pack overrides.
