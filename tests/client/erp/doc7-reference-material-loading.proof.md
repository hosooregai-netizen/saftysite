# DOC7 Reference Material Loading Proof

- Unit proof: `npx tsx lib/safetyApi/endpoints.test.ts`
- Static proof: `npx eslint lib/safetyApi/endpoints.ts lib/safetyApi/endpoints.test.ts hooks/inspectionSessions/useInspectionSessionStateHydration.ts features/inspection-session/workspace/sections/doc7/Doc7ReferenceMaterialPickerModal.tsx lib/safetyApi.ts`
- Picker UI proof: `npx eslint features/inspection-session/workspace/sections/doc7/Doc7ReferenceMaterialPickerModal.tsx`
- Type proof: `npx tsc --noEmit`

The inspection session master-data path now requests only content types needed by the technical-guidance workspace, including `doc7_reference_material`. The DOC7 reference picker renders results in small batches with lazy thumbnail loading after the first visible items, shows simple row numbers in the picker title only, and keeps its search/filter controls aligned with the shared `app-input`/`app-select` UI.
