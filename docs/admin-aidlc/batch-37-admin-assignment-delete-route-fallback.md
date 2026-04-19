# Batch 37

## What changed
- 관제 사용자 삭제, 현장 삭제, 사업장 삭제, 지도요원 배정 해제 시 `/api/safety/assignments` 직접 조회 대신 `/api/admin/directory/assignments`를 사용하도록 바꿨다.
- Next admin route가 안전 API의 `/assignments` 목록을 서버 측에서 프록시한다.
- admin smoke에 사용자 삭제 경로를 추가하고, admin assignment directory route를 fixture에 반영했다.

## Why
- 로컬/관제 삭제 흐름에서 `GET /api/safety/assignments?...`가 404로 깨지는 사례가 있어 삭제 동선이 실패했다.
- 관제 CRUD는 safety proxy의 broad dynamic path보다 admin 전용 route를 쓰는 편이 더 안정적이다.

## Proof
- `npx tsc --noEmit --pretty false`
- `npm run test:client:smoke -- admin-users admin-sites admin-headquarters`
