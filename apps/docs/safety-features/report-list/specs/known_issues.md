# Known Issues: Report List

## 1. 검색 input이 실제 filter와 연결되지 않았을 수 있음

현재 목록 UI에 검색 input이 있으나, 실제 상태 관리와 filtering이 부족할 수 있다.

대응:

- `query` state 추가
- report row view model 기준 filtering
- 검색 결과 없음 empty state

## 2. 정렬 select가 실제 sort와 연결되지 않았을 수 있음

현재 `최종수정순` select가 표시되지만 추가 정렬 옵션과 동작이 부족할 수 있다.

대응:

- `sortKey` state 추가
- visitDate/status/export sort 추가
- URL query 동기화 검토

## 3. review queue schema 변화 위험

현재 `item.needsReview` 기반으로 검토 대기 수를 계산할 수 있다. review queue가 `resolved/severity` 중심으로 바뀌면 계산식을 변경해야 한다.

## 4. generated snapshot과 server report 병합

local/generated/server report가 함께 표시될 수 있다. 중복 제거와 stale snapshot 정리가 중요하다.

## 5. Pagination 부재

보고서 수가 많아지면 frontend filtering만으로는 부족하다. API pagination/filtering으로 확장해야 한다.

## 6. Admin/safety report endpoint와 기본 `/reports` endpoint의 목적 차이

`/api/v1/reports`, `/api/v1/safety/reports`, `/api/v1/admin/reports`는 목적과 response shape가 다를 수 있으므로 혼용하지 않는다.
