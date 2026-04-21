# Business Module: Document Output Export And Reuse

Module ID: `document-output.export-and-reuse`

## Purpose

Provide a business-facing document action surface that exports the latest saved state and reuses the
most recent successful output when regeneration is unnecessary.

## User Roles

- editor who exports a regulated or customer-facing document
- reviewer reopening the last valid output

## Entry Conditions

Enter from a document editor or summary screen where output actions are visible.

## State Model

Builds on `platform-document.output-pipeline` and adds business-level action copy, output reuse
rules, and user-facing export affordances.

## User Journeys

1. Save the current draft.
2. Export the document.
3. Reopen the existing rendered output when it is still valid.

## API Contracts

- `POST /api/documents/quarterly/hwpx`
  - request: report body plus site/context resolved from the current quarterly draft
  - response: generated HWPX blob and filename metadata
- `POST /api/documents/quarterly/pdf`
  - request: same persisted report body and site/context
  - response: generated PDF blob or fallback HWPX response with notice semantics

## Server Touchpoints

- `app/api/documents/quarterly/hwpx/route.ts`
- `app/api/documents/quarterly/pdf/route.ts`
- `server/documents/quarterly/requestResolver.ts`
- `server/documents/quarterly/hwpx.ts`

## Performance Guardrails

- HWPX generation
  - target: <= 12000ms, <= 8000000 bytes
  - cache: reuse persisted draft state; do not rerender against stale in-memory form data
  - invalidation: save-before-export, template change
- PDF generation
  - target: <= 12000ms, <= 8000000 bytes
  - cache: prefer the last reusable artifact when regeneration is not necessary
  - invalidation: save-before-export, PDF option change, fallback-to-HWPX notice path

## Invariants

- Export always follows the latest successful persistence step.
- Existing output artifacts remain user-visible and reusable.
- The output action surface reflects whether the current state is reusable or needs regeneration.

## Failure Modes

- save fails: export action blocks and reports the save issue first
- export render fails: prior reusable artifact stays available
- artifact metadata is stale: surface explicit regenerate path

## Industry Variability

Allowed changes are template selection, output naming, and approval-stamp rules.

## Composition Examples

- Quarterly report PDF/export flows
- Audit certificate generation
- Shipment summary export with prior-document reuse

## Non-portable Areas

Renderer implementation details and file-storage systems are not portable.
