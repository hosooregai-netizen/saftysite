# Worker Schedule Report Sync Proof

- Unit proof: `node --import tsx --test lib/calendar/apiClient.test.ts features/calendar/components/workerCalendarReportMatching.test.ts features/schedule-report-sync/scheduleReportSync.test.ts`
- Loading proof: `node --import tsx --test lib/calendar/apiClient.test.ts features/calendar/components/workerCalendarLoading.test.ts features/calendar/components/workerCalendarReportMatching.test.ts app/api/me/schedules/route.test.ts`
- Type proof: `npx tsc --noEmit --pretty false`
- Static proof: `npm run lint -w @saftysite/web`
- Smoke proof: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run test:client:smoke -- worker-calendar mobile-worker-nav`
- Browser QA: worker calendar `기술지도 실시` opened the selected existing schedule and did not call `/api/me/schedules/next` after the existing unplanned schedule fix.
- API observation: remote API saved draft reports with `schedule_id`; backend projection needs the paired server deployment before `linked_report_key` is reflected for draft schedules.
- Refresh contract: worker schedule display now treats `/api/me/schedules` rows as authoritative, pages through all schedule rows, and blocks stale cached report index items unless they were fetched during the current calendar load.
- Manual edit regression: schedule/report link persistence now keeps the saved schedule row's `plannedDate` and `actualVisitDate` authoritative, so an older linked report visit date cannot issue a second schedule PATCH that moves the chip back.
- Schedule-save contract: saving a worker visit schedule now saves the schedule only; technical guidance draft creation/linking is reserved for the desktop `기술지도 실시` action.
- State color contract: worker calendar chips use the shared admin schedule display phase helper, so draft-only links render as in-progress and only submitted/published report fallback rows become completed.
- Mobile stale-link repair: mobile schedule save now verifies a schedule's `linkedReportKey` against the fresh report index/session payload before trusting it, and creates a replacement draft when the stored link points at no report.
- Dialog error placement: worker schedule save/register/edit validation messages are rendered at the bottom of the active schedule modal instead of the page-level error slot, while calendar load and background cleanup errors remain page-scoped.
- Patch contract: worker schedule PATCH clients no longer send `actual_visit_date`; the server-owned completion projection remains driven by submitted/published reports.
- Loading contract: duplicate worker schedule GETs are deduped while in flight, and desktop/mobile calendars render from fresh DB schedule rows before background report-index refresh work.
- Performance observation: live QA against `http://127.0.0.1:3100` observed one `/api/me/schedules` call per worker calendar load, with first visible schedule rows at about 1.6s to 1.8s on desktop/mobile.
