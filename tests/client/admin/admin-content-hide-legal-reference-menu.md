# Admin Content Hide Legal Reference Menu

## Scope

- only day-to-day content CRUD types through `유해위험작업 안전대책` stay visible in the admin content type filter and create-type selector
- `법령 참고자료`, `시정 결과 옵션`, `TBM 템플릿`, `공지 템플릿`, `교육 템플릿`, `AI 프롬프트`, `보호구 카탈로그`, and `직종 목록` are no longer shown in the admin content type filter or create-type selector
- existing `legal_reference` data stays stored and available to downstream report logic
- the active day-to-day content CRUD types remain visible and unchanged

## Verification

- `npx tsc --noEmit --pretty false`

## Manual Check

- open `/admin?section=content`
- confirm the content type filter ends at `유해위험작업 안전대책`
- confirm the content type filter does not list `법령 참고자료`, `시정 결과 옵션`, `TBM 템플릿`, `공지 템플릿`, `교육 템플릿`, `AI 프롬프트`, `보호구 카탈로그`, or `직종 목록`
- open `콘텐츠 추가` and confirm the create type selector matches the same visible set
