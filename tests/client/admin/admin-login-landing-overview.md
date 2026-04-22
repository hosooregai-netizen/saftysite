# Admin Proof: Login Lands On Overview Dashboard

## Covered behavior

- an admin or controller account that logs in from the shared entry flow lands on `/admin?section=overview`
- the temporary post-login redirect is consumed once, so later admin navigation still follows the normal route guards
- opening `/admin` after the redirect still renders the admin shell instead of bouncing through the worker calendar

## Manual verification notes

- log in with an admin-capable account from `/`
- confirm the first redirect after login resolves to `/admin?section=overview`
- refresh the page or revisit `/admin` and confirm the admin dashboard stays available without repeating a worker redirect
