# Business Module: Work Item Create Dialog

Module ID: `work-item.create-dialog`

## Purpose

Provide a typed creation entry dialog that validates creation prerequisites and hands the user off to
the correct downstream editor or workflow.

## User Roles

- worker or coordinator creating a new work item
- supervisor who needs a safe create path with explicit prerequisites

## Entry Conditions

Enter from an index or hub screen when the user starts a create intent for a new work item.

## State Model

Owns dialog visibility, creation input state, validation state, and the resolved destination intent.

## User Journeys

1. Open the create dialog.
2. Validate required context and inputs.
3. Create the target record or reserve the draft shell.
4. Redirect into the downstream editor.

## API Contracts

- `POST /api/safety/reports/upsert`
  - request: authenticated proxy request carrying site id, report date, title, report kind, and draft payload
  - response: saved report identity, route key, and the persisted draft shell used for redirect

## Server Touchpoints

- `app/api/safety/[...path]/route.ts`
- external upstream `FastAPI /api/v1/reports/upsert`

## Performance Guardrails

- Work-item create submit
  - target: <= 8000ms, <= 500000 bytes
  - cache: no read cache; success must invalidate the site report index cache
  - invalidation: successful create, create retry after failure

## Invariants

- Validation must complete before the dialog hands off to the editor.
- Destination intent is resolved from normalized context rather than inline branching in the UI.
- Failed creation keeps the dialog state recoverable.

## Failure Modes

- missing site or owner context: block creation with explicit guidance
- create request fails: keep the dialog open with the entered values
- downstream route missing: preserve draft reservation and report the handoff failure

## Industry Variability

Allowed changes are field copy, create presets, and destination editor mapping.

## Composition Examples

- Construction-safety uses it for technical-guidance report creation.
- Other ERP domains can use the same pattern for incident, audit, or request creation.

## Non-portable Areas

Specific editor route names and some form labels are not portable.
