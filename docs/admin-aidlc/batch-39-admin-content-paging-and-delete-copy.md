# Batch 39. Admin Content Paging And Delete Copy

## Why
- admin content bootstrap fetched only the first `limit=1000` rows and then filtered by content type on the client
- when active content rows exceeded 1000, trailing types such as `safety_news` could disappear from the admin list even after a successful create
- the content action used `비활성화` copy even though the user-facing flow behaves like deletion because rows disappear and no restore path is exposed

## What changed
- `lib/safetyApi/adminEndpoints.ts` now loads admin content rows across every page instead of assuming a single `limit=1000` fetch is complete
- `lib/safetyApi/endpoints.ts` now does the same for shared content master-data reads so safety-news consumers do not silently truncate later rows
- `features/admin/hooks/buildAdminDashboardContentActions.ts` applies create/update/delete responses back into local dashboard state immediately
- `lib/admin/adminShared.ts` keeps `legal_reference` visible in content CRUD type options
- `features/admin/sections/content/ContentItemsSection.tsx` now labels the destructive action as `삭제` and uses matching confirmation copy

## Proof
- `tests/client/admin/admin-content-paging-and-delete-copy.md`
- `tooling/internal/smokeClient_impl.ts`

## Validation
- `npx eslint lib/safetyApi/adminEndpoints.ts lib/safetyApi/endpoints.ts`
- `npx eslint features/admin/sections/content/ContentItemsSection.tsx tooling/internal/smokeClient_impl.ts`

## Residual
- the backend still performs a soft delete by setting `is_active=false`; only the admin UI copy changed to match user expectations
- if content volume keeps growing, the next step should be server-side content-type filtering for the admin section instead of always hydrating the whole library
