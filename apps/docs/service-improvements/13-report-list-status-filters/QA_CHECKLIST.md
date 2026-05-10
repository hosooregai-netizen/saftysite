# QA Checklist

## Build

- [ ] `rm -rf apps/web/.next`
- [ ] `cd apps/web && npm run build`

## Route

- [ ] `/reports` 진입
- [ ] 보고서가 없을 때 empty state 표시
- [ ] 보고서가 있을 때 list row 표시

## Filters

- [ ] 상태 필터 전체/사진 수집중/생성중/검토 필요/검토 완료/출력 완료
- [ ] 출력 필터 미출력/PDF/HWPX/PDF+HWPX
- [ ] 필터 초기화

## Search / Sort

- [ ] 현장명 검색
- [ ] 사업장명 검색
- [ ] 작성자 검색
- [ ] 지도일 검색
- [ ] 최종수정순 정렬
- [ ] 지도일 최신/오래된순 정렬
- [ ] 검토대기 많은순 정렬

## Row actions

- [ ] 열기 버튼
- [ ] row keyboard Enter/Space 이동
- [ ] 같은 현장 새 작성 링크
- [ ] export history summary 표시
