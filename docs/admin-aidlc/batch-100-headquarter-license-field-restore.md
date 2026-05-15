# Admin AIDLC Batch 100: Headquarter License Field Restore

## Scope

- `features/admin/sections/headquarters/HeadquarterEditorModal.tsx`
- `features/admin/sections/sites/SiteEditorModal.tsx`
- `apps/web/components/HeadquartersHubScreen.tsx`

## Change

- Restored the headquarter construction license/registration number input in the admin headquarter create/edit modal.
- Restored the same license input in the inline headquarter creation form used while creating a site.
- Included `license_no` in the workspace headquarter search haystack so stored license numbers are discoverable.

## Validation

- `npm run lint -w @saftysite/web`
