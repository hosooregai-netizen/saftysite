# Inspection Doc10 Measurement Units Proof

- Master data merge proof: `npx tsx --test lib/safetyApiMappers/masterData.test.ts`
- HWPX output proof: `npx tsx --test server/documents/inspection/hwpx.test.ts`
- Type proof: `npx tsc --noEmit --pretty false`
