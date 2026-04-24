# Batch 71: Mail Recipient Suggestions Proxy

## Summary
- Added the missing Next API proxy for `GET /api/mail/recipient-suggestions`.
- The mailbox compose client already called this path, and the safety server already exposes `GET /mail/recipient-suggestions`.
- Without the proxy, focusing or typing in the compose recipient field produced repeated `404` responses even though the upstream feature existed.

## Files
- `app/api/mail/recipient-suggestions/route.ts`
- `server/admin/safetyApiServer.ts`
- `types/backend.ts`

## Verification
- `npx tsc --noEmit`

