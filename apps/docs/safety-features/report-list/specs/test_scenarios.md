# Test Scenarios: Report List

## Smoke

- [ ] `/reports` 진입
- [ ] 로딩 상태 표시
- [ ] loaded 상태 표시
- [ ] error 상태 표시

## Empty

- [ ] reports.length === 0
- [ ] empty state 문구 표시
- [ ] 새 보고서 작성 CTA 동작

## Row

- [ ] report row 표시
- [ ] 순번/지도일 표시
- [ ] siteName/customerName 표시
- [ ] status badge 표시
- [ ] review pending count 표시
- [ ] updated_at 표시
- [ ] finding count 표시
- [ ] export status 표시
- [ ] export count 표시

## Navigation

- [ ] row click → `/reports/{id}`
- [ ] generated snapshot 있음 → `/reports/{id}?entry=generated`
- [ ] 열기 button → 상세 이동
- [ ] 새로 작성 button → `/reports/new`

## Filter/sort

- [ ] 검색어 입력
- [ ] 검색 결과 없음
- [ ] status filter
- [ ] export filter
- [ ] sort by updated_at
- [ ] sort by visitDate

## Security

- [ ] workspace 밖 report 미노출
- [ ] workspace_id 조작 요청 차단
- [ ] anonymous/local session fallback 정상
