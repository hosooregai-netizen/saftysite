# Admin Assigned Site Summary Proxy Proof

- scope: admin-side safety proxy helpers must consume the `/assignments/me/sites` summary contract without depending on heavy site-detail expansions
- contract proof: `npx tsx --test server/admin/safetyApiServer.test.ts`
- static proof: `npx eslint server/admin/safetyApiServer.ts server/admin/safetyApiServer.test.ts`
- behavior proof: `fetchAssignedSafetySitesServer()` requests `/assignments/me/sites?active_only=true&limit=200&offset=0` and expands the summary row into a placeholder `SafetySite` with the lifecycle-normalized fields used by photo album access checks
