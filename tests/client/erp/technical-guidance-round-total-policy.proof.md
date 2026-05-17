# Technical Guidance Round Total Policy Proof

- Unit proof: `npx tsx lib/safetyApiMappers/reportsPayload.test.ts`
- Document export proof: `npx tsx server/documents/inspection/hwpx.test.ts`
- UI proof: local worker session check confirmed the document 2 round fields render as read-only inputs.
- Contract note: technical guidance visit rounds come from the report round, while total rounds come from the site contract total across list rows, session hydration, save payloads, and document cache keys.
