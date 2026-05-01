# ERP Site Contact Direct Recipient Proof

## Expected

- Worker site information editing uses the same multi-contact payload shape as admin site editing.
- Technical guidance direct-delivery recipient defaults to the primary site manager name.
- Schedule selection and work progress screens do not edit site managers.

## Validation

- `npx tsc --noEmit`
- `npm run lint`

## Result

- TypeScript passed.
- Lint reported existing warnings only.
