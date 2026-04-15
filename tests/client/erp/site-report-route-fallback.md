## ERP Proof Note

- Scope: `features/site-reports/**`
- Intent: admin context에서도 현장/분기 보고서 목록과 분기 보고서 상세가 현장 정보를 보강해서 열리도록 정리
- Checks:
  - `npx eslint features/site-reports/hooks/useResolvedSiteRoute.ts features/site-reports/hooks/useSiteReportsScreen.ts features/site-reports/components/SiteReportsScreen.tsx features/site-reports/components/SiteQuarterlyReportsScreen.tsx features/site-reports/quarterly-report/useQuarterlyReportPageState.ts features/site-reports/quarterly-report/QuarterlyReportPageScreen.tsx`
