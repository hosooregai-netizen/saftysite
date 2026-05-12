# QA Checklist

## Build

- [ ] `rm -rf apps/web/.next`
- [ ] `cd apps/web && npm run build`

## Route smoke

- [ ] `/headquarters`
- [ ] `/sites`
- [ ] `/reports/new?headquarterId={id}&siteId={id}`
- [ ] `/photo-album?headquarterId={id}&siteId={id}`

## Functional

- [ ] 사업장 목록 표시
- [ ] 사업장 검색
- [ ] 사업장 추가 modal
- [ ] 현장 목록 표시
- [ ] 현장 filter chip
- [ ] 현장 추가 modal
- [ ] 현장 상세 quick actions
- [ ] 보고서 작성 링크
- [ ] 사진첩 링크
- [ ] 메일함 링크

## Visual

- [ ] ERP AppShell 기준정보 화면 유지
- [ ] 웹하드/메일함 full-screen layout과 혼동되지 않음
