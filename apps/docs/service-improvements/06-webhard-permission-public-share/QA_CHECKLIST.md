# QA Checklist

## Build

- [ ] `rm -rf apps/web/.next`
- [ ] `cd apps/web && npm run build`
- [ ] `cd apps/api && python -m compileall app`

## Webhard route

- [ ] `/webhard` 진입
- [ ] Drive-like layout 유지
- [ ] ERP 카드형 웹하드로 회귀하지 않음
- [ ] 공유 dialog 열림
- [ ] 링크 공유 생성
- [ ] 링크 복사
- [ ] 링크 폐기

## Public share

- [ ] `/share/{validToken}` 진입
- [ ] 공유 루트 표시
- [ ] 하위 폴더 탐색
- [ ] 파일 미리보기/다운로드
- [ ] expired/revoked token 접근 차단
- [ ] root 밖 parent_id/item_id 접근 차단
- [ ] public breadcrumb가 workspace 내부 경로를 노출하지 않음
- [ ] public response가 headquarter_id/site_id를 노출하지 않음
