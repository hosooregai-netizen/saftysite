# 07_QA_REGRESSION

```text
너는 Next.js + FastAPI 기반 기술지도 ERP의 사업장/현장 기준정보 기능을 담당하는 시니어 풀스택 엔지니어다.

목표:
사업장/현장 기능의 build, route, CRUD, assignment, linked feature 회귀 테스트를 수행하라.

검증 명령:
rm -rf apps/web/.next
cd apps/web
npm run build

Route smoke:
- /headquarters
- /sites
- /headquarters?scope=assigned

기능 테스트:
1. 사업장 목록 조회
2. 사업장 생성/수정/비활성화
3. 현장 목록 조회
4. 현장 생성/수정/비활성화
5. 사용자 목록 조회
6. site assignment 생성/해제
7. headquarter assignment 생성/해제
8. assigned scope 필터
9. /reports/new에서 site 선택
10. /photo-album query link

보안 테스트:
- 다른 workspace headquarter 접근 차단
- 다른 workspace site 접근 차단
- 다른 workspace user assignment 차단
- client workspace_id 무시

완료 기준:
- build 성공
- route smoke 성공
- CRUD/assignment happy path 성공
- negative security test 성공
- docs/safety-features/headquarters-sites/specs/test_scenarios.md 업데이트
```
