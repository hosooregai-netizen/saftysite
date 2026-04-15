# Batch 13: Admin Report Open And List Typography

## Summary

- 관리자 보고서 목록의 `열기` 액션이 행 클릭과 같은 보호 로직을 타도록 맞췄다.
- 사업장/현장 리스트 타이포를 메인 대시보드 표 밀도에 가깝게 조정했다.

## Changed Files

- `features/admin/sections/reports/ReportsTable.tsx`
- `features/admin/sections/AdminSectionShared.module.css`

## Validation

- `npx eslint features/admin/sections/reports/ReportsTable.tsx`
- 스타일 변경은 CSS 레벨 조정으로 런타임 로직 영향 없음
