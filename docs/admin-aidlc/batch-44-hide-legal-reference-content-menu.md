# Batch 44. Hide Legal Reference Content Menu

## Why
- `legal_reference` 콘텐츠는 내부 데이터와 문서 참조용으로는 유지해야 하지만, 관제 콘텐츠 CRUD 메뉴에서 직접 노출할 필요는 없어졌습니다.
- 기존 구현은 생성 타입 선택과 `전체 분류` 목록에 `법령 참고자료`를 그대로 보여줘 운영자가 일반 콘텐츠처럼 보게 만들었습니다.

## What changed
- `lib/admin/adminShared.ts` now excludes `legal_reference` from `CONTENT_CRUD_TYPE_OPTIONS`
- `features/admin/sections/content/ContentItemsSection.tsx` filters `legal_reference` rows out of the admin content list even when `전체 분류` is selected
- backend data handling and content-type mapping remain unchanged so existing legal-reference records are still stored and consumable by report flows

## Proof
- `tests/client/admin/admin-content-hide-legal-reference-menu.md`

## Validation
- `npx tsc --noEmit --pretty false`

## Residual
- existing `legal_reference` data remains in storage and can still be read by report logic
- this change only removes the content CRUD visibility in the admin UI
