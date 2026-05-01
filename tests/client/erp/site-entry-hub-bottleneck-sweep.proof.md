# Site Entry Hub Bottleneck Sweep Proof

Scope:
- Stabilizes the site-entry hub panel load effect so the assigned-site resolver does not trigger a render loop.
- Keeps loaded-but-empty report indexes from sorting a site above sites that actually have recent report data.
- Adds `npm run qa:bottleneck` for repeated screen smoke timing and optional live API probe timing.

Validation run:
- `npx tsx --test features/home/lib/buildHomeSiteSummaries.test.ts constants/inspectionSession/normalizeSite.test.ts features/mailbox/components/adminMailboxReportData.test.ts features/mailbox/components/mailboxReportPickerHelpers.test.ts hooks/inspectionSessions/assignedSafetySiteResolver.test.ts lib/safetyApi/assignedSites.test.ts`
- `npx tsc --noEmit --pretty false`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run test:client:smoke -- admin-headquarters admin-sites admin-control-center admin-schedules admin-users site-hub site-report-list mobile-site-reports mobile-site-home mobile-worker-nav auth`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run qa:bottleneck -- --features auth,site-hub --max-iterations 1 --duration-ms 1 --sleep-ms 0 --include-live-probe`

Long-running command:
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run qa:bottleneck -- --duration-ms 10800000 --sleep-ms 30000 --include-live-probe`

Live API probe notes:
- `--include-live-probe` runs `scripts/probeSafetyApiLive.ts` when `LIVE_SAFETY_EMAIL`, `LIVE_SAFETY_PASSWORD`, and `LIVE_SAFETY_SITE_ID` are present.
- Without those env vars, the sweep records a skipped API-probe row instead of failing the QA sweep.
