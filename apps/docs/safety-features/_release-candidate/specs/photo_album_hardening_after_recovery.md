# Photo Album Hardening After Recovery

## 목표

`PhotoAlbumPanel` fallback을 실제 사진첩 UX로 고도화한다.

## 우선 작업

1. 사업장/현장 filter를 실제 `SafetyHeadquarter`, `SafetySite` 데이터와 연결
2. guest adapter와 authenticated adapter의 response shape 통일
3. 사진 card에 preview/download/source metadata 표시
4. 업로드 CTA와 guest cache 저장 흐름 보강
5. 보고서 evidence linking 진입점 준비

## QA

- `/photo-album` guest state
- `/photo-album?headquarterId=&siteId=` filter state
- empty state
- photo card preview/download
