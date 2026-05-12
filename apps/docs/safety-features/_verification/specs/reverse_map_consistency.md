# Reverse Map Consistency

## 검증 기준

각 기능의 `specs/reverse_map.md`는 아래 항목을 실제 코드와 일치시켜야 한다.

```text
Feature
→ Route
→ Frontend component
→ Frontend API client
→ Backend endpoint/service
→ Schema/model
→ Prompt
→ QA scenario
```

## 검증 방법

1. `actual_route_inventory.md`에서 route 확인
2. `actual_api_inventory.md`에서 endpoint 확인
3. `code_inventory_audit.md`에서 source file 존재 여부 확인
4. 기능별 `reverse_map.md`와 비교
5. 불일치 항목은 `docs_to_code_gap_report.md`에 추가

## 우선 검증 대상

- mailbox
- photo-album
- headquarters-sites
- webhard public share
- report export billing
