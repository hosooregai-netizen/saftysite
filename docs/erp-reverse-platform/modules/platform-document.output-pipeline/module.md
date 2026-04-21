# Platform Primitive: Document Output Pipeline

Module ID: `platform-document.output-pipeline`

## Purpose

Provide a shared document output lifecycle for save-before-export, rendered output reuse, and
fallback-to-existing-file behavior.

## User Roles

- editor user exporting a generated document
- reviewer reopening a previously rendered artifact
- module author who needs a generic document-output primitive

## Entry Conditions

Enter when a workflow needs to persist draft state before exporting a document or reusing the last
successful output artifact.

## State Model

Owns draft persistence status, export intent, output artifact availability, and fallback selection.

## User Journeys

1. Persist the latest editable state.
2. Trigger document export.
3. Reuse the last successful artifact if regeneration is not needed.

## API Contracts

- `POST /api/safety/reports/upsert`
  - request: authenticated proxy request carrying the latest draft and fresh `updatedAt`
  - response: persisted report payload used as the export source of truth
- `POST /api/documents/quarterly/pdf`
  - request: document-generation request with current report body and resolved site/context
  - response: generated binary document or a documented fallback path

## Server Touchpoints

- `app/api/safety/[...path]/route.ts`
- external upstream `FastAPI /api/v1/reports/upsert`
- `app/api/documents/quarterly/pdf/route.ts`
- `server/documents/quarterly/requestResolver.ts`

## Performance Guardrails

- Persist draft before export
  - target: <= 8000ms, <= 500000 bytes
  - cache: no cache; successful persistence becomes the export source of truth
  - invalidation: every export attempt, every explicit save
- Binary document generation
  - target: <= 12000ms, <= 8000000 bytes
  - cache: reuse the last successful rendered artifact when regeneration is unnecessary
  - invalidation: draft save, template change, document-option change

## Invariants

- Export must not run against stale editor state.
- Existing successful artifacts stay reusable until explicitly replaced.
- Output actions operate on normalized persisted state rather than transient UI fragments.

## Failure Modes

- save fails: abort export and surface the persistence failure first
- export render fails: preserve prior output artifact if one exists
- artifact metadata missing: degrade to explicit re-render path

## Industry Variability

Allowed override points:

- `document.templateSelection`
- `document.outputNaming`
- `document.approvalStampRules`

## Composition Examples

- `document-output.export-and-reuse` composes this primitive for quarterly reports.
- Any ERP domain that produces regulated PDFs or generated forms can reuse the same primitive.

## Non-portable Areas

Document template file formats and external rendering engines stay outside this primitive.
