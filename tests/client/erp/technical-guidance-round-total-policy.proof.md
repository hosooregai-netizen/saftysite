# Technical Guidance Round Total Policy Proof

- Unit proof: `node --import tsx --test lib/safetyApiMappers/reportsPayload.test.ts`
- Schedule sync proof: `node --import tsx --test features/schedule-report-sync/scheduleReportSync.test.ts`
- Document export proof: `npx tsx server/documents/inspection/hwpx.test.ts`
- UI proof: local worker session check confirmed the document 2 round fields render as read-only inputs.
- Contract note: technical guidance visit rounds come from the schedule/report creation flow, while total rounds come from the site contract total across list rows, session hydration, save payloads, and document cache keys.
- Regression note: stale local `visitCount`/`totalVisitCount` values are ignored by editor helpers and save payload builders.
