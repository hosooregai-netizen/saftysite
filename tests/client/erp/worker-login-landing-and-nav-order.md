# ERP Proof: Worker Login Lands On Calendar And Prioritizes Schedule Navigation

## Covered behavior

- a worker account that logs in from the shared entry flow lands on `/calendar`
- the desktop worker menu renders `내 일정` before `사업장/현장` and `메일함`
- the mobile worker bottom tab order renders `일정`, `사업장/현장`, `메일함`

## Manual verification notes

- log in with a worker account from `/`
- confirm the first redirect after login resolves to `/calendar`
- open the worker menu and confirm `내 일정` is the first top-level entry
- open the mobile worker shell and confirm the left-most bottom tab is `일정`
