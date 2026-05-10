# Validation Spec: Photo Album

## Build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## Route smoke

- `/photo-album`
- `/photo-album?headquarterId=...`
- `/photo-album?headquarterId=...&siteId=...`

## 기능 검증

- [ ] 사진첩 진입
- [ ] 사업장/현장 목록 로드
- [ ] 사업장 필터
- [ ] 현장 필터
- [ ] 검색
- [ ] 업로드
- [ ] 다운로드
- [ ] 삭제
- [ ] 회차 수정
- [ ] pagination/offset
- [ ] guest cache upload
- [ ] guest cache delete

## 보안 검증

- [ ] workspace 밖 사진 조회 차단
- [ ] workspace 밖 사진 삭제 차단
- [ ] workspace 밖 site_id/headquarter_id로 사진 생성 차단
- [ ] data_url 과다 노출 방지

## UI 검증

- [ ] empty state가 명확하다.
- [ ] 비로그인 capability notice가 보인다.
- [ ] 모바일에서 grid/filter가 깨지지 않는다.
- [ ] 선택 toolbar가 명확하다.
