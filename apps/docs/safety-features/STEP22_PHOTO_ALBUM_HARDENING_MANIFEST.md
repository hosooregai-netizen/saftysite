# Step 22 Manifest: Photo Album Hardening After Source Recovery

## 목적

Step 17 source recovery로 `PhotoAlbumPanel`과 `types/photos.ts`가 복구된 이후, 사진첩을 실제 업무 기능으로 고도화하기 위한 명세와 구현 프롬프트를 추가한다.

## 대상 흐름

```text
/photo-album
→ ErpPhotoAlbumScreen
→ PhotoAlbumPanel
→ guest/auth data adapter
→ site/headquarter filter
→ photo grid/list
→ upload/download/delete
→ report evidence linking
```

## 이번 단계 범위

- 사진 grid/list UI hardening
- 사업장/현장/검색/회차 필터 hardening
- guest mode와 authenticated mode adapter 계약 정리
- 사진 업로드/다운로드/삭제/회차 변경 UX 정리
- 보고서 evidence linking 진입점 설계
- route smoke와 visual QA 기준 추가
