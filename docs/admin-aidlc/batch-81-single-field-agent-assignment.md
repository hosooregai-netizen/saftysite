# Batch 81: Single Field Agent Assignment

## Scope

- Admin site field-agent assignment modal.
- Admin headquarter field-agent assignment modal.
- Admin dashboard assignment state updates.

## What Changed

- Headquarter assignment now loads directory lookup users when the modal opens, so field agents are available even when the headquarters section has not loaded full dashboard users.
- Site and headquarter assignment modals present one active assignee and show replacement actions when another field agent is selected.
- Admin assignment state removes older active site assignments when a replacement assignment is returned.

## Verification

- `npm run lint -w @saftysite/web`
- `tests/client/admin/single-field-agent-assignment.proof.md`
