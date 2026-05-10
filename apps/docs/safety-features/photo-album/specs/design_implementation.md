# Design Implementation Spec: Photo Album Design Implementation

## Layout Pattern

```text
ERP photo grid/list
```

## Target Routes

- /photo-album

## Design Goal

현장 사진 보관 및 조회 화면을 사업장/현장/회차/검색 필터와 grid/list/detail drawer 중심으로 개선한다.

## Implementation Requirements

1. Grid/List 보기 전환을 제공한다.
2. 사업장, 현장, 회차, 출처, 검색 필터를 제공한다.
3. 사진 card는 thumbnail, fileName, siteName, headquarterName, roundNo, capturedAt을 표시한다.
4. detail drawer는 미리보기, 메타데이터, 다운로드, 삭제, 보고서 연결 CTA를 제공한다.
5. guest/auth adapter 상태를 UI에서 구분한다.

## Non-regression

- 사진첩을 웹하드 Drive shell로 바꾸지 말 것
- 현장 context 없이 업로드 가능하게 만들지 말 것

## Target Files

- apps/web/components/ErpPhotoAlbumScreen.tsx
- apps/web/features/photos/components/PhotoAlbumPanel.tsx
- apps/web/features/photos/components/PhotoAlbumPanel.module.css
- apps/web/types/photos.ts

## QA

- clean build
- route smoke
- visual QA
- accessibility check
- feature-specific non-regression check
