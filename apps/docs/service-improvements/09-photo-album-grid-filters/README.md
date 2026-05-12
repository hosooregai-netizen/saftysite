# Service Improvement 09: Photo Album Grid / Filters / Guest-Auth Adapter

## 목적

사진첩을 실제 현장 사진 관리 화면으로 고도화한다.

현재 사진첩은 “현장 사진 보관 및 조회” 기능이므로, 보고서 작성과 사업장/현장 기준정보에 연결되는 grid/list, filter, upload/download/delete UX가 필요하다.

## 적용 파일

```text
apps/web/types/photos.ts
apps/web/features/photos/components/PhotoAlbumPanel.tsx
apps/web/features/photos/components/PhotoAlbumPanel.module.css
```

## 핵심 개선

- Grid/List 보기 전환
- 사업장/현장/회차/출처/검색 필터
- URL 초기 headquarterId/siteId 반영
- guest/auth adapter shape 통일
- guest mode upload/download/delete/updateRounds 호환
- authenticated mode 기본 server adapter 추가
- 사진 상세 drawer
- 보고서 evidence linking CTA placeholder

## 적용 순서

```bash
unzip service_improvement_01_source_recovery_clean_build_overlay.zip
unzip service_improvement_09_photo_album_grid_filters_overlay.zip

rm -rf apps/web/.next
cd apps/web
npm run build
```
