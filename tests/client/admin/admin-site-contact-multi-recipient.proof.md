# Admin Site Contact Multi Recipient Proof

## Expected

- The admin site edit modal can submit multiple `site_managers` and `client_contacts`.
- Exactly one site manager is treated as primary and mirrored into legacy report recipient fields.
- Site detail shows primary and non-primary site managers, plus ordering client contacts.

## Validation

- `npx tsc --noEmit`
- `npm run lint`

## Result

- TypeScript passed.
- Lint reported existing warnings only.
