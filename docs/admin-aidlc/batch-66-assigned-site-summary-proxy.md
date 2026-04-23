# Batch 66: Assigned Site Summary Proxy

## Intent

- Treat `/assignments/me/sites` as a lightweight bootstrap contract and keep the admin-side safety proxy helpers aligned with that summary response.
- Preserve photo album access control by expanding summary rows into the minimal `SafetySite` placeholder shape on the Next server.

## Admin Contract Impact

- `server/admin/safetyApiServer.ts` now reads `/assignments/me/sites?active_only=true&limit=...` without legacy detail-expansion query flags.
- The server helper expands `SafetyAssignedSiteSummary` rows into placeholder `SafetySite` objects before applying existing lifecycle normalization.
- Admin photo-album reads can continue checking `id`, `headquarter_id`, `headquarter.name`, and `site_name` without requiring the full site directory payload.

## Deployment Notes

- No new environment variables are required.
- This change is coupled with the ERP client summary/detail split and should ship together with the updated backend contract.

## Verification

- `npx tsx --test server/admin/safetyApiServer.test.ts`
- `npx eslint server/admin/safetyApiServer.ts server/admin/safetyApiServer.test.ts`
