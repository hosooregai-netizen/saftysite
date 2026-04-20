# Admin Content Hide Legal Reference Menu

## Scope

- `법령 참고자료` is no longer shown in the admin content type filter or create-type selector
- existing `legal_reference` data stays stored and available to downstream report logic
- other content CRUD types remain visible and unchanged

## Verification

- `npx tsc --noEmit --pretty false`

## Manual Check

- open `/admin?section=content`
- confirm the content type filter does not list `법령 참고자료`
- open `콘텐츠 추가` and confirm the create type selector also omits `법령 참고자료`
