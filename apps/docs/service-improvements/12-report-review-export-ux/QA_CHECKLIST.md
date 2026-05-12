# QA Checklist

## Build

- [ ] `rm -rf apps/web/.next`
- [ ] `cd apps/web && npm run build`

## Route smoke

- [ ] `/reports/{reportId}`
- [ ] `/reports/{reportId}?entry=generated`

## Review/export UX

- [ ] 필수 검토 항목이 있으면 HWPX/PDF 버튼 disabled
- [ ] validation blocking issue가 있으면 HWPX/PDF 버튼 disabled
- [ ] 책임 확인 checkbox 미체크 시 HWPX/PDF 버튼 disabled
- [ ] 책임 확인 체크 후 조건 충족 시 버튼 enabled
- [ ] 검토 항목 열기 버튼이 review queue dialog를 연다
- [ ] 필수 항목 없이 download 우회 confirm이 뜨지 않는다
- [ ] export 실패 사유가 명확하게 표시된다
