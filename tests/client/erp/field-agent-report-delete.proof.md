# Field Agent Report Delete Proof

## Scope

- Assigned field agents can archive reports for their current site.
- Admin/controller archive permissions remain account-wide.
- Read-only legacy/original PDF rows stay hidden from mobile delete actions.

## Verification

- `npx eslint hooks/useSiteOperationalReportMutations.ts lib/reportArchivePermissions.ts lib/reportArchivePermissions.test.ts hooks/inspectionSessions/autosave.ts features/site-reports/hooks/useSiteReportListState.ts features/site-reports/components/SiteQuarterlyReportsScreen.tsx features/mobile/quarterly-list/useMobileQuarterlyListScreenState.ts features/mobile/report-list/MobileReportCard.tsx`
- `npx tsx --test lib/reportArchivePermissions.test.ts`
- `npx tsx --test tests/client/erp/site-report-list.spec.ts tests/client/erp/mobile-site-reports.spec.ts`
- `npx tsx --test tests/client/erp/quarterly-report.spec.ts tests/client/erp/mobile-quarterly-report.spec.ts`
