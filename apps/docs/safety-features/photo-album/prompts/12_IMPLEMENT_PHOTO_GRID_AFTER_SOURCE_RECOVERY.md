# 12_IMPLEMENT_PHOTO_GRID_AFTER_SOURCE_RECOVERY

```text
너는 사진첩 UI를 실제 업무 기능으로 고도화하는 시니어 프론트엔드 엔지니어다.

목표:
Step 17 source recovery 이후 `PhotoAlbumPanel`을 실제 grid/list 사진 관리 화면으로 개선하라.

참조 문서:
- docs/safety-features/photo-album/specs/photo_grid_hardening.md
- docs/safety-features/photo-album/specs/visual_qa_after_recovery.md

대상 파일:
- apps/web/components/ErpPhotoAlbumScreen.tsx
- apps/web/features/photos/components/PhotoAlbumPanel.tsx
- apps/web/features/photos/components/PhotoAlbumPanel.module.css
- apps/web/types/photos.ts

요구사항:
1. grid/list view를 제공하라.
2. PhotoAlbumItem card에 thumbnail, 파일명, 현장, 사업장, 회차, 촬영일을 표시하라.
3. item 클릭 시 detail modal 또는 drawer를 열어라.
4. empty/loading/error state를 분리하라.
5. ERP AppShell 사진첩 패턴을 유지하라.
6. 웹하드 Drive shell로 바꾸지 마라.
```
