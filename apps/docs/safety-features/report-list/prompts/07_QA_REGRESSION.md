# 07_QA_REGRESSION: Report List

```text
너는 보고서 목록 기능의 QA와 회귀 테스트를 담당하는 시니어 QA 엔지니어다.

목표:
보고서 목록의 loading, empty, row, 검색, 정렬, 필터, navigation, 권한 검사를 검증하라.

검증 명령:
rm -rf apps/web/.next
cd apps/web
npm run build

Route smoke:
- /reports
- /reports/new
- /reports/{knownReportId}

테스트:
1. 보고서 없음 empty state
2. 보고서 1개 row
3. 보고서 여러 개 정렬
4. 현장명 검색
5. 사업장명 검색
6. 작성자 검색
7. 지도일 검색
8. 검토 필요 필터
9. 출력 완료 필터
10. 미출력 필터
11. row click
12. keyboard Enter/Space
13. generated snapshot href
14. workspace 권한 차단

완료 기준:
- build 성공
- route smoke 성공
- 검색/필터/정렬 동작
- row navigation 동작
- 권한 없는 report 미노출
```
