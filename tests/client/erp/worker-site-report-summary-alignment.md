# ERP Proof Companion: Worker Site Report Summary Alignment

## Covered Source Areas

- `features/home/lib/buildHomeSiteSummaries.ts`
- `features/home/hooks/useHomeScreenState.ts`
- `features/home/components/AssignedSitesTableRow.tsx`
- `features/mobile/site-list/MobileSiteCard.tsx`

## Proof Notes

- worker site summaries now use the site report index as the authoritative source for persisted
  technical-guidance counts and latest report metadata
- worker web/mobile site lists no longer show fake `0건` values while report indexes are still
  unresolved; they render sync placeholders until the authoritative index is loaded
- worker home prefetch now hydrates all assigned site report indexes in the background instead of
  limiting the refresh to the first two sites

## Existing Smoke Coverage

- `tests/client/erp/site-report-list.spec.ts`
- `tests/client/erp/mobile-site-reports.spec.ts`
- `tests/client/erp/mobile-site-home.spec.ts`
