# Reverse Spec Template - <Feature Name>

## Purpose

- Why this feature exists.
- What business problem it solves.

## Source of Truth

- main screen or route
- supporting hooks
- supporting API client
- supporting types
- supporting server/API route if relevant

## Feature Goal

- What the user must be able to accomplish.

## User Role

- Primary role
- Secondary roles if any
- Preconditions

## Entry and Scope

- route or section location
- URL params or route params
- feature flags or role gates
- what is explicitly out of scope

## Data Contracts

### Main entities

- name
- required fields
- fields used for display
- fields used for mutation

### Read APIs

- method and path
- query params
- response shape

### Write APIs

- method and path
- request shape
- response shape

### Output/download/export APIs

- file downloads
- exports
- print/document endpoints

## Caching and Persistence

- browser storage rules
- TTL
- request key composition
- server snapshot rules
- optimistic vs full refresh behavior

## State Model

### Primary local state

- list explicit state variables

### Derived state

- list computed state
- list grouping, sorting, filtering, and display transforms

## Business Rules

### Validation rules

- required fields
- blocked actions
- validation messages

### Domain rules

- allowed transitions
- windowing rules
- uniqueness rules
- lifecycle rules

### Display rules

- label transforms
- fallback text
- placeholder cleanup

## UI Composition

### Main sections

- top-level regions
- major cards/tables/modals

### Modal and overlay structure

- open conditions
- close conditions
- action buttons

## Interaction Flows

### Initial load

1. ...

### Primary success flow

1. ...

### Secondary flows

1. ...

## Error Handling

- fetch errors
- mutation errors
- stale-state behavior
- abort behavior
- retry behavior

## Non-Obvious Implementation Notes

- hidden constraints
- surprising coupling
- temporary tradeoffs
- known weak spots

## Recovery Checklist

- [ ] route renders
- [ ] main data loads
- [ ] major mutation works
- [ ] invalid actions are blocked
- [ ] error state is visible
- [ ] cache rules are preserved
- [ ] export/download behavior works

## Verification

- typecheck
- targeted smoke tests
- domain-specific assertions
