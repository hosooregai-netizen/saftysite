# Admin Content Paging And Delete Copy Proof

## Scenario
- open `/admin?section=content`
- create a `safety_news` content item and confirm the server write succeeds
- refresh the content section while the `안전 정보` filter is active

## Expected
- the newly created safety-news row still appears even when the active content library exceeds the first 1000 rows
- the content row action shows `삭제` instead of `비활성화`
- confirming the action removes the row from the active list, matching the deletion wording the user sees

## Linked implementation
- `lib/safetyApi/adminEndpoints.ts`
- `lib/safetyApi/endpoints.ts`
- `features/admin/sections/content/ContentItemsSection.tsx`
