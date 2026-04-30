# ERP Proof: Worker Headquarter Site Registration

## Covered Behavior

- Worker home shows assigned headquarters, including headquarters with no registered sites.
- A worker can open the assigned headquarter card and register a site under that headquarter.
- Worker site hub exposes a site information edit path.
- The worker form keeps ERP-facing fields close to the legacy system: headquarter numbers, site address, labor office, project amount/period, client, manager, report email, and contract fields.
- Legacy `maintenance` contract values remain read-compatible and are not offered as a new selection.

## Verification

- `npm run lint`
- `npx tsc --noEmit`
