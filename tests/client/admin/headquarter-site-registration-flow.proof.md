# Admin Proof: Headquarter Site Registration Flow

## Covered Behavior

- The admin site editor supports searching for an existing headquarter.
- The same modal can create a new headquarter and immediately use it for the site form.
- The selected headquarter detail view exposes a headquarter-level worker assignment action.
- New contract type choices exclude `maintenance`, while legacy values display as `유지보수(기존)`.
- Site editor/export labels use `사업장관리번호` and `사업개시번호` instead of duplicate site-code terminology.

## Verification

- `npm run lint`
- `npx tsc --noEmit`
