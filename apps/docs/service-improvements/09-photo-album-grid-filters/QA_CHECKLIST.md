# QA Checklist

## Build

- [ ] `rm -rf apps/web/.next`
- [ ] `cd apps/web && npm run build`

## Route smoke

- [ ] `/photo-album`
- [ ] `/photo-album?headquarterId={id}`
- [ ] `/photo-album?headquarterId={id}&siteId={id}`

## 기능

- [ ] 사업장 필터
- [ ] 현장 필터
- [ ] 회차 필터
- [ ] 출처 필터
- [ ] 검색 필터
- [ ] Grid/List 전환
- [ ] 사진 업로드
- [ ] 사진 다운로드
- [ ] 사진 삭제
- [ ] 회차 변경
- [ ] 상세 drawer
- [ ] 보고서 연결 CTA

## Non-regression

- [ ] ERP AppShell 안의 사진첩 화면 유지
- [ ] 웹하드 Drive shell로 바뀌지 않음
- [ ] 메일함 three-pane과 혼동되지 않음
