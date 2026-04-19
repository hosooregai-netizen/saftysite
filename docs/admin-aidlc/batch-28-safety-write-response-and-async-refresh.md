# Batch 28. Safety Write Response And Async Refresh

## Why
- headquarter and site writes could succeed upstream but still fail in the client when the success response body was empty
- the shared safety API clients treated `204` as the only empty-body success case and always attempted `response.json()` for `200/201`
- proxy writes also waited for best-effort admin snapshot warm-up before returning, which made successful create and update actions feel slow

## What changed
- `lib/safetyApi/client.ts` now tolerates successful empty JSON bodies and returns `undefined` instead of throwing `Unexpected end of JSON input`
- `server/admin/safetyApiServer.ts` matches that empty-body handling for server-side admin callers
- `app/api/safety/[...path]/route.ts` now launches admin analytics and schedule snapshot refresh in best-effort background work instead of blocking the write response
- added focused regression tests for empty-body success handling on both client and server request helpers

## Proof
- `lib/safetyApi/client.test.ts`
- `server/admin/safetyApiServer.test.ts`
- `tests/client/admin/admin-headquarters-write-response-regression.md`
