# Admin AIDLC Batch 25: Photo Groups, Pause Start Date, And Contract Windows

## Goal

Finish the three remaining ERP meeting items that were still missing after the first pass:

- group photo albums by `현장 > 회차`
- track `중지 시작일` for paused sites
- remove the old `15일 고정` schedule interpretation while keeping round-based scheduling

## Scope

- `features/photos/components/PhotoAlbumPanel.tsx`
- `features/photos/components/PhotoAlbumPanel.module.css`
- `features/admin/sections/sites/SiteEditorModal.tsx`
- `features/admin/sections/sites/SitesTable.tsx`
- `features/admin/sections/sites/siteSectionHelpers.ts`
- `features/admin/sections/sites/useSitesSectionState.ts`
- `features/admin/sections/schedules/SchedulesSection.tsx`
- `server/admin/automation.ts`
- `types/backend.ts`
- `types/controller.ts`
- `docs/reverse-specs/*.md`

## Implementation Record

### Expected outputs

- Admin, worker, and mobile photo album screens should show the same grouped `site > round` shape.
- Site create/update flows should preserve `pause_start_date` only while the site is paused.
- Schedule wording and generated windows should follow contract-period rules instead of 15-day slots.

### Actual results

- Shared `PhotoAlbumPanel` now renders grouped site sections with nested round sections and keeps upload/export round metadata aligned with the same contract.
- Site forms send and receive `pause_start_date`, expose it in the editor, and surface it in the table/export flow.
- Admin schedule guidance now explains that rounds stay distinct while visit dates are freely chosen inside the contract window.
- Reverse specs now describe the new photo grouping, pause-start-date, and contract-window semantics so future recovery work preserves them.

## Validation

- `npx tsc --noEmit --pretty false`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3211 npm run test:client:smoke -- admin-schedules`

## Notes

- Embedded photo pickers remain flat on purpose because they are selection modals, not the main album display surface.
- Contract windows still use `windowStart/windowEnd`; only the meaning changed from fixed 15-day slots to contract-period bounds.
