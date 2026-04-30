# Admin Common List State and CRUD Performance Proof

## Scope

- 관리자 사용자, 사업장/현장, 전체 보고서, 일정, 콘텐츠, 메일함, 사진첩 목록의 검색/필터/정렬/페이지 상태가 URL에 남는다.
- 사업장/현장 drilldown은 현재 목록 URL 상태를 보존한다.
- 사용자/현장/사업장 삭제는 전체 배정/현장 목록 조회 대신 필터 조회를 사용한다.
- 사업장/현장 무변경 저장은 PATCH 없이 닫힌다.

## Validation

- `npm run lint`
- `npm run build`
- `git diff --check`

## Notes

- `npm run lint`는 오류 없이 완료했고, 기존 이미지/unused 계열 경고만 남는다.
- `npm run build`는 TypeScript와 정적 페이지 생성을 포함해 완료했다.
