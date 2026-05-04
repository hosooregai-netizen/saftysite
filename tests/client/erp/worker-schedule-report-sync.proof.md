# Worker Schedule Report Sync Proof

- Unit proof: `node --import tsx --test lib/calendar/apiClient.test.ts features/calendar/components/workerCalendarReportMatching.test.ts features/schedule-report-sync/scheduleReportSync.test.ts`
- Loading proof: `node --import tsx --test lib/calendar/apiClient.test.ts features/calendar/components/workerCalendarLoading.test.ts features/calendar/components/workerCalendarReportMatching.test.ts app/api/me/schedules/route.test.ts`
- Type proof: `npx tsc --noEmit --pretty false`
- Static proof: `npm run lint -w @saftysite/web`
- Browser QA: worker calendar `기술지도 실시` opened the selected existing schedule and did not call `/api/me/schedules/next` after the existing unplanned schedule fix.
- API observation: remote API saved draft reports with `schedule_id`; backend projection needs the paired server deployment before `linked_report_key` is reflected for draft schedules.
- Refresh contract: worker schedule display now treats `/api/me/schedules` rows as authoritative, pages through all schedule rows, and blocks stale cached report index items unless they were fetched during the current calendar load.
