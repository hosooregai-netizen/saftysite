# Service Improvement 13 Prompt: Report List Status / Filter / Export History UX

```text
너는 ERP 보고서 목록 UX를 개선하는 시니어 프론트엔드 엔지니어다.

목표:
/reports 화면에서 작성/검토/출력 상태를 빠르게 파악하고 검색/필터/정렬할 수 있게 개선하라.

대상 파일:
- apps/web/components/ReportsOverview.tsx

요구사항:
1. 검색 input을 controlled state로 바꿔라.
2. 상태 필터를 추가하라.
   - 전체
   - 사진 수집중
   - 생성중
   - 검토 필요
   - 검토 완료
   - 출력 완료
3. 출력 상태 필터를 추가하라.
   - 전체
   - 미출력
   - PDF
   - HWPX
   - PDF/HWPX
4. 정렬 옵션을 추가하라.
   - 최종수정순
   - 지도일 최신순
   - 지도일 오래된순
   - 검토대기 많은순
   - 출력 상태순
5. export history summary를 row에 표시하라.
6. 같은 현장 새 보고서 작성 링크를 제공하라.
7. 검색/필터 결과 없음 empty state를 분리하라.
8. row keyboard navigation을 유지하라.
9. report-workspace, billing, auth 코드는 수정하지 마라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- /reports route smoke 통과
- 검색/필터/정렬 동작
- 출력 이력 표시
- empty state 명확화
```
