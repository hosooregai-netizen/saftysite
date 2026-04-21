# Admin AIDLC Batch 50: DOC7 Manual Reference Picker And Template Output

## Scope

- `features/admin/sections/content/ContentItemsSection.tsx`
- `features/admin/sections/content/lib/contentItems.ts`
- `lib/admin/adminShared.ts`
- `features/inspection-session/workspace/sections/doc7/Doc7FindingFields.tsx`
- `features/mobile/inspection-session/MobileInspectionSessionStep7FindingCard.tsx`
- `server/documents/inspection/hwpx.ts`
- `server/documents/quarterly/hwpx.ts`
- `public/templates/inspection/기술지도 수동보고서 앱 - 서식_4.annotated.v9-2.hwpx`
- `public/templates/inspection/기술지도 수동보고서 앱 - 서식_4.annotated.v9-2-1.hwpx`

## Intent

- simplify admin `doc7_reference_material` CRUD down to the four stored fields used by the new manual selection flow
- remove DOC7 automatic reference matching in both desktop and mobile inspection sessions so workers keep manual control
- let workers choose a catalog item from a searchable picker, then carry both the selected image and body text through inspection HWPX output and the quarterly appendix reuse path

## Validation

- `node --import tsx --test server/documents/inspection/hwpx.test.ts server/documents/quarterly/hwpx.test.ts`
- `node --import tsx --test lib/doc7ReferenceMaterials.test.ts features/admin/sections/content/lib/contentItems.test.ts`
- `npx tsc --noEmit --pretty false`

## Notes

- the inspection template now treats the left DOC7 reference slot as image-only and the right slot as body-text-only
- quarterly appendix output inherits the same fix because it reuses the inspection appendix builder
- legacy `doc7_reference_material` items still load, but resaving them normalizes the stored body into the simplified schema
