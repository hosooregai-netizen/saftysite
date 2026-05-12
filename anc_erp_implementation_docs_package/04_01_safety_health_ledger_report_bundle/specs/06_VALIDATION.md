# 06. Validation — 공사안전보건대장 이행확인 보고서 묶음

- `projectId`가 필요한 엔티티는 project scope를 가진다.
- 발주처별 데이터에는 `ownerPartyId`가 필요하다.
- 점검회차 데이터에는 `inspectionRoundId`가 필요하다.
- export는 readiness가 true일 때만 가능하다.
- AI 초안 상태는 제출/export blocker다.
- 제출된 파일은 삭제/교체할 수 없다.
- dashboard metric은 source entity drilldown을 가져야 한다.
