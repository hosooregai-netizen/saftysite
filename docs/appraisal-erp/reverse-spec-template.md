# Appraisal Reverse Spec Template

## Purpose

- State why the feature exists.
- State what operational problem it solves for an appraisal firm.
- State whether the dominant goal is intake, scheduling, authoring, review, delivery, or finance.

## Source Mapping

- List the current safety-ERP reverse spec or implementation pattern that this appraisal feature borrows from.
- Explicitly state which nouns are being replaced.
- Explicitly state which safety-only semantics are being removed.
- If the feature is greenfield, state that it is new to appraisal v1.

Recommended prompts:

- base shell pattern:
- reused list or modal pattern:
- renamed entities:
- removed semantics:
- new appraisal-only logic:

## Feature Goal

- Define the user-visible outcome.
- Define the minimum successful result.

## User Role

- Primary role
- Secondary roles
- Preconditions

## Entry and Scope

- Route or section location
- Query params or route params
- Role gates
- Explicit out-of-scope items

## Data Contracts

### Main entities

- entity names
- required identifiers
- fields used for display
- fields used for mutation
- fields used for export or document output

### Read APIs

- method and path
- supported filters
- response groups

### Write APIs

- method and path
- mutation payload
- optimistic or refresh behavior

### Output or download APIs

- document download
- bundle export
- attachment download

## Caching and Persistence

- session cache rules
- request-key composition
- autosave or draft rules
- optimistic update rules

## State Model

### Primary local state

- explicit state variables

### Derived state

- grouped rows
- filtered rows
- status banners
- gating booleans

## Business Rules

### Identifier rules

- case number and order number formats
- subject numbering
- report version numbering

### Domain rules

- appraisal purpose, base date, due date
- review and approval gating
- delivery and receipt rules
- invoice and settlement rules
- attachment-to-document linkage rules

### Validation rules

- required fields
- blocked actions
- validation messages

## UI Composition

### Main sections

- cards
- tables
- editors
- side panels

### Modal and overlay structure

- open conditions
- close conditions
- primary actions

## Interaction Flows

### Initial load

1. ...

### Primary success flow

1. ...

### Secondary flows

1. ...

## Error Handling

- fetch failure handling
- mutation failure handling
- stale-state handling
- export or attachment fallback handling

## Non-Obvious Implementation Notes

- coupling that must survive a rewrite
- lifecycle rules shared with other docs
- known phase-2 boundaries

## Recovery Checklist

- [ ] Purpose and entry are clear
- [ ] Source Mapping is explicit
- [ ] Data Contracts are reconstructable
- [ ] State Model is separated into primary and derived state
- [ ] Business Rules include identifier, approval, delivery, invoice, and attachment rules
- [ ] Interaction Flows are numbered
- [ ] Recovery behavior is testable

## Verification

- type or schema checks
- targeted smoke flow
- lifecycle consistency check against `domain-model.md`

