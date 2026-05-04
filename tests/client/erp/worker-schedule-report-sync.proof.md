# Worker Schedule Report Sync Proof

- Unit proof: `node --import tsx --test lib/calendar/apiClient.test.ts features/calendar/components/workerCalendarReportMatching.test.ts features/schedule-report-sync/scheduleReportSync.test.ts`
- Static proof: `npm run lint -w @saftysite/web`
- Browser QA: worker calendar `기술지도 실시` opened the selected existing schedule and did not call `/api/me/schedules/next` after the existing unplanned schedule fix.
- API observation: remote API saved draft reports with `schedule_id`; backend projection needs the paired server deployment before `linked_report_key` is reflected for draft schedules.

