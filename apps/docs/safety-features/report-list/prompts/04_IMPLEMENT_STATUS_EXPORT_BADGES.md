# 04_IMPLEMENT_STATUS_EXPORT_BADGES

```text
너는 보고서 목록의 상태 badge와 출력 상태 표시를 개선하는 시니어 프론트엔드 엔지니어다.

목표:
보고서 row에서 진행 상태, 검토 대기 수, 출력 상태, 출력 횟수, local/generated snapshot 상태를 더 명확하게 표시하라.

참조 문서:
- docs/safety-features/report-list/specs/status_export.md
- docs/safety-features/report-list/specs/schema.md
- docs/safety-features/report-list/specs/ui_ux.md

대상 코드:
- apps/web/components/ReportsOverview.tsx

요구사항:
1. statusLabel/statusTone 계산을 별도 helper로 정리하라.
2. exportStatus 계산을 별도 helper로 정리하라.
3. 검토 대기 수가 0보다 크면 눈에 띄게 표시하라.
4. PDF/HWPX export 여부를 구분해 표시하라.
5. localOnly/generated snapshot report에는 작은 badge를 표시하라.
6. 상태 의미가 색상만으로 전달되지 않게 텍스트를 포함하라.
7. 기존 row layout을 지나치게 복잡하게 만들지 마라.

완료 기준:
- 상태/출력/검토 대기가 한눈에 보인다.
- generated/local report와 server report 구분이 가능하다.
```
