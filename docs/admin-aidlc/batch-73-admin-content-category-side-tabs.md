# Batch 73: Admin Content Category Side Tabs

## Intent

- Add content category subtabs to the admin sidebar when the content section is active.
- Keep the existing content category select and sidebar subtabs synchronized through the `contentType` URL query.
- Preserve the existing content list filtering, paging, and creation behavior while making category navigation available from the sidebar.

## Admin Contract Impact

- `/admin?section=content` continues to show all supported content CRUD categories.
- `/admin?section=content&contentType=<type>` selects the matching sidebar subtab and applies the same list filter as the existing header select.
- Invalid or missing `contentType` values fall back to `all`.

## Verification

- `npx tsc --noEmit`
- `npx eslint components/admin/AdminMenu.tsx features/admin/components/AdminDashboardScreen.tsx features/admin/components/AdminDashboardSectionContent.tsx features/admin/sections/content/ContentItemsSection.tsx`
- `Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:3100/admin?section=content&contentType=measurement_template'`
