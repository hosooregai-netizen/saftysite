# ERP Proof: Site Entry Hub — Site Main Panel Embed

## Expected Behavior

- after signing in as a worker with an assigned site, opening the site entry hub shows the shared site main summary layout
- the hub does not show the admin `현장 정보 수정` button in the panel header
- if the assigned safety site cannot be resolved, the hub shows the empty-state copy instead of a broken layout

## Manual Check

- log in as a worker, open an assigned site from the site list
- confirm the hub renders without the admin edit action
- optional: verify loading and error empty states if upstream data is unavailable
