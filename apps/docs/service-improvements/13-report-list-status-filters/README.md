# Service Improvement 13: Report List Status / Filter / Export History UX

## 목적

보고서 목록 화면을 단순 목록이 아니라 작성/검토/출력 상태를 빠르게 파악하는 관리 화면으로 개선한다.

## 적용 파일

```text
apps/web/components/ReportsOverview.tsx
```

## 핵심 개선

- 상태별 빠른 필터 추가
  - 전체
  - 사진 수집중
  - 생성중
  - 검토 필요
  - 검토 완료
  - 출력 완료
- 출력 상태 필터 추가
  - 미출력
  - PDF
  - HWPX
  - PDF/HWPX
- 검색어 controlled input 처리
- 정렬 옵션 추가
  - 최종수정순
  - 지도일 최신순
  - 지도일 오래된순
  - 검토대기 많은순
  - 출력 상태순
- export history summary 표시
- 같은 현장 새 보고서 작성 링크 추가
- 검색/필터 결과 없음 empty state 개선

## 적용 순서

```bash
unzip service_improvement_13_report_list_status_filters_overlay.zip
rm -rf apps/web/.next
cd apps/web
npm run build
```
