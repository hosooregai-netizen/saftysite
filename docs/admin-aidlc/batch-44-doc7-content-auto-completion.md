# Batch 44

## Summary
- wired uploaded `유해위험작업 안전대책` and `법령 참고자료` into technical guidance `Doc7`
- kept the upstream hazard-countermeasure recommendation UI and added shared auto-completion logic for web, mobile, and AI refill flows
- exposed `legalReferences` and `hazardCountermeasureCatalog` through inspection-session derived data so editor fields can auto-fill from content

## Changed Sources
- `features/admin/sections/content/lib/contentItems.ts`
- `lib/admin/adminShared.ts`
- `lib/safetyApiMappers/masterData.ts`
- `components/session/workspace/Doc7FindingCard.tsx`
- `features/inspection-session/workspace/sections/doc7/Doc7FindingFields.tsx`
- `features/mobile/inspection-session/MobileInspectionSessionStep7FindingCard.tsx`
- `features/mobile/inspection-session/useMobileInspectionAiActions.ts`
- `lib/doc7AutoCompletion.ts`

## Validation
- `npx tsc --noEmit --pretty false`
- `node --import tsx --test lib/doc7AutoCompletion.test.ts`

## Notes
- `DOC7 참고자료` 자동 매칭은 유지
- `재해유형`, `기인물`, `유해위험요인`, `개선요청사항` 변경 시 `관리대책`과 `관련 법령` 자동완성을 같이 시도
- 사용자가 직접 수정한 `관리대책`은 자동값으로 덮어쓰지 않도록 보호
