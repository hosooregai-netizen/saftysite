# Photo Album QA After Hardening

## Build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## Route smoke

```text
/photo-album
/photo-album?headquarterId={id}
/photo-album?headquarterId={id}&siteId={id}
```

## Functional QA

- [ ] guest mode에서 사진첩 진입
- [ ] guest directory 기반 사업장/현장 필터 표시
- [ ] guest 사진 업로드
- [ ] guest 사진 다운로드
- [ ] guest 사진 삭제
- [ ] authenticated mode에서 사업장/현장 로드
- [ ] 필터 변경 시 URL query 반영
- [ ] 검색 결과 없음 state
- [ ] 전체 사진 없음 state
- [ ] detail panel/modal
- [ ] 보고서 evidence linking CTA 표시
