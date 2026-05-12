# 07_QA_REGRESSION: Photo Album

```text
너는 사진첩 기능의 QA와 회귀 테스트를 담당하는 시니어 QA 엔지니어다.

목표:
사진첩의 build, route, API, guest cache, UI 기능을 검증하라.

검증 명령:
rm -rf apps/web/.next
cd apps/web
npm run build

Route smoke:
- /photo-album
- /photo-album?headquarterId=test
- /photo-album?headquarterId=test&siteId=test

기능 테스트:
1. 사진첩 진입
2. 사업장/현장 필터
3. 검색
4. 업로드
5. 다운로드
6. 삭제
7. 회차 수정
8. guest cache 동작
9. server API 동작
10. 모바일 layout 확인

보안 테스트:
- workspace 밖 item 조회/삭제 차단
- workspace 밖 site_id/headquarter_id 생성 차단
- non-image/oversized upload 차단

완료 기준:
- build 성공
- route smoke 성공
- authenticated/guest happy path 성공
- negative test 성공
```
