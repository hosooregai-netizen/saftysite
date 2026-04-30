# ERP Common List URL State Proof

## Scope

- 작업자 현장 목록, 일정, 기술지도 보고서 목록, 분기 종합 보고서 목록, 모바일 현장/보고서/분기 목록의 검색/필터/정렬 상태가 URL에 남는다.
- 상세 화면 진입 후 브라우저 뒤로가기로 돌아오면 기존 목록 조건을 복원한다.
- 작업자 메일함과 사진첩도 검색/필터/페이지 위치를 URL 상태로 유지한다.

## Validation

- `npm run lint`
- `npm run build`
- `git diff --check`

## Notes

- 작업자 목록 진입 페이지는 URL query 사용에 맞춰 Suspense boundary를 추가했다.
- 서비스명과 주요 메뉴명은 `한국종합안전`, `사업장/현장`, `기술지도 보고서`, `분기 종합 보고서`, `현장 사진첩`, `불량사업장 신고` 기준으로 정리했다.
