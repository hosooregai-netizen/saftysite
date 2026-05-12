# Headquarters/Sites Hardening After Recovery

## 목표

사업장/현장 fallback components를 실제 ERP 기준정보 관리 UX로 고도화한다.

## 우선 작업

1. admin endpoints request/response shape 확인
2. `SafetyHeadquarter`, `SafetySite`, `Assignment` 타입 정교화
3. guest mode와 authenticated mode UI 차이 명확화
4. table/search/filter/pagination 동작 확인
5. `/reports/new`, `/photo-album`, `/sites`와 directory context 연결 확인

## QA

- `/headquarters` guest/login required state
- `/headquarters` authenticated list
- `/sites` assigned sites list
- 신규 사업장/현장 modal open/close
